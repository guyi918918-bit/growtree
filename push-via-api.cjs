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
    'app.20261110d.js', 'styles.20261110d.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];
// 历史哈希文件清理：只保留当前 20261110d 与线上上一版 20261110b（离线回退用），其余从远程 tree 删除。
// Git 历史仍完整保留，任何旧版本都能从旧 commit 找回；体积从约 96MB 降到约 2MB。
const KEEP_HASHED = new Set([
    'app.20261110d.js', 'styles.20261110d.css',
    'app.20261110b.js', 'styles.20261110b.css'
]);

const MESSAGE = "feat: 英语语法地图改按《英语语法系统讲义》重构 v20261110d\n\n【用户反馈】原 9 个零散分支不成体系、点开看不到内容；重新提供《英语语法系统讲义.docx》，\n要求以讲义为基础重做框架；讲义里的对比表格形式清晰，原样保留不必改。\n\n【实现】\n1. 框架换成讲义目录：10 章（词法/句法/强调/虚拟/be动词/否定/不定量/倒装/易错附录/不规则动词）\n   / 33 节 / 30 小节，共 73 个标题 + 1 根 = 74 节点，确定性 gmh_ 前缀 id。\n2. 讲义正文 126 段 + 51 张对照表 / 1704 个单元格编译为只读静态资料 EC_GM_HANDOUT\n   （不进 state、不占云同步体积），以有序块保留「表N 标题 → 表格」原始顺序。\n   按节点 id 优先取回，导入/恢复换 id 后按标题归一化索引兜底。\n3. 点任意节点展示它自己及所有后代的讲义内容：规则段落、易错高亮、表标题、\n   原样 HTML 对照表（首行 thead、窄屏横向滚动），各节可单独折叠；表格形式未改。\n4. 彩色分支网格保留（10 章 + 节数徽标），新增第 10 个分支配色；\n   搜索扩展到讲义正文与表格例词，别名参与排序；完整体系全览、编辑框架、\n   课文语法点双向联动全部保留。\n5. 一次性迁移 ecGmEnsureExtras：旧 gms_/gmx_ 框架整体写墓碑防旧快照复活，\n   用户手动加的节点、补的关键词、手动关联的课文用匹配引擎迁回新框架；幂等。\n   导入/恢复自定义 Markdown 不再被讲义覆盖。\n\n【验证】test-20261025c.cjs 全过；真实无头 Chrome 复测桌面与 375px 手机：\n10 章分支、点开有讲义正文与表格、表格窄屏可读、搜索与双向联动、无 JS 错误。\n\n【版本链】APP_BUILD / index / version.json 升到 20261110d；SW growtree-shell-v157；\nKEEP_HASHED 保留当前 20261110d 与线上上一版 20261110b。";


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
