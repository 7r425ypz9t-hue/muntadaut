// app shell: network-first for the page (always fresh catalogue), cache fallback offline;
// thumbnails: stale-while-revalidate with a size cap.
const V = '91b3bba7f5', SHELL = 'shell-' + V, IMG = 'thumbs-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']))); self.skipWaiting() });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('shell-') && k !== SHELL).map(k => caches.delete(k))))); self.clients.claim() });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'i.ytimg.com') {
    e.respondWith(caches.open(IMG).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') { c.put(e.request, r.clone()); c.keys().then(k => k.length > 600 && c.delete(k[0])) } return r }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(SHELL).then(c => c.put(e.request, cp)); return r }).catch(() => caches.match(e.request).then(r => r || caches.match('./'))));
  }
});
