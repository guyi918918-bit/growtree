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
    'app.20261111a.js', 'styles.20261111a.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];
// 历史哈希文件清理：只保留当前 20261111a 与线上上一版 20261110f（离线回退用），其余从远程 tree 删除。
// Git 历史仍完整保留，任何旧版本都能从旧 commit 找回；体积从约 96MB 降到约 2MB。
const KEEP_HASHED = new Set([
    'app.20261111a.js', 'styles.20261111a.css',
    'app.20261110f.js', 'styles.20261110f.css'
]);

const MESSAGE = "feat: 语法地图改为《大白话英语语法》4 大板块 + 逐层钻取 v20261111a\n\n【用户反馈】旧语法地图一屏同时铺开章节网格、体系树、正文详情，看起来太乱；要求以\n《大白话英语语法.docx》为唯一内容源，下设词法 / 句法 / 时态 / 其他 4 个板块，点哪一层\n就只出现哪一层（板块目录 → 知识点分支 → 末级讲义），并与课文保持联动。\n\n【实现】\n1. 把 docx 全文（400 个内容块 / 38 张对照表 / 1012 个单元格）编译成只读 EC_GD_DOC：\n   4 大板块 / 32 章 / 29 小节 / 53 个末级讲义页，段落与表格原样保留，不进 state、不占云同步。\n2. 语法地图主卡片重写：顶部 4 个子导航（复用 ec-books-subnav 样式），面包屑可逐级返回；\n   默认只显示当前板块目录，点章显示该章分支，点小节才展开讲义 + 对照表，绝不一次全铺开。\n3. 讲义段落按【小提示】/【注意】/【大白话】/例句四类色块呈现，表格沿用 ec-gm-table\n   原样渲染与窄屏横滑；「写在前面」收进默认折叠的 details，内容一字不丢。\n4. 课文联动保留双向：末级讲义列出相关课文（点一下回课文），课文里的语法小字点击后\n   经 EC_GD_TERMS 术语对齐直接落到对应讲义页；搜索也能命中标题、别名与讲义正文。\n5. 全套回归（983 通过 / 0 失败）与真实无头 Chrome 桌面 + 375px 复测通过，JS 错误 0、\n   无页面级横向溢出；旧版 20261110f 保留作离线回退。\n\n【版本链】APP_BUILD / index / version.json 升到 20261111a；SW growtree-shell-v160；\nKEEP_HASHED 保留当前 20261111a 与线上上一版 20261110f。";


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
