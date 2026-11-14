(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}

  var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();

  /* old links to sections that moved to their own pages */
  if(document.getElementById('filmSec')){var h=location.hash;
    if(h==='#pilot'){location.replace('pilots/trividh/');return;}
    if(h==='#checkins'){location.replace('pilots/autopilot/');return;}}

  /* top bar: transparent over the film, solid after it */
  var bar=document.getElementById('bar'), filmSec=document.querySelector('.film');
  if(filmSec){ var barState=function(){ bar.classList.toggle('solid', filmSec.getBoundingClientRect().bottom < 72); };
    addEventListener('scroll',barState,{passive:true}); barState(); }

  if(document.getElementById("filmSec")) (function(){
  /* opening film + overlay: boot (name switches on in the sky) -> dock (glides bottom-left as the city grows) -> done (caption types, buttons appear) */
  var film=document.getElementById('film'), still=document.getElementById('filmStill');
  var sec=document.getElementById('filmSec'), title=document.getElementById('title'), note=document.getElementById('note');
  var tall=matchMedia('(max-aspect-ratio: 3/4)').matches, base='video/hero-'+(tall?'tall':'wide');
  var NOTE='Trividh, 2036 · Still watering its gardens when the city runs dry';
  still.src=base+(reduce?'-end':'-start')+'.webp';
  film.poster=base+'-start.webp';
  film.src=base+'.mp4';
  /* split the name into letters for the switch-on flicker (text stays a normal H1) */
  [].forEach.call(document.querySelectorAll('#h1 b, #h1 .l2'),function(el){
    var t=el.textContent; el.textContent='';
    for(var i=0;i<t.length;i++){var c=document.createElement('span'); c.className='ch'; c.setAttribute('aria-hidden','true'); c.textContent=t[i]; el.appendChild(c);}
  });
  var chars=[].slice.call(document.querySelectorAll('#h1 .ch')), timers=[], typing=0;
  function clearT(){ timers.forEach(clearTimeout); timers=[]; clearInterval(typing); }
  function skyTransform(){
    title.style.transform='none';
    var f=sec.getBoundingClientRect(), r=title.getBoundingClientRect();
    var s=Math.min((f.width*(tall?.86:.62))/r.width, tall?1.25:1.7);
    var cx=f.width/2, cy=(tall?.22:.30)*f.height+20;
    var dx=cx-(r.left-f.left)-r.width*s/2, dy=cy-(r.top-f.top)-r.height*s/2;
    return 'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+s.toFixed(3)+')';
  }
  function setState(st){ sec.setAttribute('data-state',st); }
  function typeNote(){ var i=0; note.textContent=''; clearInterval(typing);
    typing=setInterval(function(){ i++; note.innerHTML=NOTE.slice(0,i).replace(/&/g,'&amp;')+'<span class="cur"></span>'; if(i>=NOTE.length) clearInterval(typing); },32); }
  function boot(){
    clearT(); note.textContent=''; title.classList.remove('glide');
    setState('boot'); title.style.transform=skyTransform();
    var order=chars.map(function(_,i){return i;}).sort(function(){return Math.random()-.5;});
    order.forEach(function(ci,k){ chars[ci].style.animationDelay=(0.15+k*0.09)+'s'; });
  }
  var docked=false;
  function dock(){ if(docked) return; docked=true; title.classList.add('glide'); setState('dock'); requestAnimationFrame(function(){ title.style.transform='none'; }); }
  function done(){ dock(); setState('done'); typeNote(); still.src=base+'-end.webp'; }
  function finished(){ clearT(); title.classList.remove('glide'); title.style.transform='none'; docked=true; setState('done'); note.textContent=NOTE; }
  function play(){
    if(reduce){ film.hidden=true; finished(); return; }
    film.hidden=false; docked=false; boot();
    try{ film.currentTime=0; var p=film.play(); if(p&&p.catch) p.catch(function(){ film.hidden=true; still.src=base+'-end.webp'; finished(); }); }catch(e){ finished(); }
    timers.push(setTimeout(dock,3600)); timers.push(setTimeout(function(){ if(sec.getAttribute('data-state')!=='done') done(); },11500));
  }
  film.addEventListener('timeupdate',function(){ if(!docked && film.currentTime>=2.8) dock(); });
  film.addEventListener('ended',function(){ clearT(); done(); });
  addEventListener('resize',function(){ if(sec.getAttribute('data-state')==='boot'){ title.classList.remove('glide'); title.style.transform=skyTransform(); } });
  document.getElementById('replay').addEventListener('click',function(){ reduce=false; play(); });
  play();

  })();

  if(document.getElementById("model")) (function(){
  /* pilot: block model */
  var NS='http://www.w3.org/2000/svg', svg=document.getElementById('model');
  var CW=20, CH=10, HH=13;
  function P(x,y,z){return [(x-y)*CW,(x+y)*CH-z*HH];}
  function pts(a){return a.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');}
  function el(tag,at,par){var e=document.createElementNS(NS,tag);for(var k in at)e.setAttribute(k,at[k]);(par||svg).appendChild(e);return e;}
  var B={}, list=[];
  function add(x,y,z,role){var k=x+','+y+','+z; if(B[k]){B[k].role=role;return;} B[k]={x:x,y:y,z:z,role:role||'n'}; list.push(B[k]);}
  var x,y,z;
  for(x=0;x<=5;x++)for(y=0;y<=2;y++)for(z=0;z<=1;z++)add(x,y,z);
  for(x=1;x<=4;x++)for(y=0;y<=1;y++)for(z=2;z<=13;z++)add(x,y,z);
  for(x=1;x<=4;x++)for(y=0;y<=1;y++)add(x,y,14);
  for(x=2;x<=3;x++){add(x,0,15);add(x,1,15,'rain');add(x,0,16,'rain');}
  for(z=2;z<=13;z++){add(1,1,z,'grey');add(3,1,z,'reuse');add(4,1,z,'rain');}
  add(1,2,0,'tank');add(2,2,0,'tank');add(1,2,1,'tank');add(2,2,1,'tank');
  add(4,2,1,'wash');
  for(y=0;y<=2;y++){add(0,y,2,'garden');add(5,y,2,'garden');}
  for(x=6;x<=7;x++)for(y=1;y<=2;y++)for(z=0;z<=1;z++)add(x,y,z,'rain');
  for(z=2;z<=13;z++){if(z%3!==1)add(2,1,z,'glass');if(z%3===2)add(4,0,z,'glass');}
  [4,7,10,13].forEach(function(z){add(4,0,z,'nest');});
  list.sort(function(a,b){return (a.x+a.y)-(b.x+b.y)||a.z-b.z;});
  var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  list.forEach(function(b){
    var g=el('g',{'class':'br r-'+b.role+(b.z%2?' alt':'')});
    b.g=g;
    var X=b.x,Y=b.y,Z=b.z;
    el('polygon',{'class':'l',points:pts([P(X,Y+1,Z),P(X+1,Y+1,Z),P(X+1,Y+1,Z+1),P(X,Y+1,Z+1)])},g);
    el('polygon',{'class':'r',points:pts([P(X+1,Y,Z),P(X+1,Y+1,Z),P(X+1,Y+1,Z+1),P(X+1,Y,Z+1)])},g);
    el('polygon',{'class':'t',points:pts([P(X,Y,Z+1),P(X+1,Y,Z+1),P(X+1,Y+1,Z+1),P(X,Y+1,Z+1)])},g);
    if(!B[X+','+Y+','+(Z+1)]){var c=P(X+.5,Y+.5,Z+1);el('ellipse',{'class':'studside',cx:c[0],cy:c[1],rx:6.5,ry:3.3},g);el('ellipse',{'class':'stud',cx:c[0],cy:c[1]-2.6,rx:6.5,ry:3.3},g);}
    [[X,Y,Z],[X+1,Y+1,Z+1],[X+1,Y,Z],[X,Y+1,Z+1]].forEach(function(q){var p=P(q[0],q[1],q[2]);minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]-6);maxY=Math.max(maxY,p[1]);});
  });
  ['polygon'].forEach(function(){});
  [].forEach.call(svg.querySelectorAll('polygon'),function(p){p.setAttribute('stroke-linejoin','round');});
  var birds=el('g',{'class':'birds'});
  [4,7,10,13].forEach(function(z,i){var p=P(5.25,0.5,z+0.9);el('circle',{'class':'bird',cx:p[0]+(i%2)*4,cy:p[1],r:2.4},birds);el('circle',{'class':'bird',cx:p[0]+8+(i%2)*4,cy:p[1]-3,r:2},birds);});
  var rain=el('g',{'class':'rain'});
  for(var i=0;i<12;i++){var p=P(1.6+(i%4)*0.8,0.2+Math.floor(i/4)*0.7,20+(i%3));var d=el('circle',{'class':'rd',cx:p[0],cy:p[1],r:1.8},rain);d.style.animationDelay=(i*0.13)+'s';}
  var top=P(3,0,23)[1]; minY=Math.min(minY,top);
  svg.setAttribute('viewBox',(minX-14)+' '+(minY-10)+' '+(maxX-minX+28)+' '+(maxY-minY+20));

  var ALL=['grey','tank','reuse','wash','garden','rain','nest'];
  var STEPS=[
    {k:'Model',n:'The model',h:'Trividh, in blocks.',p:'Every coloured block is part of the water system. Step through it, or let it play.',on:ALL,flow:null},
    {k:'Collect',n:'01 · Collect',h:'Nothing goes straight down the drain.',p:'Water from every shower and sink in the building is collected, instead of being sent away with the sewage.',on:['grey'],flow:['grey',-1]},
    {k:'Clean',n:'02 · Clean',h:'It gets cleaned right here.',p:'Trividh treats its own grey water on site. No tanker, and no pipeline from somewhere else.',on:['tank'],flow:null},
    {k:'Reuse',n:'03 · Reuse',h:'Then it goes back up to work again.',p:'The cleaned water flushes the toilets, waters the gardens and does the washing. The same litre gets used twice.',on:['tank','reuse','wash','garden'],flow:['reuse',1]},
    {k:'Rain',n:'04 · Rain',h:'Rain gets a tank of its own.',p:'Monsoon rain is caught at the top and stored separately, so the building has water put away for the dry months. When the city runs short, people here can still water their plants.',on:['rain'],flow:['rain',-1],rain:true},
    {k:'Ten years',n:'05 · Ten years on',h:'And the birds stay.',p:'Every building has a blank side wall that nobody looks at. On Trividh’s, we built nests into the facade. Walk past in 2036 and you should hear them.',on:['nest','garden'],flow:null,birds:true,extra:'<a class="pill ghost" href="https://houseofcosmos.co/trividh/" style="align-self:flex-start">Trividh on houseofcosmos.co ↗</a>'},
    {k:'Count',n:'06 · Count',h:'Then we measure whether I was right.',p:'Once people move in, we will track two numbers: water used per day, and the water tankers we never had to call. Both will go in my letter, good or bad.',on:ALL,flow:null,birds:true,extra:'<div class="soon"><span class="chip"><i></i>Litres a day <b>soon</b></span><span class="chip"><i></i>Tankers avoided <b>soon</b></span></div><a class="pill" href="#letter" style="align-self:flex-start">Get the letter</a>'}
  ];
  var nav=document.getElementById('stepnav'), cap=document.getElementById('cap'), stepOf=document.getElementById('stepOf'), cur=0, flowList=[], fi=0, auto=!reduce, autoT=null, inView=false;
  STEPS.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.className='st';b.innerHTML='<i></i>'+(i?i+' ':'')+s.k;b.addEventListener('click',function(){stopAuto();go(i);});nav.appendChild(b);});
  function go(i){
    cur=(i+STEPS.length)%STEPS.length; var s=STEPS[cur];
    [].forEach.call(nav.children,function(b,k){b.setAttribute('aria-pressed',String(k===cur));});
    cap.innerHTML='<p class="n">'+s.n+'</p><h3>'+s.h+'</h3><p>'+s.p+'</p>'+(s.extra||'');
    stepOf.textContent=cur?('Step '+cur+' of 6 · '+s.k):'All systems on';
    list.forEach(function(b){b.g.classList.toggle('lit',s.on.indexOf(b.role)>-1);b.g.classList.remove('pulse');});
    svg.classList.toggle('show-birds',!!s.birds); svg.classList.toggle('show-rain',!!s.rain);
    flowList=[]; fi=0;
    if(s.flow){flowList=list.filter(function(b){return b.role===s.flow[0]&&b.x<6&&b.z>=2;}).sort(function(a,b){return s.flow[1]>0?a.z-b.z:b.z-a.z;});}
    document.getElementById('next').textContent=cur===STEPS.length-1?'Start again ↺':'Next step →';
  }
  setInterval(function(){ if(reduce||!inView||!flowList.length) return; flowList.forEach(function(b,k){b.g.classList.toggle('pulse',((k-fi+flowList.length)%flowList.length)<2);}); fi=(fi+1)%flowList.length; },150);
  function stopAuto(){auto=false;clearInterval(autoT);}
  document.getElementById('next').addEventListener('click',function(){stopAuto();go(cur+1);});
  document.getElementById('prev').addEventListener('click',function(){stopAuto();go(cur-1);});
  function build(){
    if(reduce) return;
    list.forEach(function(b){b.g.classList.add('out');});
    svg.getBoundingClientRect();
    list.forEach(function(b,i){setTimeout(function(){b.g.classList.remove('out');},120+b.z*55+(b.x+b.y)*12);});
  }
  document.getElementById('rebuild').addEventListener('click',function(){stopAuto();go(0);build();});
  var built=false;
  try{new IntersectionObserver(function(es){inView=es[0].isIntersecting;
    if(inView&&!built){built=true;build();}
    if(inView&&auto&&!autoT){autoT=setInterval(function(){if(auto&&inView)go(cur+1);},5200);}
  },{threshold:.35}).observe(svg);}catch(e){inView=true;}
  go(0);

  })();

  if(document.getElementById("people")) (function(){
  /* water meter */
  var pr=document.getElementById('people'), po=document.getElementById('peopleOut'), lt=document.getElementById('litres');
  function perSec(){return (+pr.value)*87*0.75/86400;}
  function sinceMidnight(){var d=new Date(); return d.getHours()*3600+d.getMinutes()*60+d.getSeconds()+d.getMilliseconds()/1000;}
  function yearTxt(){var y=(+pr.value)*87*0.75*365; return y>=1e7?(y/1e7).toFixed(2)+' crore':(y/1e5).toFixed(1)+' lakh';}
  function lab(){po.textContent=(+pr.value).toLocaleString('en-IN')+' people · '+yearTxt()+' litres a year';}
  pr.addEventListener('input',lab); lab();
  function meter(){lt.textContent=Math.floor(perSec()*sinceMidnight()).toLocaleString('en-IN');}
  pr.addEventListener('input',meter); meter(); setInterval(meter,1000);

  })();

  /* check-in rule tabs */
  var rtabs=[].slice.call(document.querySelectorAll('.rules-nav .st')), rpanels=[].slice.call(document.querySelectorAll('.rules'));
  rtabs.forEach(function(t){t.addEventListener('click',function(){
    rtabs.forEach(function(x){x.setAttribute('aria-pressed',String(x===t));});
    rpanels.forEach(function(p){p.hidden=p.dataset.g!==t.dataset.g;});
  });});

  if(document.getElementById("sub")) (function(){
  /* subscribe: until a newsletter service is chosen, joining is a pre-filled email to Akshit */
  var ME='akshitparmar28@gmail.com';
  document.getElementById('sub').addEventListener('submit',function(e){
    e.preventDefault(); var v=document.getElementById('email').value.trim(), m=document.getElementById('subMsg');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ m.textContent='That email looks off. Check it and try again.'; m.classList.remove('done'); return; }
    var href='mailto:'+ME+'?subject='+encodeURIComponent('Add me to the letter')+'&body='+encodeURIComponent('Hi Akshit, please add '+v+' to your weekly letter.');
    try{ location.href=href; }catch(err){}
    m.innerHTML='If your email app did not open, write to <b>'+ME+'</b> with the subject \u201cAdd me to the letter\u201d.'; m.classList.add('done');
  });
  })();
})();
