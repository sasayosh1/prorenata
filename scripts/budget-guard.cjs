#!/usr/bin/env node

/**
 * Gemini API Budget Guard
 *
 * - Saves monthly usage to `.budget/gemini-usage.json`
 * - Auto-resets when month changes (UTC)
 * - If budget exceeded: creates a GitHub Issue and exits 0 (non-failing)
 *
 * Usage:
 *   node scripts/budget-guard.cjs
 *   node scripts/budget-guard.cjs --reserve-jpy 1.2
 *   node scripts/budget-guard.cjs --reserve-articles 1
 *
 * Env:
 *   GEMINI_BUDGET_JPY=100
 *   GEMINI_ESTIMATED_COST_JPY_PER_ARTICLE=0.2
 *   GITHUB_TOKEN=...
 *   GITHUB_REPOSITORY=owner/repo
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    reserveJpy: null,
    reserveArticles: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--reserve-jpy') {
      const next = argv[i + 1];
      if (!next) throw new Error('--reserve-jpy requires a number');
      args.reserveJpy = Number(next);
      i++;
      continue;
    }
    if (value === '--reserve-articles') {
      const next = argv[i + 1];
      if (!next) throw new Error('--reserve-articles requires a number');
      args.reserveArticles = Number(next);
      i++;
      continue;
    }
  }

  return args;
}

function getCurrentMonthUtc() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function roundJpy(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function appendGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  fs.appendFileSync(outputPath, `${key}=${String(value)}\n`, 'utf8');
}

async function githubRequest(method, url, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required to create issues');

  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      'user-agent': 'prorenata-budget-guard',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = json?.message || text || `HTTP ${response.status}`;
    throw new Error(`GitHub API error: ${message}`);
  }
  return json;
}

async function ensureIssue({ title, body, labels }) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is required to create issues');
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error(`Invalid GITHUB_REPOSITORY: ${repo}`);

  const listUrl = `https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=100`;
  const issues = await githubRequest('GET', listUrl);
  const exists = issues.some((issue) => issue?.title === title);
  if (exists) return;

  const createUrl = `https://api.github.com/repos/${owner}/${name}/issues`;
  await githubRequest('POST', createUrl, { title, body, labels });
}

function getCurrentDateUtc() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function main() {
  const args = parseArgs(process.argv);

  const budgetMonthJpy = Number(process.env.GEMINI_BUDGET_JPY || '100');
  const budgetDailyJpy = Number(process.env.GEMINI_DAILY_BUDGET_JPY || '20');

  const month = getCurrentMonthUtc();
  const date = getCurrentDateUtc();
  const stateDir = path.join(process.cwd(), '.budget');
  const statePath = path.join(stateDir, 'gemini-usage.json');

  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });

  let state = {
    month,
    spentJpy: 0,
    daily: {}, // { "YYYY-MM-DD": spent }
    updatedAt: new Date().toISOString(),
    history: [],
  };

  if (fs.existsSync(statePath)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (loaded && typeof loaded === 'object') {
        state = { ...state, ...loaded };
      }
    } catch {
      // ignore
    }
  }

  // Reset monthly if needed
  if (state.month !== month) {
    state.month = month;
    state.spentJpy = 0;
    state.daily = {};
  }

  // Ensure daily structure exists
  state.daily = state.daily || {};
  const spentToday = state.daily[date] || 0;

  const estimatedPerArticleJpy = Number(process.env.GEMINI_ESTIMATED_COST_JPY_PER_ARTICLE || '0.2');
  let reserveJpy = 0;
  if (args.reserveJpy != null) {
    reserveJpy = Number(args.reserveJpy);
  } else if (args.reserveArticles != null) {
    reserveJpy = Number(args.reserveArticles) * estimatedPerArticleJpy;
  }
  reserveJpy = roundJpy(reserveJpy);

  const projectedMonth = roundJpy(Number(state.spentJpy || 0) + reserveJpy);
  const projectedDaily = roundJpy(spentToday + reserveJpy);

  const context = {
    month,
    date,
    budgetMonthJpy: roundJpy(budgetMonthJpy),
    spentMonthJpy: roundJpy(Number(state.spentJpy || 0)),
    budgetDailyJpy: roundJpy(budgetDailyJpy),
    spentDailyJpy: roundJpy(spentToday),
    reserveJpy,
    projectedMonthJpy: projectedMonth,
    projectedDailyJpy: projectedDaily,
  };

  // Block if EITHER limit is hit
  let blockReason = null;
  if (projectedMonth > budgetMonthJpy) blockReason = 'MONTHLY_LIMIT';
  if (projectedDaily > budgetDailyJpy) blockReason = 'DAILY_LIMIT';

  if (blockReason) {
    const title = `💸 Gemini budget exceeded (${blockReason === 'DAILY_LIMIT' ? date : month})`;
    const body = [
      '## Gemini Budget Guard',
      '',
      `- Type: \`${blockReason}\``,
      `- Month (UTC): \`${context.month}\``,
      `- Date (UTC): \`${context.date}\``,
      `- Monthly Budget: \`${context.budgetMonthJpy} JPY\``,
      `- Monthly Spent: \`${context.spentMonthJpy} JPY\``,
      `- Daily Budget: \`${context.budgetDailyJpy} JPY\``,
      `- Daily Spent: \`${context.spentDailyJpy} JPY\``,
      `- This run reserve: \`${context.reserveJpy} JPY\``,
      '',
      '### Action',
      '- This run will skip Gemini execution to keep costs under the target.',
      `- Reason: ${blockReason}`,
      '',
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await ensureIssue({ title, body, labels: ['automated', 'budget'] });
    } catch (error) {
      console.warn('⚠️ Failed to create issue:', error?.message || error);
    }

    appendGithubOutput('allowed', 'false');
    appendGithubOutput('reason', blockReason);
    console.log(`allowed=false reason=${blockReason}`);
    process.exit(0);
  }

  if (reserveJpy > 0) {
    state.spentJpy = projectedMonth;
    state.daily[date] = projectedDaily;
    state.updatedAt = new Date().toISOString();
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.push({
      at: state.updatedAt,
      addJpy: reserveJpy,
      spentMonthJpy: state.spentJpy,
      spentDailyJpy: state.daily[date],
      note: args.reserveArticles != null ? `reserve-articles:${args.reserveArticles}` : 'reserve-jpy',
    });
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');

  console.log('✅ Budget guard OK');
  console.log(`- Monthly: ${context.spentMonthJpy} / ${context.budgetMonthJpy} JPY`);
  console.log(`- Daily: ${context.spentDailyJpy} / ${context.budgetDailyJpy} JPY`);
  console.log(`- Reserve: ${context.reserveJpy} JPY`);

  appendGithubOutput('allowed', 'true');
  appendGithubOutput('spent_month_jpy', roundJpy(state.spentJpy));
  appendGithubOutput('spent_daily_jpy', roundJpy(state.daily[date]));
  console.log('allowed=true');
}

main().catch((error) => {
  console.error('❌ budget-guard failed:', error?.message || error);
  try {
    const month = getCurrentMonthUtc();
    const title = `💸 Gemini budget-guard failed (${month})`;
    const body = [
      '## Gemini Budget Guard',
      '',
      'Budget guard failed before completing checks (configuration or runtime error).',
      '',
      `- Month (UTC): \`${month}\``,
      '',
      '### Error',
      '```',
      String(error?.message || error),
      '```',
      '',
      '### Action',
      '- Fix the budget guard script/config.',
      '- Gemini execution is skipped until this is resolved (to prevent unexpected costs).',
      '',
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    ensureIssue({ title, body, labels: ['automated', 'budget'] }).catch(() => { });
  } catch {
    // ignore
  }

  // Fail-safe: do not fail the workflow, but block Gemini to prevent unexpected costs.
  appendGithubOutput('allowed', 'false');
  process.exit(0);
});
