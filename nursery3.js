// がんばれおばけ！ 3 面の最後「？？？の世界」= 子ども部屋 (設計書 2026-10-22-ganbare-obake-nursery-design.md)。本物の比率 (1 mm = MM3 単位) で作り、おばけ (約 1.2 単位) が 約 1 mm = アリより小さく見える
// root の座標: 入口 (ワープの輪) = 原点 = 床の上、+Z = 進む向き、+Y = 上、−X = 右。横長の部屋を 真上から見て (上 = +Z) 左上 = ドア・左下 = 机・右の壁ぎわ = ベビーベッド (社長 10/26)。天井なし (見下ろすため)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MM3 = 1.2;
export const NURSERY = {
  room:{x0:-3200, x1:800, z0:-1200, z1:1800, h:2400},          // 部屋の壁 (X・Z の位置、mm) と 高さ。横 4 m × 奥 3 m (+X の壁 = 見下ろしの 左、+Z の壁 = 上)
  door:{x:300, w:800, h:2000},                                  // ドア (+Z の壁の 左寄り = 左上)
  desk:{x:200, z:-900, w:1200, d:600, h:720},                   // 机 (左下の 角): 天板の まん中・横 (X)・奥行き (Z)・高さ (床から)
  crib:{x:-2875, z:600, w:650, d:1200, h:950, mattress:450},    // ベビーベッド (右の壁ぎわ。部屋側の 長い面 = x −2550): 柵の高さ・マットレスの上面 (床から)
  merry:{x:-2875, z:600, y:1450, r:200},                        // メリーの 輪の高さ (床から)・半径
  rug:{x:-1250, z:-450, r:600, h:12}                            // まるい ラグ (下の まん中。コースの線 = 入口から 少し上 → z 600 を 右へ に かからない)
};
const FLOOR_Y = -0.45;   // 床 = root の y −0.45 (root の原点 = レールの まん中、3 面の ほかの世界と同じく 地面から 0.45 上)
export const p3 = (x, h, z, out = new THREE.Vector3()) => out.set(x * MM3, h * MM3 + FLOOR_Y, z * MM3);   // mm (h = 床からの高さ) → root の座標

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
function blocks(root){   // ラグの上の 積み木あそび (飾り): 塔・門・まわりに 散らばった 積み木
  const L = [], G0 = NURSERY.rug, b = G0.h;   // [形, x, h (下の面の 高さ、床から), z, 色, 回転]
  const put = (k, x, y, z, c, ry = 0) => L.push([k, x, y, z, c, ry]);
  { const x = G0.x + 100, z = G0.z - 50; put('pillar', x, b, z, 0); put('cube', x, b + 120, z, 1, 0.3); put('pillar', x, b + 180, z, 2, 0.1); put('cube', x, b + 300, z, 3, 0.5); put('roof', x, b + 360, z, 0); }   // 塔
  { const x = G0.x - 200, z = G0.z + 200; put('pillar', x - 60, b, z, 4); put('pillar', x + 60, b, z, 4); put('arch', x, b + 120, z, 1); }   // 門
  const R = seeded(2210);
  for(let i = 0; i < 12; i++){ const a = R() * Math.PI * 2, d = 230 + R() * 290, k = ['cube', 'cube', 'pillar', 'roof'][(R() * 4) | 0]; put(k, G0.x + Math.cos(a) * d, b, G0.z + Math.sin(a) * d, (R() * 7) | 0, R() * Math.PI); }   // 散らばった 積み木

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
  const floor = mesh(new THREE.PlaneGeometry(w * MM3, d * MM3).rotateX(-Math.PI / 2), '#c99a66', { map:woodTex([8, 6], '#d8b28a', '120,80,50') }); floor.position.copy(p3(cx, 0, cz)); root.add(floor);
  const wt = wallTex([w / 260, R.h / 260]), wall = (len, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(len * MM3, R.h * MM3), '#ffffff', { map:wt }); m.position.copy(p3(x, R.h / 2, z)); m.rotation.y = ry; root.add(m);
    const b = mesh(new THREE.BoxGeometry(len * MM3, 90 * MM3, 15 * MM3), '#f4efe6'); b.position.copy(p3(x, 45, z)); b.rotation.y = ry; root.add(b); };   // 壁と 幅木
  wall(w, cx, R.z0, 0); wall(w, cx, R.z1, Math.PI); wall(d, R.x0, cz, Math.PI / 2); wall(d, R.x1, cz, -Math.PI / 2);
  const D = NURSERY.door, door = mesh(new THREE.BoxGeometry(D.w * MM3, D.h * MM3, 40 * MM3), '#f1e6d2'); door.position.copy(p3(D.x, D.h / 2, R.z1 - 20)); root.add(door);   // ドア (+Z の壁) と 枠・取っ手
  for(const s of [-1, 1]){ const f = mesh(new THREE.BoxGeometry(70 * MM3, (D.h + 70) * MM3, 60 * MM3), '#e2d2b8'); f.position.copy(p3(D.x + s * (D.w / 2 + 35), (D.h + 70) / 2, R.z1 - 30)); root.add(f); }
  const top = mesh(new THREE.BoxGeometry((D.w + 140) * MM3, 70 * MM3, 60 * MM3), '#e2d2b8'); top.position.copy(p3(D.x, D.h + 35, R.z1 - 30)); root.add(top);
  const knob = mesh(new THREE.SphereGeometry(30 * MM3, 12, 8), '#e8c86a'); knob.position.copy(p3(D.x + D.w / 2 - 90, 1000, R.z1 - 60)); root.add(knob);
}

