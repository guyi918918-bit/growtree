const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908ar.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const SW_JS = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

let passed = 0, failed = 0;
function ok(msg) { passed++; console.log('✅', msg); }
function no(msg) { failed++; console.log('❌', msg); }

// 1. 版本号
if (VERSION.build === '20260908ar') ok('version.json = ar'); else no('version.json 不是 ar: ' + VERSION.build);
if (APP_JS.includes("const APP_BUILD = '20260908ar';")) ok('APP_BUILD = ar'); else no('APP_BUILD 不是 ar');
if (SW_JS.includes("CACHE = 'growtree-shell-v110'") && SW_JS.includes('app.20260908ar.js') && SW_JS.includes('styles.20260908ar.css')) ok('sw.js v110 引用 ar'); else no('sw.js 引用异常');

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

// ar 新增：阶段目标字段 targetWeight、日历热量数据
if (YJXS_HTML.includes('stages[cur].targetWeight')) ok('getGoalStats 使用阶段 targetWeight'); else no('getGoalStats 未使用阶段 targetWeight');
if (YJXS_HTML.includes('月热量记录')) ok('日历标题改为热量记录'); else no('日历标题未改');
if (YJXS_HTML.includes('class="v in"') && YJXS_HTML.includes('class="v out"') && YJXS_HTML.includes('class="v net')) ok('日历格子含吃/花/缺元素'); else no('日历格子缺吃/花/缺元素');

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

    // 测试阶段目标联动：缺口应按当前阶段 57.5kg 而非最终 50kg
    const gs = win.getGoalStats();
    if (gs && gs.goalW === 57.5) ok('阶段目标体重=57.5'); else no('阶段目标体重异常: ' + (gs && gs.goalW));
    if (gs && gs.totalGap === 6160) ok('阶段剩余总缺口=(58.3-57.5)*7700=6160'); else no('阶段剩余总缺口异常: ' + (gs && gs.totalGap));

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
  } catch (e) {
    no('jsdom 执行异常: ' + e.message);
    console.error(e);
  }

  console.log(`\n共 ${passed + failed} 项，通过 ${passed}，失败 ${failed}`);
  process.exit(failed ? 1 : 0);
}, 300);
