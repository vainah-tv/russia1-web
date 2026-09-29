'use strict';
const channels = [
 {name:'РОССИЯ 1HD',url:'https://live.smotrim.ru/vgtrk/0/russia1-hd/1080p.m3u8'},
 {name:'ВАЙНАХ ТВ',url:'https://live-gtrk.smotrim.ru/vgtrk/grozniy/russia1-sd/track_103_947c7bd7/chunklist.m3u8'},
 {name:'РАДИО ГРОЗНЫЙ',url:'https://podcast-gtrk.smotrim.ru/vgtrk/grozniy/radio_russia/track_1001_85855c03/chunklist.m3u8',radio:true}
];
const video=document.querySelector('#video'),audio=document.querySelector('#audio');
const status=document.querySelector('#status'),playButton=document.querySelector('#play');
const muteButton=document.querySelector('#mute'),fullscreen=document.querySelector('#fullscreen');
let index=0, loaded=false, muted=false;
function media(){return channels[index].radio?audio:video;}
function updateMute(){muteButton.textContent=muted?'Включить звук':'Выключить звук';muteButton.setAttribute('aria-pressed',String(muted));}
function selectChannel(next){
 for(const element of [video,audio]){element.pause();element.removeAttribute('src');element.load();}
 index=next;loaded=false;
 video.hidden=!!channels[index].radio;
 document.querySelector('#radio-panel').hidden=!channels[index].radio;
 document.querySelector('#channel-name').textContent=channels[index].name;
 document.querySelectorAll('[data-channel]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.channel)===index)));
 fullscreen.disabled=!!channels[index].radio;
 playButton.textContent=channels[index].radio?'Слушать эфир':'Смотреть эфир';
 status.textContent='Нажмите «'+playButton.textContent+'» для запуска.';
}
function start(){
 const element=media();
 if(!element.canPlayType('application/vnd.apple.mpegurl')){
  status.textContent='Этот браузер не поддерживает HLS. На iPhone откройте ссылку в Safari.';return;
 }
 if(!loaded){element.src=channels[index].url;element.muted=muted;loaded=true;}
 status.textContent='Подключение к трансляции…';
 const request=element.play();
 if(request)request.catch(error=>{
  if(element!==media())return;
  status.textContent=error.name==='NotAllowedError'?'Нажмите кнопку воспроизведения в плеере.':'Не удалось открыть эфир. Проверьте интернет и повторите запуск.';
 });
}
playButton.addEventListener('click',()=>{
 if(!media().paused){media().pause();return;}
 // Reload after a failed stream; keep a paused successful stream available.
 if(media().error){loaded=false;media().removeAttribute('src');media().load();}
 start();
});
document.querySelectorAll('[data-channel]').forEach(button=>button.addEventListener('click',()=>{selectChannel(Number(button.dataset.channel));start();}));
muteButton.addEventListener('click',()=>{muted=!muted;video.muted=muted;audio.muted=muted;updateMute();});
fullscreen.addEventListener('click',async()=>{
 try{
  if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();}
  else if(document.fullscreenElement){await document.exitFullscreen();}
  else if(video.requestFullscreen){await video.requestFullscreen();}
  else status.textContent='Используйте кнопку полного экрана в плеере.';
 }catch{status.textContent='Сначала запустите видео; затем включите полный экран.';}
});
for(const element of [video,audio]){
 element.addEventListener('playing',()=>{if(element===media()){status.textContent=channels[index].name+' · прямой эфир';playButton.textContent='Пауза';}});
 element.addEventListener('pause',()=>{if(element===media()&&loaded){playButton.textContent='Продолжить';status.textContent='Эфир на паузе.';}});
 element.addEventListener('waiting',()=>{if(element===media()&&loaded)status.textContent='Загрузка эфира…';});
 element.addEventListener('error',()=>{if(element===media()&&loaded){status.textContent='Поток недоступен. Проверьте интернет или повторите позже.';playButton.textContent='Повторить запуск';}});
 element.addEventListener('ended',()=>{if(element===media()){loaded=false;playButton.textContent='Повторить запуск';status.textContent='Трансляция завершилась.';}});
 element.addEventListener('volumechange',()=>{if(element===media()){muted=element.muted;updateMute();}});
}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
