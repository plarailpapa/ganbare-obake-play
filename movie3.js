// がんばれおばけ！ 3 面の 最後「太陽に 追いつけ！」の 映画 (10/28 社長「HD-2D の ような 世界」): 立ち絵の おばけが 立体の 宇宙を 駆け抜ける (操作 なし、コース・輪・速さの 表示も なし)
// 海王星 → 天王星 → 土星 → 木星を 次々に 抜き (横から)、火星を 抜く 時に 遠くの 太陽と その 周りを 回る 地球を とらえ (後ろから)、最後の 力を 振り絞って 地球へ (前から → 後ろから)。ここまで 当たり・はずれ 同じ
// 当たり = 地球の 日本へ グーンと 飛んで いく (真っ白は index.html) / はずれ = 太陽と 地球が 先へ 遠ざかり、おばけは 宇宙に 残る (結果発表で 神様が 慰める)
// 座標: おばけの 走る 向き +X・上 +Y (横から 見る カメラは +Z 側)。時刻 t = 最後の 輪 (141.95 秒) からの 秒。rev = 曲が 大きく 戻る 瞬間、white = 最後の 和音 (index.html の CUT3)
import * as THREE from 'three';

export const T_SIDE = 1.4; const T_REAR = 12.4, PUSH = 1.6, SPLIT = 2.6;   // 立ち絵に なって 横から (カメラが 寄って パッと 光った 所) / 火星と 遠くの 太陽・地球 (曲が 一瞬 静まる 前) / 分かれる 瞬間からの 前からの 大写し の 秒 / そこから 当たり・はずれが 分かれる まで
const GH = 1.6, V = 16;   // 立ち絵の 高さ / 惑星が 後ろへ 流れる 速さ (横から の 間)
const PASS = [   // 抜く 惑星 (横から): 模様・半径・おばけの 真横を 過ぎる 時刻・奥 (−Z = おばけの 向こう、+ = 手前)・高さ・環・流れる 速さの 割合
  { tex:'2k_neptune.jpg', r:5, at:3.9, z:-30, y:-2.5 },
  { tex:'2k_uranus.jpg', r:1.6, at:6.5, z:2.5, y:-1.6, ring:'uranus', vk:0.45 },   /* 天王星は おばけの 手前を 下寄りに 通る (おばけの 下半分を 隠しながら、10/28 社長「手前を 通る 星も 1 個」)。近いと 画面を 速く 流れるので ゆっくり (約 1 秒で 横切る) */
  { tex:'2k_saturn.jpg', r:8, at:9.1, z:-42, y:-1.5, ring:'saturn' },
  { tex:'2k_jupiter.jpg', r:15, at:11.7, z:-70, y:-5 },
];
const MARS = { tex:'2k_mars.jpg', r:3.5, at:13.7, v:30, z:-5, y:-2.2 };   // 火星 (後ろから の 間に 左を 過ぎる)
const SUN0 = new THREE.Vector3(230, 20, 60), SUN_R = 10, ORBIT = 36, EARTH_R = 2.2, EARTH_W = 0.55;   // 遠くの 太陽 (後ろから 見て 少し 右上) / 地球の 回る 半径・大きさ・速さ (rad/秒)
const ORB_U = new THREE.Vector3(-0.25, 0, 0.97).normalize(), ORB_V = new THREE.Vector3(0.55, 0.83, 0.13).normalize();   // 地球の 回る 面 (こちらへ 傾けて 楕円に 見せる)
const JP_LON = 139.7, JP_LAT = 35.7;   // 東京 あたり (opening.js と 同じ)
const sm = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
function texDir(lonDeg, latDeg, out){ const phi = (lonDeg + 180) / 360 * Math.PI * 2, th = (90 - latDeg) * Math.PI / 180; return out.set(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)); }   // 球の 模様の 経度・緯度 → 向き (opening.js と 同じ)

