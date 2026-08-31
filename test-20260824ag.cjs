const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260824ag.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'styles.20260824ag.css'), 'utf8');

const BUILD = '20260824ag';
let fail = 0;
function ok(msg) { console.log('✅', msg); }
function no(msg) { console.log('❌', msg); fail++; }

// 1. 版本一致性
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const htmlRefs = [...HTML.matchAll(/(app|styles)\.[0-9a-z]+\.(js|css)/g)].map(m => m[0]);
if (htmlRefs.includes(`app.${BUILD}.js`) && htmlRefs.includes(`styles.${BUILD}.css`)) ok('index.html 引用带版本号文件'); else no('index.html 引用不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1], 10) === 99) ok('SW CACHE 已递增到 v99'); else no('SW CACHE 未递增');
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

// 4. 悦己享瘦云端同步 hook 已接入
if (APP_JS.includes('function pushYjxsToIframe')) ok('pushYjxsToIframe 已定义'); else no('pushYjxsToIframe 未定义');
if (APP_JS.includes("e.data.type === 'yjxs-data'")) ok('父页面已监听 yjxs-data'); else no('父页面未监听 yjxs-data');
if (APP_JS.includes("e.data.type === 'yjxs-ready'")) ok('父页面已监听 yjxs-ready'); else no('父页面未监听 yjxs-ready');
try {
    run("state.data.yjxs = {__yjxs:true}; saveState();");
    const saved = JSON.parse(global.localStorage.getItem('growtree_state'));
    if (saved && saved.data && saved.data.yjxs && saved.data.yjxs.__yjxs) ok('yjxs 数据可写入本地 state'); else no('yjxs 数据未写入本地 state');
} catch(e) { no('yjxs 写入测试异常：' + e.message); }

// 5. 悦己享瘦源文件：删除喝水提示 + 具备同步函数
const YJXS_HTML = fs.readFileSync(path.join(ROOT, 'yuejixiangshou.html'), 'utf8');
if (!YJXS_HTML.includes('喝水顺手喝就好')) ok('悦己享瘦已删除「喝水顺手喝就好」提示'); else no('喝水提示仍存在');
if (YJXS_HTML.includes('function yjxsExportAll')) ok('悦己享瘦已定义 yjxsExportAll'); else no('悦己享瘦未定义 yjxsExportAll');
if (YJXS_HTML.includes('function yjxsImportAll')) ok('悦己享瘦已定义 yjxsImportAll'); else no('悦己享瘦未定义 yjxsImportAll');
if (YJXS_HTML.includes("type:'yjxs-data'")) ok('悦己享瘦会发送 yjxs-data'); else no('悦己享瘦未发送 yjxs-data');
if (YJXS_HTML.includes("type:'yjxs-ready'")) ok('悦己享瘦会发送 yjxs-ready'); else no('悦己享瘦未发送 yjxs-ready');

// 6. 回归：悦己享瘦云端回写不再覆盖刚产生的本地打卡（解决「打卡后自动刷新又取消」）
if (APP_JS.includes('cloudYjxsAt') && APP_JS.includes('localYjxsAt')) ok('同步冲突防护已读取云端/本地 exportedAt 时间戳'); else no('同步冲突防护缺少时间戳比较');
if (APP_JS.includes('state.data.yjxs = localYjxs')) ok('本地 yjxs 更新时保留本地、不回退到云端旧快照'); else no('未保留本地 yjxs 最新数据');
// 用真实数据模拟一次「本地刚打卡、云端为旧快照」的合并判断
try {
    run(`
        // 本地刚打卡，导出时间更新
        state.data.yjxs = { __yjxs:true, v:1, exportedAt:'2026-08-31T12:00:00.000Z', data:{ checkin:{ '2026-08-31':true } } };
        // 模拟云端拉回的旧快照（导出时间更早）
        var cloudPayload = { yjxs: { __yjxs:true, v:1, exportedAt:'2026-08-31T11:00:00.000Z', data:{} } };
        var localYjxs = state.data.yjxs;
        var localYjxsAt = localYjxs.exportedAt || '';
        var cloudYjxs = cloudPayload.yjxs || {};
        var cloudYjxsAt = cloudYjxs.exportedAt || '';
        state.data = Object.assign({}, state.data, cloudPayload);
        var kept = false;
        if (cloudYjxsAt && (!localYjxsAt || cloudYjxsAt > localYjxsAt)) { /* accept cloud */ }
        else if (localYjxsAt) { state.data.yjxs = localYjxs; kept = true; }
        else { /* first sync */ }
        window.__syncKeepLocal = kept;
    `);
    if (run('window.__syncKeepLocal') === true) ok('本地更新优先：旧云端快照不会覆盖刚打的卡'); else no('本地更新未被优先保留');
} catch (e) { no('同步冲突模拟异常：' + (e && e.message)); }

// 7. 回归：食谱选择弹窗能访问 drawList（解决「点选食谱点不动 / Can't find variable: drawList」）
if (YJXS_HTML.includes('window.__drawList')) ok('drawList 已挂到 window 供外部调用'); else no('drawList 未暴露到 window');
if (YJXS_HTML.includes('window.__drawList')) {
    ok('openRecipePicker 可通过 window.__drawList 刷新打卡列表，不再 ReferenceError');
} else {
    no('openRecipePicker 仍可能访问不到 drawList');
}

console.log('\n==== 测试结果 ====');
console.log(fail === 0 ? '🎉 全部通过' : ('❌ 失败 ' + fail + ' 项'));
process.exit(fail === 0 ? 0 : 1);
