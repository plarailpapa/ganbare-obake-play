// 銀河の 公転を 追う (3 面の 合流、10/28 社長): 棒の 形の 天の川銀河 → うんと 寄ったら オールトの雲が あった → らせんを 描いて 右上へ 進む 太陽系 (水星〜土星) が 少しずつ 大きく
// 縦スクロールの シューティングの 背景のように、カメラに ついて回る 遠景の 板 (createBackdrop) に 描く。板の 中の 長さは 画面の 縦の 半分 = 1 (右 +x・上 +y)
// 遠景は index.html が 銀河の 輪から 最後まで 持つ (世界が 変わっても 太陽系と 光の 筋が 途切れない)。この 世界 (build) は 輪の 窓の 中の 見え方 (始まりの 銀河) だけ
// 部品は 3 面の 説明 (intros.js の galaxyExtra) と 2 面の 説明 (orbitExtra) と 同じ 画像
import * as THREE from 'three';

const DIST = 60000;   // 遠景の 板までの 距離 (空の 球 90000 の 内側)
export const SUN_Y = 0.3;   // コースの 消える 点の 高さ (まん中より 少し 上。index.html の カメラが ここへ 重ねる)。銀河に 寄る 中心も ここ
const SUN_UP = 0.12;   // 太陽系の 太陽は 消える 点より この 分 上 (らせんが おばけの コースに かぶらない、10/28 社長)
const GAL_D0 = 1.7, GAL_ZOOM = 80, SUN_IMG_Y = 0.69;   // はじめの 銀河の 大きさ / 寄る 倍率 (10/28 社長「もっと アップに したら オールトの雲が あった」) / 想像図の 中の 太陽の 位置 (上から 69%、intros.js と 同じ)
const T_GAL = 16, T_OORT = 11.5, T_SYS = 19.5, T_END = 29.3;   // 銀河の 輪からの 秒: 銀河に 寄り 終わる / オールトの雲が 小さく 見え 始める / らせんの 太陽系が 出る / 盛り上がり (太陽に 追いつけ) の 手前
const SC0 = 0.05, SC_END = 0.18;   // 太陽系の 大きさ (土星の 軌道 = 0.53 の 何倍): 出た 時 (おばけ くらい) / 盛り上がりの 手前 (まだ 遠い)
const SYS_V = 0.12, SYS_DIR = -0.54, TRAIL_N = 900;   // 太陽系が 進む 速さ (太陽系の 中の 長さ / 秒) / 進む 向き (画面の 上から 右へ 約 31° = 右上、光の 筋は 左下へ 流れて コースから 外れる) / 光の 筋の 点の 数 (約 15 秒)
const PLANETS = [   // 水星〜土星 (軌道の 半径・大きさ = 太陽系の 中の 長さ、回る 速さ rad/秒 = 10/28 社長「公転が 速い」で 前の 約 0.45 倍、10/28 社長「火星・木星・土星も 入れて ゴージャスに」)
  { r:0.10, s:0.012, w:1.2, tex:'2k_mercury.jpg', col:0xb9b2a8 },
  { r:0.15, s:0.018, w:0.85, tex:'2k_venus_atmosphere.jpg', col:0xe9cf96 },
  { r:0.21, s:0.020, w:0.65, tex:'2k_earth_daymap.jpg', col:0x5aa0ff, earth:true },
  { r:0.27, s:0.015, w:0.5, tex:'2k_mars.jpg', col:0xff6a4a },
  { r:0.40, s:0.045, w:0.3, tex:'2k_jupiter.jpg', col:0xf0c890 },
  { r:0.53, s:0.038, w:0.22, tex:'2k_saturn.jpg', col:0xf6e2a8, ring:true },
];
const FLAT = 0.42;   // 惑星の 回る 面を こちらへ 傾けて 楕円に 見せる (説明の 場面と 同じ 見え方)
const sm = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const band = (t, a, b) => sm((t - a) / (b - a));
const logLerp = (a, b, k) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k);

function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function radialMask(){ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rg = g.createRadialGradient(128, 128, 96, 128, 128, 128); rg.addColorStop(0, '#fff'); rg.addColorStop(1, '#000'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); }   // 丸い ふち (intros.js と 同じ)

