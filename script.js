(function(){
/* ---------- Content ---------- */
const DATA = {
  about:{ name:'About me', kind:'The crystal in the middle', accent:'#F2C14E',
    desc:'Full-stack developer with 3+ years of experience. I build websites and Telegram bots end to end, from the layout to the Python back end. Available for freelance work.',
    stack:['Python','aiogram','JavaScript','HTML','CSS'],
    action:'Click the crystal again to give it a spin.',
    link:{href:'mailto:hello@example.com', label:'Get in touch'} },
  beacon:{ name:'Beacon', kind:'Telegram bot', accent:'#FF6B6B',
    desc:'A Telegram bot that watches websites and sends an alert the moment one goes down, with uptime stats on request.',
    stack:['Python','aiogram','PostgreSQL'],
    action:'Click the island again to flash the light.' },
  mill:{ name:'Mill Market', kind:'Online store', accent:'#9BDE7E',
    desc:'A storefront for local farm produce: a seasonal catalogue, a cart and pickup scheduling. Fast on phones, built without a framework.',
    stack:['HTML','CSS','JavaScript'],
    action:'Click again to spin the sails.' },
  star:{ name:'Stargazer', kind:'Web dashboard', accent:'#8FB8FF',
    desc:'A night-sky dashboard that shows which planets and satellites are visible from your location tonight.',
    stack:['JavaScript','Three.js','REST API'],
    action:'Click again for a shooting star.' },
  launch:{ name:'Launchpad', kind:'Landing page', accent:'#FF9F5A',
    desc:'A launch page for a startup product with scroll-driven animation and a waitlist form that posts straight to a Telegram chat.',
    stack:['HTML','CSS','JavaScript','Python'],
    action:'Click again to launch the rocket.' }
};
const ORDER = ['about','beacon','mill','star','launch'];

/* ---------- Setup ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = reduce ? 0.25 : 1;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x2b2552, 0.022);
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 500);

const world = new THREE.Group();
scene.add(world);

/* helpers */
function h3(x,y,z){ const s = Math.sin(x*127.1 + y*311.7 + z*74.7) * 43758.5453; return s - Math.floor(s); }
function jitter(geo, amt, keep){
  const p = geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    if(keep && keep(x,y,z)) continue;
    p.setXYZ(i, x+(h3(x,y,z)-.5)*amt, y+(h3(y,z,x)-.5)*amt, z+(h3(z,x,y)-.5)*amt);
  }
  geo.computeVertexNormals();
  return geo;
}
const std = (c, o={}) => new THREE.MeshStandardMaterial(Object.assign({color:c, flatShading:true, roughness:.85}, o));
function dotTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.35,'rgba(255,255,255,.8)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
const DOT = dotTexture();

/* ---------- Sky ---------- */
const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false,
  uniforms:{ top:{value:new THREE.Color(0x0c1030)}, mid:{value:new THREE.Color(0x3b2f6e)}, low:{value:new THREE.Color(0x8a5a8c)} },
  vertexShader:'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.); }',
  fragmentShader:'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(low, mid, smoothstep(-.35, .08, h)); c = mix(c, top, smoothstep(.08, .7, h)); gl_FragColor = vec4(c,1.); }'
}));
scene.add(sky);

const starGeo = new THREE.BufferGeometry(); const sp = [];
for(let i=0;i<900;i++){
  const u = Math.random()*Math.PI*2, v = Math.acos(Math.random()*1.1 - .1);
  sp.push(180*Math.sin(v)*Math.cos(u), 180*Math.cos(v), 180*Math.sin(v)*Math.sin(u));
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp,3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({size:1.1, map:DOT, transparent:true, depthWrite:false, fog:false, color:0xfff6e8}));
scene.add(stars);

const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 16), new THREE.MeshBasicMaterial({color:0xfff1d0, fog:false}));
moon.position.set(-70, 55, -110); scene.add(moon);
const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:DOT, color:0xc8b8ff, transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false, fog:false}));
glow.scale.set(60,60,1); glow.position.copy(moon.position); scene.add(glow);

