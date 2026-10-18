/* gibin.in subpages: theme cord, reading progress, contents highlight, and the figure animations.
   Every figure is readable without JavaScript; this file only animates it. */
(function(){
var de=document.documentElement;
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}

/* ---------- theme pull-cord (same behaviour as the homepage) ---------- */
(function(){
  var b=document.getElementById('cord');if(!b)return;var tip=document.getElementById('cord-tip');
  function now(){var t=de.getAttribute('data-theme');if(t)return t;return window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}
  var box=b.querySelector('.flies'),rnd=function(a,z){return a+Math.random()*(z-a)};
  function far(f){var a=rnd(0,6.283),d=rnd(140,260);f.style.setProperty('--fx',Math.cos(a)*d+'px');f.style.setProperty('--fy',Math.sin(a)*d+'px')}
  function summon(arrive){box.innerHTML='';if(reduce)return;var n=4+Math.round(Math.random());
    for(var k=0;k<n;k++){var f=document.createElement('span');f.className='fly'+(arrive?' in':'');f.innerHTML='<i></i>';
      f.style.setProperty('--r',rnd(13,27).toFixed(1)+'px');f.style.setProperty('--t',rnd(1.6,3.6).toFixed(2)+'s');f.style.setProperty('--b',rnd(.5,1.1).toFixed(2)+'s');
      f.style.setProperty('--dir',Math.random()<.5?'normal':'reverse');f.style.setProperty('--a',rnd(.9,2).toFixed(2)+'s');f.style.animationDelay='-'+rnd(0,3).toFixed(2)+'s';far(f);box.appendChild(f)}}
  function shoo(){[].forEach.call(box.children,function(f){far(f);f.classList.remove('in');f.classList.add('out')});setTimeout(function(){box.innerHTML=''},800)}
  function scene(arrive){var night=now()==='dark';b.classList.toggle('lit',night);if(night)summon(arrive);else if(box.children.length)shoo()}
  function label(){var n=now()==='dark'?'light':'dark';b.setAttribute('aria-label','Switch to '+n+' theme');tip.textContent=n==='light'?'pull for day':'pull for night'}
  label();scene(true);
  if(window.matchMedia)matchMedia('(prefers-color-scheme: light)').addEventListener('change',function(){if(!de.getAttribute('data-theme')){label();scene(true)}});
  b.addEventListener('click',function(){
    var next=now()==='dark'?'light':'dark';b.classList.remove('hint');b.classList.add('pull');setTimeout(function(){b.classList.remove('pull')},260);
    if(next==='light')shoo();
    function apply(){de.setAttribute('data-theme',next);try{localStorage.setItem('gm-theme',next)}catch(e){}label();if(next==='dark')setTimeout(function(){scene(true)},250);else b.classList.remove('lit')}
    if(document.startViewTransition&&!reduce){var r=b.querySelector('.ck').getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
      setTimeout(function(){var tr=document.startViewTransition(apply);tr.ready.then(function(){de.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+R+'px at '+x+'px '+y+'px)']},{duration:700,easing:'cubic-bezier(.6,0,.3,1)',pseudoElement:'::view-transition-new(root)'})}).catch(function(){})},180)}
    else apply()});
})();

/* ---------- reading progress, back to top, header glow ---------- */
(function(){
  var p=document.getElementById('progress'),t=document.getElementById('totop');
  function on(){var h=de.scrollHeight-innerHeight;var v=h>0?Math.min(1,scrollY/h):0;if(p)p.style.transform='scaleX('+v+')';if(t)t.classList.toggle('show',scrollY>900)}
  addEventListener('scroll',on,{passive:true});on();
  if(t)t.addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})});
  var band=$('.band');if(band&&!reduce)band.addEventListener('pointermove',function(e){var r=band.getBoundingClientRect();band.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');band.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%')});
})();

/* ---------- copy email ---------- */
(function(){var b=document.getElementById('copyBtn');if(!b)return;b.addEventListener('click',function(){var t=document.getElementById('email').textContent;
  function done(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1600)}
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});})})();

