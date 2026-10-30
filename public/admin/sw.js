// Lazurde Admin · service worker: recibe los avisos de nuevas reservas
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Lazurde', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'Lazurde', {
      body: d.body || '',
      tag: d.tag || 'lazurde',
      renotify: true,
      requireInteraction: true,
      icon: '/admin/img/icon-192-v2.png',
      badge: '/admin/img/badge-96.png',
      vibrate: [200, 100, 200],
      data: { url: d.url || '/admin/' }
    }),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      list.forEach(function (c) { c.postMessage({ type: 'lz-push', tag: d.tag }); });
    }),
    self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge().catch(function () {}) : null
  ]));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf('/admin') !== -1) { c.postMessage({ type: 'lz-open', url: url }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
