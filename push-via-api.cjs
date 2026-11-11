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
    'app.20261111b.js', 'styles.20261111b.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];
// 历史哈希文件清理：只保留当前 20261111b 与线上上一版 20261111a（离线回退用），其余从远程 tree 删除。
// Git 历史仍完整保留，任何旧版本都能从旧 commit 找回；体积从约 96MB 降到约 2MB。
const KEEP_HASHED = new Set([
    'app.20261111b.js', 'styles.20261111b.css',
    'app.20261111a.js', 'styles.20261111a.css'
]);

const MESSAGE = "feat: 语法讲义支持逐页编辑（改错 / 补笔记 / 恢复原文）v20261111b\n\n【用户反馈】以后经常会遇到容易错的地方，或觉得特别有道理的语法点，希望能直接在\n语法地图里修改编辑；点进某一项就有这个功能即可，其余规则照旧。\n\n【实现】\n1. 每个末级讲义页新增「✏️ 编辑本页」：进入编辑态后一次只显示这一页，可改标题、段落、\n   例句、小提示、易错提醒、大白话，以及对照表的每个单元格。\n2. 可增删块、上下移动、加行加列，并新增「⭐ 我的笔记」块类型专门记录常错点与心得；\n   空块保存时自动过滤，整页清空会被拦下，避免误操作留下空白页。\n3. 编辑结果按页存进 state.data.engcheck.gdEdits（整页快照 + 时间戳），随整包云同步，\n   刷新与换设备都保留；ecMergeGdEdits 按页 at 取新合并，两台设备各改不同页互不覆盖。\n4. 「↩️ 恢复文档原文」写入 del 墓碑（同样按时间合并），不会被云端旧快照带回；\n   恢复后讲义、标题、搜索、目录角标都回到《大白话英语语法》原文。\n5. 编辑态下的标题 / 正文 / 表格会同步作用于面包屑、目录卡片、搜索命中；课文联动\n   （讲义 → 课文、课文语法小字 → 讲义）与逐层钻取「一次只看一层」完全不变。\n6. 重绘前统一收集未保存输入到草稿，切页 / 加块 / 搜索都不会丢字；用户输入全部 HTML 转义。\n7. 全套回归、真实无头 Chrome 桌面 + 375px 复测通过，JS 错误 0、无页面级横向溢出；\n   旧版 20261111a 保留作离线回退。\n\n【版本链】APP_BUILD / index / version.json 升到 20261111b；SW growtree-shell-v161；\nKEEP_HASHED 保留当前 20261111b 与线上上一版 20261111a。";


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