/* ---------- contents highlight ---------- */
(function(){
  var links=$$('.toc a[href^="#"]');if(!links.length||!('IntersectionObserver' in window))return;
  var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('on')});var a=map[e.target.id];if(a)a.classList.add('on')}})},{rootMargin:'0px 0px -70% 0px'});
  Object.keys(map).forEach(function(id){var h=document.getElementById(id);if(h)io.observe(h)});
})();

/* ---------- reveal on scroll ---------- */
(function(){
  var els=$$('.rv');if(!els.length)return;
  if(!('IntersectionObserver' in window)||reduce){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(e){io.observe(e)});
})();

/* ---------- figure player ----------
   A scene is a list of [delayMs, fn]. It loops while the figure is on screen and stops when it isn't. */
var scenes={};
function player(el,build){
  var timer=null,alive=false,run=0;
  function start(){if(alive)return;alive=true;var my=++run;var s=build(el);var i=0;
    function next(){if(!alive||my!==run)return;if(i>=s.length){s=build(el);i=0}var st=s[i++];timer=setTimeout(function(){try{st[1]()}catch(e){}next()},st[0])}
    next()}
  function stop(){alive=false;run++;clearTimeout(timer)}
  if(reduce){var s=build(el);s.forEach(function(st){try{st[1]()}catch(e){}});return}
  if(!('IntersectionObserver' in window)){start();return}
  new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?start():stop()})},{threshold:.25}).observe(el);
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop()});
}
function typeInto(node,text,ms){var steps=[];var n=Math.min(text.length,14);for(var k=1;k<=n;k++)(function(k){steps.push([ms||28,function(){node.textContent=text.slice(0,Math.ceil(text.length*k/n))}])})(k);return steps}

/* config-driven: one record, three portals */
scenes.config=function(el){
  var P=[
   {n:'Portal A',file:'portal-a.json',rows:[['#first','name.first'],['#last','name.last'],['#dob','dob | DD/MM/YYYY'],['#country','country.name'],['otp','person']],
    f:[['Given name','Asha'],['Family name','Rao'],['Date of birth','14/07/1999'],['Country','India'],['One-time code','waiting for a person']]},
   {n:'Portal B',file:'portal-b.json',rows:[['#full','last, first'],['#birth','dob | YYYY-MM-DD'],['#nat','country.iso3'],['#mail','email | lower'],['upload','person']],
    f:[['Full name','RAO, Asha'],['Birth date','1999-07-14'],['Nationality','IND'],['Email','asha@example.com'],['Documents','waiting for a person']]},
   {n:'Portal C',file:'portal-c.json',rows:[['#fname','name.first'],['#lname','name.last'],['#res','country.name'],['if #visa','skip if absent'],['#tel','phone | +CC']],
    f:[['First name','Asha'],['Last name','Rao'],['Country of residence','India'],['Visa details','skipped, not on page'],['Phone','+91 98765 43210']]}];
  var idx=(+el.getAttribute('data-i')||0)%P.length;el.setAttribute('data-i',idx+1);var p=P[idx];
  var tabs=$$('.tabs span',el),pre=$('.cfg pre',el),form=$('.ff',el),file=$('[data-file]',el),st=$('[data-status]',el);
  var s=[[60,function(){
    tabs.forEach(function(t,k){t.classList.toggle('on',k===idx)});if(file)file.textContent=p.file;
    pre.innerHTML='<span class="ln">{ <span class="k">"portal"</span>: <span class="s">"'+p.n+'"</span>,</span><span class="ln">  <span class="k">"steps"</span>: [</span>'+p.rows.map(function(r){return '<span class="ln">  { <span class="k">"'+r[0]+'"</span>: <span class="s">"'+r[1]+'"</span> },</span>'}).join('')+'<span class="ln">] }</span>';
    form.innerHTML=p.f.map(function(f){return '<label>'+f[0]+'<span class="in">&nbsp;</span></label>'}).join('');
    if(st)st.textContent='filling '+p.n}]];
  p.f.forEach(function(f,k){
    s.push([420,function(){$$('.ln',pre).forEach(function(l,j){l.classList.toggle('on',j===k+2)})}]);
    var inp=function(){return $$('.in',form)[k]};
    if(/waiting|skipped/.test(f[1])){s.push([300,function(){var i=inp();i.textContent=f[1];i.classList.add(/waiting/.test(f[1])?'wait':'done')}]);
      if(/waiting/.test(f[1])){s.push([1300,function(){var i=inp();i.textContent='done by a person';i.classList.remove('wait');i.classList.add('done')}])}}
    else{s=s.concat(typeInto({set textContent(v){inp().textContent=v}},f[1],30));s.push([120,function(){inp().classList.add('done')}])}
  });
  s.push([300,function(){$$('.ln',pre).forEach(function(l){l.classList.remove('on')});if(st)st.textContent=p.n+' submitted, engine unchanged'}]);
  s.push([2200,function(){}]);
  return s};

