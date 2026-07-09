const CACHE_NAME = 'english-stats-v2';
const PRECACHE_URLS = [
    './',
    './statistics%20for%20English.html',
    './manifest.json',
    './icon-512.jpg',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装：预缓存核心资源
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll(PRECACHE_URLS).catch(err => {
                console.log('预缓存部分资源失败，将在运行时缓存:', err);
            })
        )
    );
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) {
                // 后台更新缓存
                fetch(e.request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(e.request, clone);
                        });
                    }
                }).catch(() => {});
                return cached;
            }

            return fetch(e.request).then(response => {
                if (!response || response.status !== 200) {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, clone);
                });
                return response;
            }).catch(() => {
                if (e.request.destination === 'document') {
                    return caches.match('./');
                }
            });
        })
    );
});
