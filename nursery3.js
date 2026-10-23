// がんばれおばけ！ 3 面の最後「？？？の世界」= 子ども部屋 (設計書 2026-10-22-ganbare-obake-nursery-design.md)。本物の比率 (1 mm = MM3 単位) で作り、おばけ (約 1.2 単位) が 約 1 mm = アリより小さく見える
// root の座標: 入口 (ワープの輪) = 原点、+Z = 進む向き、+Y = 上、−X = 右。机の天板の上面 = y 0。真上から見て 左 (+X) = 机・上 (+Z) = ドア・右 (−X) = ベビーベッド (社長 10/22)。天井なし (見下ろすため)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MM3 = 1.2;
export const NURSERY = {
  desk:{x:0, z:550, w:600, d:1200, h:720},                     // 机: 天板の まん中 (mm)・横 (X)・奥行き (Z)・高さ (床から)。入口は 天板の −Z の端の近く
  room:{x0:-2280, x1:320, z0:-950, z1:1650, h:2400},           // 部屋の壁 (X・Z の位置) と 高さ。+X の壁に 机を寄せる
  crib:{x:-1935, z:350, w:650, d:1200, h:950, mattress:450},    // ベビーベッド (右の壁ぞい): 柵の高さ・マットレスの上面 (床から)
  merry:{x:-1935, z:350, y:1450, r:200},                        // メリーの 輪の高さ (床から)・半径
  door:{x:-980, w:800, h:2000},                                 // ドア (+Z の壁の まん中)
  rug:{x:-980, z:350, r:600}
};
const H0 = NURSERY.desk.h;
const TOP_Y = -0.45;   // 天板の上面 = root の y −0.45 (root の原点 = レールの まん中、3 面の ほかの世界と同じく 地面から 0.45 上)
export const p3 = (x, h, z, out = new THREE.Vector3()) => out.set(x * MM3, (h - H0) * MM3 + TOP_Y, z * MM3);   // mm (h = 床からの高さ) → root の座標

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
function blocks(root){   // 机の上の 積み木: 門 (入口から 320 mm 先) → 町 (420〜800 mm、窓のない 四角い建物) → 塔 (遠くに 高く。始まりから 霧の向こうに 見える)
  const L = [];   // [形, x, h (下の面の 高さ、天板から), z, 色, 回転]
  const put = (k, x, y, z, c, ry = 0) => L.push([k, x, y, z, c, ry]);
  put('pillar', -45, 0, 320, 0); put('pillar', 45, 0, 320, 2); put('arch', 0, 80, 320, 1);   // 門 (柱の間 50 mm = レール 3 本が通る)
  put('pillar', -45, 0, 380, 3); put('pillar', 45, 0, 380, 3); put('arch', 0, 80, 380, 5);   // 門は 2 つ続き (トンネルのように)
  const R = seeded(2210);
  for(let z = 440; z <= 780; z += 55) for(const side of [-1, 1]){ for(const lane of [1, 2]){ const x = side * (35 + lane * 50 + (R() - 0.5) * 8), n = 1 + ((R() * 3) | 0), c = (R() * 7) | 0;   // 町: 通り (x = 0 の まわり 70 mm) の 両側に 2 列
    for(let k = 0; k < n; k++) put('cube', x, k * 40, z, (c + k) % 7, (R() - 0.5) * 0.2); if(R() < 0.4) put('roof', x, n * 40, z, (c + 3) % 7); } }
  { let y = 0; for(let k = 0; k < 6; k++){ const big = k % 2 === 0; put(big ? 'pillar' : 'cube', 170, y, 880, k % 7, k * 0.3); y += big ? 80 : 40; } put('roof', 170, y, 880, 0); }   // 塔 (積み上げて 約 360 mm。始まりから 霧の向こうに 見える)

  const G = { cube:new THREE.BoxGeometry(40, 40, 40).translate(0, 20, 0), pillar:new THREE.BoxGeometry(40, 80, 40).translate(0, 40, 0), arch:archGeo(130, 40, 40, 25), roof:prismGeo(40, 26, 40) };
  for(const k in G){ const items = L.filter(o => o[0] === k); if(!items.length) continue; const geo = bakeNight(G[k].scale(MM3, MM3, MM3)), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color:NIGHT, vertexColors:true }), items.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
    items.forEach((o, i) => { im.setMatrixAt(i, m4.compose(p3(o[1], H0 + o[2], o[3], v), q.setFromAxisAngle(AY, o[5]), one)); im.setColorAt(i, col.set(BLOCK_COLS[o[4]])); });
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
  const M = NURSERY.merry, poleX = hw;   // メリー: 部屋の側の 柵から 柱を立て、腕で ベッドの まん中の上へ
  bx(25, M.y + 200 - C.h, 25, poleX, (C.h + M.y + 200) / 2, 0, '#f2f2f6'); bx(poleX, 25, 25, poleX / 2, M.y + 200, 0, '#f2f2f6');
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