/* token sort */
scenes.tokens=function(el){
  var A='MSc Data Science (Full Time)',B='Data Science MSc - Full Time';
  var rows=$$('.tk-row',el),steps=$$('.tk-step span',el),v=$('.verdict',el);
  function norm(t){return t.toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}
  function setStep(k){steps.forEach(function(s,j){s.className=j<k?'done':(j===k?'on':'')})}
  function chips(r,arr,cls){$('.tk-chips',r).innerHTML=arr.map(function(w){return '<i class="'+(cls||'')+'">'+w+'</i>'}).join('')}
  var s=[[60,function(){rows[0].querySelector('.tk-src').textContent=A;rows[1].querySelector('.tk-src').textContent=B;rows.forEach(function(r){$('.tk-chips',r).innerHTML='';var k=$('.tk-key',r);k.textContent='';k.classList.remove('ok')});setStep(-1);v.className='verdict';v.innerHTML='<span>compare keys</span><span>…</span>'}],
    [900,function(){setStep(0);rows[0].querySelector('.tk-src').textContent=A.toLowerCase();rows[1].querySelector('.tk-src').textContent=B.toLowerCase()}],
    [900,function(){setStep(1);rows[0].querySelector('.tk-src').textContent=norm(A);rows[1].querySelector('.tk-src').textContent=norm(B)}],
    [900,function(){setStep(2);chips(rows[0],norm(A).split(' '));chips(rows[1],norm(B).split(' '))}],
    [60,function(){rows.forEach(function(r){$$('.tk-chips i',r).forEach(function(i,j){setTimeout(function(){i.classList.add('in')},j*90)})})}],
    [1100,function(){setStep(3);chips(rows[0],norm(A).split(' ').sort(),'in hl');chips(rows[1],norm(B).split(' ').sort(),'in hl')}],
    [1100,function(){setStep(4);rows.forEach(function(r,j){$('.tk-key',r).textContent=norm(j?B:A).split(' ').sort().join('')})}],
    [900,function(){setStep(5);rows.forEach(function(r){$('.tk-key',r).classList.add('ok')});v.className='verdict ok';v.innerHTML='<span>same key + same intake</span><span>MATCHED</span>'}],
    [2600,function(){}]];
  return s};

/* markdown extractor */
scenes.md=function(el){
  var w=$$('.wire i',el),ck=$('.wire .cookie',el),md=$$('.mdlines span',el),b=$$('.bub',el);
  var s=[[60,function(){w.forEach(function(i){i.classList.remove('scan')});ck.classList.remove('gone');md.forEach(function(m){m.classList.remove('in')});b.forEach(function(x){x.classList.remove('in')})}],
    [700,function(){ck.classList.add('gone')}]];
  w.forEach(function(i,k){s.push([180,function(){w.forEach(function(x){x.classList.remove('scan')});i.classList.add('scan')}])});
  s.push([100,function(){w.forEach(function(x){x.classList.remove('scan')})}]);
  md.forEach(function(m){s.push([170,function(){m.classList.add('in')}])});
  s.push([600,function(){b[0].classList.add('in')}],[1100,function(){b[1].classList.add('in')}],[3000,function(){}]);
  return s};