function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function ringTex(){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 40, 64, 64, 64); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.6, 'rgba(255,255,255,0.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }   // 光の 輪 (最後の 力の 瞬間)
function backCanvas(img){   // 立ち絵の 後ろ姿: 形は 同じ (左右 反対)・顔と 手は 描かず 体の 色で 塗り、ふちだけ 輪郭の 色
  const w = img.width, h = img.height, a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = b.width = w; a.height = b.height = h;
  const ga = a.getContext('2d'), gb = b.getContext('2d'), k = 0.985;
  ga.translate(w, 0); ga.scale(-1, 1); ga.drawImage(img, 0, 0); ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-in'; ga.fillStyle = '#4f4542'; ga.fillRect(0, 0, w, h);
  gb.translate(w / 2, h * 0.55); gb.scale(-k, k); gb.translate(-w / 2, -h * 0.55); gb.drawImage(img, 0, 0); gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'source-in';
  const lg = gb.createLinearGradient(0, h * 0.15, 0, h * 0.9); lg.addColorStop(0, '#f4f7ff'); lg.addColorStop(1, '#dfe8fb'); gb.fillStyle = lg; gb.fillRect(0, 0, w, h);
  ga.globalCompositeOperation = 'source-atop'; ga.drawImage(b, 0, 0); return a;
}

