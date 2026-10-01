'use strict';
// Keep the visible page awake independently of playback, including radio and pause.
(() => {
 const label = document.querySelector('#screen-status');
 let lock = null, pending = false, suspended = false, retryTimer;
 const visible = () => !suspended && document.visibilityState === 'visible';
 const show = text => { label.textContent = text; };
 function scheduleRetry() {
  clearTimeout(retryTimer); retryTimer = undefined;
  if (visible()) retryTimer = setTimeout(requestLock, 15000);
 }
 async function requestLock() {
  if (!visible() || pending || (lock && !lock.released)) return;
  clearTimeout(retryTimer); retryTimer = undefined;
  if (!window.isSecureContext || !navigator.wakeLock) {
   show('Удержание экрана недоступно. Откройте HTTPS-ссылку в современном браузере; на iPhone — в Safari.');
   return;
  }
  pending = true;
  try {
   const acquired = await navigator.wakeLock.request('screen');
   // The page may have been hidden while the browser handled the request.
   if (!visible()) { await acquired.release(); return; }
   lock = acquired;
   acquired.addEventListener('release', () => {
    if (lock !== acquired) return;
    lock = null;
    if (visible()) {
     show('Удержание экрана отключено системой. Повторяем попытку…');
     scheduleRetry();
    }
   });
   if (acquired.released) {
    lock = null;
    show('Удержание экрана отключено системой. Повторяем попытку…');
    scheduleRetry();
   } else show('Экран остаётся включённым, пока эта страница открыта на экране.');
  } catch {
   if (visible()) {
    show('Браузер не разрешил удержание экрана. Отключите энергосбережение и коснитесь страницы для повторной попытки.');
    scheduleRetry();
   }
  } finally {
   pending = false;
   // Cover a hide/show transition during a pending request.
   if (visible() && !lock && !retryTimer) scheduleRetry();
  }
 }
 function releaseLock() {
  clearTimeout(retryTimer); retryTimer = undefined;
  const previous = lock; lock = null;
  if (previous) previous.release().catch(() => {});
  show('Удержание экрана возобновится при возврате на страницу.');
 }
 document.addEventListener('visibilitychange', () => {
  if (visible()) requestLock(); else releaseLock();
 });
 window.addEventListener('pagehide', () => { suspended = true; releaseLock(); });
 window.addEventListener('pageshow', () => { suspended = false; requestLock(); });
 document.addEventListener('pointerdown', requestLock, { passive: true });
 document.addEventListener('keydown', requestLock);
 requestLock();
})();
