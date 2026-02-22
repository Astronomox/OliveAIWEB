// public/sw.js — Basic Service Worker for Olive AI
const CACHE_NAME = 'olive-ai-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/scan',
    '/olive',
    '/pregnancy',
    '/profile',
    '/onboarding',
    '/manifest.json',
    '/data/nafdac-mock.json',
    '/globals.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
