const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260824o.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'styles.20260824o.css'), 'utf8');

const BUILD = '20260824o';
let fail = 0;
function ok(msg) { console.log('✅', msg); }
function no(msg) { console.log('❌', msg); fail++; }

// 1. 版本一致性
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const htmlRefs = [...HTML.matchAll(/(app|styles)\.[0-9a-z]+\.(js|css)/g)].map(m => m[0]);
if (htmlRefs.includes(`app.${BUILD}.js`) && htmlRefs.includes(`styles.${BUILD}.css`)) ok('index.html 引用带版本号文件'); else no('index.html 引用不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1], 10) === 81) ok('SW CACHE 已递增到 v81'); else no('SW CACHE 未递增');
const swRefs = [...SW.matchAll(/app\.[0-9a-z]+\.js|styles\.[0-9a-z]+\.css/g)];
if (swRefs.some(r => r[0] === `app.${BUILD}.js`) && swRefs.some(r => r[0] === `styles.${BUILD}.css`)) ok('sw.js SHELL 包含新版本文件'); else no('sw.js SHELL 引用不一致');

// 2. jsdom 运行 app.js 并测试抄写工坊
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"><nav id="sidebarNav"></nav><main class="main"><div id="pageTitle"></div><div id="content"></div></main></div><div id="settingsModal" style="display:none"><input id="settingTargetPoints" value="460"><span id="settingCurrentPoints">—</span><span id="settingCurrentRank">—</span><button id="settingUnfreezeAchv" style="display:none"></button></div><div id="uiModal" style="display:none"><div class="ui-modal-card"><div class="ui-modal-title"></div><div class="ui-modal-msg"></div><input id="uiModalInput" style="display:none"><div class="ui-modal-actions"><button id="uiModalCancel">取消</button><button id="uiModalOk">确定</button></div></div></div><div id="toast"></div></body></html>', {
    url: 'https://guyi918918-bit.github.io/growtree/',
    pretendToBeVisual: true,
    resources: 'usable',
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

global.state = { data: { game: {}, points: { history: [], earned: 0, used: 0 }, checkIns: [], wishes: [], wishBin: [], modules: [], dailyPlans: {}, settings: {}, engHistory: { search: [], copy: [], copyCount: 0 } }, currentModule: 'english', currentSubTab: { engHistoryTab: 'copy' }, _deferredRender: false };

new Function(APP_JS)();

const content = document.getElementById('content');
content.innerHTML = `
    <input type="text" id="engTranslateInput" value="我刚刚中午去爬坡了 20 分钟">
    <div class="eng-lesson-output" id="engLessonOutput"></div>
    <div class="eng-copy-bar">
        <div class="eng-copy-stats">已抄 <strong id="engCopyCount">0</strong> 次</div>
        <div class="eng-copy-actions">
            <button class="eng-btn" data-action="eng-copy">抄写</button>
            <button class="eng-btn" data-action="eng-save-table">保存</button>
        </div>
    </div>
`;
global.engCurrentLesson = { zh: '', en: '', fullHtml: '' };

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
vm.runInContext(APP_JS, ctx);
const run = (code) => vm.runInContext(code, ctx);

// 完整初始化游戏/积分等状态，避免后续 render()/home() 因缺字段崩溃
run('ensureGameDefaults();');

// 初始化英语模块必要状态
run(`
    engCurrentLesson = { zh: '我刚刚中午去爬坡了 20 分钟', en: 'I just went uphill for 20 minutes at noon.', fullHtml: '' };
    var output = document.getElementById('engLessonOutput');
    output.innerHTML = engGenerateOutput(engCurrentLesson.zh, 8);
`);
const table = document.getElementById('engManualTable');
if (table) ok('表格已生成'); else no('表格未生成');
const headers = table.querySelectorAll('thead th');
if (headers.length === 4) ok('表头为 4 列'); else no(`表头列数错误：${headers.length}`);
const rows = table.querySelectorAll('tbody tr');
if (rows.length === 8) ok('表格 8 行'); else no(`表格行数错误：${rows.length}`);
const pencils = table.querySelectorAll('[data-action="eng-row-edit"]');
if (pencils.length === 8) ok('每行都有铅笔按钮'); else no(`铅笔按钮数量错误：${pencils.length}`);
const aiLinks = document.querySelectorAll('#engAiLinks [data-action^="eng-ai-"]');
if (aiLinks.length === 3) ok('AI 链接 3 个'); else no(`AI 链接数量错误：${aiLinks.length}`);

// 行操作
run(`var t = document.getElementById('engManualTable'); var inputs = t.querySelectorAll('tbody tr:nth-child(2) input'); inputs.forEach((inp, i) => { if (i > 0) inp.value = 'test' + i; }); engInsertRow(0, 'above');`);
let rowsAfterInsert = document.querySelectorAll('#engManualTable tbody tr').length;
if (rowsAfterInsert === 9) ok('上方插入行后 9 行'); else no(`插入后行数错误：${rowsAfterInsert}`);
run(`engMoveRow(0, 'down');`);
let label0 = document.querySelector('#engManualTable tbody tr:first-child .eng-label-input').value;
let label1 = document.querySelector('#engManualTable tbody tr:nth-child(2) .eng-label-input').value;
if (label0 === '主语' && label1 === '成分1') ok('行下移交换成功'); else no(`行下移交换失败：${label0}, ${label1}`);
run(`engDeleteRow(0);`);
let rowsAfterDelete = document.querySelectorAll('#engManualTable tbody tr').length;
if (rowsAfterDelete === 8) ok('删除行后回到 8 行'); else no(`删除后行数错误：${rowsAfterDelete}`);

// 5. 保存历史（手动保存按钮）→ 应写入 state.data.engHistory.copy，且不再写 localStorage engPlay_copy
run(`
    var t2 = document.getElementById('engManualTable');
    t2.querySelectorAll('tbody tr').forEach((tr, r) => { tr.querySelectorAll('.eng-cell-input').forEach((inp, c) => { inp.value = 'r' + r + 'c' + c; }); });
    var pat = document.getElementById('engSentencePattern'); if (pat) pat.textContent = '主-系-表';
    engSaveTableToHistory();
`);
const copyInState = run('state.data.engHistory.copy');
if (copyInState.length > 0 && copyInState[0].table && Array.isArray(copyInState[0].table.rows)) {
    ok('保存的历史写入 state.data.engHistory.copy 且含 table');
    if (copyInState[0].table.rows[0][0] === 'r0c0') ok('历史表格内容正确'); else no('历史表格内容错误');
    if (copyInState[0].pattern === '主-系-表') ok('历史保存了句型分析'); else no('历史未保存句型分析');
} else {
    no('保存的历史未写入 state.data.engHistory.copy');
}
const legacyLocal = global.localStorage.getItem('engPlay_copy');
if (!legacyLocal) ok('保存不再写入旧 localStorage engPlay_copy（跨设备同步一致）'); else no('仍写入旧 localStorage engPlay_copy');

// 6. RENDER 测试：渲染抄写历史详情，英文 + 表格必须出现在 DOM 字符串中
run(`
    state.data.engHistory.copy = [{
        time: new Date().toISOString(),
        zh: '我爱学习',
        en: 'I love studying',
        pattern: '主谓宾',
        detail: '',
        table: { labels: ['主语','谓语','宾语'], rows: [['我','I','我'],['爱','love','爱'],['学习','studying','学习']] }
    }];
    state.currentSubTab = state.currentSubTab || {}; state.currentSubTab.engHistoryTab = 'copy';
`);
const renderedHtml = run('engRenderHistoryListHTML()');
if (renderedHtml.includes('I love studying')) ok('渲染的历史详情包含英文翻译'); else no('渲染的历史详情缺少英文翻译');
if (renderedHtml.includes('<td') && renderedHtml.includes('studying')) ok('渲染的历史详情包含表格单元格'); else no('渲染的历史详情缺少表格');
if (renderedHtml.includes('eng-copy-detail-wrap') && renderedHtml.includes('中文原句')) ok('渲染的历史详情包裹与中文原句完整'); else no('历史详情包裹结构缺失');

// 7. 单条删除：更新 state.data.engHistory + 计数
run(`
    state.data.engHistory = { search: [{query:'a',time:new Date().toISOString()},{query:'b',time:new Date().toISOString()}], copy: [{zh:'x',en:'X',time:new Date().toISOString()},{zh:'y',en:'Y',time:new Date().toISOString()}], copyCount: 2 };
    engDeleteHistoryItem('search', 0);
`);
const searchAfter = run('state.data.engHistory.search');
if (searchAfter.length === 1 && searchAfter[0].query === 'b') ok('单条删除搜索历史后保留正确项'); else no(`搜索历史单条删除异常：${JSON.stringify(searchAfter)}`);
run(`engDeleteHistoryItem('copy', 1);`);
const copyAfter = run('state.data.engHistory.copy');
const copyCountAfter = run('state.data.engHistory.copyCount');
if (copyAfter.length === 1 && copyAfter[0].zh === 'x' && copyCountAfter === 1) ok('单条删除抄写历史后保留正确项且计数减一'); else no(`抄写历史单条删除异常：${JSON.stringify(copyAfter)}, count=${copyCountAfter}`);

// 8. 清空历史：engClearAllHistory 重置 state.data.engHistory
run(`engClearAllHistory();`);
const cleared = run('state.data.engHistory');
if (cleared.search.length === 0 && cleared.copy.length === 0 && cleared.copyCount === 0) ok('清空历史后 state.data.engHistory 已重置'); else no('清空历史未完全重置');

// 9. 段位校准测试
run(`
    state.data.points.history = [{ points: 460, type: 'base', date: '2026-08-24', reason: '测试积分' }];
    state.data.game.rankStars = 0; state.data.game.accountedEarnedStars = 0;
    state.data.game._pointsCalibrated = null;
    initGame();
`);
const game = run('state.data.game');
if (game.rankStars === 4 && game.accountedEarnedStars === 4) ok('460 积分校准为 4 星（青铜 II）'); else no(`段位校准错误：rankStars=${game.rankStars}`);
const tier = run('getTierInfo(state.data.game.rankStars)');
if (tier.rankName === '倔强青铜' && tier.roman === 'Ⅱ') ok('段位显示为 倔强青铜Ⅱ'); else no(`段位显示错误：${tier.rankName}${tier.roman}`);

// 10. 设置页 resetPointsToTarget 同步清空已使用积分
run(`
    state.data.points = { earned: 99999, used: 460, history: [] };
    state.data.wishes = [{ id: 'w1', name: '测试心愿', points: 460, exchanged: true, exchangedAt: '2026-08-24' }];
    state.data.game = state.data.game || {}; state.data.game.rankStars = 999; state.data.game.accountedEarnedStars = 999; state.data.game._achievementsFrozen = false;
    resetPointsToTarget(460);
`);
const afterPts = run('state.data.points');
const afterWish = run('state.data.wishes[0]');
if (afterPts.earned === 460 && afterPts.used === 0) ok('校准 460 分后 earned=460、used=0'); else no(`校准后积分错误：earned=${afterPts.earned}, used=${afterPts.used}`);
if (afterWish && !afterWish.exchanged) ok('校准后已兑换心愿已恢复未兑换'); else no('校准后心愿仍标记为已兑换');

// 11. 成就冻结
run(`
    state.data.game.achievements = {}; state.data.game._achievementsFrozen = true;
    state.data.points.history = [{ points: 100000, type: 'base', date: '2026-08-24' }];
    checkAchievements();
`);
const frozenAchv = run('state.data.game.achievements');
if (Object.keys(frozenAchv).length === 0) ok('成就冻结时 checkAchievements 不会解锁新成就'); else no('成就冻结被突破');
run('state.data.game._achievementsFrozen = false;');

// 12. 历史上的今天：兜底函数 + 多源函数存在
const fallback = run('buildHistoryFallback("08","25")');
if (Array.isArray(fallback) && fallback.length > 0 && fallback[0].year && fallback[0].title) ok('历史上的今天兜底函数返回事件列表'); else no('历史上的今天兜底函数异常');
if (APP_JS.includes('async function fetchHistoryWiki') && APP_JS.includes('async function fetchHistoryMuffin') && APP_JS.includes('async function fetchHistoryZh')) ok('历史上的今天多源抓取函数已存在（带超时，不会永久挂起）'); else no('历史上的今天多源函数缺失');
if (APP_JS.includes('fetchWithTimeout')) ok('fetchWithTimeout 超时保护已加入'); else no('缺少超时保护');

// 13. 历史详情样式
if (CSS.includes('.eng-history-detail .eng-manual-table') && CSS.includes('table-layout:auto') && CSS.includes('min-width:520px')) ok('历史详情表格自适应样式已添加'); else no('历史详情表格样式缺失');
if (CSS.includes('.eng-copy-detail-wrap') && CSS.includes('.eng-copy-detail-line')) ok('历史详情内容包裹样式已添加'); else no('历史详情内容包裹样式缺失');
if (CSS.includes('.eng-history-muted')) ok('历史详情弱化提示样式已添加'); else no('历史详情弱化提示样式缺失');

if (fail === 0) {
    console.log('\n🎉 全部测试通过');
    process.exit(0);
} else {
    console.log(`\n⚠️ ${fail} 项测试失败`);
    process.exit(1);
}
