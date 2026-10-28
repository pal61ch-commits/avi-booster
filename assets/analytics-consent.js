(function(){
  'use strict';
  var COUNTER_ID=108505608;
  var STORAGE_KEY='pifagor_analytics_consent_v1';
  var VERSION='pifagor-analytics-2026-10-28-v1';
  var TTL_MS=180*24*60*60*1000;
  var LOCAL_PREVIEW=location.protocol==='file:'||['localhost','127.0.0.1','::1','[::1]'].indexOf(location.hostname)!==-1;
  var loaded=false;
  var script=null;
  var banner=null;
  var settings=null;

  function readState(){
    try{
      var state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!state||state.schema!==1||state.version!==VERSION)return null;
      if(state.choice!=='granted'&&state.choice!=='denied')return null;
      if(!Number.isFinite(state.expires_at)||state.expires_at<=Date.now())return null;
      if(!Number.isFinite(Date.parse(state.decided_at)))return null;
      return state;
    }catch(_){return null;}
  }

  function stopAnalytics(){
    if(loaded&&typeof window.ym==='function'){
      try{window.ym(COUNTER_ID,'destruct');}catch(_){}
    }
    if(script)script.remove();
    script=null;loaded=false;
    window.__pifagorAnalyticsLoaded=false;
  }

  function startAnalytics(){
    var state=readState();
    if(!state||state.choice!=='granted'||LOCAL_PREVIEW||loaded)return false;
    if(typeof window.ym!=='function'){
      window.ym=function(){(window.ym.a=window.ym.a||[]).push(arguments);};
      window.ym.l=Date.now();
    }
    script=document.createElement('script');
    script.async=true;
    script.src='https://mc.yandex.ru/metrika/tag.js?id='+COUNTER_ID;
    script.dataset.pifagorAnalytics='metrika';
    document.head.appendChild(script);
    loaded=true;window.__pifagorAnalyticsLoaded=true;
    window.ym(COUNTER_ID,'init',{ssr:true,webvisor:true,clickmap:true,trackLinks:true,ecommerce:'dataLayer',accurateTrackBounce:true,referrer:document.referrer,url:location.href});
    return true;
  }

  function updateLabel(){
    if(!settings)return;
    var state=readState();
    settings.setAttribute('aria-label',state&&state.choice==='granted'?'Настройки аналитики: разрешена':'Настройки аналитики');
  }

  function closeBanner(){
    if(banner)banner.remove();
    banner=null;
    updateLabel();
  }

  function choose(choice){
    if(choice!=='granted'&&choice!=='denied')return false;
    var now=Date.now();
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify({schema:1,version:VERSION,choice:choice,decided_at:new Date(now).toISOString(),expires_at:now+TTL_MS}));
      var persisted=readState();
      if(!persisted||persisted.choice!==choice)throw new Error('storage_unavailable');
    }catch(_){
      stopAnalytics();
      var status=banner&&banner.querySelector('[data-consent-status]');
      if(status)status.textContent='Не удалось сохранить выбор. Аналитика остаётся выключенной.';
      return false;
    }
    if(choice==='granted')startAnalytics();else stopAnalytics();
    closeBanner();
    document.dispatchEvent(new CustomEvent('pifagor:analytics-consent',{detail:{choice:choice,version:VERSION,local_preview:LOCAL_PREVIEW}}));
    return true;
  }

  function openBanner(){
    if(banner){banner.querySelector('[data-choice="denied"]').focus();return;}
    banner=document.createElement('section');
    banner.id='pifagor-cookie';
    banner.setAttribute('role','region');
    banner.setAttribute('aria-labelledby','pifagor-cookie-title');
    banner.innerHTML='<h2 id="pifagor-cookie-title">Аналитика сайта</h2><p>Разрешить Яндекс.Метрике собирать статистику посещений, кликов и прокруток, а также записывать сеансы Вебвизором? До вашего выбора аналитика выключена. Отказ не мешает пользоваться сайтом.</p><p>Выбор можно изменить через «Настройки аналитики». <a href="privacy.html#analytics">Подробнее в политике</a>.</p><p class="consent-status" data-consent-status aria-live="polite"></p><div class="consent-actions"><button type="button" data-choice="denied">Отказаться</button><button type="button" data-choice="granted">Разрешить аналитику</button></div>';
    banner.querySelectorAll('[data-choice]').forEach(function(button){button.addEventListener('click',function(){choose(button.dataset.choice);});});
    document.body.appendChild(banner);
  }

  function mount(){
    var style=document.createElement('style');style.id='pifagor-consent-styles';
    style.textContent='#pifagor-cookie{position:fixed;left:18px;bottom:18px;z-index:999;box-sizing:border-box;width:400px;max-width:calc(100vw - 36px);max-height:calc(100dvh - 36px);overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:14px;background:rgba(8,9,14,.98);backdrop-filter:blur(14px);border:1px solid rgba(46,232,200,.24);font:13px/1.55 Inter,Arial,sans-serif;color:#c7cde3;box-shadow:0 14px 44px rgba(0,0,0,.55)}#pifagor-cookie h2{font:700 17px/1.3 Inter,Arial,sans-serif;color:#e9ecf7;letter-spacing:normal}#pifagor-cookie p{margin:0;font:inherit;color:inherit}#pifagor-cookie a{color:#2ee8c8;text-decoration:underline}#pifagor-cookie .consent-status:empty{display:none}#pifagor-cookie .consent-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}#pifagor-cookie button{min-height:44px;padding:9px 12px;border:1px solid rgba(46,232,200,.4);border-radius:9px;background:#101425;color:#e9ecf7;font:600 12px/1.3 Inter,Arial,sans-serif;cursor:pointer}#pifagor-cookie button[data-choice="granted"]{background:#2ee8c8;color:#05121a}#pifagor-cookie button:focus-visible,[data-analytics-open]:focus-visible{outline:3px solid #2ee8c8;outline-offset:3px}@media(max-width:560px){#pifagor-cookie{left:10px;right:10px;bottom:12px;width:auto;max-width:none;max-height:calc(100dvh - 24px);padding:14px}}';
    document.head.appendChild(style);
    settings=document.querySelector('[data-analytics-open]');
    if(settings)settings.addEventListener('click',openBanner);
    updateLabel();
    var state=readState();
    if(state&&state.choice==='granted')startAnalytics();
    if(!state)openBanner();
  }

  window.PifagorAnalyticsConsent={counterId:COUNTER_ID,mode:LOCAL_PREVIEW?'local_preview':'production',state:readState,choose:choose,open:openBanner};
  window.addEventListener('storage',function(event){
    if(event.key!==STORAGE_KEY)return;
    var state=readState();
    if(state&&state.choice==='granted')startAnalytics();else stopAnalytics();
    updateLabel();
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
