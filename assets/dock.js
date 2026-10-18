/* Floating dock + jump-to palette. Shared by the homepage and every subpage. */
(function(){
var d=document,de=d.documentElement,home=location.pathname==='/'||location.pathname==='/index.html';
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(id){return home?'#'+id:'/#'+id}

/* the same six items as the header menu */
var NAV=[['approach','Approach',h('approach')],['projects','Projects','/projects/'],['blog','Writing','/blog/'],
  ['recommendations','Recommendations',h('recommendations')],['career','Career',h('career')],['contact','Contact','#contact']];

var JUMP=[
 ['Sections',[['Approach','Three rules I don\'t break',h('approach')],['Case studies','Short versions on the homepage',h('work')],['By the numbers','FTE, money and hours',h('numbers')],['Recommendations','15, word for word',h('recommendations')],['Career','Edvoy and S&P Global',h('career')],['Chess','Solve a mate in 2 from my games',h('chess')],['Contact','Email and LinkedIn','#contact']]],
 ['Projects',[['All projects','RPA and data automation portfolio','/projects/'],['Config-driven RPA','70+ portals · 94% success','/projects/config-driven-rpa/'],['Token sort matching','Website ↔ database reconciliation','/projects/token-sort-matching/'],['Markdown Extractor','Agent-written scrapers','/projects/markdown-extractor/'],['Subject Validator','AI drafts, a person signs off','/projects/subject-validator/'],['Fees Validator','Check once, apply everywhere','/projects/fees-validator/'],['S&P Global automation','168 FTE · 3.4M+ websites','/projects/sp-global-automation/']]],
 ['Writing',[['All writing','Notes from automation in production','/blog/'],['Config-driven RPA with Playwright','Why I stopped writing one bot per website','/blog/config-driven-rpa-playwright/'],['RPA success rate','94% vs ~90%, same jobs','/blog/rpa-success-rate/'],['Token sort matching, explained','When you don\'t need a threshold','/blog/token-sort-matching/'],['Playwright vs Blue Prism and UiPath','When code-first RPA wins','/blog/playwright-vs-rpa-platforms/'],['Human-in-the-loop RPA','OTPs, CAPTCHAs and uploads','/blog/human-in-the-loop-rpa/'],['LLM data validation','What the AI may do alone','/blog/llm-data-validation/']]],
 ['Elsewhere',[['LinkedIn','linkedin.com/in/gibinm','https://www.linkedin.com/in/gibinm'],['Email','gibin.mat96@gmail.com','mailto:gibin.mat96@gmail.com']]]];

var ICON={search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/></svg>'};
var mac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent);

/* ---------- dock ---------- */
var dock=d.createElement('nav');dock.className='dock';dock.setAttribute('aria-label','Quick navigation');
dock.innerHTML='<a class="dock-mark" href="/" aria-label="Home">GM<span>.</span></a>'+
 '<div class="dock-links"><span class="dock-pill" aria-hidden="true"></span>'+NAV.map(function(n){return '<a href="'+n[2]+'" data-k="'+n[0]+'">'+n[1]+'</a>'}).join('')+'</div>'+
 '<span class="dock-now" aria-live="polite"></span><span class="dock-sep" aria-hidden="true"></span>'+
 '<button class="dock-btn" type="button" data-jump aria-label="Jump to a page or section">'+ICON.search+'<span class="lbl">Jump to</span><kbd>'+(mac?'⌘K':'Ctrl K')+'</kbd></button>'+
 '<button class="dock-btn icon" type="button" data-theme aria-label="Switch theme">'+ICON.sun+'</button>';
d.body.appendChild(dock);
var links=[].slice.call(dock.querySelectorAll('.dock-links a')),pill=dock.querySelector('.dock-pill'),now=dock.querySelector('.dock-now');
var cord=d.getElementById('cord');
dock.querySelector('[data-theme]').addEventListener('click',function(){if(cord)cord.click()});
if(!cord)dock.querySelector('[data-theme]').remove();

var curK='',curL='';
function setActive(k,label){
  curK=k;curL=label;
  links.forEach(function(a){a.classList.toggle('on',a.getAttribute('data-k')===k)});
  var a=links.filter(function(x){return x.classList.contains('on')})[0];
  if(a){pill.style.left=a.offsetLeft+'px';pill.style.width=a.offsetWidth+'px';pill.classList.add('on')}else pill.classList.remove('on');
  now.innerHTML='<i>gibin.in /</i> '+(label||(a?a.textContent:(home?'Home':d.title.split('|')[0].trim())));
}
var path=location.pathname;
var pageKey=/^\/projects\//.test(path)?'projects':/^\/blog\//.test(path)?'blog':'';
var pageLabel=pageKey?(d.querySelector('.crumbs li:last-child')||{}).textContent:'';
setActive(pageKey,pageLabel);

/* show once the big header is out of view; keep a reading-progress edge */
var band=d.querySelector('header.band');
function onScroll(){
  var lim=band?band.offsetHeight-80:300;
  var show=scrollY>lim;if(show&&!dock.classList.contains('show'))setTimeout(function(){setActive(curK,curL)},0);dock.classList.toggle('show',show);
  var hgt=de.scrollHeight-innerHeight;dock.style.setProperty('--p',hgt>0?Math.min(1,scrollY/hgt).toFixed(4):0);
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){onScroll();setActive(curK,curL)});onScroll();

/* homepage: follow the section in view */
if(home&&'IntersectionObserver' in window){
  var map={approach:'approach',work:'',numbers:'',recommendations:'recommendations',writing:'blog',career:'career',chess:'',contact:'contact'};
  var names={work:'Case studies',numbers:'By the numbers',writing:'Writing',chess:'Chess'};
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var id=e.target.id;setActive(map[id],names[id])}})},{rootMargin:'-45% 0px -50% 0px'});
  Object.keys(map).forEach(function(id){var el=d.getElementById(id);if(el)io.observe(el)});
}else if('IntersectionObserver' in window){
  var c=d.getElementById('contact');
  if(c)new IntersectionObserver(function(es){es.forEach(function(e){setActive(e.isIntersecting?'contact':pageKey,e.isIntersecting?'Contact':pageLabel)})},{rootMargin:'-40% 0px -40% 0px'}).observe(c);
}

