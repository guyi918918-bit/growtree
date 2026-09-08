const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908at.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const SW_JS = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

let passed = 0, failed = 0;
function ok(msg) { passed++; console.log('✅', msg); }
function no(msg) { failed++; console.log('❌', msg); }

// 1. 版本号
if (VERSION.build === '20260908at') ok('version.json = at'); else no('version.json 不是 at: ' + VERSION.build);
if (APP_JS.includes("const APP_BUILD = '20260908at';")) ok('APP_BUILD = at'); else no('APP_BUILD 不是 at');
if (SW_JS.includes("CACHE = 'growtree-shell-v112'") && SW_JS.includes('app.20260908at.js') && SW_JS.includes('styles.20260908at.css')) ok('sw.js v112 引用 at'); else no('sw.js 引用异常');

// 2. yuejixiangshou 核心标记
if (YJXS_HTML.includes('今日热量账本')) ok('HTML 包含热量账本标题'); else no('HTML 缺热量账本标题');
if (YJXS_HTML.includes('function calcBMR(')) ok('定义 calcBMR'); else no('缺 calcBMR');
if (YJXS_HTML.includes('function getTodayCal(')) ok('定义 getTodayCal'); else no('缺 getTodayCal');
if (YJXS_HTML.includes('function getGoalStats(')) ok('定义 getGoalStats'); else no('缺 getGoalStats');
if (YJXS_HTML.includes("Store.set('calIn',")) ok('初始化 calIn'); else no('缺 calIn 初始化');
if (YJXS_HTML.includes("Store.set('calOut',")) ok('初始化 calOut'); else no('缺 calOut 初始化');
if (YJXS_HTML.includes("'calIn','calOut','calBudget','calBmr','calCumGap'")) ok('YJXS_SYNC_KEYS 含热量键'); else no('YJXS_SYNC_KEYS 缺热量键');
if (YJXS_HTML.includes('今日净差额')) ok('汇总区文案存在'); else no('缺汇总区文案');
if (YJXS_HTML.includes('cal-ledger-num')) ok('热量账本样式存在'); else no('缺热量账本样式');

// at 新增：日历无记录时空格不显示数值
if (YJXS_HTML.includes('hasRecord')) ok('getTodayCal 返回 hasRecord'); else no('缺 hasRecord');
if (YJXS_HTML.includes("var hasRec=cals.hasRecord;")) ok('renderCalendar 使用 hasRecord'); else no('renderCalendar 未使用 hasRecord');
if (YJXS_HTML.includes('if(hasRec)') && YJXS_HTML.includes("'<div class=\"stats\">'")) ok('日历仅在有记录时渲染 stats'); else no('日历渲染逻辑未按 hasRecord 分支');

