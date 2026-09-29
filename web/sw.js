'use strict';
const CACHE='russia1-web-v6';
const BASE=new URL('./',self.location.href);
const ASSETS=['./','index.html','style.css?v=6','app.js?v=6','manifest.webmanifest','assets/radio_gr.png?v=6','assets/icon-180.png','assets/icon-192.png','assets/icon-512.png'].map(p=>new URL(p,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('russia1-web-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!ASSETS.includes(event.request.url))return;
 // Never cache or proxy live streams. Prefer fresh application files online.
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
  return response;
 }).catch(()=>caches.match(event.request)));
});
