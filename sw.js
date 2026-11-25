/* IOTA signage offline cache.
   - Pages (the signage and the slides pages): internet first, but if the internet does not answer within 5 s
     the saved copy is shown, so a "connected but no internet" Wi-Fi never leaves the TV on a blank screen.
   - Pictures and fonts of the animated slides: the saved copy is shown at once and refreshed in the background. */
const C = 'iota-signage-v4';
const A = ['emblem_white.png', 'logo.png', 'shield.png', 'jost-latin-300-normal.woff2', 'jost-latin-400-normal.woff2', 'jost-latin-500-normal.woff2', 'jost-latin-600-normal.woff2', 'jost-latin-700-normal.woff2', 'jost-latin-800-normal.woff2', 'noto-nastaliq-urdu-arabic-400-normal.woff2', 'noto-nastaliq-urdu-arabic-600-normal.woff2'];
const PRE = ['./', 'assets/avatar.png', 'logo.png', 'logo-big.png', 'slides/', 'sunnah/', 'slides/img/app.jpg', 'slides/img/crowd.jpg', 'slides/img/iceberg.jpg', 'slides/img/path.jpg', 'sunnah/img/h1.jpg', 'sunnah/img/h2.jpg', 'sunnah/img/h3.jpg', 'sunnah/img/h4.jpg', 'sunnah/img/h5.jpg', 'sunnah/img/h6.jpg', 'sunnah/assets/amiri-arabic-400-normal.woff2', 'sunnah/assets/amiri-arabic-700-normal.woff2']
  .concat(A.map(f => 'slides/assets/' + f), A.map(f => 'sunnah/assets/' + f));
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => Promise.all(PRE.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const saved = (key, r) => caches.open(C).then(c => c.match(key)).then(m => m || caches.match(r, { ignoreSearch: true }));
const keep = (key, res) => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)).catch(() => {}); } return res; };
function netFirst(r, key) {
  return new Promise(resolve => {
    let done = false; const fin = x => { if (!done && x) { done = true; resolve(x); } };
    const t = setTimeout(() => saved(key, r).then(fin).catch(() => {}), 5000); // internet too slow: use the saved copy
    fetch(r).then(res => { clearTimeout(t); keep(key, res); if (res.ok) return fin(res); return saved(key, r).then(m => fin(m || res)); })
      .catch(() => { clearTimeout(t); saved(key, r).then(m => { if (!done) { done = true; resolve(m || Response.error()); } }); });
  });
}
function cacheFirst(r, key) {
  return saved(key, r).then(m => {
    const net = fetch(r).then(res => keep(key, res));
    if (m) { net.catch(() => {}); return m; }
    return net.catch(() => Response.error());
  });
}
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || /[?&]admin\b/.test(u.search)) return;
  const key = u.origin + u.pathname; // one saved copy per file, whatever ?query the TV adds
  e.respondWith(/\/(slides|sunnah)\/(assets|img)\//.test(u.pathname) ? cacheFirst(r, key) : netFirst(r, key));
});