/* 組み立て (stage3.js の buildWorld から)。out.nursery = { bedGlow, merry }、out.frame(cam, aspect) = 最後の 見下ろし (確かめ用 ?room=1・Task 3 の カメラの 行き先) */
const FRAME_ROLL = 0.28, FRAME_TILT = 12 * Math.PI / 180;   // 横長の 見下ろしで 左に空ける 割合 (スタッフロールの場所) / 真上から 手前 (−Z) へ 倒す角度 (駆け上がる・メリーを回る 高さの動きが 分かるように)
export function nurseryWorld(scene, root, P, opts, out){
  const N = NURSERY, Dk = N.desk;
  room(root);
  placeModel(root, out, 'assets/nursery/desk.glb', p3(Dk.x, 0, Dk.z), Math.PI, [Dk.w, Dk.h, Dk.d]);   // 机 (左下の 角。模型の 横長を X に)
  placeModel(root, out, 'assets/nursery/chairDesk.glb', p3(Dk.x, 0, Dk.z + Dk.d / 2 + 160), Math.PI, [520, 950, 520]);   // いす (机の下へ 少し 入れる = 入口から 180 mm 離す、Codex 指摘 10/27)
  placeModel(root, out, 'assets/nursery/lampRoundTable.glb', p3(Dk.x + 350, Dk.h, Dk.z - 150), 0, [230, 450, 230]);   // 机の ランプ
  placeModel(root, out, 'assets/nursery/books.glb', p3(Dk.x - 350, Dk.h, Dk.z - 100), 0.2, [300, 220, 160]);   // 机の 本
  const bear = plush('bear', 180, '#b07a52'); bear.position.copy(p3(Dk.x + 120, Dk.h, Dk.z + 50)); bear.rotation.y = 0.3; root.add(bear);   // 机の上の 小さな クマ
  placeModel(root, out, 'assets/nursery/rugRound.glb', p3(N.rug.x, 0, N.rug.z), 0, [N.rug.r * 2, N.rug.h, N.rug.r * 2]);
  blocks(root);
  const bigBear = plush('bear', 380, '#c08a5c'), bigBun = plush('bunny', 330, '#f4f0f6'), bun = plush('bunny', 180, '#f2d6e4');   // 床の ぬいぐるみ (飾り。コースの線には 置かない)
  bigBear.position.copy(p3(-600, 0, -750)); bigBear.rotation.y = -0.6; bigBun.position.copy(p3(-2150, 0, 1450)); bigBun.rotation.y = Math.PI * 0.9; bun.position.copy(p3(-2350, 0, -1000)); bun.rotation.y = 0.4; root.add(bigBear, bigBun, bun);
  placeModel(root, out, 'assets/car/taxi.glb', p3(-500, 0, -300), 0.6, [70, 60, 130]); placeModel(root, out, 'assets/car/sedan.glb', p3(-1950, 0, -900), -0.9, [70, 55, 130]);   // 床の おもちゃの車
  const ball = mesh(new THREE.SphereGeometry(70 * MM3, 20, 14), '#ef6f6c'); ball.position.copy(p3(-2150, 70, -250)); root.add(ball);
  placeModel(root, out, 'assets/nursery/cardboardBoxOpen.glb', p3(-2750, 0, -950), 0.3, [420, 300, 320]);   // おもちゃ箱 (右下)
  placeModel(root, out, 'assets/nursery/pillow.glb', p3(-2100, 0, -700), 0.4, [300, 120, 300]);
  placeModel(root, out, 'assets/nursery/bookcaseOpenLow.glb', p3(-1500, 0, N.room.z1 - 160), Math.PI, [800, 600, 300]);   // 本棚 (上の壁、ドアの右)
  placeModel(root, out, 'assets/nursery/lampRoundTable.glb', p3(-1500, 600, N.room.z1 - 160), 0, [180, 330, 180]);   // 常夜灯 (本棚の上)
  const nl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(), color:0xffc98a, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false })); nl.position.copy(p3(-1500, 860, N.room.z1 - 160)); nl.scale.setScalar(700 * MM3); root.add(nl);
  crib(root, out);
  scene.fog = new THREE.Fog(0x24163a, 250 * MM3, 2200 * MM3);   // 夜の 紫の もや: 床の上からは 部屋の奥が 見えない (何か分からない、社長)
  const Cw = new THREE.Vector3(), up = new THREE.Vector3(), back = new THREE.Vector3(), q = new THREE.Vector3();
  out.frame = (cam, aspect) => { scene.fog.near = 1e6; scene.fog.far = 2e6;   /* 見下ろしでは もやを なくす (高い所からだと 部屋が全部 もやに埋もれて 紫の四角になる、10/23 社長) */
    const R = N.room, port = aspect < 1, m = 0.04, xs = port ? [R.x0, -1200] : [R.x0, R.x1], t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));   /* 横長 = 部屋全体を 右に寄せ 左を空ける。縦持ち = ベッドを中心に 部屋の右半分、下の壁を 画面の下へ (上が 空く) (社長 10/26) */
    const L = port ? -1 + m : -1 + 2 * FRAME_ROLL, Rt = 1 - m, B = -1 + m, T = 1 - m;   // 収める枠 (画面の座標 −1〜1。右 = 右の壁)
    root.updateMatrixWorld(); up.set(0, 1, 0).transformDirection(root.matrixWorld); back.set(0, 0, -1).transformDirection(root.matrixWorld); cam.up.set(0, 0, 1).transformDirection(root.matrixWorld); cam.updateProjectionMatrix();   // 上 = ドア (+Z)
    /* 部屋の角 (床と 壁の上) を 実際に 画面へ映して 枠に合わせる (傾きと 遠近の分も 合う、Codex 指摘 10/27): 距離 D は 収まる/はみ出す で 半分ずつ 絞り込み、各 D で 見る点を ずらして 枠の まん中 (縦持ちは 下の壁を 下端) へ */
    const place = (cx, cz, D) => { root.localToWorld(p3(cx, 0, cz, Cw)); cam.position.copy(Cw).addScaledVector(up, D * MM3 * Math.cos(FRAME_TILT)).addScaledVector(back, D * MM3 * Math.sin(FRAME_TILT)); cam.lookAt(Cw); cam.updateMatrixWorld(); };
    const box = () => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for(const x of xs) for(const z of [R.z0, R.z1]) for(const h of [0, R.h]){ root.localToWorld(p3(x, h, z, q)).project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } return [x0, x1, y0, y1]; };
    let cx = (xs[0] + xs[1]) / 2, cz = (R.z0 + R.z1) / 2, lo = (R.h + 300) / Math.cos(FRAME_TILT), hi = 60000, b;   // 見る点 (床、mm)。D = そこから カメラまで (mm、カメラは 壁より 上)
    const center = D => { const De = D - R.h / Math.cos(FRAME_TILT);   // 画面の端を決めるのは 壁の上の角 → ずらす量は そこまでの距離で
      for(let it = 0; it < 4; it++){ place(cx, cz, D); b = box(); cx += ((L + Rt) / 2 - (b[0] + b[1]) / 2) * De * t * cam.aspect; cz -= (port ? B - b[2] : (B + T) / 2 - (b[2] + b[3]) / 2) * De * t / Math.cos(FRAME_TILT); }   // 画面の右 = root の −X
      place(cx, cz, D); b = box(); };
    for(let k = 0; k < 18; k++){ const D = (lo + hi) / 2; center(D); if(b[1] - b[0] > Rt - L || b[3] - b[2] > T - B) lo = D; else hi = D; }
    center(hi); };
  const M = out.nursery.merry;
  return [(cam, dt) => { M.rotation.y += dt * 0.6; }];   // メリーは いつも ゆっくり 回る
}
