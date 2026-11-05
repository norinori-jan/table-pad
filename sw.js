const C = 'tp-cache-v40';
const INJECT = '\n<script src="./hub-activity.js"></script><script src="./hub-handoff.js"></script><script src="./hub-ui.js"></script><script src="./transport-adapter.js"></script><script src="./geo-observation.js"></script><script src="./real-world-entry.js"></script><script src="./train-record-store.js"></script><script src="./train-entry.js"></script><script src="./official-sources.js"></script><script src="./official-info.js"></script><script src="./official-data-store.js"></script><script src="./official-data-adapter.js"></script><script src="./official-data-status.js"></script><script src="./gsi-official-adapter.js"></script><script src="./official-workspace.js"></script><script src="./gsi-observation-ui.js"></script><script src="./jma-official-adapter.js"></script><script src="./jma-observation-ui.js"></script><script src="./estat-official-adapter.js"></script><script src="./estat-observation-ui.js"></script><script src="./boj-official-adapter.js"></script><script src="./boj-observation-ui.js"></script><script src="./mof-official-adapter.js"></script><script src="./mof-observation-ui.js"></script><script src="./fsa-official-adapter.js"></script><script src="./fsa-observation-ui.js"></script><script src="./workspace-sections.js"></script><script src="./news-compare.js"></script>\n';

function instrument(response) {
  return response.text().then(text => {
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    const html = text.replace(/<\/body>/i, INJECT + '</body>');
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  });
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(C).then(cache => cache.addAll([
      './',
      'index.html',
      'manifest.webmanifest',
      'input-guide.js',
      'transport-adapter.js',
      'geo-observation.js',
      'real-world-entry.js',
      'train-record-store.js',
      'train-entry.js',
      'official-sources.js',
      'official-info.js',
      'official-data-store.js',
      'official-data-adapter.js',
      'official-data-status.js',
      'gsi-official-adapter.js',
      'gsi-observation-ui.js',
      'jma-official-adapter.js',
      'jma-observation-ui.js',
      'estat-official-adapter.js',
      'estat-observation-ui.js',
      'boj-official-adapter.js',
      'boj-observation-ui.js',
      'mof-official-adapter.js',
      'mof-observation-ui.js',
      'fsa-official-adapter.js',
      'fsa-observation-ui.js',
      'official-workspace.js',
      'workspace-sections.js',
      'news-lite.js',
      'news-compare.js',
      'hub-activity.js',
      'hub-handoff.js',
      'hub-ui.js'
    ]))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== C).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const url = new URL(event.request.url);
      const liveApi =
        url.hostname === 'api.e-stat.go.jp' ||
        url.hostname === 'www.jma.go.jp' ||
        url.hostname === 'www.data.jma.go.jp' ||
        url.hostname === 'cyberjapandata2.gsi.go.jp' ||
        url.hostname === 'www.stat-search.boj.or.jp' ||
        url.hostname === 'www.mof.go.jp' ||
        url.hostname === 'www.fsa.go.jp';

      const response = await fetch(event.request);
      if (liveApi) return response;

      if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
        const output = await instrument(response.clone());
        caches.open(C).then(cache => cache.put(event.request, output.clone()));
        return output;
      }

      caches.open(C).then(cache => cache.put(event.request, response.clone()));
      return response;
    } catch (error) {
      return caches.match(event.request);
    }
  })());
});
