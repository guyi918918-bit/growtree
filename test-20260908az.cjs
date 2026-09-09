// 回归测试：az 版（围度距离目标——还差标红、已达成/低于标绿，距离数字放大、当前/目标缩小）
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(m){ pass++; console.log('  ✓', m); }
function no(m){ fail++; console.log('  ✗', m); }

const ROOT = '/Users/mianmian/WorkBuddy/2026-08-20-09-33-44/growtree';
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908az.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const VERSION = fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

console.log('== 版本标记 ==');
if (APP_JS.includes("const APP_BUILD = '20260908az'")) ok('app.20260908az.js APP_BUILD=az'); else no('APP_BUILD 未更新为 az');
if (VERSION.trim() === '{"build":"20260908az"}') ok('version.json=az'); else no('version.json 错误: ' + VERSION.trim());
if (SW.includes("CACHE = 'growtree-shell-v118'")) ok('SW v118'); else no('SW 版本未升 v118');
if (SW.includes("app.20260908az.js") && SW.includes("styles.20260908az.css")) ok('SW SHELL 引用 az 文件'); else no('SW SHELL 未引用 az');

console.log('== 距离目标 UI 重构 ==');
if (YJXS_HTML.includes('msi-meta')) ok('存在小字号 .msi-meta 当前/目标信息'); else no('缺少 .msi-meta');
if (YJXS_HTML.includes('msi-gap')) ok('存在大字号 .msi-gap 距离数字'); else no('缺少 .msi-gap');
if (YJXS_HTML.includes('.msi-gap{font-size:22px') || YJXS_HTML.includes('.msi-gap{font-size:22')) ok('.msi-gap 字号放大'); else no('.msi-gap 字号未放大');
if (YJXS_HTML.includes('.msi-gap.red{color:var(--red)}') || YJXS_HTML.includes('.msi-gap.red')) ok('.msi-gap.red 红色'); else no('缺少 .msi-gap.red');
if (YJXS_HTML.includes('.msi-gap.green{color:var(--green)}') || YJXS_HTML.includes('.msi-gap.green')) ok('.msi-gap.green 绿色'); else no('缺少 .msi-gap.green');

console.log('== 颜色语义 ==');
const dgMatch = YJXS_HTML.match(/function drawGoalGap\(\)\{[\s\S]*?\n  \}/);
if (dgMatch) {
  const body = dgMatch[0];
  if (body.includes("还差 ") && body.includes("cls='red'") && body.includes("diff>0")) ok('diff>0 显示「还差 X cm」并标红'); else no('diff>0 未红/文案不对');
  if (body.includes("已低 ") && body.includes("cls='green'") && body.includes("diff<0")) ok('diff<0 显示「已低 X cm」并标绿'); else no('diff<0 未绿/文案不对');
  if (body.includes("已达成") && body.includes("cls='green'") && body.includes("else{")) ok('diff===0 显示「已达成」并标绿'); else no('已达成未标绿');
} else no('未找到 drawGoalGap 函数');

console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
