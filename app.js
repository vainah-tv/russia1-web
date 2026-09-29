'use strict';
const channels = [
 {name:'РОССИЯ 1HD',url:'https://live.smotrim.ru/vgtrk/0/russia1-hd/1080p.m3u8'},
 {name:'ВАЙНАХ ТВ',url:'https://live-gtrk.smotrim.ru/vgtrk/grozniy/russia1-sd/track_103_947c7bd7/chunklist.m3u8'},
 {name:'РАДИО ГРОЗНЫЙ',url:'https://podcast-gtrk.smotrim.ru/vgtrk/grozniy/radio_russia/track_1001_85855c03/chunklist.m3u8',radio:true}
];
const video=document.querySelector('#video'),audio=document.querySelector('#audio');
const status=document.querySelector('#status'),playButton=document.querySelector('#play');
const muteButton=document.querySelector('#mute'),fullscreen=document.querySelector('#fullscreen');
let index=0, loaded=false, muted=true;
let playing=false, connecting=false, startupTimer, generation=0;
function clearStartupTimer(){clearTimeout(startupTimer);startupTimer=undefined;}
function media(){return channels[index].radio?audio:video;}
function updateMute(){muteButton.textContent=muted?'Включить звук':'Выключить звук';muteButton.setAttribute('aria-pressed',String(muted));}
function selectChannel(next){
 clearStartupTimer();generation++;loaded=false;playing=false;connecting=false;
 for(const element of [video,audio]){element.autoplay=false;element.pause();element.removeAttribute('src');element.load();}
 index=next;loaded=false;
 video.hidden=!!channels[index].radio;
 document.querySelector('#radio-panel').hidden=!channels[index].radio;
 document.querySelector('#channel-name').textContent=channels[index].name;
 document.querySelectorAll('[data-channel]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.channel)===index)));
 fullscreen.disabled=!!channels[index].radio;
 playButton.textContent=channels[index].radio?'Слушать эфир':'Смотреть эфир';
 status.textContent='Нажмите «'+playButton.textContent+'» для запуска.';
}
function start(retry=0, reload=false){
 const element=media();
 clearStartupTimer();
 const attempt=++generation;
 if(!element.canPlayType('application/vnd.apple.mpegurl')){
  status.textContent='Этот браузер не поддерживает HLS. На iPhone откройте ссылку в Safari.';return;
 }
 connecting=true;playing=false;
 // Initialize the first channel exactly like subsequent channel selections.
 if(!loaded||reload){
  loaded=false;element.pause();element.muted=muted;
  element.src=channels[index].url;element.load();loaded=true;
 }
 status.textContent='Подключение к трансляции…';
 playButton.textContent='Запустить эфир';
 startupTimer=setTimeout(()=>{
  if(attempt!==generation||playing)return;
  if(retry===0){start(1,true);return;}
  connecting=false;
  status.textContent='Эфир ещё не запустился. Нажмите «Запустить эфир».';
 },12000);
 const request=element.play();
 if(request)request.catch(error=>{
  if(attempt!==generation||element!==media())return;
  clearStartupTimer();connecting=false;
  if(error.name==='AbortError')return;
  status.textContent=error.name==='NotAllowedError'?
   'Нажмите «Запустить эфир», чтобы начать просмотр.':
   'Не удалось открыть эфир. Нажмите «Запустить эфир» для повторной попытки.';
 });
}
playButton.addEventListener('click',()=>{
 if(playing&&!media().paused){
  clearStartupTimer();generation++;connecting=false;playing=false;media().pause();return;
 }
 // A tap during a stuck initial load restarts the same channel, not another one.
 start(0,connecting||!!media().error);
});
document.querySelectorAll('[data-channel]').forEach(button=>button.addEventListener('click',()=>{selectChannel(Number(button.dataset.channel));start();}));
muteButton.addEventListener('click',()=>{muted=!muted;video.muted=muted;audio.muted=muted;updateMute();if(!muted && !playing)start(0,connecting||!!media().error);});
fullscreen.addEventListener('click',async()=>{
 try{
  if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();}
  else if(document.fullscreenElement){await document.exitFullscreen();}
  else if(video.requestFullscreen){await video.requestFullscreen();}
  else status.textContent='Используйте кнопку полного экрана в плеере.';
 }catch{status.textContent='Сначала запустите видео; затем включите полный экран.';}
});
for(const element of [video,audio]){
 element.addEventListener('playing',()=>{if(element===media()&&loaded){clearStartupTimer();playing=true;connecting=false;status.textContent=channels[index].name+' · прямой эфир';playButton.textContent='Пауза';}});
 element.addEventListener('pause',()=>{if(element===media()&&loaded&&!connecting){clearStartupTimer();playing=false;playButton.textContent='Продолжить';status.textContent='Эфир на паузе.';}});
 element.addEventListener('waiting',()=>{if(element===media()&&loaded)status.textContent='Загрузка эфира…';});
 element.addEventListener('error',()=>{if(element===media()&&loaded){clearStartupTimer();connecting=false;playing=false;status.textContent='Поток недоступен. Проверьте интернет или повторите позже.';playButton.textContent='Повторить запуск';}});
 element.addEventListener('ended',()=>{if(element===media()&&loaded){clearStartupTimer();connecting=false;playing=false;loaded=false;playButton.textContent='Повторить запуск';status.textContent='Трансляция завершилась.';}});
 element.addEventListener('volumechange',()=>{if(element===media()){muted=element.muted;updateMute();}});
}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

// iPhone permits automatic video playback when muted.
video.muted=true;
audio.muted=true;
updateMute();
selectChannel(0);
start();
