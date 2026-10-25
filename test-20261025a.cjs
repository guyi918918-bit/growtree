// 回归测试：英语打卡模块（三级目录 + 艾宾浩斯复习曲线）v20261025a
// 静态检查（模块注册/数据初始化/引用一致性）+ 沙箱运行时测试（调度逻辑/渲染不崩溃）
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(m) { pass++; console.log('  ✓', m); }
function no(m) { fail++; console.log('  ✗', m); }

const ROOT = '/Users/mianmian/WorkBuddy/2026-08-09-16-35-36/workbench';
const APP = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const VERSION = fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

console.log('== 版本标记（五处同步） ==');
if (APP.includes("const APP_BUILD = '20261025a'")) ok('APP_BUILD=20261025a'); else no('APP_BUILD 未更新');
if (VERSION.trim() === '{"build":"20261025a"}') ok('version.json=20261025a'); else no('version.json 错误: ' + VERSION.trim());
if (SW.includes("CACHE = 'growtree-shell-v121'")) ok('SW CACHE v121'); else no('SW 版本未升 v121');
if (SW.includes('app.20261025a.js') && SW.includes('styles.20261025a.css')) ok('SW SHELL 引用新哈希文件'); else no('SW SHELL 引用错误');
if (INDEX.includes('src="app.20261025a.js"') && INDEX.includes('href="styles.20261025a.css"')) ok('index.html 引用新哈希文件'); else no('index.html 未更新');
if (!INDEX.includes('app.20260923bb.js')) ok('index.html 已无旧 bb 引用'); else no('index.html 残留 bb 引用');

console.log('== 模块注册与数据初始化 ==');
if (APP.includes("{ id: 'engcheck', name: '英语打卡', icon: '🗓️' }")) ok('MODULES 注册 engcheck'); else no('MODULES 未注册 engcheck');
if (APP.includes('engcheck: { books: [], lessons: [], tasks: {} }')) ok('state.data 初始化 engcheck'); else no('state.data 未初始化');
if (APP.includes("if (!state.data.engcheck || typeof state.data.engcheck !== 'object') state.data.engcheck")) ok('migrateData 兼容补全'); else no('migrateData 缺少兼容');
if (/engcheck\(\)\s*\{[\s\S]*?ec-books[\s\S]*?ec-review/.test(APP)) ok('moduleRenderers 注册 engcheck()'); else no('moduleRenderers 缺少 engcheck()');

console.log('== 三级目录与任务定义 ==');
if (APP.includes("const EC_TASK_GROUPS")) ok('输入/输出两板块定义'); else no('缺少板块定义');
['listen-broad', 'listen-close', 'read-aloud', 'speak-trans', 'write-drill'].forEach(id => {
    if (APP.includes("id: '" + id + "'")) ok('任务 ' + id); else no('缺少任务 ' + id);
});
if (APP.includes("const EC_NODES_MIN = [5, 30, 720, 1440, 2880, 5760, 10080, 21600]")) ok('艾宾浩斯 8 节点（5分钟~15天）'); else no('艾宾浩斯节点定义错误');
if (APP.includes("const EC_NODE_LABELS = ['5分钟', '30分钟', '12小时', '1天', '2天', '4天', '7天', '15天']")) ok('节点中文标签'); else no('节点标签错误');
if (APP.includes('data-action="ec-batch-lessons"')) ok('批量生成课程（144 课场景）'); else no('缺少批量生成');

console.log('== 交互动作齐全 ==');
['ec-add-book', 'ec-rename-book', 'ec-delete-book', 'ec-open-book', 'ec-back-books',
 'ec-add-lesson', 'ec-batch-lessons', 'ec-rename-lesson', 'ec-delete-lesson', 'ec-open-lesson',
 'ec-back-lessons', 'ec-checkin'].forEach(a => {
    if (APP.includes("action === '" + a + "'")) ok('handler ' + a); else no('缺少 handler ' + a);
});

console.log('== CSS（含夜间模式适配） ==');
['.ec-book-card', '.ec-lesson-card', '.ec-task', '.ec-dot', '.ec-badge', '.ec-curve', '.ec-stats', '.ec-due-row'].forEach(c => {
    if (CSS.includes(c + ' ') || CSS.includes(c + '{') || CSS.includes(c + ',') || CSS.includes(c + ':')) ok('样式 ' + c); else no('缺少样式 ' + c);
});
if (CSS.includes('[data-theme="dark"] .ec-badge-due')) ok('夜间模式徽章适配'); else no('缺少夜间模式适配');
if ((CSS.match(/var\(--(surface|text|primary|border|surface-2)[^)]*\)/g) || []).length > 5) ok('大量使用 CSS 变量（自动适配主题）'); else no('CSS 变量使用不足');

