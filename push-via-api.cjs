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
    'app.20261106y.js', 'styles.20261106y.css',
    'vendor/lunar.1.7.8.js', 'vendor/supabase.2.119.0.js',
    'test-20261025c.cjs', 'push-via-api.cjs'
];

const MESSAGE = `feat: 修复子标签跳首页 + 驾驶舱独立成页 + 加载链路加固 v20261106y

【用户反馈的三个问题】
1. 顶部「今日学习·四个板块一眼看清」驾驶舱占位置太多，希望单独给一页。
2. 关掉网页后点不进去。
3. 点「错题本 / 全部错题 / 已掌握」等按钮，直接跳回「欢迎首页」。

【根因与修复】
- data-action=tab 的通用处理把 ec-wrong-sub / ec-review-sub 这类「三级目录命名空间」
  也写进 state.currentModule；render() 找不到该模块就回退到导航第一项（欢迎首页）。
  现在只有 getModuleById() 认定的真实模块才能改 currentModule，虚拟命名空间只切子标签。
  真实浏览器复现：修复前点「全部错题」→ module=home；修复后稳定保持 engcheck。
- 顺带修：切主 Tab 时清掉错题复习会话 _wbSession，避免换板块仍卡在复习卡里。
- 顺带修：window.onerror / unhandledrejection 不再因一次后台请求失败就把整页换成错误堆栈；
  页面已就绪时只给轻量提示。

【学习驾驶舱独立成页】
- 主 Tab 固定新增「📊 总览」（不参与隐藏/排序设置），完整头卡 + 四格今日待办 + 今日建议
  + 四板块联动只在这一页显示。
- 书单课目 / 复习中心 / 错题复习 / 成就榜 顶部换成一行紧凑状态条
  （等级 / 积分 / 连续 / 今日待办 / 看总览），首屏不再被大卡片挤掉。
- 四个板块原有功能、联动条、ecGo 跳转、成就墙、Tab 徽标全部保留，数据结构与同步逻辑不动。

【加载链路加固（关掉重开更稳）】
- 第三方库本地托管：vendor/supabase.2.119.0.js、vendor/lunar.1.7.8.js；
  删掉从未使用的 compromise / chart.js 与境外 Google Fonts 请求。
- 脚本改 defer 不阻塞解析；启动完成置 window.__GT_READY__，6 秒未就绪显示「重新加载」，
  不再出现看得见却点不动的页面。
- Service Worker：带构建号 JS/CSS 与 vendor 改缓存优先，第二次打开直接读本地，
  不再每次重下近 800KB；index.html / version.json 仍网络优先，保证部署即时生效。
- 推送脚本精简 FILES：基于远程 base_tree 只上传变更文件，不再重传几十个历史哈希大文件。

【验证】test-20261025c.cjs 791 项全过（新增 y 章节 37 项：tab 分支动态执行断言、
总览分页、紧凑条、加载兜底、SW 缓存策略、CDN 清理）。函数差集：消失 0 / 新增 2。
真实无头浏览器点击路径回归：本地库加载、总览/四页切换、错题三级页、复习中心三级页、
侧栏进出全部正常，无 JS 错误。`;


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

    // 2. 为每个变更文件创建 blob
    const tree = [];
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
