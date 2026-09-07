// 回归测试：20260907ap
// 验证：二级目录（记录中心/应对中心/成长中心/减脂足迹）可直接在板块栏上调整顺序
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const HTML = fs.readFileSync(require('path').join(ROOT, 'yuejixiangshou.html'), 'utf8');
const APP_JS = fs.readFileSync(require('path').join(ROOT, 'app.20260907ap.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(require('path').join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(require('path').join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(require('path').join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260907ap';
const SEC_IDS = ['record','cope','grow','footprint'];
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 108) ok('SW CACHE 已递增到 v108'); else no('SW CACHE 未递增到 v108');
if (INDEX.includes('app.20260907ap.js') && INDEX.includes('styles.20260907ap.css')) ok('index.html 引用 ap 文件'); else no('index.html 引用未更新');

// ── 静态标记 ──
if (/secOrder/.test(HTML)) ok('含 secOrder 排序数据'); else no('缺少 secOrder');
if (/YJXS_SYNC_KEYS=.*'secOrder'/.test(HTML)) ok('secOrder 已加入云端同步键'); else no('secOrder 未加入同步键');
if (/id="secOrderToggle"/.test(HTML)) ok('板块栏含 ⇄ 排序入口'); else no('缺少 ⇄ 排序入口');
if (/ordArrow/.test(HTML)) ok('编辑态含 ‹ › 移动箭头'); else no('缺少移动箭头');
if (/\.ordArrow\{/.test(HTML) && /\.secWrap\{/.test(HTML)) ok('箭头样式已定义'); else no('箭头样式缺失');

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
function secBtnIds(){ return $all('#secNav .secBtn').map(b=>b.getAttribute('data-sec')).filter(Boolean); }

setTimeout(function(){
  try{
    // 1. 默认顺序
    if (JSON.stringify(secBtnIds())===JSON.stringify(SEC_IDS)) ok('二级目录默认顺序：'+SEC_IDS.join('/')); else no('默认顺序异常: '+secBtnIds().join(','));

    // 2. 点 ⇄ 进入编辑态 → 出现 ‹ › 箭头
    $('#secOrderToggle').click();
    if (state_on(w)) ok('点 ⇄ 进入排序编辑态'); else no('未进入编辑态');
    const arrows = $all('#secNav .ordArrow');
    if (arrows.length===8) ok('4 个板块各有一对 ‹ › 箭头'); else no('箭头数量异常: '+arrows.length);

    // 3. 第一个板块的 ›：把「记录中心」右移一位
    const firstRight = arrows.find(a=>a.getAttribute('data-mv')==='record' && a.getAttribute('data-d')==='1');
    if (!firstRight || firstRight.disabled){ no('记录中心 › 不可用'); }
    else {
      firstRight.click();
      const ids = secBtnIds();
      if (ids[0]==='cope' && ids[1]==='record') ok('点 › 后记录中心右移一位'); else no('右移失败: '+ids.join(','));
      if (w.Store.get('secOrder',[])[0]==='cope') ok('顺序已持久化到 Store（会云端同步）'); else no('未持久化');
      // 刷新后仍保持
      w.renderNav();
      if (secBtnIds()[0]==='cope') ok('重绘后顺序保持'); else no('重绘后顺序丢失');
    }

    // 4. 端点箭头禁用
    const firstLeft = $all('#secNav .ordArrow').find(a=>a.getAttribute('data-mv')==='cope' && a.getAttribute('data-d')==='-1');
    if (firstLeft && firstLeft.disabled) ok('首个板块的 ‹ 已禁用'); else no('首个板块 ‹ 未禁用');

    // 5. ✓ 完成 退出编辑态
    const doneBtn = $('#secOrderToggle');
    if (doneBtn.textContent.indexOf('完成')>=0) ok('编辑态按钮变为「✓ 完成」'); else no('完成按钮文案异常: '+doneBtn.textContent);
    doneBtn.click();
    if (!state_on(w)) ok('点「✓ 完成」退出编辑态'); else no('未退出编辑态');
    if ($all('#secNav .ordArrow').length===0) ok('退出后箭头隐藏'); else no('退出后仍有箭头');
    // 退出后点击板块仍能正常切换
    $all('#secNav .secBtn').find(b=>b.getAttribute('data-sec')==='footprint').click();
    if (w.state.sec==='footprint') ok('排序后点击板块仍可正常切换'); else no('点击切换异常');

    // 6. 设置页板块排序仍可用
    w.state.sec='grow'; w.state.sub.grow='settings'; w.renderPage();
    const area = $('#sortArea');
    if (area && area.innerHTML.indexOf('板块（二级目录）顺序')>=0) ok('设置页「板块（二级目录）顺序」仍在'); else no('设置页板块排序区丢失');

  }catch(e){ no('测试执行异常: '+e.message); }
  console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
  process.exit(fail===0?0:1);
}, 300);

function state_on(w){ return !!w.state.secOrderMode; }
