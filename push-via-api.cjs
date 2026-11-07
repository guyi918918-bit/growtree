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
    'app.20261107a.js', 'styles.20261107a.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];
// 历史哈希文件清理：只保留当前 a 与上一版 z（离线回退用），其余从远程 tree 删除。
// Git 历史仍完整保留，任何旧版本都能从旧 commit 找回；体积从约 96MB 降到约 2MB。
const KEEP_HASHED = new Set([
    'app.20261107a.js', 'styles.20261107a.css',
    'app.20261106z.js', 'styles.20261106z.css'
]);

const MESSAGE = `feat: 手机端 UI 适配（标签不截断 / 按钮不变形 / 首屏更紧凑）v20261107a

【用户反馈】三张手机截图显示英语打卡在 375px 宽下不太适配。

【根因】暗色主题里 .tab-btn 是 flex:1，5 个长标签（图标 + 4 字，约 100px）被硬均分到
67px 的格子，横排文字放不下就溢出压到相邻标签上 —— 出现「学习看 / 主线任 / 记忆巩」
这类截断、图标压字；三级页签「已掌握」被横向裁掉完全看不见。
错题概览四个操作按钮是 border-radius:980px 的胶囊，被 flex:1 压成正方形后变成圆，
文字折成三行（「开 / 始复习 /（8 / 题）」）。探险地图两列文案全被省略号截断。

【修复（纯 CSS，不动任何数据 / 同步 / 业务逻辑）】
1. 主 Tab 与三级子标签：窄屏等分竖排，图标在上、文字在下，字号 10px，
   5 个标签一眼看全、不重叠、不裁切；Tab 数量随用户显隐设置自动伸缩，齿轮占固定窄列。
2. 错题概览四个操作改 2×2 网格：固定 40px 高、nowrap、圆角 12px，不再变圆或折三行。
3. 探险地图保留两列但允许折行，去掉 ellipsis，文案完整可读。
4. 首屏收紧：隐藏手机端冗余面包屑（顶栏已有模块名、Tab 已高亮）、
   说明卡与卡片 padding / 间距 / 字号统一压缩、头卡能量条与鼓励卡更紧凑、
   「去看看」按钮满宽更好点、加 safe-area-inset-bottom 避免 Home Indicator 遮内容。
5. 追加 max-width:380px 小屏二次微调。
6. 「玩家已上线」提示原本是全屏居中大卡 + 全屏点击拦截 2.8 秒，手机上既挡首屏
   又短暂点不动；改为底部小胶囊（带安全区留白）并禁用点击拦截。

【验证】test-20261025c.cjs 全过（新增 a 章节 CSS 断言：竖排等分、2×2 网格、
允许折行、面包屑隐藏、safe-area、版本链）。真实无头 Chrome 390×844 手机视口截图复测：
主 Tab 5 个完整标签、三级页签 5 个完整标签、四个操作按钮方形不变圆、地图文案完整。
函数差集 0（本次未改 app.js 逻辑，仅升 APP_BUILD）。

【版本链】SW growtree-shell-v153；index 引用 app/styles.20261107a；
KEEP_HASHED 保留当前 a 与上一版 z，y 由 tree sha:null 自动删除。`;


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
