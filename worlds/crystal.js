// クリスタルの 洞窟 (3 面 分かれ道 ① 左、10/28 社長の ChatGPT の 絵 = 倉庫 assets-warehouse/art-2026-10-28/crystal-ref-1・2.png):
// 天井から 光る 結晶が 垂れ下がる 大きな 洞窟。レールは 深い 谷の 上の 宙を 走り、左右と 下には 結晶を のせた 岩の 柱・滝。結晶の 色は 紫 → 青 (天井の 高い 広間 1・結晶の アーチ) → 桃色 (広間 2・アーチ) → 金色 (大広間)、
// 最後は 3 つの 光る 門の 建物 (次の 分かれ道の 3 本の レールが それぞれ 門を くぐる)。座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左。コースは ゆるく 曲がる (10/29) ので、置き物は まっすぐの 座標 (z = 道のり) で 作って coursePath で コースに 沿わせる。形は InstancedMesh、色は 頂点に 焼き付け (光の 計算なし = 軽い)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SPREAD3_SEC, RECONV3_SEC, coursePath3, exit3, exitLift3 } from '../stage3.js';

const ZONES = [['#c58cff', '#7b3cff'], ['#7cc8ff', '#3d6bff'], ['#ff8fdc', '#c45cff'], ['#ffd98a', '#ff9a3c']].map(z => z.map(c => new THREE.Color(c)));   // 紫・青・桃・金 (明るい 色 / 深い 色)
const FOGC = ['#1d0c3a', '#0a1840', '#2c0c34', '#33200c'].map(c => new THREE.Color(c));   // 遠くの もやの 色 (区間ごと)
const CX = 12, CLO = -14, CHI = 18, WX = 28, WLO = -28, WHI = 30;   // レールの まわりの 空き: ふだん 横 ±12 m・下 −14 m・上 +18 m / 分かれ道で レールが 広がる 所 (入口の 戻り・出口の 手前) は 横 ±28 m・下 −28 m・上 +30 m (広がり ±14 m・上下 ±10 m + カメラ)
const LAKE = -95, DEP = 150;   // 地底湖の 水面の 高さ (m、レールの 下。10/29 社長「洞窟に 床が 無くて 下に 宇宙が 見える → 床か 洞窟湖の 水面で 隠したい」) / 洞窟の 下半分の 深さ (壁を 水面より 下まで 下ろす)
const RING_UP = 2.2, GATE_UP = 2;   // 分かれ道の 輪の 中心の 高さ (index.html の RING3_UP) / 分かれ道で ない 大きな 輪の 中心の 高さ (GATE3_UP)
const sm = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const bump = (z, c, w) => Math.exp(-(((z - c) / w) ** 2));

