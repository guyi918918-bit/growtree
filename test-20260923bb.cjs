// 回归测试：bb 版（夜间模式修复——云端拉取保留本地主题，不再闪现后跳回日间）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let pass = 0, fail = 0;
function ok(m){ pass++; console.log('  ✓', m); }
function no(m){ fail++; console.log('  ✗', m); }

const ROOT = '/Users/mianmian/WorkBuddy/2026-08-20-09-33-44/growtree';
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260923bb.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const VERSION = fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

console.log('== 版本标记（五处同步） ==');
if (APP_JS.includes("const APP_BUILD = '20260923bb'")) ok('APP_BUILD=20260923bb'); else no('APP_BUILD 未更新');
if (VERSION.trim() === '{"build":"20260923bb"}') ok('version.json=20260923bb'); else no('version.json 错误: ' + VERSION.trim());
if (SW.includes("CACHE = 'growtree-shell-v120'")) ok('SW CACHE v120'); else no('SW 版本未升 v120');
if (SW.includes("app.20260923bb.js") && SW.includes("yuejixiangshou.html")) ok('SW SHELL 引用新 js + 子页面'); else no('SW SHELL 引用错误');
if (INDEX.includes('src="app.20260923bb.js"')) ok('index.html 引用新 js'); else no('index.html 未更新');
if (!INDEX.includes('app.20260908az.js')) ok('index.html 已无旧 az 引用'); else no('index.html 残留 az 引用');

console.log('== 子页面夜间模式 CSS ==');
if (YJXS_HTML.includes('html[data-theme="dark"]{')) ok('存在 dark 主题变量覆盖块'); else no('缺少 dark 变量覆盖块');
if (YJXS_HTML.includes('--card:#1c1c1e') && YJXS_HTML.includes('--bg:#000000')) ok('dark 变量：卡片/背景深色'); else no('dark 变量缺失');
if (YJXS_HTML.includes('--ink:#f5f5f7') && YJXS_HTML.includes('--line:#38383a')) ok('dark 变量：文字/边框'); else no('dark 文字/边框变量缺失');
if (YJXS_HTML.includes('html[data-theme="dark"] #topbar')) ok('顶栏 dark 覆盖'); else no('顶栏未覆盖');
if (YJXS_HTML.includes('html[data-theme="dark"] .calCell.binged')) ok('日历暴食格 dark 覆盖'); else no('日历格未覆盖');
if (YJXS_HTML.includes('html[data-theme="dark"] input')) ok('输入框 dark 覆盖'); else no('输入框未覆盖');
if (YJXS_HTML.includes('html[data-theme="dark"] #modal .panel')) ok('弹窗 dark 覆盖'); else no('弹窗未覆盖');
if (YJXS_HTML.includes('html[data-theme="dark"] .cal-ledger-row.cal-ledger-row-over')) ok('热量账本超标态 dark 覆盖'); else no('账本超标态未覆盖');

console.log('== 日间模式不受影响 ==');
if (YJXS_HTML.includes('--card:#ffffff;--bg:#f4f8f5')) ok(':root 日间变量原样保留'); else no('日间变量被改动');
if (!/background:#fff[;}'"]/.test(YJXS_HTML)) ok('无残留硬编码 background:#fff（已全部 var(--card)）'); else no('仍存在硬编码 background:#fff');
if (YJXS_HTML.includes('background:var(--card)')) ok('卡片背景改用变量（日间=#ffffff 不变）'); else no('缺少 var(--card) 背景');

console.log('== 主题同步机制 ==');
if (YJXS_HTML.includes("ev.data.type==='yjxs-theme'")) ok('子页面监听 yjxs-theme 消息'); else no('子页面未监听主题消息');
const atMatch = YJXS_HTML.match(/function applyYjxsTheme\(theme\)\{[\s\S]*?\n\}/);
if (atMatch && atMatch[0].includes("setAttribute('data-theme'") && atMatch[0].includes("localStorage.setItem('rw5_theme'")) ok('applyYjxsTheme：设置 data-theme 并持久化'); else no('applyYjxsTheme 缺失或不完整');
if (YJXS_HTML.includes("localStorage.getItem('rw5_theme')") && YJXS_HTML.indexOf("localStorage.getItem('rw5_theme')") < YJXS_HTML.indexOf('<body')) ok('首屏渲染前预应用主题（防闪白）'); else no('缺少防闪白预应用');
if (APP_JS.includes('function pushThemeToYjxs()')) ok('父应用新增 pushThemeToYjxs'); else no('父应用缺少 pushThemeToYjxs');
if (/function applyTheme\(\)\s*\{[\s\S]*?pushThemeToYjxs\(\)/.test(APP_JS)) ok('applyTheme 切换时推送主题给 iframe'); else no('applyTheme 未推送主题');
if (/type === 'yjxs-ready'\)\s*\{[\s\S]{0,120}?pushThemeToYjxs\(\)/.test(APP_JS)) ok('iframe 就绪时同步当前主题'); else no('yjxs-ready 未推送主题');
if (APP_JS.includes("{ type: 'yjxs-theme', theme: theme }")) ok('消息格式 yjxs-theme + theme'); else no('消息格式错误');

console.log('== 云端同步保留本地主题（bb 修复点） ==');
const core = APP_JS.match(/async function _syncFromCloudCore[\s\S]*?\n\}/);
if (core) {
  const b = core[0];
  if (b.includes('const localTheme = state.data.settings && state.data.settings.theme;')) ok('合并前快照本地主题'); else no('未找到 localTheme 快照');
  if (b.includes('if (localTheme) state.data.settings.theme = localTheme;')) ok('合并后还原本地主题'); else no('未还原本地主题');
  if (b.indexOf('const localTheme') < b.indexOf('state.data = { ...state.data, ...cloudPayload }') && b.indexOf('settings.theme = localTheme') > b.indexOf('state.data = { ...state.data, ...cloudPayload }')) ok('快照在合并前 / 还原在合并后（顺序正确）'); else no('快照/还原顺序错误');
  if (/\}\s*catch \(themeErr\)/.test(b) && b.includes('applyTheme()')) ok('合并后重新 applyTheme 同步父页面+iframe'); else no('合并后未重新 applyTheme');
} else no('未找到 _syncFromCloudCore');

console.log('== 语法检查 ==');
try {
  execSync('node --check ' + path.join(ROOT, 'app.20260923bb.js'), { stdio: 'pipe' });
  ok('app.20260923bb.js 语法通过');
} catch (e) { no('app js 语法错误: ' + e.message.split('\n')[0]); }
// 提取子页面 <script> 块做语法检查（跳过 head 预应用小脚本）
const scripts = [...YJXS_HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((code, i) => {
  try {
    fs.writeFileSync('/tmp/yjxs-check-' + i + '.js', code);
    execSync('node --check /tmp/yjxs-check-' + i + '.js', { stdio: 'pipe' });
    ok('子页面 script#' + i + ' 语法通过');
  } catch (e) { no('子页面 script#' + i + ' 语法错误: ' + e.message.split('\n')[0]); }
});

console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
