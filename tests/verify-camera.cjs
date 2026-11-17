// No dependencies. Run: node tests/verify-camera.cjs
// Tests the ACTUAL website script with an instrumented lightweight DOM.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert/strict');
const path=require('path');
const base=path.resolve(__dirname,'..');
const contentSrc=fs.readFileSync(path.join(base,'content.js'),'utf8');
const siteSrc=fs.readFileSync(path.join(base,'script.js'),'utf8');

function mockSite({width=1360,height=768,reduceMotion=false}={}){
  const styleObj=()=>({props:{},setProperty(k,v){this.props[k]=String(v)}, getPropertyValue(k){return this.props[k]??''}});
  const el=(extra={})=>Object.assign({style:styleObj(),textContent:'',innerHTML:'',hidden:false,children:[],
    scrollHeight:600,clientHeight:300,scrollTop:0,offsetTop:0,offsetHeight:0,attributes:{},
    setAttribute(k,v){this.attributes[k]=v},addEventListener(){},appendChild(){},
    contains(){return false}, querySelector(){return el()},closest(){return null},
    classList:{add(){},remove(){},toggle(){}},},extra);
  const documentElements=new Map();
  for(const name of ['#chapters','#menu-items','#references-list','#chapter-menu','#contents-button',
      '#map-pin','#map-camera','#header-progress','#header-index','#close-menu','#references',
      '#references-count']) documentElements.set(name,el());
  const containerTop=height*1.4, sectionHeight=height*5;
  const sections=Array.from({length:12},(_,i)=>el({offsetTop:containerTop+i*sectionHeight,offsetHeight:sectionHeight}));
  const refTop=containerTop+12*sectionHeight;
  documentElements.get('#references').offsetTop=refTop;
  const listeners={scroll:[],load:[],resize:[]};
  const frames=[];
  const window={PORTFOLIO_DATA:null,innerWidth:width,innerHeight:height,scrollY:0,
    location:{search:'',hash:''},matchMedia(){return {matches:reduceMotion}},
    addEventListener(name,callback){(listeners[name]??=[]).push(callback)}};
  const document={documentElement:{scrollHeight:refTop+2000},body:el(),
    querySelector(s){const found=documentElements.get(s);if(!found)throw new Error('Not mocked '+s);return found},
    querySelectorAll(s){if(s==='section.chapter')return sections;if(s==='.menu-item')return sections.map(()=>el());return []},
    createElement(){return el()},addEventListener(){}};
  let time=16;
  const context={window,document,URLSearchParams,console,requestAnimationFrame(callback){frames.push(callback)},
     setTimeout(){throw new Error('unexpected timer')}};
  vm.createContext(context);
  vm.runInContext(contentSrc,context,{filename:'content.js'});
  vm.runInContext(siteSrc,context,{filename:'script.js'});
  const flush=()=>{let count=0;while(frames.length){if(++count>100)throw new Error('camera animation did not settle');const batch=frames.splice(0);time+=16;batch.forEach(cb=>cb(time));}};
  flush();
  function go(chapter,progress){
    window.scrollY=sections[chapter-1].offsetTop+(sectionHeight-height)*progress;
    listeners.scroll.forEach(cb=>cb());
    flush();
    const props=documentElements.get('#map-camera').style.props;
    return {z:Number(props['--cam-zoom']),x:parseFloat(props['--cam-x']),y:parseFloat(props['--cam-y'])};
  }
  return {go,window,document,content:window.PORTFOLIO_DATA};
}
function almost(a,b,e=.02){assert.ok(Math.abs(a-b)<=e,`expected ${a} ≈ ${b} (within ${e})`)}
for(const reduceMotion of [false,true]){
  const t=mockSite({reduceMotion});
  for(const chapter of Array.from({length:12},(_,i)=>i+1)){
    const c=t.content.chapters[chapter-1];
    const samples=[0,.06,.13,.2,.27,.35,.55,.72,.78,.84,.92,.98,1].map(p=>({p,...t.go(chapter,p)}));
    almost(samples[0].z,1);
    assert.ok(samples[1].z>1.001,'first part of zoom must be gradual');
    for(let i=2;i<=5;i++)assert.ok(samples[i].z>=samples[i-1].z-.001,`zoom increases approaching ${c.location}`);
    almost(samples[5].z,c.zoom);
    almost(samples[6].z,c.zoom);
    for(let i=7;i<samples.length-1;i++)assert.ok(samples[i].z<=samples[i-1].z+.001,`zoom decreases leaving ${c.location}`);
    almost(samples.at(-1).z,1);
    const full=t.go(chapter,.5);
    const nx=(c.lon+180)/360,ny=(90-c.lat)/180;
    // The geographic point chosen by the content file MUST land dead center.
    almost((nx-.5)*1360*full.z+full.x,0,.15);
    almost((ny-.5)*1360*.5*full.z+full.y,0,.15);
    console.log(`${reduceMotion?'reduced':'normal '} ${String(chapter).padStart(2,'0')} ${c.location.padEnd(17)} `+
      samples.map(v=>`${v.z.toFixed(2)}x`).join('  '));
  }
}
// Validate a narrow mobile viewport separately (including the dateline chapter).
const mobile=mockSite({width:390,height:844});
for(const chapter of [1,6,9,11]) {
  const c=mobile.content.chapters[chapter-1];
  const at=mobile.go(chapter,.51);
  almost(at.z,Math.max(c.zoom,844*2/390*1.06));
  const nx=(c.lon+180)/360,ny=(90-c.lat)/180;
  almost((nx-.5)*390*at.z+at.x,0,.15);
  almost((ny-.5)*390*.5*at.z+at.y,0,.15);
  almost(mobile.go(chapter,1).z,1);
}
console.log('PASS: smooth zoom, focus, 12 chapters × 2 motion settings + 4 mobile checks.');
