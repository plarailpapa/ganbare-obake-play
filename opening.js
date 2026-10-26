// 導入 (10/19): タイトル画面 (雲の上を おばけが うろうろ) → 雲の上の天国で 神様と新人おばけの会話 → 自転の説明 → 1 面へ。設計書 docs/superpowers/specs/2026-10-16-ganbare-obake-opening-design.md
import * as THREE from 'three';
import { cloudTex } from './stage3.js';

const CH = 'assets/chara/';
export const FACES = {
  obake: { egao:CH+'obake-egao.png', ganbaru:CH+'obake-ganbaru.png', shobon:CH+'obake-shobon.png', odoroki:CH+'obake-odoroki.png', eehatena:CH+'obake-eehatena.png', hee:CH+'obake-hee.png', muhyojo:CH+'obake-muhyojo.png' },
  kami: { egao:CH+'kamisama-egao.png', magao:CH+'kamisama-magao.png' }
};

export const OPENING_LINES = [   // 台本 (設計書 3 章)。声は assets/voice/<id>.mp3
  { id:'op-01', who:'obake', face:'muhyojo', cast:['obake'], text:'…あれ？ ここ どこだろう？' },
  { id:'op-02', who:'obake', face:'hee', text:'なんで ここに いるのか わからないけど… おばけに なったみたい' },
  { id:'op-03', who:'obake', face:'egao', text:'おばけに なったからには… ひとを おどろかせて みたい！ 『ばあ！』って！' },
  { id:'op-04', who:'obake', face:'ganbaru', listen:'egao', cast:['obake','kami'], cue:'kamiIn', text:'かみさま！ ひとを おどろかせに いきたいです！' },
  { id:'op-05', who:'kami', face:'magao', listen:'ganbaru', text:'うーん… やめといたら？' },
  { id:'op-06', who:'obake', face:'eehatena', listen:'magao', text:'えー！？ なんで ですか！？' },
  { id:'op-07', who:'kami', face:'magao', listen:'hee', layout:'corner', cue:'earthIn', text:'おばけは ふわふわ うかんでいて、なんでも すりぬけちゃう。{地球|ちきゅう}に ひっぱられないんだ' },
  { id:'op-08', who:'kami', face:'magao', listen:'hee', cue:'spin', text:'そして {地球|ちきゅう}は、こまの ように ずっと まわっている。これを 『{自転|じてん}』 と いうんだ' },
  { id:'op-09', who:'kami', face:'magao', listen:'hee', cue:'japan', text:'にほんの あたりは {時速|じそく} 1,360 km。ひこうきより はやいんだよ' },
  { id:'op-10', who:'kami', face:'magao', listen:'muhyojo', cue:'house', text:'ひとも いえも、{地球|ちきゅう}に ひっぱられて いっしょに うごいている。でも おばけは… ぼーっと していると、おいていかれちゃう' },
  { id:'op-11', who:'obake', face:'odoroki', listen:'magao', cue:'houseHold', text:'えーっ！ それじゃ ひとに あえないよ！' },
  { id:'op-12', who:'kami', face:'egao', listen:'odoroki', cue:'catchUp', text:'ひとを おどろかせたいなら、{地球|ちきゅう}の {自転|じてん}に おいつかないと ね' },
  { id:'op-13', who:'obake', face:'shobon', listen:'egao', layout:'stage', cue:'settle', text:'そんなに はやく とべるかな…' },
  { id:'op-14', who:'obake', face:'ganbaru', listen:'egao', cue:'settle', text:'…ううん、やる！ ぜったい みんなを おどろかせて やるんだ！' },
  { id:'op-15', who:'kami', face:'egao', listen:'ganbaru', cue:'settle', text:'よし、いっておいで！' }
];

