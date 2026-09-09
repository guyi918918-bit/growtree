const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260908av.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const SW_JS = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

let passed = 0, failed = 0;
function ok(msg) { passed++; console.log('✅', msg); }
function no(msg) { failed++; console.log('❌', msg); }

// 1. 版本号
if (VERSION.build === '20260908av') ok('version.json = av'); else no('version.json 不是 av: ' + VERSION.build);
if (APP_JS.includes("const APP_BUILD = '20260908av';")) ok('APP_BUILD = av'); else no('APP_BUILD 不是 av');
if (SW_JS.includes("CACHE = 'growtree-shell-v114'") && SW_JS.includes('app.20260908av.js') && SW_JS.includes('styles.20260908av.css')) ok('sw.js v114 引用 av'); else no('sw.js 引用异常');

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

// au 新增：修复 nowHM
if (YJXS_HTML.includes('function nowHM(')) ok('定义 nowHM'); else no('缺 nowHM 定义');
if (YJXS_HTML.includes('time:nowHM()')) ok('围度记录调用 nowHM'); else no('围度记录未调用 nowHM');

// av 新增：目标围度 + 差额/百分比
if (YJXS_HTML.includes("Store.set('measureGoals',")) ok('初始化 measureGoals'); else no('缺 measureGoals 初始化');
if (YJXS_HTML.includes("'measureGoals'")) ok('YJXS_SYNC_KEYS/导出键含 measureGoals'); else no('缺 measureGoals 同步键');
if (YJXS_HTML.includes('🎯 目标围度')) ok('HTML 含目标围度标题'); else no('缺目标围度标题');
if (YJXS_HTML.includes('距离目标还有多远')) ok('HTML 含距离目标标题'); else no('缺距离目标标题');
if (YJXS_HTML.includes('msGoalGap')) ok('renderMeasure 渲染 msGoalGap'); else no('缺 msGoalGap');
if (YJXS_HTML.includes("data-idx=")) ok('历史表格按索引删除'); else no('历史表格未改索引删除');

// 3. 用 jsdom 跑公式与阶段目标
const dom = new JSDOM(YJXS_HTML, { runScripts: 'dangerously', url: 'https://example.com/' });
const win = dom.window;
setTimeout(() => {
  try {
    const App = win.App;
    if (App && App.Store) ok('App.Store 可用'); else no('App.Store 未初始化');

    // 测试 nowHM 可用且格式正确
    if (typeof win.nowHM === 'function') {
      const hm = win.nowHM();
      if (/^\d{2}:\d{2}$/.test(hm)) ok('nowHM 返回 HH:MM 格式: ' + hm); else no('nowHM 格式异常: ' + hm);
    } else {
      no('nowHM 不是函数');
    }

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
    if (pred && pred.days === 49) ok('按阶段缺口预计 49 天达成'); else no('预计天数异常: ' + (pred && pred.days));

    // 测试超标状态
    win.App.Store.set('calBudget', 1200);
    const tc2 = win.getTodayCal(today);
    const over = tc2.in - 1200;
    if (over === 130) ok('超标 130 大卡'); else no('超标计算异常: ' + over);

    // 测试日历函数存在
    if (typeof win.renderCalendar === 'function') ok('renderCalendar 存在'); else no('renderCalendar 不存在');
    if (typeof win.showDayDetail === 'function') ok('showDayDetail 存在'); else no('showDayDetail 不存在');

    // 测试 renderMeasure 目标围度 + 差额/百分比
    if (typeof win.renderMeasure === 'function') ok('renderMeasure 存在'); else no('renderMeasure 不存在');
    win.App.Store.set('measureGoals', { '腰围': 65, '臀围': 88 });
    win.App.Store.set('measures', [
      { date: '2026-09-01', time: '08:30', '腰围': 72, '臀围': 94 },
      { date: '2026-09-08', time: '09:15', '腰围': 70, '臀围': 92 }
    ]);
    win.state = win.state || {};
    win.state.sec = 'fat';
    win.state.sub = win.state.sub || {};
    win.state.sub.fat = 'measure';
    win.renderMeasure();

    const goalGrid = win.document.getElementById('msGoalGrid');
    if (goalGrid && goalGrid.querySelector('#ms_goal_1')) ok('目标围度输入网格存在'); else no('目标围度输入网格缺失');

    const goalGap = win.document.getElementById('msGoalGap');
    if (goalGap && goalGap.textContent.includes('↓5.0cm') && goalGap.textContent.includes('7.7%')) ok('腰围差额=70-65=5cm，百分比=5/65=7.7%'); else no('腰围差额/百分比显示异常: ' + (goalGap && goalGap.textContent));

    const msTable = win.document.getElementById('msTable');
    if (msTable && msTable.innerHTML.includes('09:15')) ok('历史表格含时间列'); else no('历史表格缺时间列');

    // 模拟删除：按索引删除
    const delLinks = msTable.querySelectorAll('[data-idx]');
    const idxSet = Array.from(delLinks).map(a => a.getAttribute('data-idx'));
    if (idxSet.includes('0') && idxSet.includes('1')) ok('删除链接含 data-idx=0 和 1'); else no('删除链接索引异常: ' + idxSet.join(','));
  } catch (e) {
    no('jsdom 执行异常: ' + e.message);
    console.error(e);
  }

  console.log(`\n共 ${passed + failed} 项，通过 ${passed}，失败 ${failed}`);
  process.exit(failed ? 1 : 0);
}, 300);