// 3. 用 jsdom 跑公式与阶段目标
const dom = new JSDOM(YJXS_HTML, { runScripts: 'dangerously', url: 'https://example.com/' });
const win = dom.window;
setTimeout(() => {
  try {
    const App = win.App;
    if (App && App.Store) ok('App.Store 可用'); else no('App.Store 未初始化');

    // 模拟 profile：最终目标 50kg，阶段目标 57.5kg
    win.App.Store.set('profile', { gender: '女', age: '29', height: '163', startWeight: '60', targetWeight: '50', calorie: '1300' });
    win.App.Store.set('calBudget', 1300);
    win.App.Store.set('calBmr', 1305);
    win.App.Store.set('weightLog', [{ date: '2026-09-08', weight: 58.3 }]);
    win.App.Store.set('fatStages', [
      { name: '第一阶段-9.15', targetWeight: '57.5', startWeight: '60', startDate: '2026-09-01', done: false }
    ]);
    win.App.Store.set('fatCurStage', 0);

    // 测试阶段目标联动
    const gs = win.getGoalStats();
    if (gs && gs.goalW === 57.5) ok('阶段目标体重=57.5'); else no('阶段目标体重异常: ' + (gs && gs.goalW));
    if (gs && gs.totalGap === 6160) ok('阶段剩余总缺口=(58.3-57.5)*7700=6160'); else no('阶段剩余总缺口异常: ' + (gs && gs.totalGap));

    // 测试无记录日期：hasRecord=false，但 out 仍等于 bmr
    const blank = win.getTodayCal('2026-09-01');
    if (blank && blank.hasRecord === false) ok('无记录日期 hasRecord=false'); else no('无记录日期 hasRecord 异常: ' + (blank && blank.hasRecord));
    if (blank && blank.out === 1305) ok('无记录日期 out=bmr=1305'); else no('无记录日期 out 异常: ' + (blank && blank.out));

    // 测试今日计算
    const today = '2026-09-08';
    win.App.Store.set('calIn', { [today]: [
      { name: '早餐', kcal: 330, type: '早餐' },
      { name: '午餐', kcal: 500, type: '午餐' },
      { name: '晚餐', kcal: 400, type: '晚餐' },
      { name: '牛奶', kcal: 100, type: '加餐' }
    ]});
    win.App.Store.set('calOut', { [today]: [
      { name: '爬坡', kcal: 150, duration: '30min' }
    ]});
    const tc = win.getTodayCal(today);
    if (tc.in === 1330) ok('总摄入=1330'); else no('总摄入=' + tc.in);
    if (tc.exercise === 150) ok('运动消耗=150'); else no('运动消耗=' + tc.exercise);
    if (tc.out === 1455) ok('总消耗=1305+150=1455'); else no('总消耗=' + tc.out);
    if (tc.net === 125) ok('净差额=+125'); else no('净差额=' + tc.net);
    if (tc.hasRecord === true) ok('有记录日期 hasRecord=true'); else no('有记录日期 hasRecord 异常: ' + tc.hasRecord);

    // 测试预计天数
    const pred = win.predictDays(125);
    if (pred && pred.days === 50) ok('按阶段缺口预计 50 天达成'); else no('预计天数异常: ' + (pred && pred.days));

    // 测试超标状态
    win.App.Store.set('calBudget', 1200);
    const tc2 = win.getTodayCal(today);
    const over = tc2.in - 1200;
    if (over === 130) ok('超标 130 大卡'); else no('超标计算异常: ' + over);

    // 测试日历函数存在
    if (typeof win.renderCalendar === 'function') ok('renderCalendar 存在'); else no('renderCalendar 不存在');
    if (typeof win.showDayDetail === 'function') ok('showDayDetail 存在'); else no('showDayDetail 不存在');

    // 测试 renderCalendar 输出：有记录格含 stats，无记录格不含 stats
    win.state = win.state || {};
    win.state.calDate = new Date('2026-09-01T00:00:00');
    win.renderCalendar();
    const grid = win.document.getElementById('calGrid');
    if (grid) {
      const cells = grid.querySelectorAll('.calCell[data-ds]');
      let blankFound = false, recFound = false;
      for (let i = 0; i < cells.length; i++) {
        const ds = cells[i].getAttribute('data-ds');
        const hasStats = cells[i].querySelector('.stats') !== null;
        if (ds === '2026-09-01' && !hasStats) { blankFound = true; }
        if (ds === '2026-09-08' && hasStats) { recFound = true; }
      }
      if (blankFound) ok('9/1 无记录格子未渲染 stats'); else no('9/1 无记录格子仍渲染了 stats');
      if (recFound) ok('9/8 有记录格子渲染了 stats'); else no('9/8 有记录格子未渲染 stats');
    } else {
      no('calGrid 未生成');
    }
  } catch (e) {
    no('jsdom 执行异常: ' + e.message);
    console.error(e);
  }

  console.log(`\n共 ${passed + failed} 项，通过 ${passed}，失败 ${failed}`);
  process.exit(failed ? 1 : 0);
}, 300);
