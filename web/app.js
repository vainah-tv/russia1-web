'use strict';
const channels = [
 {name:'РОССИЯ 1HD',url:'https://live.smotrim.ru/vgtrk/0/russia1-hd/1080p.m3u8'},
 {name:'РОССИЯ 24',url:'https://live-gtrk.smotrim.ru/vgtrk/grozniy/russia24-sd/track_103_35f01932/chunklist.m3u8'},
 {name:'ВАЙНАХ ТВ',url:'https://live-gtrk.smotrim.ru/vgtrk/grozniy/russia1-sd/track_103_947c7bd7/chunklist.m3u8'},
 {name:'РАДИО ВАЙНАХ',url:'https://podcast-gtrk.smotrim.ru/vgtrk/grozniy/radio_russia/track_1001_85855c03/chunklist.m3u8',radio:true}
];
const video=document.querySelector('#video');
const radioPanel=document.querySelector('#radio-panel');
const status=document.querySelector('#status'),playButton=document.querySelector('#play');
const muteButton=document.querySelector('#mute'),fullscreen=document.querySelector('#fullscreen');
const storageKey='russia1.selected-channel:'+location.pathname;
let index=0, loaded=false, muted=true;
let playing=false, connecting=false, startupTimer, generation=0;
function clearStartupTimer(){clearTimeout(startupTimer);startupTimer=undefined;}
function savedChannel(){
 try{
  const value=localStorage.getItem(storageKey);
  if(value===null)return 0;
  const selected=Number(value);
  return Number.isInteger(selected)&&selected>=0&&selected<channels.length?selected:0;
 }catch{return 0;}
}
function updateMute(){muteButton.textContent=muted?'Включить звук':'Выключить звук';muteButton.setAttribute('aria-pressed',String(muted));}
function selectChannel(next){
 clearStartupTimer();generation++;loaded=false;playing=false;connecting=false;
 video.pause();
 index=next;
 try{localStorage.setItem(storageKey,String(index));}catch{}
 // Keep one visible video element for all HLS streams, including audio-only HLS.
 video.controls=!channels[index].radio;
 video.autoplay=true;video.playsInline=true;video.muted=muted;
 radioPanel.hidden=!channels[index].radio;
 document.querySelector('#channel-name').textContent=channels[index].name;
 document.querySelectorAll('[data-channel]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.channel)===index)));
 fullscreen.disabled=!!channels[index].radio;
 playButton.textContent='Запустить эфир';
 status.textContent='Подключение к трансляции…';
}
function start(retry=0, reload=false){
 clearStartupTimer();
 const attempt=++generation;
 if(!video.canPlayType('application/vnd.apple.mpegurl')){
  status.textContent='Этот браузер не поддерживает HLS. На iPhone откройте ссылку в Safari.';return;
 }
 connecting=true;playing=false;
 if(!loaded||reload){
  loaded=false;video.pause();video.muted=muted;video.autoplay=true;
  video.src=channels[index].url;video.load();loaded=true;
 }
 status.textContent='Подключение к трансляции…';
 playButton.textContent='Запустить эфир';
 startupTimer=setTimeout(()=>{
  if(attempt!==generation||playing)return;
  if(retry===0&&video.readyState===0){start(1,true);return;}
  connecting=false;
  status.textContent='Эфир ещё загружается. Нажмите «Запустить эфир», если просмотр не начнётся.';
 },12000);
 const request=video.play();
 if(request)request.catch(error=>{
  if(attempt!==generation)return;
  clearStartupTimer();connecting=false;
  if(error.name==='AbortError')return;
  status.textContent=error.name==='NotAllowedError'?
   'Нажмите «Запустить эфир», чтобы начать воспроизведение.':
   'Не удалось открыть эфир. Нажмите «Запустить эфир» для повторной попытки.';
 });
}
playButton.addEventListener('click',()=>{
 if(playing&&!video.paused){
  clearStartupTimer();generation++;connecting=false;playing=false;video.autoplay=false;video.pause();return;
 }
 start(0,connecting||!!video.error);
});
document.querySelectorAll('[data-channel]').forEach(button=>button.addEventListener('click',()=>{
 selectChannel(Number(button.dataset.channel));start();
}));
muteButton.addEventListener('click',()=>{
 muted=!muted;video.muted=muted;updateMute();
 if(!muted&&!playing)start(0,connecting||!!video.error);
});
fullscreen.addEventListener('click',async()=>{
 try{
  if(channels[index].radio)return;
  if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();}
  else if(document.fullscreenElement){await document.exitFullscreen();}
  else if(video.requestFullscreen){await video.requestFullscreen();}
  else status.textContent='Используйте кнопку полного экрана в плеере.';
 }catch{status.textContent='Сначала запустите видео; затем включите полный экран.';}
});
video.addEventListener('playing',()=>{
 if(!loaded)return;
 clearStartupTimer();playing=true;connecting=false;
 status.textContent=channels[index].name+' · прямой эфир'+(muted?' · без звука':'');
 playButton.textContent='Пауза';
});
video.addEventListener('pause',()=>{
 if(!loaded||connecting)return;
 clearStartupTimer();playing=false;playButton.textContent='Продолжить';status.textContent='Эфир на паузе.';
});
video.addEventListener('waiting',()=>{if(loaded)status.textContent='Загрузка эфира…';});
video.addEventListener('error',()=>{
 if(!loaded)return;
 clearStartupTimer();connecting=false;playing=false;
 status.textContent='Поток недоступен. Проверьте интернет или повторите позже.';
 playButton.textContent='Повторить запуск';
});
video.addEventListener('ended',()=>{
 if(!loaded)return;
 clearStartupTimer();connecting=false;playing=false;loaded=false;
 playButton.textContent='Повторить запуск';status.textContent='Трансляция завершилась.';
});
video.addEventListener('volumechange',()=>{
 muted=video.muted;updateMute();
 if(playing)status.textContent=channels[index].name+' · прямой эфир'+(muted?' · без звука':'');
});
// Restore the chosen channel before assigning a stream. Never briefly load channel 0.
video.muted=true;
updateMute();
selectChannel(savedChannel());
start();
// Delay offline-shell caching until after the playback request has been issued.
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=6',{updateViaCache:'none'}).catch(()=>{});
