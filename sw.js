// 顾一的成长小树 · Service Worker
// 网络优先策略：每次打开都先请求最新文件，保证部署即生效；
// 仅在断网时回退到本地缓存（PWA 离线可用）。
// 探测到新版本时自动激活并接管页面，无需用户手动删除重加。

const CACHE = 'growtree-shell-v16';
const SHELL = ['./', './index.html', './app.js', './styles.css', './manifest.json'];

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

  // 网络优先：拿到最新即返回并缓存副本；失败则回退缓存
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
