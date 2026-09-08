const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260907aq.js'), 'utf8');
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
const SW_JS = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));

let passed = 0, failed = 0;
function ok(msg) { passed++; console.log('✅', msg); }
function no(msg) { failed++; console.log('❌', msg); }

// 1. 版本号
if (VERSION.build === '20260907aq') ok('version.json = aq'); else no('version.json 不是 aq: ' + VERSION.build);
if (APP_JS.includes("const APP_BUILD = '20260907aq';")) ok('APP_BUILD = aq'); else no('APP_BUILD 不是 aq');
if (SW_JS.includes("CACHE = 'growtree-shell-v109'") && SW_JS.includes('app.20260907aq.js') && SW_JS.includes('styles.20260907aq.css')) ok('sw.js v109 引用 aq'); else no('sw.js 引用异常');

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

// 3. 用 jsdom 跑公式
const dom = new JSDOM(YJXS_HTML, { runScripts: 'dangerously', url: 'https://example.com/' });
const win = dom.window;
// 等待 Store 等初始化完成
setTimeout(() => {
  try {
    const App = win.App;
    if (App && App.Store) ok('App.Store 可用'); else no('App.Store 未初始化');

    // 模拟 profile
    win.App.Store.set('profile', { gender: '女', age: '29', height: '163', startWeight: '58.9', targetWeight: '56.9', calorie: '1300' });
    win.App.Store.set('calBudget', 1300);
    win.App.Store.set('calBmr', 1305);

    // 测试 BMR
    const bmr = win.calcBMR({ gender: '女', age: '29', height: '163', startWeight: '58.9' });
    if (bmr >= 1370 && bmr <= 1385) ok('女性 BMR 按公式=' + bmr + '（用户示例约 1305 为近似值）'); else no('BMR 计算异常: ' + bmr);

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

    // 测试目标预测
    win.App.Store.set('weightLog', [{ date: today, weight: 58.9 }]);
    win.App.Store.set('fatStages', [{ name: '先到56.9', target: '56.9', startWeight: '58.9', startDate: today, done: false }]);
    win.App.Store.set('fatCurStage', 0);
    const gs = win.getGoalStats();
    if (gs && gs.totalGap === 15400) ok('剩余总缺口=15400'); else no('剩余总缺口异常: ' + (gs && gs.totalGap));
    const pred = win.predictDays(125);
    if (pred && pred.days === 124) ok('预计 124 天达成'); else no('预计天数异常: ' + (pred && pred.days));

    // 测试超标状态
    win.App.Store.set('calBudget', 1200);
    const tc2 = win.getTodayCal(today);
    const over = tc2.in - 1200;
    if (over === 130) ok('超标 130 大卡'); else no('超标计算异常: ' + over);
  } catch (e) {
    no('jsdom 执行异常: ' + e.message);
    console.error(e);
  }

  console.log(`\n共 ${passed + failed} 项，通过 ${passed}，失败 ${failed}`);
  process.exit(failed ? 1 : 0);
}, 300);
