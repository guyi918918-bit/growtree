// 回归测试：20260901aj
// 验证：①阶段目标改为体重目标链 ②足迹日历布局修复 ③认真打卡日历左右滑动切月（父应用 + iframe）
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const HTML = fs.readFileSync(require('path').join(ROOT, 'yuejixiangshou.html'), 'utf8');
const APP_JS = fs.readFileSync(require('path').join(ROOT, 'app.20260901aj.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(require('path').join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(require('path').join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(require('path').join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260901aj';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 102) ok('SW CACHE 已递增到 v102'); else no('SW CACHE 未递增到 v102');
if (INDEX.includes('app.20260901aj.js') && INDEX.includes('styles.20260901aj.css')) ok('index.html 引用 aj 文件'); else no('index.html 引用未更新');
if (SW.includes('./app.20260901aj.js') && SW.includes('./styles.20260901aj.css')) ok('sw.js SHELL 含 aj 文件'); else no('sw.js SHELL 未更新');
if (SW.includes('./yuejixiangshou.html')) ok('sw.js SHELL 含 yuejixiangshou.html'); else no('SHELL 缺 yuejixiangshou.html');

// ── 父应用：认真打卡日历月份切换逻辑存在 ──
if (APP_JS.includes('function getCheckinMonth()') && APP_JS.includes('function shiftCheckinMonth')) ok('父应用含月份状态辅助函数'); else no('父应用缺月份辅助函数');
if (APP_JS.includes("data-action=\"checkin-month\"") && APP_JS.includes("action === 'checkin-month'")) ok('父应用含月份切换按钮与事件'); else no('父应用月份切换事件缺失');
if (APP_JS.includes('attachCheckinCalendarSwipe')) ok('父应用含日历滑动手势绑定'); else no('父应用滑动手势绑定缺失');
if (APP_JS.includes('checkin-cal-swipe')) ok('父应用日历网格带 swipe 标记'); else no('父应用日历网格缺 swipe 标记');

// ── 加载真实 iframe 页面到 jsdom ──
const dom = new JSDOM(HTML, {
  url: 'https://guyi918918-bit.github.io/growtree/yuejixiangshou.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window){
    window.App = { _inited: false, sync: function(){}, _mem:{} };
    window.__yjerr = function(){};
  }
});
const w = dom.window;
const doc = w.document;

function $(sel){ return doc.querySelector(sel); }

