// 回归测试：20260907ao
// 验证：悦己享瘦二级目录（板块）可自定义排序（设置页 ↑↓ 移动 + 保存 + 云端同步）
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const HTML = fs.readFileSync(require('path').join(ROOT, 'yuejixiangshou.html'), 'utf8');
const APP_JS = fs.readFileSync(require('path').join(ROOT, 'app.20260907ao.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(require('path').join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(require('path').join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(require('path').join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260907ao';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 107) ok('SW CACHE 已递增到 v107'); else no('SW CACHE 未递增到 v107');
if (INDEX.includes('app.20260907ao.js') && INDEX.includes('styles.20260907ao.css')) ok('index.html 引用 ao 文件'); else no('index.html 引用未更新');
if (SW.includes('./app.20260907ao.js') && SW.includes('./yuejixiangshou.html')) ok('sw.js SHELL 含 ao 文件与 yjxs 页面'); else no('sw.js SHELL 未更新');

// ── 静态标记 ──
if (/secOrder/.test(HTML)) ok('页面含 secOrder 排序数据'); else no('缺少 secOrder');
if (/YJXS_SYNC_KEYS=.*'secOrder'/.test(HTML)) ok('secOrder 已加入云端同步键'); else no('secOrder 未加入同步键');
if (/function getOrderedSecs/.test(HTML)) ok('存在 getOrderedSecs 排序函数'); else no('缺少 getOrderedSecs');
if (/secmv/.test(HTML)) ok('设置页含板块排序 ↑↓ 按钮'); else no('缺少板块排序按钮');
if (/板块（二级目录）顺序/.test(HTML)) ok('设置页含板块排序区标题'); else no('缺少板块排序区');

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
function $all(sel){ return Array.from(doc.querySelectorAll(sel)); }

setTimeout(function(){
  try{
    // 1. 同步键与默认值
    if (w.YJXS_SYNC_KEYS.indexOf('secOrder')>=0) ok('运行时 YJXS_SYNC_KEYS 含 secOrder'); else no('运行时同步键缺 secOrder');
    const defOrder = w.NAV.map(s=>s.id);
    const stored = w.Store.get('secOrder', null);
    if (Array.isArray(stored) && stored.length===defOrder.length) ok('initData 已初始化 secOrder（'+stored.length+' 个板块）'); else no('secOrder 默认值异常: '+JSON.stringify(stored));

    // 2. getOrderedSecs 默认返回 NAV 顺序
    const secs1 = w.getOrderedSecs();
    if (JSON.stringify(secs1.map(s=>s.id))===JSON.stringify(defOrder)) ok('getOrderedSecs 默认顺序 = NAV 定义顺序'); else no('getOrderedSecs 默认顺序异常');

    // 3. renderNav 按顺序渲染二级按钮
    w.renderNav();
    let btnIds = $all('#secNav .secBtn').map(b=>b.getAttribute('data-sec'));
    if (JSON.stringify(btnIds)===JSON.stringify(defOrder)) ok('二级导航按默认顺序渲染'); else no('二级导航渲染顺序异常: '+btnIds.join(','));

    // 4. 模拟用户移动：把「减脂足迹」移到最前 → 导航应跟随
    const arr = w.Store.get('secOrder',[]);
    const idx = arr.indexOf('footprint');
    arr.splice(idx,1); arr.unshift('footprint');
    w.Store.set('secOrder', arr);
    w.renderNav();
    btnIds = $all('#secNav .secBtn').map(b=>b.getAttribute('data-sec'));
    if (btnIds[0]==='footprint') ok('移动后二级导航顺序跟随 secOrder'); else no('导航未跟随排序: '+btnIds.join(','));
    const secs2 = w.getOrderedSecs();
    if (secs2[0].id==='footprint') ok('getOrderedSecs 跟随排序'); else no('getOrderedSecs 未跟随');

    // 5. 设置页：板块排序 UI 存在且可用
    w.state.sec='grow'; w.state.sub.grow='settings'; w.renderPage();
    const area = $('#sortArea');
    if (!area){ no('设置页未渲染 #sortArea'); }
    else {
      if (area.innerHTML.indexOf('板块（二级目录）顺序')>=0) ok('设置页显示「板块（二级目录）顺序」'); else no('设置页缺板块排序区');
      const secmvs = $all('#sortArea .secmv');
      if (secmvs.length===8) ok('板块排序 ↑↓ 按钮齐全（4 板块 × 2）'); else no('板块按钮数量异常: '+secmvs.length);
      // 点击第一个板块的 ↓：footprint(0) 与下一板块交换
      const down = secmvs.find(b=>b.getAttribute('data-i')==='0' && b.getAttribute('data-d')==='1');
      const before = w.Store.get('secOrder',[]).join(',');
      if (down && !down.disabled){ down.click(); } else { no('第一个板块的 ↓ 按钮不可用'); }
      const after = w.Store.get('secOrder',[]).join(',');
      if (before!==after) ok('点击 ↓ 后 secOrder 已交换并持久化'); else no('点击 ↓ 未改变 secOrder');
      // 保存按钮存在
      if ($('#saveSort')) ok('「保存排序」按钮存在'); else no('缺少保存排序按钮');
    }

    // 6. 恢复默认
    const rs = $('#resetSort');
    if (rs){ rs.click(); const cur=w.Store.get('secOrder',[]);
      if (JSON.stringify(cur)===JSON.stringify(defOrder)) ok('恢复默认后 secOrder 回到初始顺序'); else no('恢复默认失败');
    } else no('缺少恢复默认按钮');

    // 7. 切换板块仍正常（switchSec 走排序后列表）
    w.switchSec('record');
    if (w.state.sec==='record') ok('switchSec 正常'); else no('switchSec 异常');

  }catch(e){ no('测试执行异常: '+e.message); }
  console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
  process.exit(fail===0?0:1);
}, 300);
