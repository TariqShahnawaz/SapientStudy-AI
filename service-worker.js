const CACHE_NAME = 'sapientstudy-shell-v2';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key.startsWith('sapientstudy-shell-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

    event.respondWith(
        (async () => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) return cachedResponse;

            try {
                const networkResponse = await fetch(event.request);
                if (networkResponse.ok && networkResponse.type === 'basic') {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            } catch (error) {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                throw error;
            }
        })()
    );
});
