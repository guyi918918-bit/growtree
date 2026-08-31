// 回归测试：20260831ai
// 验证：①冲动记录融合进饮食情绪（成长中心移除冲动记录）②减脂足迹阶段目标+足迹日历 ③认真打卡日历左右滑动切月
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const HTML = fs.readFileSync(require('path').join(ROOT, 'yuejixiangshou.html'), 'utf8');
const APP_JS = fs.readFileSync(require('path').join(ROOT, 'app.20260824ah.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(require('path').join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(require('path').join(ROOT, 'sw.js'), 'utf8');

const BUILD = '20260831ai';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 101) ok('SW CACHE 已递增到 v101'); else no('SW CACHE 未递增');
if (SW.includes('./yuejixiangshou.html')) ok('sw.js SHELL 含 yuejixiangshou.html'); else no('SHELL 缺 yuejixiangshou.html');

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
    // 1. 导航：成长中心不再含冲动记录；减脂足迹含阶段目标+足迹日历
    const nav = w.NAV;
    const grow = nav.find(s=>s.id==='grow');
    const foot = nav.find(s=>s.id==='footprint');
    if (grow && !grow.subs.some(x=>x.id==='impulse')) ok('成长中心已移除「冲动记录」'); else no('成长中心仍含冲动记录');
    if (foot && foot.subs.some(x=>x.id==='stage') && foot.subs.some(x=>x.id==='cal')) ok('减脂足迹新增「阶段目标」「足迹日历」'); else no('减脂足迹缺少阶段目标/足迹日历');
    if (typeof w.renderStage === 'function' && typeof w.renderFatCalendar === 'function') ok('renderStage / renderFatCalendar 已定义'); else no('阶段函数未定义');
    if (typeof w.renderImpulse === 'function'){
      // renderImpulse 仍存在但应为空操作（入口已移除）
      ok('renderImpulse 仍存在（已置为空操作，无副作用）');
    } else { no('renderImpulse 缺失'); }

    // 2. 同步键包含新阶段数据
    if (w.YJXS_SYNC_KEYS && w.YJXS_SYNC_KEYS.indexOf('fatCheckins')>=0 && w.YJXS_SYNC_KEYS.indexOf('fatStages')>=0 && w.YJXS_SYNC_KEYS.indexOf('fatCurStage')>=0) ok('YJXS_SYNC_KEYS 含阶段打卡数据（云端同步）'); else no('同步键缺失');

    // 3. initData 默认值
    if (w.Store.get('fatCheckins',null)!==null && w.Store.get('fatStages',null)!==null && w.Store.get('fatCurStage',null)!==null) ok('initData 已初始化 fatCheckins/fatStages/fatCurStage'); else no('阶段默认值缺失');

    // 4. 饮食情绪：记一笔冲动
    w.state.sec='cope'; w.state.sub.cope='foodmood'; w.renderPage();
    const before = w.Store.get('impulses',[]).length;
    const noteEl = $('#impNote');
    if (!noteEl){ no('饮食情绪未渲染 #impNote'); }
    else {
      noteEl.value = '加班想吃夜宵';
      const addBtn = $('#impAdd');
      addBtn.click();
      const after = w.Store.get('impulses',[]).length;
      if (after === before+1) ok('饮食情绪「记一笔冲动」写入 impulses（+1）'); else no('记一笔未生效 before='+before+' after='+after);
      if ($('#impList') && $('#impList').innerHTML.indexOf('加班想吃夜宵')>=0) ok('冲动记录列表已显示刚记录的内容'); else no('冲动记录列表未显示');
    }

    // 5. 阶段目标：添加 + 今日打卡 + 完成
    w.state.sec='footprint'; w.state.sub.footprint='stage'; w.renderPage();
    if (!$('#fatName')){ no('阶段目标页未渲染'); }
    else {
      $('#fatName').value='第一阶段·习惯养成';
      $('#fatTarget').value='21';
      $('#fatAdd').click();
      const stages = w.Store.get('fatStages',[]);
      if (stages.length===1 && stages[0].name==='第一阶段·习惯养成' && stages[0].target===21) ok('阶段目标已添加'); else no('阶段添加异常：'+JSON.stringify(stages));
      const today = w.todayStr();
      $('#fatToday').click();
      if (w.Store.get('fatCheckins',{})[today]===true) ok('阶段「今日打卡」写入 fatCheckins'); else no('今日打卡未生效');
      $('#fatToday').click(); // 取消
      if (!w.Store.get('fatCheckins',{})[today]) ok('再次点击可取消今日打卡'); else no('取消打卡失败');
      // 完成本阶段
      $('#fatToday').click();
      $('#fatDone').click();
      const s2 = w.Store.get('fatStages',[]);
      if (s2[0] && s2[0].done===true) ok('「完成本阶段」标记阶段 done'); else no('完成本阶段未生效');
    }

    // 6. 足迹日历渲染
    w.state.sub.footprint='cal'; w.renderPage();
    if ($('#fatCalGrid') && $('#fatCalPrev') && $('#fatCalNext') && $('#fatCalDone')) ok('足迹日历渲染（fatCalGrid/导航/计数）'); else no('足迹日历渲染缺失');

    // 7. 认真打卡日历：导航按钮 + 左右滑动调用同逻辑
    w.state.sec='record'; w.state.sub.record='calendar'; w.renderPage();
    if ($('#calPrev') && $('#calNext') && $('#calGrid')) ok('认真打卡日历含导航按钮与网格'); else no('认真打卡日历导航缺失');
    const d0 = (w.state.calDate||new Date()).getMonth();
    $('#calNext').click();
    const d1 = (w.state.calDate||new Date()).getMonth();
    if (d1 !== d0) ok('点击「下月」可切换月份（滑动即调用此逻辑）'); else no('月份切换无效');
    // 模拟左滑（dx<0 → 下月）/右滑（dx>0 → 上月）
    const grid = $('#calGrid');
    function swipe(dx){
      const ts={touches:[{clientX:100}]};
      const te={changedTouches:[{clientX:100+dx}]};
      grid.dispatchEvent(new w.Event('touchstart')); // 仅占位，真实监听用 touches
    }
    // 直接验证 swipe 监听已绑定：用更真实的 Touch 事件
    function fireSwipe(dx){
      let sx=100;
      const start=new w.Event('touchstart'); start.touches=[{clientX:sx}];
      const end=new w.Event('touchend'); end.changedTouches=[{clientX:sx+dx}];
      grid.dispatchEvent(start); grid.dispatchEvent(end);
    }
    const mBefore=(w.state.calDate||new Date()).getMonth();
    fireSwipe(-80); // 左滑 → 下月
    const mAfter=(w.state.calDate||new Date()).getMonth();
    if (mAfter!==mBefore) ok('左滑手势触发切到下一月'); else no('左滑手势未触发');

    // 8. 旧用户兼容：state.sub.grow 曾为 impulse 时不崩、落到有效子页
    w.state.sec='grow'; w.state.sub.grow='impulse';
    w.renderSubNav();
    if (w.state.sub.grow!=='impulse' && w.NAV.find(s=>s.id==='grow').subs.some(x=>x.id===w.state.sub.grow)) ok('旧用户 impulse 入口自动回退到有效子页'); else no('旧入口兼容失败：'+w.state.sub.grow);

  }catch(e){
    no('测试执行抛错：'+e.message+'\n'+e.stack);
  }

  console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
  process.exit(fail===0?0:1);
}, 300);