/* ---------- Light ---------- */
scene.add(new THREE.HemisphereLight(0x958bdc, 0x1b1535, .95));
const moonLight = new THREE.DirectionalLight(0xdcd6ff, 1.15);
moonLight.position.set(-12, 22, -6);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024,1024);
Object.assign(moonLight.shadow.camera, {left:-16, right:16, top:16, bottom:-16, near:1, far:70});
scene.add(moonLight);
const warm = new THREE.DirectionalLight(0xffb27a, .45); warm.position.set(10, 4, 12); scene.add(warm);

/* ---------- Clouds ---------- */
const clouds = new THREE.Group(); scene.add(clouds);
const cloudMat = std(0x6a5f9e, {transparent:true, opacity:.9});
for(let i=0;i<11;i++){
  const c = new THREE.Group(); const a = i/11*Math.PI*2 + Math.random(), r = 6 + Math.random()*18;
  for(let k=0;k<4;k++){
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random()*1.2, 1), cloudMat);
    s.position.set((k-1.5)*1.3, Math.random()*.4, Math.random()*.8); s.scale.y = .5; c.add(s);
  }
  c.position.set(Math.sin(a)*r, -5 - Math.random()*2.5, Math.cos(a)*r);
  c.rotation.y = Math.random()*Math.PI;
  clouds.add(c);
}

/* ---------- Islands ---------- */
const islands = [];
const R = 8.5;
function makeBase(r, topColor){
  const g = new THREE.Group();
  const hh = r*.9;
  const rg = new THREE.ConeGeometry(r, r*1.8, 8, 4); rg.rotateX(Math.PI);
  jitter(rg, r*.35, (x,y)=> y > hh - .001);
  const rock = new THREE.Mesh(rg, std(0x4a3f6b)); rock.position.y = -hh;
  const tg = jitter(new THREE.CylinderGeometry(r*1.02, r*.96, .3, 8, 1), .06);
  const top = new THREE.Mesh(tg, std(topColor)); top.position.y = .05;
  g.add(rock, top);
  return g;
}
function makeIsland(id, angle, y, topColor){
  const accent = new THREE.Color(DATA[id].accent);
  const grp = new THREE.Group();
  grp.position.set(Math.sin(angle)*R, y, Math.cos(angle)*R);
  grp.rotation.y = angle;
  grp.userData = {id, baseY:y, baseRot:angle, lift:0};
  grp.add(makeBase(2.1, topColor));
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.45, .035, 8, 90),
    new THREE.MeshBasicMaterial({color:accent, transparent:true, opacity:0, fog:false}));
  halo.rotation.x = Math.PI/2; halo.position.y = .05;
  grp.add(halo); grp.userData.halo = halo; grp.userData.haloBase = 0;
  const pl = new THREE.PointLight(accent, .9, 7, 2); pl.position.set(0, 2.6, 1.4); grp.add(pl);
  world.add(grp); islands.push(grp);
  return grp;
}

/* Lighthouse: Beacon */
(function(){
  const isl = makeIsland('beacon', 0, .4, 0x7fae6e);
  const white = std(0xf4f1ff), red = std(0xd9434b);
  let y = .2;
  [[.5,.44,.55,white],[.44,.38,.55,red],[.38,.32,.55,white],[.32,.28,.45,red]].forEach(([r1,r2,h,m])=>{
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,h,10), m); c.position.y = y + h/2; isl.add(c); y += h;
  });
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.06,10), std(0x2e2a4a)); deck.position.y = y + .03; isl.add(deck);
  const lampMat = new THREE.MeshStandardMaterial({color:0xfff2b0, emissive:0xffd166, emissiveIntensity:1.2});
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.32,10), lampMat); lamp.position.y = y + .22; isl.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(.34,.35,10), red); roof.position.y = y + .55; isl.add(roof);
  const lampLight = new THREE.PointLight(0xffd166, 1.2, 6, 2); lampLight.position.y = y + .22; isl.add(lampLight);
  const beam = new THREE.Group(); beam.position.y = y + .22; isl.add(beam);
  const beamMat = new THREE.MeshBasicMaterial({color:0xffe6a0, transparent:true, opacity:.22, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide});
  [1,-1].forEach(dir=>{
    const c = new THREE.Mesh(new THREE.ConeGeometry(.6,4.5,20,1,true), beamMat);
    c.rotation.z = dir*Math.PI/2; c.position.x = dir*2.25; beam.add(c);
  });
  const house = new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.6), white); house.position.set(1.15,.45,.55); isl.add(house);
  const hroof = new THREE.Mesh(new THREE.ConeGeometry(.55,.4,4), red); hroof.position.set(1.15,.9,.55); hroof.rotation.y = Math.PI/4; isl.add(hroof);
  const stone = std(0x8c86a8);
  [[-1.3,.25,.6,.24],[-1.1,.22,1.1,.15],[-.9,.24,-1.2,.2]].forEach(([x,yy,z,r])=>{
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r,0), stone); s.position.set(x,yy,z); isl.add(s);
  });
  let boost = 0;
  isl.userData.update = (dt)=>{
    boost *= 1 - Math.min(1, dt*1.2);
    beam.rotation.y += dt*(.8 + boost);
    lampMat.emissiveIntensity = 1.2 + boost*.35;
    lampLight.intensity = 1.2 + boost*.4;
    beamMat.opacity = .22 + boost*.03;
  };
  isl.userData.action = ()=>{ boost = 8; };
})();

