#!/usr/bin/env node

/**
 * anomaly-autofix.cjs
 *
 * Tries a single "best-effort" remediation when analytics-health-check reports unhealthy.
 *
 * Inputs:
 *   - HEALTH_PATH (optional): path to analytics health json (default: analytics/health.json)
 *   - health.json content (reason / reason_code / diagnostics)
 *
 * Optional env for remediation:
 *   - GCP_SERVICE_ACCOUNT_KEY (required to refetch GA4/GSC via python scripts)
 *   - GA4_PROPERTY_ID (optional, default handled by python script)
 *   - GSC_SITE_URL (optional, default handled by python script)
 *
 * Outputs (to GITHUB_OUTPUT):
 *   - fixed=true|false
 *   - fix_summary=... (short)
 *   - fix_reason_code=RATE_LIMIT|TRANSIENT_5XX|TIMEOUT|AUTH|NO_DATA|SKIPPED|UNKNOWN
 *
 * Notes:
 * - This script will attempt remediation at most once per workflow run.
 * - It never "pretends healthy"; it only refreshes input data and lets the health check re-evaluate.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

function appendGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const safe = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  fs.appendFileSync(outputPath, `${key}=${safe}\n`, 'utf8');
}

function writeOutputs({ fixed, fix_summary, fix_reason_code }) {
  appendGithubOutput('fixed', fixed ? 'true' : 'false');
  appendGithubOutput('fix_summary', fix_summary || '');
  appendGithubOutput('fix_reason_code', fix_reason_code || 'UNKNOWN');
  console.log(JSON.stringify({ fixed: Boolean(fixed), fix_reason_code, fix_summary }, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function classifyError(output) {
  const text = String(output || '');
  if (/permission denied|unauthorized|forbidden|invalid_grant|401|403/i.test(text)) return 'AUTH';
  if (/429|rate limit|quota/i.test(text)) return 'RATE_LIMIT';
  if (/timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up/i.test(text)) return 'TIMEOUT';
  if (/(?:\b5\d\d\b)|internal error|backend error|server error/i.test(text)) return 'TRANSIENT_5XX';
  if (/no data|empty|not found/i.test(text)) return 'NO_DATA';
  return 'UNKNOWN';
}

async function runCommand(command, args, options = {}) {
  const { env } = options;
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...(env || {}) },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function runWithRetries({ label, command, args, env, maxAttempts = 3 }) {
  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await runCommand(command, args, { env });
    last = res;
    if (res.code === 0) return { ok: true, ...res, attempts: attempt };

    const combined = `${res.stdout}\n${res.stderr}`;
    const code = classifyError(combined);
    const shouldRetry = code === 'RATE_LIMIT' || code === 'TRANSIENT_5XX' || code === 'TIMEOUT';
    if (!shouldRetry || attempt === maxAttempts) {
      return { ok: false, ...res, attempts: attempt, classified: code };
    }

    const backoffMs = Math.min(30_000, 1500 * Math.pow(2, attempt - 1));
    console.warn(`[autofix] ${label} failed (attempt ${attempt}/${maxAttempts}, classified=${code}). Retrying in ${backoffMs}ms...`);
    await sleep(backoffMs);
  }
  return { ok: false, ...(last || { code: 1, stdout: '', stderr: '' }), attempts: maxAttempts, classified: 'UNKNOWN' };
}

function readHealthJson(healthPath) {
  if (!fs.existsSync(healthPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(healthPath, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const healthPath = process.env.HEALTH_PATH || path.join(process.cwd(), 'analytics', 'health.json');
  const health = readHealthJson(healthPath);

  if (!health) {
    writeOutputs({
      fixed: false,
      fix_reason_code: 'SKIPPED',
      fix_summary: `No health file found at ${healthPath}`,
    });
    return;
  }

  const reason = String(health.reason || '');
  const reasonCode = String(health.reason_code || '').toUpperCase();

  if (health.ok === true || reason === 'ok' || reasonCode === 'OK') {
    writeOutputs({ fixed: false, fix_reason_code: 'SKIPPED', fix_summary: 'Analytics already healthy' });
    return;
  }

  // Only attempt one strategy: refresh GA4/GSC exports (best-effort).
  const saKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!saKey || !String(saKey).trim()) {
    writeOutputs({
      fixed: false,
      fix_reason_code: 'AUTH',
      fix_summary: 'Missing GCP_SERVICE_ACCOUNT_KEY; cannot refetch GA4/GSC exports',
    });
    return;
  }

  const tmpPath = path.join('/tmp', `sa-${Date.now()}.json`);
  fs.writeFileSync(tmpPath, saKey, 'utf8');

  const commonEnv = {
    GOOGLE_APPLICATION_CREDENTIALS: tmpPath,
    ...(process.env.GA4_PROPERTY_ID ? { GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID } : {}),
    ...(process.env.GSC_SITE_URL ? { GSC_SITE_URL: process.env.GSC_SITE_URL } : {}),
  };

  try {
    console.log(`[autofix] analytics unhealthy (reason=${reason || reasonCode || 'unknown'}). Attempting to refetch GA4/GSC exports...`);

    const pip = await runWithRetries({
      label: 'pip install',
      command: 'python3',
      args: ['-m', 'pip', 'install', '--no-cache-dir', '-r', 'scripts/analytics/requirements.txt'],
      env: commonEnv,
      maxAttempts: 3,
    });
    if (!pip.ok) {
      const combined = `${pip.stdout}\n${pip.stderr}`;
      const classified = pip.classified || classifyError(combined);
      writeOutputs({
        fixed: false,
        fix_reason_code: classified,
        fix_summary: `Failed to install analytics deps (attempts=${pip.attempts}, classified=${classified})`,
      });
      return;
    }

    const gsc = await runWithRetries({
      label: 'fetch-gsc-data',
      command: 'python3',
      args: ['scripts/analytics/fetch-gsc-data.py'],
      env: commonEnv,
      maxAttempts: 3,
    });
    if (!gsc.ok) {
      const combined = `${gsc.stdout}\n${gsc.stderr}`;
      const classified = gsc.classified || classifyError(combined);
      writeOutputs({
        fixed: false,
        fix_reason_code: classified,
        fix_summary: `Fetch GSC failed (attempts=${gsc.attempts}, classified=${classified})`,
      });
      return;
    }

    const ga4 = await runWithRetries({
      label: 'fetch-ga4-data',
      command: 'python3',
      args: ['scripts/analytics/fetch-ga4-data.py'],
      env: commonEnv,
      maxAttempts: 3,
    });
    if (!ga4.ok) {
      const combined = `${ga4.stdout}\n${ga4.stderr}`;
      const classified = ga4.classified || classifyError(combined);
      writeOutputs({
        fixed: false,
        fix_reason_code: classified,
        fix_summary: `Fetch GA4 failed (attempts=${ga4.attempts}, classified=${classified})`,
      });
      return;
    }

    writeOutputs({
      fixed: true,
      fix_reason_code: reasonCode || reason.toUpperCase() || 'UNKNOWN',
      fix_summary: 'Refetched GA4/GSC exports (rerun health check to re-evaluate)',
    });
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

main().catch((error) => {
  writeOutputs({
    fixed: false,
    fix_reason_code: 'UNKNOWN',
    fix_summary: `Autofix script error: ${String(error?.message || error)}`,
  });
  process.exit(0);
});