export function createMovie3({ renderer, mobile = false, front = 'assets/chara/obake-ganbaru.png', rev = 14.47, white = 19.56 }){   // rev・white = 最後の 輪からの 秒 (曲が 大きく 戻る 瞬間・最後の 和音)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
  const loader = new THREE.TextureLoader(), owned = [];
  let dead = false;   // 片づけ 済み (後から 画像が 読めても 用意しない)
  const prep = t => { owned.push(t); return t; }, ready = t => { if(renderer && !dead) renderer.initTexture(t); };   // 読めたら 先に 用意 (初めて 出る 時に カクつかない)。片づけた 後は しない (捨てた 画像を 作り直して 残した、Codex 指摘 10/28)
  const tex = f => { const t = loader.load('planets/' + f, ready); t.colorSpace = THREE.SRGBColorSpace; return prep(t); };
  const glow = prep(glowTex()), ring = prep(ringTex()), add = THREE.AdditiveBlending;
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sunLight = new THREE.DirectionalLight(0xfff2dd, 3.0); scene.add(sunLight, sunLight.target);

  const stars = (() => { const n = mobile ? 900 : 1600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);   // 星空 (カメラに ついて 回る = 遠い)
    for(let i = 0; i < n; i++){ const z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z); pos.set([Math.cos(a) * r * 900, z * 900, Math.sin(a) * r * 900], i * 3); const w = 0.6 + Math.random() * 0.4, tint = Math.random(); col.set([w, w * (0.9 + 0.1 * tint), w * (0.85 + 0.15 * (1 - tint))], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size:1.8, sizeAttenuation:false, vertexColors:true, depthWrite:false })); p.frustumCulled = false; scene.add(p); return p; })();

  function planet(p){   // 惑星 (光が 当たる 側が 明るい)。環は 2 面と 同じ 画像
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(p.r, 48, 24), new THREE.MeshStandardMaterial({ map:tex(p.tex), roughness:1, metalness:0 })); g.add(body);
    if(p.ring === 'saturn'){ const rg = new THREE.RingGeometry(p.r * 1.3, p.r * 2.3, 96, 1), uv = rg.attributes.uv, ps = rg.attributes.position;
      for(let i = 0; i < uv.count; i++){ uv.setXY(i, (Math.hypot(ps.getX(i), ps.getY(i)) - p.r * 1.3) / p.r, 0.5); }
      const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map:tex('2k_saturn_ring_alpha.png'), transparent:true, side:THREE.DoubleSide, depthWrite:false })); m.rotation.set(-1.25, 0.25, 0); g.add(m); }
    if(p.ring === 'uranus'){ const m = new THREE.Mesh(new THREE.RingGeometry(p.r * 1.6, p.r * 1.75, 96, 1), new THREE.MeshBasicMaterial({ color:0xbfe8f0, transparent:true, opacity:0.35, side:THREE.DoubleSide, depthWrite:false })); m.rotation.set(0.35, 0.2, 0); g.add(m); }
    g.userData.body = body; g.visible = false; scene.add(g); return g;
  }
  const passes = PASS.map(p => ({ p, g:planet(p) })), mars = planet(MARS);

  const sunG = new THREE.Group(); scene.add(sunG); sunG.visible = false;   // 遠くの 太陽と 地球 (火星の 時から)
  sunG.add(new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 48, 24), new THREE.MeshBasicMaterial({ map:tex('2k_sun.jpg') })));
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xffc870, transparent:true, opacity:0.9, blending:add, depthWrite:false })); sunGlow.scale.setScalar(SUN_R * 9); sunG.add(sunGlow);
  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xffffff, transparent:true, opacity:0.8, blending:add, depthWrite:false })); sunCore.scale.setScalar(SUN_R * 3.2); sunG.add(sunCore);
  const orbit = (() => { const pts = []; for(let i = 0; i <= 128; i++){ const a = i / 128 * Math.PI * 2; pts.push(ORB_U.clone().multiplyScalar(Math.cos(a) * ORBIT).addScaledVector(ORB_V, Math.sin(a) * ORBIT)); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:0x8fc4ff, transparent:true, opacity:0.35, depthWrite:false })); sunG.add(l); return l; })();   // 地球の 通り道 (うすく)
  const earthG = new THREE.Group(), tilt = new THREE.Group(); scene.add(earthG); earthG.add(tilt); earthG.visible = false;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 48), new THREE.MeshStandardMaterial({ map:tex('2k_earth_daymap.jpg'), roughness:1, metalness:0 })); tilt.add(earth);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 96, 48), new THREE.MeshStandardMaterial({ color:0xffffff, alphaMap:prep(loader.load('planets/2k_earth_clouds.jpg', ready)), transparent:true, opacity:0.85, depthWrite:false, roughness:1, metalness:0 })); earth.add(clouds);
  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0x6fb0ff, transparent:true, opacity:0.75, blending:add, depthWrite:false })); earthHalo.scale.setScalar(EARTH_R * 3.4); earthG.add(earthHalo);
  const jp = texDir(JP_LON, JP_LAT, new THREE.Vector3()), jpSpark = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xfff2b0, transparent:true, opacity:0, blending:add, depthWrite:false })); earth.add(jpSpark); jpSpark.position.copy(jp).multiplyScalar(EARTH_R * 1.02);   // 日本に 着いた 時の 光

  const ghostG = new THREE.Group(); scene.add(ghostG);   // 立ち絵の おばけ (前 = がんばる顔 / 後ろ姿)。残像・光・輪・粒も ここに
  const frontTex = prep(loader.load(front, t => { if(dead) return; ready(t); const bc = backCanvas(t.image); backTex.image = bc; backTex.needsUpdate = true; ready(backTex); })); frontTex.colorSpace = THREE.SRGBColorSpace;
  const backTex = prep(new THREE.Texture()); backTex.colorSpace = THREE.SRGBColorSpace;
  const gMat = new THREE.SpriteMaterial({ map:frontTex, transparent:true, alphaTest:0.04, depthWrite:false }), gSpr = new THREE.Sprite(gMat); gSpr.scale.set(GH * 0.75, GH, 1); gSpr.renderOrder = 5; ghostG.add(gSpr);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xbfe0ff, transparent:true, opacity:0.45, blending:add, depthWrite:false })); aura.scale.setScalar(GH * 2.2); aura.renderOrder = 4; ghostG.add(aura);
  const trail = [0.22, 0.14, 0.08, 0.04].map((o, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:frontTex, transparent:true, opacity:o, depthWrite:false })); s.scale.copy(gSpr.scale); s.userData = { o, i:i + 1 }; s.renderOrder = 3; ghostG.add(s); return s; });   // 横から の 間の 残像
  const burst = new THREE.Sprite(new THREE.SpriteMaterial({ map:ring, color:0xfff4c0, transparent:true, opacity:0, blending:add, depthWrite:false })); burst.renderOrder = 6; ghostG.add(burst);
  const sparks = Array.from({ length:mobile ? 18 : 30 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:Math.random() < 0.5 ? 0xfff2b0 : 0xcfe8ff, transparent:true, opacity:0, blending:add, depthWrite:false })); s.userData.d = new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 4); s.renderOrder = 6; ghostG.add(s); return s; });

  const dust = new THREE.Group(); scene.add(dust);   // 手前を 流れる ぼけた 光の 粒 (HD-2D の ぼけ)。いつも おばけの まわり
  const DX = 25, dusts = Array.from({ length:mobile ? 30 : 50 }, () => { const c = [0xffe2a0, 0xbfdcff, 0xffc0e0][(Math.random() * 3) | 0], s = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:c, transparent:true, opacity:0.1 + Math.random() * 0.25, blending:add, depthWrite:false }));
    s.position.set((Math.random() * 2 - 1) * DX, (Math.random() * 2 - 1) * 7, (Math.random() * 2 - 1) * 6); s.scale.setScalar(0.3 + Math.random() * 1.1); dust.add(s); return s; });

  const look = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q1 = new THREE.Quaternion();
  const sunPos = SUN0.clone(), earthPos = new THREE.Vector3(), gPos = new THREE.Vector3(), sunDir = SUN0.clone().normalize();
  let earthA = 2.2, spin = null, dive = null, lose = null, dashDir = null;   // 地球の 回る 角度 / 日本へ 向け 始めた 時の 自転 / 当たりの 道 (分かれる 時に 決める) / はずれの 始まり / 最後の 力で 進む 向き
  const dashD = u => 12 * u + 10 * u * u;   // 最後の 力 (分かれる まで 共通): おばけが 進む 距離

  function frame(a){ camera.aspect = a; camera.fov = Math.min(70, Math.max(38, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(25)) / a) * 180 / Math.PI)); camera.updateProjectionMatrix(); return Math.min(1, a / 1.2); }   // 横の 見える 角度を 約 50° に (縦持ちは 縦を 70° まで)。返す 値 = 横の ずらし の 割合

  function update(t, dt, ok, aspect){   // t = 最後の 輪からの 秒、ok = 当たり、aspect = 画面の 横 ÷ 縦
    const ax = frame(aspect), tR = rev, tW = white, tD = tR + PUSH, tS = tR + SPLIT;
    // 地球: 太陽の まわりを 回る (分かれる 前の 最後の 力で 止まる = 時間が 止まった ように)。はずれは また 回り出して 太陽と 一緒に 遠ざかる
    const wk = t < tD ? 1 : !ok && t >= tS ? sm((t - tS) / 1.5) : 1 - sm((t - tD) / 0.5); earthA += EARTH_W * wk * dt;
    if(lose) sunPos.copy(SUN0).addScaledVector(lose.dir, 900 * sm((t - tS) / 6)); else sunPos.copy(SUN0);
    earthPos.copy(sunPos).addScaledVector(ORB_U, Math.cos(earthA) * ORBIT).addScaledVector(ORB_V, Math.sin(earthA) * ORBIT);
    sunG.position.copy(sunPos); earthG.position.copy(earthPos); earth.rotation.y += 0.1 * dt * (dive ? 0 : 1); clouds.rotation.y += 0.02 * dt;
    for(const o of passes){ o.g.userData.body.rotation.y += 0.15 * dt; } mars.userData.body.rotation.y += 0.2 * dt;

    let face = 'front', lean = 0, trailK = 0, auraK = 0.45, gs = 1, speedK = 1; gPos.set(0, 0.12 * Math.sin(t * 5), 0);
    if(t < T_REAR){   // 横から: 立ち絵の 顔の 大写しから 引いて、右へ 駆ける おばけの 向こうを 惑星が 次々に 過ぎる
      const e = sm((t - T_SIDE) / 1.6), k = (t - T_SIDE) / (T_REAR - T_SIDE);
      v1.set(0.15, 0.25, 2.4); v2.set(ax * 2.2, 0.5 + 0.15 * Math.sin(t * 0.8), 8.4 - 1.4 * sm(k)); camera.position.lerpVectors(v1, v2, e); look.set(ax * 2.2 * e, 0.2, 0);
      lean = -0.15 * e; trailK = e;
      for(const o of passes){ o.g.visible = true; o.g.position.set(V * (o.p.vk ?? 1) * (o.p.at - t), o.p.y, o.p.z); }
      mars.visible = false; sunG.visible = earthG.visible = false;
    } else if(t < tR){   // 後ろから: 左を 火星が 過ぎ、遠くに 太陽と その まわりを 回る 地球
      const u = (t - T_REAR) / (tR - T_REAR); face = 'back';
      camera.position.set(-6 + 0.8 * sm(u), 1.6, 1.4); look.set(40, 1.8, 7);
      for(const o of passes) o.g.visible = false;
      mars.visible = true; mars.position.set(MARS.v * (MARS.at - t), MARS.y, MARS.z); sunG.visible = earthG.visible = true;
    } else if(t < tD){   // 前から: 最後の 力を 振り絞る (曲が 大きく 戻る 瞬間に 光の 輪と 粒)
      const u = (t - tR) / PUSH; auraK = 0.45 + 0.5 * (1 - sm(u)) + 0.25;
      camera.position.set(2.8 - 0.6 * sm(u), 0.35, 1.0 - 0.3 * sm(u)); look.set(0, 0.25, 0);
      mars.visible = true; mars.position.set(MARS.v * (MARS.at - t), MARS.y, MARS.z); sunG.visible = earthG.visible = true;
    } else {   // 後ろから: 地球へ (分かれる まで 共通) → 当たり = 日本へ グーン / はずれ = 遠ざかる 太陽と 地球、おばけは 止まって 残る
      face = 'back'; mars.visible = false; sunG.visible = earthG.visible = true; auraK = 0.7;
      const u = Math.min(1, (t - tD) / (SPLIT - PUSH)), d = dashD(u);
      if(!dashDir) dashDir = earthPos.clone().normalize();   // 最後の 力の 向き = その 時の 地球へ まっすぐ (地球は 止まる)
      if(t < tS || !ok){
        if(!ok && t >= tS && !lose) lose = { g:dashDir.clone().multiplyScalar(dashD(1)), c:camera.position.clone(), dir:SUN0.clone().addScaledVector(dashDir, -dashD(1)).normalize() };   // カメラは 分かれた 所から 続ける
        if(lose){ const w = t - tS, tau = 1.0, vEnd = 32; gPos.copy(lose.g).addScaledVector(dashDir, vEnd * tau * (1 - Math.exp(-w / tau))).y += 0.12 * Math.sin(t * 5); speedK = Math.exp(-w / tau); auraK = 0.7 - 0.45 * sm(w / 3);   // おばけは だんだん 止まる (カメラは 止まって 上へ 引く = おばけが 小さく 残る)
          const cl = sm(w / 4); camera.position.copy(lose.c).add(v1.set(0, 2.5 * cl, 0)).addScaledVector(dashDir, -3 * cl); v2.copy(gPos).lerp(sunPos, 0.35); look.copy(earthPos).lerp(v2, cl); }
        else { gPos.copy(dashDir).multiplyScalar(d).y += 0.12 * Math.sin(t * 5); camera.position.copy(gPos).addScaledVector(dashDir, -4.85).y += 1.2; look.copy(earthPos); }   // おばけの すぐ 後ろから 地球へ (当たりの グーンと 同じ 並び)
        // 日本を おばけの 来る 向きへ (当たりの 時の ため。分かれる まで に なめらかに 回す)
        if(ok){ const k = sm(u); aimJapan(k); }
      } else {   // 当たり: 日本へ グーン (だんだん 速く)、最後の 和音で 着いて 光る。カメラは その 後も 雲へ 近づく (真っ白は index.html)
        if(!dive){ aimJapan(1); earthG.updateMatrixWorld(true); const J = earth.localToWorld(jp.clone().multiplyScalar(EARTH_R)), g0 = dashDir.clone().multiplyScalar(dashD(1)); dive = { J, g0, dir:J.clone().sub(g0).normalize(), d0:J.distanceTo(g0) }; }
        const w = Math.min(1, (t - tS) / Math.max(0.5, tW - tS)), dg = dive.d0 * Math.pow(0.05 / dive.d0, Math.pow(w, 1.6)), over = sm((t - tW) / 1.0);
        gPos.copy(dive.J).addScaledVector(dive.dir, -dg); gs = Math.min(1, Math.max(0.08, dg / (EARTH_R * 4)));
        const back = (4.5 * Math.pow(dg / dive.d0, 0.6) + 0.35) * (1 - 0.7 * over), lift = 1.2 * Math.pow(dg / dive.d0, 0.6) * (1 - over);
        camera.position.copy(dive.J).addScaledVector(dive.dir, -(dg + back)).y += lift; look.lerpVectors(earthPos, dive.J, sm(w * 1.4));
        jpSpark.material.opacity = t >= tW ? Math.max(0, 1 - (t - tW) / 0.8) : 0; jpSpark.scale.setScalar(EARTH_R * (0.3 + 1.2 * sm((t - tW) / 0.5)));
        v1.copy(camera.position).sub(earthPos).normalize(); sunLight.position.copy(earthPos).addScaledVector(v2.copy(sunDir).lerp(v1, sm(w * 1.5)).normalize(), 100); sunLight.target.position.copy(earthPos);   /* 日本は 昼に (光を カメラの 側へ 回す) */
      }
    }
    if(!dive){ sunLight.position.copy(sunDir).multiplyScalar(100); sunLight.target.position.set(0, 0, 0); }

    ghostG.position.copy(gPos); ghostG.scale.setScalar(gs);
    gMat.map = face === 'back' && backTex.image ? backTex : frontTex; gMat.rotation = lean; aura.material.opacity = auraK + 0.08 * Math.sin(t * 7); aura.scale.setScalar(GH * (2.2 + 0.6 * Math.max(0, auraK - 0.45)));
    for(const s of trail){ s.visible = trailK > 0.01; s.material.opacity = s.userData.o * trailK; s.material.rotation = lean; s.position.set(-0.55 * s.userData.i, 0.12 * Math.sin((t - 0.06 * s.userData.i) * 5) - gPos.y, -0.01 * s.userData.i); }
    const bk = (t - tR) / 0.8; burst.material.opacity = bk >= 0 && bk < 1 ? 1 - bk : 0; burst.scale.setScalar(GH * (1 + 6 * sm(bk)));   // 最後の 力: 光の 輪と 粒
    for(const s of sparks){ const k = (t - tR) / 0.9; s.material.opacity = k >= 0 && k < 1 ? 1 - k : 0; s.position.copy(s.userData.d).multiplyScalar(sm(k)); s.scale.setScalar(0.35 * (1 - k * 0.5)); }
    dust.visible = !dive; dust.position.copy(gPos); for(const s of dusts){ s.position.x -= V * 1.3 * speedK * dt; if(s.position.x < -DX) s.position.x += 2 * DX; }
    camera.lookAt(look); stars.position.copy(camera.position);
  }
  function aimJapan(k){   // 日本を 来る 向き (おばけの 分かれる 所 → 地球) へ: 自転を 止め、日本が こちらを 向く 角度へ 回す (k = 0〜1)
    v1.copy(dashDir).multiplyScalar(dashD(1)).sub(earthPos).normalize();
    if(spin === null) spin = earth.rotation.y;
    const want = Math.atan2(v1.x, v1.z) - Math.atan2(jp.x, jp.z); let dd = (want - spin) % (Math.PI * 2); if(dd < 0) dd += Math.PI * 2;
    earth.rotation.y = spin + dd * k;
    v2.copy(jp).applyAxisAngle(new THREE.Vector3(0, 1, 0), spin + dd); tilt.quaternion.identity().slerp(q1.setFromUnitVectors(v2, v1), k);   /* 緯度の 分も こちらへ 傾ける (日本が 正面) */
  }
  function dispose(){ dead = true; scene.traverse(o => { if(o.geometry && !o.isSprite) o.geometry.dispose(); for(const m of (o.material ? [].concat(o.material) : [])) m.dispose(); }); for(const t of owned) t.dispose(); }
  return { scene, camera, update, dispose };
}
