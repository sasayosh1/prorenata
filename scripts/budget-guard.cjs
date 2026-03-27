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
 *   GEMINI_DAILY_BUDGET_JPY=20
 *   GEMINI_ESTIMATED_COST_JPY_PER_ARTICLE=0.2
 *   CLAUDE_ESTIMATED_COST_JPY=1.0
 *   OPENAI_ESTIMATED_COST_JPY=0.1
 *   CODEX_ESTIMATED_COST_JPY=0.5
 *   GITHUB_TOKEN=...
 *   GITHUB_REPOSITORY=owner/repo
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    reserveJpy: null,
    reserveArticles: null,
    model: 'claude',
    audit: false,
    build: false,
    cli: false,
    checkOnly: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--check-only') {
      args.checkOnly = true;
      continue;
    }
    if (value === '--model') {
      const next = argv[i + 1];
      if (!next) throw new Error('--model requires a name');
      args.model = next;
      i++;
      continue;
    }
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
    if (value === '--audit') {
      args.audit = true;
      continue;
    }
    if (value === '--build') {
      args.build = true;
      continue;
    }
    if (value === '--cli') {
      args.cli = true;
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
  const oldStatePath = path.join(stateDir, 'gemini-usage.json');
  const statePath = path.join(stateDir, 'ai-usage.json');

  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });

  let state = {
    month,
    spentJpy: 0,
    byModel: {}, // { "gemini": 0.2, "claude": 1.0 }
    daily: {}, // { "YYYY-MM-DD": { total: 0, gemini: 0 } }
    updatedAt: new Date().toISOString(),
    history: [],
  };

  // Migration from old gemini-usage.json
  if (!fs.existsSync(statePath) && fs.existsSync(oldStatePath)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(oldStatePath, 'utf8'));
      state.month = loaded.month || month;
      state.spentJpy = loaded.spentJpy || 0;
      state.byModel = { gemini: state.spentJpy };
      // Convert daily structure if needed
      if (loaded.daily) {
        for (const [d, v] of Object.entries(loaded.daily)) {
          state.daily[d] = typeof v === 'number' ? { total: v, gemini: v } : v;
        }
      }
      state.history = loaded.history || [];
      console.log(`📦 Migrated from ${oldStatePath} to ${statePath}`);
    } catch (e) {
      console.warn(`⚠️ Migration failed: ${e.message}`);
    }
  }

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
    state.byModel = {};
    state.daily = {};
  }

  // Ensure structures exist
  state.byModel = state.byModel || {};
  state.daily = state.daily || {};
  if (!state.daily[date]) state.daily[date] = { total: 0 };
  const spentToday = state.daily[date].total || 0;

  const estimatedPerArticleJpy = Number(process.env.GEMINI_ESTIMATED_COST_JPY_PER_ARTICLE || '0.2');
  const estimatedClaudeJpy = Number(process.env.CLAUDE_ESTIMATED_COST_JPY || '8.0');
  const estimatedOpenAIJpy = Number(process.env.OPENAI_ESTIMATED_COST_JPY || '0.1');
  const estimatedCodexJpy = Number(process.env.CODEX_ESTIMATED_COST_JPY || '0.5');

  let reserveJpy = 0;
  let note = args.model !== 'gemini' ? `${args.model}-reserve` : 'reserve-jpy';

  if (args.reserveJpy != null) {
    reserveJpy = Number(args.reserveJpy);
  } else if (args.reserveArticles != null) {
    reserveJpy = Number(args.reserveArticles) * estimatedPerArticleJpy;
    note = `reserve-articles:${args.reserveArticles}`;
  } else if (args.audit) {
    reserveJpy = estimatedClaudeJpy;
    note = 'claude-audit';
    args.model = 'claude';
  } else if (args.build) {
    reserveJpy = estimatedCodexJpy;
    note = 'codex-build';
    args.model = 'codex';
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

  const SAFETY_THRESHOLD = 0.95; // 95% safety line

  // Block if EITHER limit is hit
  let blockReason = null;
  if (projectedMonth > budgetMonthJpy) blockReason = 'MONTHLY_LIMIT';
  if (projectedDaily > budgetDailyJpy) blockReason = 'DAILY_LIMIT';

  // Even if not hit, check if we are dangerously close (for watchdog)
  if (!blockReason && args.checkOnly) {
    if (context.spentMonthJpy >= budgetMonthJpy * SAFETY_THRESHOLD) blockReason = 'MONTHLY_NEAR_LIMIT';
    if (context.spentDailyJpy >= budgetDailyJpy * SAFETY_THRESHOLD) blockReason = 'DAILY_NEAR_LIMIT';
  }

  if (blockReason) {
    if (args.checkOnly) {
      console.log(`❌ budget-check failed: ${blockReason}`);
      process.exit(1);
    }
    const title = `💸 AI Budget Limit Exceeded (${blockReason === 'DAILY_LIMIT' ? date : month})`;
    const body = [
      '## AI Budget Guard',
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
      '- This run will skip AI execution to keep costs under the target.',
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
    // Always exit 0 in GitHub Actions to avoid "failed" status on budget hit
    process.exit(0);
  }

  if (args.checkOnly) {
    console.log('✅ Budget check OK (check-only)');
    process.exit(0);
  }

  if (reserveJpy > 0) {
    state.spentJpy = projectedMonth;
    state.daily[date].total = projectedDaily;
    
    // Model specific tracking
    const model = args.model || 'gemini';
    state.byModel[model] = roundJpy((state.byModel[model] || 0) + reserveJpy);
    state.daily[date][model] = roundJpy((state.daily[date][model] || 0) + reserveJpy);

    state.updatedAt = new Date().toISOString();
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.push({
      at: state.updatedAt,
      model,
      addJpy: reserveJpy,
      spentMonthJpy: state.spentJpy,
      spentDailyJpy: state.daily[date].total,
      note,
    });
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');

  console.log('✅ Budget guard OK');
  console.log(`- Monthly: ${context.spentMonthJpy} / ${context.budgetMonthJpy} JPY`);
  console.log(`- Daily: ${context.spentDailyJpy} / ${context.budgetDailyJpy} JPY`);
  console.log(`- Reserve: ${context.reserveJpy} JPY`);

  appendGithubOutput('allowed', 'true');
  appendGithubOutput('spent_month_jpy', roundJpy(state.spentJpy));
  appendGithubOutput('spent_daily_jpy', roundJpy(state.daily[date].total));
  console.log('allowed=true');
}

main().catch((error) => {
  console.error('❌ budget-guard failed:', error?.message || error);
  try {
    const month = getCurrentMonthUtc();
    const title = `💸 AI Budget Guard Failed (${month})`;
    const body = [
      '## AI Budget Guard',
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
      '- AI execution is skipped until this is resolved (to prevent unexpected costs).',
      '',
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    ensureIssue({ title, body, labels: ['automated', 'budget'] }).catch(() => { });
  } catch {
    // ignore
  }

  // Fail-safe: block Gemini to prevent unexpected costs.
  appendGithubOutput('allowed', 'false');
  process.exit(0);
});