export function createBackdrop(opts){   // 遠景: group を 場面に 足し、毎コマ update(カメラ, 銀河の 輪からの 秒, 盛り上がりからの 秒 (まだなら −1), dt)。opts.preview = 輪の 窓の 中 (銀河 だけ)、opts.renderer = 画像を 読めた 時に 先に 用意する (初めて 出る 時に カクつかない)
  let dead = false, pend = 0;   // 片づけ 済み (後から 画像が 読めても 用意しない = 捨てた 画像を 作り直して 残さない、Codex 指摘 10/28) / まだ 届いて いない 画像の 数 (3 面の 始まりで 届くまで 待つ、10/29)
  const loader = new THREE.TextureLoader(), tex = f => { pend++; const t = loader.load('planets/' + f, x => { pend--; if(opts.renderer && !dead) opts.renderer.initTexture(x); }, undefined, () => pend--); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const glow = glowTex(), add = THREE.AdditiveBlending;
  const lay = new THREE.Group(); lay.renderOrder = -5;   // 毎コマ カメラの 前 DIST に 置き、カメラと 同じ 向き

  const gal = new THREE.Group(); gal.rotation.z = -Math.PI / 2; lay.add(gal);   // 天の川銀河の 想像図 (右へ 90° 回す = 太陽の 進む 向き (絵の 左) が 画面の 上)
  const galMat = new THREE.MeshBasicMaterial({ map:tex('milkyway_eso1339g_2k.jpg'), alphaMap:radialMask(), transparent:true, blending:add, depthWrite:false, fog:false });
  gal.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), galMat));
  const markM = new THREE.SpriteMaterial({ map:glow, color:0xfff07a, transparent:true, blending:add, depthWrite:false, fog:false }), mark = new THREE.Sprite(markM); lay.add(mark);   // 銀河の 全体の 中の 太陽系の 場所の 光の 印

  let oort = null, oMat = null, sysG = null, sun = null, sg = null, sgM = null, pls = [];
  if(!opts.preview){
    const oN = opts.mobile ? 800 : 1500, oPos = new Float32Array(oN * 3);   // オールトの雲 = 太陽を 包む 点の 殻 (2 面の 説明と 同じ 考え方)
    for(let i = 0; i < oN; i++){ const z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = Math.sqrt(1 - z * z), k = 0.85 + Math.random() * 0.3; oPos.set([Math.cos(a) * rr * k, Math.sin(a) * rr * k, z * k], i * 3); }
    const oGeo = new THREE.BufferGeometry(); oGeo.setAttribute('position', new THREE.BufferAttribute(oPos, 3));
    oMat = new THREE.PointsMaterial({ map:glow, color:0xdfe6ff, size:DIST * 0.008, transparent:true, blending:add, depthWrite:false, fog:false }); oort = new THREE.Points(oGeo, oMat); oort.frustumCulled = false; lay.add(oort);

    sysG = new THREE.Group(); sysG.rotation.z = SYS_DIR; lay.add(sysG);   // 太陽系 (中の 座標で 太陽が +y へ 進む = 画面では 右上。sysG を 逆へ ずらして 太陽は 画面の 同じ 所 = 光の 筋が 左下へ 流れて らせんに 見える)
    sun = new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 16), new THREE.MeshBasicMaterial({ map:tex('2k_sun.jpg'), fog:false })); sysG.add(sun);
    sgM = new THREE.SpriteMaterial({ map:glow, color:0xffd27a, transparent:true, blending:add, depthWrite:false, fog:false }); sg = new THREE.Sprite(sgM); sysG.add(sg);
    pls = PLANETS.map(p => {
      const body = new THREE.Mesh(new THREE.SphereGeometry(p.s, 24, 12), new THREE.MeshBasicMaterial({ map:tex(p.tex), fog:false })); sysG.add(body);
      if(p.ring){ const g = new THREE.RingGeometry(p.s * 1.3, p.s * 2.3, 64, 1), uv = g.attributes.uv, ps = g.attributes.position;   // 土星の 環 (画像は 内から 外への 帯 → 半径で 横に 読む)
        for(let i = 0; i < uv.count; i++){ const rr = Math.hypot(ps.getX(i), ps.getY(i)); uv.setXY(i, (rr - p.s * 1.3) / (p.s * 1.0), 0.5); }
        const ring = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map:tex('2k_saturn_ring_alpha.png'), transparent:true, side:THREE.DoubleSide, depthWrite:false, fog:false })); ring.rotation.x = -1.1; body.add(ring); }
      const pos = new Float32Array(TRAIL_N * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color:p.col, transparent:true, blending:add, depthWrite:false, fog:false })); line.frustumCulled = false; sysG.add(line);
      return { p, body, line, pos, n:0, a:Math.random() * Math.PI * 2 };
    });
  }

  const dirv = new THREE.Vector3(); let sysY = 0;   // sysY = 太陽系の 中の 太陽の 位置 (進んだ 分)
  function update(cam, gT, cT, dt){
    const hh = DIST * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), asp = cam.aspect, fit = Math.min(1, asp * 0.95 / 0.6);   // 画面の 縦の 半分 (板の 上の 1) / 縦持ちでは 太陽系を 画面の 横に 入るように 小さく
    lay.position.copy(cam.position).add(cam.getWorldDirection(dirv).multiplyScalar(DIST)); lay.quaternion.copy(cam.quaternion); lay.scale.setScalar(hh);

    const gD = GAL_D0 * Math.min(1, asp * 1.15) * Math.exp(Math.log(GAL_ZOOM) * sm(gT / T_GAL)), gA = 1 - band(gT, 13, 17);   // 銀河: 太陽の 場所を 中心に うんと 寄って、オールトの雲が 広がる 頃に 消える
    gal.visible = gA > 0.003; gal.scale.setScalar(gD); gal.position.set((SUN_IMG_Y - 0.5) * gD, SUN_Y, -0.02); galMat.opacity = gA;   // 想像図の 太陽の 場所 (中心の 真下 = 右へ 90° 回すと 中心の 左) を 画面の (0, SUN_Y) へ
    markM.opacity = (0.55 + 0.25 * Math.sin(performance.now() / 300)) * (1 - band(gT, 3.5, 8.8)); mark.visible = markM.opacity > 0.01; mark.position.set(0, SUN_Y, 0.01); mark.scale.setScalar(0.06);
    if(!sysG) return;
    const oA = band(gT, T_OORT, T_OORT + 2) * (1 - band(gT, T_SYS, T_SYS + 3)), oK = sm((gT - T_OORT) / 10), oR = 0.02 * Math.exp(Math.log(80) * oK);   // オールトの雲: 銀河に うんと 寄った 所に 小さな 殻 → 画面いっぱいへ (中心は 太陽系の 太陽へ 少しずつ)
    oort.visible = oA > 0.003; oMat.opacity = 0.75 * oA; oort.position.set(0, SUN_Y + SUN_UP * oK, 0); oort.scale.set(oR, oR, oR * 0.05); oort.rotation.z += dt * 0.05;   /* 奥行きは 薄く (大きく 広げても 点が カメラの 近くへ 来て 大きな 粒に ならない) */

    const sA = band(gT, T_SYS, T_SYS + 2), on = gT >= T_SYS;   // 太陽系: はじめから らせんを 描いて 右上へ 進み、少しずつ 大きく (まだ 遠い)
    const sc = logLerp(SC0, SC_END, sm((gT - T_SYS) / (T_END - T_SYS))) * fit;
    sysG.visible = sA > 0.003; sysG.scale.setScalar(sc);
    if(on) sysY += SYS_V * dt;
    sysG.position.set(Math.sin(SYS_DIR) * sysY * sc, SUN_Y + SUN_UP - Math.cos(SYS_DIR) * sysY * sc, 0.03);   // 太陽 (中の (0, sysY) を 回して 画面では (−sin, cos)·sysY·sc = 右上) が 画面の (0, SUN_Y + SUN_UP) に 来る
    sun.position.set(0, sysY, 0); sg.position.copy(sun.position); sg.scale.setScalar(Math.max(0.32, 0.035 / sc)); sun.rotation.y += dt * 0.1; sgM.opacity = (0.7 + 0.1 * Math.sin(performance.now() / 330)) * sA;   // 太陽の 光は 遠くても 画面の 上で 小さく なり すぎない
    for(const q of pls){
      q.a += q.p.w * dt;
      q.body.position.set(Math.cos(q.a) * q.p.r, sysY + Math.sin(q.a) * q.p.r * FLAT, Math.sin(q.a) * q.p.r * 0.3); q.body.rotation.y += dt * 0.3;
      if(on){ q.line.visible = true; if(q.n < TRAIL_N) q.n++; q.pos.copyWithin(3, 0, (TRAIL_N - 1) * 3); q.pos[0] = q.body.position.x; q.pos[1] = q.body.position.y; q.pos[2] = q.body.position.z; q.line.geometry.attributes.position.needsUpdate = true; q.line.geometry.setDrawRange(0, q.n); }
      else q.line.visible = false;
    }
  }
  function dispose(){ dead = true; lay.traverse(o => { if(o.geometry && !o.isSprite) o.geometry.dispose();   /* 光の 板 (Sprite) の 形は three.js 全体の 共用なので 捨てない */
    for(const m of (o.material ? [].concat(o.material) : [])){ if(m.map) m.map.dispose(); if(m.alphaMap) m.alphaMap.dispose(); m.dispose(); } }); }
  return { group:lay, update, dispose, loading:() => pend };
}

export function build(scene, root, P, opts, out){   // 世界: 輪の 窓の 中に 見える 始まりの 銀河 だけ (くぐった 後は index.html の 遠景が 続ける)
  const bd = createBackdrop({ ...opts, preview:true }); scene.add(bd.group); bd.group.visible = false;
  return [(cam, dt, portal) => { if(out.dead) return; bd.group.visible = !!portal; if(portal) bd.update(cam, 0, -1, dt); }];
}

export const CATCHUP = { build(){ return []; } };   // 太陽に 追いつけ の 世界: 景色なし (142 秒から 映画 = movie3.js に 切り替わる、10/28 社長)