/* Windmill: Mill Market */
(function(){
  const isl = makeIsland('mill', Math.PI/2, 1.3, 0x6fae55);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(.32,.6,1.8,8), std(0x7a5a45)); tower.position.y = 1.1; isl.add(tower);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.45,.6,8), std(0x3c3350)); cap.position.y = 2.3; isl.add(cap);
  const door = new THREE.Mesh(new THREE.BoxGeometry(.22,.35,.05), std(0x2e2a4a)); door.position.set(0,.4,.56); isl.add(door);
  const sails = new THREE.Group(); sails.position.set(0,1.95,.48); isl.add(sails);
  const cloth = std(0xf1e9da), wood = std(0x5a3b2e);
  for(let k=0;k<4;k++){
    const arm = new THREE.Group(); arm.rotation.z = k*Math.PI/2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.26,1.2,.03), cloth); blade.position.set(.11,.75,0);
    const spar = new THREE.Mesh(new THREE.BoxGeometry(.05,1.4,.05), wood); spar.position.y = .7;
    arm.add(blade, spar); sails.add(arm);
  }
  sails.add(new THREE.Mesh(new THREE.SphereGeometry(.1,8,6), wood));
  const tulipColors = [0xe8446d, 0xf7d046, 0xff8fb1, 0xb86bff];
  const stem = std(0x3f7a3a);
  let n = 0;
  for(let x=-1.65;x<=1.65;x+=.28) for(let z=-1.65;z<=1.65;z+=.28){
    const d = Math.hypot(x,z);
    if(d < 1.0 || d > 1.75 || z > .2) continue;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.14,4), stem); s.position.set(x,.27,z); isl.add(s);
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(.075,0), std(tulipColors[Math.floor((z+1.65)/.28) % 4]));
    h.position.set(x,.37,z); isl.add(h); n++;
  }
  let boost = 0;
  isl.userData.update = (dt)=>{
    boost *= 1 - Math.min(1, dt*.9);
    sails.rotation.z -= dt*(.7*motion + boost);
  };
  isl.userData.action = ()=>{ boost = 10; };
})();

/* Observatory: Stargazer */
(function(){
  const isl = makeIsland('star', Math.PI, -.4, 0x8a8fb0);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.85,.9,.9,16), std(0xe9e6f5)); base.position.y = .65; isl.add(base);
  const door = new THREE.Mesh(new THREE.BoxGeometry(.3,.45,.05), std(0x2e2a4a)); door.position.set(0,.43,.88); isl.add(door);
  const dome = new THREE.Group(); dome.position.y = 1.1; isl.add(dome);
  dome.add(new THREE.Mesh(new THREE.SphereGeometry(.88,16,8,0,Math.PI*2,0,Math.PI/2), std(0xb9c0d8, {metalness:.4, roughness:.4})));
  dome.add(new THREE.Mesh(new THREE.SphereGeometry(.9,4,8,-.14,.28,0,Math.PI/2), std(0x1b1840, {side:THREE.DoubleSide})));
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,1.1,10), std(0x3a3560)); scope.position.set(-.4,.55,0); scope.rotation.z = .75; dome.add(scope);
  const ss = new THREE.Group(); ss.visible = false; isl.add(ss);
  ss.add(new THREE.Mesh(new THREE.SphereGeometry(.08,8,6), new THREE.MeshBasicMaterial({color:0xffffff, fog:false})));
  const trail = new THREE.Mesh(new THREE.CylinderGeometry(0,.05,1.4,6),
    new THREE.MeshBasicMaterial({color:0xcfe0ff, transparent:true, opacity:.75, blending:THREE.AdditiveBlending, depthWrite:false, fog:false}));
  trail.rotation.z = Math.PI/2; trail.position.x = -.7; ss.add(trail);
  const A = new THREE.Vector3(-3.5,5,-2), B = new THREE.Vector3(3,3,1.5);
  ss.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0), B.clone().sub(A).normalize());
  let sT = -1, domeTarget = 0;
  isl.userData.update = (dt)=>{
    domeTarget += dt*.1*motion;
    dome.rotation.y += (domeTarget - dome.rotation.y)*Math.min(1, dt*2);
    if(sT >= 0){
      sT += dt*.9; ss.visible = true; ss.position.lerpVectors(A, B, Math.min(sT,1));
      if(sT > 1){ sT = -1; ss.visible = false; }
    }
  };
  isl.userData.action = ()=>{ sT = 0; domeTarget += Math.PI/2; };
})();

