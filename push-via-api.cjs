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
    'app.20261106z.js', 'styles.20261106z.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];
// 历史哈希文件清理：只保留当前 z 与上一版 y（离线回退用），其余从远程 tree 删除。
// Git 历史仍完整保留，任何旧版本都能从旧 commit 找回；体积从约 96MB 降到约 2MB。
const KEEP_HASHED = new Set([
    'app.20261106z.js', 'styles.20261106z.css',
    'app.20261106y.js', 'styles.20261106y.css'
]);

const MESSAGE = `feat: 鼓励式学习看板 + 清理 94MB 历史版本文件 v20261106z

【用户反馈的七点】
1. 记忆巩固 / 查漏补缺 界面不再显示「板块联动」卡；联动改为使用上互通（ec-go 跳转全保留）。
2. 学习看板删掉「225 待学任务」这类待办格子，不再制造压力。
3. 紧凑条「今天还有 N 项待办」、Tab 上的 99+/18 数字徽标、联动条「还有 N 项」、
   今日建议「还有 18 道错题等着复习」全部撤掉；四格改成长收成，文案全部鼓励式。
4. 成就墙从 8 枚扩到 22 枚，分启程 / 积累 / 坚持 / 精进 / 惊喜五大类；
   未点亮显示温柔进度与「去看看」，已点亮显示收下时间；最近 3 枚徽章搬进学习看板。
5. 五个主 Tab 改名：总览→学习看板、书单课目→主线任务、复习中心→记忆巩固、
   错题复习→查漏补缺、成就榜→荣誉战绩（tabCfg 只存 id，老数据自动套用新名字）。
6. 更好玩：每日一句鼓励（按日期确定性）、成长能量条、收获时刻、随手翻一课、
   今日探险地图、徽章弹跳动画，暗色主题 / 手机 / 减少动效均适配。
7. 清理仓库里累积的 254 个历史 app.*.js / styles.*.css（约 94MB），
   只保留当前 z 与上一版 y 作离线回退；Git 历史完整，随时可取回。

【不变的部分】所有数据、同步合并、FSRS、错题导入导出、三级目录、跨模块跳转、
成就判定原 8 枚 id 与口径全部保留；仅改呈现层文案与 UI。

【验证】test-20261025c.cjs 829 项全过（新增 z 章节 38 项）。
函数差集：消失 0 / 新增 8（含 y 的 2 个）。真实无头 Chrome 点击路径：
五个 Tab 改名生效、看板有鼓励/收获/地图、记忆巩固与查漏补缺无联动卡、
三级子标签切换后 currentModule 始终 engcheck、荣誉墙 22 枚与五大类齐全、无 JS 错误。`;


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
