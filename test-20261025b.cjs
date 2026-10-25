// v20261025b 回归测试：英语打卡（FSRS + 积分成就 + 批量导入 + 编辑按钮）
// + 探索英语删除 + 导航排序设置。运行：node test-20261025b.cjs
const fs = require('fs');
const APP = fs.readFileSync(__dirname + '/app.js', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles.css', 'utf8');
const HTML = fs.readFileSync(__dirname + '/index.html', 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('  ❌ FAIL: ' + name); } };

// ============ 一、静态检查 ============
console.log('—— 静态检查 ——');
ok('MODULES 已无探索英语', !/\{ id: 'english'/.test(APP));
ok('英语打卡模块仍在 MODULES', /\{ id: 'engcheck', name: '英语打卡'/.test(APP));
ok('moduleRenderers 无 english()', !/^    english\(\) \{/m.test(APP));
ok('eng 游乐场代码已删（engRenderHome 等）', !/engRenderHome|ENG_TABS|renderEnglishPage|engTranslate|engDoSearch/.test(APP));
ok('仅保留 engPlay_score 积分迁移引用', (APP.match(/engPlay_score/g) || []).length === 1);
ok('engHistory 数据字段已删', !/engHistory/.test(APP));
ok('eng-* 事件处理器已删', !/action === 'eng-/.test(APP));
ok('CSS 无 eng- 样式残留', !/\.eng-header|\.eng-card|\.eng-btn/.test(CSS));
ok('CSS 无 ec-curve（旧艾宾浩斯）', !/\.ec-curve-card|\.ec-node\b/.test(CSS));
ok('CSS 有渐变分组', /\.ec-group-input \.ec-group-head/.test(CSS) && /\.ec-group-output \.ec-group-head/.test(CSS) && /\.ec-group-recite \.ec-group-head/.test(CSS));
ok('CSS 有 FSRS 四档按钮', /\.ec-grade-btn\.g-again/.test(CSS) && /\.ec-grade-btn\.g-easy/.test(CSS));
ok('CSS 有导航拖拽样式', /\.module-row\.dragging/.test(CSS) && /\.mod-drag/.test(CSS));
ok('设置标题为导航排序与显示', HTML.includes('🧭 导航排序与显示（目录）'));
ok('设置说明含首页规则', HTML.includes('排第一的板块 = 打开工作台时的首页显示'));
ok('启动时首页=第一个可见板块', /const firstMod = getModules\(\)\[0\];[\s\S]{0,80}state\.currentModule = firstMod\.id/.test(APP));
ok('老用户移除 english 模块', /m\.id !== 'english'/.test(APP));
ok('engcheck 渲染器含成就榜 Tab', /id: 'ec-achieve', name: '成就榜'/.test(APP));
ok('批量导入功能存在', /ecImportNames/.test(APP) && /data-action="ec-import-lessons"/.test(APP));
ok('编辑按钮（ec-edit-lesson/book）', /data-action="ec-edit-lesson"/.test(APP) && /data-action="ec-edit-book"/.test(APP));
ok('积分迁移自探索英语', /engPlay_score/.test(APP));

// ============ 二、FSRS 算法单测 ============
console.log('—— FSRS 算法 ——');
const ecCode = APP.slice(APP.indexOf('// ==================== 英语打卡'), APP.indexOf('function init() {'));
function makeEC(overrides) {
    const mockState = Object.assign({
        data: { engcheck: { books: [], lessons: [], tasks: {}, fsrs: {}, score: 0, achievements: {}, days: {}, streak: 0, bestStreak: 0, lastStudyDate: '' } },
        _ecBookId: null, _ecLessonId: null, _ecEditBookId: null, _ecEditLessonId: null
    }, overrides || {});
    const fn = new Function('state', 'escapeHtml', 'toast', 'saveState', 'queueSync', 'render', 'uiPrompt', 'uiConfirm', 'uuid', 'now', 'today', 'dateStr', 'document', 'localStorage',
        ecCode + '\nreturn { ecData, ecFsrsLearn, ecFsrsReview, ecRetrievability, ecReciteStatus, ecReciteAction, ecToggleTask, ecGetLevel, ecLevelSymbols, EC_GRADES, EC_TASKS, EC_FSRS, ecRenderBooks, ecRenderLessons, ecRenderLesson, ecRenderReview, ecRenderAchieve, ecRenderDrill, state };');
    return fn(mockState, s => String(s), () => {}, () => {}, () => {}, () => {}, async () => null, async () => false,
        () => 'id' + Math.random().toString(36).slice(2, 8), () => new Date().toISOString(),
        () => '2026-10-25', d => '2026-10-25',
        { getElementById: () => ({ value: '' }), addEventListener: () => {} },
        { getItem: () => null, setItem: () => {} });
}

{
    const EC = makeEC();
    const T0 = 1770000000000;
    // R 公式：t=S 时 R=0.9（目标留存）
    ok('R(t=S)=0.9', Math.abs(EC.ecRetrievability(1, 1) - 0.9) < 1e-9);
    ok('R(0)=1', Math.abs(EC.ecRetrievability(5, 0) - 1) < 1e-9);
    // 新课入库
    const rec = EC.ecFsrsLearn(T0);
    ok('初始 S=1', rec.s === 1);
    ok('初始 D=5', rec.d === 5);
    ok('首次复习安排在第 1 天', Math.abs(rec.due - (T0 + 86400000)) < 1000);
    // Good 准时：S 约翻倍
    const g = EC.ecFsrsReview({ ...rec }, 3, T0 + 86400000);
    ok('Good 后 S≈2', g.s > 1.9 && g.s < 2.1);
    ok('Good 后 D 不变', g.d === 5);
    ok('Good 后 n=1', g.n === 1);
    // Easy > Good > Hard
    const h = EC.ecFsrsReview({ ...rec }, 2, T0 + 86400000);
    const e = EC.ecFsrsReview({ ...rec }, 4, T0 + 86400000);
    ok('Hard 涨幅 < Good', h.s < g.s);
    ok('Easy 涨幅 > Good', e.s > g.s);
    ok('Hard 后 D 上升', h.d > 5);
    ok('Easy 后 D 下降', e.d < 5);
    // Again：对折 + D 大涨
    const a = EC.ecFsrsReview({ ...rec, s: 10, d: 5 }, 1, T0 + 86400000);
    ok('Again 后 S 对折', a.s === 5);
    ok('Again 后 D 上升', a.d > 5.5);
    ok('Again 记 lapses', a.lapses === 1);
    // 迟到宽容：晚 3 倍时间复习，Good 涨幅明显小于准时
    const onTime = EC.ecFsrsReview({ s: 10, d: 5, n: 1, last: T0 }, 3, T0 + 10 * 86400000);
    const late = EC.ecFsrsReview({ s: 10, d: 5, n: 1, last: T0 }, 3, T0 + 30 * 86400000);
    ok('迟到复习 Good 涨幅更小', late.s < onTime.s);
    // 难度调制：D 高的课涨得慢
    const easyCard = EC.ecFsrsReview({ s: 4, d: 2, n: 1, last: T0 }, 3, T0 + 4 * 86400000);
    const hardCard = EC.ecFsrsReview({ s: 4, d: 8, n: 1, last: T0 }, 3, T0 + 4 * 86400000);
    ok('难度高的课 S 涨得更慢', hardCard.s < easyCard.s);
    // 120 天上限
    let r2 = { s: 100, d: 3, n: 5, last: T0 };
    r2 = EC.ecFsrsReview(r2, 4, T0 + 100 * 86400000);
    ok('最大间隔封顶 120 天', r2.s <= 120);
    // 已掌握判定
    ok('S≥60 判已掌握', EC.ecReciteStatus({ s: 60, due: T0, last: T0 }, T0) === 'mastered');
    ok('到期判 due', EC.ecReciteStatus({ s: 2, due: T0 - 1000, last: T0 - 86400000 }, T0) === 'due');
    ok('未到期判 waiting', EC.ecReciteStatus({ s: 2, due: T0 + 100000, last: T0 }, T0) === 'waiting');
    ok('无记录判 new', EC.ecReciteStatus(null, T0) === 'new');
    // 完整轨迹：模拟一课从入库到掌握
    let tr = EC.ecFsrsLearn(T0);
    const grades = [3, 3, 3, 3, 4, 3];
    let t = T0;
    grades.forEach(gd => { t = tr.due; tr = EC.ecFsrsReview(tr, gd, t); });
    ok('6 次复习后达到已掌握', tr.s >= 60);
}

// ============ 三、积分 / 连续 / 成就 ============
console.log('—— 积分与成就 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    // 任务打卡 +2 分
    EC.ecToggleTask('l1', 'listen-broad');
    ok('任务完成 +2 分', d.score === 2);
    ok('任务有记录', !!d.tasks['l1|listen-broad']);
    EC.ecToggleTask('l1', 'listen-broad');
    ok('取消完成 -2 分', d.score === 0);
    EC.ecToggleTask('l1', 'listen-broad');
    // 背书入库 +5 分
    EC.ecReciteAction('l1', 'learn');
    ok('背书入库 +5 分', d.score === 7);
    ok('fsrs 记录存在', !!d.fsrs.l1 && d.fsrs.l1.s === 1);
    // 复习打分积分
    const rec = d.fsrs.l1;
    rec.due = Date.now() - 1000;
    EC.ecReciteAction('l1', '3');
    ok('Good 复习 +2 分', d.score === 9);
    ok('复习后 n=1', d.fsrs.l1.n === 1);
    // 连续学习
    ok('连续天数=1', d.streak === 1);
    ok('今日有学习记录', !!d.days[new Date().toISOString().slice(0, 10)] || Object.keys(d.days).length > 0);
    // 成就
    ok('成就：第一本书', !!d.achievements['first-book']);
    ok('成就：第一个任务', !!d.achievements['first-task']);
    ok('成就：首背成功', !!d.achievements['first-recite']);
    // 等级
    ok('等级公式 0分=Lv1', EC.ecGetLevel(0) === 1);
    ok('等级公式 25分=Lv3', EC.ecGetLevel(25) === 3);
    ok('等级符号非空', EC.ecLevelSymbols(3).length > 0);
}

// ============ 四、渲染冒烟 ============
console.log('—— 渲染冒烟 ——');
{
    const EC = makeEC();
    const d = EC.ecData();
    // 空书单
    let h = EC.ecRenderBooks();
    ok('空书单渲染', h.includes('还没有书单') && h.includes('Lv.1'));
    // 完整流程
    d.books.push({ id: 'b1', name: '新概念英语一', order: 1, createdAt: 'x' });
    EC.state._ecBookId = 'b1';
    d.lessons.push({ id: 'l1', bookId: 'b1', name: 'Lesson 1', order: 1, createdAt: 'x' });
    d.lessons.push({ id: 'l2', bookId: 'b1', name: 'Lesson 2', order: 2, createdAt: 'x' });
    // 课程列表
    h = EC.ecRenderLessons();
    ok('课程列表渲染', h.includes('新概念英语一') && h.includes('Lesson 1') && h.includes('Lesson 2'));
    ok('批量生成区在', h.includes('批量生成') && h.includes('ecBatchPrefix'));
    ok('批量导入区在', h.includes('ecImportNames') && h.includes('批量导入名称'));
    // 编辑按钮默认只显示 ✏️
    ok('编辑按钮默认收起', h.includes('data-action="ec-edit-lesson"') && !h.includes('ec-rename-lesson'));
    // 进入课程
    EC.state._ecLessonId = 'l1';
    h = EC.ecRenderLesson();
    ok('任务视图：输入板块', h.includes('输入板块') && h.includes('泛听') && h.includes('精听') && h.includes('跟读'));
    ok('任务视图：输出板块', h.includes('输出板块') && h.includes('说译') && h.includes('练题'));
    ok('任务视图：背诵板块', h.includes('背诵板块') && h.includes('开始背诵'));
    ok('渐变分组 class', h.includes('ec-group-input') && h.includes('ec-group-output') && h.includes('ec-group-recite'));
    // 打卡后
    EC.ecToggleTask('l1', 'listen-broad');
    h = EC.ecRenderLesson();
    ok('打卡后显示已完成', h.includes('已完成') && h.includes('取消完成'));
    // 背书入库后
    EC.ecReciteAction('l1', 'learn');
    h = EC.ecRenderLesson();
    ok('入库后显示学习中', h.includes('学习中') && h.includes('下次复习'));
    // 到期后显示四档按钮
    d.fsrs.l1.due = Date.now() - 1000;
    h = EC.ecRenderLesson();
    ok('到期显示四档自评', h.includes('Again') && h.includes('Hard') && h.includes('Good') && h.includes('Easy'));
    ok('四档带说明', h.includes('大面积卡壳') && h.includes('独立完整背完'));
    // 复习中心
    h = EC.ecRenderReview();
    ok('复习中心有待背诵', h.includes('待背诵清单') && h.includes('Lesson 1'));
    ok('复习中心可inline打分', h.includes('ec-grade-mini'));
    // 成就榜
    h = EC.ecRenderAchieve();
    ok('成就榜渲染', h.includes('成就墙') && h.includes('七日不断') && h.includes('学习数据'));
    ok('7 天学习条', h.includes('ec-day-strip'));
    // 下钻容错
    EC.state._ecLessonId = 'nonexistent';
    h = EC.ecRenderLesson();
    ok('无效课程 id 回退', h.includes('新概念英语一'));
    EC.state._ecBookId = 'nonexistent';
    h = EC.ecRenderLessons();
    ok('无效书 id 回退书单', h.includes('我的书单'));
}

// ============ 五、导航排序（模块管理 UI） ============
console.log('—— 导航排序 ——');
{
    ok('buildModuleManager 有拖拽手柄', /mod-drag/.test(APP));
    ok('buildModuleManager 有勾选显隐', /mod-vis/.test(APP) && /data-action="module-toggle"/.test(APP));
    ok('DnD 初始化函数', /function initModuleManagerDnD/.test(APP));
    ok('drop 后重排并同步', /all\.splice\(dragIdx, 1\)\[0\]/.test(APP) && /all\.splice\(to, 0, moved\)/.test(APP));
    ok('toggle 用 checked 判定', /const willHide = !el\.checked/.test(APP));
    ok('保留至少一个可见板块', /至少保留一个显示的板块/.test(APP));
}

// ============ 汇总 ============
console.log(`\n========== 结果：${pass} 通过 / ${fail} 失败 ==========`);
process.exit(fail ? 1 : 0);
