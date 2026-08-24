const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260824i.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

const BUILD = '20260824i';
let fail = 0;
function ok(msg) { console.log('✅', msg); }
function no(msg) { console.log('❌', msg); fail++; }

// 1. 版本一致性
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const htmlRefs = [...HTML.matchAll(/(app|styles)\.[0-9a-z]+\.(js|css)/g)].map(m => m[0]);
if (htmlRefs.includes(`app.${BUILD}.js`) && htmlRefs.includes(`styles.${BUILD}.css`)) ok('index.html 引用带版本号文件'); else no('index.html 引用不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1], 10) === 75) ok('SW CACHE 已递增到 v75'); else no('SW CACHE 未递增');
const swRefs = [...SW.matchAll(/app\.[0-9a-z]+\.js|styles\.[0-9a-z]+\.css/g)];
if (swRefs.some(r => r[0] === `app.${BUILD}.js`) && swRefs.some(r => r[0] === `styles.${BUILD}.css`)) ok('sw.js SHELL 包含新版本文件'); else no('sw.js SHELL 引用不一致');

// 2. jsdom 运行 app.js 并测试抄写工坊
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"><main class="main"><div id="content"></div></main></div><div id="settingsModal" style="display:none"><input id="settingTargetPoints" value="460"><span id="settingCurrentPoints">—</span><span id="settingCurrentRank">—</span><button id="settingUnfreezeAchv" style="display:none"></button></div><div id="uiModal" style="display:none"><div class="ui-modal-card"><div class="ui-modal-title"></div><div class="ui-modal-msg"></div><input id="uiModalInput" style="display:none"><div class="ui-modal-actions"><button id="uiModalCancel">取消</button><button id="uiModalOk">确定</button></div></div></div><div id="toast"></div></body></html>', {
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

// 先初始化最小 state 对象，避免 app.js 顶部立即访问 state 报错
global.state = { data: { game: {}, points: { history: [], earned: 0, used: 0 }, checkIns: [], wishes: [], wishBin: [], modules: [], dailyPlans: {}, settings: {} }, currentModule: 'english', currentSubTab: {}, _deferredRender: false };

// 运行 app.js
new Function(APP_JS)();

// 3. 生成填表
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

// 暴露 engCurrentLesson 等变量到 global
global.engCurrentLesson = { zh: '', en: '', fullHtml: '' };

// 由于 app.js 内部变量不在 global，我们直接测试 HTML 输出函数可用性：
// 通过调用 if (typeof engGenerateOutput === 'function') 不可行，因为函数在 Function 局部作用域。
// 改为在 vm 中执行一个测试脚本。

const vm = require('vm');
const ctx = {
    document,
    window,
    navigator,
    localStorage: global.localStorage,
    location: win.location,
    alert: () => {},
    fetch: () => Promise.resolve({ ok: false, text: () => Promise.resolve('') }),
    state: global.state,
    console,
    setTimeout,
};
vm.createContext(ctx);
vm.runInContext(APP_JS, ctx);

// 现在 ctx 中已有 app.js 的所有函数
const run = (code) => vm.runInContext(code, ctx);

// 初始化英语模块必要状态
run(`
    engCurrentLesson = { zh: '我刚刚中午去爬坡了 20 分钟', en: 'I just went uphill for 20 minutes at noon.', fullHtml: '' };
    const output = document.getElementById('engLessonOutput');
    output.innerHTML = engGenerateOutput(engCurrentLesson.zh, 8);
`);

const table = document.getElementById('engManualTable');
if (table) ok('表格已生成'); else no('表格未生成');
const headers = table.querySelectorAll('thead th');
if (headers.length === 4) ok(`表头为 4 列（成分/英文/中文/备注）`); else no(`表头列数错误：${headers.length}`);
const rows = table.querySelectorAll('tbody tr');
if (rows.length === 8) ok(`表格 8 行`); else no(`表格行数错误：${rows.length}`);
const pencils = table.querySelectorAll('[data-action="eng-row-edit"]');
if (pencils.length === 8) ok(`每行都有铅笔按钮`); else no(`铅笔按钮数量错误：${pencils.length}`);
const menus = table.querySelectorAll('.eng-row-menu');
if (menus.length === 8) ok(`每行都有操作菜单`); else no(`操作菜单数量错误：${menus.length}`);
const aiLinks = document.querySelectorAll('#engAiLinks [data-action^="eng-ai-"]');
if (aiLinks.length === 3) ok(`AI 链接 3 个（豆包/千问/DeepSeek）`); else no(`AI 链接数量错误：${aiLinks.length}`);

// 4. 行操作测试
run(`
    var t = document.getElementById('engManualTable');
    // 先给第 2 行填点内容
    var inputs = t.querySelectorAll('tbody tr:nth-child(2) input');
    inputs.forEach((inp, i) => { if (i > 0) inp.value = 'test' + i; });
    // 在第 1 行上方插入一行
    engInsertRow(0, 'above');
`);
let rowsAfterInsert = document.querySelectorAll('#engManualTable tbody tr').length;
if (rowsAfterInsert === 9) ok(`上方插入行后 9 行`); else no(`插入后行数错误：${rowsAfterInsert}`);

run(`engMoveRow(0, 'down');`);
let label0 = document.querySelector('#engManualTable tbody tr:first-child .eng-label-input').value;
let label1 = document.querySelector('#engManualTable tbody tr:nth-child(2) .eng-label-input').value;
if (label0 === '主语' && label1 === '成分1') ok(`行下移交换成功`); else no(`行下移交换失败：${label0}, ${label1}`);

run(`engDeleteRow(0);`);
let rowsAfterDelete = document.querySelectorAll('#engManualTable tbody tr').length;
if (rowsAfterDelete === 8) ok(`删除行后回到 8 行`); else no(`删除后行数错误：${rowsAfterDelete}`);

// 5. 保存历史测试
run(`
    // 给表格填内容并保存
    var t2 = document.getElementById('engManualTable');
    t2.querySelectorAll('tbody tr').forEach((tr, r) => {
        tr.querySelectorAll('.eng-cell-input').forEach((inp, c) => {
            inp.value = 'r' + r + 'c' + c;
        });
    });
    const pat = document.getElementById('engSentencePattern');
    if (pat) pat.textContent = '主-系-表 + when 引导时间状语从句';
    engSaveTableToHistory();
`);
const history = JSON.parse(global.localStorage.getItem('engPlay_copy') || '[]');
if (history.length > 0 && history[0].table && Array.isArray(history[0].table.rows)) {
    ok('保存的历史包含 table 数据');
    if (history[0].table.rows[0][0] === 'r0c0') ok('历史表格内容正确'); else no('历史表格内容错误');
    if (history[0].pattern === '主-系-表 + when 引导时间状语从句') ok('历史保存了句型分析'); else no('历史未保存句型分析');
} else {
    no('保存的历史未包含 table 数据');
}

// 5.5 设置页积分校准元素存在
const settingTargetPoints = document.getElementById('settingTargetPoints');
const settingCurrentPoints = document.getElementById('settingCurrentPoints');
const settingCurrentRank = document.getElementById('settingCurrentRank');
if (settingTargetPoints && settingCurrentPoints && settingCurrentRank) ok('设置页包含积分校准区块'); else no('设置页缺少积分校准元素');

// 6. 段位校准测试
run(`
    state.data.points.history = [{ points: 460, type: 'base', date: '2026-08-24', reason: '测试积分' }];
    state.data.game = { rankStars: 0, accountedEarnedStars: 0 };
    state.data.game._pointsCalibrated = null;
    initGame();
`);
const game = run('state.data.game');
if (game.rankStars === 4 && game.accountedEarnedStars === 4) ok('460 积分校准为 4 星（青铜 II）'); else no(`段位校准错误：rankStars=${game.rankStars}, accounted=${game.accountedEarnedStars}`);
const tier = run('getTierInfo(state.data.game.rankStars)');
if (tier.rankName === '倔强青铜' && tier.roman === 'Ⅱ') ok('段位显示为 倔强青铜Ⅱ'); else no(`段位显示错误：${tier.rankName}${tier.roman}`);

// 7. 成就冻结测试
run(`
    state.data.game.achievements = {};
    state.data.game._achievementsFrozen = true;
    state.data.points.history = [{ points: 100000, type: 'base', date: '2026-08-24' }];
    checkAchievements();
`);
const frozenAchv = run('state.data.game.achievements');
if (Object.keys(frozenAchv).length === 0) ok('成就冻结时 checkAchievements 不会解锁新成就'); else no('成就冻结被突破');
run('state.data.game._achievementsFrozen = false;');

if (fail === 0) {
    console.log('\n🎉 全部测试通过');
    process.exit(0);
} else {
    console.log(`\n⚠️ ${fail} 项测试失败`);
    process.exit(1);
}