/* 部屋 (床・壁・ドア) */
function room(root){ const R = NURSERY.room, w = R.x1 - R.x0, d = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
  const floor = mesh(new THREE.PlaneGeometry(w * MM3, d * MM3).rotateX(-Math.PI / 2), '#c99a66', { map:woodTex([6, 6], '#d8b28a', '120,80,50') }); floor.position.copy(p3(cx, 0, cz)); root.add(floor);
  const wt = wallTex([w / 260, R.h / 260]), wall = (len, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(len * MM3, R.h * MM3), '#ffffff', { map:wt }); m.position.copy(p3(x, R.h / 2, z)); m.rotation.y = ry; root.add(m);
    const b = mesh(new THREE.BoxGeometry(len * MM3, 90 * MM3, 15 * MM3), '#f4efe6'); b.position.copy(p3(x, 45, z)); b.rotation.y = ry; root.add(b); };   // 壁と 幅木
  wall(w, cx, R.z0, 0); wall(w, cx, R.z1, Math.PI); wall(d, R.x0, cz, Math.PI / 2); wall(d, R.x1, cz, -Math.PI / 2);
  const D = NURSERY.door, door = mesh(new THREE.BoxGeometry(D.w * MM3, D.h * MM3, 40 * MM3), '#f1e6d2'); door.position.copy(p3(D.x, D.h / 2, R.z1 - 20)); root.add(door);   // ドア (+Z の壁) と 枠・取っ手
  for(const s of [-1, 1]){ const f = mesh(new THREE.BoxGeometry(70 * MM3, (D.h + 70) * MM3, 60 * MM3), '#e2d2b8'); f.position.copy(p3(D.x + s * (D.w / 2 + 35), (D.h + 70) / 2, R.z1 - 30)); root.add(f); }
  const top = mesh(new THREE.BoxGeometry((D.w + 140) * MM3, 70 * MM3, 60 * MM3), '#e2d2b8'); top.position.copy(p3(D.x, D.h + 35, R.z1 - 30)); root.add(top);
  const knob = mesh(new THREE.SphereGeometry(30 * MM3, 12, 8), '#e8c86a'); knob.position.copy(p3(D.x + D.w / 2 - 90, 1000, R.z1 - 60)); root.add(knob);
}