/* subject validator */
scenes.subject=function(el){
  var m=$$('.src mark',el),r=$$('.row',el),btn=$('.btnf',el),pick=$('[data-pick]',el);
  var s=[[60,function(){m.forEach(function(x){x.classList.remove('on')});r.forEach(function(x){x.className='row'});btn.classList.remove('press');if(pick)pick.textContent='closest: Mathematics · 0.71'}]];
  m.forEach(function(x,k){s.push([500,function(){x.classList.add('on')}])});
  r.forEach(function(x,k){s.push([600,function(){x.classList.add('in');if(k<2)x.classList.add('ok');else x.classList.add('amber')}])});
  s.push([1000,function(){btn.classList.add('press')}],[500,function(){r[2].classList.remove('amber');r[2].classList.add('ok');if(pick)pick.textContent='picked by a person: Further Mathematics'}],[2600,function(){}]);
  return s};

/* fees validator */
scenes.fees=function(el){
  var m=$$('.src mark',el),r=$$('.row',el),btn=$('.btnf',el),who=$('[data-who]',el);
  var s=[[60,function(){m.forEach(function(x){x.classList.remove('on')});r.forEach(function(x){x.className='row';var v=$('[data-v]',x);if(v)v.textContent='not set'});btn.classList.remove('press');if(who)who.textContent='not verified yet'}]];
  m.forEach(function(x){s.push([600,function(){x.classList.add('on')}])});
  s.push([400,function(){r.forEach(function(x){x.classList.add('in')})}],[900,function(){btn.classList.add('press')}]);
  r.forEach(function(x){if(x.hasAttribute('data-ft'))s.push([260,function(){x.classList.add('ok');$('[data-v]',x).textContent='£18,500 ✓'}])});
  s.push([500,function(){btn.classList.remove('press');if(who)who.textContent='verified once, applied to 3 intakes'}],[2800,function(){}]);
  return s};

/* social handle crawler */
scenes.crawl=function(el){
  var n=$('[data-count]',el),ppl=$$('.ppl i',el);
  var s=[[60,function(){n.textContent='0';ppl.forEach(function(i){i.classList.remove('on')})}]];
  var T=24;for(var k=1;k<=T;k++)(function(k){s.push([90,function(){var v=3.4*Math.pow(k/T,1.6);n.textContent=(v<1?Math.round(v*1000)+'K':v.toFixed(1)+'M');var on=Math.round(ppl.length*k/T);for(var j=0;j<on;j++)ppl[j].classList.add('on')}])})(k);
  s.push([120,function(){n.textContent='3.4M+'}],[3200,function(){}]);
  return s};

/* success rate */
scenes.rate=function(el){
  var st=$('.stack',el),seg=$$('.stack i',el),f=$$('.formula',el);
  var W=[89.9,5.1,5.0];
  var s=[[60,function(){st.classList.remove('drop');seg.forEach(function(x){x.style.width='0'});f.forEach(function(x){x.classList.remove('on','dim')})}],
    [300,function(){seg.forEach(function(x,k){x.style.width=W[k]+'%'})}],
    [1400,function(){f[0].classList.add('on')}],
    [2000,function(){st.classList.add('drop');seg[2].style.width='0';seg[0].style.width=(89.9/95*100).toFixed(1)+'%';seg[1].style.width=(5.1/95*100).toFixed(1)+'%';f[0].classList.remove('on');f[0].classList.add('dim');f[1].classList.add('on')}],
    [3200,function(){}]];
  return s};

/* timelines: human handover, one-bot vs config */
scenes.human=function(el){
  var li=$$('.tl li',el),st=$('[data-status]',el);
  var s=[[60,function(){li.forEach(function(x){x.className=''});if(st)st.textContent='bot running'}]];
  li.forEach(function(x,k){var wait=x.hasAttribute('data-wait');
    s.push([650,function(){if(k)li[k-1].className=li[k-1].className==='wait'?'done':'done';x.className=wait?'wait':'on';if(st)st.textContent=wait?'paused: a person takes this step':'bot running'}]);
    if(wait)s.push([1500,function(){x.className='done';if(st)st.textContent='person done, bot resumes'}])});
  s.push([600,function(){li[li.length-1].className='done';if(st)st.textContent='submitted and logged'}],[2600,function(){}]);
  return s};