export function sparkle(actx){   // 杖の キラキラの音 (高い音 5 つを 0.06 秒ずつ ずらす)
  if(!actx || actx.state !== 'running') return;
  const t0 = actx.currentTime, out = actx.createGain(); out.gain.value = 0.12; out.connect(actx.destination);
  [1568, 2093, 2637, 3136, 4186].forEach((f, i) => {
    const o = actx.createOscillator(), e = actx.createGain(), t = t0 + i * 0.06;
    o.type = 'sine'; o.frequency.value = f;
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(1, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(e).connect(out); o.start(t); o.stop(t + 0.45);
  });
  setTimeout(() => out.disconnect(), 1200);
}

const OP_CSS = `
.ot-root{position:fixed;inset:0;z-index:35;pointer-events:none;font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;transition:opacity .5s ease}
.ot-out{opacity:0}
.ot-logo{position:absolute;left:0;right:0;top:calc(9vh + env(safe-area-inset-top));text-align:center;font-size:clamp(38px,11vw,96px)}
.ot-logo img{width:min(92vw,640px);height:auto;animation:ot-bob 2.4s ease-in-out infinite}
@keyframes ot-bob{50%{transform:translateY(-.12em)}}
.ot-tap{position:absolute;left:0;right:0;bottom:calc(13vh + env(safe-area-inset-bottom));text-align:center;font-size:clamp(18px,5vw,30px);font-weight:bold;color:#fff;text-shadow:0 0 6px rgba(80,60,0,.75),0 0 2px #000;animation:ot-blink 1.4s ease-in-out infinite}
@keyframes ot-blink{50%{opacity:.4}}
.ot-hint{position:absolute;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));text-align:right;font-size:clamp(11px,3vw,14px);line-height:1.5;color:#4a5a7a;opacity:.85}
.op-speed{position:fixed;left:0;right:0;top:calc(5vh + env(safe-area-inset-top));z-index:36;text-align:center;pointer-events:none;font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;font-weight:900;font-size:clamp(26px,7vw,52px);color:#fff;-webkit-text-stroke:.12em #3a7ad8;paint-order:stroke fill;opacity:0;transition:opacity .4s ease}
.op-speed rt{font-size:.38em;-webkit-text-stroke:.1em #3a7ad8}
.op-speed.on{opacity:1}
.op-credit{position:fixed;left:8px;top:calc(6px + env(safe-area-inset-top));z-index:36;max-width:72vw;font:10px/1.4 sans-serif;color:rgba(255,255,255,.82);text-shadow:0 0 3px #000;pointer-events:none;display:none;white-space:pre-line}
`;
function injectCss(){ if(!document.getElementById('op-css')){ const st = document.createElement('style'); st.id = 'op-css'; st.textContent = OP_CSS; document.head.appendChild(st); } }

export function createTitle(root){   // タイトルの文字 (題名・タップで はじめる・操作のヒント)
  injectCss();
  root.className = 'ot-root'; root.hidden = false;
  root.innerHTML = '<div class="ot-logo"><img src="assets/title-logo.png" alt="がんばれおばけ！"></div>'   /* 題名は 絵 (10/26 社長から 届いた 文字の絵。余白を切って 横 1200) */
    + '<div class="ot-tap"></div><div class="ot-hint">ひだり / みぎ を タップで レールを うつる<br>かそくを ふむと はやくなる！</div>';
  const tap = root.querySelector('.ot-tap');
  return {
    setText(s){ tap.textContent = s; },
    hide(){ root.classList.add('ot-out'); },
    dispose(){ root.innerHTML = ''; root.className = ''; root.hidden = true; }
  };
}

function skyTex(){   // 朝の やわらかい空: 上 = 青 → 地平 = 暖かい白 → 下 = 白
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5fa8ee'); gr.addColorStop(0.3, '#8ccaff'); gr.addColorStop(0.48, '#fff1dc'); gr.addColorStop(0.56, '#ffffff'); gr.addColorStop(1, '#ffffff');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function starTex(){   // 宇宙の背景: 深い紺に 星 (大小)・うっすら 天の川の帯
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#04061a'); gr.addColorStop(0.5, '#0a1030'); gr.addColorStop(1, '#04061a'); g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
  for(let i = 0; i < 260; i++){ const x = Math.random() * 2048, y = 512 + Math.sin(x / 2048 * Math.PI * 2) * 120 + (Math.random() - 0.5) * 260, r = 40 + Math.random() * 90, rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(150,140,220,0.06)'); rg.addColorStop(1, 'rgba(150,140,220,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }   // 天の川の帯
  for(let i = 0; i < 2600; i++){ const x = Math.random() * 2048, y = Math.random() * 1024, s = Math.random() < 0.06 ? 2.2 : Math.random() < 0.3 ? 1.4 : 0.8;
    g.fillStyle = `rgba(255,255,${220 + Math.floor(Math.random() * 35)},${0.5 + Math.random() * 0.5})`; g.fillRect(x, y, s, s); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTex(){
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,240,190,0.7)'); rg.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

const WANDER_FACES = ['egao', 'hee', 'shobon', 'egao', 'odoroki', 'muhyojo', 'egao', 'eehatena', 'ganbaru'];   // タイトルで うろうろする おばけの 表情の順 (笑ったり 困ったり)
const GH = 30, GZ = -170, GY = -40;   // うろうろする おばけの 高さ・奥行き・高さの中心 (カメラから 約 175 先、画面の下の方)

// 自転の説明の地球 (設計書 5 章): 雲の海の上、画面の上の方。回る速さは 見て分かるように縮めてある (本物の 1 日 1 周ではない)
const ER = 100, EC = new THREE.Vector3(0, 75, -620), TILT = THREE.MathUtils.degToRad(23.4);
const JP_LON = 139.7, JP_LAT = 35.7, JP_KMH = 1360;   // 東京あたり (速さの数字の 行き先)
const SPIN_IDLE = 0.35, SPIN_FAST = 2 * Math.PI / 6, SPIN_SLOW = 0.12;   // 地球の回る速さ (1 秒あたりの角度): 出てすぐ / 自転の説明 (6 秒で 1 周) / 家の場面
const HOUSE_H = 7, MINI_H = 8, MINI_BEHIND = 8;   // 地面の家と 小さなおばけの 高さ (地球の半径 100 に対して 大きめに) / 追いついた おばけが 止まる所 = 家の 西 (手前) へ この長さ (家に めりこまない、10/21 社長)
const HOUSE_GO = 0.3, HOUSE_WAIT = 2.0, HOUSE_SPIN = 0.06;   // 家の場面で 地球が回る角度 (ラジアン。家が ここまで離れたら 止まる = おばけと家が 両方 画面に入る) / カメラが 寄り終わるまで 待つ秒 / 置いていかれる 回る速さ (5 秒で HOUSE_GO、10/21 社長「ゆっくり」)
const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
function texDir(lonDeg, latDeg, out){   // 球の模様の 経度・緯度 → 球の中心からの向き (three の球の 模様の貼り方。2 面の texDir と同じ)
  const phi = (lonDeg + 180) / 360 * Math.PI * 2, th = (90 - latDeg) * Math.PI / 180;
  return out.set(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th));
}

export function cloudReveal(sec = 2.4){   // 1 面の始まり: 一面の白から、雲のかたまりが 真ん中から外へ 分かれて流れ、晴れていく (10/19 社長「パッと晴れず スムーズに」)
  const cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:45;pointer-events:none';
  document.body.appendChild(cv); const g = cv.getContext('2d');
  const puffs = [];
  for(let i = 0; i < 40; i++){ const r0 = Math.sqrt(Math.random()) * 0.55; puffs.push({ a:Math.random() * Math.PI * 2, r0, s:0.28 + Math.random() * 0.3, d:r0 * 0.5 + Math.random() * 0.15 }); }   // d = 動き出す遅れ (真ん中ほど 早く分かれる)
  const t0 = performance.now();
  const step = now => {
    const k = (now - t0) / 1000 / sec;
    if(k >= 1){ cv.remove(); return; }
    const w = cv.width = Math.round(window.innerWidth * 0.5), h = cv.height = Math.round(window.innerHeight * 0.5), diag = Math.hypot(w, h), m = Math.min(w, h);   // 雲は やわらかいので 半分の細かさで描く (軽く)
    const base = 1 - ease(k / 0.45); if(base > 0){ g.fillStyle = `rgba(255,255,255,${base})`; g.fillRect(0, 0, w, h); }   // 一面の白は 先に薄れ、雲のかたまりが 残って 流れていく
    for(const p of puffs){
      const u = Math.max(0, (k - p.d) / (1 - p.d)), e = u * u, al = 1 - ease(u * 1.1);
      if(al <= 0) continue;
      const r = (p.r0 + e * 0.9) * diag * 0.6, x = w / 2 + Math.cos(p.a) * r, y = h / 2 + Math.sin(p.a) * r * 0.8, rad = p.s * m * (1 + e * 0.6);
      const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, `rgba(255,255,255,${al})`); rg.addColorStop(0.55, `rgba(250,252,255,${al * 0.85})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    requestAnimationFrame(step);
  };
  step(t0);   // 最初の 1 枚は すぐ描く (白い幕と 入れ替える時に 1 コマも すき間を出さない)
}

export function createOpening({ renderer, getKit, actx, extra = null, title = true }){   // extra = 2 面・3 面のはじめの 3D の説明 (intros.js)。title = false なら うろうろの おばけを出さない
  injectCss();
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, 1, 20000);
  scene.fog = new THREE.Fog(0xfff6ea, 700, 4200);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.0); sunLight.position.set(-600, 500, 600); scene.add(sunLight);   // 地球と家だけが 光を受ける (ほかは 光なしの色)
  const owned = [];   // 片づける時に 捨てる 絵
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), new THREE.MeshBasicMaterial({ map:skyTex(), side:THREE.BackSide, fog:false, depthWrite:false }));
  scene.add(sky);
  const glow = glowTex(); owned.push(glow);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xfff2d0, transparent:true, opacity:0.9, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }));
  sun.position.set(-2600, 1400, -6000); sun.scale.setScalar(2600); scene.add(sun);
  const spaceDome = new THREE.Mesh(new THREE.SphereGeometry(8500, 32, 16), new THREE.MeshBasicMaterial({ map:starTex(), side:THREE.BackSide, transparent:true, opacity:0, depthWrite:false, fog:false }));
  spaceDome.renderOrder = -1; spaceDome.visible = false; scene.add(spaceDome); owned.push(spaceDome.material.map);   // 宇宙の背景 (2 面・3 面の 説明の間。雲の海より先に描く)
  const base = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshBasicMaterial({ color:0xfdf8f2, transparent:true }));
  base.rotation.x = -Math.PI / 2; base.position.y = -150; base.renderOrder = -0.5; scene.add(base);   /* 下地は 半透明にできるが 雲より先に描く (後に描くと 雲を隠す) */   // 雲の海の すき間を 白で埋める
  const texs = [cloudTex(['#ffffff', '#fff3e6']), cloudTex(['#ffffff', '#ffeef2']), cloudTex(['#ffffff', '#eef4ff'])]; owned.push(...texs);
  const clouds = [], flatGeo = new THREE.PlaneGeometry(1, 1);
  for(let i = 0; i < 70; i++){   // 雲の海: 寝かせた雲の板を 少しずつ高さを変えて 敷きつめる (上から見下ろす 雲の海)
    const m = new THREE.Mesh(flatGeo, new THREE.MeshBasicMaterial({ map:texs[i % 3], transparent:true, opacity:0.95, depthWrite:false }));
    const z = -60 - Math.random() * 4200, w = 500 + Math.random() * 900;
    m.position.set((Math.random() - 0.5) * (1600 + (-z) * 1.2), -128 + Math.random() * 26, z); m.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2); m.scale.set(w, w * (0.6 + Math.random() * 0.4), 1);
    m.userData.vx = 2 + Math.random() * 4; scene.add(m); clouds.push(m);
  }
  for(let i = 0; i < 26; i++){   // 遠くの もこもこした 雲の頭 (地平線のあたりに 立った板)
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:texs[i % 3], transparent:true, opacity:0.95, depthWrite:false }));
    const z = -1600 - Math.random() * 2600, sc = 300 + Math.random() * 400;
    sp.position.set((Math.random() - 0.5) * (-z) * 2.2, -130 + sc * 0.25, z); sp.scale.set(sc * 1.8, sc, 1); sp.userData.vx = 2 + Math.random() * 4;
    scene.add(sp); clouds.push(sp);
  }
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, transparent:true, opacity:0, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }));
  scene.add(flash);   // 神様が現れる時の キラッ (カメラの前・右上)

  const loader = new THREE.TextureLoader(), ghostTex = {};   // うろうろする おばけの絵: 表情ごとに 右向き (そのまま) と 左向き (左右反転)
  for(const [f, url] of Object.entries(FACES.obake)){
    const a = loader.load(url); a.colorSpace = THREE.SRGBColorSpace;
    const b = a.clone(); b.repeat.x = -1; b.offset.x = 1;
    ghostTex[f] = [a, b]; owned.push(a, b);
  }
  const ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map:ghostTex.egao[0], transparent:true, alphaTest:0.04, depthWrite:false, fog:false }));
  ghost.renderOrder = 10; ghost.scale.set(GH * 0.75, GH, 1); ghost.position.set(0, GY, GZ); scene.add(ghost);
  const gw = { x:0, vx:0, target:0, next:1.5, face:'egao', faceAt:2.5, fi:0, dir:0, hop:-1, fade:-1 };

  let t = 0, flashT = -1, mode = title ? 'title' : 'talk', diveT = -1;
  if(!title) ghost.visible = false;
  const look = new THREE.Vector3(), fwd = new THREE.Vector3(), side = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q1 = new THREE.Quaternion(), north = new THREE.Vector3(), east = new THREE.Vector3();
  const DIVE_TURN = 1.6, DIVE_SEC = 3.2, dv = { p0:new THREE.Vector3(), l0:new THREE.Vector3(), p:new THREE.Vector3(), n:new THREE.Vector3(), c:new THREE.Vector3(), R:2, fit:1 };   // 1 面への出発: 日本を こちらへ 回す 秒 / 全体の秒 / 計算の置き場 (p・n = 回し終えた時の 日本、c = カメラの 行き先)

  // ---- 自転の説明 (Task 2): 星の杖の キラキラ → 地球 → 地軸と矢印 → 日本の印と 速さの数字 → 家と 取り残される おばけ → 追いつく → 消える
  const speedEl = document.createElement('div'); speedEl.className = 'op-speed'; document.body.appendChild(speedEl);
  const creditEl = document.createElement('div'); creditEl.className = 'op-credit'; document.body.appendChild(creditEl);   // 画像の クレジット (使っている間 左上に 小さく、CC BY 4.0)
  let creditImg = '', creditMusic = '';   // 画像の クレジット (説明の 3D の間) / 曲の クレジット (天国の曲が 鳴っている間、10/21)
  const showCredit = () => { const s = [creditImg, creditMusic].filter(Boolean).join('\n'); creditEl.textContent = s; creditEl.style.display = s ? 'block' : 'none'; };
  const credit = s => { creditImg = s || ''; showCredit(); };
  let E = null;   // 地球の一式 (はじめの合図で 作る)
  const earthFit = () => Math.max(0.6, Math.min(1, camera.aspect / 0.8));   // スマホの縦長では 地球を小さめに (右上の神様の絵と 重ならないように)
  const es = { houseA0:0, houseT:0, fitLock:1, appear:-1, spin:SPIN_IDLE, guide:0, guideTo:0, align:null, count:-1, zoom:0, zoomTo:0, zoomP:new THREE.Vector3(), zoomN:new THREE.Vector3(), zoomS:new THREE.Vector3(), zoomE:new THREE.Vector3(), mini:null, catchT:-1 };
  const motes = [];   // 杖から 地球へ 流れる キラキラの粒
  function makeHouse(){
    const g = new THREE.Group(), k = getKit && getKit(), p = k && (k.hA || k.hB);
    if(p){ for(const q of p.parts){ const m = new THREE.Mesh(q.geo, q.mat); m.userData.keep = true; g.add(m); } g.scale.setScalar(HOUSE_H / p.h); }   // 街の部品集の家 (形と材質は ゲーム本体と共用 = 捨てない)
    else { const m = new THREE.MeshStandardMaterial({ color:0xf3d9b0, roughness:1 }), r = new THREE.MeshStandardMaterial({ color:0xc9503c, roughness:1 });   // 部品集が無い時の 簡単な家
      const w = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), m); w.position.y = 2; const rf = new THREE.Mesh(new THREE.ConeGeometry(4.6, 3, 4), r); rf.position.y = 5.5; rf.rotation.y = Math.PI / 4; g.add(w, rf); }
    return g;
  }
  function buildEarth(){
    const day = loader.load('planets/2k_earth_daymap.jpg'); day.colorSpace = THREE.SRGBColorSpace; const cl = loader.load('planets/2k_earth_clouds.jpg'); owned.push(day, cl);
    const grp = new THREE.Group(); grp.position.copy(EC); grp.scale.setScalar(0.001); grp.visible = false; scene.add(grp);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0x9fd0ff, transparent:true, opacity:0.55, depthWrite:false, fog:false, blending:THREE.AdditiveBlending })); halo.scale.setScalar(ER * 2.9); grp.add(halo);
    const tilt = new THREE.Group(); tilt.rotation.z = -TILT; grp.add(tilt);   // 地軸は 23.4° 傾ける (北が 右へ)
    const body = new THREE.Mesh(new THREE.SphereGeometry(ER, 64, 32), new THREE.MeshStandardMaterial({ map:day, roughness:1, metalness:0, fog:false })); tilt.add(body);
    const cloudsM = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.012, 64, 32), new THREE.MeshStandardMaterial({ color:0xffffff, alphaMap:cl, transparent:true, opacity:0.85, depthWrite:false, roughness:1, metalness:0, fog:false })); body.add(cloudsM);
    const axGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -ER * 1.45, 0), new THREE.Vector3(0, ER * 1.45, 0)]);
    const axis = new THREE.Line(axGeo, new THREE.LineDashedMaterial({ color:0xffffff, dashSize:7, gapSize:5, transparent:true, opacity:0, fog:false })); axis.computeLineDistances(); tilt.add(axis);
    const arMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, fog:false });   // 回る向きの矢印 (赤道の外側・手前を 左 → 右 = 西 → 東)
    const arc = new THREE.Mesh(new THREE.TorusGeometry(ER * 1.18, 1.8, 8, 48, Math.PI * 0.9), arMat); arc.rotation.set(Math.PI / 2, 0, Math.PI * 0.05); tilt.add(arc);
    const a0 = Math.PI * 0.05, head = new THREE.Mesh(new THREE.ConeGeometry(5, 13, 12), arMat);
    head.position.set(ER * 1.18 * Math.cos(a0), 0, ER * 1.18 * Math.sin(a0)); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(a0), 0, -Math.cos(a0))); tilt.add(head);
    const jp = texDir(JP_LON, JP_LAT, new THREE.Vector3());
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xffef6b, transparent:true, opacity:0, depthWrite:false, fog:false, blending:THREE.AdditiveBlending })); marker.position.copy(jp).multiplyScalar(ER * 1.03); marker.scale.setScalar(18); body.add(marker);
    const house = makeHouse(); house.position.copy(jp).multiplyScalar(ER); house.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), jp); house.visible = false; body.add(house);
    const mini = new THREE.Sprite(new THREE.SpriteMaterial({ map:ghostTex.hee[0], transparent:true, alphaTest:0.04, depthWrite:false, fog:false })); mini.scale.set(MINI_H * 0.75, MINI_H, 1); mini.visible = false; mini.renderOrder = 11; scene.add(mini);
    return { grp, halo, tilt, body, cloudsM, axis, arMat, marker, house, mini, jp };
  }
  function ensureEarth(instant){   // 途中のセリフから始めても (?op=N) 地球が出ているように
    if(!E) E = buildEarth();
    E.grp.visible = true; credit('地球の画像: Solar System Scope (CC BY 4.0)');   // クレジットは 地球を出す 所で (とばして 出発しても 出る、Codex 指摘 10/21)
    if(instant && es.appear < 0){ es.appear = 99; E.grp.scale.setScalar(1); }
  }
  function jpWorld(p, n){ E.grp.updateMatrixWorld(true); E.body.localToWorld(p.copy(E.jp).multiplyScalar(ER)); n.copy(p).sub(E.grp.position).normalize(); return p; }
  function startMotes(){   // 杖のあたり (画面の右上の神様) から 地球へ キラキラが流れる
    camera.updateMatrixWorld(); camera.getWorldDirection(fwd);
    const from = camera.position.clone().addScaledVector(fwd, 80).add(side.set(28, 6, 0).applyQuaternion(camera.quaternion));
    for(let i = 0; i < 14; i++){
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xfff2b0, transparent:true, opacity:0, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }));
      sp.userData = { t:-i * 0.025, from:from.clone(), mid:from.clone().lerp(EC, 0.5).add(v1.set((Math.random() - 0.5) * 60, 60 + Math.random() * 60, 0)), size:4 + Math.random() * 5 };
      scene.add(sp); motes.push(sp);
    }
  }
  function alignJapan(minTurn = 0.6, dur = 1.4){   // 日本が こちらを向く角度まで くるっと回す (前へ回る向きで いちばん近い角度。minTurn より 小さければ もう 1 周)
    E.grp.updateMatrixWorld(true);
    v1.copy(camera.position).sub(EC).applyQuaternion(E.tilt.getWorldQuaternion(q1).invert());
    const want = Math.atan2(v1.x, v1.z) - Math.atan2(E.jp.x, E.jp.z), cur = E.body.rotation.y;
    let d = (want - cur) % (Math.PI * 2); if(d < 0) d += Math.PI * 2; if(d < minTurn) d += Math.PI * 2;
    es.align = { t:0, from:cur, to:cur + d, dur };
  }
  function earthUpdate(dt){
    for(let i = motes.length - 1; i >= 0; i--){ const sp = motes[i], u = sp.userData; u.t += dt; const k = u.t / 0.7;
      if(k >= 1){ scene.remove(sp); sp.material.dispose(); motes.splice(i, 1); continue; }
      if(k < 0){ sp.material.opacity = 0; continue; }
      v1.copy(u.from).lerp(u.mid, k); v2.copy(u.mid).lerp(EC, k); sp.position.copy(v1).lerp(v2, k); sp.scale.setScalar(u.size * (1 - 0.5 * k)); sp.material.opacity = Math.sin(k * Math.PI) * 0.9 + 0.1; }
    es.zoom += (es.zoomTo - es.zoom) * Math.min(1, dt * 1.6);   /* 地球が消えた後も 元のカメラへ 戻りきるように 先に (Codex 指摘 10/19) */
    if(!E || !E.grp.visible) return;
    const fit = diveT >= 0 ? dv.fit : es.mini ? es.fitLock : earthFit();   /* 出発の間・家の場面の間は 大きさを固定 (途中で 画面を回しても 寄ったカメラが 地球の中に入らない、Codex 指摘 10/19) */
    let size = 1;
    if(es.appear >= 0 && es.appear < 99){ es.appear += dt; const k = Math.max(0, (es.appear - 0.6) / 1.2); size = k >= 1 ? 1 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);   // 小さい → 大きく (少し 行き過ぎて戻る)
      if(k >= 1) es.appear = 99; }
    E.grp.scale.setScalar(Math.max(0.001, size * fit));
    E.halo.material.opacity = 0.55 * (1 - ease(es.zoom));   // 日本へ寄るほど 地球のまわりの光を 弱める (画面が 白っぽくならないように)
    if(es.align){ const a = es.align; a.t += dt; const k = ease(a.t / a.dur); E.body.rotation.y = a.from + (a.to - a.from) * k; if(a.t >= a.dur){ es.align = null; es.spin = diveT >= 0 ? 0 : SPIN_SLOW; } }   /* 出発では 日本を こちらに 向けたまま 止める (まっすぐ 落ちる) */
    else if(diveT < 0) E.body.rotation.y += es.spin * dt;   // 出発の間は 日本を こちらに 向けたまま (家・追いつきの 処理が 速さを 戻しても 回さない、Codex 指摘 10/21)
    E.cloudsM.rotation.y += 0.02 * dt;
    es.guide += (es.guideTo - es.guide) * Math.min(1, dt * 4); E.axis.material.opacity = es.guide * 0.9; E.arMat.opacity = es.guide * 0.85;
    E.marker.material.opacity = es.count >= 0 ? 0.75 + 0.25 * Math.sin(t * 6) : Math.max(0, E.marker.material.opacity - dt * 2);
    if(es.count >= 0){ es.count += dt; const n = Math.round(JP_KMH * ease(es.count / 2)); speedEl.innerHTML = '<ruby>時速<rt>じそく</rt></ruby> ' + n.toLocaleString('en-US') + ' km'; }
    if(es.mini && es.catchT < 0 && !es.align){ es.houseT += dt; const d = E.body.rotation.y - es.houseA0; es.spin = HOUSE_SPIN * Math.max(0, Math.min(1, (es.houseT - HOUSE_WAIT) / 0.8)) * Math.max(0, Math.min(1, (HOUSE_GO - d) / 0.1)); }   // カメラが 寄り終わってから ゆっくり回り始め (10/21 社長)、家が離れるのは HOUSE_GO まで (画面の外へ 出ていかないように、Codex 指摘 10/19)
    if(es.mini){   // 取り残される 小さなおばけ → 追いつく
      const m = E.mini, hp = jpWorld(v1, v2); E.tilt.getWorldQuaternion(q1); east.set(0, 1, 0).applyQuaternion(q1).cross(v2).normalize();   /* 家の所の 東向き = 地軸 × 上向き */
      const target = v1.addScaledVector(v2, MINI_H * 0.7).addScaledVector(east, -MINI_BEHIND);
      if(es.catchT >= 0){ es.catchT += dt; const k = ease(es.catchT / 1.8); m.position.lerpVectors(es.mini, target, k); m.material.map = ghostTex[k < 1 ? 'ganbaru' : 'egao'][0]; if(es.catchT >= 1.8){ es.zoomTo = 0; es.spin = SPIN_SLOW; } }   /* 追いついたら カメラは 元へ。地球は 出したまま また回り始め、おばけは 家と一緒に 乗っていく (10/21 社長) */
      else m.position.copy(es.mini);
    }
  }
  function camRig(){   // 家の場面だけ カメラが 日本の ほぼ真上へ寄る (北が上・東が右。家が 右へ 離れていき、おばけが 取り残されるのを 見下ろす、10/21 社長)
    if(es.zoom < 0.001) return;
    const k = ease(es.zoom);
    const span = MINI_BEHIND + HOUSE_GO * ER * Math.cos(THREE.MathUtils.degToRad(JP_LAT)) * (es.mini ? es.fitLock : earthFit());   // おばけ (家の西 MINI_BEHIND) から 離れていった家まで
    const W = span / 0.7, H = W / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);   // 画面の 横半分の 幅 W・高さ H: 取り残された おばけ = 中央の 少し左 (左から 37%)、離れた家 = 右の 神様の絵の 手前 (左から 72%)。会話の おばけの絵と 重ならない (10/21 社長)
    v2.copy(es.zoomP).addScaledVector(es.zoomE, 0.25 * W - MINI_BEHIND);   // 見る所 = おばけから 東へ 0.25 W
    v1.copy(v2).addScaledVector(es.zoomN, H * Math.cos(0.3)).addScaledVector(es.zoomS, H * Math.sin(0.3));   // 真上から 少しだけ 南へ (家の形が 分かる)
    camera.position.lerp(v1, k); look.lerp(v2, k); camera.up.lerp(north.copy(es.zoomS).negate(), k).normalize(); camera.lookAt(look);
  }

  function wander(dt){
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * (-GZ), range = Math.max(0, Math.min(70, halfW * 0.8 - GH * 0.4));   // 画面の幅に合わせて うろうろの幅を狭める (スマホの縦長)
    gw.next -= dt; if(gw.next <= 0){ gw.target = (Math.random() * 2 - 1) * range; gw.next = 3 + Math.random() * 3; }
    gw.target = Math.max(-range, Math.min(range, gw.target));
    const want = Math.max(-14, Math.min(14, (gw.target - gw.x) * 0.9));
    gw.vx += (want - gw.vx) * Math.min(1, dt * 2.5); gw.x += gw.vx * dt;
    if(Math.abs(gw.vx) > 1.5) gw.dir = gw.vx > 0 ? 0 : 1;
    gw.faceAt -= dt; if(gw.faceAt <= 0){ gw.fi = (gw.fi + 1) % WANDER_FACES.length; gw.face = WANDER_FACES[gw.fi]; gw.faceAt = 2.5 + Math.random() * 1.5; gw.hop = 0; }
    ghost.material.map = ghostTex[gw.face][gw.dir];
    let sq = 1; if(gw.hop >= 0){ gw.hop += dt; const k = gw.hop / 0.35; sq = 1 + 0.08 * Math.sin(Math.min(1, k) * Math.PI); if(k >= 1) gw.hop = -1; }   // 表情が変わる時に 小さく跳ねる
    ghost.position.set(gw.x, GY + 4 * Math.sin(t * 2.2) + (sq - 1) * 30, GZ);
    ghost.scale.set(GH * 0.75 / Math.sqrt(sq), GH * sq, 1);
    ghost.material.rotation = Math.max(-0.2, Math.min(0.2, -gw.vx * 0.012));   // 進む向きに 少し傾く
  }

  function update(dt){
    t += dt;
    camera.position.set(6 * Math.sin(t * 2 * Math.PI / 11), 3 * Math.sin(t * 2 * Math.PI / 9), 0); camera.up.set(0, 1, 0);
    look.set(4 * Math.sin(t * 2 * Math.PI / 13), -10, -400); camera.lookAt(look);
    earthUpdate(dt); camRig(); if(ext) ext.update(dt);
    if(diveT >= 0){   // 1 面への出発 (10/21 社長): 地球を くるっと回して 日本を こちらへ 向けながら、止まらずに 日本へ まっすぐ 近づいて 雲の上へ (最後の 0.6 秒で 白く = index.html、そこから 雲が晴れて 1 面)
      diveT += dt; const u = Math.min(1, diveT / DIVE_SEC);
      camera.position.lerpVectors(dv.p0, dv.c, (1 - Math.pow(dv.R, -Math.pow(u, 2.2))) / (1 - 1 / dv.R));   // 1 つの動きで だんだん速く (いつも 同じ割合で 大きくなる 近づき方を 加速させる。2 段に 分けない、10/21 社長「カクカク」)
      look.lerpVectors(dv.l0, dv.p, ease(Math.min(1, diveT / DIVE_TURN))); camera.lookAt(look);   // 日本が 回ってくる所を 見る
    }
    for(const c of clouds){ c.position.x += c.userData.vx * dt; if(c.position.x > 3200) c.position.x -= 6400; }
    if(Math.abs(spaceTo - spaceK) > 0.001){   // 天国 ⇄ 宇宙: 星空が濃くなり、雲の海・白い下地・天国の太陽が 薄れて消える (10/20 社長: 明るい背景だと 通り道や おばけが見にくい)
      spaceK += (spaceTo - spaceK) * Math.min(1, dt * 2.5); if(Math.abs(spaceTo - spaceK) <= 0.001) spaceK = spaceTo;
      spaceDome.visible = spaceK > 0.001; spaceDome.material.opacity = spaceK;
      for(const c of clouds){ c.material.opacity = 0.95 * (1 - spaceK); c.visible = spaceK < 0.999; }
      base.material.opacity = 1 - spaceK; base.visible = spaceK < 0.999; sun.material.opacity = 0.9 * (1 - spaceK);
    }
    if(ghost.visible){
      wander(dt);
      if(gw.fade >= 0){ gw.fade += dt; ghost.material.opacity = Math.max(0, 1 - gw.fade / 0.5); if(gw.fade >= 0.5) ghost.visible = false; }
    }
    if(flashT >= 0){
      flashT += dt; const k = flashT / 0.6;
      camera.getWorldDirection(fwd);
      flash.position.copy(camera.position).addScaledVector(fwd, 60).add(side.set(22, 14, 0).applyQuaternion(camera.quaternion));
      flash.scale.setScalar(10 + 50 * k); flash.material.opacity = k < 1 ? Math.sin(k * Math.PI) : 0;
      if(k >= 1) flashT = -1;
    }
  }
  function setMode(m){ mode = m; if(m === 'talk' && ghost.visible && gw.fade < 0) gw.fade = 0; }   // 会話が始まると うろうろの おばけは 0.5 秒で消え、会話の画面の おばけに 代わる
  function cue(name, line){
    if(ext){ const r = ext.cue(name, line); if(r !== undefined) return r; }   // 2 面・3 面のはじめの 合図は 先に extra へ
    if(name === 'kamiIn'){ sparkle(actx); flashT = 0; return 0.6; }
    if(name === 'earthIn'){ ensureEarth(false); sparkle(actx); startMotes(); es.appear = 0; E.grp.scale.setScalar(0.001); es.spin = SPIN_IDLE; return 2.0; }
    if(name === 'spin'){ ensureEarth(true); es.guideTo = 1; es.spin = SPIN_FAST; return 1.5; }
    if(name === 'japan'){ ensureEarth(true); alignJapan(); es.count = 0; speedEl.classList.add('on'); return 2.0; }
    if(name === 'house'){   // 日本へ寄る。家は 地球と一緒に 東へ動き、小さなおばけは その場に 取り残される
      ensureEarth(true); if(!es.align && es.spin !== SPIN_SLOW){ alignJapan(); es.align.t = es.align.dur; }   // ?op=10 から始めた時も 日本を こちらへ
      if(es.align){ E.body.rotation.y = es.align.to; es.align = null; } es.spin = 0; es.houseT = 0;   /* カメラが 寄る間は 止めておく */
      es.guideTo = 0; speedEl.classList.remove('on'); es.count = -1;
      es.appear = 99; es.fitLock = earthFit(); E.grp.scale.setScalar(es.fitLock); es.houseA0 = E.body.rotation.y;   /* 寄り先は 大きさが決まった地球で (出てくる途中で 早送りされても 地球の中に入らない、Codex 指摘 10/19) */
      jpWorld(es.zoomP, es.zoomN); E.tilt.getWorldQuaternion(q1); v1.set(0, 1, 0).applyQuaternion(q1);
      es.zoomS.copy(v1).addScaledVector(es.zoomN, -v1.dot(es.zoomN)).normalize().negate(); es.zoomE.crossVectors(es.zoomS, es.zoomN).normalize().negate(); es.zoomTo = 1;
      E.house.visible = true; E.mini.visible = true; E.mini.material.opacity = 1; E.mini.material.map = ghostTex.hee[0];
      es.mini = es.zoomP.clone().addScaledVector(es.zoomN, MINI_H * 0.7).addScaledVector(es.zoomE, -MINI_BEHIND); es.catchT = -1;   /* はじめは 家の すぐ隣 (西) */
      return HOUSE_WAIT + 0.8 + HOUSE_GO / HOUSE_SPIN;   /* 寄る → ゆっくり 置いていかれる まで この行を 出す */
    }
    if(name === 'houseHold'){ if(!es.mini) cue('house'); return 0; }   // op-11 から始めた時も 家の場面に (ふだんは そのまま)
    if(name === 'settle'){ if(!es.mini){ cue('house'); es.catchT = 1.8; es.zoom = es.zoomTo = 0; es.spin = SPIN_SLOW; } return 0; }   // op-13〜15: ?op=13〜15 から 始めた時も 追いついた後の形 (地球・家・おばけ) を出す。ふだんは 何もしない (Codex 指摘 10/21)
    if(name === 'catchUp'){ ensureEarth(true); if(!es.mini) cue('house'); es.catchT = 0; return 3.0; }   // 1.8 秒で 追いつき、カメラが 元へ戻る (地球は 出したまま、10/21 社長)
    return 0;
  }
  function dive(){   // 出発の始まり: いまの カメラから。地球の上の 家と 小さなおばけは しまう (カメラが 中に入らない)
    if(diveT < 0){ diveT = 0; ensureEarth(true); es.appear = 99; dv.fit = es.mini ? es.fitLock : earthFit(); E.grp.scale.setScalar(dv.fit); es.zoomTo = 0;   /* 大きさを 先に 決める (行き先が 地面の中に ならない) */
      es.guideTo = 0; E.house.visible = false; E.mini.visible = false; speedEl.classList.remove('on'); dv.p0.copy(camera.position); dv.l0.copy(look); alignJapan(0, DIVE_TURN);   // 自転の向きに くるっと (日本が もう こちらを向いていれば 回さない)
      const r0 = E.body.rotation.y; E.body.rotation.y = es.align.to; jpWorld(dv.p, dv.n); E.body.rotation.y = r0;   // 回し終えた時の 日本 (そこで 自転を止めるので 動かない)
      v1.subVectors(dv.p0, dv.p).normalize().multiplyScalar(0.3).addScaledVector(dv.n, 0.7).normalize();   // 真上より 少し こちら寄りから 見下ろす
      dv.c.copy(dv.p).addScaledVector(v1, ER * E.grp.scale.x * 0.03); dv.R = Math.max(2, dv.p0.distanceTo(dv.c) / (ER * E.grp.scale.x * 0.03)); }   // 行き先 = 雲の層の すぐ上
    return DIVE_SEC;
  }
  function resize(w, h){ camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function depart(){ return ext ? ext.depart() : dive(); }   // 出発: 導入は 雲へ飛び込む、2 面・3 面のはじめは 説明の 3D の中へ
  function dispose(){   // 形・材質・絵を 1 つずつ 1 回だけ捨てる。Sprite の形は ゲーム本体と共用なので 捨てない (Codex 指摘 10/19)。部品集の家 (keep) も 捨てない
    if(ext) ext.dispose();
    const res = new Set(owned);
    scene.traverse(o => { if(o.userData.keep) return; if(o.geometry && !o.isSprite) res.add(o.geometry); if(o.material){ res.add(o.material); if(o.material.map) res.add(o.material.map); if(o.material.alphaMap) res.add(o.material.alphaMap); } });
    for(const r of res) r.dispose();
    speedEl.remove(); creditEl.remove();
  }
  let spaceK = 0, spaceTo = 0;
  const ext = extra ? extra({ scene, camera, glow, ghostTex, speedEl, sparkle:() => sparkle(actx), loader, earthFit, space:on => { spaceTo = on ? 1 : 0; }, credit }) : null;
  resize(window.innerWidth, window.innerHeight);
  return { scene, camera, update, setMode, cue, dive, depart, resize, dispose, musicCredit:s => { creditMusic = s || ''; showCredit(); }, get mode(){ return mode; } };
}