console.log('== 运行时测试：艾宾浩斯调度逻辑（沙箱） ==');
const startIdx = APP.indexOf('// ==================== 英语打卡');
const endIdx = APP.indexOf('function init() {');
if (startIdx < 0 || endIdx < 0) { no('未找到 EC 代码块，无法运行时测试'); }
else {
    const ecCode = APP.slice(startIdx, endIdx);
    const mockState = { data: { engcheck: { books: [], lessons: [], tasks: {} } }, _ecBookId: null, _ecLessonId: null };
    const fakeInput = { value: '' };
    const sandboxDoc = { getElementById: () => fakeInput, addEventListener: () => {} };
    let savedCount = 0, renderCount = 0;
    const fn = new Function(
        'state', 'escapeHtml', 'toast', 'saveState', 'queueSync', 'render', 'uiPrompt', 'uiConfirm', 'uuid', 'now', 'document',
        ecCode + '\nreturn { EC_NODES_MIN, EC_NODE_LABELS, EC_TASKS, ecStatus, ecDueAt, ecIsDue, ecRelText, ecFmtDT, ecDots, ecData, ecTaskKey, ecGetTask, ecDoCheckIn, ecGlobalStats, ecBookStats, ecLessonsOf, ecRenderReview };'
    );
    const EC = fn(
        mockState,
        s => String(s),
        () => {},
        () => { savedCount++; },
        () => {},
        () => { renderCount++; },
        async () => null,
        async () => false,
        () => 'id-' + Math.random().toString(36).slice(2, 8),
        () => new Date().toISOString(),
        sandboxDoc
    );

    // 1. 节点定义
    if (EC.EC_NODES_MIN.length === 8 && EC.EC_NODES_MIN[0] === 5 && EC.EC_NODES_MIN[7] === 21600) ok('8 节点时长正确（5min ~ 15day）'); else no('节点时长错误');
    if (EC.EC_TASKS.length === 5 && EC.EC_TASKS.filter(t => t.group === 'input').length === 3 && EC.EC_TASKS.filter(t => t.group === 'output').length === 2) ok('任务分组：输入3 + 输出2'); else no('任务分组错误');

    // 2. 首次打卡
    const L1 = 'lesson-1';
    EC.ecDoCheckIn(L1, 'listen-broad');
    let rec = EC.ecGetTask(L1, 'listen-broad');
    if (rec && rec.startedAt && Array.isArray(rec.reviews) && rec.reviews.length === 0) ok('首次打卡建记录（startedAt + 空 reviews）'); else no('首次打卡记录异常');
    if (EC.ecStatus(rec) === 'doing') ok('状态 = doing'); else no('状态应为 doing');
    const due1 = EC.ecDueAt(rec);
    if (due1 && Math.abs(due1 - (rec.startedAt + 5 * 60000)) < 1000) ok('第 1 次复习应在 +5 分钟'); else no('首次复习时间错误');
    if (!EC.ecIsDue(rec)) ok('刚打卡时未到复习时间'); else no('刚打卡不应立即到期');

    // 3. 到点后完成复习 → 下一节点
    rec.startedAt = Date.now() - 6 * 60000; // 6 分钟前
    if (EC.ecIsDue(rec)) ok('超过 5 分钟后进入待复习'); else no('到点判断失败');
    EC.ecDoCheckIn(L1, 'listen-broad');
    rec = EC.ecGetTask(L1, 'listen-broad');
    if (rec.reviews.length === 1) ok('完成第 1 次复习'); else no('复习计数未 +1');
    const due2 = EC.ecDueAt(rec);
    if (due2 && Math.abs(due2 - (rec.startedAt + 30 * 60000)) < 1000) ok('第 2 次复习应在 +30 分钟'); else no('第二次复习时间错误');

    // 4. 未到点不能提前复习
    const before = rec.reviews.length;
    EC.ecDoCheckIn(L1, 'listen-broad');
    rec = EC.ecGetTask(L1, 'listen-broad');
    if (rec.reviews.length === before) ok('未到复习时间打卡被拒绝（保持曲线纪律）'); else no('提前复习未被拒绝');

    // 5. 连完 8 次 → 已掌握
    rec.startedAt = Date.now() - 40 * 86400000; // 40 天前，所有节点均已到期
    for (let i = rec.reviews.length; i < 8; i++) EC.ecDoCheckIn(L1, 'listen-broad');
    rec = EC.ecGetTask(L1, 'listen-broad');
    if (rec.reviews.length === 8) ok('8 次复习全部完成'); else no('复习次数不足 8');
    if (EC.ecStatus(rec) === 'mastered') ok('状态 = mastered（已掌握）'); else no('未标记已掌握');
    if (EC.ecDueAt(rec) === null) ok('已掌握后无下次复习'); else no('已掌握仍排复习');

    // 6. 逾期统计
    mockState.data.engcheck.tasks = {};
    const L2 = 'lesson-2';
    mockState.data.engcheck.tasks[L2 + '|write-drill'] = { startedAt: Date.now() - 2 * 86400000, reviews: [] };
    const stats = EC.ecGlobalStats();
    if (stats.due === 1 && stats.overdue === 1) ok('逾期任务计入 待复习/已逾期'); else no('逾期统计错误: ' + JSON.stringify(stats));

    // 7. 今日完成统计
    mockState.data.engcheck.tasks[L2 + '|read-aloud'] = { startedAt: Date.now() - 3600000, reviews: [Date.now()] };
    const stats2 = EC.ecGlobalStats();
    if (stats2.todayDone === 1) ok('今日完成复习计数'); else no('今日完成统计错误');

    // 8. 书单统计
    mockState.data.engcheck.books = [{ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' }];
    mockState.data.engcheck.lessons = [{ id: L2, bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' }];
    const bs = EC.ecBookStats('b1');
    if (bs.lessons === 1 && bs.total === 5 && bs.started === 2 && bs.mastered === 0) ok('书单统计（1 课 × 5 任务，2 项已开始）'); else no('书单统计错误: ' + JSON.stringify(bs));
    if (EC.ecLessonsOf('b1').length === 1) ok('按书筛选课程'); else no('课程筛选失败');

    // 9. 渲染不崩溃（复习中心）
    try {
        const html = EC.ecRenderReview();
        if (typeof html === 'string' && html.includes('待复习') && html.includes('艾宾浩斯')) ok('复习中心渲染正常（含逾期行）'); else no('复习中心渲染内容异常');
    } catch (err) { no('复习中心渲染抛错: ' + err.message); }

    // 10. 持久化副作用
    if (savedCount > 0 && renderCount > 0) ok('打卡后触发 saveState/render（' + savedCount + '次保存）'); else no('缺少持久化调用');
}

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