function crystalGeo(){   // 六角柱 + とがった 先 (高さ 1・太さ 1、根元 y = 0)。面ごとに 明るさを 変え (カットの きらめき)、根元は 暗く 先は 明るく
  const body = new THREE.CylinderGeometry(0.5, 0.42, 0.74, 6, 1, true).translate(0, 0.37, 0), tip = new THREE.ConeGeometry(0.5, 0.26, 6, 1, true).translate(0, 0.87, 0);
  const g = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]); g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), L = new THREE.Vector3(0.4, 0.8, 0.45).normalize();
  for(let i = 0; i < p.count; i++){ const h = p.getY(i), d = Math.max(0, n.getX(i) * L.x + n.getY(i) * L.y + n.getZ(i) * L.z), k = (0.35 + 0.65 * h) * (0.6 + 0.55 * d); c.set([k, k, k], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
// 岩 (10/29 社長「下から 出ている 岩が 完全な 直方体に 見えて 変」→ 絵の とおり 上は ほぼ 平らで ふちが 丸く 欠け、横は 地層の 段が ある ごつごつの 崖)。
// 形 3 種: t = 上の 太さ、k = 下へ 1 進むごとに 太る 量 (島は 下が とがる)、cap = 上の 丸みの 深さ、band = 地層の 段の 間隔、asp = 高さ ÷ 太さ (明るさの 焼き付け用)。深さ s = 上から 0 〜 下 1
const ROCKS = [{ t:1, k:0.7, cap:0.012, band:0.035, asp:20 }, { t:0.8, k:1.3, cap:0.012, band:0.028, asp:20 }, { t:1, k:-1, cap:0.06, band:0.12, asp:2.5, isl:true }];   // 谷から 立つ 柱 (どっしり / 細めの 塔) / 宙に 浮く 島
function rockR(kind, a, s){   // 岩の 中心から 表面までの 距離 (太さ 1 に 対して)。a = 岩の 中の 角度
  const o = ROCKS[kind], u = s / o.band + 0.25 * Math.sin(a * 2 + kind), f = u - Math.floor(u), base = o.isl ? Math.pow(1 - s, 0.7) : o.t + o.k * s;
  return base * Math.min(1, Math.sqrt(s / o.cap)) * (1 + 0.09 * (f < 0.3 ? f / 0.3 : (1 - f) / 0.7)) * (1 + 0.13 * Math.sin(a * 3 + kind * 1.7) + 0.08 * Math.sin(a * 4 - s * 20 + kind) + 0.05 * Math.sin(a * 7 + s * 55)); }   // 上の 丸み × 地層の 段 (斜めに 走る) × 縦の ひだ
function rockGeo(kind){   // 岩の 形 (高さ 1・太さ 1、上の 中心 y = 0)。面ごとに 明るさを 焼き付け (上向きの 面は 結晶に 照らされて 明るく、段の 下側は 暗い = ごつごつが 見える)
  const o = ROCKS[kind], S = o.isl ? [0, 0.02, 0.05, 0.09, 0.14, 0.2, 0.27, 0.35, 0.44, 0.54, 0.65, 0.77, 0.89, 1] : [0, 0.002, 0.005, 0.009, 0.014];
  if(!o.isl){ for(let s = 0.02; s < 0.25; s += 0.012) S.push(s); S.push(0.3, 0.36, 0.44, 0.54, 0.66, 0.8, 1); }
  const g0 = new THREE.LatheGeometry(S.slice().reverse().map(s => new THREE.Vector2(1, -s)), 10), p0 = g0.attributes.position;   // 下から 上へ 並べる (面が 外向き)
  for(let i = 0; i < p0.count; i++){ const x = p0.getX(i), y = p0.getY(i), z = p0.getZ(i), r = rockR(kind, Math.atan2(z, x), -y); p0.setXYZ(i, x * r, y, z * r); }
  const g = g0.toNonIndexed(); g0.dispose(); g.scale(1, o.asp, 1); g.computeVertexNormals();   // 本当の 縦横比で 面の 向きを 出す
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), L = new THREE.Vector3(0.35, 0.8, 0.5).normalize();
  for(let i = 0; i < p.count; i++){ const s = -p.getY(i) / o.asp, ny = n.getY(i), lam = Math.max(0, n.getX(i) * L.x + ny * L.y + n.getZ(i) * L.z);
    const k = (0.1 + 0.42 * lam + 0.18 * Math.max(0, ny) ** 2) * (0.35 + 0.65 * Math.exp(-s * (o.isl ? 2 : 7))); c.set([k * 0.75, k * 0.65, k], i * 3); }
  g.scale(1, 1 / o.asp, 1); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
function crystalMat(){   // 結晶の 描き方 (10/28 社長「反射とか」): 面ごとの 照り返し (見る 角度で 光る・結晶ごとに またたく)・ふちの 光・中の 光・上向きの 面には 天井の 色、下向きには 谷の 暗さが ほんのり 映る
  return new THREE.ShaderMaterial({ vertexColors:true, fog:true, clipping:true,   /* clipping = 輪の 窓の 中に 描く 時の 切り落とし (入口より 手前を 消す、10/29 Codex 指摘) */
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 }, uL1:{ value:new THREE.Vector3(0, 0.5, 1).normalize() }, uL2:{ value:new THREE.Vector3(0, 1, 0) } }]),
    vertexShader:`uniform float uTime; varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vH; varying float vPh;
      #include <fog_pars_vertex>
      #include <clipping_planes_pars_vertex>
      void main(){ mat3 m = mat3(instanceMatrix); vec3 n = m * (normal / vec3(dot(m[0], m[0]), dot(m[1], m[1]), dot(m[2], m[2])));   // 伸ばした 結晶の 面の 向き (伸ばした 分を 戻す)
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * n); vV = cameraPosition - wp.xyz;
        vCol = color * instanceColor; vH = position.y; vPh = float(gl_InstanceID) * 2.399;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; uniform vec3 uL1; uniform vec3 uL2; varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vH; varying float vPh;
      #include <fog_pars_fragment>
      #include <clipping_planes_pars_fragment>
      void main(){
        #include <clipping_planes_fragment>
        vec3 N = normalize(vN), V = normalize(vV); float ndv = clamp(abs(dot(N, V)), 0.0, 1.0), fres = pow(1.0 - ndv, 2.5); vec3 R = reflect(-V, N);
        float tw = 0.55 + 0.45 * sin(uTime * 2.6 + vPh), sp = pow(max(dot(R, uL1), 0.0), 40.0) * 1.8 * tw + pow(max(dot(R, uL2), 0.0), 18.0) * 0.5;   // 照り返し (前方の 門の 光・天井の 光)
        vec3 env = mix(vec3(0.02, 0.01, 0.05), vCol * 1.3, smoothstep(-0.3, 0.7, R.y)) * (0.2 + 0.8 * fres);   // 映り込み (上 = 結晶の 天井の 色・下 = 谷の 暗さ)
        vec3 c = vCol * 0.7 + vCol * (0.3 + 0.7 * vH) * (1.0 - fres) * 0.5 + mix(vCol, vec3(1.0), 0.5) * fres * 1.3 + env + vec3(1.0, 0.97, 0.92) * sp;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
}
let waterTex = null;   // 水面の 凹凸の 絵 (three.js 付属の waternormals.jpg、MIT。10/29 社長「水面の テクスチャーとか どうですか」)。世界を 作り直しても 1 枚を 使い回す
function waterNormals(){ if(!waterTex){ waterTex = new THREE.TextureLoader().load('assets/nature/waternormals.jpg'); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; } return waterTex; }
function lakeMat(){   // 地底湖の 水面 (平らな 帯 1 枚。凹凸の 絵を 3 枚 ずらして 重ねた さざ波 → 見る 角度で 映り込みが 強まる (手前は 暗い 水・遠くは 天井の 結晶の 色)・出口の 門の 方へ 光の 道。映り込みの 光の 点は 別 (rippleMat))
  // 水の 下に 沈んだ 柱や 壁を 隠す ため、ふつうの 物の 後に 描き (透明 扱い・renderOrder −1)、奥行きは 書かない (さかさまの 光が 水面越しに 見える)
  const m = new THREE.ShaderMaterial({ vertexColors:true, fog:true, clipping:true, transparent:true, depthWrite:false, side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 }, uL:{ value:new THREE.Vector3(0, 0.5, 1).normalize() }, uGlow:{ value:new THREE.Color('#c58cff') } }]),
    vertexShader:`varying vec3 vCol; varying vec2 vP; varying vec3 vW; varying vec3 vUp; varying vec3 vEx; varying vec3 vEz;
      #include <fog_pars_vertex>
      #include <clipping_planes_pars_vertex>
      void main(){ vCol = color; vP = position.xz; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; mat3 r = mat3(modelMatrix); vUp = r * vec3(0.0, 1.0, 0.0); vEx = r * vec3(1.0, 0.0, 0.0); vEz = r * vec3(0.0, 0.0, 1.0);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; uniform vec3 uL; uniform vec3 uGlow; uniform sampler2D uN; varying vec3 vCol; varying vec2 vP; varying vec3 vW; varying vec3 vUp; varying vec3 vEx; varying vec3 vEz;
      #include <fog_pars_fragment>
      #include <clipping_planes_pars_fragment>
      void main(){
        #include <clipping_planes_fragment>
        vec2 p = vP / 70.0;   // 絵 1 枚 = 70 m
        vec3 n = (texture2D(uN, p + vec2(uTime * 0.013, uTime * 0.009)).rgb + texture2D(uN, p * 1.37 - vec2(uTime * 0.011, -uTime * 0.014)).rgb + texture2D(uN, p * 0.29 + vec2(uTime * 0.004, uTime * 0.003)).rgb) * (2.0 / 3.0) - 1.0;   // 3 枚を ちがう 大きさ・向きに 流して 重ねる
        float d = length(cameraPosition - vW), k = 1.6 * (1.0 - 0.7 * smoothstep(200.0, 1200.0, d));   // 遠くは おだやかに (ちらつき 防止)
        vec3 up = normalize(vUp), N = normalize(vEx * (n.x * k) + up * n.z + vEz * (n.y * k)), V = normalize(cameraPosition - vW), R = reflect(-V, N);
        float F = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 3.0), sp = pow(max(dot(R, uL), 0.0), 160.0) * 3.0;   // 映り込みの 強さ (浅い 角度ほど 強い) / 門の 光の きらめき
        vec3 env = mix(vCol * 2.0, uGlow, smoothstep(0.0, 0.6, dot(R, up)));   // 映る もの: 上 = 天井の 光る 結晶・横 = 暗い 壁
        gl_FragColor = vec4(mix(vCol, env, F) + vec3(1.0, 0.95, 0.85) * sp, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uN = { value:waterNormals() }; return m;   // 絵は merge の 後に 入れる (merge は 絵を 複製して しまう)
}
function rippleMat(){   // 水に 映る 光 (丸い 点 → たてに のびて ゆらゆら ゆれる 光の すじ)。PointsMaterial の 形の 部分だけ 差し替え
  const u = { value:0 }, m = new THREE.PointsMaterial({ size:16, vertexColors:true, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false });
  m.onBeforeCompile = s => { s.uniforms.uTime = u;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying float vPh;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPh = dot(position, vec3(0.37, 0.11, 0.53));');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; varying float vPh;').replace('#include <map_particle_fragment>',
      'vec2 pc = gl_PointCoord - 0.5; pc.x += 0.07 * sin(pc.y * 16.0 + uTime * 3.0 + vPh);\ndiffuseColor.a *= exp(-pc.x * pc.x / 0.003 - pc.y * pc.y / 0.05) * (0.6 + 0.4 * sin(pc.y * 38.0 - uTime * 5.0 + vPh * 1.7));'); };
  m.userData.time = u; return m; }
function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.4)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
function fallTex(){ const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');   // 滝の 筋 (縦に 流れる 白い 線、上下に くり返す)
  for(let i = 0; i < 40; i++){ const x = Math.random() * 64, w = 1 + Math.random() * 3, y = Math.random() * 256, h = 40 + Math.random() * 120, a = 0.25 + Math.random() * 0.5;
    for(const o of [-256, 0, 256]){ const lg = g.createLinearGradient(0, y + o, 0, y + o + h); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, `rgba(255,255,255,${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(x, y + o, w, h); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

export function build(scene, root, P, opts, out){
  const branch = opts.nextBranch !== false, path = coursePath3(P, branch), L = Math.max(600, path.len), mob = !!opts.mobile;   /* branch = 次の 段が 分かれ道 / L = 入口から 出口の 輪までの 長さ (最初の 段は P.len より ctrlLen3 短い) */ let seed = 20261028; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const zone = (z, o, deep) => { const f = Math.min(0.999, Math.max(0, z / L)) * 4, i = Math.floor(f), j = Math.min(3, i + 1), k = sm((f - i - 0.75) / 0.25); return o.copy(ZONES[i][deep ? 1 : 0]).lerp(ZONES[j][deep ? 1 : 0], k); };   // 区間の 終わり 4 分の 1 で 次の 色へ
  const H1 = L * 0.375, H2 = L * 0.625;   // 広間 1・広間 2 の まん中 (大広間は 最後の 2 割)
  const ceil = z => 50 + 55 * bump(z, H1, L * 0.07) + 55 * bump(z, H2, L * 0.07) + 70 * sm((z - L * 0.8) / (L * 0.08)) + 6 * Math.sin(z / 230);   // 天井の 高さ (m)
  const side = z => 95 + 55 * bump(z, H1, L * 0.08) + 55 * bump(z, H2, L * 0.08) + 80 * sm((z - L * 0.8) / (L * 0.08)) + 10 * Math.sin(z / 310 + 1);   // 横の 壁までの 距離 (m)
  scene.fog = new THREE.Fog(FOGC[0].clone(), 140, mob ? 1300 : 1700);
  const glow = glowTex(), add = THREE.AdditiveBlending, col = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const Z0 = -200, Z1 = L + 160;   // 作る 範囲 (入口の 少し 手前 〜 門の 向こう)
  const ex = exit3(P.def), _fp = new THREE.Vector3(), _fq = new THREE.Quaternion();   // ex = 出口の 形 (stage3.js の exit)
  const lift = s => branch ? exitLift3(P.def, P.move, path.len - s) : 0;   // 出口で レールが 上がる 高さ (洞窟は 上げない = レールが 城壁の 門へ のぼって いくのが 見える)
  const bend = o => { path.frame(o.z, _fp, _fq); return o.set(o.x, o.y - lift(o.z), 0).applyQuaternion(_fq).add(_fp); };   // まっすぐの 座標 (x 横・y 上 (洞窟の 高さ、レールは y = lift)・z 道のり) → コースに 沿った 座標

  // 洞窟の 殻 (天井と 左右の 壁、下は 開いた 谷 = もやに 沈む)
  { const nr = mob ? 37 : 54, step = 30, nz = Math.ceil((Z1 - Z0) / step), A0 = -0.38 * Math.PI, A1 = 1.38 * Math.PI, pos = new Float32Array(((nz + 1) * (nr + 1) + 1) * 3), c = new Float32Array(pos.length), idx = [];   // 下は 水面の 下まで (いちばん 下の ふちは 水の 中)、+1 = 奥の ふたの まん中
    for(let iz = 0; iz <= nz; iz++){ const z = Z0 + iz * step, H = ceil(z), S = side(z), lz = lift(z); zone(z, col, true); path.frame(z, _fp, _fq);   // 輪切り 1 枚ずつ コースの 向きに 立てる
      for(let ir = 0; ir <= nr; ir++){ const a = A0 + (A1 - A0) * ir / nr, n = 1 + 0.12 * Math.sin(a * 5 + z / 70) + 0.08 * Math.sin(a * 13 - z / 33) + 0.05 * Math.sin(z / 11 + a * 3);
        const k = (iz * (nr + 1) + ir) * 3, br = 0.24 + 0.12 * Math.sin(a * 9 + z / 50) + 0.07 * Math.sin(a * 23 - z / 17); v.set(Math.cos(a) * S * n, Math.sin(a) * (a < 0 || a > Math.PI ? DEP : H) * n - lz, 0).applyQuaternion(_fq).add(_fp); pos.set([v.x, v.y, v.z], k); c.set([0.04 + col.r * br, 0.02 + col.g * br, 0.07 + col.b * br], k);   /* 壁 = 区間の 色に ぼんやり 光る 結晶の かたまり (岩肌を 見せない、10/29 社長) */ } }
    for(let iz = 0; iz < nz; iz++) for(let ir = 0; ir < nr; ir++){ const a = iz * (nr + 1) + ir, b = a + nr + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    { const ce = (nz + 1) * (nr + 1), r0 = nz * (nr + 1); path.frame(Z1, _fp, _fq); v.set(0, 10 - lift(Z1), 0).applyQuaternion(_fq).add(_fp); pos.set([v.x, v.y, v.z], ce * 3); zone(Z1, col, true); c.set([0.03 + col.r * 0.12, 0.02 + col.g * 0.12, 0.05 + col.b * 0.12], ce * 3);   // 奥の ふた (城壁の 向こうの 洞窟の 終わり = 外の 宇宙が 見えない)
      for(let ir = 0; ir < nr; ir++) idx.push(ce, r0 + ir, r0 + ir + 1); idx.push(ce, r0 + nr, r0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setIndex(idx);
    root.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.DoubleSide }))); }

  // 結晶 (天井から 下向き・壁から 内向き・岩の 上から 上向き・アーチ)。clear = レールの まわりの 空きに 入らないよう 長さを 縮める
  const cr = [];   // cr = {p 根元, d 向き, len, w, c 色} (まっすぐの 座標。描く 時に コースに 沿わせる)
  const wideA = RECONV3_SEC * P.move + 150, wideB = L - SPREAD3_SEC * P.move - 150;   // 入口の 戻り・出口の 手前の 広がる 所 (z)
  const WXe = Math.max(WX, ex.w + 12), inCorr = (x, y, z) => { y -= lift(z); return z < wideA ? Math.abs(x) < WX && y > WLO && y < WHI : z > wideB ? Math.abs(x) < WXe && y > WLO && y < WHI : Math.abs(x) < CX && y > CLO && y < CHI; };   // 出口の 手前は 扇の 広がり (ex.w) + カメラ、高さは 上がった レールから
  const addCr = (p, d, len, w, c) => { for(let t = 0; t < 6 && len > 0.8; t++){ const e = v.copy(p).addScaledVector(d, len); if(!inCorr(e.x, e.y, e.z) && !inCorr(p.x + d.x * len * 0.5, p.y + d.y * len * 0.5, p.z + d.z * len * 0.5)) break; len *= 0.65; }
    if(len <= 0.8 || inCorr(p.x, p.y, p.z) || p.y < LAKE + 1) return; cr.push({ p:p.clone(), d:d.clone().normalize(), len, w, c:c.clone() }); };
  const shellPt = (a, z, o) => { const n = 1 + 0.12 * Math.sin(a * 5 + z / 70) + 0.08 * Math.sin(a * 13 - z / 33) + 0.05 * Math.sin(z / 11 + a * 3); return o.set(Math.cos(a) * side(z) * n * 0.97, Math.sin(a) * (a < 0 || a > Math.PI ? DEP : ceil(z)) * n * 0.97, z); };
  const jitter = (d, k) => d.add(v.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(k)).normalize();
  { const nC = Math.round((Z1 - Z0) / (mob ? 10 : 6)), p = new THREE.Vector3();   // 天井と 壁の 結晶の 群れ
    for(let i = 0; i < nC; i++){ const z = Z0 + rnd() * (Z1 - Z0), top = rnd() < 0.62, a = top ? (0.2 + rnd() * 0.6) * Math.PI : (rnd() < 0.5 ? (-0.2 + rnd() * 0.4) : (0.8 + rnd() * 0.4)) * Math.PI;
      shellPt(a, z, p); const inward = new THREE.Vector3(-p.x, -p.y, 0).normalize(), cn = 3 + (rnd() * 6 | 0), base = 10 + rnd() * 16, giant = rnd() < 0.12; zone(z, col, rnd() < 0.3);
      for(let k = 0; k < cn; k++){ const d = jitter(inward.clone(), 0.9), len = (giant ? 30 + rnd() * 40 : base * (0.6 + rnd() * 0.8)) , w = len * (0.22 + rnd() * 0.14); addCr(p.clone().add(v.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(base * 1.2)), d, len, w, col); } } }
  // 岩 (谷から 立つ 柱 と 宙に 浮く 島。上に 結晶の 群れ、横腹にも 結晶、島の ふちから ときどき 滝)
  const rocks = [], falls = [];
  const surf = (o, an, s, k, out) => { const rr = rockR(o.g, an + o.ry, s) * o.r * k; return out.set(o.x + Math.cos(an) * rr, o.y - s * o.h, o.z + Math.sin(an) * rr); };   // 岩の 表面の 点 (an = 向きの 角度、s = 上からの 深さ 0〜1、k = 1 より 小さいと 少し 埋める)
  { const nP = Math.round(L / (mob ? 70 : 45)), p = new THREE.Vector3();
    for(let i = 0; i < nP; i++){ const z = rnd() * (L + 100) - 50, sideK = rnd() < 0.5 ? -1 : 1, under = rnd() < 0.18, x = under ? (rnd() - 0.5) * 24 : sideK * (18 + rnd() * Math.min(110, side(z) * 0.7)), far = Math.abs(x);
      let topY = under ? -22 - rnd() * 40 : far < 30 ? -16 - rnd() * 20 : -20 + rnd() * Math.min(45, far * 0.5);   // 下の 岩は レールより ずっと 下、横は 遠いほど 高く
      if(inCorr(x, topY, z)) topY = lift(z) + (z < wideA || z > wideB ? WLO : CLO) - 4; const r = 6 + rnd() * (under ? 10 : 16), g = rnd() < (under ? 0.5 : 0.35) ? 2 : i & 1, isl = g === 2;
      const o = { x, y:topY, z, r, h: isl ? Math.min(r * (2 + rnd() * 1.5), Math.max(r * 1.2, topY - LAKE - 6)) : topY + 320, ry:rnd() * 6, g }; rocks.push(o);   // 島の 厚み = 太さの 2〜3.5 倍 (水面に つからない よう 浅く)。柱は 水の 中まで (水面で 隠れる)
      zone(z, col, false); const cn = 5 + (rnd() * 6 | 0), cap = ROCKS[g].cap;
      for(let k = 0; k < cn; k++){ const an = rnd() * Math.PI * 2, rho = Math.sqrt(rnd()) * 0.8; surf(o, an, cap * rho * rho, 1, p); p.y -= 0.6;   // 上の 丸い 面に 根元を 少し 埋める
        const len = 8 + rnd() * (r * 1.5), d = jitter(new THREE.Vector3(Math.cos(an) * rho * 0.6, 1, Math.sin(an) * rho * 0.6).normalize(), 0.6); addCr(p, d, len, len * (0.25 + rnd() * 0.12), col); }
      for(let k = 0, ns = 4 + (rnd() * 5 | 0); k < ns; k++){ const an = rnd() * Math.PI * 2; surf(o, an, isl ? 0.08 + rnd() * 0.4 : (5 + rnd() * 70) / o.h, 0.95, p);   /* 横腹からも 結晶 (岩肌を 見せない) */
        const d = jitter(new THREE.Vector3(Math.cos(an), 0.3 + rnd() * 0.6, Math.sin(an)).normalize(), 0.5), len = isl ? 4 + rnd() * r : 8 + rnd() * 20; addCr(p, d, len, len * (0.24 + rnd() * 0.12), col); }
      if(isl && !under && rnd() < (mob ? 0.3 : 0.45)){ const an = x > 0 ? Math.PI : 0; let rr = 0; for(let s = 0; s <= 0.3; s += 0.02) rr = Math.max(rr, rockR(g, an + o.ry, s));   // 滝は 島の レール側の ふちから (島は 下が 細いので 水が 岩に めり込まない)
        falls.push({ x:x - Math.sign(x) * (rr * r + 0.4), y:topY - ROCKS[g].cap * o.h, z, w:4 + rnd() * 6 }); } } }
  // 巨大な 結晶の アーチ (広間 1・2 の 頭上を またぐ。半径 46 m の 半円に 沿って 結晶が 外向き・接線向きに)
  for(const [zc, zi] of [[H1, 1], [H2, 2]]){ const R = 46, cA = ZONES[zi][0], cB = ZONES[zi][1], n = mob ? 110 : 180;
    for(let i = 0; i < n; i++){ const th = (0.03 + 0.94 * rnd()) * Math.PI, zz = zc + (rnd() - 0.5) * 26, rr = R + (rnd() - 0.5) * 10, p = new THREE.Vector3(Math.cos(th) * rr, -8 + Math.sin(th) * (rr + 8), zz);
      const out = new THREE.Vector3(Math.cos(th), Math.sin(th), 0), tan = new THREE.Vector3(-Math.sin(th), Math.cos(th), 0).multiplyScalar(rnd() < 0.5 ? 1 : -1), d = jitter(out.lerp(tan, rnd() * 0.8), 0.5), len = 12 + rnd() * 24;
      addCr(p, d, len, len * (0.2 + rnd() * 0.12), col.copy(cA).lerp(cB, rnd() * 0.6)); } }
  // 出口 = 光る 城壁と 3 つの 門 (10/29 社長「コンセプトアートの ような 光る 城壁に 門が ある 出口」。次の 分かれ道の 3 本の レールが 扇形に 広がりながら 上がって 1 本ずつ くぐる)
  const DC = [ZONES[0][0], ZONES[1][0], ZONES[3][0]];   // 門の 光の 色 (左 紫・まん中 青・右 金 = 絵の とおり)
  const doors = [-1, 0, 1].map(k => branch ? { x:-k * ex.w, y:-k * ex.h + RING_UP, hw:7, lo:12, hi:8, c:DC[k + 1], hole:true }   // 分かれ道: 3 本の レールが 1 つずつ くぐる。下 12 m・上は とがった アーチ (輪の 半径 4.2 m + カメラ)
    : k === 0 ? { x:0, y:GATE_UP, hw:23, lo:24, hi:2, c:DC[2], hole:true } : { x:-k * 48, y:GATE_UP, hw:7, lo:12, hi:8, c:DC[k + 1], hole:false });   // 分かれ道で ない: まん中の 大きな 門 (輪 ±20 m) と 両側の 飾りの 門
  const pointed = (pa, x, b, t, hw) => { pa.moveTo(x - hw, b); pa.lineTo(x + hw, b); pa.lineTo(x + hw, t); pa.absarc(x - hw, t, 2 * hw, 0, Math.PI / 3, false); pa.absarc(x + hw, t, 2 * hw, Math.PI * 2 / 3, Math.PI, false); pa.lineTo(x - hw, b); return pa; };   // とがった アーチ (ゴシックの 門・窓。てっぺん = t + 1.73 hw)
  const band = (x, b, t, ho, hi) => { const s = new THREE.Shape(); s.moveTo(x + ho, b); s.lineTo(x + ho, t); s.absarc(x - ho, t, 2 * ho, 0, Math.PI / 3, false); s.absarc(x + ho, t, 2 * ho, Math.PI * 2 / 3, Math.PI, false); s.lineTo(x - ho, b);
    s.lineTo(x - hi, b); s.lineTo(x - hi, t); s.absarc(x + hi, t, 2 * hi, Math.PI, Math.PI * 2 / 3, true); s.absarc(x - hi, t, 2 * hi, Math.PI / 3, 0, true); s.lineTo(x + hi, b); s.lineTo(x + ho, b); return new THREE.ShapeGeometry(s, 12); };   // ∩ の 形の 光る ふち (外 ho・内 hi)
  { const fac = new THREE.Group(), W = 200, lk = LAKE - lift(L), yb = Math.min(-130, lk - 20), yt = 46, zf = L - 4,   /* lk = 地底湖の 水面 (城壁の 座標)。城壁の 下は 水の 中まで */ stone = (g, y0, y1) => { const p = g.attributes.position, c = new Float32Array(p.count * 3);   // fac = 城壁 (コースの 終わりの 向きに 立てる。y = 0 は 門の 所の レールの 高さ) / stone = 金色に 照らされた 明るい 石の 色 (上ほど 明るい)
      for(let i = 0; i < p.count; i++){ const k = 0.3 + 0.32 * sm((p.getY(i) - y0) / (y1 - y0)); c.set([k * 1.25, k * 1.02, k * 0.78], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
    const glowMat = (c, o = 0.9) => new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:o, blending:add, depthWrite:false, side:THREE.DoubleSide, fog:false });   // 光る 部分は もやで 消さない (遠くから 光って 見える)
    const sh = new THREE.Shape(); sh.moveTo(-W / 2, yb); sh.lineTo(W / 2, yb); sh.lineTo(W / 2, yt);
    for(let x = W / 2; x > -W / 2 + 1; x -= 8){ sh.lineTo(x, yt + 4); sh.lineTo(x - 5, yt + 4); sh.lineTo(x - 5, yt); sh.lineTo(Math.max(-W / 2, x - 8), yt); }   // 上の ぎざぎざ (城壁の 凸凹)
    sh.lineTo(-W / 2, yb); for(const d of doors) if(d.hole) sh.holes.push(pointed(new THREE.Path(), d.x, d.y - d.lo, d.y + d.hi, d.hw));
    fac.add(new THREE.Mesh(stone(new THREE.ExtrudeGeometry(sh, { depth:8, bevelEnabled:false, curveSegments:12 }).translate(0, 0, zf), yb, yt), new THREE.MeshBasicMaterial({ vertexColors:true })));
    const tw = [], xs = doors.map(d => d.x).sort((a, b) => a - b);   // 塔: 門と 門の 間・外側の 門の 外・城壁の 両はし (門に かかる 所は 立てない)
    for(let i = 0; i + 1 < xs.length; i++) tw.push({ x:(xs[i] + xs[i + 1]) / 2, r:2.8 });
    tw.push({ x:xs[0] - 15, r:5 }, { x:xs[2] + 15, r:5 }, { x:-W / 2 + 6, r:6 }, { x:W / 2 - 6, r:6 });
    const towers = tw.filter(o => !doors.some(d => d.hole && Math.abs(d.x - o.x) < d.hw + 1.8 + o.r)), roofMat = new THREE.MeshBasicMaterial({ color:'#4a3560' }), towerMat = new THREE.MeshBasicMaterial({ vertexColors:true });
    for(const o of towers){ const h = yt + 12 - yb, body = new THREE.Mesh(stone(new THREE.CylinderGeometry(o.r, o.r * 1.08, h, 10).translate(0, yb + h / 2, 0), yb, yt), towerMat); body.position.set(o.x, 0, zf - o.r * 0.6); fac.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(o.r * 1.35, o.r * 3.2, 10), roofMat); roof.position.set(o.x, yt + 12 + o.r * 1.6, zf - o.r * 0.6); fac.add(roof);
      const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xffd98a, transparent:true, opacity:0.8, blending:add, depthWrite:false, fog:false })); orb.position.set(o.x, yt + 12 + o.r * 3.4, zf - o.r * 0.6); orb.scale.setScalar(o.r * 3); fac.add(orb); }   // 屋根の てっぺんの 光
    const wins = [], skip = (x, y) => doors.some(d => Math.abs(d.x - x) < d.hw + 3.5 && y > d.y - d.lo - 5 && y < d.y + d.hi + 1.73 * d.hw + 5) || towers.some(o => Math.abs(o.x - x) < o.r + 2);   // 光る 窓 (門・塔に かかる 所は 無し、ところどころ 消えて いる)
    for(const y of [33, 8, -20, -48, -78]) for(let x = -W / 2 + 7; x < W / 2 - 6; x += 8) if(!skip(x, y) && rnd() < 0.75) wins.push({ x, y, z:zf - 0.2 });
    for(const o of towers) for(const y of [yt - 6, yt - 24]) wins.push({ x:o.x, y, z:zf - o.r * 1.6 - 0.2 });   // 塔の 窓 (正面)
    { const all = wins.concat(wins.filter(w => w.y > lk).map(w => ({ x:w.x, y:2 * lk - w.y, z:w.z, of:w }))), wm = new THREE.InstancedMesh(new THREE.ShapeGeometry(pointed(new THREE.Shape(), 0, -3.5, 1.2, 1.3), 6), glowMat(0xffffff, 0.85), all.length);   // of = 水に 映った 窓 (さかさま・暗め)
      all.forEach((w, i) => { if(w.of){ wm.setMatrixAt(i, m4.makeScale(1, -1, 1).setPosition(w.x, w.y, w.z)); wm.setColorAt(i, col.copy(w.of.c).multiplyScalar(0.35)); return; }
        wm.setMatrixAt(i, m4.makeTranslation(w.x, w.y, w.z)); w.c = col.copy(rnd() < 0.7 ? DC[2] : DC[(rnd() * 2) | 0]).lerp(new THREE.Color(1, 1, 1), 0.25).clone(); wm.setColorAt(i, w.c); });
      wm.instanceMatrix.needsUpdate = true; if(wm.instanceColor) wm.instanceColor.needsUpdate = true; fac.add(wm); }
    const mirror = (o, k) => { const r = o.clone(); r.material = o.material.clone(); r.material.opacity *= k; r.position.y = 2 * lk - o.position.y; fac.add(r); };   // 水に 映った 光 (水面で さかさま・うすめ)
    const top = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.9), glowMat(0xffd98a, 0.75)); top.position.set(0, yt - 2.5, zf - 0.25); fac.add(top); mirror(top, 0.4);   // 城壁の 上を 走る 光の 帯
    for(const d of doors){ const b = d.y - d.lo, t = d.y + d.hi, fr = new THREE.Mesh(band(d.x, b, t, d.hw + 1.6, d.hw + 0.3), glowMat(d.c, 0.95)); fr.position.z = zf - 0.3; fac.add(fr);   // 門の 光る ふち (とがった アーチ)
      const fm = new THREE.Mesh(fr.geometry, glowMat(d.c, 0.35)); fm.scale.y = -1; fm.position.set(0, 2 * lk, zf - 0.3); fac.add(fm);   // 水に 映った ふち
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:d.c, transparent:true, opacity: d.hole ? 0.55 : 0.3, blending:add, depthWrite:false, fog:false })); halo.position.set(d.x, d.y + d.hi * 0.5, zf - 1); halo.scale.set(d.hw * 3.6, (d.lo + d.hi + 1.73 * d.hw) * 1.4, 1); fac.add(halo); mirror(halo, 0.4); }
    const amb = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xffcf80, transparent:true, opacity:0.2, blending:add, depthWrite:false, fog:false })); amb.position.set(0, 10, zf - 12); amb.scale.set(W * 1.6, 150, 1); fac.add(amb); mirror(amb, 0.4);   // 城壁 全体を 包む 金色の 光
    path.frame(L, _fp, _fq); out.exitP = _fp.clone(); fac.quaternion.copy(_fq); fac.position.copy(v.set(0, 0, -L).applyQuaternion(_fq).add(_fp)); root.add(fac); }   // まっすぐの 座標の z = L を コースの 終わり (上がった レールの 高さ) へ

  // まとめて 描く
  const crMat = crystalMat();
  const tipPos = new Float32Array(cr.length * 3), tipCol = new Float32Array(tipPos.length);   // 結晶の 先の 光
  { const geo = crystalGeo(), mesh = new THREE.InstancedMesh(geo, crMat, cr.length), d = new THREE.Vector3();
    cr.forEach((o, i) => { bend(o.p); d.copy(o.d).applyQuaternion(_fq); q.setFromUnitVectors(up, d); mesh.setMatrixAt(i, m4.compose(o.p, q, s3.set(o.w, o.len, o.w))); mesh.setColorAt(i, col.copy(o.c).multiplyScalar(1.15));
      v.copy(o.p).addScaledVector(d, o.len); tipPos.set([v.x, v.y, v.z], i * 3); tipCol.set([o.c.r, o.c.g, o.c.b], i * 3); });
    mesh.instanceMatrix.needsUpdate = true; if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; root.add(mesh); }
  { const rg = [0, 1, 2].map(k => rockGeo(k)), byG = [[], [], []]; rocks.forEach(o => byG[o.g].push(o));
    byG.forEach((list, gi) => { if(!list.length) return; const mesh = new THREE.InstancedMesh(rg[gi], new THREE.MeshBasicMaterial({ vertexColors:true }), list.length);
      list.forEach((o, i) => { bend(v.set(o.x, o.y, o.z)); q.setFromAxisAngle(up, o.ry).premultiply(_fq); mesh.setMatrixAt(i, m4.compose(v, q, s3.set(o.r, o.h, o.r))); mesh.setColorAt(i, zone(o.z, col, true).lerp(new THREE.Color(1, 1, 1), 0.55)); });
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; root.add(mesh); }); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tipPos, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tipCol, 3));
  const tipMat = new THREE.PointsMaterial({ map:glow, size:5, vertexColors:true, transparent:true, opacity:0.85, blending:add, depthWrite:false }); const tipPts = new THREE.Points(tg, tipMat); tipPts.frustumCulled = false; root.add(tipPts);
  const lake = lakeMat();   // 地底湖 (洞窟の 底を ふさぐ。水面の 高さは どこでも root の y = LAKE: コースは 左右にしか 曲がらず、出口で 上がる 分は bend で 引いて ある)
  { const step = 30, nz = Math.ceil((Z1 - Z0) / step), pos = new Float32Array((nz + 1) * 6), c = new Float32Array(pos.length), idx = [];
    for(let iz = 0; iz <= nz; iz++){ const z = Z0 + iz * step; zone(z, col, true).multiplyScalar(0.2); path.frame(z, _fp, _fq);
      for(let j = 0; j < 2; j++){ v.set((j * 2 - 1) * side(z) * 1.2, LAKE - lift(z), 0).applyQuaternion(_fq).add(_fp); pos.set([v.x, LAKE, v.z], (iz * 2 + j) * 3);   /* 高さは 直接 LAKE (コースの 高さは 点の 間を 直線で つなぐ ので 出口の 上り坂で 0.4 m ほど 上下した、10/29 Codex 指摘) */ c.set([col.r, col.g, col.b], (iz * 2 + j) * 3); } }   // 横は 壁の 中まで (壁の 向こうに 隠れる)
    for(let iz = 0; iz < nz; iz++){ const a = iz * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, lake); m.renderOrder = -1; m.frustumCulled = false; root.add(m); }
  const rip = rippleMat();   // 水に 映る 結晶の 光 (先の 光を 水面で さかさまに、ゆらめく すじ)
  { const rp = [], rc = [];
    for(let i = 0; i < tipPos.length; i += 3) if(tipPos[i + 1] > LAKE){ rp.push(tipPos[i], 2 * LAKE - tipPos[i + 1], tipPos[i + 2]); rc.push(tipCol[i] * 0.5, tipCol[i + 1] * 0.5, tipCol[i + 2] * 0.5); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
    const pts = new THREE.Points(g, rip); pts.frustumCulled = false; root.add(pts); }
  { const n = mob ? 1400 : 2600, pos = new Float32Array(n * 3), c = new Float32Array(n * 3);   // 宙に 浮かぶ 光の 粒 (レールの まわりは 少なめ)
    for(let i = 0; i < n; i++){ const z = Z0 + rnd() * (Z1 - Z0); let x, y; do { x = (rnd() * 2 - 1) * side(z) * 0.8; y = -40 + rnd() * (ceil(z) + 30); } while(inCorr(x, y, z) && rnd() < 0.85);
      bend(v.set(x, y, z)); pos.set([v.x, v.y, v.z], i * 3); zone(z, col, rnd() < 0.5).lerp(new THREE.Color(1, 1, 1), 0.35); c.set([col.r, col.g, col.b], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map:glow, size:2.2, vertexColors:true, transparent:true, opacity:0.9, blending:add, depthWrite:false })); pts.frustumCulled = false; root.add(pts); }
  const fallMat = new THREE.MeshBasicMaterial({ map:fallTex(), color:0xd8ecff, transparent:true, opacity:0.55, blending:add, depthWrite:false, side:THREE.DoubleSide });   // 滝 (筋が 下へ 流れる)
  for(const f of falls){ const h = Math.max(5, f.y - LAKE), m = new THREE.Mesh(new THREE.PlaneGeometry(f.w, h), fallMat);   /* 滝は 地底湖まで */ bend(m.position.set(f.x, f.y - h / 2, f.z)); m.quaternion.setFromAxisAngle(up, Math.PI / 2).premultiply(_fq); root.add(m);   // 水の 面は コースと 平行 (レールから 見える 向き)
    const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map:glow, color:0xbfe0ff, transparent:true, opacity:0.35, blending:add, depthWrite:false })); bend(mist.position.set(f.x, f.y, f.z)); mist.scale.setScalar(f.w * 3); root.add(mist);
    const spl = new THREE.Sprite(mist.material); bend(spl.position.set(f.x, LAKE + 3, f.z)); spl.scale.setScalar(f.w * 4.5); root.add(spl); }   // 落ちた 所の しぶき
  fallMat.map.repeat.set(1, 3);

  let t = 0, ci = 0; const _c = new THREE.Vector3(), _q = new THREE.Quaternion(), fc = new THREE.Color();
  return [(cam, dt) => { if(out.dead) return; t += dt;
    fallMat.map.offset.y = (fallMat.map.offset.y + dt * 0.9) % 1;   // 滝が 流れる
    lake.uniforms.uTime.value = t; rip.userData.time.value = t;   // 水面の さざ波・映り込みの ゆらめき
    tipMat.opacity = 0.75 + 0.12 * Math.sin(t * 2.3);   // 結晶の 光が ゆっくり 息をする
    root.updateMatrixWorld(); ci = path.near(root.worldToLocal(_c.copy(cam.position)), ci);   // カメラに 一番 近い コースの 点
    crMat.uniforms.uTime.value = t; root.getWorldQuaternion(_q); crMat.uniforms.uL1.value.set(0, 0.5, 1).applyQuaternion(path.Q[ci]).applyQuaternion(_q).normalize(); crMat.uniforms.uL2.value.set(0, 1, 0).applyQuaternion(_q);   // 照り返しの 光 = いまの コースの 前方の 上・真上 (世界の 向きに 合わせる)
    const z = path.S[ci], f = Math.min(0.999, Math.max(0, z / L)) * 4, i = Math.floor(f);   // もやの 色を いまの 区間の 色へ
    lake.uniforms.uL.value.copy(crMat.uniforms.uL1.value); zone(z, lake.uniforms.uGlow.value, false).multiplyScalar(0.55);   // 水面の 光の 道 = 結晶の 照り返しと 同じ 前方の 光、映る 天井の 色 = いまの 区間の 色
    fc.copy(FOGC[i]).lerp(FOGC[Math.min(3, i + 1)], sm((f - i - 0.75) / 0.25)); scene.fog.color.lerp(fc, Math.min(1, dt * 2)); }];
}
