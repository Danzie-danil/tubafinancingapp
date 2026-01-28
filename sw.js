const STATIC_CACHE = 'tuba-static-v4';
const DYNAMIC_CACHE = 'tuba-dynamic-v4';
const BASE_PATH = new URL(self.registration.scope).pathname;
let PREFER_CACHE_ONCE = false;
const CORE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'app.js',
  BASE_PATH + 'app.js?v=4',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/tuba-icon-192.png',
  BASE_PATH + 'icons/tuba-icon-512.png'
];

async function responsesDiffer(oldRes, newRes) {
  try {
    if (!oldRes) return true;
    const et1 = oldRes.headers.get('ETag');
    const et2 = newRes.headers.get('ETag');
    if (et1 && et2 && et1 !== et2) return true;
    const lm1 = oldRes.headers.get('Last-Modified');
    const lm2 = newRes.headers.get('Last-Modified');
    if (lm1 && lm2 && lm1 !== lm2) return true;
    const cl1 = oldRes.headers.get('Content-Length');
    const cl2 = newRes.headers.get('Content-Length');
    if (cl1 && cl2 && cl1 !== cl2) return true;
    const ct = (newRes.headers.get('Content-Type') || '').toLowerCase();
    if (/text|javascript|json|html/.test(ct)) {
      const a = await oldRes.clone().text();
      const b = await newRes.clone().text();
      return a !== b;
    }
    return false;
  } catch { return true; }
}

async function precacheCoreAssets() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(CORE_ASSETS.map(url => cache.add(url).catch(() => null)));
}

async function clearAllCaches() {
  const names = await caches.keys();
  await Promise.all(names.map(n => caches.delete(n)));
  await precacheCoreAssets();
}

function broadcast(type) {
  try {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      list.forEach(c => { try { c.postMessage({ type }); } catch {} });
    });
  } catch {}
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await precacheCoreAssets();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => {
        if (k !== STATIC_CACHE && k !== DYNAMIC_CACHE) return caches.delete(k);
      }));
    } catch (err) {
      console.error('SW activate error', err);
    }
    try { await precacheCoreAssets(); } catch {}
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.url.includes('.mobileconfig')) {
    event.respondWith(fetch(req));
    return;
  }
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(BASE_PATH + 'index.html', { ignoreSearch: true })
        || await cache.match(BASE_PATH, { ignoreSearch: true })
        || await cache.match('index.html', { ignoreSearch: true });
      if (PREFER_CACHE_ONCE && cached) {
        PREFER_CACHE_ONCE = false;
        return cached;
      }
      const fetchPromise = fetch(req, { cache: 'no-store' }).then(async res => {
        try {
          const old = cached || await cache.match(BASE_PATH + 'index.html', { ignoreSearch: true });
          const changed = await responsesDiffer(old, res.clone());
          if (changed) {
            await clearAllCaches();
            broadcast('sw-cache-cleared');
          }
        } catch {}
        try { await cache.put(BASE_PATH + 'index.html', res.clone()); } catch {}
        return res;
      }).catch(() => null);
      if (cached) {
        event.waitUntil(fetchPromise);
        return cached;
      }
      const fresh = await fetchPromise;
      return fresh || cached || Response.error();
    })());
    return;
  }

  if (url.origin !== location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        try { const cache = await caches.open(DYNAMIC_CACHE); await cache.put(req, res.clone()); } catch {}
        return res;
      } catch { return cached || Response.error(); }
    })());
    return;
  }

  if (url.origin === location.origin) {
    const isJS = url.pathname.endsWith('.js') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('app.js');
    const isStatic = /\.(?:css|png|jpg|jpeg|svg|ico|webp|gif)$/.test(url.pathname);
    if (isJS) {
      event.respondWith((async () => {
        const cachedAny = await caches.match(req, { ignoreSearch: true });
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = cachedAny || await cache.match(req, { ignoreSearch: true });
        const fetchPromise = fetch(req, { cache: 'no-store' }).then(async res => {
          try {
            const old = cached || await cache.match(req, { ignoreSearch: true });
            const changed = await responsesDiffer(old, res.clone());
            if (changed) {
              await clearAllCaches();
              broadcast('sw-cache-cleared');
            }
          } catch {}
          try { await cache.put(req, res.clone()); } catch {}
          return res;
        }).catch(() => null);
        if (cached) {
          event.waitUntil(fetchPromise);
          return cached;
        }
        const fresh = await fetchPromise;
        return fresh || cached || Response.error();
      })());
      return;
    } else if (isStatic) {
      event.respondWith((async () => {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const res = await fetch(req);
          try { const cache = await caches.open(DYNAMIC_CACHE); await cache.put(req, res.clone()); } catch {}
          return res;
        } catch { return Response.error(); }
      })());
      return;
    }
  }
});

self.addEventListener('message', event => {
  try {
    const data = event.data || {};
    if (data && data.type === 'prefer-cache-next-reload') {
      PREFER_CACHE_ONCE = true;
    }
  } catch {}
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'TUBA Alert', body: event.data ? event.data.text() : '' }; }
  const title = String(payload.title || 'TUBA Alert');
  const options = { body: String(payload.body || ''), icon: './icons/tuba-icon-192.png', badge: './icons/tuba-icon-192.png', data: payload.url || '/' };
  const count = Number(payload.badgeCount || payload.count || 1);
  const notify = self.registration.showNotification(title, options);
  const setBadgeInSW = (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) ? navigator.setAppBadge(count).catch(()=>{}) : Promise.resolve();
  const broadcastBadge = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    list.forEach(c => { try { c.postMessage({ type: 'badge-update', count }); } catch {} });
  });
  event.waitUntil(Promise.all([notify, setBadgeInSW, broadcastBadge]));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification && event.notification.data ? event.notification.data : '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) { try { if ('focus' in client) return client.focus(); } catch {} }
    try { if (clients.openWindow) return clients.openWindow(targetUrl); } catch {}
  }));
});
