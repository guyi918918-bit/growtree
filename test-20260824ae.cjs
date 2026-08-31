const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260824ae.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'styles.20260824ae.css'), 'utf8');

const BUILD = '20260824ae';
let fail = 0;
function ok(msg) { console.log('✅', msg); }
function no(msg) { console.log('❌', msg); fail++; }

// 1. 版本一致性
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const htmlRefs = [...HTML.matchAll(/(app|styles)\.[0-9a-z]+\.(js|css)/g)].map(m => m[0]);
if (htmlRefs.includes(`app.${BUILD}.js`) && htmlRefs.includes(`styles.${BUILD}.css`)) ok('index.html 引用带版本号文件'); else no('index.html 引用不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1], 10) === 97) ok('SW CACHE 已递增到 v97'); else no('SW CACHE 未递增');
const swRefs = [...SW.matchAll(/app\.[0-9a-z]+\.js|styles\.[0-9a-z]+\.css|yuejixiangshou\.html/g)];
if (swRefs.some(r => r[0] === `app.${BUILD}.js`) && swRefs.some(r => r[0] === `styles.${BUILD}.css`) && swRefs.some(r => r[0] === 'yuejixiangshou.html')) ok('sw.js SHELL 包含新版本文件 + yuejixiangshou.html'); else no('sw.js SHELL 引用不一致');

// 2. 健康减脂代码已彻底清除
if (!APP_JS.includes("{ id: 'fatloss', name: '健康减脂', icon: '🥗' }")) ok('MODULES 已移除健康减脂'); else no('MODULES 仍含健康减脂');
if (!APP_JS.includes('FATLOSS_TABS')) ok('FATLOSS_TABS 已删除'); else no('FATLOSS_TABS 仍存在');
if (!APP_JS.includes('function flHandleCheckin')) ok('flHandleCheckin 已删除'); else no('flHandleCheckin 仍存在');
if (!APP_JS.includes('function renderFatlossPage')) ok('renderFatlossPage 已删除'); else no('renderFatlossPage 仍存在');
if (!APP_JS.includes('flBindAfterRender')) ok('flBindAfterRender 已删除'); else no('flBindAfterRender 仍存在');
if (!APP_JS.includes('FL_ONLINE_RECIPES')) ok('FL_ONLINE_RECIPES 已删除'); else no('FL_ONLINE_RECIPES 仍存在');
if (!CSS.includes('.fl-page')) ok('健康减脂样式 .fl-page 已删除'); else no('健康减脂样式仍存在');

// 3. jsdom 运行 app.js 并测试 yjxs 接入
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"><nav id="sidebarNav"></nav><main class="main"><div id="pageTitle"></div><div id="content"></div></main></div><div id="settingsModal" style="display:none"></div><div id="toast"></div></body></html>', {
    url: 'https://guyi918918-bit.github.io/growtree/',
    pretendToBeVisual: true,
});
const win = dom.window;
global.window = win;
global.document = win.document;
global.navigator = win.navigator;
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
};
global.location = win.location;
global.alert = () => {};
global.fetch = () => Promise.resolve({ ok: false, text: () => Promise.resolve('') });

global.state = { data: { game: {}, points: { history: [], earned: 0, used: 0 }, checkIns: [], wishes: [], wishBin: [], modules: [], dailyPlans: {}, settings: {}, engHistory: { search: [], copy: [], copyCount: 0 } }, currentModule: 'yjxs', currentSubTab: {}, _deferredRender: false };

new Function(APP_JS)();

const vm = require('vm');
const ctx = {
    document, window, navigator,
    localStorage: global.localStorage,
    location: win.location,
    alert: () => {},
    fetch: () => Promise.resolve({ ok: false, text: () => Promise.resolve('') }),
    state: global.state,
    console, setTimeout,
    Date,
};
vm.createContext(ctx);
const appState = vm.runInContext(APP_JS + '\n;state;', ctx);
ctx.state = appState;
global.state = appState;
const run = (code) => vm.runInContext(code, ctx);

if (run('typeof flHandleCheckin') === 'undefined') ok('运行期 flHandleCheckin 已不存在'); else no('运行期 flHandleCheckin 仍存在');
if (run('typeof renderFatlossPage') === 'undefined') ok('运行期 renderFatlossPage 已不存在'); else no('运行期 renderFatlossPage 仍存在');

// 4. yjxs 模块接入
if (APP_JS.includes("{ id: 'yjxs', name: '悦己享瘦', icon: '🌿' }")) ok('MODULES 已加入悦己享瘦'); else no('MODULES 未加入悦己享瘦');
const yjxsHtml = run('moduleRenderers.yjxs()');
if (typeof yjxsHtml === 'string' && yjxsHtml.includes('yjxs-host') && yjxsHtml.includes('yuejixiangshou.html')) ok('moduleRenderers.yjxs 返回 iframe 容器'); else no('yjxs 渲染器异常');

// 5. normalizeModules 迁移：移除 fatloss、补入 yjxs
run("state.data.modules = [{id:'home',name:'首页',icon:'🌳',hidden:false},{id:'fatloss',name:'健康减脂',icon:'🥗',hidden:false},{id:'points',name:'积分',icon:'⭐',hidden:false}];");
const changed1 = run('normalizeModules()');
const mods1 = run('state.data.modules');
if (changed1 === true) ok('normalizeModules 检测到变更'); else no('normalizeModules 未检测到变更');
if (!mods1.some(m => m.id === 'fatloss') && mods1.some(m => m.id === 'yjxs')) ok('迁移后：无 fatloss、有 yjxs'); else no('迁移结果异常：' + JSON.stringify(mods1.map(m => m.id)));
const yjxsIdx = mods1.findIndex(m => m.id === 'yjxs');
const fatlossIdx = mods1.findIndex(m => m.id === 'fatloss');
if (fatlossIdx < 0 && yjxsIdx === 1) ok('yjxs 已替换原 fatloss 位置（索引 1）'); else no('yjxs 位置异常 idx=' + yjxsIdx);

run("state.data.modules = [{id:'home',name:'首页',icon:'🌳'}];");
run('normalizeModules()');
const mods2 = run('state.data.modules');
if (mods2.some(m => m.id === 'yjxs')) ok('全新模块列表也能补入 yjxs'); else no('全新列表未补入 yjxs');

// 6. 渲染冒烟：yjxs 与其他模块均不报错
run('ensureGameDefaults();');
try {
    run("state.currentModule='yjxs'; render();");
    const c = document.getElementById('content').innerHTML;
    if (c.includes('yjxs-host') && c.includes('yuejixiangshou.html')) ok('render(yjxs) 输出 iframe 容器'); else no('render(yjxs) 内容异常');
} catch (e) { no('render(yjxs) 抛出异常：' + (e && e.message)); }

['points', 'checkin', 'treehole', 'study'].forEach(m => {
    try {
        run(`state.currentModule='${m}'; render();`);
        const c = document.getElementById('content').innerHTML;
        if (c && c.length > 0) ok(`render(${m}) 正常输出`); else no(`render(${m}) 输出为空`);
    } catch (e) { no('render(' + m + ') 抛出异常：' + (e && e.message)); }
});

['home', 'beauty', 'hot', 'water', 'english'].forEach(m => {
    try {
        run(`state.currentModule='${m}'; render();`);
        ok(`render(${m}) 未抛出异常`);
    } catch (e) { no('render(' + m + ') 抛出异常：' + (e && e.message)); }
});

console.log('\n==== 测试结果 ====');
console.log(fail === 0 ? '🎉 全部通过' : ('❌ 失败 ' + fail + ' 项'));
process.exit(fail === 0 ? 0 : 1);