scenes.versus=function(el){
  var L=$$('.vs > div',el),a=$$('li',L[0]),b=$$('li',L[1]),ma=$('.meter i',L[0]),mb=$('.meter i',L[1]);
  var s=[[60,function(){a.concat(b).forEach(function(x){x.className=''});ma.style.width='0';mb.style.width='0'}]];
  var n=Math.max(a.length,b.length);
  for(var k=0;k<n;k++)(function(k){s.push([700,function(){
    if(a[k]){if(k)a[k-1].className='done';a[k].className='on';ma.style.width=((k+1)/a.length*100)+'%'}
    if(b[k]){if(k)b[k-1].className='done';b[k].className='on';mb.style.width=((k+1)/b.length*100)+'%'}else if(b.length)b[b.length-1].className='done'}])})(k);
  s.push([500,function(){a[a.length-1].className='done'}],[2600,function(){}]);
  return s};

/* llm gate */
scenes.gate=function(el){
  var g=$$('.gate-l div',el),o=$$('.outs div',el),c=$$('.outs b',el);
  var s=[[60,function(){g.forEach(function(x){x.classList.remove('on')});o.forEach(function(x){x.className=''});c[0].textContent='0';c[1].textContent='0'}]];
  var seq=[1,1,0,1,1,1,0,1];var A=0,B=0;
  seq.forEach(function(ok){
    g.forEach(function(x,k){s.push([200,function(){g.forEach(function(y){y.classList.remove('on')});x.classList.add('on')}])});
    s.push([250,function(){g.forEach(function(y){y.classList.remove('on')});o[0].className='';o[1].className='';if(ok){A++;c[0].textContent=A;o[0].className='ok'}else{B++;c[1].textContent=B;o[1].className='amber'}}]);
  });
  s.push([2600,function(){}]);
  return s};

/* inline: architecture walk */
scenes.arch=function(el){
  var d=$$('.arch > div',el);var s=[[60,function(){d.forEach(function(x){x.classList.remove('on')})}]];
  d.forEach(function(x){s.push([650,function(){d.forEach(function(y){y.classList.remove('on')});x.classList.add('on')}])});
  s.push([1600,function(){d.forEach(function(y){y.classList.remove('on')})}]);return s};

/* inline: failure bins (illustration) */
scenes.bins=function(el){
  var bins=$$('.bin',el);var seq=[0,1,0,2,3,4,1,0,2,4,0,3];
  var s=[[60,function(){bins.forEach(function(b){$('.dots',b).innerHTML=''})}]];
  seq.forEach(function(k){s.push([420,function(){var i=document.createElement('i');$('.dots',bins[k]).appendChild(i)}])});
  s.push([2600,function(){}]);return s};

/* inline: reconcile two lists */
scenes.cmp=function(el){
  var items=$$('.cmp li',el);var s=[[60,function(){items.forEach(function(x){x.classList.remove('m','n','d','c');var o=$('[data-o]',x);if(o)o.textContent=''})}]];
  items.forEach(function(x){var cl=x.getAttribute('data-r');s.push([380,function(){x.classList.add(cl);var o=$('[data-o]',x);if(o)o.textContent={m:'matched',n:'new',d:'deleted',c:'modified'}[cl]}])});
  s.push([2600,function(){}]);return s};

/* inline: key fallback ladder */
scenes.keys=function(el){
  var li=$$('.keys li',el),hit=+el.getAttribute('data-hit')||3;
  var s=[[60,function(){li.forEach(function(x){x.className='';$('.r',x).textContent=''})}]];
  li.forEach(function(x,k){if(k>hit)return;s.push([520,function(){x.className='try';$('.r',x).textContent='trying'}]);
    s.push([420,function(){if(k===hit){x.className='hit';$('.r',x).textContent='match'}else{x.className='';$('.r',x).textContent=x.getAttribute('data-why')||'no match'}}])});
  s.push([2600,function(){}]);return s};

$$('[data-scene]').forEach(function(el){var f=scenes[el.getAttribute('data-scene')];if(f)player(el,f)});
if(reduce)$$('svg.net').forEach(function(s){try{s.pauseAnimations()}catch(e){}});
})();
