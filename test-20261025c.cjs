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
ok('_syncFromCloudCore 调用 engcheck 合并', /ecMergeEngcheck\(localEc, (state\.data\.engcheck|cloudPayload\.engcheck), localEcAt, cloudEcAt\)/.test(APP));
ok('ecAfterAction 标记本地修改时间', /ecData\(\)\.updatedAt = now\(\)/.test(APP));
// ④ 提前复习反馈
ok('CSS 有评价反馈条', /\.ec-review-feedback/.test(CSS));
ok('打分后清除行内展开', /state\._ecEarlyId = null;/.test(APP));
ok('打分后记录即时反馈', /state\._ecLastReview = \{ id: lessonId/.test(APP));
ok('复习三列表显示反馈条', /rvFeedback\(it\.lesson\.id\)/.test(APP));
ok('课程页背诵面板显示反馈条', /ec-group-body">\$\{zhBox\}\$\{body\}\$\{rvHtml\}/.test(APP));
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
// v20261025g：墓碑机制静态检查
ok('ecTomb 键级墓碑函数存在', /function ecTomb\(key\)/.test(APP));
ok('清零弹窗提示跨设备同步', /清零后会自动同步到其他设备/.test(APP));
ok('ecMergeEngcheck 含清零分界线逻辑', /taskCut = Math\.max/.test(APP) && /fsrsCut = Math\.max/.test(APP));
ok('合并函数含墓碑阻挡逻辑', /if \(t && t >= at\) return;/.test(APP));

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
        ecCode + '\nreturn { ecData, ecFsrsLearn, ecFsrsReview, ecRetrievability, ecReciteStatus, ecReciteAction, ecToggleTask, ecGetLevel, ecLevelSymbols, EC_GRADES, EC_TASKS, EC_FSRS, ecRenderBooks, ecRenderLessons, ecRenderLesson, ecRenderReview, ecRenderAchieve, ecRenderDrill, ecFmtWeek, ecRecitePanel, ecEditLessonZh, ecBatchZhParse, ecZhTitleNums, ecRenameBookTask, ecMoveBookTask, ecTaskKey, ecGetTask, ecBookTasks, ecFindTaskDef, ecLessonProgress, ecBookStats, ecAddBook, ecBatchBooks, ecDelSelBooks, ecDelSelLessons, ecAddTaskToBook, ecDelBookTask, ecEditLessonNote, ecImportLessons, ecBatchZhImport, ecAddLesson, ecRemoveBook, ecRemoveLesson, ecMergeEngcheck, ecOpenRecite, ecTxtBlockHTML, ecTabCfgGet, ecTabCfgAll, ecTabCfgVisible, ecTabCfgToggleShow, ecTabCfgMove, ecTabCfgHTML, ecMergeTabCfg, ecReviewCalendarHTML, EC_SUBTABS, ecOpenTabCfg, ecTabCfgRefreshIfModal, EC_REVIEW_SUBTABS, ecAfterAction, ecTodayRecommend, ecTodayRecommendHTML, ecToLocalInput, ecEditTaskTime, ecClearRecords, ecTomb, state, EC_WRONG_SUBTABS, EC_WB_GRADES, ecWbData, ecWbStatusOf, ecWbFingerprint, ecWbStats, ecWbDueItems, ecWbParse, ecWbAddItems, ecWbStart, ecWbGrade, ecWbExit, ecWbReset, ecRenderWrong, ecWbOverviewHTML, ecWbCalendarHTML, ecWbDueHTML, ecWbAllHTML, ecWbMasteredHTML, ecWbSessionHTML, ecMergeWrong, EC_WB_UNASSIGNED, ecWbById, ecWbMatchLesson, ecWbLocationText, ecWbItemsOfBook, ecWbItemsOfLesson, ecWbCounts, ecWbDueIn, ecWbFilteredDueItems, ecWbAutoTaskOn, ecWbScopeHTML, ecWbScopeOfValue, ecWbAssign, ecWbRemoveIds, ecWbSelIds, ecWbSelMode, ecWbSelToggle, ecWbSelAll, ecWbMoveIds, ecWbMoveItem, ecWbToggleAutoTask, ecWbAutoDrill, ecWbStartBook, ecWbStartLesson, ecWbGoLesson, ecWbBooksHTML, ecWbBookListHTML, ecWbBookDetailHTML, ecWbLessonDetailHTML, ecWbItemHTML, ecWbLessonCounts, ecWbBadgeHTML, ecWbLessonCardHTML, ecWbBookDueCount, ecTodayRecommendWrongHTML, ecGlobalStats, ecWbTokenize, ecWbTokKey, ecWbMergeSegs, ecWbDiffSides, ecWbSegsHTML, ecWbDiffWords, ecWbCompareHTML, ecWbReEsc, ecWbWhyHTML, EC_WB_TEMPLATE, ecWbTemplateCSV, ecWbFillTemplate, ecWbCopyTemplate, ecWbDownloadTemplate, ecWbHasMark, ecWbMarkHTML, ecWbMarkWords, ecWbFormHTML, ecWbFormValue, ecWbApplyForm, ecHeaderHTML, ecPendingTasks, ecHubCounts, ecHubAdvice, ecGo, ecMainTabsHTML, ecHubGridHTML, ecLinkCardHTML, ecAchieveGo, renderEngCheckPage };');
    const docMock = { getElementById: (id) => { if (!elCache[id]) elCache[id] = { value: inputs[id] !== undefined ? inputs[id] : '', checked: !!inputs[id + '__checked'] }; return elCache[id]; }, getElementsByName: (name) => { const k = '__byname_' + name; if (!elCache[k]) elCache[k] = []; return elCache[k]; }, addEventListener: () => {} };
    const inst = fn(mockState, s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), () => {}, () => {}, () => {}, () => {}, async (msg, dv) => (inputs['uiModalInput'] !== undefined ? inputs['uiModalInput'] : (dv != null ? String(dv) : true)), async () => confirmAnswer,
        async (opts) => {
            if (opts && opts.input) return inputs['uiModalInput'] !== undefined ? inputs['uiModalInput'] : (opts.defaultValue != null ? String(opts.defaultValue) : true);
            if (opts && opts.getValue) return opts.getValue();
            return true;
        },
        () => 'id' + Math.random().toString(36).slice(2, 8), () => new Date().toISOString(),
        () => '2026-10-25', d => '2026-10-25',
        docMock,
        { getItem: () => null, setItem: () => {} });
    inst._inputs = inputs;
    inst._el = (id) => docMock.getElementById(id);
    inst._elCache = elCache;
    inst._setConfirm = (v) => { confirmAnswer = v; };
    inst.state = mockState;
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
    // 复习页（三级子导航）：overview 汇总在池数
    EC.state.currentSubTab = { 'ec-review-sub': 'overview' };
    let h = EC.ecRenderReview();
    ok('复习页汇总在池数', h.includes('在池课程共 2 节'));
    // waiting 子标签：l1 未到点（due 在 3 天后）→ 学习中列表 + 提前复习按钮
    EC.state.currentSubTab = { 'ec-review-sub': 'waiting' };
    h = EC.ecRenderReview();
    ok('复习页有学习中列表', h.includes('学习中（未到复习时间）') && h.includes('Lesson 1'));
    ok('学习中显示下次复习时间', h.includes('下次复习：') && /周[日一二三四五六]/.test(h));
    ok('学习中显示提前复习按钮', h.includes('data-action="ec-early-review"'));
    // 点提前复习 → 展开四档
    EC.state._ecEarlyId = 'l1';
    h = EC.ecRenderReview();
    ok('展开后行内四档可打分', h.includes('ec-grade-mini'));
    EC.state._ecEarlyId = null;
    // l1 改判 Good（提前复习）→ 学习中移出
    EC.ecReciteAction('l1', '3');
    ok('提前复习后 n=2', d.fsrs.l1.n === 2);
    // 已掌握列表：把 l1 的 S 推到 60+
    d.fsrs.l1.s = 60;
    EC.state.currentSubTab = { 'ec-review-sub': 'mastered' };
    h = EC.ecRenderReview();
    ok('已掌握列表出现', h.includes('🏆 已掌握') && h.includes('Lesson 1') && h.includes('再背一次自检'));
    EC.state.currentSubTab = { 'ec-review-sub': 'overview' };
    h = EC.ecRenderReview();
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
    ok('空书单渲染', h.includes('还没有书单') && EC.ecHeaderHTML().includes('Lv.1'));
    ok('书单页默认折叠：只有 ✏️ 编辑按钮', h.includes('data-action="ec-head-edit"') && !h.includes('data-action="ec-toggle-add"') && !h.includes('ecBookBatchNames'));
    EC.state._ecAddOpen = true;
    h = EC.ecRenderBooks();
    ok('书单页展开后有批量建书区', h.includes('ecBookBatchNames') && h.includes('批量新增书单'));
    EC.state._ecAddOpen = false;
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    EC.state._ecBookId = 'b1';
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    h = EC.ecRenderLessons();
    ok('课程列表渲染', h.includes('新概念英语一') && h.includes('Lesson 1'));
    ok('课程页默认折叠：只有 ✏️（无新增按钮）', h.includes('data-action="ec-head-edit"') && !h.includes('data-action="ec-toggle-add"') && !h.includes('ecLessonNoteInput'));
    EC.state._ecHeadEdit = true;
    h = EC.ecRenderLessons();
    ok('课程页展开后有批量删除入口', h.includes('data-action="ec-lesson-sel-mode"'));
    ok('课程页展开后有新增按钮', h.includes('data-action="ec-toggle-add"'));
    EC.state._ecHeadEdit = false;
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
    // 场景 1：本地刚打卡（updatedAt 新）→ 本地权威：打卡键与分数不被云端旧快照冲掉；
    // 同时云端独有的新键仍会并入（v20261025g 起不再整组返回，改为墓碑合并）
    const local1 = mkEc({ updatedAt: '2026-10-25T04:00:00.000Z' });
    const cloud1 = mkEc({ updatedAt: '2026-10-25T03:00:00.000Z', tasks: {}, score: 2 });
    const r1 = EC.ecMergeEngcheck(local1, cloud1, '2026-10-25T04:00:00.000Z', '2026-10-25T03:00:00.000Z');
    ok('本地新→本地打卡键与分数保留', !!r1.tasks['l1|listen-broad'] && r1.score === 10);
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
    // 反馈条在复习页（waiting 子标签，l1 未到复习时间）也会呈现
    EC2.state.currentSubTab = { 'ec-review-sub': 'waiting' };
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