/* Rocket: Launchpad */
(function(){
  const isl = makeIsland('launch', Math.PI*1.5, .9, 0x6d6a88);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(.8,.9,.15,12), std(0x4a4766)); pad.position.y = .275; isl.add(pad);
  const red = std(0xd9434b), white = std(0xf4f1ff);
  const gantry = new THREE.Mesh(new THREE.BoxGeometry(.12,2.2,.12), red); gantry.position.set(.8,1.3,0); isl.add(gantry);
  [1.0,1.7].forEach(yy=>{ const arm = new THREE.Mesh(new THREE.BoxGeometry(.4,.05,.05), red); arm.position.set(.6,yy,0); isl.add(arm); });
  const rocket = new THREE.Group(); isl.add(rocket);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,1.1,14), white); body.position.y = .65;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.22,.45,14), red); nose.position.y = 1.42;
  const win = new THREE.Mesh(new THREE.SphereGeometry(.08,10,8), new THREE.MeshStandardMaterial({color:0x8fb8ff, emissive:0x2a4a8a}));
  win.position.set(0,.9,.21);
  rocket.add(body, nose, win);
  for(let k=0;k<3;k++){
    const a = k*Math.PI*2/3;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(.04,.32,.24), red);
    fin.position.set(Math.sin(a)*.26,.28,Math.cos(a)*.26); fin.rotation.y = a; rocket.add(fin);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.16,.6,10),
    new THREE.MeshBasicMaterial({color:0xffa24a, transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false}));
  flame.rotation.x = Math.PI; flame.position.y = -.2; flame.visible = false; rocket.add(flame);
  const fl = new THREE.PointLight(0xff8a3d, 0, 5, 2); fl.position.y = -.3; rocket.add(fl);
  let state = 'idle', ry = 0, rv = 0;
  isl.userData.update = (dt)=>{
    if(state === 'up'){ rv += dt*6; ry += rv*dt; rocket.rotation.y += dt*2; if(ry > 11){ state = 'down'; } }
    else if(state === 'down'){ ry += (0 - ry)*Math.min(1, dt*1.2); if(ry < .02){ ry = 0; state = 'idle'; } }
    rocket.position.y = .2 + ry;
    flame.visible = state !== 'idle';
    flame.scale.y = .8 + Math.random()*.5;
    fl.intensity = state !== 'idle' ? 2 : 0;
  };
  isl.userData.action = ()=>{ if(state === 'idle'){ state = 'up'; rv = 1; } };
})();

/* Center crystal: About */
(function(){
  const core = new THREE.Group(); core.position.y = 1.2;
  core.userData = {id:'about', baseY:1.2, baseRot:0, lift:0};
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.8,0), std(0xf2c14e, {emissive:0x7a4e08, emissiveIntensity:.9, roughness:.3, metalness:.35}));
  gem.scale.y = 1.4;
  const ringMat = new THREE.MeshBasicMaterial({color:0xf2c14e, transparent:true, opacity:.45, fog:false});
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.5,.02,8,100), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.9,.015,8,100), ringMat);
  ring1.rotation.x = Math.PI/2.3; ring2.rotation.x = Math.PI/1.7;
  const light = new THREE.PointLight(0xf2c14e, 1.3, 14, 2);
  core.add(gem, ring1, ring2, light);
  core.userData.halo = ring1; core.userData.haloBase = .45;
  let boost = 0;
  core.userData.update = (dt)=>{
    boost *= 1 - Math.min(1, dt*1.5);
    gem.rotation.y += dt*(.6 + boost)*motion;
    ring1.rotation.z += dt*(.3 + boost*.3); ring2.rotation.z -= dt*(.2 + boost*.3);
    light.intensity = 1.3 + boost*.25;
  };
  core.userData.action = ()=>{ boost = 9; };
  world.add(core); islands.push(core);
})();

