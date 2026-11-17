// رادار صفار — service worker: shows push notifications, sets the icon badge, opens the news item on tap.
const V = 'rn-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png']).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // network first so updates land immediately; cache only as an offline fallback
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {title: 'رادار صفار', body: e.data ? e.data.text() : ''}; }
  e.waitUntil((async () => {
    if (d.badge && self.navigator.setAppBadge) { try { await self.navigator.setAppBadge(d.badge); } catch (x) {} }
    await self.registration.showNotification(d.title || 'رادار صفار', {body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined, lang: 'ar', dir: 'rtl', data: {nid: d.nid || null}});
    for (const c of await self.clients.matchAll({type: 'window'})) c.postMessage({t: 'push'});
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const nid = e.notification.data && e.notification.data.nid, url = new URL('./' + (nid ? '#n=' + encodeURIComponent(nid) : ''), self.registration.scope).href;
  e.waitUntil((async () => {
    for (const c of await self.clients.matchAll({type: 'window', includeUncontrolled: true})) { if ('focus' in c) { c.postMessage({t: 'open', nid}); await c.focus(); return; } }
    await self.clients.openWindow(url);
  })());
});
