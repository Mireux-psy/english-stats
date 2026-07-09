const CACHE_NAME = 'english-stats-v6';

// 安装：预缓存核心资源
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll([
                './',
                './index.html',
                './manifest.json',
                './icon-512.jpg',
                'https://cdn.jsdelivr.net/npm/chart.js'
            ]).catch(err => {
                console.log('预缓存失败:', err);
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

// 网络优先策略：HTML 页面始终从网络获取，其他资源缓存优先
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    // HTML 页面：网络优先，确保用户总是看到最新版本
    if (e.request.headers.get('accept').includes('text/html')) {
        e.respondWith(
            fetch(e.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, clone);
                    });
                }
                return response;
            }).catch(() => {
                return caches.match(e.request).then(cached => {
                    return cached || caches.match('./index.html');
                });
            })
        );
        return;
    }

    // 静态资源（CSS/JS/图片）：缓存优先
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, clone);
                });
                return response;
            });
        })
    );
});