/* 組み立て (stage3.js の buildWorld から)。out.nursery = { bedGlow, merry }、out.overhead(cam, aspect) = 部屋の真上から 見下ろす (確かめ用 ?room=1・Task 3 の カメラの 行き先) */
export function nurseryWorld(scene, root, P, opts, out){
  const N = NURSERY, Dk = N.desk;
  room(root);
  placeModel(root, out, 'assets/nursery/desk.glb', p3(Dk.x, 0, Dk.z), Math.PI / 2, [Dk.d, Dk.h, Dk.w]);   // 机 (模型の 横長を Z に)。天板の上面 = y 0
  const top = mesh(new THREE.PlaneGeometry(Dk.w * MM3, Dk.d * MM3).rotateX(-Math.PI / 2), '#ffffff', { map:woodTex([1, 2], '#c89a68', '110,70,40'), polygonOffset:true, polygonOffsetFactor:-1 }); top.position.copy(p3(Dk.x, H0 + 0.2, Dk.z)); root.add(top);   // 天板の 木目 (だだっ広い 木の地面)
  placeModel(root, out, 'assets/nursery/chairDesk.glb', p3(Dk.x - Dk.w / 2 - 260, 0, Dk.z), Math.PI / 2, [520, 950, 520]);
  placeModel(root, out, 'assets/nursery/lampRoundTable.glb', p3(200, H0, 1080), 0, [230, 450, 230]);   // 机の 奥の 大きな ランプ (もう 1 つの 塔)
  placeModel(root, out, 'assets/nursery/books.glb', p3(200, H0, 700), Math.PI / 2, [300, 220, 160]);   // 本 (町の横の 崖)
  blocks(root);
  const bear = plush('bear', 180, '#b07a52'), bun = plush('bunny', 180, '#f2d6e4');   // 机の端の ぬいぐるみ 2 つ (間を くぐって 机から 飛び出す。部屋の方 = −X を 向く)
  bear.position.copy(p3(-190, H0, 960)); bear.rotation.y = -Math.PI / 2; bun.position.copy(p3(-190, H0, 1140)); bun.rotation.y = -Math.PI / 2; root.add(bear, bun);
  placeModel(root, out, 'assets/nursery/rugRound.glb', p3(N.rug.x, 0, N.rug.z), 0, [N.rug.r * 2, 12, N.rug.r * 2]);
  const bigBear = plush('bear', 380, '#c08a5c'), bigBun = plush('bunny', 330, '#f4f0f6'); bigBear.position.copy(p3(-760, 0, 700)); bigBear.rotation.y = Math.PI * 0.85; bigBun.position.copy(p3(-760, 0, 0)); bigBun.rotation.y = Math.PI * 0.15; root.add(bigBear, bigBun);   // 床の ぬいぐるみ (間を 抜ける)
  placeModel(root, out, 'assets/car/taxi.glb', p3(-1150, 0, 520), 0.6, [70, 60, 130]); placeModel(root, out, 'assets/car/sedan.glb', p3(-1000, 0, 120), -0.9, [70, 55, 130]);   // 床の おもちゃの車
  const ball = mesh(new THREE.SphereGeometry(70 * MM3, 20, 14), '#ef6f6c'); ball.position.copy(p3(-1300, 70, 250)); root.add(ball);
  placeModel(root, out, 'assets/nursery/cardboardBoxOpen.glb', p3(-450, 0, -700), 0.3, [420, 300, 320]);   // おもちゃ箱
  placeModel(root, out, 'assets/nursery/bookcaseOpenLow.glb', p3(-1500, 0, N.room.z0 + 160), 0, [800, 600, 300]);
  placeModel(root, out, 'assets/nursery/lampRoundTable.glb', p3(-1500, 600, N.room.z0 + 160), 0, [180, 330, 180]);   // 常夜灯 (本棚の上)
  const nl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(), color:0xffc98a, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false })); nl.position.copy(p3(-1500, 860, N.room.z0 + 160)); nl.scale.setScalar(700 * MM3); root.add(nl);
  placeModel(root, out, 'assets/nursery/pillow.glb', p3(-1300, 0, 800), 0.4, [300, 120, 300]);
  crib(root, out);
  scene.fog = new THREE.Fog(0x24163a, 250 * MM3, 2200 * MM3);   // 夜の 紫の もや: 机の上からは 部屋の奥が 見えない (何か分からない、社長)
  const C = new THREE.Vector3(), up = new THREE.Vector3(), Cw = new THREE.Vector3();
  out.overhead = (cam, aspect) => { scene.fog.near = 1e6; scene.fog.far = 2e6;   /* 見下ろしでは もやを なくす (高い所からだと 部屋が全部 もやに埋もれて 紫の四角になる、10/23 社長) */
    const R = N.room, hh = (R.z1 - R.z0) / 2 * 1.08 * MM3, hw = (R.x1 - R.x0) / 2 * 1.08 * MM3, t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), Hh = Math.max(hh / t, hw / (t * aspect)) + R.h * MM3;   // 部屋が 縦長でも横長でも 入る高さ
    root.updateMatrixWorld(); root.localToWorld(p3((R.x0 + R.x1) / 2, 0, (R.z0 + R.z1) / 2, Cw)); up.set(0, 1, 0).transformDirection(root.matrixWorld);
    cam.position.copy(Cw).addScaledVector(up, Hh); cam.up.set(0, 0, 1).transformDirection(root.matrixWorld); cam.lookAt(Cw); };   // 上 = ドア (+Z)
  const M = out.nursery.merry;
  return [(cam, dt) => { M.rotation.y += dt * 0.6; }];   // メリーは いつも ゆっくり 回る
}
