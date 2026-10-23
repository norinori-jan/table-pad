const C='tp-cache-v4';
const INJECT='\n<script src="./hub-activity.js"></script><script src="./hub-handoff.js"></script><script src="./hub-ui.js"></script>\n';
function instrument(r){return r.text().then(t=>new Response(t.replace(/<\/body>/i,INJECT+'</body>'),{status:r.status,statusText:r.statusText,headers:r.headers}))}
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','manifest.webmanifest'])))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{try{const r=await fetch(e.request);const u=new URL(e.request.url);if(u.pathname.endsWith('/index.html')||u.pathname.endsWith('/')){const out=await instrument(r.clone());caches.open(C).then(c=>c.put(e.request,out.clone()));return out}caches.open(C).then(c=>c.put(e.request,r.clone()));return r}catch(err){return caches.match(e.request)}})())});
