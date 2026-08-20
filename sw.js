// 顾一的成长小树 · Service Worker
// 强制网络优先策略：所有同源请求带 cache:'reload' 绕过 HTTP 缓存直连服务器，
// 保证部署即生效、绝不回读旧缓存；仅在断网时回退到本地缓存（PWA 离线可用）。
// 文件名带构建号哈希（app.20260820a.js），部署后旧引用必然 404 → 强制加载新文件。
// 探测到新版本时自动激活并接管页面，无需用户手动删除重加。

const CACHE = 'growtree-shell-v28';
const SHELL = ['./', './index.html', './app.20260820d.js', './styles.20260820d.css', './manifest.json'];

self.addEventListener('install', (event) => {
  // 跳过等待，立即激活新 SW
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // 立即接管所有已打开的页面
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 第三方 API（Supabase / 天气 / 热榜）走浏览器默认网络，不拦截
  if (url.origin !== self.location.origin) return;

  // 关键改动：cache:'reload' 强制绕过浏览器 HTTP 缓存，每次直连服务器拉最新；
  // 拿到最新即返回并缓存副本；网络失败才回退本地缓存（离线可用）。
  const networkReq = new Request(req, { cache: 'reload' });
  event.respondWith(
    fetch(networkReq)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
