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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderChapter = (c) => {
    const isConclusion = !c.quote;
    const long = c.bullets.join(' ').length > 700;
    const qHtml = isConclusion ? '' : `<aside class="quote-panel" aria-label="Quotation"><div class="quote-label">A VOICE FROM THE READING</div><blockquote>“${h(c.quote)}”</blockquote><cite class="quote-attribution">— ${h(c.attribution)}</cite></aside>`;
    const reflectionHtml = isConclusion ? `<p class="conclusion-text">${h(c.bullets.join(' '))}</p>` : `<ul>${c.bullets.map(text=>`<li>${h(text)}</li>`).join('')}</ul>`;
    const formattedCoord = `${Math.abs(c.lat).toFixed(1)}°${c.lat>=0?'N':'S'} · ${Math.abs(c.lon).toFixed(1)}°${c.lon>=0?'E':'W'}`;
    return `<section id="chapter-${number(c.index)}" class="chapter ${isConclusion?'conclusion':''} ${long?'long-chapter':''}" data-chapter="${c.index}" aria-labelledby="heading-${number(c.index)}">
      <div class="chapter-sticky">
        <div class="chapter-location" aria-hidden="true">${h(c.location)}<span class="location-coordinates">${h(c.anchor)} · ${formattedCoord}</span></div>
        <div class="chapter-arrival" aria-hidden="true"><span class="arrival-eyebrow">GEOGRAPHIC FOCUS</span><span class="arrival-name">${h(c.anchor)}</span><span class="arrival-coordinates">${formattedCoord}</span></div>
        <div class="chapter-heading"><span class="chapter-count">${number(c.index)} / ${number(content.chapters.length)}</span><h2 id="heading-${number(c.index)}">${h(c.title)}</h2></div>
        ${qHtml}
        <article class="reflection-panel" aria-label="${isConclusion?'Conclusion':'Portfolio reflections'}"><span class="detail-kicker">${isConclusion?'CLOSING REFLECTION':'REFLECTIONS &amp; LEARNING'}</span>${reflectionHtml}</article>
        <div class="chapter-grounding" aria-hidden="true"><span class="grounding-line"></span>${h(c.region.toUpperCase())}</div>
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
  function setCamera(c,focus) {
    const nx=(c.lon+180)/360, ny=(90-c.lat)/180;
    const zoomTarget=isMobile()?Math.max(c.zoom,(height*2/width)*1.06):c.zoom;
    const zoom=mix(1,zoomTarget,focus);
    // The source is equirectangular: x=(lon+180)/360, y=(90-lat)/180.
    // Move the selected point toward the center THROUGHOUT the zoom.
    // Interpolating the camera centre linearly while scaling made remote
    // destinations fly *away* from the viewport before snapping back.
    // At focus=0: original world view. At focus=1: point is exactly centred.
    const travel=zoom-(1-focus);
    const tx=(.5-nx)*width*travel;
    const ty=(.5-ny)*width*.5*travel;
    camera.style.setProperty('--cam-x',`${tx}px`);
    camera.style.setProperty('--cam-y',`${ty}px`);
    camera.style.setProperty('--cam-zoom',zoom.toFixed(5));
    camera.style.setProperty('--pin-inverse',(1/zoom).toFixed(5));
    marker.style.left=`${(nx*100).toFixed(5)}%`;
    marker.style.top=`${(ny*100).toFixed(5)}%`;
    marker.style.opacity=String(fade(.12,.34,focus)*.98);
  }
  function setWorld(){camera.style.setProperty('--cam-x','0px');camera.style.setProperty('--cam-y','0px');camera.style.setProperty('--cam-zoom','1');marker.style.opacity='0';}
  function styleChapter(el,p,c){
    const s=el.style;
    const heading=fade(.07,.17,p)*(1-fade(.87,.96,p));
    const quote=fade(.23,.35,p)*(1-fade(.88,.96,p));
    const details=fade(.58,.71,p)*(1-fade(.88,.96,p));
    const collapse=fade(.49,.67,p);
    // Keep the place name at the geographic target during the arrival phase,
    // then clear the map for the full-screen quotation.
    const arrival=fade(.11,.19,p)*(1-fade(.28,.35,p));
    s.setProperty('--arrival-opacity',arrival.toFixed(3));
    s.setProperty('--heading-opacity',heading.toFixed(3));
    s.setProperty('--heading-offset',`${mix(20,0,fade(.08,.17,p)).toFixed(2)}px`);
    s.setProperty('--heading-vh',`${mix(12,5,fade(.51,.67,p)).toFixed(3)}vh`);
    s.setProperty('--quote-opacity',quote.toFixed(3));
    s.setProperty('--detail-opacity',details.toFixed(3));
    s.setProperty('--detail-shift',`${mix(25,0,fade(.60,.72,p)).toFixed(2)}px`);
    s.setProperty('--location-opacity',(fade(.10,.20,p)*(1-fade(.91,.98,p))).toFixed(3));
    s.setProperty('--location-left',`${mix(78,16,collapse).toFixed(3)}%`);
    s.setProperty('--location-left-mobile',`${mix(50,50,collapse).toFixed(3)}%`);
    s.setProperty('--grounding-opacity',(fade(.18,.30,p)*(1-fade(.9,.98,p))).toFixed(3));
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
    const focus=prefersReducedMotion ? (p >= .18 && p <= .88 ? 1 : 0) : fade(.02,.23,p)*(1-fade(.86,.98,p));
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
