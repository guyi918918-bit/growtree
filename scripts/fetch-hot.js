// 每 2 小时抓取 uapis.cn 热榜，生成 hot.json 供静态站点读取
const fs = require('fs');
const path = require('path');

const API = 'https://uapis.cn/api/v1/misc/hotboard';

const TYPES = [
  'weibo', 'zhihu', 'bilibili', 'douyin', 'xiaohongshu', 'kuaishou',
  'toutiao', 'baidu', 'qq-news', 'netease-news', 'sina-news', 'thepaper',
  'huxiu', '36kr'
];

async function fetchType(type) {
  try {
    const res = await fetch(`${API}?type=${type}&limit=30`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { type, ok: true, data };
  } catch (e) {
    console.error(`[hot] ${type} failed:`, e.message);
    return { type, ok: false, error: e.message };
  }
}

async function main() {
  const results = await Promise.all(TYPES.map(fetchType));
  const output = {
    updatedAt: new Date().toISOString(),
    list: results.filter(r => r.ok).map(r => ({ type: r.type, ...r.data })),
    failed: results.filter(r => !r.ok).map(r => ({ type: r.type, error: r.error }))
  };
  const outPath = path.join(__dirname, '..', 'hot.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[hot] wrote ${output.list.length} sources to hot.json`);
  if (output.failed.length) console.log(`[hot] failed ${output.failed.length} sources`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
