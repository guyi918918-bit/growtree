// 回归测试：20260831ak
// 验证：体重打卡首页用「当前阶段」卡片替换旧的「我的减重目标」区域，首页只关注最近一个小目标
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const HTML = fs.readFileSync(require('path').join(ROOT, 'yuejixiangshou.html'), 'utf8');
const APP_JS = fs.readFileSync(require('path').join(ROOT, 'app.20260831ak.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(require('path').join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(require('path').join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(require('path').join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260831ak';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 103) ok('SW CACHE 已递增到 v103'); else no('SW CACHE 未递增到 v103');
if (INDEX.includes('app.20260831ak.js') && INDEX.includes('styles.20260831ak.css')) ok('index.html 引用 ak 文件'); else no('index.html 引用未更新');
if (SW.includes('./app.20260831ak.js') && SW.includes('./styles.20260831ak.css')) ok('sw.js SHELL 含 ak 文件'); else no('sw.js SHELL 未更新');
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

    // 5. 体重打卡首页：应显示「当前阶段」卡片，而不是旧「我的减重目标」四宫格
    w.state.sec='footprint'; w.state.sub.footprint='weight'; w.renderPage();
    const weightHtml = $('#inner-weight').innerHTML;
    if (weightHtml.indexOf('📍 当前阶段')>=0) ok('体重打卡首页显示「当前阶段」卡片'); else no('体重打卡首页未显示当前阶段卡片');
    if (weightHtml.indexOf('距阶段目标')>=0) ok('hero 区显示「距阶段目标」'); else no('hero 区未显示距阶段目标');
    if (weightHtml.indexOf('目标体重 <b>57</b>')>=0) ok('当前阶段卡显示目标体重 57kg'); else no('当前阶段卡未显示正确目标体重');
    if (weightHtml.indexOf('总阶梯')<0 && weightHtml.indexOf('步长')<0) ok('旧的四宫格目标概览已移除'); else no('旧的目标概览四宫格仍存在');

    // 6. 打卡后自动推进阶段
    $('#wtInput').value='56.5';
    $('#wtSave').click();
    w.state.sub.footprint='stage'; w.renderPage();
    const cur1 = w.Store.get('fatCurStage',0);
    const st1 = w.Store.get('fatStages',[])[0];
    if (st1 && st1.done && cur1>=1) ok('体重降至 56.5 自动完成第一阶段并进入下一阶段'); else no('自动阶段推进失败 cur='+cur1+' done='+JSON.stringify(st1));

    // 7. 体重打卡首页在阶段推进后应显示新的当前阶段
    w.state.sub.footprint='weight'; w.renderPage();
    const wHtml2 = $('#inner-weight').innerHTML;
    if (wHtml2.indexOf('📍 当前阶段：第二阶段')>=0 || wHtml2.indexOf('目标体重 <b>55</b>')>=0) ok('阶段推进后首页显示第二阶段'); else no('阶段推进后首页未正确显示下一阶段：'+wHtml2.slice(0,400));

    // 8. 足迹日历渲染与布局
    w.state.sub.footprint='cal'; w.renderPage();
    if ($('#fatCalGrid') && $('#fatCalPrev') && $('#fatCalNext') && $('#fatCalDone')) ok('足迹日历渲染（fatCalGrid/导航/计数）'); else no('足迹日历渲染缺失');
    if (HTML.includes('#fatCalGrid{display:grid;grid-template-columns:repeat(7,1fr)')) ok('足迹日历 CSS 为 7 列网格'); else no('足迹日历 CSS 缺失');
    if ($('#fatCalGrid').innerHTML.indexOf('56.5')>=0) ok('足迹日历显示今日体重 56.5'); else no('足迹日历未显示体重');

    // 9. 认真打卡日历（iframe）：导航按钮 + 左右滑动
    w.state.sec='record'; w.state.sub.record='calendar'; w.renderPage();
    if ($('#calPrev') && $('#calNext') && $('#calGrid')) ok('iframe 认真打卡日历含导航按钮与网格'); else no('iframe 日历导航缺失');
    const d0 = (w.state.calDate||new Date()).getMonth();
    $('#calNext').click();
    const d1 = (w.state.calDate||new Date()).getMonth();
    if (d1 !== d0) ok('iframe 点击「下月」可切换月份'); else no('iframe 月份切换无效');
    function fireSwipeOn(el,dx){
      const start=new w.MouseEvent('mousedown',{clientX:100,clientY:50});
      const move=new w.MouseEvent('mousemove',{clientX:100+dx/2,clientY:50});
      const end=new w.MouseEvent('mouseup',{clientX:100+dx,clientY:50});
      el.dispatchEvent(start); el.dispatchEvent(move); el.dispatchEvent(end);
    }
    const mBefore=(w.state.calDate||new Date()).getMonth();
    fireSwipeOn($('#calGrid'),-80);
    const mAfter=(w.state.calDate||new Date()).getMonth();
    if (mAfter!==mBefore) ok('iframe 左滑手势触发切到下一月'); else no('iframe 左滑手势未触发');

    // 10. 足迹日历也可滑动
    w.state.sec='footprint'; w.state.sub.footprint='cal'; w.renderPage();
    const fmBefore=(w.state.fatCalDate||new Date()).getMonth();
    fireSwipeOn($('#fatCalGrid'),80);
    const fmAfter=(w.state.fatCalDate||new Date()).getMonth();
    if (fmAfter!==fmBefore) ok('足迹日历右滑手势触发切到上一月'); else no('足迹日历右滑未触发');

  }catch(e){
    no('测试执行抛错：'+e.message+'\n'+e.stack);
  }

  console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
  process.exit(fail===0?0:1);
}, 300);