/* ---------- jump-to palette ---------- */
var jp=d.createElement('div');jp.className='jump';jp.setAttribute('role','dialog');jp.setAttribute('aria-modal','true');jp.setAttribute('aria-label','Jump to');
jp.innerHTML='<div class="jump-box"><div class="jump-in">'+ICON.search+'<input type="text" placeholder="Jump to a project, post or section…" aria-label="Search pages" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div><ul class="jump-list" role="listbox"></ul><div class="jump-foot"><span><kbd>↑</kbd><kbd>↓</kbd>move</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div></div>';
d.body.appendChild(jp);
var inp=jp.querySelector('input'),list=jp.querySelector('.jump-list'),sel=0,items=[],last=null;
function render(q){
  q=(q||'').toLowerCase().trim();var html='';items=[];
  JUMP.forEach(function(g){
    var rows=g[1].filter(function(r){return !q||(r[0]+' '+r[1]+' '+g[0]).toLowerCase().indexOf(q)>-1});
    if(!rows.length)return;html+='<li class="jump-g">'+g[0]+'</li>';
    rows.forEach(function(r){var i=items.length;items.push(r);
      html+='<li><a href="'+r[2]+'" data-i="'+i+'"'+(/^https?:/.test(r[2])?' target="_blank" rel="noopener"':'')+'><span class="ji">'+r[0].charAt(0)+'</span><span>'+r[0]+'</span><small>'+r[1]+'</small></a></li>'});
  });
  list.innerHTML=html||'<li class="jump-empty">Nothing matches. Try "RPA", "token" or "Playwright".</li>';
  sel=0;mark();
}
function mark(){var as=list.querySelectorAll('a');[].forEach.call(as,function(a,i){a.classList.toggle('sel',i===sel)});if(as[sel])as[sel].scrollIntoView({block:'nearest'})}
function open(){last=d.activeElement;render('');inp.value='';jp.classList.add('open');setTimeout(function(){inp.focus()},10);de.style.overflow='hidden'}
function close(){jp.classList.remove('open');de.style.overflow='';if(last&&last.focus)last.focus()}
inp.addEventListener('input',function(){render(inp.value)});
jp.addEventListener('click',function(e){if(e.target===jp)close();var a=e.target.closest&&e.target.closest('a');if(a)setTimeout(close,0)});
jp.addEventListener('keydown',function(e){
  var n=list.querySelectorAll('a').length;
  if(e.key==='Escape'){e.preventDefault();close()}
  else if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%Math.max(n,1);mark()}
  else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+n)%Math.max(n,1);mark()}
  else if(e.key==='Enter'){var a=list.querySelectorAll('a')[sel];if(a){e.preventDefault();a.click()}}
  else if(e.key==='Tab'){e.preventDefault();inp.focus()}
});
dock.querySelector('[data-jump]').addEventListener('click',open);
d.addEventListener('keydown',function(e){
  var t=e.target,typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);
  if((e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey)){e.preventDefault();jp.classList.contains('open')?close():open()}
  else if(e.key==='/'&&!typing&&!jp.classList.contains('open')){e.preventDefault();open()}
});

