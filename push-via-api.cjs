// 通过 GitHub Git Data API 推送（github.com 主站被代理拦截时的备用通道）
// 在远程 main 最新提交之上创建单个提交，保留远程全部历史（含热榜自动提交）
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GH_PAT;
const REPO = 'guyi918918-bit/growtree';
const ROOT = '/Users/mianmian/WorkBuddy/2026-08-09-16-35-36/workbench';
const API = 'https://api.github.com';

if (!TOKEN) { console.error('缺少 GH_PAT 环境变量'); process.exit(1); }

// 建 tree 时带 base_tree，只需列出本次变更的文件；历史哈希文件已在远程 tree 中，
// 不必每次重传（否则几十个 600~800KB blob 会拖慢推送并提高失败率）。
const FILES = [
    'app.js', 'styles.css', 'index.html', 'sw.js', 'version.json',
    'app.20261110a.js', 'styles.20261110a.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];
// 历史哈希文件清理：只保留当前 20261110a 与上一版 20261107a（离线回退用），其余从远程 tree 删除。
// Git 历史仍完整保留，任何旧版本都能从旧 commit 找回；体积从约 96MB 降到约 2MB。
const KEEP_HASHED = new Set([
    'app.20261110a.js', 'styles.20261110a.css',
    'app.20261107a.js', 'styles.20261107a.css'
]);

const MESSAGE = "feat: 三板块改名 + 学习看板换向 + 可编辑英语语法地图（双向联动课文）v20261110a\n\n【用户反馈】\n1. 认真打卡三个板块改名：基础打卡 → 工作日打卡、日常习惯 → 变美习惯、其他打卡 → 打败 BOSS。\n2. 学习看板「收获时刻」往上提，说明卡换方向（改成横向小条并下移到探险地图上方）。\n3. 把用户整理的《英语语法.md》（9 大分支 / 552 个节点）嵌进英语打卡「学习看板」，\n   并且要能编辑、能和课文里已导入的语法要点互相跳转。\n\n【实现】\n1. 分类改名：默认值 + 界面文案全量替换；新增 CATEGORY_RENAME 读取层归一化与 loadState\n   一次性迁移（categories / checkIns 徽标 / 积分流水），用户自定义过的板块名不动，\n   云端旧快照也不会把名字带回来；子 Tab 名字改为实时读板块设置。\n2. 看板顺序：收获时刻 → 英语语法地图 → 横向说明小条 → 今日探险地图；\n   联动卡仍只此一处，统计口径与鼓励式文案未改。\n3. 语法地图（state.data.engcheck.grammar）：\n   · 种子编译成 9 大分支 / 552 节点的嵌套数组，确定性 id（gms_*），跨设备自动合并成同一棵树。\n   · 彩色分支卡 + 可展开树 + 搜索 + 节点详情；每个点自动按「标题 + 内置别名 + 自定义关键词」\n     匹配课文 note，列出相关课文，点一下经 ecGo 直达该课详情。\n   · 课文列表 / 详情的灰色语法小字改成一颗颗可点标签，点标签切到学习看板并展开对应节点；\n     找不到时给「新建这个语法点」按钮，说法不一致也能补上。\n   · 编辑模式：改名 / 改关键词 / 换父节点 / 加子节点 / 删除（子树写墓碑）/\n     手动关联或取消关联课文 / 导入导出 Markdown / 恢复初始框架 / 展开收起。\n   · 同步：ecMergeGrammar 按 id 时间戳新者胜 + 墓碑，ecMergeEngcheck 两个分支都带上；\n     导入/恢复会给旧节点写墓碑并换唯一 id 前缀，防旧快照顶掉新框架。\n4. 样式：九色主干、树形连接线、暗色主题、600px 手机两列分支与 2 列工具按钮、\n   prefers-reduced-motion；深层缩进最多 5 级避免窄屏挤成一条缝。\n   手机端卡头 nowrap + 标题省略 + 隐藏修饰副标题，修掉「网」字孤行与编辑按钮独占一行。\n5. 页面真实滚动容器是 .content（html/body overflow:hidden），ecGo 回顶改走 ecScrollTop()，\n   同时滚 window 与 .content，避免跨板块跳转后停在半屏。\n\n【验证】test-20261025c.cjs 934 通过 / 0 失败（新增 v20261110a 章节：改名迁移、看板顺序、\n553 节点种子、归一化与匹配、双向联动、增删改/导入导出/恢复、跨端合并、事件接线、\n手机卡头 CSS 断言、CSS 与版本链哈希一致性）。真实无头 Chrome / CDP 复测：READY=true、\n9 大分支、553 节点、搜索排序、双向跳转、编辑模式、375×812 无横向溢出、JS 错误 0；\n桌面/手机首屏与语法地图卡片已截图核对。\n\n【版本链】SW growtree-shell-v154；index 引用 app/styles.20261110a；\nKEEP_HASHED 保留当前 20261110a 与上一版 20261107a，z 由 tree sha:null 自动删除。";


async function api(method, endpoint, body, attempt = 0) {
    let res, text;
    try {
        res = await fetch(API + endpoint, {
            method,
            headers: {
                'Authorization': 'token ' + TOKEN,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'User-Agent': 'growtree-deploy'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        text = await res.text();
    } catch (e) {
        if (attempt < 4) {
            console.error('网络抖动，重试 (' + (attempt + 1) + ')：', endpoint, String(e.message || e).slice(0, 120));
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            return api(method, endpoint, body, attempt + 1);
        }
        console.error('网络失败且重试耗尽:', method, endpoint, String(e.message || e).slice(0, 200));
        process.exit(1);
    }
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* ignore */ }
    if (!res.ok) {
        // 429 限流：等久一点再重试；其它状态也重试一次
        if (attempt < 4) {
            const wait = res.status === 429 ? 12000 : 2500;
            console.error('API ' + res.status + '，重试 (' + (attempt + 1) + ')：', endpoint, text.slice(0, 160));
            await new Promise(r => setTimeout(r, wait));
            return api(method, endpoint, body, attempt + 1);
        }
        console.error('API 失败:', method, endpoint, res.status, text.slice(0, 500));
        process.exit(1);
    }
    return json;
}

(async () => {
    // 1. 当前 main 引用与提交
    const ref = await api('GET', `/repos/${REPO}/git/ref/heads/main`);
    const headSha = ref.object.sha;
    console.log('远程 main HEAD:', headSha.slice(0, 10));
    const headCommit = await api('GET', `/repos/${REPO}/git/commits/${headSha}`);
    const baseTree = headCommit.tree.sha;
    console.log('base tree:', baseTree.slice(0, 10));

    // 1.5 找出远程里所有过期的 app.*.js / styles.*.css，用 sha:null 标记删除
    const full = await api('GET', `/repos/${REPO}/git/trees/${baseTree}?recursive=1`);
    if (full.truncated) { console.error('远程 tree 被截断，停止以免漏删'); process.exit(1); }
    const stale = (full.tree || []).filter(x => x.type === 'blob' &&
        /^(app|styles)\.[^/]+\.(js|css)$/.test(x.path) && !KEEP_HASHED.has(x.path));
    const staleBytes = stale.reduce((n, x) => n + (x.size || 0), 0);
    console.log('待清理历史版本文件:', stale.length, '个 /', (staleBytes / 1048576).toFixed(1), 'MB');

    // 2. 为每个变更文件创建 blob；删除项直接以 sha:null 进 tree
    const tree = stale.map(x => ({ path: x.path, mode: '100644', type: 'blob', sha: null }));
    for (const f of FILES) {
        const content = fs.readFileSync(path.join(ROOT, f));
        const b64 = content.toString('base64');
        const blob = await api('POST', `/repos/${REPO}/git/blobs`, { content: b64, encoding: 'base64' });
        tree.push({ path: f, mode: '100644', type: 'blob', sha: blob.sha });
        console.log('blob ✓', f, `(${(content.length / 1024).toFixed(0)}KB)`);
    }

    // 3. 创建 tree（基于远程 tree，只覆盖变更文件）
    const newTree = await api('POST', `/repos/${REPO}/git/trees`, { base_tree: baseTree, tree });
    console.log('new tree:', newTree.sha.slice(0, 10));

    // 4. 创建提交（parent = 远程 HEAD）
    const commit = await api('POST', `/repos/${REPO}/git/commits`, {
        message: MESSAGE,
        tree: newTree.sha,
        parents: [headSha]
    });
    console.log('new commit:', commit.sha.slice(0, 10));

    // 5. 更新 main 引用（fast-forward，非 force）
    const updated = await api('PATCH', `/repos/${REPO}/git/refs/heads/main`, { sha: commit.sha, force: false });
    console.log('✅ main 已更新:', updated.object.sha.slice(0, 10));
    console.log('推送区间:', headSha.slice(0, 7) + '..' + commit.sha.slice(0, 7));
})().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
