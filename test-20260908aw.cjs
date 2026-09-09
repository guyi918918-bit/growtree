const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908aw.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const SW_JS = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

let passed = 0, failed = 0;
function ok(msg) { passed++; console.log('✅', msg); }
function no(msg) { failed++; console.log('❌', msg); }

// 1. 版本号
if (VERSION.build === '20260908aw') ok('version.json = aw'); else no('version.json 不是 aw: ' + VERSION.build);
if (APP_JS.includes("const APP_BUILD = '20260908aw';")) ok('APP_BUILD = aw'); else no('APP_BUILD 不是 aw');
if (SW_JS.includes("CACHE = 'growtree-shell-v115'") && SW_JS.includes('app.20260908aw.js') && SW_JS.includes('styles.20260908aw.css')) ok('sw.js v115 引用 aw'); else no('sw.js 引用异常');

// 2. 回归：热量账本 / 日历空格 / nowHM / 目标围度（来自 at/au/av）
if (YJXS_HTML.includes('今日热量账本')) ok('HTML 包含热量账本标题'); else no('HTML 缺热量账本标题');
if (YJXS_HTML.includes('hasRecord')) ok('getTodayCal 返回 hasRecord'); else no('缺 hasRecord');
if (YJXS_HTML.includes("var hasRec=cals.hasRecord;")) ok('renderCalendar 使用 hasRecord（无记录留空）'); else no('renderCalendar 未使用 hasRecord');
if (YJXS_HTML.includes('function nowHM(')) ok('定义 nowHM'); else no('缺 nowHM 定义');
if (YJXS_HTML.includes("Store.set('measureGoals',")) ok('初始化 measureGoals'); else no('缺 measureGoals 初始化');

// 3. aw 新增：围度 UI 折叠 + 取消百分比
if (YJXS_HTML.includes("var open=!!Store.get('measureFormOpen',false);")) ok('围度录入面板默认折叠'); else no('缺 measureFormOpen 默认态');
if (YJXS_HTML.includes("id=\"msToggleForm\"")) ok('存在「录入/修改围度」展开按钮'); else no('缺展开按钮 msToggleForm');
if (YJXS_HTML.includes("id=\"msFormArea\" style=\"display:'+(open?'block':'none')+'\"")) ok('录入面板默认隐藏（display 随 open 切换）'); else no('录入面板未做隐藏');
if (YJXS_HTML.includes('measure-summary-grid') && YJXS_HTML.includes('msi-val') && YJXS_HTML.includes('msi-target')) ok('最新/距离目标用 measure-summary 卡片'); else no('缺 measure-summary 结构');
// 取消百分比：距离目标只显示 cm 差值，不再出现 % 文案
if (YJXS_HTML.includes('msi-down') && YJXS_HTML.includes('msi-up')) ok('距离目标显示 ↓/↑ cm 差值'); else no('缺 ↓/↑ 差值展示');
// 取消百分比：源码注释明确标注「无百分比」，且差值以 cm 呈现（避免误判体重进度等其它模块的 %）
if (YJXS_HTML.includes('距离目标（无百分比）') && YJXS_HTML.includes("msi-down") && YJXS_HTML.includes("'cm'")) ok('围度距离目标已取消百分比，仅显示 cm 差值'); else no('围度百分比取消标记缺失');
// 内联样式含新类
if (YJXS_HTML.includes('.measure-summary-grid{') && YJXS_HTML.includes('.msi-down{') && YJXS_HTML.includes('.msi-ok{')) ok('内联样式含 measure-summary-*'); else no('内联样式缺 measure-summary-*');

// 4. aw 新增：星能修复
if (APP_JS.includes('Math.max(COURAGE_STAR, r ? r.cap : 60)')) ok('getCourageCap 满格统一为 100（任何段位都能攒满加星）'); else no('getCourageCap 未修复上限');
if (APP_JS.includes('const earnedStars = Math.floor(total / COURAGE_STAR)') && APP_JS.includes('const remainder = total - earnedStars * COURAGE_STAR')) ok('recalcCourage 改用「整除+余数」计算进度'); else no('recalcCourage 未改用余数');
if (!APP_JS.includes('total -= (g.courageStars || 0) * COURAGE_STAR')) ok('已移除 lifetime courageStars 反减（修复删历史后星能归零）'); else no('仍残留 courageStars 反减逻辑');
if (!APP_JS.includes("console.log('[awardCourage]") && !APP_JS.includes("console.log('[recalcCourage]")) ok('已清除星能调试 console.log'); else no('仍残留星能调试日志');
if (APP_JS.includes('🌟 +${COURAGE_PER_ITEM} 星能')) ok('gameOnCheckIn 含星能增加提示'); else no('缺星能增加提示');
if (APP_JS.includes('🌟 星能满 100，白嫖 +1 星！')) ok('满 100 自动 +1 星提示存在'); else no('缺满 100 加星提示');

// 5. jsdom 跑 iframe 函数，确认无语法/初始化错误
const dom = new JSDOM(YJXS_HTML, { runScripts: 'dangerously', url: 'https://example.com/' });
const win = dom.window;
setTimeout(() => {
  try {
    if (win.App && win.App.Store) ok('App.Store 可用（iframe 正常初始化）'); else no('App.Store 未初始化');
    if (typeof win.nowHM === 'function') {
      const hm = win.nowHM();
      if (/^\d{2}:\d{2}$/.test(hm)) ok('nowHM 返回 HH:MM: ' + hm); else no('nowHM 格式异常: ' + hm);
    } else no('nowHM 不是函数');
    if (typeof win.renderMeasure === 'function') ok('renderMeasure 函数存在'); else no('缺 renderMeasure');
  } catch (e) {
    no('jsdom 初始化异常: ' + e.message);
  }

  console.log('\n=== 结果: ' + passed + ' 通过, ' + failed + ' 失败 ===');
  process.exit(failed ? 1 : 0);
}, 300);