/* ---------- phone tab bar ---------- */
var TI={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/></svg>',
  work:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  blog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>'};
var tabs=d.createElement('nav');tabs.className='tabs';tabs.setAttribute('aria-label','Site');
function tab(k,href,lbl,ic){return '<a href="'+href+'" data-t="'+k+'"><span class="ti">'+ic+'</span>'+lbl+'</a>'}
tabs.innerHTML=tab('home','/','Home',TI.home)+tab('projects','/projects/','Projects',TI.work)+tab('blog','/blog/','Writing',TI.blog)+
  '<button type="button" data-t="jump" aria-label="Search pages and sections"><span class="ti">'+ICON.search+'</span>Search</button>'+
  (cord?'<button type="button" data-t="theme" aria-label="Switch theme"><span class="ti">'+ICON.sun+'</span>Theme</button>':'<a href="#contact" data-t="contact"><span class="ti">@</span>Contact</a>');
d.body.appendChild(tabs);
var tabEls=[].slice.call(tabs.querySelectorAll('[data-t]'));
function tabOn(k){tabEls.forEach(function(t){var on=t.getAttribute('data-t')===k;t.classList.toggle('on',on);if(t.tagName==='A'){on?t.setAttribute('aria-current','page'):t.removeAttribute('aria-current')}})}
tabOn(pageKey||'home');
var _set=setActive;setActive=function(k,l){_set(k,l);tabOn(k==='blog'||k==='projects'?k:(pageKey||'home'))};
tabs.querySelector('[data-t="jump"]').addEventListener('click',open);
var tb=tabs.querySelector('[data-t="theme"]');if(tb)tb.addEventListener('click',function(){cord.click()});
if(home){var hm=tabs.querySelector('[data-t="home"]');hm.addEventListener('click',function(e){e.preventDefault();scrollTo({top:0,behavior:reduce?'auto':'smooth'})})}
/* tuck away while reading down, return on any scroll up, near the top and at the very end */
var lastY=scrollY,acc=0;
addEventListener('scroll',function(){
  var y=scrollY,dy=y-lastY;lastY=y;
  if((dy>0)!==(acc>0))acc=0;acc+=dy;
  var end=y+innerHeight>=de.scrollHeight-40;
  if(y<120||end||acc<-12)tabs.classList.remove('tuck');
  else if(acc>24&&!jp.classList.contains('open'))tabs.classList.add('tuck');
},{passive:true});
/* the header menu gets the same shortcut button, so it's discoverable before scrolling */
var tn=d.querySelector('.topbar .topnav');
if(tn){var b=d.createElement('a');b.href='#';b.setAttribute('role','button');b.setAttribute('aria-label','Jump to a page or section');b.textContent=mac?'⌘K':'Ctrl K';b.className='topnav-k';
  b.addEventListener('click',function(e){e.preventDefault();open()});tn.appendChild(b)}
})();
