/* Scroll-driven map storytelling, no dependencies or external APIs. */
(() => {
  'use strict';
  const content = window.PORTFOLIO_DATA;
  if (!content || !content.chapters) return;
  const $ = (s, p=document) => p.querySelector(s);
  const clamp = (v,a=0,b=1) => Math.min(b, Math.max(a,v));
  const fade = (a,b,v) => { let t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
  const mix = (a,b,t) => a+(b-a)*t;
  const number = n => String(n).padStart(2,'0');
  const h = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const formatReference = s => h(s).replace(/https?:\/\/[^\s<>]+/g, url => {
    const trailing=(url.match(/[.,;]+$/)||[''])[0];
    const cleaned=url.slice(0,url.length-trailing.length);
    return `<a href="${cleaned}" target="_blank" rel="noopener noreferrer">${cleaned}</a>${trailing}`;
  });
  const title = $('#chapters');
  const menuItems = $('#menu-items');
  const list = $('#references-list');
  const nav = $('#chapter-menu');
  const navButton = $('#contents-button');
  const marker = $('#map-pin');
  const camera = $('#map-camera');
  const progressBar = $('#header-progress');
  const headerIndex = $('#header-index');
  // The map is explicitly a scroll-controlled storytelling element: even when
  // OS/browser reduced-motion is enabled, NEVER switch between just 1x and 10x.
  // Those hard jumps were a source of the abrupt zoom behavior in v5.
  // Users sensitive to camera movement can opt for a fixed map with ?staticMap=1.
  const staticMap = new URLSearchParams(window.location.search).get('staticMap') === '1';

  const renderChapter = (c) => {
    const isConclusion = !c.quote;
    const long = c.bullets.join(' ').length > 700;
    const qHtml = isConclusion ? '' : `<aside class="quote-panel" aria-label="Quotation"><blockquote>“${h(c.quote)}”</blockquote><cite class="quote-attribution">— ${h(c.attribution)}</cite></aside>`;
    const reflectionHtml = isConclusion ? `<p class="conclusion-text">${h(c.bullets.join(' '))}</p>` : `<ul>${c.bullets.map(text=>`<li>${h(text)}</li>`).join('')}</ul>`;
    return `<section id="chapter-${number(c.index)}" class="chapter ${isConclusion?'conclusion':''} ${long?'long-chapter':''}" data-chapter="${c.index}" aria-labelledby="heading-${number(c.index)}">
      <div class="chapter-sticky">
        <div class="chapter-location" aria-hidden="true">${h(c.location)}</div>
        <div class="chapter-heading"><h2 id="heading-${number(c.index)}">${h(c.title)}</h2></div>
        ${qHtml}
        <article class="reflection-panel" aria-label="${isConclusion?'Conclusion':'Portfolio reflections'}"><span class="detail-kicker">${isConclusion?'CLOSING REFLECTION':'REFLECTIONS &amp; LEARNING'}</span>${reflectionHtml}</article>
      </div>
    </section>`;
  };
  title.innerHTML=content.chapters.map(renderChapter).join('');
  menuItems.innerHTML=content.chapters.map(c=>`<a class="menu-item" href="#chapter-${number(c.index)}"><span class="n">${number(c.index)}</span><span class="t"><small>${h(c.location)}</small>${h(c.title)}</span></a>`).join('');
  list.innerHTML=content.references.map(ref=>`<li>${formatReference(ref)}</li>`).join('');
  $('#references-count').textContent=`${number(content.references.length)} SOURCES`;
  const sections=Array.from(document.querySelectorAll('section.chapter'));
  const menuLinks=Array.from(document.querySelectorAll('.menu-item'));
  const root=document.documentElement;
  const isMobile=()=>window.innerWidth<=700;

  function closeMenu() {nav.hidden=true;navButton.setAttribute('aria-expanded','false');}
  function openMenu() {nav.hidden=false;navButton.setAttribute('aria-expanded','true');}
  navButton.addEventListener('click',()=>nav.hidden?openMenu():closeMenu());
  $('#close-menu').addEventListener('click',closeMenu);
  nav.addEventListener('click', e => {if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(!nav.hidden && !nav.contains(e.target) && !navButton.contains(e.target))closeMenu();});

  let requested=false;
  let lastIndex=-2;
  let scrollPositions=[];
  let height=window.innerHeight;
  let width=window.innerWidth;
  const updatePositions=()=>{
    height=window.innerHeight;width=window.innerWidth;
    scrollPositions=sections.map(s=>({start:s.offsetTop,end:s.offsetTop+s.offsetHeight,range:Math.max(1,s.offsetHeight-height)}));
    schedule();
  };
  // The camera always has a continuously varying, reversible scroll target.
  // CSS transitions must NOT chase each wheel event: that made the camera lag
  // and then seem to snap into place when scrolling stopped.
  const cameraCurrent = {x:0,y:0,logZoom:0};
  const cameraTarget = {x:0,y:0,logZoom:0};
  let cameraFrameRequested=false;
  let cameraFrameTime=0;
  const debugZoom = new URLSearchParams(window.location.search).has('debugZoom');
  const debugElement = debugZoom ? document.createElement('output') : null;
  if (debugElement) {
    debugElement.className='camera-debug';
    debugElement.setAttribute('aria-label','Map animation diagnostics');
    document.body.appendChild(debugElement);
  }
  function drawCamera() {
    const z=Math.exp(cameraCurrent.logZoom);
    camera.style.setProperty('--cam-x',`${cameraCurrent.x.toFixed(3)}px`);
    camera.style.setProperty('--cam-y',`${cameraCurrent.y.toFixed(3)}px`);
    camera.style.setProperty('--cam-zoom',z.toFixed(6));
    camera.style.setProperty('--pin-inverse',(1/z).toFixed(6));
    if(debugElement)debugElement.textContent=`Map zoom ${z.toFixed(2)}×`;
  }
  function animateCamera(time) {
    cameraFrameRequested=false;
    const dt=cameraFrameTime?Math.min((time-cameraFrameTime)/1000,.06):.016;
    cameraFrameTime=time;
    // Ease actual wheel/touchpad increments without relying on CSS transitions.
    // An exponential decay has frame-rate-independent response (~130ms).
    const blend=1-Math.exp(-dt*17);
    for(const k of ['x','y','logZoom']) {
      const next=cameraCurrent[k]+(cameraTarget[k]-cameraCurrent[k])*blend;
      cameraCurrent[k]=Math.abs(cameraTarget[k]-next)<(k==='logZoom'?.00003:.04)?cameraTarget[k]:next;
    }
    drawCamera();
    const remaining=Math.max(
      Math.abs(cameraTarget.x-cameraCurrent.x),
      Math.abs(cameraTarget.y-cameraCurrent.y),
      Math.abs(cameraTarget.logZoom-cameraCurrent.logZoom)*1000
    );
    if(remaining>.01){cameraFrameRequested=true;requestAnimationFrame(animateCamera)}
    else cameraFrameTime=0;
  }
  function setCameraTarget(x,y,z) {
    cameraTarget.x=x;
    cameraTarget.y=y;
    cameraTarget.logZoom=Math.log(z);
    if(!cameraFrameRequested){cameraFrameRequested=true;requestAnimationFrame(animateCamera)}
  }
  function setCamera(c,focus) {
    if(staticMap){setWorld();return;}
    const nx=(c.lon+180)/360, ny=(90-c.lat)/180;
    const zoomTarget=isMobile()?Math.max(c.zoom,(height*2/width)*1.06):c.zoom;
    // Equal distances through log zoom = equal perceived zoom speed.
    const zoom=Math.exp(Math.log(zoomTarget)*focus);
    // The equirectangular source covers 360×180 degrees. When focus==1 the
    // actual geographic point must sit at the center of the viewport.
    // When focus==0 the entire world must have its original center/scale.
    const travel=zoom-(1-focus);
    const tx=(.5-nx)*width*travel;
    const ty=(.5-ny)*width*.5*travel;
    setCameraTarget(tx,ty,zoom);
    marker.style.left=`${(nx*100).toFixed(5)}%`;
    marker.style.top=`${(ny*100).toFixed(5)}%`;
    marker.style.opacity=String(fade(.12,.34,focus)*.98);
  }
  function setWorld(){setCameraTarget(0,0,1);marker.style.opacity='0';}
  function styleChapter(el,p,c){
    const s=el.style;
    const heading=fade(.12,.23,p)*(1-fade(.89,.98,p));
    const quote=fade(.30,.40,p)*(1-fade(.88,.97,p));
    const details=fade(.56,.68,p)*(1-fade(.88,.97,p));
    const collapse=fade(.49,.64,p);
    s.setProperty('--heading-opacity',heading.toFixed(3));
    s.setProperty('--heading-offset',`${mix(20,0,fade(.12,.23,p)).toFixed(2)}px`);
    s.setProperty('--heading-vh',`${mix(12,5,fade(.51,.67,p)).toFixed(3)}vh`);
    s.setProperty('--quote-opacity',quote.toFixed(3));
    s.setProperty('--detail-opacity',details.toFixed(3));
    s.setProperty('--detail-shift',`${mix(25,0,fade(.60,.72,p)).toFixed(2)}px`);
    s.setProperty('--location-opacity',(fade(.12,.24,p)*(1-fade(.92,.99,p))).toFixed(3));
    s.setProperty('--location-left',`${mix(78,16,collapse).toFixed(3)}%`);
    s.setProperty('--location-left-mobile',`${mix(50,50,collapse).toFixed(3)}%`);
    const wideQuote = c.quote && c.quote.length > 290 ? .88 : c.quote && c.quote.length>240 ? .94 : 1;
    const fontLarge=Math.min(38,Math.max(23,width*.025))*wideQuote;
    const fontSmall=Math.min(25,Math.max(16,width*.014))*wideQuote;
    const fontMobileLarge=Math.min(23,Math.max(17,width*.049))*(c.quote && c.quote.length>310?.89:1);
    const fontMobileSmall=Math.min(19,Math.max(14,width*.040))*(c.quote && c.quote.length>310?.94:1);
    s.setProperty('--quote-width',`${mix(77,39,collapse).toFixed(3)}%`);
    s.setProperty('--quote-left',`${mix(50,25,collapse).toFixed(3)}%`);
    s.setProperty('--quote-top',`${mix(57,56,collapse).toFixed(3)}%`);
    s.setProperty('--quote-size',`${mix(fontLarge,fontSmall,collapse).toFixed(2)}px`);
    s.setProperty('--quote-width-mobile',`${mix(90,90,collapse).toFixed(3)}%`);
    s.setProperty('--quote-left-mobile','50%');
    s.setProperty('--quote-top-mobile',`${mix(56,41,collapse).toFixed(3)}%`);
    s.setProperty('--quote-size-mobile',`${mix(fontMobileLarge,fontMobileSmall,collapse).toFixed(2)}px`);
    s.setProperty('--detail-top-mobile','58%');
    s.setProperty('--detail-max-mobile','37vh');
    s.setProperty('--conclusion-shift',`${mix(22,0,fade(.32,.55,p)).toFixed(2)}px`);
    if(isMobile() && c.quote){
      const pane=el.querySelector('.reflection-panel');
      const maxScroll=Math.max(0,pane.scrollHeight-pane.clientHeight);
      pane.scrollTop=maxScroll*fade(.74,.87,p);
    }
    if(!c.quote){
      s.setProperty('--detail-opacity',(fade(.22,.42,p)*(1-fade(.85,.97,p))).toFixed(3));
    }
  }
  function frame(){
    requested=false;
    const scroll=window.scrollY;
    const docScroll=Math.max(1,document.documentElement.scrollHeight-height);
    progressBar.style.transform=`scaleX(${clamp(scroll/docScroll).toFixed(5)})`;
    const references=$('#references');
    if(scroll+height*.34>=references.offsetTop){
      setWorld();headerIndex.innerHTML='REFERENCES';
      if(lastIndex!==-3){menuLinks.forEach(e=>e.classList.remove('active'));lastIndex=-3;}
      return;
    }
    let idx=-1;
    for(let i=0;i<scrollPositions.length;i++){
      if(scroll>=scrollPositions[i].start && scroll<scrollPositions[i].end){idx=i;break;}
    }
    if(idx===-1){
      setWorld();headerIndex.innerHTML='GLOBAL VIEW <span class="header-divider">/</span> 12 CHAPTERS';
      if(lastIndex!==-1){menuLinks.forEach(e=>e.classList.remove('active'));lastIndex=-1;}
      return;
    }
    const position=scrollPositions[idx];
    const p=clamp((scroll-position.start)/position.range);
    const chapter=content.chapters[idx];
    // Scroll-position-based, reversible camera movement. Zoom in over roughly
    // 1.1–1.5 viewport heights; zoom back out over another viewport or more.
    // No autoplay, jumps, or setTimeout animation during chapter transitions.
    // Travel in as the first ~third of a chapter scrolls, hold the camera
    // steady through the quotation/reflections, then return to the world.
    // This is smooth at ALL operating-system motion settings; no 0/1 snap.
    const focus=fade(.01,.35,p)*(1-fade(.72,.98,p));
    setCamera(chapter,focus);
    styleChapter(sections[idx],p,chapter);
    headerIndex.innerHTML=`${number(idx+1)} <span class="header-divider">/</span> ${number(content.chapters.length)} &nbsp; ${h(chapter.location.toUpperCase())}`;
    if(lastIndex!==idx){menuLinks.forEach((e,i)=>e.classList.toggle('active',i===idx));lastIndex=idx;}
  }
  function schedule(){if(!requested){requested=true;requestAnimationFrame(frame);}}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',updatePositions,{passive:true});
  window.addEventListener('load',updatePositions);
  updatePositions();
  if(window.location.hash){setTimeout(updatePositions,100)}
})();