world.traverse(o=>{ if(o.isMesh && !o.material.transparent){ o.castShadow = true; o.receiveShadow = true; } });

/* Fireflies */
const FN = 150, ffBase = [], ffPos = new Float32Array(FN*3);
for(let i=0;i<FN;i++) ffBase.push([(Math.random()-.5)*30, -2 + Math.random()*8, (Math.random()-.5)*30, Math.random()*6]);
const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos,3));
const ffMat = new THREE.PointsMaterial({size:.22, map:DOT, color:0xffd479, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending});
scene.add(new THREE.Points(ffGeo, ffMat));

/* ---------- Camera ---------- */
const HOME = new THREE.Vector3(0,.8,0);
const cam  = {theta:.6, phi:1.12, radius: reduce ? 21 : 62, target:HOME.clone()};
const want = {theta:.6, phi:1.12, radius:21, target:HOME.clone()};
const off = {x:0, y:0};
function nearestAngle(cur, a){ const T = Math.PI*2; return a + T*Math.round((cur - a)/T); }

/* ---------- UI ---------- */
const panel = document.getElementById('panel');
const $ = id => document.getElementById(id);
const nav = $('islands');
ORDER.forEach(id=>{
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.id = id; b.setAttribute('aria-pressed','false');
  b.style.setProperty('--c', DATA[id].accent);
  b.innerHTML = '<span class="dot"></span>' + DATA[id].name;
  b.addEventListener('click', ()=> select(id, true));
  nav.appendChild(b);
});
let focused = null, hovered = null;

