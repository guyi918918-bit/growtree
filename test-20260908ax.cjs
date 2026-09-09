// 回归测试：ax 版（围度 UI 折叠去百分比 + 星能修复 + 清理重复 CSS）
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(m){ pass++; console.log('  ✓', m); }
function no(m){ fail++; console.log('  ✗', m); }

const ROOT = '/Users/mianmian/WorkBuddy/2026-08-20-09-33-44/growtree';
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908ax.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const VERSION = fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

console.log('== 版本标记 ==');
if (APP_JS.includes("const APP_BUILD = '20260908ax'")) ok('app.20260908ax.js APP_BUILD=ax'); else no('APP_BUILD 未更新为 ax');
if (VERSION.trim() === '{"build":"20260908ax"}') ok('version.json=ax'); else no('version.json 错误: ' + VERSION.trim());
if (SW.includes("CACHE = 'growtree-shell-v116'")) ok('SW v116'); else no('SW 版本未升 v116');
if (SW.includes("app.20260908ax.js") && SW.includes("styles.20260908ax.css")) ok('SW SHELL 引用 ax 文件'); else no('SW SHELL 未引用 ax');

console.log('== 围度 UI ==');
if (YJXS_HTML.includes('measureFormOpen')) ok('存在折叠开关 measureFormOpen'); else no('缺少折叠开关');
if (YJXS_HTML.includes('msToggle')) ok('存在展开/收起按钮 msToggle'); else no('缺少 msToggle 按钮');
if (YJXS_HTML.includes('measureForm')) ok('存在可折叠表单容器 measureForm'); else no('缺少 measureForm 容器');
if (YJXS_HTML.includes('记录一次围度') && YJXS_HTML.includes('目标围度')) ok('折叠区内含记录与目标围度输入'); else no('折叠区内容缺失');
if (YJXS_HTML.includes('距离目标（无百分比）')) ok('drawGoalGap 标注无百分比'); else no('缺无百分比标注');
if (YJXS_HTML.includes("' cm</span>'") || YJXS_HTML.includes("toFixed(1)+' cm'")) ok('drawGoalGap 用 cm 差值'); else no('drawGoalGap 未用 cm 差值');
if (YJXS_HTML.includes('time:nowHM()')) ok('记录自动带 nowHM 时间'); else no('记录缺时间');

console.log('== 重复 CSS 已清理 ==');
const msiCount = (YJXS_HTML.match(/\.msi-ok\{/g) || []).length;
if (msiCount === 1) ok('measure-summary 样式仅一份（无重复定义）'); else no('.msi-ok 定义出现 ' + msiCount + ' 次（应为1）');

console.log('== 星能修复 ==');
if (APP_JS.includes('Math.max(COURAGE_STAR, r ? r.cap : 60)') || APP_JS.includes('Math.max(COURAGE_STAR, r?r.cap:60)')) ok('星能上限至少 COURAGE_STAR(100)，低段位可攒满加星'); else no('星能上限仍可能<100 钳死');
if (APP_JS.includes('Math.floor(total / COURAGE_STAR)')) ok('recalcCourage 按 total/100 取整发星'); else no('recalcCourage 反减逻辑未改为取整');
if (!APP_JS.includes("console.log('[awardCourage]'") && !APP_JS.includes("console.log('[recalcCourage]'")) ok('星能无残留调试日志'); else no('星能仍有调试 console.log');

console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
