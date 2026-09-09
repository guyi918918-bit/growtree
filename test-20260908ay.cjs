// 回归测试：ay 版（围度距离目标颜色互换：还差标红、达成标绿）
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(m){ pass++; console.log('  ✓', m); }
function no(m){ fail++; console.log('  ✗', m); }

const ROOT = '/Users/mianmian/WorkBuddy/2026-08-20-09-33-44/growtree';
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908ay.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const VERSION = fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

console.log('== 版本标记 ==');
if (APP_JS.includes("const APP_BUILD = '20260908ay'")) ok('app.20260908ay.js APP_BUILD=ay'); else no('APP_BUILD 未更新为 ay');
if (VERSION.trim() === '{"build":"20260908ay"}') ok('version.json=ay'); else no('version.json 错误: ' + VERSION.trim());
if (SW.includes("CACHE = 'growtree-shell-v117'")) ok('SW v117'); else no('SW 版本未升 v117');
if (SW.includes("app.20260908ay.js") && SW.includes("styles.20260908ay.css")) ok('SW SHELL 引用 ay 文件'); else no('SW SHELL 未引用 ay');

console.log('== 围度距离目标颜色 ==');
// 从 HTML 中提取 .msi-down/.msi-up/.msi-ok 的 color 定义
const styleMatch = YJXS_HTML.match(/\.msi-down\{color:var\(--(\w+)\)\}\s*\.msi-up\{color:var\(--(\w+)\)\}\s*\.msi-ok\{color:var\(--(\w+)\)\}/);
if (styleMatch) {
  const [, downColor, upColor, okColor] = styleMatch;
  if (downColor === 'red') ok('.msi-down 为红色（还差）'); else no('.msi-down 应为 red，实际为 ' + downColor);
  if (upColor === 'green') ok('.msi-up 为绿色（已低于目标）'); else no('.msi-up 应为 green，实际为 ' + upColor);
  if (okColor === 'green') ok('.msi-ok 为绿色（已达成）'); else no('.msi-ok 应为 green，实际为 ' + okColor);
} else {
  no('未找到 msi-down/up/ok 的完整 color 定义');
}

console.log('== 其他功能不动 ==');
if (YJXS_HTML.includes('measureFormOpen')) ok('折叠开关仍在'); else no('折叠开关丢失');
if (APP_JS.includes('Math.max(COURAGE_STAR')) ok('星能上限修复仍在'); else no('星能上限修复丢失');

console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