function select(id, fromNav){
  const grp = islands.find(g=>g.userData.id === id);
  const d = DATA[id];
  focused = grp;
  panel.style.setProperty('--accent', d.accent);
  $('p-kind').textContent = d.kind;
  $('p-title').textContent = d.name;
  $('p-status').hidden = !d.status; $('p-status').textContent = d.status || '';
  $('p-desc').textContent = d.desc;
  $('p-stack').innerHTML = d.stack.map(s=>'<li>'+s+'</li>').join('');
  $('p-action').textContent = d.action;
  const a = $('p-link');
  if(d.link){ a.hidden = false; a.href = d.link.href; a.textContent = d.link.label; } else a.hidden = true;
  panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
  document.body.classList.add('panel-open');
  nav.querySelectorAll('button').forEach(b=> b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  if(id === 'about'){
    want.target.set(0, 1.4, 0); want.radius = 11; want.phi = 1.18;
  } else {
    const p = grp.position;
    want.target.set(p.x, grp.userData.baseY + 1.2, p.z);
    want.radius = 8.5; want.phi = 1.2;
    want.theta = nearestAngle(cam.theta, Math.atan2(p.x, p.z));
  }
  if(fromNav) $('close').focus({preventScroll:true});
}
function closePanel(){
  focused = null;
  panel.classList.remove('open'); panel.setAttribute('aria-hidden','true');
  document.body.classList.remove('panel-open');
  nav.querySelectorAll('button').forEach(b=> b.setAttribute('aria-pressed','false'));
  want.target.copy(HOME); want.radius = 21; want.phi = 1.12;
}
function step(dir){
  const cur = focused ? ORDER.indexOf(focused.userData.id) : -1;
  const next = (cur + dir + ORDER.length) % ORDER.length;
  select(ORDER[next]);
}
$('close').addEventListener('click', closePanel);
$('prev').addEventListener('click', ()=>step(-1));
$('next').addEventListener('click', ()=>step(1));
addEventListener('keydown', e=>{
  if(e.key === 'Escape') closePanel();
  if(e.key === 'ArrowRight') step(1);
  if(e.key === 'ArrowLeft') step(-1);
});

/* ---------- Pointer ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const tip = $('tip');
function pick(x, y){
  ndc.set(x/innerWidth*2 - 1, -(y/innerHeight)*2 + 1);
  ray.setFromCamera(ndc, camera);
  for(const h of ray.intersectObjects(islands, true)){
    if(!h.object.isMesh) continue;
    let o = h.object; while(o && !o.userData.id) o = o.parent;
    if(o) return o;
  }
  return null;
}
let drag = null;
canvas.addEventListener('pointerdown', e=>{
  drag = {x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e=>{
  if(drag){
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if(Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) canvas.classList.add('dragging');
    want.theta -= dx*.006;
    want.phi = Math.min(1.45, Math.max(.45, want.phi - dy*.004));
    return;
  }
  hovered = pick(e.clientX, e.clientY);
  canvas.style.cursor = hovered ? 'pointer' : '';
  if(hovered){
    tip.textContent = DATA[hovered.userData.id].name;
    tip.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY + 14) + 'px)';
    tip.style.opacity = 1;
  } else tip.style.opacity = 0;
});
canvas.addEventListener('pointerup', e=>{
  if(!drag) return;
  const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
  drag = null; canvas.classList.remove('dragging');
  if(moved < 6){
    const g = pick(e.clientX, e.clientY);
    if(g){
      if(focused !== g) select(g.userData.id);
      g.userData.action && g.userData.action();
    }
  }
});
canvas.addEventListener('pointerleave', ()=>{ hovered = null; tip.style.opacity = 0; });
canvas.addEventListener('wheel', e=>{
  e.preventDefault();
  want.radius = Math.min(34, Math.max(5, want.radius*(1 + e.deltaY*.001)));
}, {passive:false});

addEventListener('resize', ()=>{
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

/* ---------- Loop ---------- */
const clock = new THREE.Clock();
let started = false;
function frame(){
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  const k = 1 - Math.exp(-dt*2.6);

  islands.forEach((g,i)=>{
    const u = g.userData;
    const active = g === hovered || g === focused;
    u.lift += ((active ? .35 : 0) - u.lift)*k*1.5;
    g.position.y = u.baseY + Math.sin(t*.6 + i*1.7)*.25*motion + u.lift;
    if(u.id !== 'about') g.rotation.y = u.baseRot + Math.sin(t*.3 + i)*.05*motion;
    if(u.halo) u.halo.material.opacity += ((active ? .95 : u.haloBase) - u.halo.material.opacity)*k*2;
    u.update && u.update(dt, t);
  });

  for(let i=0;i<FN;i++){
    const b = ffBase[i];
    ffPos[i*3]   = b[0] + Math.sin(t*.4 + b[3])*1.2*motion;
    ffPos[i*3+1] = b[1] + Math.sin(t*.7 + b[3]*2)*.6*motion;
    ffPos[i*3+2] = b[2] + Math.cos(t*.35 + b[3])*1.2*motion;
  }
  ffGeo.attributes.position.needsUpdate = true;
  ffMat.opacity = .7 + Math.sin(t*2)*.2;
  clouds.rotation.y += dt*.012*motion;
  stars.rotation.y += dt*.002;

  if(!focused && !drag && !reduce) want.theta += dt*.035;
  cam.theta += (want.theta - cam.theta)*k;
  cam.phi += (want.phi - cam.phi)*k;
  cam.radius += (want.radius - cam.radius)*k*(started ? 1 : .55);
  cam.target.lerp(want.target, k);
  const s = Math.sin(cam.phi);
  camera.position.set(
    cam.target.x + cam.radius*s*Math.sin(cam.theta),
    cam.target.y + cam.radius*Math.cos(cam.phi),
    cam.target.z + cam.radius*s*Math.cos(cam.theta));
  camera.lookAt(cam.target);
  if(Math.abs(cam.radius - want.radius) < 1) started = true;

  const open = panel.classList.contains('open'), wide = innerWidth > 760;
  off.x += ((open && wide ? 190 : 0) - off.x)*k;
  off.y += ((open && !wide ? innerHeight*.25 : 0) - off.y)*k;
  camera.setViewOffset(innerWidth, innerHeight, off.x, off.y, innerWidth, innerHeight);

  renderer.render(scene, camera);
}
frame();
requestAnimationFrame(()=>document.body.classList.add('ready'));
})();