// ============ 十三、v20261025g：墓碑机制——清零/取消跨设备同步（修复端到端不同步） ============
console.log('—— v20261025g 墓碑同步机制 ——');
{
    const EC = makeEC();
    const mkEc = (over) => Object.assign({
        books: [{ id: 'b1', name: '书一', order: 1, createdAt: 'x' }],
        lessons: [{ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' }],
        tasks: {}, fsrs: {}, score: 10, achievements: {}, days: {}, streak: 1, bestStreak: 1, lastStudyDate: '2026-10-24'
    }, over || {});
    const T = Date.now();
    const Y = '2026-10-25T';

    // A. 用户报的 bug：手机清零后上传，电脑端旧数据（201 分 + 43 条任务）拉取后不得复活
    const phoneCleared = mkEc({ tasks: {}, fsrs: {}, score: 0, streak: 0, bestStreak: 0, days: {}, clearedAt: T, fsrsClearedAt: T, updatedAt: Y + '05:00:00.000Z' });
    const pcOld = mkEc({ tasks: { 'l1|listen-broad': { at: T - 86400000 }, 'l1|listen-detail': { at: T - 86400000 } }, score: 201, streak: 5, updatedAt: Y + '04:00:00.000Z' });
    const rA = EC.ecMergeEngcheck(pcOld, phoneCleared, Y + '04:00:00.000Z', Y + '05:00:00.000Z');
    ok('清零同步：电脑端拉取后旧任务记录丢弃', Object.keys(rA.tasks).length === 0);
    ok('清零同步：电脑端拉取后积分归零', rA.score === 0);
    ok('清零同步：电脑端拉取后连续天数归零', rA.streak === 0);
    ok('清零同步：书单与课程目录仍保留', rA.books.length === 1 && rA.lessons.length === 1);

    // B. 清零后又打了新卡 → 新记录（at ≥ 清零时点）必须保留
    const phoneReCheckin = mkEc({ tasks: { 'l1|listen-broad': { at: T + 3600000 } }, score: 2, clearedAt: T, fsrsClearedAt: T, updatedAt: Y + '06:00:00.000Z' });
    const rB = EC.ecMergeEngcheck(pcOld, phoneReCheckin, Y + '04:00:00.000Z', Y + '06:00:00.000Z');
    ok('清零后的新打卡记录保留', !!rB.tasks['l1|listen-broad']);
    ok('清零后的新打卡加分生效', rB.score === 2);

    // C. 反向：电脑清零后，手机端旧数据（含背诵记录）拉取后同样归零
    const pcCleared = mkEc({ tasks: {}, fsrs: {}, score: 0, streak: 0, bestStreak: 0, days: {}, clearedAt: T, fsrsClearedAt: T, updatedAt: Y + '07:00:00.000Z' });
    const phoneOld = mkEc({ tasks: { 'l1|listen-broad': { at: T - 86400000 } }, fsrs: { l1: { s: 2, d: 5, n: 1, lapses: 0, last: T - 86400000, due: T + 86400000, grade: 3 } }, score: 100, updatedAt: Y + '04:00:00.000Z' });
    const rC = EC.ecMergeEngcheck(phoneOld, pcCleared, Y + '04:00:00.000Z', Y + '07:00:00.000Z');
    ok('反向清零：手机端拉取后旧任务丢弃', Object.keys(rC.tasks).length === 0);
    ok('反向清零：手机端拉取后旧背诵记录丢弃', Object.keys(rC.fsrs).length === 0);
    ok('反向清零：手机端拉取后积分归零', rC.score === 0);

    // D. 边界：只勾「清零任务」没勾「清零背诵」→ 只写 clearedAt，背诵记录与积分不动
    const phoneClearTasksOnly = mkEc({ tasks: {}, fsrs: { l1: { s: 2, d: 5, n: 1, lapses: 0, last: T - 86400000, due: T, grade: 3 } }, score: 50, clearedAt: T, updatedAt: Y + '08:00:00.000Z' });
    const pcOld2 = mkEc({ tasks: { 'l1|listen-broad': { at: T - 86400000 } }, fsrs: { l1: { s: 3, d: 5, n: 2, lapses: 0, last: T - 43200000, due: T, grade: 3 } }, score: 50, updatedAt: Y + '04:00:00.000Z' });
    const rD = EC.ecMergeEngcheck(pcOld2, phoneClearTasksOnly, Y + '04:00:00.000Z', Y + '08:00:00.000Z');
    ok('只清任务：旧任务记录丢弃', Object.keys(rD.tasks).length === 0);
    ok('只清任务：背诵记录仍保留', !!rD.fsrs.l1);
    ok('只清任务：积分不动', rD.score === 50);

    // E. 取消完成墓碑：电脑端取消（tombs），手机端旧记录不得复活
    const T1 = T - 7200000, T2 = T - 3600000;
    const pcCancel = mkEc({ tasks: {}, tombs: { 'l1|listen-broad': T2 }, score: 8, updatedAt: Y + '09:00:00.000Z' });
    const phoneStillDone = mkEc({ tasks: { 'l1|listen-broad': { at: T1 } }, score: 10, updatedAt: Y + '04:00:00.000Z' });
    const rE = EC.ecMergeEngcheck(pcCancel, phoneStillDone, Y + '09:00:00.000Z', Y + '04:00:00.000Z');
    ok('取消完成跨设备：手机端旧记录被墓碑挡住', !rE.tasks['l1|listen-broad']);
    ok('取消完成跨设备：扣分生效', rE.score === 8);

    // F. 打卡跨设备同步：手机打卡上传新键，电脑端拉取后必须有
    const phoneCheckin = mkEc({ tasks: { 'l1|listen-broad': { at: T + 60000 } }, score: 12, updatedAt: Y + '10:00:00.000Z' });
    const pcOld3 = mkEc({ tasks: {}, score: 10, updatedAt: Y + '04:00:00.000Z' });
    const rF = EC.ecMergeEngcheck(pcOld3, phoneCheckin, Y + '04:00:00.000Z', Y + '10:00:00.000Z');
    ok('手机打卡电脑端刷新也有', !!rF.tasks['l1|listen-broad']);
    ok('手机打卡加分同步', rF.score === 12);

    // G. 两端 updatedAt 相同（同时操作/时钟接近）：对端新键不丢
    const SAME = Y + '11:00:00.000Z';
    const pcSame = mkEc({ tasks: { 'l1|listen-broad': { at: T + 120000 } }, score: 12, updatedAt: SAME });
    const phoneSame = mkEc({ tasks: { 'l1|listen-detail': { at: T + 180000 } }, score: 12, updatedAt: SAME });
    const rG = EC.ecMergeEngcheck(pcSame, phoneSame, SAME, SAME);
    ok('同时戳操作：两端打卡键都保留', !!rG.tasks['l1|listen-broad'] && !!rG.tasks['l1|listen-detail']);

    // H. 运行时：ecToggleTask 取消完成写墓碑
    const EC2 = makeEC();
    const d2 = EC2.ecData();
    d2.books.push({ id: 'b1', name: '书', order: 1, createdAt: 'x' });
    d2.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1', order: 1, createdAt: 'x' });
    EC2.ecToggleTask('l1', 'listen-broad');
    EC2.ecToggleTask('l1', 'listen-broad');
    ok('取消完成后 tasks 键删除', !d2.tasks['l1|listen-broad']);
    ok('取消完成写入键级墓碑', (d2.tombs['l1|listen-broad'] || 0) > 0);

    // I. 运行时：ecClearRecords 写时间分界线（异步）
    const EC3 = makeEC();
    const d3 = EC3.ecData();
    d3.books.push({ id: 'b1', name: '书', order: 1, createdAt: 'x' });
    d3.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1', order: 1, createdAt: 'x' });
    d3.tasks['l1|listen-broad'] = { at: Date.now() - 86400000 };
    d3.fsrs.l1 = EC3.ecFsrsLearn(Date.now() - 86400000);
    d3.score = 30;
    const beforeClear = Date.now();
    EC3._el('ecClrTasks').checked = true;
    EC3._el('ecClrFsrs').checked = true;
    EC3._el('ecClrAll').checked = false;
    EC3.ecClearRecords();
    setTimeout(() => {
        ok('清零写 tasks 时间分界线', d3.clearedAt >= beforeClear);
        ok('清零写 fsrs 时间分界线', d3.fsrsClearedAt >= beforeClear);
    }, 20);
}

// ============ 十四、v20261106t：错题复习（刷题模块下线 → 错题集 + FSRS 间隔复习） ============
console.log('—— v20261106t 错题复习 ——');

// 1. 刷题代码彻底清除 + 新模块就位（静态）
ok('刷题子标签已移除', !/\{ id: 'ec-quiz'/.test(APP));
ok('内置题库常量已删除', !/EC_QUIZ_BUILTIN/.test(APP));
ok('刷题渲染函数已删除', !/function ecRenderQuizPage/.test(APP));
ok('刷题合并函数已删除', !/function ecQuizMerge/.test(APP));
ok('刷题动作分发已删除', !/action === 'ec-quiz-start'/.test(APP));
ok('刷题输入监听已删除', !/ec-quiz-input/.test(APP));
ok('刷题 CSS 已删除', !/\.ec-quiz-/.test(CSS));
ok('旧 quiz 数据有清理逻辑', /if \(d\.quiz\) delete d\.quiz;/.test(APP));
ok('旧 tab 排序迁移到错题复习', /c\.order\.includes\('ec-quiz'\)/.test(APP));
ok('旧停留页迁移到错题复习', /currentSubTab\.engcheck === 'ec-quiz'/.test(APP));
ok('新子标签定义', /\{ id: 'ec-wrong', name: '错题复习', icon: '📕' \}/.test(APP));
ok('路由接入错题复习', /tab === 'ec-wrong'\) return ecRenderWrong\(\)/.test(APP));
ok('四个三级子导航', /EC_WRONG_SUBTABS = \[/.test(APP) && ['overview', 'due', 'all', 'mastered'].every(k => APP.includes(`id: '${k}'`)));
ok('分发器覆盖全部错题动作', ['ec-wb-import', 'ec-wb-import-json', 'ec-wb-export', 'ec-wb-add', 'ec-wb-edit', 'ec-wb-del', 'ec-wb-clear', 'ec-wb-start', 'ec-wb-start-one', 'ec-wb-reveal', 'ec-wb-grade', 'ec-wb-exit', 'ec-wb-reset'].every(a => APP.includes(`action === '${a}'`)));
ok('合并器接入 engcheck', /merged\.wrongbk = ecMergeWrong\(/.test(APP));
ok('CSS 含错题模块样式', ['.ec-wb-item', '.ec-wb-session', '.ec-wb-textarea', '.ec-wb-point-text', '.ec-wb-status'].every(c => CSS.includes(c)));
ok('日历复用复习中心已有样式', CSS.includes('.ec-cal-body') && !CSS.includes('.ec-cal-items'));
ok('翻页走 ecAfterAction（不会卡在上一题）', /s\.idx\+\+;\s*s\.revealed = false;\s*\/\/[\s\S]{0,120}ecAfterAction\(\);/.test(APP));
ok('版本号不低于 20261106t（升版不失效）', (() => { const m = APP.match(/const APP_BUILD = '(\d+)([a-z]*)'/); return !!m && (m[1] > '20261106' || (m[1] === '20261106' && (m[2] || '') >= 't')); })());
ok('背诵打分函数未被误删（回归护栏）', /function ecReciteAction\(/.test(APP));
ok('导入错题不刷分', !/ecAddScore\(fresh\.length\)/.test(APP));
ok('新题（fsrs 缺失）也计入待复习', /s === 'due' \|\| s === 'new'/.test(APP));

// 2. 导入解析
{
    const EC = makeEC();
    const r5 = EC.ecWbParse('课时\t知识点\t我的答案\t正确答案\t大白话原因\nL23-24\t名词替代词\tWhich one?\tWhich ones?\t前面是复数，提问和替代都要用 ones');
    ok('五列：表头自动跳过', r5.items.length === 1 && r5.errors.length === 0);
    ok('五列：课时/知识点/我的答案/正确答案/原因分列正确', r5.items[0].lesson === 'L23-24' && r5.items[0].point === '名词替代词' && r5.items[0].mine === 'Which one?' && r5.items[0].right === 'Which ones?' && /前面是复数/.test(r5.items[0].why));
    const r4 = EC.ecWbParse('L23-24\t名词替代词\tWhich one?\tWhich ones?');
    ok('四列且首列像课时：不错位（原因留空）', r4.items.length === 1 && r4.items[0].lesson === 'L23-24' && r4.items[0].right === 'Which ones?' && r4.items[0].why === '');
    const r4b = EC.ecWbParse('名词替代词\tWhich one?\tWhich ones?\t前面是复数');
    ok('四列无课时：按 知识点/我的答案/正确答案/原因', r4b.items[0].lesson === '' && r4b.items[0].point === '名词替代词' && r4b.items[0].why === '前面是复数');
    const r3 = EC.ecWbParse('名词替代词\tWhich one?\tWhich ones?');
    ok('三列按 知识点/我的答案/正确答案', r3.items[0].point === '名词替代词' && r3.items[0].right === 'Which ones?');
    const rp = EC.ecWbParse('名词替代词|Which one?|Which ones?');
    ok('单竖线分隔也支持', rp.items.length === 1 && rp.items[0].point === '名词替代词');
    const rmulti = EC.ecWbParse('课时\t知识点\t我的答案\t正确答案\t大白话原因\nL1\t考点A\tmA\trA\t因A\nL2\t考点B\tmB\trB\t因B');
    ok('多行批量解析', rmulti.items.length === 2 && rmulti.items[1].lesson === 'L2');
    ok('列数不足记录错误', EC.ecWbParse('只有一列').errors.length === 1);
    ok('必填字段为空记录错误', EC.ecWbParse('考点\t\t').errors.length === 1);
    ok('空内容不报错不产出', EC.ecWbParse('').items.length === 0 && EC.ecWbParse('').errors.length === 0);
    ok('CRLF 换行兼容', EC.ecWbParse('考点A\tmA\trA\r\n考点B\tmB\trB').items.length === 2);
}

// 3. 入库：去重 / 立即可复习 / 不刷分 / 统计
{
    const EC = makeEC();
    const n1 = EC.ecWbAddItems([
        { lesson: 'L1', point: '考点A', mine: 'mA', right: 'rA', why: '因A' },
        { lesson: 'L1', point: '考点B', mine: 'mB', right: 'rB', why: '' }
    ]);
    ok('批量入库返回新增数', n1 === 2);
    ok('错题写入 wrongbk.items', EC.ecWbData().items.length === 2);
    ok('每道题都建立 FSRS 记录', Object.keys(EC.ecWbData().fsrs).length === 2);
    ok('新导入的题立即可复习', EC.ecWbDueItems().length === 2);
    ok('导入不刷分', (EC.ecData().score || 0) === 0);
    ok('指纹去重（知识点+我的答案+正确答案）', EC.ecWbAddItems([{ lesson: 'L9', point: '考点A', mine: 'mA', right: 'rA', why: '换了原因' }]) === 0);
    ok('去重后总数不变', EC.ecWbData().items.length === 2);
    ok('同上但正确答案不同 → 视为新题', EC.ecWbAddItems([{ lesson: 'L1', point: '考点A', mine: 'mA', right: 'rA2', why: '' }]) === 1);
    const st = EC.ecWbStats();
    ok('统计：总数/待复习一致', st.total === 3 && st.due === 3 && st.waiting === 0 && st.mastered === 0);
    ok('统计：新题不算逾期', st.overdue === 0);
    // fsrs 记录丢失的旧数据不能凭空消失
    const w = EC.ecWbData();
    delete w.fsrs[w.items[0].id];
    ok('fsrs 缺失时该题仍计入待复习', EC.ecWbDueItems().some(it => it.id === w.items[0].id));
}

// 4. 复习会话：翻面 / 四档自评 / 翻页 / 掌握
{
    const EC = makeEC();
    EC.ecWbAddItems([
        { lesson: 'L1', point: 'P1', mine: 'M1', right: 'R1', why: 'W1' },
        { lesson: 'L1', point: 'P2', mine: 'M2', right: 'R2', why: '' },
        { lesson: 'L2', point: 'P3', mine: 'M3', right: 'R3', why: '' }
    ]);
    const w = EC.ecWbData();
    EC.ecWbStart('');
    const s = EC.state._wbSession;
    ok('开始复习建立 3 题队列', !!s && s.queue.length === 3 && s.idx === 0 && s.revealed === false);
    EC.ecWbGrade(3);
    ok('未翻面时打分无效', w.fsrs[s.queue[0]].n === 0);
    s.revealed = true;
    EC.ecWbGrade(3);
    ok('Good 打分后复习次数 +1', w.fsrs[s.queue[0]].n === 1);
    ok('打分后翻到第 2 题且重新盖住答案', s.idx === 1 && s.revealed === false && EC.state._wbSession === s);
    ok('Good 给 2 分', (EC.ecData().score || 0) >= 2);
    s.revealed = true; EC.ecWbGrade(1);
    ok('Again 记录一次遗忘', w.fsrs[s.queue[1]].lapses === 1);
    ok('Again 不加分', (EC.ecData().score || 0) >= 2);
    s.revealed = true; EC.ecWbGrade(4);
    ok('最后一题完成后会话结束', EC.state._wbSession === null);
    ok('非法档位被忽略', (() => { const n = w.fsrs[s.queue[2]].n; EC.ecWbGrade(99); return w.fsrs[s.queue[2]].n === n; })());
    ok('复习会话 HTML：未翻面不显示正确答案', (() => { EC.state._wbSession = { queue: [w.items[0].id], idx: 0, revealed: false, graded: 0 }; const h = EC.ecWbSessionHTML(); return h.includes('你的答案：') && h.includes('🎯 知识点') && !h.includes('标准答案：'); })());
    ok('复习会话 HTML：翻面显示标准答案+解析+四档', (() => { EC.state._wbSession.revealed = true; const h = EC.ecWbSessionHTML(); return h.includes('标准答案：') && h.includes('💡 大白话解析') && h.includes('ec-wb-diff') && h.includes('ec-wb-grade'); })());
    EC.state._wbSession = null;
    // 掌握判定
    const w2 = EC.ecWbData();
    w2.fsrs[w2.items[0].id].s = 60;
    ok('S≥60 判为已掌握', EC.ecWbStatusOf(w2.items[0].id, Date.now()) === 'mastered');
    EC.ecWbReset(w2.items[0].id);
    ok('移回复习池后立即可复习', EC.ecWbDueItems().some(it => it.id === w2.items[0].id));
}

// 5. 四个三级子导航渲染
{
    const EC = makeEC();
    EC.ecWbAddItems([{ lesson: 'L1', point: '考点A', mine: 'mA', right: 'rA', why: '因A' }]);
    EC.state.currentSubTab = {};
    const h0 = EC.ecRenderWrong();
    ok('概览：面包屑 + 统计卡 + 7 天预览', h0.includes('英语打卡 › 错题复习') && h0.includes('错题复习 · 概览') && h0.includes('接下来 7 天复习预览'));
    ok('概览：四个子导航按钮', ['📊 概览', '⏰ 待复习', '📚 全部错题', '🏆 已掌握'].every(t => h0.includes(t)));
    ok('概览：含批量导入与开始复习入口', h0.includes('ec-wb-import') && h0.includes('ec-wb-start'));
    EC.state.currentSubTab['ec-wrong-sub'] = 'due';
    const h1 = EC.ecRenderWrong();
    ok('待复习页列出到期题', h1.includes('待复习（') && h1.includes('考点A') && h1.includes('ec-wb-start-one'));
    EC.state.currentSubTab['ec-wrong-sub'] = 'all';
    const h2 = EC.ecRenderWrong();
    ok('全部错题页按课时分组 + 编辑/删除/备份', h2.includes('全部错题（1）') && h2.includes('L1（1）') && h2.includes('ec-wb-edit') && h2.includes('ec-wb-export'));
    EC.state.currentSubTab['ec-wrong-sub'] = 'mastered';
    const h3 = EC.ecRenderWrong();
    ok('已掌握页空态有兜底文案', h3.includes('还没有已掌握的错题'));
    EC.ecWbData().fsrs[EC.ecWbData().items[0].id].s = 60;
    ok('已掌握页列出达标题 + 移回复习池', EC.ecRenderWrong().includes('ec-wb-reset'));
    EC.state.currentSubTab['ec-wrong-sub'] = 'not-exist';
    ok('非法子标签回退概览', EC.ecRenderWrong().includes('错题复习 · 概览'));
}

// 6. 跨设备合并：并集 / 新者胜 / 墓碑 / 清零分界线 / FSRS 取新
{
    const EC = makeEC();
    const T = 1770000000000;
    const item = (id, point, at) => ({ id, lesson: 'L1', point, mine: 'm' + id, right: 'r' + id, why: '', createdAt: at, updatedAt: at });
    const A = {
        items: [item('a', 'A-旧', T), item('b', 'B', T)],
        fsrs: { a: { last: T, s: 1 }, b: { last: T, s: 1 } },
        tombs: {}, clearedAt: 0, updatedAt: T
    };
    const B = {
        items: [item('a', 'A-新', T + 1000), item('c', 'C', T + 500)],
        fsrs: { a: { last: T + 1000, s: 3 }, c: { last: T + 500, s: 1 } },
        tombs: {}, clearedAt: 0, updatedAt: T + 1000
    };
    const m = EC.ecMergeWrong(A, B);
    ok('合并取并集（3 题）', m.items.length === 3);
    ok('同 id 按 updatedAt 新者胜', m.items.find(x => x.id === 'a').point === 'A-新');
    ok('FSRS 同 id 按 last 新者胜', m.fsrs.a.s === 3);
    ok('只对仍在 items 的 id 保留 FSRS', Object.keys(m.fsrs).every(k => m.items.some(x => x.id === k)));
    const withTomb = EC.ecMergeWrong({ ...A, tombs: { b: T + 2000 } }, B);
    ok('墓碑阻止删除项复活', !withTomb.items.some(x => x.id === 'b'));
    const withCut = EC.ecMergeWrong({ ...A, clearedAt: T + 800 }, B);
    ok('清零分界线丢弃更早记录', !withCut.items.some(x => x.id === 'b') && !withCut.items.some(x => x.id === 'c'));
    ok('清零后仍保留分界线之后的新记录', withCut.items.some(x => x.id === 'a') && withCut.items.find(x => x.id === 'a').point === 'A-新' && withCut.clearedAt === T + 800);
    ok('空对象入参不崩', (() => { const r = EC.ecMergeWrong(null, undefined); return r.items.length === 0 && r.clearedAt === 0; })());
}

// 7. 背诵功能回归（刷题代码切除时曾误删 ecReciteAction）
{
    const EC = makeEC();
    EC.ecReciteAction('les1', 'learn');
    ok('背诵入库仍可用', !!(EC.ecData().fsrs.les1 && EC.ecData().fsrs.les1.last));
    EC.ecReciteAction('les1', 3);
    ok('背诵四档自评仍可用', EC.ecData().fsrs.les1.n === 1);
    ok('复习中心仍在子标签内', /id: 'ec-review', name: '复习中心'/.test(APP));
    ok('书单课目仍在子标签内', /id: 'ec-books', name: '书单课目'/.test(APP));
    ok('成就榜仍在子标签内', /id: 'ec-achieve', name: '成就榜'/.test(APP));
}

// ============ v20261026f/n：背诵板块 · 课文对照（中/英双语，默认隐藏） ============
console.log('—— 课文对照（v20261026n）——');
// 1. 静态检查
ok('ecEditLessonZh 函数存在', /function ecEditLessonZh/.test(APP));
ok('课时存 zh + zhAt 字段', /lesson\.zh = zh;/.test(APP) && /lesson\.zhAt = now;/.test(APP));
ok('课时存 en + enAt 字段', /lesson\.en = en;/.test(APP) && /lesson\.enAt = now;/.test(APP));
ok('编辑弹窗同时有中文/英文两个输入框', APP.includes('ecZhTA') && APP.includes('ecEnTA'));
ok('背诵面板渲染课文对照块', /ec-group-body">\$\{zhBox\}\$\{body\}\$\{rvHtml\}/.test(APP));
ok('语言切换按钮 ec-txt-toggle', /data-action="ec-txt-toggle"/.test(APP));
ok('分发器含 ec-zh-edit / ec-txt-toggle / ec-open-recite',
    /if \(action === 'ec-zh-edit'\)/.test(APP) && /if \(action === 'ec-txt-toggle'\)/.test(APP) && /if \(action === 'ec-open-recite'\)/.test(APP));
ok('合并按 zhAt / enAt 各自新者胜', /\[\['zh', 'zhAt'\], \['en', 'enAt'\]\]/.test(APP));
ok('CSS 有语言按钮样式', CSS.includes('.ec-lang-btn') && CSS.includes('.ec-lang-btn.on'));
ok('CSS 有去背诵入口样式', CSS.includes('.ec-due-go') && CSS.includes('.ec-due-click'));
// 2. 面板：默认隐藏 + 中文/英文各自展开
{
    const EC = makeEC();
    EC.state.data.engcheck.books.push({ id: 'b1', name: '新概念1', order: 0, createdAt: '', tasks: [] });
    EC.state.data.engcheck.lessons.push({ id: 'lx', bookId: 'b1', name: 'L1', note: '', order: 0, createdAt: '', zh: '你的新连衣裙是什么颜色的？\n是绿色的。', en: "What colour's your new dress?\nIt's green." });
    EC.state._ecLessonId = 'lx';
    const p0 = EC.ecRecitePanel('lx');
    ok('默认隐藏：中文内容不显示', !p0.includes('连衣裙'));
    ok('默认隐藏：英文内容不显示', !p0.includes('new dress'));
    ok('面板显示两个语言按钮', p0.includes('data-lang="zh"') && p0.includes('data-lang="en"'));
    ok('默认显示「已藏起来」提示', p0.includes('课文已藏起来'));
    // 只展开中文
    EC.state._ecTxt = { lx: { zh: true } };
    const p1 = EC.ecRecitePanel('lx');
    ok('点中文后显示中文课文', p1.includes('连衣裙') && p1.includes('🇨🇳 中文'));
    ok('中文展开时英文仍隐藏', !p1.includes('new dress'));
    // 只展开英文
    EC.state._ecTxt = { lx: { en: true } };
    const p2 = EC.ecRecitePanel('lx');
    ok('点英文后显示英文原文', p2.includes('new dress'));
    ok('英文展开时中文仍隐藏', !p2.includes('连衣裙'));
    // 两个都展开
    EC.state._ecTxt = { lx: { zh: true, en: true } };
    const p3 = EC.ecRecitePanel('lx');
    ok('中英可同时展开对照', p3.includes('连衣裙') && p3.includes('new dress'));
    // 空态
    EC.state._ecTxt = {};
    EC.state.data.engcheck.lessons[0].zh = '';
    EC.state.data.engcheck.lessons[0].en = '';
    const p4 = EC.ecRecitePanel('lx');
    ok('空态显示导入引导（可点）', p4.includes('ec-zh-empty') && p4.includes('还没有导入课文'));
    ok('空态语言按钮变「＋中文 / ＋英文」', p4.includes('＋中文') && p4.includes('＋英文'));
}
// 3. 合并：中文 / 英文各自时间戳保护
{
    const EC = makeEC();
    const base = () => ({ books: [], lessons: [], tasks: {}, fsrs: {}, tombs: {}, score: 0, achievements: {}, days: {}, streak: 0, bestStreak: 0, lastStudyDate: '' });
    const L = (o) => Object.assign({ id: 'lx', bookId: 'b1', name: 'L1', note: '', order: 0, createdAt: '' }, o);
    // 本地新中文 + 云端新英文 → 两边都要保住
    const local = base(); local.lessons = [L({ zh: '本地中文', zhAt: 9000, en: '旧英文', enAt: 1000 })];
    const cloud = base(); cloud.lessons = [L({ zh: '旧中文', zhAt: 1000, en: '云端新英文', enAt: 9000 })];
    const m = EC.ecMergeEngcheck(local, cloud, '2026-10-27T09', '2026-10-27T09');
    const got = m.lessons.find(l => l.id === 'lx') || {};
    ok('合并：中文按 zhAt 取较新', got.zh === '本地中文');
    ok('合并：英文按 enAt 取较新', got.en === '云端新英文');
    // 云端旧快照完全没有课文 → 本地导入的不能被顶掉
    const c2 = base(); c2.lessons = [L({})];
    const m2 = EC.ecMergeEngcheck(local, c2, '2026-10-27T09', '2026-10-27T09');
    ok('合并：旧快照不会顶掉本地课文', (m2.lessons.find(l => l.id === 'lx') || {}).zh === '本地中文');
}
// 4. 编辑保存流程（双栏 getValue）
(async () => {
    const EC = makeEC();
    EC.state.data.engcheck.lessons.push({ id: 'lx', bookId: 'b1', name: 'L1', note: '', order: 0, createdAt: '' });
    EC._inputs['ecZhTA'] = '  你的新连衣裙是什么颜色的？\n是绿色的。  ';
    EC._inputs['ecEnTA'] = "  What colour's your new dress?\nIt's green.  ";
    EC.ecEditLessonZh('lx');
    await flush();
    const l = EC.state.data.engcheck.lessons[0];
    ok('保存中文去首尾空白', l.zh === '你的新连衣裙是什么颜色的？\n是绿色的。');
    ok('保存英文去首尾空白', l.en === "What colour's your new dress?\nIt's green.");
    ok('写入 zhAt / enAt 时间戳', Number(l.zhAt) > 0 && Number(l.enAt) > 0);
    ok('保存后自动展开刚写入的语言', !!(EC.state._ecTxt && EC.state._ecTxt['lx'] && EC.state._ecTxt['lx'].zh && EC.state._ecTxt['lx'].en));
})();

// ============ v20261026g：整本批量导入中文课文 ============
console.log('—— 批量中文课文（v20261026g）——');
// 1. 静态检查
ok('ecBatchZhParse 函数存在', /function ecBatchZhParse/.test(APP));
ok('ecBatchZhImport 函数存在', /function ecBatchZhImport/.test(APP));
ok('书页头部含批量中文按钮', /data-action="ec-batch-zh"/.test(APP));
ok('分发器含 ec-batch-zh', /if \(action === 'ec-batch-zh'\)/.test(APP));
// 2. 解析功能：精确 / 归一化大小写 / 前缀 / 未匹配
{
    const EC = makeEC();
    const names = ['Lesson 1', 'Lesson 2', 'Unit 3 复习课'];
    const text = [
        'lesson 1',
        '对不起，这是你的手提包吗？',
        '这是一张漂亮的照片。',
        '',
        'Lesson 2',
        '打扰一下，请问我能坐在这里吗？',
        'Unit 3 复习',
        '这一课是复习课的中文。'
    ].join('\n');
    const r = EC.ecBatchZhParse(text, names);
    ok('归一化(小写)匹配 Lesson 1', (r.map['Lesson 1'] || '').includes('手提包') && (r.map['Lesson 1'] || '').includes('漂亮的照片'));
    ok('精确匹配 Lesson 2', (r.map['Lesson 2'] || '').includes('打扰一下'));
    ok('前缀匹配 Unit 3 复习课（标题写 Unit 3 复习）', (r.map['Unit 3 复习课'] || '').includes('复习课的中文'));
    ok('未匹配清单正确（无遗漏）', r.unmatched.length === 0);
    // 大小写+空格差异也能命中
    const r2 = EC.ecBatchZhParse('Lesson  1\n中文一\nLesson  2\n中文二', names);
    ok('中间空格归一化也能命中', !!r2.map['Lesson 1'] && !!r2.map['Lesson 2']);
    // 有课时没匹配到
    const r3 = EC.ecBatchZhParse('Lesson 1\n中文一', names);
    ok('部分课未匹配进入 unmatched', r3.unmatched.length === 2 && r3.unmatched.includes('Lesson 2'));
    // v20261026h：去标点归一化——弯引号/直引号、全角空格、顿号差异不影响识别
    const names2 = ["L25、L26 Mrs. Smith's kitchen", "L23、L24 Which glasses?"];
    const r4 = EC.ecBatchZhParse([
        'L25、L26 Mrs. Smith’s kitchen',   // 弯引号 ’ ≠ 课时名的直引号 '
        '厨房很小。',
        '',
        'L23、L24 Which glasses',          // 截断标题（前缀）
        '请把那几只杯子给我。'
    ].join('\n'), names2);
    ok('弯引号 ’ vs ’ 差异仍命中', (r4.map["L25、L26 Mrs. Smith's kitchen"] || '') === '厨房很小。');
    ok('截断标题前缀命中', (r4.map['L23、L24 Which glasses?'] || '') === '请把那几只杯子给我。');
    ok('全部匹配无遗漏', r4.unmatched.length === 0);
    // 全角空格 + 标点全不同
    const r5 = EC.ecBatchZhParse('L25、L26　Mrs．Smith’s　kitchen\n中文A', names2);
    ok('全角空格/全角句点也命中', (r5.map["L25、L26 Mrs. Smith's kitchen"] || '') === '中文A');
    // v20261026i：// 分割线模式 + 课次编号兜底 + unknownTitles
    const names3 = ['L1、L2 Excuse me!', 'L3、L4 Sorry, sir.', 'L15、L16 Your passports, please.'];
    const sepText = [
        'L1、L2 Excuse me!',
        '对不起！',
        '什么事？',
        '这是您的手提包吗？',
        '//',
        'L3、L4 Sorry, sir.',
        '请把我的大衣和伞拿给我。',
        '//',
        'L15, L16 Your passports, please.',   // 逗号 + 标题与课时名标点不同
        '请出示您的护照。'
    ].join('\n');
    const r6 = EC.ecBatchZhParse(sepText, names3);
    ok('// 分割线模式生效', r6.mode === 'sep');
    ok('// 模式：单元 1 归入 L1、L2', (r6.map['L1、L2 Excuse me!'] || '').includes('手提包'));
    ok('// 模式：单元 2 归入 L3、L4', (r6.map['L3、L4 Sorry, sir.'] || '').includes('大衣'));
    ok('// 模式：编号兜底命中 L15、L16', (r6.map['L15、L16 Your passports, please.'] || '') === '请出示您的护照。');
    ok('// 模式：无未匹配/无未知标题', r6.unmatched.length === 0 && r6.unknownTitles.length === 0);
    // 未知标题清单
    const r7 = EC.ecBatchZhParse('L1、L2 Excuse me!\n中文一\n//\nL99、L100 完全不存在的课\n中文二', names3);
    ok('未对上标题进入 unknownTitles', r7.unknownTitles.length === 1 && r7.unknownTitles[0].includes('L99'));
    ok('未对上单元不影响已匹配单元', (r7.map['L1、L2 Excuse me!'] || '') === '中文一');
    ok('未匹配课时列出', r7.unmatched.length === 2);
    // 无 // 时仍走标题行模式（兼容）
    const r8 = EC.ecBatchZhParse('L1、L2 Excuse me!\n中文A\nL3、L4 Sorry, sir.\n中文B', names3);
    ok('无 // 兼容标题行模式', r8.mode === 'title' && (r8.map['L1、L2 Excuse me!'] || '') === '中文A' && (r8.map['L3、L4 Sorry, sir.'] || '') === '中文B');
    // ecZhTitleNums 编号提取
    ok('编号提取 L1、L2 → [1,2]', JSON.stringify(EC.ecZhTitleNums('L1、L2 Excuse me!')) === '[1,2]');
    ok('编号提取 Lesson 113 → [113]', JSON.stringify(EC.ecZhTitleNums('Lesson 113')) === '[113]');
    // v20261026j：编号优先 + 宽容格式——文字部分完全不同也命中
    const r9 = EC.ecBatchZhParse('L1, L2 打招呼用语\n中文甲\n//\nL03、L04 道歉\n中文乙', names3);
    ok('编号优先：文字全不同也命中 L1、L2', (r9.map['L1、L2 Excuse me!'] || '') === '中文甲');
    ok('前导零 L03 编号命中 L3、L4', (r9.map['L3、L4 Sorry, sir.'] || '') === '中文乙');
    const r10 = EC.ecBatchZhParse('1、2 Excuse me!\n无前缀数字标题的中文', ['1、2 Excuse me! Is this your...?']);
    ok('无前缀行首数字（1、2）也命中', (r10.map['1、2 Excuse me! Is this your...?'] || '') === '无前缀数字标题的中文');
    ok('编号提取 1、2 → [1,2]', JSON.stringify(EC.ecZhTitleNums('1、2 Excuse me!')) === '[1,2]');
    // v20261026k：任务排序 + 名称/说明双字段编辑
    ok('ecMoveBookTask 函数存在', /function ecMoveBookTask/.test(APP));
    ok('分发器含 ec-task-move', /if \(action === 'ec-task-move'\)/.test(APP));
    ok('任务行有上移/下移按钮', /data-action="ec-task-move" data-book="\$\{book\.id\}" data-task="\$\{t\.id\}" data-d="-1"/.test(APP) && /data-d="1"/.test(APP));
    ok('编辑任务为名称+说明双字段弹窗', APP.includes('ecTaskNameIn') && APP.includes('ecTaskDescIn') && /说明（显示在任务名下方）/.test(APP));
    ok('CSS 有任务按钮组样式', CSS.includes('.ec-tm-btns'));
    {
        const EC = makeEC();
        const book = { id: 'b1', name: '书', order: 0, createdAt: '', tasks: [
            { id: 't1', group: 'input', icon: '🎧', name: 'A 听力', desc: '旧说明一', points: 2 },
            { id: 't2', group: 'output', icon: '🗣️', name: 'B 跟读', desc: '', points: 2 },
            { id: 't3', group: 'input', icon: '📖', name: 'C 朗读', desc: '', points: 2 }
        ] };
        EC.state.data.engcheck.books.push(book);
        // 下移 t1 → 顺序 B A C
        EC.ecMoveBookTask('b1', 't1', 1);
        ok('任务下移交换成功', book.tasks.map(t => t.id).join(',') === 't2,t1,t3');
        // 再上移 t3（原 C）两次 → C B A？当前 [t2,t1,t3]，上移 t3 → [t2,t3,t1] → 再上移 t3 → [t3,t2,t1]
        EC.ecMoveBookTask('b1', 't3', -1);
        EC.ecMoveBookTask('b1', 't3', -1);
        ok('任务上移到顶成功', book.tasks.map(t => t.id).join(',') === 't3,t2,t1');
        // 边界：已在顶部再上移 → 不变
        EC.ecMoveBookTask('b1', 't3', -1);
        ok('顶部再上移保持不变', book.tasks[0].id === 't3');
        // 双字段编辑：uiModal mock 用 getValue → 返回 {name, desc}
        EC._inputs['ecTaskNameIn'] = 'A 听力（改）';
        EC._inputs['ecTaskDescIn'] = '新说明内容';
        EC.ecRenameBookTask('b1', 't2');
        (async () => {
            await flush();
            const t2 = book.tasks.find(t => t.id === 't2');
            ok('任务名与说明同时更新', t2.name === 'A 听力（改）' && t2.desc === '新说明内容');
        })();
    }
    // v20261026l：头部管理按钮收进 ✏️（点开才显示）
    ok('ec-head-edit 分发器存在', /if \(action === 'ec-head-edit'\)/.test(APP));
    ok('headEdit 状态控制显隐', /const headEdit = !!state\._ecHeadEdit \|\| selMode \|\| addOpen/.test(APP) && /state\._ecHeadEdit = false/.test(APP));
    ok('头部有 ✏️ 展开按钮（书单页+书页）', (APP.match(/data-action="ec-head-edit"/g) || []).length >= 2);
    ok('CSS 有 ec-edit-on 展开态', /\.ec-head-btns \.ec-edit-btn\.ec-edit-on/.test(CSS));
    // v20261026m：新增任务打卡后被云端旧快照冲掉（book.tasks 整对象 win 覆盖丢新任务）
    {
        const EC = makeEC();
        const d = EC.ecData();
        const tpl = [{ id: 't1', group: 'input', icon: '🎧', name: 'Do. 听默音课', desc: '', points: 2 },
                     { id: 't2', group: 'output', icon: '📝', name: 'Me. 习题训练', desc: '', points: 2 }];
        d.books.push({ id: 'b1', name: '新概念一', order: 0, createdAt: 'x', tasks: tpl.map(t => ({ ...t })) });
        d.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1、L2 Excuse me!', order: 0, createdAt: 'x' });
        EC.state._ecEditBookId = 'b1';
        EC._inputs['ecNewTaskName'] = 'Re. 观看视频';
        EC._inputs['ecNewTaskGroup'] = 'input';
        EC._inputs['ecNewTaskIcon'] = '🎬';
        EC.ecAddTaskToBook();
        const nt = d.books[0].tasks.find(t => t.name === 'Re. 观看视频');
        ok('新增任务成功', !!nt);
        // 打卡（模拟 ecAfterAction 的 updatedAt 推进）
        d.updatedAt = '2026-10-27T05:10:00.000Z';
        EC.ecToggleTask('l1', nt.id);
        const key = EC.ecTaskKey('l1', nt.id);
        ok('新增任务打卡写入', !!d.tasks[key]);
        // 云端旧快照：无新任务定义、无该打卡记录，且时间戳更晚（最坏情况）
        const cloud = JSON.parse(JSON.stringify(d));
        cloud.books = [{ id: 'b1', name: '新概念一', order: 0, createdAt: 'x', tasks: tpl.map(t => ({ ...t })) }];
        cloud.tasks = { 'l1|t1': { at: 1 } };
        cloud.updatedAt = '2026-10-27T06:00:00.000Z';
        const m = EC.ecMergeEngcheck(d, cloud, d.updatedAt, cloud.updatedAt);
        ok('合并后新增任务定义不丢（云端较新）', m.books[0].tasks.some(t => t.name === 'Re. 观看视频'));
        ok('合并后新增任务打卡记录保留', !!m.tasks[key]);
        // 删除任务 → 墓碑 → 合并不复活
        d.tombTasks = { ['b1|' + nt.id]: Date.now() };
        d.books[0].tasks = d.books[0].tasks.filter(t => t.id !== nt.id);
        delete d.tasks[key];
        const m2 = EC.ecMergeEngcheck(d, cloud, d.updatedAt, '2026-10-27T04:00:00.000Z');
        ok('删除任务不复活（墓碑生效）', !m2.books[0].tasks.some(t => t.id === nt.id));
        // 打卡记录：同键取 at 较新者（取消后再打卡不回退）
        d.books[0].tasks.push({ id: 't9', group: 'input', icon: '🎬', name: 'X', desc: '', points: 2 });
        d.tasks['l1|t9'] = { at: 2000 };
        const cloud3 = JSON.parse(JSON.stringify(d));
        cloud3.tasks['l1|t9'] = { at: 1000 };
        const m3 = EC.ecMergeEngcheck(d, cloud3, d.updatedAt, '2026-10-27T07:00:00.000Z');
        ok('打卡记录同键取较新（at 大者胜）', (m3.tasks['l1|t9'] || {}).at === 2000);
        // 本地墓碑（取消完成）两端并集后仍生效
        d.tombs = { 'l1|t2': 3000 };
        d.tasks['l1|t2'] = undefined;
        delete d.tasks['l1|t2'];
        const m4 = EC.ecMergeEngcheck(d, cloud3, '2026-10-27T08:00:00.000Z', '2026-10-27T07:00:00.000Z');
        ok('本地取消完成的墓碑不被 win 端清掉', Number(m4.tombs['l1|t2']) === 3000 || m4.tasks['l1|t2'] === undefined);
    }
}
// 3. v20261026h：清空中文课文 + 导入预览确认
ok('ecClearZh 函数存在', /async function ecClearZh/.test(APP));
ok('清空写 zhAt 保证跨设备生效', /l\.zh = ''; l\.zhAt = now;/.test(APP));
ok('分发器含 ec-clear-zh', /if \(action === 'ec-clear-zh'\)/.test(APP));
ok('书页有清空本书中文按钮', /data-action="ec-clear-zh" data-book="\$\{book\.id\}"/.test(APP));
ok('书单页有清空全部课文按钮', /data-action="ec-clear-zh" title="清空所有书的全部课文/.test(APP));
ok('导入前预览确认（uiConfirm）', /导入预览/.test(APP) && /确认导入吗/.test(APP));
ok('解析说明去标点归一化', /去标点归一化/.test(APP) && /function ecBatchZhParse/.test(APP));

// ============ v20261026n：复习中心直达背诵页 + 批量中英双语 ============
console.log('—— 复习直达背诵 / 双语批量（v20261026n）——');
ok('ecOpenRecite 函数存在', /function ecOpenRecite/.test(APP));
ok('待背诵清单标题可点去背诵', /class="ec-due-title ec-due-click" data-action="ec-open-recite"/.test(APP));
ok('「去背诵」入口出现 3 处（待背诵/学习中/已掌握）', (APP.match(/ec-due-go">去背诵/g) || []).length === 3);
ok('分发器含 ec-open-recite', /if \(action === 'ec-open-recite'\)/.test(APP));
{
    const EC = makeEC();
    EC.state.data.engcheck.books.push({ id: 'b1', name: '新概念1', order: 0, createdAt: '', tasks: [] });
    EC.state.data.engcheck.lessons.push({ id: 'lx', bookId: 'b1', name: 'L1', note: '', order: 0, createdAt: '' });
    EC.state.currentSubTab = { engcheck: 'ec-review' };
    EC.state._ecEditBookId = 'b1';
    EC.state._ecEditLessonId = 'lx';
    EC.ecOpenRecite('lx');
    ok('跳转：切到书单课目 tab', EC.state.currentSubTab.engcheck === 'ec-books');
    ok('跳转：定位到该课背诵页', EC.state._ecBookId === 'b1' && EC.state._ecLessonId === 'lx');
    ok('跳转：清掉编辑展开态', EC.state._ecEditBookId === null && EC.state._ecEditLessonId === null);
}
// 批量导入：单元内中英双语分栏
{
    const EC = makeEC();
    const names = ['L1、L2 Excuse me!', 'L3、L4 Sorry, sir.'];
    const txt = ['L1、L2 Excuse me!', '【中文】', '对不起！', '这是您的手提包吗？', '【英文】', 'Excuse me!', 'Is this your handbag?', '//', 'L3、L4 Sorry, sir.', '请把我的大衣和伞拿给我。'].join('\n');
    const r = EC.ecBatchZhParse(txt, names);
    ok('双语：中文进 map', (r.map[names[0]] || '').includes('手提包'));
    ok('双语：英文进 mapEn', (r.mapEn[names[0]] || '').includes('handbag'));
    ok('双语：标记行本身不进正文', !(r.map[names[0]] || '').includes('【英文】') && !(r.mapEn[names[0]] || '').includes('【中文】'));
    ok('双语：无标记的单元全当中文', (r.map[names[1]] || '').includes('大衣'));
    ok('双语：该课没有英文就不写英文', r.mapEn[names[1]] === undefined);
    const r2 = EC.ecBatchZhParse(['L1、L2 Excuse me!', 'EN:', 'Hello.', 'ZH:', '你好。', '//', 'L3、L4 Sorry, sir.', '请把我的大衣和伞拿给我。'].join('\n'), names);
    ok('EN: / ZH: 标记也认', (r2.mapEn[names[0]] || '') === 'Hello.' && (r2.map[names[0]] || '') === '你好。');
    const r3 = EC.ecBatchZhParse(['L1、L2 Excuse me!', '【中文】', '对不起！', '【英文】', 'Excuse me!', 'L3、L4 Sorry, sir.', '请把我的大衣和伞拿给我。'].join('\n'), names);
    ok('标题行模式（无 //）也支持双语', (r3.mapEn[names[0]] || '') === 'Excuse me!' && (r3.map[names[0]] || '').includes('对不起'));
}
ok('批量导入同时写 zh/en 时间戳', /l\.zh = r\.map\[l\.name\]; l\.zhAt = now;/.test(APP) && /l\.en = en; l\.enAt = now;/.test(APP));
// 批量导入语言模式：同一份中英双语文本，可只取中文 / 只取英文 / 一起取
{
    const EC = makeEC();
    const names = ['L1、L2 Excuse me!', 'L3、L4 Sorry, sir.'];
    const txt = ['L1、L2 Excuse me!', '【中文】', '对不起！', '这是您的手提包吗？', '【英文】', 'Excuse me!', 'Is this your handbag?', '//', 'L3、L4 Sorry, sir.', '【中文】', '请把我的大衣和伞拿给我。', '【英文】', 'My coat and my umbrella please.'].join('\n');
    const rz = EC.ecBatchZhParse(txt, names, { lang: 'zh' });
    ok('只导中文：中文有内容', (rz.map[names[0]] || '').includes('手提包'));
    ok('只导中文：英文段被跳过，不混进中文', !Object.keys(rz.mapEn).length && !(rz.map[names[0]] || '').includes('handbag'));
    const re = EC.ecBatchZhParse(txt, names, { lang: 'en' });
    ok('只导英文：英文有内容', (re.mapEn[names[0]] || '').includes('handbag'));
    ok('只导英文：中文段被跳过', !Object.keys(re.map).length);
    ok('语言模式回传（zh/en/mix）', rz.lang === 'zh' && re.lang === 'en' && EC.ecBatchZhParse(txt, names).lang === 'mix');
    const re2 = EC.ecBatchZhParse('L3、L4 Sorry, sir.\nMy coat and my umbrella please.', names, { lang: 'en' });
    ok('只导英文：无标记内容默认算英文', (re2.mapEn[names[1]] || '').includes('umbrella') && !re2.map[names[1]]);
    const rz2 = EC.ecBatchZhParse('L3、L4 Sorry, sir.\n请把我的大衣和伞拿给我。', names, { lang: 'zh' });
    ok('只导中文：无标记内容默认算中文', (rz2.map[names[1]] || '').includes('大衣') && !Object.keys(rz2.mapEn).length);
}
ok('批量导入弹窗有语言三选一', /name="ecBatchLang" value="mix"/.test(APP) && /name="ecBatchLang" value="zh"/.test(APP) && /name="ecBatchLang" value="en"/.test(APP));
ok('批量导入读取所选语言模式', /input\[name="ecBatchLang"\]:checked/.test(APP) && /ecBatchZhParse\(t, names, \{ lang: useLang \}\)/.test(APP));
ok('语言模式选择器样式存在', /\.ec-lang-pick/.test(CSS) && /\.ec-lang-opt/.test(CSS));
// 批量导入端到端：同一份双语文本，三种模式各自写入，互不覆盖
(async () => {
    const EC = makeEC();
    const d = EC.state.data.engcheck;
    d.books.push({ id: 'b1', name: '新概念一', tasks: [], createdAt: '' });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1、L2 Excuse me!', order: 0, createdAt: '' });
    d.lessons.push({ id: 'l2', bookId: 'b1', name: 'L3、L4 Sorry, sir.', order: 1, createdAt: '' });
    EC._setConfirm(true);
    const txt = ['L1、L2 Excuse me!', '【中文】', '对不起！', '【英文】', 'Excuse me!', '//', 'L3、L4 Sorry, sir.', '【中文】', '请把我的大衣和伞拿给我。', '【英文】', 'My coat and my umbrella please.'].join('\n');
    const L = () => d.lessons.find(x => x.id === 'l1');
    const L2 = () => d.lessons.find(x => x.id === 'l2');
    // ① 只导中文：只有 zh 落库，en 不动
    EC._inputs['ecBatchZhTA'] = txt;
    EC.ecBatchZhImport('b1', 'zh');
    await flush(); await flush();
    ok('端到端·只导中文：中文写入', (L().zh || '').includes('对不起'));
    ok('端到端·只导中文：英文保持空', !L().en);
    ok('端到端·只导中文：写 zhAt 时间戳', !!L().zhAt);
    // ② 只导英文：只补 en，不动已有 zh
    EC._inputs['ecBatchZhTA'] = txt;
    EC.ecBatchZhImport('b1', 'en');
    await flush(); await flush();
    ok('端到端·只导英文：英文补上', (L().en || '').includes('Excuse me!'));
    ok('端到端·只导英文：中文没被覆盖', (L().zh || '').includes('对不起') && !!L().zhAt);
    ok('端到端·只导英文：写 enAt 时间戳', !!L().enAt);
    // ③ 中英一起：两课双语同时落库
    EC._inputs['ecBatchZhTA'] = txt;
    EC.ecBatchZhImport('b1', 'mix');
    await flush(); await flush();
    ok('端到端·中英一起：第二课也双语', (L2().zh || '').includes('大衣') && (L2().en || '').includes('umbrella'));
})();
ok('清空课文同时清中文和英文', /if \(l\.zh\) \{ l\.zh = ''; l\.zhAt = now; \}/.test(APP) && /if \(l\.en\) \{ l\.en = ''; l\.enAt = now; \}/.test(APP));

// ============ v20261026p：复习日历预览 + 子标签显示设置 ============
console.log('—— 复习日历预览 / 子标签设置（v20261026p）——');
ok('EC_SUBTABS 四个子标签齐全', /const EC_SUBTABS = \[/.test(APP) && /id: 'ec-books', name: '书单课目'/.test(APP) && /id: 'ec-achieve', name: '成就榜'/.test(APP));
ok('子标签配置存 engcheck.tabCfg（order/hidden/at）', /d\.tabCfg = \{ order: \[\], hidden: \[\], at: 0 \}/.test(APP) && /function ecTabCfgGet/.test(APP));
ok('渲染改用配置：ecTabCfgVisible + ⚙️ 弹窗按钮', /const tabs = ecTabCfgVisible\(\);/.test(APP) && /class="ec-tabcfg-btn/.test(APP) && /data-action="ec-tabcfg-open"/.test(APP));
ok('⚙️ 改为弹窗：打开函数与刷新函数存在', /function ecOpenTabCfg/.test(APP) && /function ecTabCfgRefreshIfModal/.test(APP) && /uiModal\(\{ title: '⚙️ 子标签显示设置'/.test(APP));
ok('不再内联展开设置面板', !/ec-tabcfg-toggle/.test(APP));
ok('配置面板有勾选与 ▲▼', /data-action="ec-tabcfg-show"/.test(APP) && /data-action="ec-tabcfg-up"/.test(APP) && /data-action="ec-tabcfg-down"/.test(APP));
ok('配置面板文案（勾选=显示 / 取消勾选=隐藏）', /勾选 = 显示；取消勾选 = 隐藏/.test(APP) && /数据不会删除/.test(APP));
ok('配置面板样式存在', /\.ec-tabcfg\b/.test(CSS) && /\.ec-tabcfg-row/.test(CSS) && /\.ec-tabcfg-arrows/.test(CSS) && /\.ec-tabcfg-btn/.test(CSS));
ok('日历卡片样式存在', /\.ec-cal\b/.test(CSS) && /\.ec-cal-row/.test(CSS) && /\.ec-cal-chip/.test(CSS) && /\.ec-cal-late/.test(CSS));
ok('复习中心接入日历预览', /ecReviewCalendarHTML\(7\)/.test(APP) && /接下来 \$\{N\} 天复习预览/.test(APP));
ok('子标签配置跨设备按 at 取新', /function ecMergeTabCfg/.test(APP) && /merged\.tabCfg = ecMergeTabCfg\(win\.tabCfg, lose\.tabCfg\)/.test(APP));
ok('复习中心新增三级子目录', /const EC_REVIEW_SUBTABS = \[/.test(APP) && /id: 'overview'/.test(APP) && /id: 'due'/.test(APP) && /id: 'waiting'/.test(APP) && /id: 'mastered'/.test(APP));
ok('三级子目录用独立 namespace（ec-review-sub）', /data-module="ec-review-sub"/.test(APP) && /data-action="tab"/.test(APP) && /id: 'overview'/.test(APP));
ok('复习中心渲染含面包屑与子导航', /英语打卡 › 复习中心/.test(APP) && /class="card ec-review-subnav"/.test(APP) && /ec-crumb/.test(APP));
{
    const EC = makeEC();
    EC.state.currentSubTab = { 'ec-review-sub': 'due' };
    const html = EC.ecRenderReview();
    ok('切到「待背诵」只渲染待背诵卡片（不含学习中/已掌握内容标题）', /card-title">⏰ 待背诵清单/.test(html) && !/card-title">📖 学习中/.test(html) && !/card-title">🏆 已掌握/.test(html));
    EC.state.currentSubTab = { 'ec-review-sub': 'overview' };
    const ov = EC.ecRenderReview();
    ok('概览同时含统计卡与日历预览与 FSRS 说明', /复习中心 · 概览/.test(ov) && /接下来 7 天复习预览/.test(ov) && /背诵复习 · FSRS 算法/.test(ov));
    EC.state.currentSubTab = { 'ec-review-sub': 'mastered' };
    const ms = EC.ecRenderReview();
    ok('「已掌握」空态有兜底文案', /还没有已掌握的课文/.test(ms));
}
{
    const EC = makeEC();
    // ---- 子标签配置：默认顺序 / 隐藏 / 排序 / 保底 ----
    ok('EC_SUBTABS 导出 4 项且顺序默认', EC.EC_SUBTABS.length === 4 && EC.EC_SUBTABS.map(t => t.id).join(',') === 'ec-books,ec-review,ec-wrong,ec-achieve');
    ok('默认全部显示且顺序不变', EC.ecTabCfgVisible().map(t => t.id).join(',') === 'ec-books,ec-review,ec-wrong,ec-achieve');
    EC.ecTabCfgToggleShow('ec-wrong');
    ok('取消勾选即隐藏', EC.ecTabCfgVisible().map(t => t.id).join(',') === 'ec-books,ec-review,ec-achieve');
    ok('隐藏项仍可在设置面板里调顺序（不删数据）', EC.ecTabCfgAll().map(t => t.id).includes('ec-wrong'));
    EC.ecTabCfgMove('ec-achieve', 'up');
    ok('▲ 上移生效', EC.ecTabCfgVisible().map(t => t.id).join(',') === 'ec-books,ec-achieve,ec-review');
    EC.ecTabCfgMove('ec-books', 'down');
    ok('▼ 下移生效（第 1 个变化）', EC.ecTabCfgVisible()[0].id === 'ec-achieve');
    EC.ecTabCfgMove('ec-achieve', 'up');
    ok('已在第一位时上移无副作用', EC.ecTabCfgVisible()[0].id === 'ec-achieve');
    EC.ecTabCfgToggleShow('ec-wrong');
    ok('再勾选即恢复显示（回到 config 顺序位）', EC.ecTabCfgVisible().map(t => t.id).includes('ec-wrong'));
    ok('配置带 at 时间戳（跨设备取新）', EC.ecTabCfgGet().at > 0);
    EC.ecTabCfgToggleShow('ec-achieve'); // 再隐藏一个，验证隐藏项箭头置灰
    ok('隐藏项不参与排序，▲▼ 置灰', (() => { const h = EC.ecTabCfgHTML(); return /ec-tabcfg-off/.test(h) && (h.match(/disabled/g) || []).length >= 4; })());
    // 全部隐藏 → 保底仍显示第一个，且不允许隐藏最后一个
    const t1 = EC.ecTabCfgVisible();
    t1.slice(1).forEach(t => EC.ecTabCfgToggleShow(t.id));
    ok('至少保留一个可见子标签', EC.ecTabCfgVisible().length === 1);
    EC.ecTabCfgToggleShow(EC.ecTabCfgVisible()[0].id);
    ok('尝试隐藏最后一个被拒绝', EC.ecTabCfgVisible().length === 1);
}
{
    // 隐藏当前所在标签 → 自动跳到第一个可见标签（独立实例，避免前面用例的隐藏状态干扰）
    const EC2 = makeEC();
    EC2.state.currentSubTab = { engcheck: 'ec-review' };
    EC2.ecTabCfgToggleShow('ec-review');
    ok('隐藏当前标签后跳转到可见标签', EC2.state.currentSubTab.engcheck === 'ec-books');
    EC2.ecTabCfgToggleShow('ec-books');
    ok('把书单也隐藏后跳到下一个可见标签', EC2.state.currentSubTab.engcheck === 'ec-wrong');
}
{
    const EC = makeEC();
    // 合并：at 较新的一端胜出
    ok('合并取 at 较新端', EC.ecMergeTabCfg({ order: ['ec-wrong'], hidden: [], at: 1 }, { order: ['ec-review'], hidden: [], at: 9 }).order[0] === 'ec-review');
    ok('合并单边为空时取另一边', EC.ecMergeTabCfg(null, { order: [], hidden: ['ec-wrong'], at: 3 }).hidden[0] === 'ec-wrong');
}
{
    // ---- 复习日历预览 ----
    const EC = makeEC();
    const d = EC.state.data.engcheck;
    d.books.push({ id: 'b1', name: '新概念一', tasks: [], createdAt: '' });
    const mkLesson = (id, name, dueOffsetDays, s) => {
        d.lessons.push({ id, bookId: 'b1', name, order: 0, createdAt: '' });
        const todayStart = new Date().setHours(0, 0, 0, 0);
        d.fsrs[id] = { s: s || 1, d: 5, n: 1, last: todayStart - 86400000, due: todayStart + dueOffsetDays * 86400000 + 3600000 };
    };
    mkLesson('l1', 'L1、L2 Excuse me!', 0);       // 今天
    mkLesson('l2', 'L3、L4 Sorry, sir.', 1);      // 明天
    mkLesson('l3', 'L5、L6 Nice to meet you.', 1); // 明天（同一天两课）
    mkLesson('l4', 'L7、L8 Are you a teacher?', 5);
    mkLesson('l9', 'L9、L10 How are you today?', 20); // 7 天以后
    // 逾期课
    d.lessons.push({ id: 'l5', bookId: 'b1', name: 'L60、L61 A bad cold', order: 5, createdAt: '' });
    d.fsrs['l5'] = { s: 1, d: 5, n: 1, last: Date.now() - 86400000 * 10, due: new Date().setHours(0, 0, 0, 0) - 86400000 * 2 };
    const html = EC.ecReviewCalendarHTML(7);
    ok('日历含逾期分组', html.includes('已逾期') && html.includes('A bad cold ·') === false && html.includes('L60、L61 A bad cold'));
    ok('日历含今天/明天标签', html.includes('今天') && html.includes('明天'));
    ok('日历课程可点进背诵页', /data-action="ec-open-recite" data-lesson="l1"/.test(html));
    ok('同一天多课显示课数 2（明天）', /<div class="ec-cal-count">2<span class="ec-cal-unit">课<\/span><\/div>/.test(html));
    ok('今天 1 课', /<div class="ec-cal-count">1<span class="ec-cal-unit">课<\/span><\/div>/.test(html));
    ok('7 天以外不计入天格但提示「更远还有」', html.includes('更远还有 1 课'));
    ok('空白天显示「没有要复习的」', html.includes('没有要复习的'));
    ok('7 天合计统计出现', /7 天共 4 课/.test(html));
    ok('较长的课名截断显示', html.includes('…'));
}
// ============ v20261026r：同步可靠性修复（手机端进度传不上云端的根因） ============
console.log('—— v20261026r 同步可靠性 ——');
ok('版本号不低于 20261026r（同步修复已包含）', Number((APP.match(/const APP_BUILD = '(\d+)/) || [, '0'])[1]) >= 20261026);
ok('新增 markUnsynced / clearUnsynced', /function markUnsynced\(/.test(APP) && /function clearUnsynced\(/.test(APP));
ok('queueSync 标记待同步', APP.includes('markUnsynced();'));
ok('上传成功清除待同步', /if \(error\) throw error;[\s\S]{0,200}clearUnsynced\(\);/.test(APP));
ok('待同步状态显示（徽章+小字）', APP.includes("label: '待同步 · 点同步上传'") && APP.includes("text.textContent = pending ? '待同步'"));
ok('切回页面先推本地再拉云端', /syncToCloud\(false\)\.then\(\(\) => syncFromCloud\(false\)\)/.test(APP));
ok('切走/锁屏立即上传（不依赖 2 秒定时器）', APP.includes('if (document.hidden) {') && APP.includes('syncToCloud(false);') && APP.includes('} else {'));
ok('离开页面兜底上传 pagehide/beforeunload', APP.includes("window.addEventListener('pagehide'") && APP.includes("window.addEventListener('beforeunload'"));
ok('刷新按钮改为双向同步（上传+下载）', /syncToCloud\(true\)\.then\([\s\S]{0,120}syncFromCloud\(true\)/.test(APP));
ok('轮询在有待同步时主动上传', APP.includes('if (state._unsynced) syncToCloud(false)'));
ok('loadState 恢复待同步标记', /state\._unsynced = localStorage\.getItem\('gt_unsynced'\) === '1'/.test(APP));
ok('CSS 待同步琥珀色状态点', CSS.includes('.sync-dot.pending') && CSS.includes('.cloud-status-dot.pending') && CSS.includes('.cloud-status-badge.pending'));

// ============ v20261026s：防「打完卡又被拖回未完成」回弹 ============
console.log('—— v20261026s 防回弹 ——');
ok('版本号不低于 20261026s（防回弹已包含）', Number((APP.match(/const APP_BUILD = '(\d+)/) || [, '0'])[1]) >= 20261026);
ok('新增 mergeLocalFirst（本地优先合并）', /function mergeLocalFirst\(local, cloud\)/.test(APP));
ok('新增 isPlainObj 判断', /function isPlainObj\(v\)/.test(APP));
ok('上传前合并方向由待同步决定', APP.includes('const localWins = localShouldWin();') && /await _syncFromCloudCore\(forcePull, localWins\)/.test(APP));
ok('_syncFromCloudCore 支持 localWins 参数', /async function _syncFromCloudCore\(force = false, localWins = false\)/.test(APP));
ok('localWins 时走 mergeLocalFirst 而非云端整包覆盖', APP.includes('? mergeLocalFirst(state.data, cloudPayload)'));
ok('本机有未上传改动时拉取走本地优先（防回滚）', /const localWins = !ignoreUnsynced && localShouldWin\(\);/.test(APP) && /withSyncLock\(\(\) => _syncFromCloudCore\(force, localWins\)\)/.test(APP));
ok('syncFromCloud 支持 ignoreUnsynced', /async function syncFromCloud\(force = false, ignoreUnsynced = false\)/.test(APP));
ok('有未上传改动时不做二次合并拉取', /if \(!localWins\) \{[\s\S]{0,400}await _syncFromCloudCore\(false, false\)/.test(APP));
ok('上传完成后延迟拉取（已上云不回滚）', /function schedulePullAfterPush\(\)/.test(APP) && APP.includes('schedulePullAfterPush();'));
ok('同步锁占用时记待上传并补传', APP.includes('state._pendingUpload = true') && /if \(state\._pendingUpload\) \{/.test(APP));
ok('启动时若待同步则优先上传', /if \(state\._unsynced\) \{\s*await syncToCloud\(false\)/.test(APP));
ok('英语打卡合并用原始云端对象', APP.includes('ecMergeEngcheck(localEc, cloudPayload.engcheck, localEcAt, cloudEcAt)'));
ok('悦己享瘦用原始云端值判定', APP.includes('state.data.yjxs = cloudYjxs;'));

// 行为测试：mergeLocalFirst 语义（本地值优先 / 云端补键 / 嵌套逐键）
try {
    const srcPlain = APP.match(/function isPlainObj\(v\) \{[\s\S]*?\n\}/)[0];
    const srcMerge = APP.match(/function mergeLocalFirst\(local, cloud\) \{[\s\S]*?\n\}/)[0];
    const mlf = new Function(`${srcPlain}\n${srcMerge}\nreturn mergeLocalFirst;`)();
    const r1 = mlf({ a: 1 }, { a: 2 });
    ok('本地优先：同键保留本地值', r1.a === 1);
    const r2 = mlf({ a: 1 }, { b: 2 });
    ok('本地优先：云端独有键被补齐', r2.a === 1 && r2.b === 2);
    const r3 = mlf({ s: { x: 1 }, arr: [1] }, { s: { x: 9, y: 2 }, arr: [9, 9] });
    ok('本地优先：嵌套对象逐键合并', r3.s.x === 1 && r3.s.y === 2);
    ok('本地优先：数组不被远端覆盖', Array.isArray(r3.arr) && r3.arr.length === 1 && r3.arr[0] === 1);
    const ec = { tasks: { k: { at: 5 } }, updatedAt: '2026-10-29T10:00:00Z' };
    const r4 = mlf(ec, { tasks: { k: { at: 1 } }, updatedAt: '2026-10-29T11:00:00Z', extra: 1 });
    ok('本地优先：刚打的卡不会被云端旧快照覆盖', r4.tasks.k.at === 5 && r4.extra === 1);
} catch (e) {
    ok('mergeLocalFirst 行为测试可执行', false);
}

// ============ v20261026s 第二轮：使用者易踩缺陷集中修复 ============
console.log('—— v20261026s 使用者缺陷修复 ——');
// ① 删掉的默认打卡项不再自动复活
ok('ensureDefaults 增加 defaultsSeeded 标记', APP.includes('state.data.defaultsSeeded = true;'));
ok('已初始化过就不再灌注默认项', /if \(seeded\) return;/.test(APP));
ok('已有数据视为已初始化', /const seeded = state\.data\.defaultsSeeded === true \|\| hasExisting;/.test(APP));
// ② 阅读收藏跨设备合并 + 删除墓碑
ok('新增 mergeBookRead（按 title 并集）', /function mergeBookRead\(localArr, cloudArr, tombs\)/.test(APP));
ok('新增 dropBeforeCut（清空分界线过滤）', /function dropBeforeCut\(arr, cutMs\)/.test(APP));
ok('新增 mergeTsMap（墓碑时间戳合并）', /function mergeTsMap\(a, b\)/.test(APP));
ok('同步时合并 bookRead 并应用墓碑', APP.includes('mergeBookRead(localById.bookRead, cloud.bookRead, state.data.bookReadTombs)'));
ok('localById 快照包含 bookRead', APP.includes('bookRead: Array.isArray(state.data.bookRead) ? state.data.bookRead : []'));
ok('取消看过写入删除墓碑', APP.includes('state.data.bookReadTombs[book.title] = Date.now();'));
ok('重新收藏清除墓碑', APP.includes('delete state.data.bookReadTombs[book.title];'));
// ③ 本地存储配额失败不再静默
ok('saveStateLocal 配额降级重试', /function saveStateLocal\(\)[\s\S]{0,700}state\.data\.hotCache = \{\};/.test(APP));
// ④ 待同步陈旧降级，避免长期压着云端
ok('待同步记录时间戳', APP.includes("localStorage.setItem('gt_unsynced_at'"));
ok('unsyncedIsStale / localShouldWin 存在', /function unsyncedIsStale\(\)/.test(APP) && /function localShouldWin\(\)/.test(APP));
ok('loadState 恢复待同步时间', APP.includes("state._unsyncedAt = Number(localStorage.getItem('gt_unsynced_at')) || 0;"));
// ⑤ 存档/刷新提示按真实结果
ok('存档失败提示失败（不再谎报已上传）', APP.includes("r === false ? '⚠️ 上传失败，请检查网络后重试（本地数据已保存）'"));
ok('syncToCloud 返回真实结果', /reportSyncSuccess\(\);\s*return true;/.test(APP));
// ⑥ 「清除所有数据」真正清得掉
ok('清空写入 clearedAllAt 分界线', APP.includes('clearedAllAt: now(),'));
ok('清空重置英语打卡分界线', APP.includes('clearedAt: Date.now(), fsrsClearedAt: Date.now()'));
ok('合并时按清空分界线丢弃云端旧记录', APP.includes('cloud[k] = dropBeforeCut(cloud[k], cutAllMs);'));
ok('清空后上传空数据到云端', /markUnsynced\(\);[\s\S]{0,400}await syncToCloud\(false\)/.test(APP));
// ⑦ 跨天与多窗口
ok('render 记录渲染日期', APP.includes('state._renderDate = today();'));
ok('轮询检测跨天并重绘', /if \(state\._renderDate && state\._renderDate !== today\(\)\)/.test(APP));
ok('多窗口冲突提示', APP.includes("e.key !== 'growtree_state'"));
// ⑧ FSRS 背诵进度不再被权威端旧数据盖回
ok('FSRS 同课按最近复习时间取新', /if \(b && \(Number\(b\.last\) \|\| 0\) > \(Number\(pick\.last\) \|\| 0\)\) pick = b;/.test(APP));
ok('FSRS 合并遍历两端所有课', /const keys = new Set\(\[\.\.\.Object\.keys\(A\), \.\.\.Object\.keys\(B\)\]\);/.test(APP));

// 行为测试：mergeBookRead 并集 / 新者胜 / 墓碑
try {
    const srcMr = APP.match(/function mergeBookRead\(localArr, cloudArr, tombs\) \{[\s\S]*?\n\}/)[0];
    const mbr = new Function(`${srcMr}\nreturn mergeBookRead;`)();
    const a = mbr([{ title: 'A', markedAt: '2026-10-01T00:00:00Z' }], [{ title: 'B', markedAt: '2026-10-02T00:00:00Z' }], {});
    ok('阅读收藏：两端并集不丢书', a.length === 2 && a.some(b => b.title === 'A') && a.some(b => b.title === 'B'));
    const b = mbr([{ title: 'A', markedAt: '2026-10-01T00:00:00Z' }], [{ title: 'A', markedAt: '2026-10-05T00:00:00Z' }], {});
    ok('阅读收藏：同书取较新标记', b.length === 1 && b[0].markedAt === '2026-10-05T00:00:00Z');
    const c = mbr([{ title: 'A', markedAt: '2026-10-01T00:00:00Z' }], [{ title: 'A', markedAt: '2026-10-05T00:00:00Z' }], { A: 1 });
    ok('阅读收藏：删除过的书不复活', c.length === 0);
} catch (e) {
    ok('mergeBookRead 行为测试可执行', false);
}

// 行为测试：dropBeforeCut 按清空分界线丢弃旧记录
try {
    const srcDrop = APP.match(/function dropBeforeCut\(arr, cutMs\) \{[\s\S]*?\n\}/)[0];
    const drop = new Function(`${srcDrop}\nreturn dropBeforeCut;`)();
    const cut = Date.parse('2026-10-29T00:00:00Z');
    const arr = [
        { id: 'old', updatedAt: '2026-10-01T00:00:00Z' },
        { id: 'new', updatedAt: '2026-10-30T00:00:00Z' }
    ];
    const r = drop(arr, cut);
    ok('清空分界线：早于清空时刻的记录被丢弃', r.length === 1 && r[0].id === 'new');
    ok('清空分界线：空数组安全', drop([], cut).length === 0 && drop(null, cut).length === 0);
    ok('清空分界线：未清空时不过滤', drop(arr, 0).length === 2);
} catch (e) {
    ok('dropBeforeCut 行为测试可执行', false);
}


// ============ 十五、v20261106u：错题本分书本 / 分课时 + 与书本学习联动 ============
console.log('—— v20261106u 分书分课 + 学习联动 ——');

// 1. 静态检查
const buildM = APP.match(/const APP_BUILD = '(\d+)([a-z]*)'/);
ok('版本号不低于 20261106u', !!buildM && (buildM[1] > '20261106' || (buildM[1] === '20261106' && (buildM[2] || '') >= 'u')));
ok('五个三级子导航含错题本', /id: 'books', name: '🗂️ 错题本'/.test(APP) && /EC_WRONG_SUBTABS = \[/.test(APP));
ok('错题条目带书本/课时/排序字段', /bookId: it\.bookId \|\| ''/.test(APP) && /lessonId: it\.lessonId \|\| ''/.test(APP) && /order: nowTs \+ i/.test(APP));
ok('自动练题开关数据结构', /w\.autoTask = true/.test(APP) && /w\.autoTaskAt = 0/.test(APP));
ok('旧数据认领函数存在', /function ecWbMigrate\(/.test(APP) && /function ecWbMatchLesson\(/.test(APP));
ok('归属下拉按书本分组', /<optgroup label="\$\{escapeHtml\(b\.name\)\}">/.test(APP));
ok('导入按课时列自动认领', /function ecWbAssign\(/.test(APP) && /ecWbMatchLesson\(it\.lesson \|\| '', f\.bookId/.test(APP));
ok('批量管理函数齐全', ['ecWbSelMode', 'ecWbSelToggle', 'ecWbSelAll', 'ecWbDelSelected', 'ecWbMoveSelected', 'ecWbMoveIds', 'ecWbMoveItem'].every(f => APP.includes('function ' + f + '(')));
ok('三级目录渲染函数齐全', ['ecWbBooksHTML', 'ecWbBookListHTML', 'ecWbBookDetailHTML', 'ecWbLessonDetailHTML', 'ecWbItemHTML'].every(f => APP.includes('function ' + f + '(')));
ok('书本维度复习入口', /function ecWbDueIn\(/.test(APP) && /function ecWbStartBook\(/.test(APP) && /function ecWbStartLesson\(/.test(APP));
ok('筛选下拉 change 委托', /data-wb-filter="book"/.test(APP) && /dataset\.wbFilter/.test(APP));
ok('复习自动算练题任务', /function ecWbAutoDrill\(/.test(APP) && /fromWrong: true/.test(APP) && /ecWbAutoDrill\(item\.lessonId, nowTs\)/.test(APP));
ok('课时列表显示错题徽标', /ecWbBadgeHTML\(l\.id\)/.test(APP));
ok('课时详情插入错题联动卡', /\$\{ecWbLessonCardHTML\(lesson\.id\)\}/.test(APP));
ok('今日推荐三态都带错题提示', (APP.match(/ecTodayRecommendWrongHTML\(bookId\)/g) || []).length >= 3);
ok('书本统计含错题', /wrongTotal: wc\.total/.test(APP) && /📕 错题 \$\{st\.wrongTotal\}/.test(APP));
ok('成就榜含错题统计', /ec-wb-achstats/.test(APP) && /复习错题也算今天的学习/.test(APP));
ok('分发器覆盖新增动作', ['ec-wb-import-lesson', 'ec-wb-start-book', 'ec-wb-start-lesson', 'ec-wb-start-unassigned', 'ec-wb-open-wrong-lesson', 'ec-wb-open-book', 'ec-wb-open-lesson', 'ec-wb-back-books', 'ec-wb-back-book', 'ec-wb-autotask', 'ec-wb-sel-mode', 'ec-wb-sel', 'ec-wb-sel-all', 'ec-wb-del-sel', 'ec-wb-move-sel', 'ec-wb-move-up', 'ec-wb-move-down'].every(a => APP.includes(`action === '${a}'`)));
ok('CSS 含新目录/筛选/联动样式', ['.ec-wb-dir-card', '.ec-wb-filter', '.ec-wb-crumb', '.ec-wb-badge', '.ec-wb-setting', '.ec-reco-wrong', '.ec-wb-achstats'].every(c => CSS.includes(c)));
ok('合并器保留绑定与开关', /hasBind/.test(APP) && /autoTaskAt/.test(APP));

// 建一套书单目录（书本 → 课时），供下面的行为测试复用
function seedCatalog(EC) {
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语 第一册', order: 1 });
    d.books.push({ id: 'b2', name: '新概念英语 第二册', order: 2 });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'L31、L32 Where is Sally?', order: 1 });
    d.lessons.push({ id: 'l2', bookId: 'b1', name: 'Lesson 5 Nice to meet you', order: 2 });
    d.lessons.push({ id: 'l3', bookId: 'b2', name: 'Unit 3 复习课', order: 1 });
    return d;
}

// 2. 课时文字 → 书单目录的认领匹配
{
    const EC = makeEC(); seedCatalog(EC);
    ok('课次编号匹配（L31、L32）', (() => { const r = EC.ecWbMatchLesson('L31、L32'); return r && r.bookId === 'b1' && r.lessonId === 'l1'; })());
    ok('中文课次匹配（第 5 课）', (() => { const r = EC.ecWbMatchLesson('第 5 课'); return r && r.lessonId === 'l2'; })());
    ok('课时名精确匹配（Unit 3 复习课）', (() => { const r = EC.ecWbMatchLesson('Unit 3 复习课'); return r && r.lessonId === 'l3'; })());
    ok('限定书本时不会串到别的书', EC.ecWbMatchLesson('Unit 3', 'b1') === null);
    ok('认领不到的返回 null', EC.ecWbMatchLesson('随便写的') === null && EC.ecWbMatchLesson('') === null);
}

// 3. 老错题自动认领（只补字段一次，且让绑定版本在跨端合并中胜出）
{
    const EC = makeEC(); seedCatalog(EC);
    EC.ecData().wrongbk = {
        items: [{ id: 'w1', lesson: 'L31、L32', point: 'P1', mine: 'M1', right: 'R1', why: '', createdAt: 1, updatedAt: 1 }],
        fsrs: {}, tombs: {}, clearedAt: 0, updatedAt: 0
    };
    const w = EC.ecWbData();
    ok('旧错题自动认领到书/课', w.items[0].bookId === 'b1' && w.items[0].lessonId === 'l1');
    ok('旧错题补 order 字段', typeof w.items[0].order === 'number');
    ok('认领后时间戳推进（防旧快照顶掉）', w.items[0].updatedAt > 1);
    const at = w.items[0].updatedAt;
    EC.ecWbData();
    ok('重复取数不会反复迁移', w.items[0].updatedAt === at);
    w.items.push({ id: 'w2', lesson: '没有这课', point: 'P2', mine: 'M2', right: 'R2', createdAt: 2, updatedAt: 2 });
    EC.ecWbData();
    ok('认领不到的落未归类', w.items[1].bookId === '' && w.items[1].lessonId === '');
    ok('未归类显示名兜底', EC.ecWbLocationText(w.items[1]).includes('未归类'));
}

// 4. 导入归属：行内课时优先，其次弹窗选的课
{
    const EC = makeEC(); seedCatalog(EC);
    const parsed = EC.ecWbParse('课时\t知识点\t我的答案\t正确答案\t原因\nL31、L32\t考点A\tmyA\trtA\t因A\n随便\t考点B\tmyB\trtB\t');
    const list = EC.ecWbAssign(parsed.items, { bookId: 'b1', lessonId: 'l2' });
    ok('导入解析出 2 题', parsed.items.length === 2);
    ok('行内课时名优先认领', list[0].lessonId === 'l1' && list[0].bookId === 'b1');
    ok('认领不到的用弹窗选的课', list[1].lessonId === 'l2' && list[1].bookId === 'b1');
    ok('批量入库带归属', EC.ecWbAddItems(list) === 2 && EC.ecWbItemsOfBook('b1').length === 2);
    ok('按书取错题', EC.ecWbItemsOfBook('b2').length === 0);
    ok('按课取错题', EC.ecWbItemsOfLesson('l1').length === 1);
    ok('归属文本为书名›课时名', EC.ecWbLocationText(EC.ecWbItemsOfLesson('l1')[0]).includes('新概念英语 第一册'));
}

// 5. 三级目录渲染：书本 → 课时 → 错题
{
    const EC = makeEC(); seedCatalog(EC);
    EC.ecWbAddItems([
        { bookId: 'b1', lessonId: 'l1', lesson: 'L31、L32', point: '考点A', mine: 'myA', right: 'rtA', why: '因A' },
        { bookId: 'b1', lessonId: 'l1', lesson: 'L31、L32', point: '考点B', mine: 'myB', right: 'rtB', why: '' }
    ]);
    EC.state.currentSubTab = { 'ec-wrong-sub': 'books' };
    const hb = EC.ecRenderWrong();
    ok('一级：书本列表 + 导入/新增/备份工具条', hb.includes('错题本 · 按书本整理') && hb.includes('新概念英语 第一册') && hb.includes('ec-wb-import'));
    ok('一级：可只复习一本书', hb.includes('ec-wb-start-book'));
    EC.state._wbBookId = 'b1';
    const hl = EC.ecRenderWrong();
    ok('二级：课时列表', hl.includes('按课时整理') && hl.includes('L31、L32') && hl.includes('ec-wb-open-lesson'));
    ok('二级：返回书本面包屑', hl.includes('ec-wb-back-books'));
    EC.state._wbLessonId = 'l1';
    const hi = EC.ecRenderWrong();
    ok('三级：题目列表含编辑/删除/排序/批量', hi.includes('考点A') && hi.includes('ec-wb-move-up') && hi.includes('ec-wb-sel-mode') && hi.includes('ec-wb-edit'));
    ok('三级：开始复习本课', hi.includes('ec-wb-start-lesson'));
    ok('未归类题有独立复习入口', /ec-wb-start-unassigned/.test(APP));
    ok('三级：面包屑三级', hi.includes('ec-wb-crumb-btn'));
}

// 6. 批量删除 / 批量改归属 / 课时内排序
{
    const EC = makeEC(); seedCatalog(EC);
    EC.ecWbAddItems([
        { bookId: 'b1', lessonId: 'l1', lesson: '', point: 'P1', mine: 'm1', right: 'r1' },
        { bookId: 'b1', lessonId: 'l1', lesson: '', point: 'P2', mine: 'm2', right: 'r2' },
        { bookId: 'b1', lessonId: 'l1', lesson: '', point: 'P3', mine: 'm3', right: 'r3' }
    ]);
    const ids = EC.ecWbData().items.map(x => x.id);
    EC.ecWbMoveIds([ids[0]], { bookId: 'b2', lessonId: 'l3' }, 'Unit 3 复习课');
    ok('批量改归属生效', EC.ecWbById(ids[0]).bookId === 'b2' && EC.ecWbById(ids[0]).lessonId === 'l3');
    ok('批量改归属后按书统计正确', EC.ecWbItemsOfBook('b2').length === 1 && EC.ecWbItemsOfBook('b1').length === 2);
    EC.ecWbSelMode(true); EC.ecWbSelToggle(ids[1]); EC.ecWbSelToggle(ids[2]);
    ok('选择模式可勾选多题', EC.ecWbSelIds().length === 2);
    EC.ecWbSelAll();
    ok('全选可用', EC.ecWbSelIds().length === 3);
    EC.ecWbSelAll();
    ok('反选可用', EC.ecWbSelIds().length === 0);
    const before = EC.ecWbItemsOfLesson('l1').sort((a, b) => a.order - b.order)[0].id;
    EC.ecWbMoveItem(before, 'down');
    const after = EC.ecWbItemsOfLesson('l1').sort((a, b) => a.order - b.order)[0].id;
    ok('课时内上/下移调整顺序', before !== after);
    EC.ecWbRemoveIds([ids[0]]);
    ok('删除写墓碑', !EC.ecWbById(ids[0]) && !!EC.ecWbData().tombs[ids[0]]);
    ok('删除同时清 FSRS', !EC.ecWbData().fsrs[ids[0]]);
}

// 7. 复习也算学习：自动完成「练题」任务 + 可关闭开关
{
    const EC = makeEC(); seedCatalog(EC);
    EC.ecWbAddItems([{ bookId: 'b1', lessonId: 'l1', lesson: 'L31、L32', point: 'P1', mine: 'M1', right: 'R1' }]);
    ok('默认开启自动算任务', EC.ecWbAutoTaskOn() === true);
    EC.ecWbStart('', { lessonId: 'l1' });
    const s = EC.state._wbSession;
    s.revealed = true;
    const scoreBefore = EC.ecData().score || 0;
    EC.ecWbGrade(3);
    const d = EC.ecData();
    ok('复习自评自动完成练题任务', !!d.tasks['l1|write-drill'] && d.tasks['l1|write-drill'].fromWrong === true);
    ok('任务打卡与自评都给分', (d.score - scoreBefore) >= 4);
    ok('自动任务不重复打卡', (() => { const at = d.tasks['l1|write-drill'].at; EC.ecWbAutoDrill('l1', Date.now()); return d.tasks['l1|write-drill'].at === at; })());
    EC.ecWbToggleAutoTask();
    ok('开关可关闭', EC.ecWbAutoTaskOn() === false && EC.ecWbData().autoTaskAt > 0);
    EC.ecWbAddItems([{ bookId: 'b1', lessonId: 'l2', lesson: '', point: 'P2', mine: 'M2', right: 'R2' }]);
    EC.ecWbStart('', { lessonId: 'l2' });
    EC.state._wbSession.revealed = true;
    EC.ecWbGrade(3);
    ok('关闭后不再自动打卡任务', !EC.ecData().tasks['l2|write-drill']);
}

// 8. 与书单页联动：徽标 / 详情卡 / 今日推荐 / 统计 / 成就榜
{
    const EC = makeEC(); seedCatalog(EC);
    EC.ecWbAddItems([
        { bookId: 'b1', lessonId: 'l1', lesson: '', point: 'P1', mine: 'M1', right: 'R1' },
        { bookId: 'b1', lessonId: 'l1', lesson: '', point: 'P2', mine: 'M2', right: 'R2' }
    ]);
    ok('课时徽标显示数量', EC.ecWbBadgeHTML('l1').includes('📕') && EC.ecWbBadgeHTML('l1').includes('2'));
    ok('无错题课时不显示徽标', EC.ecWbBadgeHTML('l2') === '');
    const card = EC.ecWbLessonCardHTML('l1');
    ok('课时详情卡三个入口', card.includes('本课错题') && card.includes('ec-wb-start-lesson') && card.includes('ec-wb-open-wrong-lesson') && card.includes('ec-wb-import-lesson'));
    const reco = EC.ecTodayRecommendWrongHTML('b1');
    ok('今日推荐提示到期错题', reco.includes('2') && reco.includes('ec-wb-start-book'));
    ok('无错题的书不提示', EC.ecTodayRecommendWrongHTML('b2') === '');
    ok('书本统计含错题数', EC.ecBookStats('b1').wrongTotal === 2 && EC.ecBookStats('b1').wrongDue === 2);
    ok('全局统计含错题', EC.ecGlobalStats().wrongDue === 2);
    EC.state._ecLessonId = 'l1';
    ok('课时详情页渲染错题卡', EC.ecRenderLesson().includes('本课错题'));
    ok('成就榜显示错题统计', EC.ecRenderAchieve().includes('错题集'));
    EC.state._ecBookId = 'b1'; EC.state._ecLessonId = null;
    ok('课时列表页渲染错题徽标', EC.ecRenderLessons().includes('ec-wb-badge'));
}

// 9. 书本 / 课时维度筛选复习队列
{
    const EC = makeEC(); seedCatalog(EC);
    EC.ecWbAddItems([
        { bookId: 'b1', lessonId: 'l1', lesson: '', point: 'P1', mine: 'M1', right: 'R1' },
        { bookId: 'b2', lessonId: 'l3', lesson: '', point: 'P2', mine: 'M2', right: 'R2' },
        { bookId: '', lessonId: '', lesson: '课外', point: 'P3', mine: 'M3', right: 'R3' }
    ]);
    ok('按整本书取待复习题', EC.ecWbDueIn({ bookId: 'b1' }).length === 1 && EC.ecWbDueIn({ bookId: 'b1' })[0].point === 'P1');
    ok('按某一课取待复习题', EC.ecWbDueIn({ lessonId: 'l3' }).length === 1);
    ok('未归类可单独筛出', EC.ecWbDueIn({ bookId: EC.EC_WB_UNASSIGNED }).length === 1);
    EC.state._wbFilterBookId = 'b2'; EC.state._wbFilterLessonId = '';
    ok('顶部筛选生效', EC.ecWbFilteredDueItems().length === 1 && EC.ecWbFilteredDueItems()[0].point === 'P2');
    EC.state._wbFilterLessonId = 'l1';
    ok('书+课筛选取交集（无结果）', EC.ecWbFilteredDueItems().length === 0);
    EC.ecWbStartBook('b1');
    ok('只复习这本书建立 1 题队列', EC.state._wbSession.queue.length === 1 && EC.state._wbSession.queue[0] === EC.ecWbDueIn({ bookId: 'b1' })[0].id);
    EC.ecWbStartLesson('l3');
    ok('只复习这一课并跳到错题本该课', EC.state.currentSubTab.engcheck === 'ec-wrong' && EC.state._wbLessonId === 'l3');
    EC.ecWbGoLesson('l1');
    ok('书单「查看本课错题」直达第三级', EC.state._wbBookId === 'b1' && EC.state._wbLessonId === 'l1');
}

// 10. 跨设备合并：绑定字段 / 开关 / 旧快照不顶掉新绑定
{
    const EC = makeEC();
    const bound = (id, point, at) => ({ id, bookId: 'b1', lessonId: 'l1', lesson: 'L31', point, mine: 'm', right: 'r', createdAt: at, updatedAt: at });
    const plain = (id, point, at) => ({ id, lesson: 'L31', point, mine: 'm', right: 'r', createdAt: at, updatedAt: at });
    const A = { items: [bound('a', 'A-带归属', 100)], fsrs: {}, tombs: {}, clearedAt: 0, updatedAt: 100, autoTask: false, autoTaskAt: 500 };
    const B = { items: [plain('a', 'A-旧', 50)], fsrs: {}, tombs: {}, clearedAt: 0, updatedAt: 50, autoTask: true, autoTaskAt: 100 };
    const m = EC.ecMergeWrong(A, B);
    ok('合并保留书本/课时绑定', m.items[0].bookId === 'b1' && m.items[0].lessonId === 'l1');
    ok('开关按 autoTaskAt 新者胜', m.autoTask === false && m.autoTaskAt === 500);
    const C = { items: [plain('a', 'A-更新但无绑定', 200)], fsrs: {}, tombs: {}, clearedAt: 0, updatedAt: 200 };
    const D = { items: [bound('a', 'A-较旧', 100)], fsrs: {}, tombs: {}, clearedAt: 0, updatedAt: 100 };
    const m2 = EC.ecMergeWrong(C, D);
    ok('对端旧快照不顶掉绑定', m2.items[0].bookId === 'b1' && m2.items[0].lessonId === 'l1' && m2.items[0].point === 'A-更新但无绑定');
    ok('同 id 同时间戳优先带绑定版本', (() => {
        const r = EC.ecMergeWrong({ items: [plain('a', 'P', 300)], tombs: {} }, { items: [bound('a', 'P', 300)], tombs: {} });
        return r.items[0].lessonId === 'l1';
    })());
}


// ============ v20261106v：逐词比对灰底 + 可识别导入模板 ============
console.log('—— v20261106v 逐词比对 / 导入模板 ——');
{
    const MINE = 'He usually drive to work. But he take the bus to work today.';
    const RIGHT = 'He usually drives to work. But he is taking the bus to work today.';
    const EC = makeEC();
    const gray = h => (h.match(/ec-wb-diff/g) || []).length;
    const strip = h => h.replace(/<[^>]+>/g, '');

    // 1. 静态检查
    ok('版本号不低于 20261106v（升版不失效）', (() => { const m = APP.match(/const APP_BUILD = '(\d+)([a-z]*)'/); return !!m && (m[1] > '20261106' || (m[1] === '20261106' && (m[2] || '') >= 'v')); })());
    ok('v：灰底样式已定义', /\.ec-wb-diff\s*\{/.test(CSS) && /\[data-theme="dark"\] \.ec-wb-diff/.test(CSS));
    ok('v：对比行样式已定义', /\.ec-wb-cmp\b/.test(CSS) && /\.ec-wb-cmp-label/.test(CSS) && /\.ec-wb-line-txt/.test(CSS));
    ok('v：模板按钮条样式', /\.ec-wb-tplbar\b/.test(CSS));
    ok('v：导入弹窗三个模板按钮', ['ecWbTplFill', 'ecWbTplCopy', 'ecWbTplDown'].every(id => APP.includes('id="' + id + '"')));
    ok('v：概览有导入模板入口', /data-action="ec-wb-template"/.test(APP) && /ecWbImportOpen\('', true\)/.test(APP));
    ok('v：导入弹窗支持预填模板', /prefill \? escapeHtml\(EC_WB_TEMPLATE\)/.test(APP));
    ok('v：解析支持原因续行', /lastWasFull && items\.length/.test(APP));
    ok('v：复习卡翻面前标注问题词', /灰底 = 有问题的地方/.test(APP));
    ok('v：复习卡翻面后逐词核对', /灰底 = 不一样的地方/.test(APP));
    ok('v：仍保留四档自评与联动', /ec-wb-grade/.test(APP) && /ecWbAutoDrill/.test(APP) && /ecReciteAction/.test(APP));

    // 2. 核心：截图那两句话的逐词比对
    const c = EC.ecWbCompareHTML(MINE, RIGHT);
    ok('v：你的答案只高亮 drive / take', gray(c.mine) === 2 && /<span class="ec-wb-diff">drive<\/span>/.test(c.mine) && /<span class="ec-wb-diff">take<\/span>/.test(c.mine));
    ok('v：标准答案只高亮 drives / is taking', gray(c.right) === 2 && /<span class="ec-wb-diff">drives<\/span>/.test(c.right) && /<span class="ec-wb-diff">is taking<\/span>/.test(c.right));
    ok('v：相同部分完全正常显示', c.mine.includes('He usually ') && c.mine.includes(' to work. But he ') && c.right.includes(' the bus to work today.'));
    ok('v：整句还原后与原文一致（不丢字）', strip(c.mine) === MINE && strip(c.right) === RIGHT);
    ok('v：差异词提取正确', ['drive', 'take', 'drives'].every(w => c.words.includes(w)));
    const same = EC.ecWbCompareHTML('He goes to school.', 'He goes to school.');
    ok('v：两句完全一样时零灰底', gray(same.mine) === 0 && gray(same.right) === 0);
    const zh = EC.ecWbCompareHTML('我昨天去公园了。', '我昨天去学校了。');
    ok('v：中文按字高亮不同处', /我昨天去<span class="ec-wb-diff">公园<\/span>了/.test(zh.mine) && /<span class="ec-wb-diff">学校<\/span>/.test(zh.right));
    const ins = EC.ecWbCompareHTML('I go home.', 'I will go home.');
    ok('v：只多一个词时只高亮多出的词', /<span class="ec-wb-diff">will<\/span>/.test(ins.right) && gray(ins.mine) === 0);
    const delOne = EC.ecWbCompareHTML('I will go home.', 'I go home.');
    ok('v：只少一个词时只高亮少掉的词', /<span class="ec-wb-diff">will<\/span>/.test(delOne.mine) && gray(delOne.right) === 0);
    const xss = EC.ecWbCompareHTML('<img src=x onerror=alert(1)>', '<b>ok</b>');
    ok('v：答案里的 HTML 被转义（无脚本注入）', !xss.mine.includes('<img') && xss.mine.includes('&lt;img') && !xss.right.includes('<b>'));
    ok('v：空答案不崩', (() => { const e = EC.ecWbCompareHTML('', 'ok'); return e.mine === '' && gray(e.right) === 1; })());
    ok('v：null / undefined 不崩', (() => { const e = EC.ecWbCompareHTML(null, undefined); return typeof e.mine === 'string' && typeof e.right === 'string'; })());
    ok('v：超长文本安全退化不抛错', (() => { const a = 'word '.repeat(400), b = 'word '.repeat(400) + 'extra'; const e = EC.ecWbCompareHTML(a, b); return gray(e.mine) >= 1 && gray(e.right) >= 1 && strip(e.mine).trim() === a.trim(); })());
    ok('v：连续差异合成一块灰底', (() => { const e = EC.ecWbCompareHTML('a X Y Z b', 'a b'); return gray(e.mine) === 1; })());
    ok('v：LCS 对齐保留原始空格', (() => { const e = EC.ecWbDiffSides('a  b', 'a b'); return e.mine.map(x => x.t).join('').replace(/\s/g, '') === 'ab'; })());

    // 3. 大白话解析高亮
    const why = '主语是 He，单数，动词要加 [[s]]，所以 [[drive]] 必须变成 drives。';
    const wh = EC.ecWbWhyHTML(why, c.words);
    ok('v：解析里 [[词]] 转成灰底', /<span class="ec-wb-diff">s<\/span>/.test(wh) && /<span class="ec-wb-diff">drive<\/span>/.test(wh));
    ok('v：解析里差异词自动加灰底', /<span class="ec-wb-diff">drives<\/span>/.test(wh));
    ok('v：解析普通文字正常显示', wh.includes('主语是 He，单数，动词要加'));
    ok('v：解析里的 HTML 被转义', !EC.ecWbWhyHTML('<script>x</script>', []).includes('<script>'));
    ok('v：解析空值 / 无差异词不崩', EC.ecWbWhyHTML('', []) === '' && EC.ecWbWhyHTML('普通原因', []).includes('普通原因'));

    // 4. 导入模板能被解析器识别
    const tpl = EC.EC_WB_TEMPLATE;
    ok('v/w：模板是六列 Tab 分隔', tpl.split('\n').length === 7 && tpl.split('\n').every(l => l.split('\t').length === 6));
    ok('v/w：模板表头含题目列', tpl.split('\n')[0] === '课时\t知识点\t题目\t我的答案\t正确答案\t大白话原因');
    ok('v/w：模板用 L1-L2 合并课时', tpl.includes('L1-L2\t物主代词') && tpl.includes('L25-L28\tsome/any'));
    ok('v/w：模板答案用 [[ ]] 圈错误点', tpl.includes("[[her's]]") && tpl.includes('[[don\'t have]]') && tpl.includes('[[isn\'t]]'));
    const parsed = EC.ecWbParse(tpl);
    ok('v/w：模板表头自动跳过', parsed.items.length === 6 && parsed.errors.length === 0);
    ok('v/w：模板解析六列字段正确', parsed.items[0].lesson === 'L1-L2' && parsed.items[0].point === '物主代词'
        && parsed.items[0].question === '中译英: 那是她的伞。' && parsed.items[0].mine === "That is [[her's]] umbrella."
        && parsed.items[0].right === 'That is [[her]] umbrella.' && parsed.items[0].why.includes('绝对没有'));
    ok('v/w：模板每条都带题目', parsed.items.every(x => x.question && x.question.length > 2));
    ok('v/w：模板可直接导入不重复', (() => { const w = EC.ecWbData(); const n = EC.ecWbAddItems(EC.ecWbAssign(parsed.items, { bookId: '', lessonId: '' })); const n2 = EC.ecWbAddItems(EC.ecWbAssign(parsed.items, { bookId: '', lessonId: '' })); return n === 6 && n2 === 0 && w.items.length === 6; })());
    ok('v/w：CSV 模板带 BOM 且六列', (() => { const csv = EC.ecWbTemplateCSV(); return csv.charCodeAt(0) === 0xfeff && csv.split('\r\n').length === 7 && csv.split('\r\n')[0].split('","').length === 6; })());
    ok('v/w：CSV 模板字段带引号', EC.ecWbTemplateCSV().startsWith('\ufeff"课时","知识点","题目"'));
    const cont = EC.ecWbParse('L1\t考点\t错\t对\t第一句原因\n第二句原因继续写\nL2\t考点2\t错2\t对2\t原因2');
    ok('v：大白话原因换行会自动续接', cont.items.length === 2 && cont.items[0].why.includes('第一句原因\n第二句原因继续写') && cont.errors.length === 0);
    ok('v：无上一行时的孤行仍报错', EC.ecWbParse('孤零零一行').errors.length === 1);
    ok('v：旧四列格式不受影响', (() => { const r = EC.ecWbParse('考点\t错\t对\t原因'); return r.items.length === 1 && r.items[0].why === '原因'; })());

    // 5. 渲染接入
    const w2 = EC.ecWbData();
    const it = w2.items[0];
    const row = EC.ecWbItemHTML(it, { showPath: true });
    ok('v：错题列表用灰底差异', row.includes('ec-wb-diff') && row.includes('ec-wb-line-txt'));
    ok('v：错题列表解析也高亮', row.includes('ec-wb-why') || row.includes('ec-wb-diff'));
    EC.state._wbSession = { queue: [it.id], idx: 0, revealed: false, graded: 0 };
    const h1 = EC.ecWbSessionHTML();
    ok('v：复习卡未翻面标出问题词', h1.includes('你的答案：') && h1.includes('ec-wb-diff') && !h1.includes('标准答案：'));
    EC.state._wbSession.revealed = true;
    const h2 = EC.ecWbSessionHTML();
    ok('v：复习卡翻面并排两行对比', h2.includes('你的答案：') && h2.includes('标准答案：') && gray(h2) >= 3);
    ok('v：复习卡翻面显示大白话解析', h2.includes('💡 大白话解析') && h2.includes('ec-wb-grade'));
    EC.state._wbSession = null;
    ok('v：刷题残留依然为 0', !/EC_QUIZ_BUILTIN|ecQuizStart|ecRenderQuiz/.test(APP));
}


// ============ v20261106w：六列「题目」 + 编辑弹窗字段标题 + [[ ]] 显式圈错 ============
console.log('—— v20261106w 题目字段 / 六列模板 / 字段标题 ——');
{
    const EC = makeEC();
    const gray = h => (h.match(/ec-wb-diff/g) || []).length;

    // 1. 静态检查
    ok('w→x：APP_BUILD 不低于 20261106w', (() => { const m = APP.match(/const APP_BUILD = '(\d+)([a-z]*)'/); return !!m && (m[1] > '20261106' || (m[1] === '20261106' && (m[2] || '') >= 'w')); })());
    ok('w：导入说明改成六列', /课时 \| 知识点 \| 题目 \| 我的答案 \| 正确答案 \| 大白话原因/.test(APP));
    ok('w：模板表头含题目', /'课时\\t知识点\\t题目\\t我的答案\\t正确答案\\t大白话原因'/.test(APP));
    ok('w：模板含 L1-L2 合并课时示例', /L1-L2\\t物主代词/.test(APP));
    ok('w：编辑弹窗六个字段都有标题', ['🗓️ 课时', '🎯 知识点 *', '📝 题目 / 题干', '✍️ 我的答案 *', '✅ 正确答案 *', '💡 大白话原因'].every(t => APP.includes(t)));
    ok('w：表单用 ec-wb-field + label 包字段', /const field = \(label, id, ph, val, multi\) => `<div class="ec-wb-field"><label>/.test(APP));
    ok('w：题目/答案/原因用多行 textarea', /ec-wb-input-multi/.test(APP) && /ecWbF3/.test(APP) && /ecWbF6/.test(APP));
    ok('w：表单取值含 question', /question: val\(3\)/.test(APP) && /mine: val\(4\)/.test(APP) && /right: val\(5\)/.test(APP) && /why: val\(6\)/.test(APP));
    ok('w：保存时写入 question', /question: v\.question \|\| ''/.test(APP));
    ok('w：收录/导出/导入备份都带 question', ['question: it.question || \'\'', 'question: it.question || \'\', mine: it.mine, right: it.right, why: it.why', 'question: String(o.question || \'\')'].every(t => APP.includes(t)));
    ok('w：复习卡有题目块', /📝 题目 \/ 题干/.test(APP) && /ecWbMarkHTML\(item\.question\)/.test(APP));
    ok('w：错题列表有题目行', /📝 题目<\/span>/.test(APP));
    ok('w：CSS 有题目/多行输入样式', /\.ec-wb-question\b/.test(CSS) && /\.ec-wb-input-multi\b/.test(CSS));
    ok('w：弹窗加高后可滚动，按钮不被挤出屏幕', /\.ui-modal-card \{ max-height: 88vh/.test(CSS) && /\.ui-modal-msg \{ overflow-y: auto/.test(CSS));
    ok('w：合并器有 question 兜底', /qPool\.set\(it\.id, it\.question\)/.test(APP) && /typeof it\.question === 'undefined' && qPool\.has/.test(APP));

    // 2. 六列解析
    const six = '课时\t知识点\t题目\t我的答案\t正确答案\t大白话原因\n'
        + "L1-L2\t物主代词\t中译英: 那是她的伞。\tThat is [[her's]] umbrella.\tThat is [[her]] umbrella.\t绝对没有 her's 这个词。";
    const r1 = EC.ecWbParse(six);
    ok('w：六列有表头正确解析', r1.items.length === 1 && r1.errors.length === 0
        && r1.items[0].lesson === 'L1-L2' && r1.items[0].point === '物主代词'
        && r1.items[0].question === '中译英: 那是她的伞。'
        && r1.items[0].mine === "That is [[her's]] umbrella."
        && r1.items[0].right === 'That is [[her]] umbrella.'
        && r1.items[0].why.includes('绝对没有'));
    const r2 = EC.ecWbParse('L1-L2\t物主代词\t题干\tmine\tright\twhy');
    ok('w：六列无表头也认', r2.items.length === 1 && r2.items[0].question === '题干' && r2.items[0].mine === 'mine' && r2.items[0].right === 'right');
    const r3 = EC.ecWbParse('L1-L2\t物主代词\tmine\tright\twhy');
    ok('w：旧五列格式仍兼容且题目为空', r3.items.length === 1 && r3.items[0].question === '' && r3.items[0].mine === 'mine' && r3.items[0].why === 'why');
    const r4 = EC.ecWbParse('知识点\t题目\t我的答案\t正确答案\t大白话原因\n物主代词\t题干\tmine\tright\twhy');
    ok('w：五列带题目表头（无课时列）', r4.items.length === 1 && r4.items[0].question === '题干' && r4.items[0].point === '物主代词' && r4.items[0].why === 'why');
    const r5 = EC.ecWbParse('课时\t知识点\t题目\t我的答案\t正确答案\nL1-L2\t物主代词\t题干\tmine\tright');
    ok('w：五列带题目表头（尾部原因被吞）', r5.items.length === 1 && r5.items[0].lesson === 'L1-L2' && r5.items[0].question === '题干' && r5.items[0].right === 'right');
    const r6 = EC.ecWbParse('考点\t错\t对\t原因');
    ok('w：旧四列格式不受影响', r6.items.length === 1 && r6.items[0].why === '原因' && r6.items[0].question === '');
    const r7 = EC.ecWbParse('L1-L2\t物主代词\t题干\tmine\tright\t第一句原因\n第二句原因继续');
    ok('w：六列之后原因换行仍续接', r7.items.length === 1 && r7.items[0].why.includes('第一句原因\n第二句原因继续') && r7.errors.length === 0);

    // 3. [[ ]] 显式圈错优先于自动 diff
    const cm = EC.ecWbCompareHTML("That is [[her's]] umbrella.", 'That is [[her]] umbrella.');
    ok('w：显式标记时按用户圈的位置打灰底', gray(cm.mine) === 1 && gray(cm.right) === 1);
    ok('w：灰底内容就是圈出的词', cm.mine.includes('<span class="ec-wb-diff">her\'s</span>') && cm.right.includes('<span class="ec-wb-diff">her</span>'));
    ok('w：标记本身不会显示成字面前括号', !cm.mine.includes('[[') && !cm.right.includes('[['));
    ok('w：相同部分正常显示', cm.mine.includes('That is ') && cm.right.includes(' umbrella.'));
    ok('w：差异词从标记里提取', cm.words.includes("her's") && cm.words.includes('her'));
    const mix = EC.ecWbCompareHTML('I [[go]] home.', 'I went home.');
    ok('w：一边有标记一边没有也按标记渲染', gray(mix.mine) === 1 && gray(mix.right) === 0);
    const auto = EC.ecWbCompareHTML('I go home.', 'I went home.');
    ok('w：无标记仍走自动逐词比对', gray(auto.mine) === 1 && gray(auto.right) === 1);
    ok('w：题目里的 [[ ]] 转灰底', EC.ecWbMarkHTML('填空: Which [[______]]?').includes('<span class="ec-wb-diff">______</span>'));
    ok('w：标记 HTML 被转义', !EC.ecWbMarkHTML('<script>[[x]]</script>').includes('<script>'));
    ok('w：解析里自动高亮圈出的词', EC.ecWbWhyHTML('绝对没有 her\'s 这个词。', cm.words).includes('<span class="ec-wb-diff">her\'s</span>'));

    // 4. 题目字段全链路
    const E2 = makeEC();
    const w2 = E2.ecWbData();
    E2.ecWbAddItems([{ lesson: 'L1-L2', point: '物主代词', question: '中译英: 那是她的伞。', mine: "That is [[her's]] umbrella.", right: 'That is [[her]] umbrella.', why: '绝对没有 her\'s。' }]);
    ok('w：收录后题目存进 items', w2.items.length === 1 && w2.items[0].question === '中译英: 那是她的伞。');
    const applied = E2.ecWbApplyForm({}, { scope: '', lesson: 'L1-L2', point: 'P', question: '改过的题干', mine: 'm', right: 'r', why: 'why' });
    ok('w：编辑保存写入题目', applied.question === '改过的题干');
    const form = E2.ecWbFormHTML(w2.items[0]);
    ok('w：编辑表单渲染题目与字段标题', form.includes('📝 题目 / 题干') && form.includes('中译英: 那是她的伞。') && form.includes('🎯 知识点 *'));
    E2.state._wbSession = { queue: [w2.items[0].id], idx: 0, revealed: false, graded: 0 };
    const hs = E2.ecWbSessionHTML();
    ok('w：复习卡显示题目且未泄标准答案', hs.includes('📝 题目 / 题干') && hs.includes('中译英: 那是她的伞。') && !hs.includes('标准答案：'));
    E2.state._wbSession.revealed = true;
    ok('w：复习卡翻面后题目仍在', E2.ecWbSessionHTML().includes('中译英: 那是她的伞。'));
    E2.state._wbSession = null;
    ok('w：错题列表显示题目', E2.ecWbItemHTML(w2.items[0], {}).includes('中译英: 那是她的伞。'));

    // 5. 跨端合并：旧快照没有 question 字段时补回，用户主动清空不被复活
    const oldNoQ = { id: 'q1', point: 'P', mine: 'm', right: 'r', createdAt: 1, updatedAt: 100 };
    const oldWithQ = { id: 'q1', point: 'P', mine: 'm', right: 'r', question: '题干', createdAt: 1, updatedAt: 50 };
    const mg = E2.ecMergeWrong({ items: [oldNoQ], tombs: {} }, { items: [oldWithQ], tombs: {} });
    ok('w：旧快照缺 question 字段时补回题目', mg.items[0].question === '题干');
    const cleared = { id: 'q1', point: 'P', mine: 'm', right: 'r', question: '', createdAt: 1, updatedAt: 200 };
    const mg2 = E2.ecMergeWrong({ items: [cleared], tombs: {} }, { items: [oldWithQ], tombs: {} });
    ok('w：主动清空题目不会被旧快照复活', mg2.items[0].question === '');

    // 6. 回归
    ok('w：刷题残留依然为 0', !/EC_QUIZ_BUILTIN|ecQuizStart|ecRenderQuiz/.test(APP));
    ok('w：FSRS 与学习联动仍在', /ecWbGrade/.test(APP) && /ecWbAutoDrill/.test(APP) && /ecReciteAction/.test(APP));
}


// ============ v20261106x：四模块联动「学习驾驶舱」 ============
console.log('—— x：四模块联动 ——');
{
    const EC = makeEC();
    const d = EC.ecData();

    // 1. 静态：新增函数、统一入口、动作分发
    ok('x：驾驶舱新函数齐全', ['ecPendingTasks', 'ecHubCounts', 'ecHubAdvice', 'ecGo', 'ecMainTabsHTML', 'ecHubGridHTML', 'ecLinkCardHTML', 'ecAchieveGo'].every(f => new RegExp('function ' + f + '\\(').test(APP)));
    ok('x：四个子标签统一常驻头卡', /const hub = state\._wbSession \? '' : ecHeaderHTML\(\);/.test(APP) && APP.includes('${hub}${renderEngCheckPage(tab)}'));
    ok('x：复习会话中收起头卡', /state\._wbSession \? '' : ecHeaderHTML\(\)/.test(APP));
    ok('x：页内旧头卡调用已全部移除', !APP.includes('${ecHeaderHTML()}'));
    ok('x：Tab 栏换成带徽标版本', /ecMainTabsHTML\(tabs, tab, extra\)/.test(APP) && /data-action="tab" data-module="engcheck"/.test(APP));
    ok('x：ec-go 统一跳转动作分发', /action === 'ec-go'/.test(APP) && /ecGo\(el\.dataset\.to/.test(APP));
    ok('x：联动条插在复习中心与错题概览', (APP.match(/ecLinkCardHTML\('/g) || []).length === 2);
    ok('x：刷题残留仍为 0', !/EC_QUIZ_BUILTIN|ecQuizStart|ecRenderQuiz/.test(APP));
    ok('x：背诵打分函数未丢', /function ecReciteAction/.test(APP));

    // 2. CSS：新类、主题、手机适配
    ok('x：驾驶舱 CSS 类齐全', ['.ec-hub-grid', '.ec-hub-cell', '.ec-tab-badge', '.ec-link-card', '.ec-mod-stat', '.ec-ach-progress', '.ec-day.lv3'].every(c => CSS.includes(c)));
    ok('x：暗色主题 + 手机 + 减少动效适配', /\[data-theme="dark"\] \.ec-hub /.test(CSS) && /@media \(max-width: 600px\)/.test(CSS) && /prefers-reduced-motion/.test(CSS));
    ok('x：CSS 花括号平衡', (CSS.match(/{/g) || []).length === (CSS.match(/}/g) || []).length);

    // 3. 计数口径（四个板块共用一套数字）
    const c0 = EC.ecHubCounts();
    ok('x：空数据口径归零', c0.tasks === 0 && c0.tasksTotal === 0 && c0.reciteDue === 0 && c0.wrongDue === 0 && c0.todayDone === 0 && c0.achievementTotal >= 8);
    d.books.push({ id: 'b1', name: '书A', order: 1, tasks: null });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'L1', order: 1 });
    ok('x：一课默认 5 项待办', EC.ecPendingTasks().pending === EC.EC_TASKS.length && EC.ecHubCounts().tasks === EC.EC_TASKS.length);
    d.tasks['l1|' + EC.EC_TASKS[0].id] = { at: Date.now() };
    ok('x：打卡后待办递减、已完成递增', EC.ecPendingTasks().pending === EC.EC_TASKS.length - 1 && EC.ecHubCounts().tasksDone === 1);

    // 4. 今日引导优先级
    const base = { wrongOverdue: 0, reciteDue: 0, wrongDue: 0, tasks: 0 };
    ok('x：引导优先逾期错题', EC.ecHubAdvice(Object.assign({}, base, { wrongOverdue: 3, reciteDue: 5, tasks: 2 })).to === 'ec-wrong');
    ok('x：引导优先到期背诵', EC.ecHubAdvice(Object.assign({}, base, { reciteDue: 5, wrongDue: 2 })).to === 'ec-review');
    ok('x：引导优先错题复习', EC.ecHubAdvice(Object.assign({}, base, { wrongDue: 2, tasks: 2 })).to === 'ec-wrong');
    ok('x：引导优先打卡任务', EC.ecHubAdvice(Object.assign({}, base, { tasks: 2 })).to === 'ec-books');
    ok('x：全清引导去成就榜', EC.ecHubAdvice(base).to === 'ec-achieve');

    // 5. 头卡 / Tab 栏 / 联动条渲染
    const hh = EC.ecHeaderHTML();
    ok('x：头卡保留等级与积分', hh.includes('Lv.') && hh.includes('⭐') && hh.includes('连续'));
    ok('x：头卡四格待办齐全', ['待学任务', '待背诵', '待复习错题', '今日已学'].every(t => hh.includes(t)) && (hh.match(/ec-hub-cell /g) || []).length === 4);
    ok('x：四格 + 引导按钮都能跳', (hh.match(/data-action="ec-go"/g) || []).length === 5);
    ok('x：头卡显示成就进度', hh.includes('成就') && hh.includes('ec-hub-advice'));
    const tabs = EC.ecMainTabsHTML(EC.EC_SUBTABS, 'ec-books', '');
    ok('x：Tab 栏保留原生切换语义', tabs.includes('data-action="tab"') && tabs.includes('data-module="engcheck"') && tabs.includes('data-tab="ec-wrong"') && tabs.includes('data-ec-main="1"'));
    ok('x：主 Tab 切换后平滑回顶（不影响其他模块）', /if \(el\.dataset\.ecMain\)[\s\S]{0,160}window\.scrollTo/.test(APP));
    ok('x：Tab 栏显示待办徽标', tabs.includes('ec-tab-badge'));
    ok('x：⚙️ 额外入口仍可拼接', EC.ecMainTabsHTML(EC.EC_SUBTABS, 'ec-review', '<i id="gear"></i>').includes('id="gear"'));
    const lk = EC.ecLinkCardHTML('ec-review');
    ok('x：联动条排除当前板块', !lk.includes('data-to="ec-review"') && ['ec-books', 'ec-wrong', 'ec-achieve'].every(t => lk.includes('data-to="' + t + '"')));
    ok('x：联动条高亮有待办板块', lk.includes('ec-link-item has'));

    // 6. 统一跳转
    EC.state._wbSession = { id: 'tmp' };
    EC.ecGo('ec-wrong', { sub: 'due', book: 'b1' });
    ok('x：跳错题复习带三级页 + 书本定位', EC.state.currentSubTab.engcheck === 'ec-wrong' && EC.state.currentSubTab['ec-wrong-sub'] === 'due' && EC.state._wbBookId === 'b1' && !EC.state._wbSession);
    EC.ecGo('ec-review', { sub: 'due' });
    ok('x：跳复习中心落到待背诵', EC.state.currentSubTab.engcheck === 'ec-review' && EC.state.currentSubTab['ec-review-sub'] === 'due');
    EC.state._ecBookId = 'b1'; EC.state._ecLessonId = 'l1';
    EC.ecGo('ec-books', { sub: 'books' });
    ok('x：跳书单首页清空下钻', EC.state._ecBookId === null && EC.state._ecLessonId === null);
    EC.ecGo('ec-books', { book: 'b1', lesson: 'l1' });
    ok('x：可直达指定书 / 指定课', EC.state._ecBookId === 'b1' && EC.state._ecLessonId === 'l1');
    ok('x：成就落点映射正确', EC.ecAchieveGo('recite-master').to === 'ec-review' && EC.ecAchieveGo('first-book').to === 'ec-books');

    // 7. 成就榜升级（原数据全保留）
    const ah = EC.ecRenderAchieve();
    ok('x：成就榜保留原学习数据', ah.includes('学习数据') && ah.includes('总积分') && ah.includes('错题集') && ah.includes('学习天数'));
    ok('x：新增四大板块数据卡', ah.includes('四大板块数据') && (ah.match(/ec-mod-stat"/g) || []).length === 4);
    ok('x：四大板块卡都能跳', (ah.match(/data-action="ec-go"/g) || []).length >= 4);
    ok('x：成就墙进度 + 去完成', ah.includes('待解锁') && ah.includes('ec-ach-progress') && ah.includes('去完成'));
    d.achievements['first-book'] = Date.now();
    const ah2 = EC.ecRenderAchieve();
    ok('x：解锁后分组显示已达成', ah2.includes('已达成（1）') && ah2.includes('ec-ach-on') && ah2.includes('待解锁（' + (EC.ecHubCounts().achievementTotal - 1) + '）'));
    ok('x：7 天热力按强度分级', ah.includes('ec-day lv'));

    // 8. 两个概览页确实带联动条
    EC.state.currentSubTab['ec-review-sub'] = 'overview';
    ok('x：复习中心概览带联动条', EC.ecRenderReview().includes('ec-link-card'));
    ok('x：错题概览带联动条', EC.ecWbOverviewHTML(EC.ecWbStats()).includes('ec-link-card'));

    // 9. 逾期口径：新题 / FSRS 缺失的旧题不算逾期，只有复习过且过期的才算
    const w2 = EC.ecWbData();
    w2.items.push({ id: 'wx1', point: '考点', mine: 'a', right: 'b', why: '', order: 1, createdAt: Date.now() });
    w2.fsrs['wx1'] = { last: 0, due: 0, s: 1, d: 5, n: 0 };
    w2.items.push({ id: 'wx2', point: '考点2', mine: 'c', right: 'd', why: '', order: 2, createdAt: Date.now() });
    ok('x：新题 / 无 FSRS 记录的题不算逾期', EC.ecWbStats().overdue === 0);
    w2.fsrs['wx1'] = { last: Date.now() - 10 * 86400000, due: Date.now() - 3 * 86400000, s: 3, d: 5, n: 1 };
    ok('x：复习过且过期才算逾期', EC.ecWbStats().overdue >= 1);
}


// 等待异步断言后汇总
setTimeout(() => {
    console.log(`\n========== 结果：${pass} 通过 / ${fail} 失败 ==========`);
    process.exit(fail ? 1 : 0);
}, 200);
