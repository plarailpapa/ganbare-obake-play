// がんばれおばけ！ 3 面の最後「？？？の世界」= 子ども部屋 (設計書 2026-10-22-ganbare-obake-nursery-design.md)。本物の比率 (1 mm = MM3 単位) で作り、おばけ (約 1.2 単位) が 約 1 mm = アリより小さく見える
// 部屋の座標 (mm、p3 で 単位へ): 真上から見て 上 = +Z (ドアの壁)・左 = +X・+Y = 上。横長の部屋で 左上 = ドア・左下 = 机・右の壁ぎわ = ベビーベッド (社長 10/26)。天井なし (見下ろすため)
// root の座標 (世界の入口 = ワープの輪 = 原点、+Z = 進む向き): 部屋を 180° 回して 置き、入口 = ドアの前 (NURSERY.entry) から 部屋の中 (下 = 部屋の −Z) へ 進む (10/27 社長「入り口を ドアのあたりから」)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MM3 = 1.2;
const ENTRY = {x:300, z:1500}, GK = Math.log((1 + Math.sqrt(5)) / 2) / (Math.PI / 2), GOLD = {rs:2520, ra:400, re:60, b0:184 * Math.PI / 180 - Math.atan(GK)};   // コースの入口 = ドアの前 / 黄金の らせん (4 分の 1 回るごとに 半径 1/φ、10/27 社長「黄金の回転」): 始まりの 半径・下り始める 半径・終わりの 半径 (ベッドの まん中 近く)・始まりの 角度 (ドアの前から 真下より 4° 右へ 走り出す 向きに なる 角度)
const GC = {x:ENTRY.x + GOLD.rs * Math.cos(GOLD.b0), z:ENTRY.z - GOLD.rs * Math.sin(GOLD.b0)};   // らせんの 中心 (約 −2155, 932) = ベッドと メリーの 中心
export const NURSERY = {
  room:{x0:-3200, x1:800, z0:-1200, z1:1800, h:2400},          // 部屋の壁 (X・Z の位置、mm) と 高さ。横 4 m × 奥 3 m (+X の壁 = 見下ろしの 左、+Z の壁 = 上)
  door:{x:300, w:800, h:2000},                                  // ドア (+Z の壁の 左寄り = 左上)
  entry:ENTRY,                                                  // コースの入口 = ドアの前 (ここから 部屋の中 = −Z へ 走り出す)
  desk:{x:200, z:-900, w:1200, d:600, h:720},                   // 机 (左下の 角): 天板の まん中・横 (X)・奥行き (Z)・高さ (床から)
  crib:{x:GC.x, z:GC.z, w:650, d:1200, h:950, mattress:450},    // ベビーベッド (右寄り。黄金の らせんの 中心に 置くため 右の壁から 約 72 cm 離す、10/27 社長 A 案): 柵の高さ・マットレスの上面 (床から)
  merry:{x:GC.x, z:GC.z, y:1450, r:200},                        // メリーの 輪の高さ (床から)・半径
  rug:{x:-450, z:450, r:550, h:5}                               // まるい ラグ (厚さ 5 mm。12 mm は 段差が 目立った、10/27 社長) (ドア寄りの 上の方。らせんは ラグの 左下の 端を 約 90 cm 横切る = 中心は 通らない、10/27 社長)
};
const FLOOR_Y = -0.45;   // 床 = root の y −0.45 (root の原点 = レールの まん中、3 面の ほかの世界と同じく 地面から 0.45 上)
export const p3 = (x, h, z, out = new THREE.Vector3()) => out.set(x * MM3, h * MM3 + FLOOR_Y, z * MM3);   // mm (h = 床からの高さ) → 部屋の座標の 単位

