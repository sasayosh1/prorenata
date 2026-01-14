#!/usr/bin/env node

/**
 * audit-empathy-bridge.js
 * 既存の記事に「すでにゴールページへのブリッジ」が存在するかを検出するだけ
 * ※ 一切書き換えない（audit専用）
 */


const args = Object.fromEntries(
  process.argv.slice(2).map(v => {
    const [k, val] = v.replace(/^--/, "").split("=");
    return [k, val ?? true];
  })
);

const {
  dataset = "production",
  retirementGoal,
  jobchangeGoal,
  limit = 50,
} = args;

if (!retirementGoal && !jobchangeGoal) {
  console.error("[audit] FATAL: goal slug is required");
  process.exit(1);
}

const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_API_READ_TOKEN;

if (!projectId || !token) {
  console.error("[audit] FATAL: Sanity credentials not set");
  process.exit(1);
}

const query = `
*[_type=="post"][0...${limit}]{
  slug,
  body
}
`;

async function main() {
  const res = await fetch(
    `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await res.json();
  const posts = json.result ?? [];

  let found = 0;

  for (const post of posts) {
    const text = JSON.stringify(post.body ?? "");

    const hits = [];
    if (retirementGoal && text.includes(retirementGoal)) {
      hits.push("retirement");
    }
    if (jobchangeGoal && text.includes(jobchangeGoal)) {
      hits.push("jobchange");
    }

    if (hits.length > 0) {
      found++;
      console.log(
        `- ${post.slug?.current} | ${hits.join(", ")}`
      );
    }
  }

  console.log(`\n[audit-empathy-bridge] total=${posts.length} matched=${found}`);
}

main().catch(err => {
  console.error("[audit-empathy-bridge] FATAL:", err);
  process.exit(1);
});
