#!/usr/bin/env node
/**
 * 「全部保存」プロトコル（ローカル実行用）
 *
 * 目的:
 * - 変更がある状態で「保存したつもり」を防ぐ
 * - ビルドが通ることを確認する
 * - 変更箇所に応じて、ルール/ドキュメント更新が必要かを警告する
 *
 * 使い方:
 *   node scripts/all-save.cjs
 *   node scripts/all-save.cjs --skip-build
 *
 * NOTE:
 * - GitHubへのpushは環境によって権限/ネットワークが必要なので、ここでは「案内」まで。
 */

const { execSync } = require('child_process');

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', ...opts }).trim();
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function printSection(title) {
  process.stdout.write(`\n== ${title} ==\n`);
}

function main() {
  const skipBuild = hasFlag('--skip-build');

  printSection('Git Status');
  const status = sh('git status -sb');
  console.log(status);

  const changed = sh('git diff --name-only');
  const untracked = sh('git ls-files --others --exclude-standard');
  const changedFiles = new Set(
    []
      .concat(changed ? changed.split('\n').filter(Boolean) : [])
      .concat(untracked ? untracked.split('\n').filter(Boolean) : [])
  );

  if (changedFiles.size === 0) {
    console.log('\nNo local changes detected.');
  } else {
    console.log(`\nChanged files: ${changedFiles.size}`);
  }

  printSection('Doc/Rule Consistency Hints');
  const touchesMaintenance =
    changedFiles.has('scripts/maintenance.js') ||
    changedFiles.has('scripts/utils/postHelpers.js') ||
    changedFiles.has('scripts/run-daily-generation.cjs');

  const touchesArticleRules = changedFiles.has('ARTICLE_GUIDE.md') || changedFiles.has('RULES.md');

  const touchesChatbot = changedFiles.has('src/components/AItuberWidget.tsx');
  const touchesChatbotDoc = changedFiles.has('docs/CHATBOT_ANALYTICS_GA4.md');

  if (touchesMaintenance && !touchesArticleRules) {
    console.log(
      '- maintenance/生成スクリプトを変更しています。ルール変更がある場合は `ARTICLE_GUIDE.md` / `RULES.md` の更新を確認してください。'
    );
  }

  if (touchesChatbot && !touchesChatbotDoc) {
    console.log(
      '- チャットボットを変更しています。計測や仕様に影響がある場合は `docs/CHATBOT_ANALYTICS_GA4.md` の更新を確認してください。'
    );
  }

  if (!touchesMaintenance && !touchesChatbot && !touchesArticleRules) {
    console.log('- 特に追加のドキュメント更新ヒントはありません。');
  }

  if (!skipBuild) {
    printSection('Build');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (err) {
      console.error('\nBuild failed. Fix errors before saving.');
      process.exit(1);
    }
  } else {
    printSection('Build');
    console.log('Skipped (use without --skip-build to run).');
  }

  printSection('Next Steps');
  console.log('- Stage changes: `git add -A`');
  console.log('- Commit: `git commit -m \"...\"`');
  console.log('- Push: `git push origin main`');
}

main();