const NIGHT = new THREE.Color(0.78, 0.64, 1.0), MOON = new THREE.Vector3(0.35, 1, -0.25).normalize();   // 夜の 紫の光 (色に掛ける) / 月明かり (上から 少し斜め)
function bakeNight(geo){   // 夜の光を 頂点の色に 焼き付ける (色だけの材質で 軽く描く。3 面の ほかの世界と同じ考え方)。上向きほど 明るく + 月明かり
  if(!geo.attributes.normal) geo.computeVertexNormals();
  const n = geo.attributes.normal, c = new Float32Array(n.count * 3);
  for(let i = 0; i < n.count; i++){ const ny = n.getY(i), d = Math.max(0, n.getX(i) * MOON.x + ny * MOON.y + n.getZ(i) * MOON.z), k = 0.42 + 0.16 * ny + 0.5 * d; c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
}
const mat = (color, extra = {}) => new THREE.MeshBasicMaterial({ color:new THREE.Color(color).multiply(NIGHT), vertexColors:true, ...extra });
const mesh = (geo, color, extra) => new THREE.Mesh(bakeNight(geo), mat(color, extra));

const loader = new GLTFLoader(), glbCache = new Map();
function loadGLB(path){ if(!glbCache.has(path)) glbCache.set(path, loader.loadAsync(path).then(g => g.scene).catch(e => { console.warn('子ども部屋の部品を読めない', path, e); glbCache.delete(path); return null; })); return glbCache.get(path); }
function placeModel(root, out, path, at, rotY, size){   // 模型を 本物の大きさ (mm、[横 X, 高さ Y, 奥行き Z]) に合わせて 置く。底の まん中 = at (root の座標)
  const g = new THREE.Group(); g.position.copy(at); g.rotation.y = rotY; root.add(g);
  loadGLB(path).then(sc => { if(!sc || out.dead) return; const m = sc.clone(true), box = new THREE.Box3().setFromObject(m), sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    m.traverse(o => { if(o.isMesh){ o.geometry = bakeNight(o.geometry.clone()); o.material = mat(o.material.color, o.material.map ? { map:o.material.map } : {}); } });
    const s = new THREE.Vector3(size[0] * MM3 / sz.x, size[1] * MM3 / sz.y, size[2] * MM3 / sz.z); m.scale.copy(s); m.position.set(-c.x * s.x, -box.min.y * s.y, -c.z * s.z); g.add(m); });
  return g;
}

function canvasTex(w, h, draw, rep){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } t.anisotropy = 4; return t; }
function woodTex(rep, base, line){ return canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h);   // 木目 (縦の筋。机の天板と 床)
  for(let i = 0; i < 90; i++){ const x = Math.random() * w, a = 0.05 + Math.random() * 0.12; g.strokeStyle = `rgba(${line},${a})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); g.moveTo(x, 0); for(let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 6, y); g.stroke(); } }, rep); }
function wallTex(rep){ return canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d9cdf0'; g.fillRect(0, 0, w, h);   // 壁紙: うすい むらさき に 小さな 星と 月 (壁を走る時に 速さが分かる)
  g.fillStyle = '#f6e7a8'; for(const [x, y, r] of [[48, 52, 14], [176, 140, 10], [100, 210, 12]]){ g.beginPath(); for(let k = 0; k < 10; k++){ const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(196, 52, 16, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d9cdf0'; g.beginPath(); g.arc(204, 46, 14, 0, Math.PI * 2); g.fill(); }, rep); }

/* 積み木 (InstancedMesh: 形ごとに 1 つ、色は 1 個ずつ) */
const BLOCK_COLS = ['#e05a4f', '#f2c14e', '#4f86e0', '#5cbf75', '#d9b07a', '#f3eee2', '#b07ad9'];
function archGeo(w, h, d, r){ const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-r, 0); s.absarc(0, 0, r, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();   // 門の上の 半円に くりぬいた積み木
  const g = new THREE.ExtrudeGeometry(s, { depth:d, bevelEnabled:false, curveSegments:12 }); g.translate(0, 0, -d / 2); return g; }
function prismGeo(w, h, d){ const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth:d, bevelEnabled:false }); g.translate(0, 0, -d / 2); return g; }   // 三角の屋根
function blocks(root){   // ラグの上の 積み木あそび (飾り): らせんが ラグの 端を 横切る所に 門 2 つ (トンネル、らせんの 向きに 回す) と その先の 両脇に 互い違いの 塔 3 本 (通り道から 12.5 cm)、ラグの 中ほど (通り道から 24 cm 以上) に 散らばった 積み木 (10/27 社長「ラグの中心を 通らなくても 積み木と 会える」)。置き場所は らせんの 試算から
  const L = [], b = NURSERY.rug.h;   // [形, x, h (下の面の 高さ、床から), z, 色, 回転]
  const put = (k, x, y, z, c, ry = 0) => L.push([k, x, y, z, c, ry]);
  for(const [x, z, ry, c] of [[7, 483, -2.638, 4], [-35, 412, -2.602, 2]]){ const cx = Math.cos(ry) * 60, cz = -Math.sin(ry) * 60; put('pillar', x - cx, b, z - cz, c, ry); put('pillar', x + cx, b, z + cz, c, ry); put('arch', x, b + 120, z, (c + 3) % 7, ry); }   // 門 (柱の間 60 mm。門の 向き = らせんの 進む向き)
  const tower = (x, z, ks) => { let y = b; ks.forEach((k, i) => { put(k, x, y, z, (i * 2 + 1) % 7, i * 0.3); y += k === 'pillar' ? 120 : 60; }); };
  tower(-240, 326, ['pillar', 'cube', 'pillar', 'cube', 'roof']); tower(-127, 62, ['pillar', 'cube', 'pillar', 'roof']); tower(-406, 122, ['cube', 'pillar', 'roof']);   // 塔 (らせんの 左右に 互い違い)
  const R = seeded(2210);
  for(const [x, z] of [[-700, 700], [-850, 450], [-600, 850], [-400, 800], [-900, 250], [-750, 150], [-300, 900], [-150, 700]]) put(['cube', 'cube', 'pillar', 'roof'][(R() * 4) | 0], x, b, z, (R() * 7) | 0, R() * Math.PI);   // 散らばった 積み木
  const G = { cube:new THREE.BoxGeometry(60, 60, 60).translate(0, 30, 0), pillar:new THREE.BoxGeometry(60, 120, 60).translate(0, 60, 0), arch:archGeo(180, 60, 60, 38), roof:prismGeo(60, 40, 60) };
  for(const k in G){ const items = L.filter(o => o[0] === k); if(!items.length) continue; const geo = bakeNight(G[k].scale(MM3, MM3, MM3)), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color:NIGHT, vertexColors:true }), items.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
    items.forEach((o, i) => { im.setMatrixAt(i, m4.compose(p3(o[1], o[2], o[3], v), q.setFromAxisAngle(AY, o[5]), one)); im.setColorAt(i, col.set(BLOCK_COLS[o[4]])); });
    im.computeBoundingSphere(); root.add(im); }
}
function seeded(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const AY = new THREE.Vector3(0, 1, 0);

/* ぬいぐるみ (丸い形を 組み合わせて 作る。座った クマ / ウサギ)。h = 座った高さ (mm)。向き = +Z を 正面に */
function plush(kind, h, color){ const g = new THREE.Group(), u = h / 180, sph = (r, x, y, z, sx = 1, sy = 1, sz = 1, c = color) => { const m = mesh(new THREE.SphereGeometry(r * u * MM3, 20, 14), c); m.position.set(x * u * MM3, y * u * MM3, z * u * MM3); m.scale.set(sx, sy, sz); g.add(m); };
  sph(48, 0, 55, 0, 1, 1.1, 0.9);                                  // からだ
  sph(42, 0, 135, 4);                                              // あたま
  sph(16, -30, 22, 40, 1, 0.9, 1.3); sph(16, 30, 22, 40, 1, 0.9, 1.3);   // 足 (前へ 投げ出す。足の間は あける)
  sph(14, -52, 75, 14, 0.8, 1.3, 0.8); sph(14, 52, 75, 14, 0.8, 1.3, 0.8);   // 手
  sph(15, 0, 125, 38, 1, 0.8, 0.7, '#f3e3d0');                    // 口のまわり
  if(kind === 'bear'){ sph(13, -30, 170, 0); sph(13, 30, 170, 0); }   // 丸い耳
  else { sph(11, -16, 200, -4, 0.7, 2.6, 0.6); sph(11, 16, 200, -4, 0.7, 2.6, 0.6); }   // 長い耳 (ウサギ)
  for(const x of [-15, 15]) sph(4, x, 145, 40, 1, 1, 1, '#2a2030');   // 目
  return g; }

/* ベビーベッド (柵の棒) と メリー */
function crib(root, out){ const C = NURSERY.crib, g = new THREE.Group(); g.position.copy(p3(C.x, 0, C.z)); root.add(g);
  const wood = '#efe2cc', bx = (w, h, d, x, y, z, c = wood) => { const m = mesh(new THREE.BoxGeometry(w * MM3, h * MM3, d * MM3), c); m.position.set(x * MM3, y * MM3, z * MM3); g.add(m); };
  const hw = C.w / 2, hd = C.d / 2;
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) bx(45, C.h, 45, sx * hw, C.h / 2, sz * hd);   // 4 本の 柱
  for(const sx of [-1, 1]){ bx(30, 30, C.d, sx * hw, C.h - 15, 0); bx(30, 40, C.d, sx * hw, 300, 0); }   // 長い側の 上と下の 横木
  for(const sz of [-1, 1]){ bx(C.w, 30, 30, 0, C.h - 15, sz * hd); bx(C.w, 40, 30, 0, 300, sz * hd); }
  const slat = bakeNight(new THREE.BoxGeometry(20 * MM3, (C.h - 340) * MM3, 20 * MM3)), pos = [];   // 柵の棒
  for(let z = -hd + 70; z < hd - 40; z += 70) for(const sx of [-1, 1]) pos.push([sx * hw, z]);
  for(let x = -hw + 70; x < hw - 40; x += 70) for(const sz of [-1, 1]) pos.push([x, sz * hd]);
  const im = new THREE.InstancedMesh(slat, mat(wood), pos.length), m4 = new THREE.Matrix4();
  pos.forEach(([x, z], i) => im.setMatrixAt(i, m4.makeTranslation(x * MM3, (320 + (C.h - 340) / 2) * MM3, z * MM3))); im.computeBoundingSphere(); g.add(im);
  bx(C.w - 40, 120, C.d - 40, 0, C.mattress - 60, 0, '#f6efe6');   // マットレス (から。赤ちゃんは 見せない、社長)
  const glowM = new THREE.SpriteMaterial({ map:glowTex(), color:0xfff2cf, transparent:true, opacity:0.25, blending:THREE.AdditiveBlending, depthWrite:false });   // うっすら光る ベッド (Task 4 で ゴールに向けて 明るく)
  const glow = new THREE.Sprite(glowM); glow.position.set(0, (C.mattress + 40) * MM3, 0); glow.scale.set(C.d * 1.1 * MM3, C.d * 0.9 * MM3, 1); g.add(glow);
  const M = NURSERY.merry, poleX = -hw;   // メリー: 壁側の 柵から 柱を立て、腕で ベッドの まん中の上へ (らせんは 柱から 30 cm 以上 離れる)
  bx(25, M.y + 200 - C.h, 25, poleX, (C.h + M.y + 200) / 2, 0, '#f2f2f6'); bx(hw, 25, 25, poleX / 2, M.y + 200, 0, '#f2f2f6');
  const merry = new THREE.Group(); merry.position.set(0, M.y * MM3, 0); g.add(merry);   // 回る所 (輪と ぶら下がる 星・月・雲・ハート)
  merry.add(mesh(new THREE.TorusGeometry(M.r * MM3, 6 * MM3, 8, 48).rotateX(Math.PI / 2), '#f7d6e8'));
  const hub = mesh(new THREE.CylinderGeometry(4 * MM3, 4 * MM3, 200 * MM3, 6), '#f2f2f6'); hub.position.y = 100 * MM3; merry.add(hub);
  const shapes = [['star', '#f6e07a'], ['moon', '#fff3c4'], ['cloud', '#ffffff'], ['heart', '#f6a6c8'], ['star', '#a6d8f6']];
  shapes.forEach(([k, c], i) => { const a = i / shapes.length * Math.PI * 2, x = Math.cos(a) * M.r, z = Math.sin(a) * M.r, drop = 140 + (i % 2) * 40;
    const str = new THREE.Mesh(new THREE.CylinderGeometry(1.2 * MM3, 1.2 * MM3, drop * MM3, 4), new THREE.MeshBasicMaterial({ color:0xd8d0e8 })); str.position.set(x * MM3, -drop / 2 * MM3, z * MM3); merry.add(str);
    const o = hang(k, c); o.position.set(x * MM3, -drop * MM3, z * MM3); merry.add(o); });
  out.nursery = { bedGlow:glowM, merry };
}
function hang(k, c){ const s = new THREE.Shape(), r = 35;   // メリーに ぶら下がる 形 (平たく 押し出す)
  if(k === 'star'){ for(let i = 0; i < 10; i++){ const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
  else if(k === 'moon'){ s.absarc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7, false); s.absarc(r * 0.45, 0, r * 0.8, Math.PI * 1.55, Math.PI * 0.45, true); }
  else if(k === 'heart'){ s.moveTo(0, -r); s.bezierCurveTo(r * 1.4, -r * 0.1, r * 0.7, r * 1.1, 0, r * 0.4); s.bezierCurveTo(-r * 0.7, r * 1.1, -r * 1.4, -r * 0.1, 0, -r); }
  else { s.absarc(0, 0, r * 0.6, 0, Math.PI * 2, false); }
  const g = new THREE.ExtrudeGeometry(s, { depth:12, bevelEnabled:true, bevelSize:4, bevelThickness:4, bevelSegments:2 }); g.translate(0, 0, -6); g.scale(MM3, MM3, MM3);
  const m = mesh(g, c); if(k === 'cloud'){ for(const [x, y] of [[-26, -4], [26, -4]]){ const b = mesh(new THREE.SphereGeometry(22 * MM3, 14, 10), c); b.position.set(x * MM3, y * MM3, 0); m.add(b); } } return m; }
function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.4, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

/* コース (社長 10/26・10/27): 黄金の らせん (「黄金の回転」、4 分の 1 回るごとに 半径が 1/φ)。部屋の座標 (mm) で 作り、root の座標 (= 世界の入口の座標) に 直した 道のり。レールの まん中は 面から 0.45 (床なら y 0)
   ドアの前の 入口から 真下 (4° 右) へ 走り出し、左回りに 約 2 周 (半径 2.52 m → 6 cm) して ベッドの上の メリーへ 吸い込まれ、らせんの まま ベッドの まん中へ 下りる (10/27 社長「ストンと 下りずに 黄金の 螺旋を 続けながら 降りる」。最後は 斜め 45° 下向き = この先 nextCtrl3 が まっすぐ伸ばす分は マットレスと 床の下に 隠れる)
   途中: ラグの 左下の 端で 積み木の 門 (2 つ続き) を くぐり、そこから レールが ふわっと 浮き上がって 塔の間を 抜け、らせんに 沿って ゆっくり のぼり (いちばん急な所で 約 22°)、メリーの 高さで 回り、半径 40 cm から 下り始めて つり飾り (半径 16〜24 cm・高さ 1.24 m より上) の 下を くぐる (半径 25 cm で 高さ 約 1.17 m)
   marks = 道のりの印 (stage3.js の times と 組で 着く時刻を決める): climb = 浮き上がり始め・merry = メリーの 高さに 着く・down = 下り始め・bed = 終わり */
let nPath = null;
export function nurseryPath(){ if(nPath) return nPath;
  const C = NURSERY.crib, M = NURSERY.merry, RG = NURSERY.rug, SL = 1230, sOf = r => (GOLD.rs - r) * Math.hypot(1, GK) / GK, SM = sOf(587), SA = sOf(GOLD.ra), SE = sOf(GOLD.re), yb = C.mattress + 2;   // 水平の 道のり (mm、らせんの 始まりから): 浮き上がり始め (2 つめの 門の 先)・メリーの 高さに 着く (半径 約 59 cm)・下り始め・終わり / マットレスの 2 mm 上
  const P = [], U = [], at = {};
  const add = (x, y, z, ux = 0, uy = 1, uz = 0) => { P.push(new THREE.Vector3((ENTRY.x - x) * MM3, y * MM3, (ENTRY.z - z) * MM3)); U.push(new THREE.Vector3(-ux, uy, -uz)); };   // 部屋の座標 (mm) → root の座標 (部屋は 180° 回して 置く)。上の向き (なければ 真上)
  const mark = k => { at[k] = P.length - 1; };
  const ss = k => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
  const herm = (a, b, ma, mb, u) => { const u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * ma + (-2 * u3 + 3 * u2) * b + (u3 - u2) * mb; };   // a → b を なめらかに (始まりと終わりの 傾き つき)
  const rugY = (x, z) => RG.h * ss((RG.r + 410 - Math.hypot(x - RG.x, z - RG.z)) / 400);   // ラグの上は 5 mm 高い (ふちの 41 cm 手前から じわっと のぼり 始め = コースに 沿って 約 48 cm・約 2 秒・1° 弱、10/27 社長「段差を 超える所が 急」。ふちの 1 cm 手前で のぼり 切る = レールの 横幅の分も ふちで 埋まらない、10/27 社長「角で めり込んで いる」)
  const yAt = (s, x, z) => s <= SL ? rugY(x, z) : s <= SA ? Math.max(rugY(x, z), M.y * ss((s - SL) / (SM - SL))) : herm(M.y, yb, 0, -(SE - SA), (s - SA) / (SE - SA));   // 高さ: 門まで ラグ・床 → ふわっと 浮き上がって メリーの 高さへ → 下り始めから 終わりへ (終わりの 傾き 45° 下)
  let b = GOLD.b0 + 5 / (GOLD.rs * Math.hypot(1, GK)), s = 0, px = ENTRY.x, pz = ENTRY.z;   // b = らせんの 角度 (始まりの点は 下の add、1 歩目は 5 mm 先から)
  add(px, 0, pz);
  for(;;){ const r = GOLD.rs * Math.exp(-GK * (b - GOLD.b0)); if(r < GOLD.re) break;   // 真上から見た 黄金の らせん (画面で 左回り。画面の右 = −X)
    const x = GC.x - r * Math.cos(b), z = GC.z + r * Math.sin(b); s += Math.hypot(x - px, z - pz); px = x; pz = z;
    add(x, yAt(s, x, z), z);
    if(s > SL && !at.climb) mark('climb'); if(s > SM && !at.merry) mark('merry'); if(s > SA && !at.down) mark('down');
    b += 5 / (r * Math.hypot(1, GK)); }
  mark('bed');
  const cum = new Float64Array(P.length); for(let i = 1; i < P.length; i++) cum[i] = cum[i - 1] + P[i].distanceTo(P[i - 1]);
  const find = sl => { let lo = 0, hi = P.length - 1; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(cum[m] <= sl) lo = m; else hi = m; } return lo; }, frac = (sl, i) => (sl - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i]);
  const marks = {}; for(const k in at) marks[k] = cum[at[k]];
  nPath = { len:cum[P.length - 1], marks,
    at(sl, o){ const s = Math.max(0, Math.min(nPath.len, sl)), i = find(s); return o.copy(P[i]).lerp(P[i + 1], frac(s, i)); },
    upAt(sl, o){ const s = Math.max(0, Math.min(nPath.len, sl)), i = find(s); return o.copy(U[i]).lerp(U[i + 1], frac(s, i)).normalize(); } };
  return nPath; }

/* 部屋 (床・壁・ドア) */
function room(root){ const R = NURSERY.room, w = R.x1 - R.x0, d = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
  const floor = mesh(new THREE.PlaneGeometry(w * MM3, d * MM3).rotateX(-Math.PI / 2), '#c99a66', { map:woodTex([8, 6], '#d8b28a', '120,80,50') }); floor.position.copy(p3(cx, 0, cz)); root.add(floor);
  const wt = wallTex([w / 260, R.h / 260]), wall = (len, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(len * MM3, R.h * MM3), '#ffffff', { map:wt }); m.position.copy(p3(x, R.h / 2, z)); m.rotation.y = ry; root.add(m);
    const b = mesh(new THREE.BoxGeometry(len * MM3, 90 * MM3, 15 * MM3), '#f4efe6'); b.position.copy(p3(x, 45, z)); b.rotation.y = ry; root.add(b); };   // 壁と 幅木
  wall(w, cx, R.z0, 0); wall(w, cx, R.z1, Math.PI); wall(d, R.x0, cz, Math.PI / 2); wall(d, R.x1, cz, -Math.PI / 2);
  const D = NURSERY.door, door = mesh(new THREE.BoxGeometry(D.w * MM3, D.h * MM3, 40 * MM3), '#f1e6d2'); door.position.copy(p3(D.x, D.h / 2, R.z1 - 20)); root.add(door);   // ドア (+Z の壁) と 枠・取っ手
  for(const s of [-1, 1]){ const f = mesh(new THREE.BoxGeometry(70 * MM3, (D.h + 70) * MM3, 60 * MM3), '#e2d2b8'); f.position.copy(p3(D.x + s * (D.w / 2 + 35), (D.h + 70) / 2, R.z1 - 30)); root.add(f); }
  const top = mesh(new THREE.BoxGeometry((D.w + 140) * MM3, 70 * MM3, 60 * MM3), '#e2d2b8'); top.position.copy(p3(D.x, D.h + 35, R.z1 - 30)); root.add(top);
  const knob = mesh(new THREE.SphereGeometry(30 * MM3, 12, 8), '#e8c86a'); knob.position.copy(p3(D.x + D.w / 2 - 90, 1000, R.z1 - 60)); root.add(knob);
}

/* 組み立て (stage3.js の buildWorld から)。out.nursery = { bedGlow, merry }、out.frame(cam, aspect) = 部屋を 見渡す カメラ (部屋の中の 低い所から。確かめ用 ?room=1・引いていく カメラの 行き先)、out.cine = 引いて 寄る カメラ */
const FRAME_PITCH = (+new URLSearchParams(location.search).get('pitch') || 45) * Math.PI / 180;   // 部屋を 見渡す カメラの 見下ろす 角度 (水平から。確かめ用 ?pitch=度)
export function nurseryWorld(scene, world, P, opts, out){   // world = 世界の root (入口の座標)
  const N = NURSERY, Dk = N.desk, root = new THREE.Group(); root.rotation.y = Math.PI; root.position.set(N.entry.x * MM3, 0, N.entry.z * MM3); world.add(root);   // 部屋 (この中は 部屋の座標)。180° 回して 入口 (world の原点) = ドアの前
  room(root);
  placeModel(root, out, 'assets/nursery/desk.glb', p3(Dk.x, 0, Dk.z), Math.PI, [Dk.w, Dk.h, Dk.d]);   // 机 (左下の 角。模型の 横長を X に)
  placeModel(root, out, 'assets/nursery/chairDesk.glb', p3(Dk.x, 0, Dk.z + Dk.d / 2 + 10), Math.PI, [520, 950, 520]);   // いす (机の下へ 押し込む = らせんから 40 cm 以上、10/27)
  placeModel(root, out, 'assets/nursery/lampRoundTable.glb', p3(Dk.x + 350, Dk.h, Dk.z - 150), 0, [230, 450, 230]);   // 机の ランプ
  placeModel(root, out, 'assets/nursery/books.glb', p3(Dk.x - 350, Dk.h, Dk.z - 100), 0.2, [300, 220, 160]);   // 机の 本
  const bear = plush('bear', 180, '#b07a52'); bear.position.copy(p3(Dk.x + 120, Dk.h, Dk.z + 50)); bear.rotation.y = 0.3; root.add(bear);   // 机の上の 小さな クマ
  placeModel(root, out, 'assets/nursery/rugRound.glb', p3(N.rug.x, 0, N.rug.z), 0, [N.rug.r * 2, N.rug.h, N.rug.r * 2]);
  blocks(root);
  const bigBear = plush('bear', 380, '#c08a5c'), bigBun = plush('bunny', 330, '#f4f0f6'), bun = plush('bunny', 180, '#f2d6e4');   // 床の ぬいぐるみ (飾り。おもちゃは コースの そば 7〜20 cm に 並べる、10/27 社長「おもちゃの近くを通って」)
  bigBear.position.copy(p3(-1000, 0, -760)); bigBun.position.copy(p3(-1450, 0, 1450)); bigBun.rotation.y = Math.PI * 0.9; bun.position.copy(p3(-3050, 0, -1050)); bun.rotation.y = 0.4; root.add(bigBear, bigBun, bun);   // 大きな クマは らせんの 下の側で 通り道 (+Z) を 向く (浮き上がった レールが 頭の横を 通る)
  placeModel(root, out, 'assets/car/taxi.glb', p3(-2450, 0, -620), 0.6, [70, 60, 130]); placeModel(root, out, 'assets/car/sedan.glb', p3(450, 0, 700), -0.9, [70, 55, 130]);   // 床の おもちゃの車
  const ball = mesh(new THREE.SphereGeometry(70 * MM3, 20, 14), '#ef6f6c'); ball.position.copy(p3(-2800, 70, -980)); root.add(ball);
  placeModel(root, out, 'assets/nursery/cardboardBoxOpen.glb', p3(-2400, 2, -1035), 0, [420, 300, 320]);   // おもちゃ箱 (右下)。床から 2 mm 浮かせる (底が 床と 重なって ちらついた、10/27 社長)
  placeModel(root, out, 'assets/nursery/pillow.glb', p3(-1950, 0, -1060), 0.2, [300, 120, 300]);
  placeModel(root, out, 'assets/nursery/bookcaseOpenLow.glb', p3(-600, 0, N.room.z1 - 160), Math.PI, [800, 600, 300]);   // 本棚 (上の壁、ドアの すぐ右、10/27 社長)
  placeModel(root, out, 'assets/nursery/lampRoundTable.glb', p3(-600, 600, N.room.z1 - 160), 0, [180, 330, 180]);   // 常夜灯 (本棚の上)
  const nl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(), color:0xffc98a, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false })); nl.position.copy(p3(-600, 860, N.room.z1 - 160)); nl.scale.setScalar(700 * MM3); root.add(nl);
  crib(root, out);
  scene.fog = new THREE.Fog(0x24163a, 250 * MM3, 2200 * MM3);   // 夜の 紫の もや: 床の上からは 部屋の奥が 見えない (何か分からない、社長)
  const Cw = new THREE.Vector3(), cp = new THREE.Vector3(); let fk = 0, fkT = -1e9;   // 画面の形の 係数 (なめらかに 追う) と その時刻
  out.frame = (cam, aspect) => { scene.fog.near = 1e6; scene.fog.far = 2e6;   /* 部屋を 見渡す カメラ (確かめ用 ?room=1・引いていく カメラの 行き先)。もやは なし */
    /* 部屋の中、手前の壁ぎわの 壁より 低い所 (高さ 2.25 m) から 45° 見下ろす: 下向きの 見え方は すべて 壁に 当たるので 部屋の 外 (まっくら) は 映らない (10/27 社長「壁の外が 見えると CG らしさが 上がる」)。
       横長 = 部屋の まん中寄り (らせん・ベッド・メリー・ラグ・本棚が 全部 入る)、縦持ち = ベッドの 正面 (横幅が 狭いので ベッドと らせんの 後半)。間の 形は その間 */
    const now = performance.now() / 1000, kt = Math.min(1, Math.max(0, aspect - 0.5)); fk += (kt - fk) * Math.min(1, (now - fkT) * 3); fkT = now;   // 途中で 縦 ↔ 横 に 回しても 約 0.5 秒で すっと 移る (瞬間移動しない、Codex 指摘 10/27)。久しぶりに 呼ばれた時は すぐ 合わせる
    const R = N.room, x = N.crib.x + (-1250 - N.crib.x) * fk, h = R.h - 150, z = R.z0 + 50;
    world.updateMatrixWorld(); root.localToWorld(p3(x, h, z, cp)); root.localToWorld(p3(x, 0, z + h / Math.tan(FRAME_PITCH), Cw));   // カメラ / 見る点 (画面の まん中 = 床)
    cam.position.copy(cp); cam.up.set(0, 1, 0).transformDirection(root.matrixWorld); cam.lookAt(Cw); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); };
  const CINE_A = 8, CINE_B = 24, NEAR_A = 25, NEAR_B = 35, NEAR_D = 30;   // 引き始め・部屋の 見下ろしに 着く・らせんの 着地点へ 寄り始め (らせんで 下り始める 所)・寄り終わり (= オルゴールの 最後の 和音で 真っ白、10/27) (子ども部屋の 始まりから 秒。8 秒までは 何の場所か 分からない 低い カメラ、10/27 社長「子供部屋と わからない区間を 長く」) / 寄り終わりの 着地点までの 距離 (mm。見下ろしの 向きの まま ぐっと 寄って 画面いっぱい → 白、10/27 社長)
  const cineCam = new THREE.PerspectiveCamera(), cs = { on:false, dA:1, dirA:new THREE.Vector3(), upA:new THREE.Vector3(), offA:new THREE.Vector3() }, lB = new THREE.Vector3(), lL = new THREE.Vector3(), dirB = new THREE.Vector3(), dir = new THREE.Vector3(), look = new THREE.Vector3(), anc = new THREE.Vector3(), qd = new THREE.Quaternion(), qs = new THREE.Quaternion();
  out.cine = (t, cam, aspect, t0, gp) => {   /* 上へ 引き続ける カメラ (設計書 2・3 章): CINE_A 秒の ふだんの カメラ (おばけの後ろ) から CINE_B 秒の 部屋の 見下ろし (frame) へ。遠ざかる割合が 一定 (10/21 の 銀河の引きと 同じ。酔わない)・行き先は 毎コマ 画面の形で 計算し直す (縦 ↔ 横 でも 切れない)。NEAR_A〜NEAR_B 秒は おばけが ストンと 落ちるのに 合わせて ベッドへ 寄る (10/27 社長「一度 引いた カメラが ベッドに 寄って行っても いい」)。gp = おばけ (世界の座標)。戻り値 = このカメラを 使ったか */
    const tn = t - t0, u = (tn - CINE_A) / (CINE_B - CINE_A); if(u < 0){ cs.on = false; return false; }
    if(!cs.on){ cs.on = true; cs.dA = Math.max(1, cam.position.distanceTo(gp)); cs.dirA.copy(cam.position).sub(gp).normalize(); cs.upA.copy(cam.up); cam.getWorldDirection(cs.offA).multiplyScalar(cs.dA).add(cam.position).sub(gp); }   // 引き始めの カメラを 覚える (offA = 見ていた所 − おばけ: ふだんの カメラは 少し先を 見ている)
    cineCam.fov = cam.fov; cineCam.aspect = cam.aspect; out.frame(cineCam, aspect); lB.copy(Cw);   // 部屋の 見下ろし (Cw = frame が 見る点)
    const dB = Math.max(cs.dA, cineCam.position.distanceTo(lB)); dirB.copy(cineCam.position).sub(lB).normalize();
    const k = Math.min(1, u), e = k * k * (3 - 2 * k); let dist = cs.dA * Math.pow(dB / cs.dA, e); const w = ((dist - cs.dA) / Math.max(1e-6, dB - cs.dA)) ** 2;   /* w = 見る点を 部屋の まん中へ 寄せる 割合 (距離の 2 乗: 近い間に 寄せると 縦持ちで おばけが 画面の端へ 出た) */
    const sd = Math.min(1, k / 0.6), sw = sd * sd * (3 - 2 * sd);   // 向きは 前半で 後ろから → 斜め上からへ 回し終える
    qd.setFromUnitVectors(cs.dirA, dirB); qs.identity().slerp(qd, sw); dir.copy(cs.dirA).applyQuaternion(qs);
    anc.copy(gp).lerp(lB, w); look.copy(anc).addScaledVector(cs.offA, 1 - sw);   // 基準: はじめは おばけ → 十分 離れてから 見下ろしの まん中へ (おばけは いつも 画面の 中ほど)。見る所は 引き始めの 向き (少し先) から なめらかに (カクッと しない)
    if(tn > NEAR_A){ const T = nurseryPath(); world.localToWorld(T.at(T.len, lL));   // らせんの 着地点へ 寄る: 部屋の 見下ろしから 同じ 向きの まま 一定の割合で 近づき (NEAR_B 秒に 着地点の NEAR_D 手前)、見る点も 着地点へ (距離の 2 乗で 早めに = 着地点が 画面の まん中へ)
      const k2 = Math.min(1, (tn - NEAR_A) / (NEAR_B - NEAR_A)); dist = dB * Math.pow(NEAR_D * MM3 / dB, k2 * k2 * (3 - 2 * k2)); anc.lerpVectors(lB, lL, 1 - (dist / dB) ** 2); look.copy(anc); }
    cam.position.copy(anc).addScaledVector(dir, dist); cam.up.copy(cs.upA).lerp(cineCam.up, sw).normalize(); cam.lookAt(look);
    cam.near = Math.max(1, dist * 0.05); cam.updateProjectionMatrix();   // 描く範囲の 手前は 離れるほど 遠く (奥行きの 精度。約 1,000 倍の 幅)
    const f = Math.sqrt(Math.max(1, dist / (cs.dA * 4))); scene.fog.near = 250 * MM3 * f; scene.fog.far = 2200 * MM3 * f;   // もやは 引き始めの 4 倍 離れるまで そのまま、その後 引くにつれて 晴れる (子ども部屋だと 分かるのは 16〜18 秒ごろ)
    return true; };
  const M = out.nursery.merry;
  return [(cam, dt) => { M.rotation.y += dt * 0.6; }];   // メリーは いつも ゆっくり 回る
}