setTimeout(function(){
  try{
    // 1. 导航：减脂足迹含阶段目标+足迹日历
    const nav = w.NAV;
    const foot = nav.find(s=>s.id==='footprint');
    if (foot && foot.subs.some(x=>x.id==='stage') && foot.subs.some(x=>x.id==='cal')) ok('减脂足迹含「阶段目标」「足迹日历」'); else no('减脂足迹缺少阶段目标/足迹日历');

    // 2. 同步键包含阶段数据
    if (w.YJXS_SYNC_KEYS && w.YJXS_SYNC_KEYS.indexOf('fatStages')>=0 && w.YJXS_SYNC_KEYS.indexOf('fatCurStage')>=0) ok('YJXS_SYNC_KEYS 含阶段数据'); else no('同步键缺失');

    // 3. 设置档案（起始/目标体重）
    w.Store.set('profile',{nickname:'',gender:'女',age:'',height:'',startWeight:'60',targetWeight:'50',step:'0.5',calorie:'1500',motto:''});

    // 4. 阶段目标：添加体重目标链
    w.state.sec='footprint'; w.state.sub.footprint='stage'; w.renderPage();
    if (!$('#fatName')){ no('阶段目标页未渲染'); }
    else {
      $('#fatName').value='第一阶段';
      $('#fatTargetWeight').value='57';
      $('#fatAdd').click();
      const stages = w.Store.get('fatStages',[]);
      if (stages.length>=1 && stages[stages.length-1].targetWeight===57) ok('阶段目标已按体重添加'); else no('阶段添加异常：'+JSON.stringify(stages));
      $('#fatName').value='第二阶段'; $('#fatTargetWeight').value='55'; $('#fatAdd').click();
      $('#fatName').value='第三阶段'; $('#fatTargetWeight').value='52'; $('#fatAdd').click();
      $('#fatName').value='第四阶段'; $('#fatTargetWeight').value='50'; $('#fatAdd').click();
      const s4 = w.Store.get('fatStages',[]);
      if (s4.length===4 && s4[3].targetWeight===50) ok('四阶段体重链已建立'); else no('四阶段链异常：'+JSON.stringify(s4.map(x=>x.targetWeight)));
    }

    // 5. 体重打卡推进自动完成阶段
    w.state.sec='footprint'; w.state.sub.footprint='weight'; w.renderPage();
    $('#wtInput').value='56.5';
    $('#wtSave').click();
    w.state.sub.footprint='stage'; w.renderPage();
    const cur1 = w.Store.get('fatCurStage',0);
    const st1 = w.Store.get('fatStages',[])[0];
    if (st1 && st1.done && cur1>=1) ok('体重降至 56.5 自动完成第一阶段并进入下一阶段'); else no('自动阶段推进失败 cur='+cur1+' done='+JSON.stringify(st1));

    // 6. 足迹日历渲染与布局
    w.state.sub.footprint='cal'; w.renderPage();
    if ($('#fatCalGrid') && $('#fatCalPrev') && $('#fatCalNext') && $('#fatCalDone')) ok('足迹日历渲染（fatCalGrid/导航/计数）'); else no('足迹日历渲染缺失');
    // CSS 应含 #fatCalGrid
    if (HTML.includes('#fatCalGrid{display:grid;grid-template-columns:repeat(7,1fr)')) ok('足迹日历 CSS 为 7 列网格'); else no('足迹日历 CSS 缺失');
    // 当天体重记录应显示在日历上
    const today = w.todayStr();
    if ($('#fatCalGrid').innerHTML.indexOf('56.5')>=0) ok('足迹日历显示今日体重 56.5'); else no('足迹日历未显示体重');

    // 7. 认真打卡日历（iframe）：导航按钮 + 左右滑动
    w.state.sec='record'; w.state.sub.record='calendar'; w.renderPage();
    if ($('#calPrev') && $('#calNext') && $('#calGrid')) ok('iframe 认真打卡日历含导航按钮与网格'); else no('iframe 日历导航缺失');
    const d0 = (w.state.calDate||new Date()).getMonth();
    $('#calNext').click();
    const d1 = (w.state.calDate||new Date()).getMonth();
    if (d1 !== d0) ok('iframe 点击「下月」可切换月份'); else no('iframe 月份切换无效');
    function fireSwipeOn(el,dx){
      // 用鼠标事件测试拖拽（bindCalSwipe 同时监听了 mouse）
      const start=new w.MouseEvent('mousedown',{clientX:100,clientY:50});
      const move=new w.MouseEvent('mousemove',{clientX:100+dx/2,clientY:50});
      const end=new w.MouseEvent('mouseup',{clientX:100+dx,clientY:50});
      el.dispatchEvent(start); el.dispatchEvent(move); el.dispatchEvent(end);
    }
    const mBefore=(w.state.calDate||new Date()).getMonth();
    fireSwipeOn($('#calGrid'),-80); // 左滑 → 下月
    const mAfter=(w.state.calDate||new Date()).getMonth();
    if (mAfter!==mBefore) ok('iframe 左滑手势触发切到下一月'); else no('iframe 左滑手势未触发');

    // 8. 足迹日历也可滑动
    w.state.sec='footprint'; w.state.sub.footprint='cal'; w.renderPage();
    const fmBefore=(w.state.fatCalDate||new Date()).getMonth();
    fireSwipeOn($('#fatCalGrid'),80); // 右滑 → 上月
    const fmAfter=(w.state.fatCalDate||new Date()).getMonth();
    if (fmAfter!==fmBefore) ok('足迹日历右滑手势触发切到上一月'); else no('足迹日历右滑未触发');

    // 9. 旧版阶段数据兼容迁移（target 天数 → targetWeight）
    w.Store.set('fatStages',[{name:'旧阶段',target:21,done:false}]);
    w.Store.set('fatCurStage',0);
    w.state.sub.footprint='stage'; w.renderPage();
    const migrated = w.Store.get('fatStages',[])[0];
    if (migrated && migrated.targetWeight && migrated.targetWeight>0) ok('旧版 target 天数阶段已迁移出 targetWeight'); else no('旧阶段迁移异常：'+JSON.stringify(migrated));

  }catch(e){
    no('测试执行抛错：'+e.message+'\n'+e.stack);
  }

  console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
  process.exit(fail===0?0:1);
}, 300);
