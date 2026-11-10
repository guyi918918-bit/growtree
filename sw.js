// 顾一的成长小树 · Service Worker
// v20261110e：
//  · 带构建号的 app.<build>.js / styles.<build>.css 和本地 vendor 库内容永不变 → 缓存优先。
//    第二次打开直接从本地读，不再每次重新下载近 800KB（慢网 / 断网时不会「点不进去」）。
//  · index.html / version.json 仍走网络优先，保证新版本部署后及时生效；断网回退本地缓存。
//  · 只缓存完整的 200 响应，避免把半截文件写进缓存。

const CACHE = 'growtree-shell-v158';
const SHELL = [
  './', './index.html',
  './app.20261110e.js', './styles.20261110e.css',
  './vendor/lunar.1.7.8.js', './vendor/supabase.2.119.0.js',
  './yuejixiangshou.html', './repair.html', './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // 逐条缓存：某个文件偶发失败不会让整批预缓存全部落空
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 第三方 API（Supabase / 天气 / 热榜）走浏览器默认网络，不拦截
  if (url.origin !== self.location.origin) return;

  const immutable = /\/(app|styles)\.[^/]+\.(js|css)$/.test(url.pathname) || url.pathname.indexOf('/vendor/') >= 0;
  const offline = () => caches.match(req).then((hit) => hit || new Response('离线中，请稍后重试', { status: 503 }));

  if (immutable) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(new Request(req, { cache: 'reload' })).then((res) => {
          if (!res.ok) return res;
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(offline);
      })
    );
    return;
  }

  // 页面 / version.json：网络优先 + 断网回退
  const networkReq = new Request(req, { cache: 'reload' });
  event.respondWith(
    fetch(networkReq)
      .then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(offline)
  );
});
