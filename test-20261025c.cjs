// v20261025c 测试：英语打卡 5 项迭代
//   ① 课程下方灰色语法小字 ② 书单/课程批量删除+批量建书 ③ 打卡完成时间（分钟+星期几）
//   ④ 每本书自定义打卡任务 ⑤ 背诵初学四选一入池 + 复习页（学习中/提前复习/已掌握）
// 运行：node test-20261025c.cjs
const fs = require('fs');
const APP = fs.readFileSync(__dirname + '/app.js', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles.css', 'utf8');
const HTML = fs.readFileSync(__dirname + '/index.html', 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('  ❌ FAIL: ' + name); } };
const flush = () => new Promise(r => setTimeout(r, 10));

// ============ 一、静态检查 ============
console.log('—— 静态检查 ——');
// 回归：v20261025b 的关键点不能丢
ok('英语打卡模块仍在 MODULES', /\{ id: 'engcheck', name: '英语打卡'/.test(APP));
ok('MODULES 已无探索英语', !/\{ id: 'english'/.test(APP));
ok('设置标题为导航排序与显示', HTML.includes('🧭 导航排序与显示（目录）'));
ok('启动时首页=第一个可见板块', /const firstMod = getModules\(\)\[0\];[\s\S]{0,80}state\.currentModule = firstMod\.id/.test(APP));
ok('initModuleManagerDnD 仍在', /function initModuleManagerDnD/.test(APP));
ok('CSS 有渐变分组', /\.ec-group-input \.ec-group-head/.test(CSS) && /\.ec-group-output \.ec-group-head/.test(CSS) && /\.ec-group-recite \.ec-group-head/.test(CSS));
// ① 语法小字
ok('CSS 有 ec-lesson-note 灰色小字', /\.ec-lesson-note\b/.test(CSS) && /\.ec-lesson-note-lg/.test(CSS));
ok('课程度名下方渲染 note', APP.includes('ec-lesson-note') && /l\.note \? `<div class="ec-lesson-note">/.test(APP));
ok('note 编辑入口', /data-action="ec-edit-note"/.test(APP) && /function ecEditLessonNote/.test(APP));
ok('添加课程可带语法输入', APP.includes('ecLessonNoteInput'));
ok('批量导入支持 || 带语法', APP.includes("line.indexOf('||')"));
// ② 批量删除 + 批量建书
ok('CSS 有批量选择样式', /\.ec-sel-cb/.test(CSS) && /\.ec-sel-bar/.test(CSS) && /\.ec-selmode/.test(CSS));
ok('书单批量建书', /function ecBatchBooks/.test(APP) && APP.includes('ecBookBatchNames') && /data-action="ec-batch-books"/.test(APP));
ok('书单批量删除', /function ecDelSelBooks/.test(APP) && /data-action="ec-book-sel-mode"/.test(APP) && /data-action="ec-del-sel-books"/.test(APP) && /data-action="ec-book-sel"/.test(APP) && /data-action="ec-sel-all-books"/.test(APP));
ok('课程批量删除', /function ecDelSelLessons/.test(APP) && /data-action="ec-lesson-sel-mode"/.test(APP) && /data-action="ec-del-sel-lessons"/.test(APP) && /data-action="ec-lesson-sel"/.test(APP) && /data-action="ec-sel-all-lessons"/.test(APP));
ok('删除拆出无确认内部函数', /function ecRemoveBook/.test(APP) && /function ecRemoveLesson/.test(APP));
// ③ 完成时间
ok('CSS 有 ec-task-time', /\.ec-task-time/.test(CSS));
ok('完成时间含星期几', /function ecFmtWeek/.test(APP) && /周\$\{wk\}/.test(APP));
ok('任务行显示完成时间', APP.includes('ec-task-time') && APP.includes('完成于'));
// ④ 每书自定义任务
ok('CSS 有任务管理面板', /\.ec-task-man/.test(CSS) && /\.ec-tm-row/.test(CSS) && /\.ec-tm-add/.test(CSS));
ok('任务管理 UI', /function ecTaskManageHTML/.test(APP) && /data-action="ec-add-task"/.test(APP) && /data-action="ec-rename-task"/.test(APP) && /data-action="ec-del-task"/.test(APP));
ok('新建书带默认任务模板', /tasks: ecCloneDefaultTasks\(\)/.test(APP));
ok('老书补默认任务迁移', /b\.tasks = ecCloneDefaultTasks\(\)/.test(APP));
ok('每书任务访问器', /function ecBookTasks/.test(APP) && /function ecFindTaskDef/.test(APP) && /function ecCloneDefaultTasks/.test(APP));
ok('任务 id 生成唯一', /'t' \+ Date\.now\(\)\.toString\(36\)/.test(APP));
// ⑤ 初学四选一 + 复习页
ok('背诵面板无旧 learn 按钮', !APP.includes('data-mode="learn"'));
ok('初学四档入池逻辑', /const isFirst = !d\.fsrs\[lessonId\]/.test(APP) && /初学自评/.test(APP));
ok('CSS/JS 提前复习', /data-action="ec-early-review"/.test(APP) && /\.ec-due-btns/.test(CSS));
ok('复习页三列表', /待背诵清单/.test(APP) && /学习中（未到复习时间）/.test(APP) && /已掌握/.test(APP));
ok('复习统计含学习中', /ec-stat-label">学习中</.test(APP));
// 热榜回归：v20261025b 误删 renderHotList 等 6 个函数导致全站白屏，必须断言防再犯
ok('热榜 6 函数定义齐全', ['function renderHotList', 'async function loadHotData', 'function renderHotDOM',
    'async function loadHotJson', 'async function fetchHotForTypes', 'async function fetchInternationalHot'
].every(s => APP.includes(s)));
ok('_loadingHot 瞬态字段在 state', /_loadingHot: false/.test(APP));
ok('热榜初始化调用仍在', /if \(state\.currentModule === 'hot'\) loadHotData\(\);/.test(APP));
ok('热榜事件 handler 仍在', /if \(action === 'hot-platform'\)/.test(APP) && /if \(action === 'hot-refresh'\)/.test(APP));
ok('热榜依赖符号齐全', ['HOT_GROUPS', 'HOT_TYPES', 'HOT_INTERNATIONAL_FEEDS', 'API.hot'].every(s => APP.includes(s)));
// ============ v20261025d：4 项新需求 + 2 个 bug 修复 ============
// ① 新增折叠
ok('CSS 有折叠面板样式', /\.ec-add-panel/.test(CSS) && /\.ec-head-btns/.test(CSS));
ok('书单/课程页有新增折叠按钮', /data-action="ec-toggle-add"/.test(APP) && /_ecAddOpen/.test(APP));
ok('翻页时收起新增面板', APP.includes("state._ecAddOpen = false"));
// ② 悦己享瘦样式修复（v20261025b 误删 .yjxs-host 导致 iframe 高度塌陷、板块空白）
ok('CSS 有 yjxs-host（iframe 高度修复）', /\.yjxs-host \{/.test(CSS) && /\.yjxs-host iframe \{/.test(CSS));
ok('CSS 有 ec-due-info（复习行布局修复）', /\.ec-due-info \{/.test(CSS));
// ③ engcheck 同步覆盖修复（点击打卡 2 秒后被云端旧快照冲掉）
ok('ecMergeEngcheck 合并函数存在', /function ecMergeEngcheck/.test(APP));
ok('_syncFromCloudCore 调用 engcheck 合并', /ecMergeEngcheck\(localEc, state\.data\.engcheck, localEcAt, cloudEcAt\)/.test(APP));
ok('ecAfterAction 标记本地修改时间', /ecData\(\)\.updatedAt = now\(\)/.test(APP));
// ④ 提前复习反馈
ok('CSS 有评价反馈条', /\.ec-review-feedback/.test(CSS));
ok('打分后清除行内展开', /state\._ecEarlyId = null;/.test(APP));
ok('打分后记录即时反馈', /state\._ecLastReview = \{ id: lessonId/.test(APP));
ok('复习三列表显示反馈条', /rvFeedback\(it\.lesson\.id\)/.test(APP));
ok('课程页背诵面板显示反馈条', /ec-group-body">\$\{body\}\$\{rvHtml\}/.test(APP));
// ============ v20261025e：课程列表 4 项 UI 优化 ============
ok('CSS 有推荐卡样式', /\.ec-reco \{/.test(CSS) && /\.ec-reco-tag/.test(CSS) && /\.ec-reco-done/.test(CSS));
ok('CSS 有完成态/锁/行内编辑按钮', /\.ec-lesson-card\.ec-lesson-done/.test(CSS) && /\.ec-lock/.test(CSS) && /\.ec-edit-btn/.test(CSS) && /\.ec-lesson-side/.test(CSS));
ok('推荐函数存在', /function ecTodayRecommend\(/.test(APP) && /function ecTodayRecommendHTML\(/.test(APP));
ok('课程页渲染推荐卡', /ecTodayRecommendHTML\(book\.id\)/.test(APP));
ok('完成课程标记 done class', /ec-lesson-done' : ''/.test(APP));
ok('未开始课程显示锁', /ec-lock" title="还没开始这一课"/.test(APP));
ok('编辑按钮在行内右侧', /ec-lesson-side/.test(APP) && /ec-edit-btn/.test(APP));
// ============ v20261025f：手机排版 + 自定义打卡时间 + 学习记录清零 ============
ok('课程卡两列布局（info+side）', /<div class="ec-lesson-info">/.test(APP) && /\.ec-lesson-info \{/.test(CSS));
ok('CSS 有完成时间可点击样式', /\.ec-time-edit/.test(CSS));
ok('语法小字字号缩小到 11px', /\.ec-lesson-note \{\s*\n\s*font-size: 11px/.test(CSS));
ok('课程进度行字号缩小到 11px', /\.ec-lesson-meta \{ font-size: 11px/.test(CSS));
ok('任务描述/复习信息字号缩小', /\.ec-task-desc \{ font-size: 11px/.test(CSS) && /\.ec-due-meta \{ font-size: 11px/.test(CSS));
ok('手机端 480px 适配块存在', /@media \(max-width: 480px\) \{[\s\S]*?\.ec-lesson-main \{ padding: 11px 12px/.test(CSS));
ok('手机端卡片头可换行', /\.ec-page \.card-header \{ flex-wrap: wrap/.test(CSS));
ok('ec-edit-time 入口与 handler', APP.includes('data-action="ec-edit-time"') && /if \(action === 'ec-edit-time'\)/.test(APP));
ok('ecEditTaskTime 函数存在', /async function ecEditTaskTime/.test(APP));
ok('ecToLocalInput 辅助函数存在', /function ecToLocalInput/.test(APP));
ok('自定义时间用 datetime-local 弹窗', APP.includes('type="datetime-local"') && APP.includes('ecTaskTimeInput'));
ok('ec-clear-records 按钮与 handler', APP.includes('data-action="ec-clear-records"') && /if \(action === 'ec-clear-records'\)/.test(APP));
ok('ecClearRecords 函数存在', /async function ecClearRecords/.test(APP));
ok('清零弹窗三个勾选项齐全', ['ecClrTasks', 'ecClrFsrs', 'ecClrAll'].every(id => APP.includes('id="' + id + '"')));
ok('清零保留书单目录语义', /书单和课程目录会保留/.test(APP));

// ============ 二、FSRS 算法单测（回归） ============
console.log('—— FSRS 算法 ——');
const ecCode = APP.slice(APP.indexOf('// ==================== 英语打卡'), APP.indexOf('function init() {'));
function makeEC(overrides) {
    const inputs = {};
    const elCache = {};
    let confirmAnswer = false;
    const mockState = Object.assign({
        data: { engcheck: { books: [], lessons: [], tasks: {}, fsrs: {}, score: 0, achievements: {}, days: {}, streak: 0, bestStreak: 0, lastStudyDate: '' } },
        _ecBookId: null, _ecLessonId: null, _ecEditBookId: null, _ecEditLessonId: null,
        _ecBookSelMode: false, _ecBookSel: {}, _ecLessonSelMode: false, _ecLessonSel: {}, _ecEarlyId: null,
        _ecLastReview: null, _ecAddOpen: false
    }, overrides || {});
    const fn = new Function('state', 'escapeHtml', 'toast', 'saveState', 'queueSync', 'render', 'uiPrompt', 'uiConfirm', 'uiModal', 'uuid', 'now', 'today', 'dateStr', 'document', 'localStorage',
        ecCode + '\nreturn { ecData, ecFsrsLearn, ecFsrsReview, ecRetrievability, ecReciteStatus, ecReciteAction, ecToggleTask, ecGetLevel, ecLevelSymbols, EC_GRADES, EC_TASKS, EC_FSRS, ecRenderBooks, ecRenderLessons, ecRenderLesson, ecRenderReview, ecRenderAchieve, ecRenderDrill, ecFmtWeek, ecBookTasks, ecFindTaskDef, ecLessonProgress, ecBookStats, ecAddBook, ecBatchBooks, ecDelSelBooks, ecDelSelLessons, ecAddTaskToBook, ecDelBookTask, ecEditLessonNote, ecImportLessons, ecAddLesson, ecRemoveBook, ecRemoveLesson, ecMergeEngcheck, ecAfterAction, ecTodayRecommend, ecTodayRecommendHTML, ecToLocalInput, ecEditTaskTime, ecClearRecords, state };');
    const docMock = { getElementById: (id) => { if (!elCache[id]) elCache[id] = { value: inputs[id] !== undefined ? inputs[id] : '', checked: !!inputs[id + '__checked'] }; return elCache[id]; }, addEventListener: () => {} };
    const inst = fn(mockState, s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), () => {}, () => {}, () => {}, () => {}, async () => null, async () => confirmAnswer,
        async (opts) => { if (opts && opts.getValue) return opts.getValue(); return true; },
        () => 'id' + Math.random().toString(36).slice(2, 8), () => new Date().toISOString(),
        () => '2026-10-25', d => '2026-10-25',
        docMock,
        { getItem: () => null, setItem: () => {} });
    inst._inputs = inputs;
    inst._el = (id) => docMock.getElementById(id);
    inst._setConfirm = (v) => { confirmAnswer = v; };
    return inst;
}

{
    const EC = makeEC();
    const T0 = 1770000000000;
    ok('R(t=S)=0.9', Math.abs(EC.ecRetrievability(1, 1) - 0.9) < 1e-9);
    ok('R(0)=1', Math.abs(EC.ecRetrievability(5, 0) - 1) < 1e-9);
    const rec = EC.ecFsrsLearn(T0);
    ok('初始 S=1', rec.s === 1);
    ok('初始 D=5', rec.d === 5);
    ok('首次复习安排在第 1 天', Math.abs(rec.due - (T0 + 86400000)) < 1000);
    const g = EC.ecFsrsReview({ ...rec }, 3, T0 + 86400000);
    ok('Good 后 S≈2', g.s > 1.9 && g.s < 2.1);
    ok('Good 后 D 不变', g.d === 5);
    const h = EC.ecFsrsReview({ ...rec }, 2, T0 + 86400000);
    const e = EC.ecFsrsReview({ ...rec }, 4, T0 + 86400000);
    ok('Hard 涨幅 < Good', h.s < g.s);
    ok('Easy 涨幅 > Good', e.s > g.s);
    ok('Hard 后 D 上升', h.d > 5);
    ok('Easy 后 D 下降', e.d < 5);
    const a = EC.ecFsrsReview({ ...rec, s: 10, d: 5 }, 1, T0 + 86400000);
    ok('Again 后 S 对折', a.s === 5);
    ok('Again 后 D 上升', a.d > 5.5);
    ok('Again 记 lapses', a.lapses === 1);
    const onTime = EC.ecFsrsReview({ s: 10, d: 5, n: 1, last: T0 }, 3, T0 + 10 * 86400000);
    const late = EC.ecFsrsReview({ s: 10, d: 5, n: 1, last: T0 }, 3, T0 + 30 * 86400000);
    ok('迟到复习 Good 涨幅更小', late.s < onTime.s);
    const easyCard = EC.ecFsrsReview({ s: 4, d: 2, n: 1, last: T0 }, 3, T0 + 4 * 86400000);
    const hardCard = EC.ecFsrsReview({ s: 4, d: 8, n: 1, last: T0 }, 3, T0 + 4 * 86400000);
    ok('难度高的课 S 涨得更慢', hardCard.s < easyCard.s);
    let r2 = { s: 100, d: 3, n: 5, last: T0 };
    r2 = EC.ecFsrsReview(r2, 4, T0 + 100 * 86400000);
    ok('最大间隔封顶 120 天', r2.s <= 120);
    ok('S≥60 判已掌握', EC.ecReciteStatus({ s: 60, due: T0, last: T0 }, T0) === 'mastered');
    ok('到期判 due', EC.ecReciteStatus({ s: 2, due: T0 - 1000, last: T0 - 86400000 }, T0) === 'due');
    ok('未到期判 waiting', EC.ecReciteStatus({ s: 2, due: T0 + 100000, last: T0 }, T0) === 'waiting');
    ok('无记录判 new', EC.ecReciteStatus(null, T0) === 'new');
    let tr = EC.ecFsrsLearn(T0);
    const grades = [3, 3, 3, 3, 4, 3];
    let t = T0;
    grades.forEach(gd => { t = tr.due; tr = EC.ecFsrsReview(tr, gd, t); });
    ok('6 次复习后达到已掌握', tr.s >= 60);
    // ecFmtWeek 格式
    const fw = EC.ecFmtWeek(new Date(2026, 9, 25, 14, 32).getTime());
    ok('ecFmtWeek 格式（分钟+星期几）', /^\d{2}-\d{2} \d{2}:\d{2} 周[日一二三四五六]$/.test(fw) && fw.includes('14:32') && fw.includes('周日'));
}

// ============ 三、数据与任务模板 ============
console.log('—— 数据与任务模板 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    EC.ecData(); // 再次调用触发老书任务模板迁移
    ok('老书自动补默认任务', Array.isArray(d.books[0].tasks) && d.books[0].tasks.length === 5);
    ok('ecBookTasks 回退默认', EC.ecBookTasks('b1').length === 5);
    // 每书自定义任务
    d.books[0].tasks = [{ id: 'c1', group: 'input', icon: '🎧', name: '听力', desc: '精听 BBC', points: 3 }, { id: 'c2', group: 'output', icon: '✍️', name: '写作', desc: '', points: 4 }];
    ok('ecBookTasks 用自定义', EC.ecBookTasks('b1').length === 2 && EC.ecBookTasks('b1')[0].name === '听力');
    ok('ecFindTaskDef 反查定义', EC.ecFindTaskDef('l1', 'c2').points === 4);
    ok('ecLessonProgress 用自定义 total', EC.ecLessonProgress('l1').total === 2);
    EC.ecToggleTask('l1', 'c1');
    ok('自定义任务打卡按自定义积分 +3', d.score === 3 && !!d.tasks['l1|c1']);
    // 删除任务清理记录（确认=true，async）
    EC._setConfirm(true);
    Promise.resolve(EC.ecDelBookTask('b1', 'c1')).then(async () => {
        await flush();
        ok('删任务后定义移除', d.books[0].tasks.length === 1 && !d.books[0].tasks.some(t => t.id === 'c1'));
        ok('删任务后打卡记录清理', !d.tasks['l1|c1']);
        ok('删任务不扣积分', d.score === 3);
        // 添加任务（模拟输入框）
        EC._inputs['ecNewTaskName'] = 'shadowing 影子跟读';
        EC._inputs['ecNewTaskIcon'] = '🗣️';
        EC._inputs['ecNewTaskGroup'] = 'output';
        EC._inputs['ecNewTaskDesc'] = '不看文本纯听写';
        EC.state._ecEditBookId = 'b1';
        EC.ecAddTaskToBook();
        const added = d.books[0].tasks.find(t => t.name === 'shadowing 影子跟读');
        ok('添加任务成功', !!added && added.group === 'output' && added.icon === '🗣️' && added.points === 2);
        ok('任务 id 唯一格式', /^t[a-z0-9]+$/.test(added.id));
        // 空名称拒绝
        const before = d.books[0].tasks.length;
        EC._inputs['ecNewTaskName'] = '';
        EC.ecAddTaskToBook();
        ok('空名称不添加', d.books[0].tasks.length === before);
    });
}

// ============ 四、初学四选一入池 + 复习页 ============
console.log('—— 初学入池与复习页 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l2', bookId: 'b1', name: 'Lesson 2', order: 2, createdAt: 'x' });
    // 初学 Easy 直接入池
    EC.ecReciteAction('l1', '4');
    ok('初学 Easy 入池', !!d.fsrs.l1 && d.fsrs.l1.n === 1 && d.fsrs.l1.last > 0);
    ok('初学入池 +5 分', d.score === 5);
    ok('初学 Easy S 明显增长', d.fsrs.l1.s > 2.5);
    ok('初学入池解锁首背成就', !!d.achievements['first-recite']);
    // 初学 Again
    EC.ecReciteAction('l2', '1');
    ok('初学 Again S=0.5', d.fsrs.l2.s === 0.5);
    ok('初学 Again D 上升', d.fsrs.l2.d > 5);
    ok('两次入池共 +10 分', d.score === 10);
    // 复习页：l1 未到点（due 在 3 天后）→ 学习中列表 + 提前复习按钮
    let h = EC.ecRenderReview();
    ok('复习页有学习中列表', h.includes('学习中（未到复习时间）') && h.includes('Lesson 1'));
    ok('学习中显示下次复习时间', h.includes('下次复习：') && /周[日一二三四五六]/.test(h));
    ok('学习中显示提前复习按钮', h.includes('data-action="ec-early-review"'));
    ok('复习页汇总在池数', h.includes('在池课程共 2 节'));
    // 点提前复习 → 展开四档
    EC.state._ecEarlyId = 'l1';
    h = EC.ecRenderReview();
    ok('展开后行内四档可打分', h.includes('ec-grade-mini'));
    EC.state._ecEarlyId = null;
    // l1 改判 Good（提前复习，晚于 due 之前）→ 学习中移出
    EC.ecReciteAction('l1', '3');
    ok('提前复习后 n=2', d.fsrs.l1.n === 2);
    // 已掌握列表：把 l1 的 S 推到 60+
    d.fsrs.l1.s = 60;
    h = EC.ecRenderReview();
    ok('已掌握列表出现', h.includes('🏆 已掌握') && h.includes('Lesson 1') && h.includes('再背一次自检'));
    ok('已掌握统计=1', h.includes('ec-stat-num ec-stat-ok">1<'));
}

// ============ 五、语法小字 + 完成时间（渲染） ============
console.log('—— 语法小字与完成时间 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1-2 Excuse me! / Is this your…?', note: '✅ 语法：be 动词（am/is/are）；含 be 动词的一般疑问句；Yes/No 回答', order: 1, createdAt: 'x' });
    EC.state._ecBookId = 'b1';
    let h = EC.ecRenderLessons();
    ok('课程列表显示语法小字', h.includes('ec-lesson-note') && h.includes('be 动词（am/is/are）'));
    ok('课程度名下方小字为灰色样式类', h.includes('ec-lesson-note">✅ 语法'));
    // 编辑面板含语法要点按钮
    EC.state._ecEditLessonId = 'l1';
    h = EC.ecRenderLessons();
    ok('编辑面板有语法要点按钮', h.includes('data-action="ec-edit-note"'));
    EC.state._ecEditLessonId = null;
    // 课程详情页大号 note
    EC.state._ecLessonId = 'l1';
    h = EC.ecRenderLesson();
    ok('详情页显示语法要点', h.includes('ec-lesson-note-lg') && h.includes('Yes/No 回答'));
    // 打卡完成时间
    EC.ecToggleTask('l1', 'listen-broad');
    h = EC.ecRenderLesson();
    ok('打卡后显示完成时间', h.includes('ec-task-time') && h.includes('完成于'));
    ok('完成时间含星期几', /完成于 \d{2}-\d{2} \d{2}:\d{2} 周[日一二三四五六]/.test(h));
    // 添加课程带语法（模拟输入）
    EC.state._ecLessonId = null;
    EC.state._ecBookId = 'b1';
    EC._inputs['ecLessonNameInput'] = 'Lesson 3';
    EC._inputs['ecLessonNoteInput'] = '语法：不定冠词 a/an';
    EC.ecAddLesson();
    const l3 = d.lessons.find(l => l.name === 'Lesson 3');
    ok('添加课程同时存语法', !!l3 && l3.note === '语法：不定冠词 a/an');
    ok('添加后清空输入框', EC._el('ecLessonNameInput').value === '' && EC._el('ecLessonNoteInput').value === '');
    // 批量导入带 || 语法
    EC._inputs['ecImportNames'] = 'L5-6 Nice to meet you. || 语法：不定冠词 a/an；选择疑问句；国籍表达\nL7-8 Are you a teacher? || 语法：what 引导特殊疑问句';
    EC.ecImportLessons();
    const l56 = d.lessons.find(l => l.name === 'L5-6 Nice to meet you.');
    ok('批量导入解析语法', !!l56 && l56.note === '语法：不定冠词 a/an；选择疑问句；国籍表达');
    ok('批量导入第二节课', d.lessons.some(l => l.name === 'L7-8 Are you a teacher?'));
    // 编辑语法（uiModal getValue 路径）
    EC._inputs['ecNoteTA'] = '语法：be 动词否定句；Here\'s... 句型';
    const p = EC.ecEditLessonNote('l1');
    Promise.resolve(p).then(async () => {
        await flush();
        ok('弹窗保存语法要点', d.lessons.find(l => l.id === 'l1').note === '语法：be 动词否定句；Here\'s... 句型');
    });
}

// ============ 六、批量建书 / 批量删除 ============
console.log('—— 批量建书与批量删除 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    // 批量建书
    EC._inputs['ecBookBatchNames'] = '新概念英语一\n新概念英语二\n新概念英语一';
    EC.ecBatchBooks();
    ok('批量建书去重添加 2 本', d.books.length === 2 && d.books[0].tasks.length === 5);
    ok('批量建书后清空输入', EC._el('ecBookBatchNames').value === '');
    // 单条建书仍可用（async，读输入框）
    EC._inputs['ecBookNameInput'] = '新概念英语三';
    Promise.resolve(EC.ecAddBook()).then(async () => {
        await flush();
        ok('单条建书成功且带默认任务', d.books.some(b => b.name === '新概念英语三' && Array.isArray(b.tasks) && b.tasks.length === 5));
        ok('单条建书后清空输入', EC._el('ecBookNameInput').value === '');
    });
    // 批量删除书（选择前 2 本，确认=true）
    EC.state._ecBookSelMode = true;
    EC.state._ecBookSel = { [d.books[0].id]: true, [d.books[1].id]: true };
    d.lessons.push({ id: 'l1', bookId: d.books[0].id, name: 'Lesson 1', order: 1, createdAt: 'x' });
    d.tasks['l1|listen-broad'] = { at: Date.now() };
    d.fsrs.l1 = EC.ecFsrsLearn(Date.now());
    EC._setConfirm(true);
    EC.ecDelSelBooks().then(async () => {
        await flush();
        ok('批量删书后只剩手动加的 1 本', d.books.length === 1);
        ok('批量删书清掉课程', d.lessons.length === 0);
        ok('批量删书清掉任务记录', Object.keys(d.tasks).length === 0);
        ok('批量删书清掉背诵记录', Object.keys(d.fsrs).length === 0);
        ok('退出批量模式', EC.state._ecBookSelMode === false);
    });
    // 批量删课
    const EC2 = makeEC();
    const d2 = EC2.ecData();
    d2.books.push({ id: 'b1', name: '书A', order: 1, createdAt: 'x', tasks: [{ id: 'listen-broad', group: 'input', icon: '🎧', name: '泛听', desc: '', points: 2 }] });
    d2.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1', order: 1, createdAt: 'x' });
    d2.lessons.push({ id: 'l2', bookId: 'b1', name: 'L2', order: 2, createdAt: 'x' });
    d2.lessons.push({ id: 'l3', bookId: 'b1', name: 'L3', order: 3, createdAt: 'x' });
    d2.tasks['l1|listen-broad'] = { at: Date.now() };
    d2.tasks['l2|listen-broad'] = { at: Date.now() };
    EC2.state._ecBookId = 'b1';
    EC2.state._ecLessonSelMode = true;
    EC2.state._ecLessonSel = { l1: true, l2: true };
    EC2._setConfirm(true);
    EC2.ecDelSelLessons().then(async () => {
        await flush();
        ok('批量删课后剩 1 节', d2.lessons.length === 1 && d2.lessons[0].id === 'l3');
        ok('批量删课清掉任务记录', Object.keys(d2.tasks).length === 0);
        ok('批量删课退出批量模式', EC2.state._ecLessonSelMode === false);
    });
}

// ============ 七、渲染冒烟（回归 + 新增入口） ============
console.log('—— 渲染冒烟 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    let h = EC.ecRenderBooks();
    ok('空书单渲染', h.includes('还没有书单') && h.includes('Lv.1'));
    ok('书单页默认折叠：只有新增按钮', h.includes('data-action="ec-toggle-add"') && h.includes('➕ 新增') && !h.includes('ecBookBatchNames'));
    EC.state._ecAddOpen = true;
    h = EC.ecRenderBooks();
    ok('书单页展开后有批量建书区', h.includes('ecBookBatchNames') && h.includes('批量新增书单'));
    EC.state._ecAddOpen = false;
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    EC.state._ecBookId = 'b1';
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    h = EC.ecRenderLessons();
    ok('课程列表渲染', h.includes('新概念英语一') && h.includes('Lesson 1'));
    ok('课程页有批量删除入口', h.includes('data-action="ec-lesson-sel-mode"'));
    ok('课程页默认折叠：只有新增按钮', h.includes('data-action="ec-toggle-add"') && !h.includes('ecLessonNoteInput'));
    EC.state._ecAddOpen = true;
    h = EC.ecRenderLessons();
    ok('课程页展开后有语法输入框', h.includes('ecLessonNoteInput') && h.includes('ecImportNames') && h.includes('ecBatchPrefix'));
    EC.state._ecAddOpen = false;
    EC.state._ecLessonId = 'l1';
    h = EC.ecRenderLesson();
    ok('任务视图：输入板块', h.includes('输入板块') && h.includes('泛听') && h.includes('精听') && h.includes('跟读'));
    ok('任务视图：输出板块', h.includes('输出板块') && h.includes('说译') && h.includes('练题'));
    ok('任务视图：背诵板块初学四选一', h.includes('背诵板块') && h.includes('初学这一课') && !h.includes('data-mode="learn"'));
    ok('渐变分组 class', h.includes('ec-group-input') && h.includes('ec-group-output') && h.includes('ec-group-recite'));
    // 书单页 ✏️ 展开任务管理
    EC.state._ecLessonId = null;
    EC.state._ecEditBookId = 'b1';
    h = EC.ecRenderBooks();
    ok('书编辑面板含任务管理', h.includes('ec-task-man') && h.includes('打卡任务管理') && h.includes('ecNewTaskName') && h.includes('ecNewTaskGroup'));
    ok('任务管理列出默认 5 项', h.includes('泛听') && h.includes('练题') && h.includes('ec-del-task'));
    EC.state._ecEditBookId = null;
    // 下钻容错
    EC.state._ecLessonId = 'nonexistent';
    h = EC.ecRenderLesson();
    ok('无效课程 id 回退', h.includes('新概念英语一'));
    EC.state._ecBookId = 'nonexistent';
    h = EC.ecRenderLessons();
    ok('无效书 id 回退书单', h.includes('我的书单'));
    // 成就榜
    EC.state._ecBookId = 'b1';
    h = EC.ecRenderAchieve();
    ok('成就榜渲染', h.includes('成就墙') && h.includes('七日不断'));
}

// ============ 八、导航排序（回归） ============
console.log('—— 导航排序 ——');
{
    ok('buildModuleManager 有拖拽手柄', /mod-drag/.test(APP));
    ok('buildModuleManager 有勾选显隐', /mod-vis/.test(APP) && /data-action="module-toggle"/.test(APP));
    ok('DnD 初始化函数', /function initModuleManagerDnD/.test(APP));
    ok('drop 后重排并同步', /all\.splice\(dragIdx, 1\)\[0\]/.test(APP) && /all\.splice\(to, 0, moved\)/.test(APP));
    ok('toggle 用 checked 判定', /const willHide = !el\.checked/.test(APP));
    ok('保留至少一个可见板块', /至少保留一个显示的板块/.test(APP));
}

// ============ 九、热榜渲染运行时（回归 v20261025b 全站白屏事故） ============
console.log('—— 热榜渲染 ——');
{
    const constCode = (APP.match(/const HOT_TYPES = \{[\s\S]*?\n\};/) || [])[0] + '\n' +
        (APP.match(/const HOT_GROUPS = \{[\s\S]*?\n\};/) || [])[0] + '\n' +
        (APP.match(/const HOT_INTERNATIONAL_FEEDS = \{[\s\S]*?\n\};/) || [])[0];
    ok('能提取热榜常量', constCode.includes('HOT_TYPES') && constCode.includes('HOT_GROUPS') && constCode.includes('HOT_INTERNATIONAL_FEEDS'));
    const hotStart = APP.indexOf('function renderHotList');
    const hotEnd = APP.indexOf('// ==================== 变美情报局模块');
    ok('热榜函数块定位', hotStart > 0 && hotEnd > hotStart);
    const hotCode = constCode + '\n' + APP.slice(hotStart, hotEnd);
    const mockState = {
        data: { hotCache: { weibo: { list: [{ index: 1, title: '测试热搜', url: 'https://x.com', hot_value: '999' }], update_time: new Date().toISOString() } } },
        currentSubTab: { hot: 'mixed', hot_mixed: 'weibo' },
        _loadingHot: false
    };
    let rendered = null;
    const docMock = {
        getElementById: (id) => id === 'hotListWrap' ? { set innerHTML(v) { rendered = v; } } : null,
        addEventListener: () => {}
    };
    let fetchCalls = 0;
    const fn = new Function('state', 'escapeHtml', 'toast', 'saveState', 'render', 'API', 'fetch', 'document',
        hotCode + '\nreturn { renderHotList, renderHotDOM, loadHotData, fetchHotForTypes };');
    const inst = fn(mockState, s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        () => {}, () => {}, () => {}, { hot: 'https://mock.api/hot' },
        async () => { fetchCalls++; return { ok: true, json: async () => ({ list: [] }) }; },
        docMock);
    let html = '';
    let threw = null;
    try { html = inst.renderHotList('mixed'); } catch (e) { threw = e; }
    ok('renderHotList 不再 ReferenceError', !threw && !!html);
    ok('renderHotList 输出热榜结构', html.includes('hot-tabs') && html.includes('news-list') && html.includes('综合热榜'));
    ok('renderHotList 渲染缓存条目', html.includes('测试热搜') && html.includes('999'));
    threw = null;
    try { inst.renderHotDOM(); } catch (e) { threw = e; }
    ok('renderHotDOM 不抛错', !threw && rendered === html);
    // loadHotData 全链路（fetch mock 返回空 list，不应抛错）
    inst.loadHotData().then(() => {
        ok('loadHotData 全链路不抛错', true);
        ok('loadHotData 后清除 loading', mockState._loadingHot === false);
    }).catch(e => { ok('loadHotData 全链路不抛错', false); console.log('  ❌ loadHotData threw: ' + e.message); });
}

// ============ 十、v20261025d：同步合并 / 折叠新增 / 复习反馈 ============
console.log('—— v20261025d 新功能 ——');
{
    // --- ecMergeEngcheck：防「打卡成功一秒后又变回未完成」 ---
    const EC = makeEC();
    const mkEc = (over) => Object.assign({
        books: [{ id: 'b1', name: '书一', order: 1, createdAt: 'x' }],
        lessons: [{ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' }],
        tasks: { 'l1|listen-broad': { at: 111 } },
        fsrs: {}, score: 10, achievements: {}, days: {}, streak: 1, bestStreak: 1, lastStudyDate: '2026-10-24'
    }, over || {});
    // 场景 1：本地刚打卡（updatedAt 新）→ 整组保留本地，云端旧快照不许冲掉
    const local1 = mkEc({ updatedAt: '2026-10-25T04:00:00.000Z' });
    const cloud1 = mkEc({ updatedAt: '2026-10-25T03:00:00.000Z', tasks: {}, score: 2 });
    const r1 = EC.ecMergeEngcheck(local1, cloud1, '2026-10-25T04:00:00.000Z', '2026-10-25T03:00:00.000Z');
    ok('本地新→整组保留本地', r1 === local1 && !!r1.tasks['l1|listen-broad'] && r1.score === 10);
    // 场景 2：云端更新（多设备）→ 云端数据生效，本地独有键并集保留
    const local2 = mkEc({ updatedAt: '2026-10-25T03:00:00.000Z' });
    const cloud2 = mkEc({ updatedAt: '2026-10-25T04:00:00.000Z', score: 30 });
    const r2 = EC.ecMergeEngcheck(local2, cloud2, '2026-10-25T03:00:00.000Z', '2026-10-25T04:00:00.000Z');
    ok('云端新→云端数据生效', r2.score === 30 && r2.updatedAt === '2026-10-25T04:00:00.000Z');
    // 场景 3：时间戳都缺（旧数据首次升级）→ 键级合并：本地新 tasks/books/lessons 不丢
    const local3 = mkEc({ tasks: { 'l1|listen-broad': { at: 222 }, 'l1|NEW': { at: 333 } }, score: 8 });
    const cloud3 = mkEc({ tasks: { 'l1|write-drill': { at: 444 } }, score: 5 });
    const r3 = EC.ecMergeEngcheck(local3, cloud3, '', '');
    ok('无时间戳→本地新 tasks 键保留', !!r3.tasks['l1|NEW'] && !!r3.tasks['l1|listen-broad']);
    ok('无时间戳→云端独有 tasks 键也保留', !!r3.tasks['l1|write-drill']);
    ok('无时间戳→score 取大者', r3.score === 8);
    // 场景 4：books/lessons 按 id 并集（本地新增书单/课程不丢）
    const local4 = mkEc({ books: [{ id: 'b1', name: '书一', order: 1 }, { id: 'bNEW', name: '新书', order: 2 }], lessons: [{ id: 'l1', bookId: 'b1', name: 'L1', order: 1 }, { id: 'lNEW', bookId: 'bNEW', name: '新课', order: 1 }] });
    const cloud4 = mkEc();
    const r4 = EC.ecMergeEngcheck(local4, cloud4, '', '2026-10-25T00:00:00.000Z');
    ok('并集保留本地新书', r4.books.some(b => b.id === 'bNEW') && r4.books.some(b => b.id === 'b1'));
    ok('并集保留本地新课', r4.lessons.some(l => l.id === 'lNEW') && r4.lessons.some(l => l.id === 'l1'));
    // 场景 5：本地无数据 → 用云端
    ok('本地无 engcheck→用云端', EC.ecMergeEngcheck(undefined, cloud1, '', '2026-10-25T03:00:00.000Z') === cloud1);
    // --- 提前复习反馈 ---
    const EC2 = makeEC();
    const d2 = EC2.ecData();
    d2.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    d2.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    d2.fsrs.l1 = EC2.ecFsrsLearn(Date.now() - 3 * 86400000); // 3 天前入池，due 已过
    EC2.state._ecEarlyId = 'l1';
    const scoreBefore = d2.score;
    EC2.ecReciteAction('l1', '3'); // Good
    ok('打分后清除行内展开（不再卡住）', EC2.state._ecEarlyId === null);
    ok('打分后记录即时反馈', !!EC2.state._ecLastReview && EC2.state._ecLastReview.id === 'l1' && EC2.state._ecLastReview.text.includes('Good'));
    ok('反馈含加分与下次复习', EC2.state._ecLastReview.text.includes('+2 分') && EC2.state._ecLastReview.text.includes('下次复习'));
    ok('Good 加分 +2', d2.score === scoreBefore + 2);
    EC2.state._ecLessonId = 'l1';
    const hLesson = EC2.ecRenderLesson();
    ok('课程页背诵面板显示反馈条', hLesson.includes('ec-review-feedback') && hLesson.includes('已评价'));
    const hReview = EC2.ecRenderReview();
    ok('复习页显示反馈条', hReview.includes('ec-review-feedback'));
}

// ============ 十一、v20261025e：当日推荐 / 卡片状态 / 行内编辑 ============
console.log('—— v20261025e 课程列表 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    ['L1', 'L2', 'L3'].forEach((n, i) => d.lessons.push({ id: 'l' + (i + 1), bookId: 'b1', name: n, order: i + 1, createdAt: 'x' }));
    // 推荐：L1/L2 未完成 → 推荐 L1
    let reco = EC.ecTodayRecommend('b1');
    ok('未完成时推荐第一个任务课', !!reco && reco.kind === 'task' && reco.lesson.id === 'l1');
    let html = EC.ecTodayRecommendHTML('b1');
    ok('推荐卡含课程名与进度', html.includes('今日推荐') && html.includes('L1') && html.includes('任务 0/5'));
    // L1 全部完成 → 推荐 L2
    d.books[0].tasks.forEach(t => { d.tasks['l1|' + t.id] = { at: Date.now() }; });
    reco = EC.ecTodayRecommend('b1');
    ok('L1 完成后推荐下一课 L2', !!reco && reco.kind === 'task' && reco.lesson.id === 'l2');
    // 全部完成任务 + L1 背诵到点 → 推荐背诵 L1
    d.books[0].tasks.forEach(t => { d.tasks['l2|' + t.id] = { at: Date.now() }; d.tasks['l3|' + t.id] = { at: Date.now() }; });
    d.fsrs.l1 = { s: 2, d: 5, n: 1, lapses: 0, last: Date.now() - 5 * 86400000, due: Date.now() - 86400000, grade: 3 };
    reco = EC.ecTodayRecommend('b1');
    ok('任务全完成+有到点背诵→推荐背诵', !!reco && reco.kind === 'recite' && reco.lesson.id === 'l1');
    html = EC.ecTodayRecommendHTML('b1');
    ok('背诵推荐卡文案', html.includes('背诵到点') && html.includes('背书'));
    // 全部完成且背诵已掌握 → 显示今日完成
    d.fsrs.l1.s = 100;
    reco = EC.ecTodayRecommend('b1');
    ok('全部完成→无推荐', reco === null);
    html = EC.ecTodayRecommendHTML('b1');
    ok('全部完成显示庆祝卡', html.includes('今日推荐') && html.includes('都完成啦'));
    // 渲染：卡片状态与按钮位置
    EC.state._ecBookId = 'b1';
    html = EC.ecRenderLessons();
    ok('完成课程带 done 卡片 class', html.includes('ec-lesson-done'));
    ok('默认无行内操作区（不占位）', !html.includes('ec-row-actions'));
    ok('编辑按钮为行内小按钮', html.includes('ec-edit-btn') && html.includes('ec-lesson-side'));
    // 构造一个 0 完成的新课验证锁标识
    d.lessons.push({ id: 'l4', bookId: 'b1', name: 'L4 新课', order: 4, createdAt: 'x' });
    html = EC.ecRenderLessons();
    ok('未解锁课程显示🔒标识', /ec-lock" title="还没开始这一课">🔒/.test(html));
    // 展开编辑态才有操作按钮组
    EC.state._ecEditLessonId = 'l4';
    html = EC.ecRenderLessons();
    ok('展开编辑才显示操作按钮组', html.includes('ec-row-actions') && html.includes('ec-rename-lesson') && html.includes('ec-delete-lesson'));
}

// ============ 十二、v20261025f：自定义打卡时间 + 学习记录清零 ============
console.log('—— v20261025f 自定义时间与清零 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    // ① 默认系统时间
    EC.ecToggleTask('l1', 'listen-broad');
    ok('打卡默认记录系统时间', Math.abs((d.tasks['l1|listen-broad'].at || 0) - Date.now()) < 5000);
    // ② ecToLocalInput 本地时区格式
    ok('ecToLocalInput 输出本地 datetime 格式', EC.ecToLocalInput(new Date(2026, 8, 1, 10, 30).getTime()) === '2026-09-01T10:30');
    // ③ 补录过去时间
    EC._inputs.ecTaskTimeInput = '2026-09-01T10:30';
    EC.ecEditTaskTime('l1', 'listen-broad');
    setTimeout(() => {
        ok('完成时间可补录为过去日期', d.tasks['l1|listen-broad'].at === new Date('2026-09-01T10:30').getTime());
        // ④ 渲染：任务行完成时间可点击
        EC.state._ecLessonId = 'l1';
        const html = EC.ecRenderLesson();
        ok('任务行完成时间可点击修改', html.includes('ec-time-edit') && html.includes('data-action="ec-edit-time"') && html.includes('完成于 09-01'));
        // ⑤ 验证失败（空值）不改动原记录
        EC._el('ecTaskTimeInput').value = '';
        const before = d.tasks['l1|listen-broad'].at;
        EC.ecEditTaskTime('l1', 'listen-broad');
        setTimeout(() => {
            ok('空时间验证失败不改动原记录', d.tasks['l1|listen-broad'].at === before);
            // ⑥ 学习记录清零（不连带积分）
            d.score = 50; d.streak = 3; d.bestStreak = 5; d.achievements['first-task'] = 'x';
            d.fsrs.l1 = { s: 2, d: 5, n: 1, lapses: 0, last: Date.now() - 86400000, due: Date.now() + 86400000, grade: 3 };
            EC._el('ecClrTasks').checked = true;
            EC._el('ecClrFsrs').checked = true;
            EC._el('ecClrAll').checked = false;
            EC.ecClearRecords();
            setTimeout(() => {
                ok('清零后任务记录清空', Object.keys(d.tasks).length === 0);
                ok('清零后背诵记录清空', Object.keys(d.fsrs).length === 0);
                ok('清零保留书单与课程目录', d.books.length === 1 && d.lessons.length === 1);
                ok('未勾选连带时积分/连续/成就保留', d.score === 50 && d.streak === 3 && !!d.achievements['first-task']);
                // ⑦ 连带积分一起清零
                d.tasks['l1|listen-broad'] = { at: Date.now() };
                EC._el('ecClrTasks').checked = true;
                EC._el('ecClrAll').checked = true;
                EC.ecClearRecords();
                setTimeout(() => {
                    ok('连带清零后积分归零', d.score === 0 && d.streak === 0 && d.bestStreak === 0);
                    ok('连带清零后旧成就清除（first-book 按现状重建）', !d.achievements['first-task'] && !!d.achievements['first-book'] && d.lastStudyDate === '');
                }, 20);
            }, 20);
        }, 20);
    }, 20);
}

// 等待异步断言后汇总
setTimeout(() => {
    console.log(`\n========== 结果：${pass} 通过 / ${fail} 失败 ==========`);
    process.exit(fail ? 1 : 0);
}, 200);
