/* IOTA signage offline cache: always tries the internet first, and only uses the saved copy
   when the internet is down (e.g. after a power cut), so the TV never shows a browser error page. */
const C = 'iota-signage-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'logo.png', 'logo-big.png', 'slides/', 'sunnah/']).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || /[?&]admin\b/.test(u.search)) return;
  const key = u.origin + u.pathname; // one saved copy per file, whatever ?query the TV adds
  e.respondWith(fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)).catch(() => {}); } return res; })
    .catch(() => caches.open(C).then(c => c.match(key)).then(m => m || caches.match(r, { ignoreSearch: true })).then(m => m || Response.error())));
});
