// 神々の 神殿 (3 面 分かれ道 ③ 左、11/2 作り直し。設計書 2026-10-27 の 2.3 節・参考の 絵 assets-warehouse/art-2026-10-27/temple-ref-*.png)
// 雲の 上に 浮かぶ 白い 大理石の 神殿の 街: 南の 長い 橋 → 外郭の 門 (第 5 層) → 大通りの 大階段を 第 5 層から 第 1 層へ → 中央神殿の 前の 金の 光の 輪 (= ワープの 輪)。
// 重い 模型は 読まず、部品 (箱・柱・尖塔・丸屋根・アーチ) を InstancedMesh で 何百も 組む。神様の 大きさ (尖塔 数百 m) = 秒速 300 m でも 大きく 見える。
// 座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)。コースは 左右に 曲がらず 上り坂だけ = 街の 南北の 軸 (x = 0)。中心 (中央神殿) は コースの 終わりの 少し 先。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { coursePath3 } from '../stage3.js';

const CLR = 45, AVE = 70;   // 大通りの 床から レールまで (m) / 大通りの 半分の 幅
const TIER_K = [0.262, 0.434, 0.596, 0.737, 0.859];   // 第 5 層 (外郭) 〜 第 1 層 (中央神殿) の 外の ふちを 通る 道のり (コースの 長さに 対して)
const PLAZA_K = 0.6;   // 各 層の うち 広場 (平ら) の 割合。残りが 次の 層への 大階段
const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし
const GLSL_HASH = 'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }';
const MARBLE = ['#fbf6ec', '#f3ead9', '#efe4cf', '#f8f1e4', '#e9dcc4'].map(c => new THREE.Color(c));
const WHITE = new THREE.Color('#ffffff');

function fallMat(){   // 滝: 白と 水色の すじが 下へ 流れる (ふちと 下は うすく)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`varying vec2 vUv; varying float vId;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; vId = float(gl_InstanceID); vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; varying vec2 vUv; varying float vId;
      #include <fog_pars_fragment>
      ${clip.pf}
      ${GLSL_HASH}
      void main(){
        ${clip.f}
        float r = h1(vec2(floor(vUv.x * 28.0), vId)), y = vUv.y * (2.0 + r) + uTime * (0.45 + 0.4 * r);
        float s = smoothstep(0.3, 1.0, fract(y + r * 7.0)), edge = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x)), top = (1.0 - smoothstep(0.97, 1.0, vUv.y)), bot = smoothstep(0.0, 0.3, vUv.y);
        gl_FragColor = vec4(mix(vec3(0.74, 0.87, 1.0), vec3(1.0), 0.35 + 0.65 * s), (0.5 + 0.45 * s) * edge * top * (0.35 + 0.65 * bot));
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
}

function sparkMat(tex){   // 光の 粒: ゆっくり 昇りながら ゆらぎ、きらめき、昇りきると 消える (加算。遠いほど もやで 弱める)   // 光の 形は 透明度 .a で 読む (白い 絵なので .r は どこも ほぼ 1 = 縁の 硬い 丸に なった、Codex 指摘)
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 }, uTex:{ value:null } }]),
    vertexShader:`uniform float uTime; attribute vec4 aRun; varying float vA;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ float k = fract(aRun.y + uTime * aRun.x / aRun.z);
        vec3 p = position + vec3(sin(uTime * 0.7 + aRun.w * 6.3) * 6.0, k * aRun.z, cos(uTime * 0.6 + aRun.w * 4.1) * 6.0);
        vA = smoothstep(0.0, 0.15, k) * (1.0 - smoothstep(0.7, 1.0, k)) * (0.55 + 0.45 * sin(uTime * 3.0 + aRun.w * 40.0));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = clamp(3200.0 / -mvPosition.z, 1.5, 22.0);
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform sampler2D uTex; varying float vA;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        gl_FragColor = vec4(1.0, 0.86, 0.55, texture2D(uTex, gl_PointCoord).a * vA);
        #ifdef USE_FOG
          gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
        #endif
        #include <colorspace_fragment>
      }` });
  m.uniforms.uTex.value = tex; return m;
}

function stoneTex(rnd){   // 大理石の 石積み (512 四方 = 32 m 四方: 横 8 m × 縦 4 m の 石を 8 段、段ごとに 半分 ずらす)。目地は 細く 濃く、石は 上が 明るく 下に 少し 影
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = '#b9a98e'; g.fillRect(0, 0, N, N);
  for(let r = 0; r < 8; r++) for(let i = -1; i < 4; i++){ const x = i * 128 + (r % 2) * 64, y = r * 64;
    g.fillStyle = `hsl(${36 + rnd() * 8}, ${18 + rnd() * 12}%, ${90 + rnd() * 7}%)`; g.fillRect(x + 3, y + 3, 122, 58);
    const lg = g.createLinearGradient(0, y + 3, 0, y + 61); lg.addColorStop(0, 'rgba(255,255,255,0.18)'); lg.addColorStop(1, 'rgba(120,100,70,0.12)'); g.fillStyle = lg; g.fillRect(x + 3, y + 3, 122, 58); }
  for(let i = 0; i < 2500; i++){ g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '140,120,90'},${0.05 + rnd() * 0.08})`; g.fillRect(rnd() * N, rnd() * N, 2, 2); }   // 石の 粒
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function stoneMat(tex, color){   // 石積みの 大理石: 置いた 後の 大きさ (root の 座標) で 模様を 貼る = 建物の 大きさに よらず 石の 大きさが そろう (面の 向きで 3 方向から 混ぜる)。遠いほど 模様を 薄く (ちらつかない)
  const m = new THREE.MeshLambertMaterial({ color }); m.userData.stone = tex;   // 片づけの 時に 模様の 絵も 捨てる (stage3.js の dispose)
  m.onBeforeCompile = s => { s.uniforms.uStone = { value:tex };
    s.vertexShader = 'varying vec3 vSP; varying vec3 vSN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n  vSP = (instanceMatrix * vec4(transformed, 1.0)).xyz; vSN = mat3(instanceMatrix) * objectNormal;\n#else\n  vSP = transformed; vSN = objectNormal;\n#endif');
    s.fragmentShader = 'uniform sampler2D uStone; varying vec3 vSP; varying vec3 vSN;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  vec3 sn = abs(normalize(vSN)), sw = sn * sn * sn * sn; sw /= sw.x + sw.y + sw.z + 1e-5;
  vec3 st = texture2D(uStone, vSP.zy * 0.03125).rgb * sw.x + texture2D(uStone, vSP.xz * 0.03125).rgb * sw.y + texture2D(uStone, vSP.xy * 0.03125).rgb * sw.z;
  diffuseColor.rgb *= mix(st * 1.22, vec3(1.0), smoothstep(700.0, 3200.0, length(vViewPosition)));`); };   /* 1.22 = 模様の 平均の 明るさを 1 に (石積みに しても 街の 明るさは 変えない) */
  return m;
}

export function puffTex(rnd){   // 雲の かたまり 1 つ (丸を 重ねた もくもく。上は お日さまで 白く、下ほど 青い 影)
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  for(let i = 0; i < 16; i++){ const a = rnd() * Math.PI * 2, d = rnd() * 60, x = 128 + Math.cos(a) * d, y = 140 + Math.sin(a) * d * 0.6 - rnd() * 20, r = 45 + rnd() * 45, rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.6, 'rgba(255,255,255,0.75)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(0, 40, 0, 230); lg.addColorStop(0, 'rgba(255,250,240,0)'); lg.addColorStop(0.55, 'rgba(190,205,228,0.35)'); lg.addColorStop(1, 'rgba(120,140,178,0.75)'); g.fillStyle = lg; g.fillRect(0, 0, N, N);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function puffMat(tex){   // 雲 (いつも カメラを 向く 板を 何百も 1 回で 描く。aP = 中心 xyz・大きさ、aS = 明るさ (0 = 下の 影 〜 1 = 上の 日なた)・少しの 傾き)
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex:{ value:null } }]),
    vertexShader:`attribute vec4 aP; attribute vec2 aS; varying vec2 vUv; varying float vShade;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; vShade = aS.x; vec4 mvPosition = modelViewMatrix * vec4(aP.xyz, 1.0); float c = cos(aS.y), s = sin(aS.y);
        mvPosition.xy += mat2(c, s, -s, c) * position.xy * aP.w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform sampler2D uTex; varying vec2 vUv; varying float vShade;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        vec4 t = texture2D(uTex, vUv); if(t.a < 0.01) discard;
        gl_FragColor = vec4(t.rgb * (0.8 + 0.24 * vShade) * vec3(1.0, 0.985, 0.95), t.a * 0.96);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uTex.value = tex; return m;
}

function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }

function envTex(sun, rnd){   // 金に 映す 景色 (横長の 全天の 絵): 上 = 青空、地平線 = 朝焼けの 金色、下 = 雲の 海、朝日の 光の 玉。three.js が 映り込み用に 変換する (r187 で 映り込みの 質が 上がった)
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#3a72c8'); lg.addColorStop(0.4, '#9cc2f0'); lg.addColorStop(0.5, '#ffdcb0'); lg.addColorStop(0.53, '#fbf3ea'); lg.addColorStop(0.78, '#e2d8cc'); lg.addColorStop(1, '#9c9286'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  for(let i = 0; i < 40; i++){ const x = rnd() * W, y = H * (0.48 + rnd() * 0.16), r = 30 + rnd() * 70, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }   // 地平線の 雲
  const d = new THREE.Vector3(...sun).normalize(), sx = (Math.atan2(d.z, d.x) / (2 * Math.PI) + 0.5) * W, sy = (0.5 - Math.asin(d.y) / Math.PI) * H;   // 朝日の 位置 (three.js の 全天の 絵の 決まり: 横 = atan(z, x)、縦 = asin(y))
  for(const ox of [-W, 0, W]){ const x = sx + ox, rg = g.createRadialGradient(x, sy, 0, x, sy, 170); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.12, 'rgba(255,246,214,1)'); rg.addColorStop(0.4, 'rgba(255,214,150,0.55)'); rg.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = rg; g.fillRect(x - 170, sy - 170, 340, 340); }
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function statueGeo(){   // 光の 輪を 背負った 像 (高さ 1、足元が 原点、+Z が 正面): 衣の 体・肩・頭・上げた 腕・左右の 翼 (大理石) と 背中の 光の 輪・杖 (金)
  const ni = g => g.index ? g.toNonIndexed() : g;
  const wing = sgn => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(sgn * 0.08, 0.2, sgn * 0.2, 0.42, sgn * 0.36, 0.5); s.bezierCurveTo(sgn * 0.33, 0.32, sgn * 0.26, 0.12, sgn * 0.12, -0.18); s.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(s, { depth:0.025, bevelEnabled:false, curveSegments:8 }).rotateY(sgn * 0.55).translate(sgn * 0.05, 0.62, -0.09); };   // 翼は 肩の 後ろから 外へ、先を 後ろへ 反らす
  const m = [new THREE.CylinderGeometry(0.11, 0.24, 0.62, 14).translate(0, 0.31, 0), new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12).translate(0, 0.72, 0),
    new THREE.SphereGeometry(0.115, 12, 8).scale(1.25, 0.55, 0.8).translate(0, 0.82, 0), new THREE.SphereGeometry(0.066, 14, 10).translate(0, 0.925, 0.01),
    new THREE.CylinderGeometry(0.028, 0.034, 0.34, 8).rotateZ(0.35).translate(-0.17, 0.86, 0.04), wing(1), wing(-1)].map(ni);
  const g = [new THREE.TorusGeometry(0.105, 0.011, 8, 40).translate(0, 0.94, -0.07), new THREE.CylinderGeometry(0.012, 0.012, 1.2, 8).translate(-0.22, 0.6, 0.04),
    new THREE.TorusGeometry(0.045, 0.009, 6, 20).translate(-0.22, 1.22, 0.04), new THREE.SphereGeometry(0.02, 8, 6).translate(-0.22, 1.22, 0.04)].map(ni);
  return [mergeGeometries(m), mergeGeometries(g)];
}

function bannerTex(){   // 青い 旗 (上に 金の 棒・金の ふち・金の 紋章、下は 燕の 尾)
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  g.beginPath(); g.moveTo(2, 0); g.lineTo(62, 0); g.lineTo(62, 238); g.lineTo(32, 212); g.lineTo(2, 238); g.closePath(); g.fillStyle = '#1d3c96'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#e8bb52'; g.stroke();
  g.fillStyle = '#e8bb52'; g.fillRect(0, 0, 64, 14); g.lineWidth = 3; g.beginPath(); g.arc(32, 72, 15, 0, Math.PI * 2); g.stroke();
  g.beginPath(); for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, r = i % 2 ? 4 : 11; g.lineTo(32 + Math.sin(a) * r, 72 - Math.cos(a) * r); } g.closePath(); g.fill();   // 紋章 = 円の 中の 八つの 光の 星
  g.fillRect(29, 96, 6, 90); g.fillRect(18, 120, 28, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function archGeo(){   // アーチの 柱間 1 つ (幅 1・高さ 1・奥行き 1、下の まん中が 原点、+Z が 表): 幅 0.6 の 開口 (高さ 0.55 まで まっすぐ + 半円)
  const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 1); s.lineTo(-0.5, 1); s.lineTo(-0.5, 0);
  const h = new THREE.Path(); h.moveTo(-0.3, 0); h.lineTo(0.3, 0); h.lineTo(0.3, 0.55); h.absarc(0, 0.55, 0.3, 0, Math.PI, false); h.lineTo(-0.3, 0); s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, { depth:1, bevelEnabled:false, curveSegments:10 }).translate(0, 0, -0.5);
}

export function* build(scene, root, P, opts, out){
  const mob = !!opts.mobile, path = coursePath3(P, opts.nextBranch !== false), L = path.len;
  let seed = 20261102; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  scene.fog = new THREE.Fog('#cfe4f6', 4000, mob ? 18000 : 24000);   // 澄んだ 水色の 霞 (前の 黄土色の 霞 = 曇り空に 見えた、11/2 社長「もっと 晴れ渡って」)
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3();
  const hemi = new THREE.HemisphereLight('#e4eeff', '#b8977a', 1.25), sun = new THREE.DirectionalLight('#fff0d6', 2.4);   // 空の 明るさ + 後ろ左の 低い 朝日 (空の 太陽と 同じ 向き) = 街の 正面が 金色に 照らされる
  sun.position.set(...P.def.sky.sun).normalize().multiplyScalar(1000); root.add(hemi, sun, sun.target);
  const env = envTex(P.def.sky.sun, rnd);   // 金の 部品 (本物の 金属) だけに 空と 朝日を 映す (scene.environment に すると 大理石 (Lambert) まで 空の 明るさを 受けて 街 全体が 白く なった、11/2 社長)。向きは 毎コマ root に 合わせる (下の tick)
  const gold = new THREE.MeshStandardMaterial({ color:'#f3c65e', metalness:1, roughness:0.3, envMap:env, envMapIntensity:1.2 });

  yield;
  // コースの 高さと 奥行き (25 m ごと)。層の ふちの 半径 R・床の 高さ F (中心 = 中央神殿)
  const N = Math.ceil(L / 25), CY = new Float32Array(N + 1), CZ = new Float32Array(N + 1);
  for(let i = 0; i <= N; i++){ path.frame(i * L / N, v, q); CY[i] = v.y; CZ[i] = v.z; }
  const lerpA = (A, s) => { const t = Math.max(0, Math.min(N, s / L * N)), i = Math.min(N - 1, Math.floor(t)); return A[i] + (A[i + 1] - A[i]) * (t - i); };
  const cy = s => lerpA(CY, s), cz = s => lerpA(CZ, s);
  const S = TIER_K.map(k => k * L), zc = cz(L) + 320, R = S.map(s => zc - cz(s)), F = S.map(s => cy(s) - CLR);
  const PE = S.map((s, k) => k < 4 ? s + PLAZA_K * (S[k + 1] - s) : L);   // 広場の 終わり (ここから 次の 層への 大階段)
  const XM = mob ? 1600 : 2100;   // 作る 横の 範囲 (コースから m)

  const box = [], cyl = [], cone = [], dome = [], bdome = [], ball = [], arch = [], tree = [], falls = [], flames = [], statues = [], banners = [];
  const statue = (x, y, z, s, ry, ped) => { if(ped) put(box, x, y, z, s * 0.36, ped, s * 0.36); statues.push({ x, y:y + (ped || 0), z, w:s, h:s, d:s, ry, rx:0, c:MARBLE[0] }); };   // 像 (高さ s) と 台座 (高さ ped)
  const mc = () => MARBLE[(rnd() * MARBLE.length) | 0];
  const put = (list, x, y, z, w, h, d, ry = 0, c = null, rx = 0) => list.push({ x, y, z, w, h, d, ry, rx, c: c || mc() });
  const onRing = (r, th, y) => [r * Math.sin(th), y, zc - r * Math.cos(th)];   // 中心から 半径 r・角度 th (0 = 南 = 手前、+ = 左) の 点
  const spire = (x, y, z, r, h) => { put(cone, x, y, z, r * 2, h, r * 2); put(ball, x, y + h, z, r * 0.7, r * 0.7, r * 0.7, 0, WHITE); };   // 尖塔 + 金の 玉

  yield;
  // 段の 壁 (円弧、外向き): 前面に アーチの 列、少し 奥に 影の 壁、上に 小さな 尖塔。大通りの 所は 開ける
  const backs = [];
  const wall = (r, y0, y1, gap, flow) => {
    const h = y1 - y0, a0 = Math.asin(Math.min(1, gap / r)), a1 = Math.asin(Math.min(1, XM / r)), bw = 36, rows = h > 130 ? 2 : 1, da = bw / r;
    if(a1 <= a0) return;
    for(const sg of [1, -1]){ const g = new THREE.CylinderGeometry(r - 14, r - 14, h, Math.max(6, Math.ceil((a1 - a0) * r / 60)), 1, true, sg > 0 ? Math.PI - a1 : Math.PI + a0, a1 - a0).translate(0, y0 + h / 2, zc); backs.push(g); }
    let n = 0; for(let a = a0 + da / 2; a < a1; a += da, n++) for(const sg of [1, -1]){ const th = sg * a, [x, , z] = onRing(r, th, 0), ry = Math.PI - th;
      for(let j = 0; j < rows; j++) put(arch, x, y0 + j * h / rows, z, bw, h / rows, 9, ry);
      if(n % 3 === 1) spire(x, y1, z, 4 + rnd() * 3, 28 + rnd() * 50);
      if(n % 3 === 0){ const bh = Math.min(64, h * 0.36), [bx, , bz] = onRing(r + 5.5, sg * (a + da / 2), 0); banners.push({ x:bx, y:y1 - 6 - bh / 2, z:bz, w:12, h:bh, ry }); }   // 柱の 前に 青い 旗
      if(flow && n % 11 === 5 && rnd() < 0.8){ const [fx, , fz] = onRing(r + 7, th, 0); falls.push({ x:fx, y:y0 + h / 2, z:fz, w:30 + rnd() * 30, h, ry }); } } };
  wall(R[0], F[0], F[0] + 120, AVE + 60, false);   // 外郭の 壁 (第 5 層の ふち。門は 下)
  for(let k = 0; k < 4; k++) wall(R[k + 1], F[k], F[k + 1], AVE + 14, true);   // 第 5〜2 層の 内側の 段 (上の 層の 縁から 滝)

  yield;
  // 層の 床 (円の 一部、平ら)
  const floors = [];
  for(let k = 0; k < 5; k++){ const rIn = k < 4 ? R[k + 1] - 14 : 0, rOut = R[k], a = Math.asin(Math.min(1, XM / rOut));
    floors.push(new THREE.RingGeometry(rIn, rOut, Math.max(16, Math.ceil(a * rOut / 80)), 1, Math.PI / 2 - a, 2 * a).rotateX(-Math.PI / 2).translate(0, F[k], zc)); }

  yield;
  // 大通り: 広場 (平ら) と 大階段。両側の 手すり と 青い 炎の 灯
  const floorAt = s => { if(s < S[0]) return F[0]; for(let k = 4; k >= 0; k--) if(s >= S[k]){ if(k === 4 || s <= PE[k]) return F[k]; return F[k] + (F[k + 1] - F[k]) * (s - PE[k]) / (S[k + 1] - PE[k]); } return F[0]; };
  for(let k = 0; k < 5; k++){ const z0 = cz(S[k]), z1 = cz(k < 4 ? PE[k] : L) + (k < 4 ? 0 : 200);
    put(box, 0, F[k] - 7.2, (z0 + z1) / 2, 2 * AVE, 8, z1 - z0);   // 広場の 上面は 層の 床より 0.8 m 上 (同じ 高さだと 2 枚が 重なって ちらつく、Codex 指摘)
    for(const sg of [1, -1]){ put(box, sg * (AVE + 2), F[k], (z0 + z1) / 2, 4, 5, z1 - z0); for(let z = z0 + 30; z < z1; z += 70){ put(cyl, sg * (AVE + 2), F[k], z, 6, 24, 6); put(ball, sg * (AVE + 2), F[k] + 24, z, 4, 4, 4, 0, WHITE); flames.push(sg * (AVE + 2), F[k] + 30, z); }
      for(let z = z0 + 110; z < Math.min(z1, zc - 270) - 40; z += 190) statue(sg * (AVE + 18), F[k], z, 46, sg > 0 ? -2.356 : 2.356, 16); }   /* 広場の 両脇の 像 (大通りの まん中と 手前を 向く) */
    if(k < 4){ const rise = F[k + 1] - F[k], n = Math.max(8, Math.round(rise / 6)), za = cz(PE[k]), zb = cz(S[k + 1]), run = (zb - za) / n;
      for(let i = 0; i < n; i++) put(box, 0, F[k] + rise * i / n - 2, za + run * (i + 0.5), 2 * AVE, rise / n + 2, run + 0.5, 0, MARBLE[i % 2 ? 0 : 2]);
      const ang = Math.atan2(rise, zb - za), len = Math.hypot(rise, zb - za);
      for(const sg of [1, -1]) put(box, sg * (AVE + 2), F[k] + rise / 2 - 3, (za + zb) / 2, 4, 6, len, 0, null, -ang); }
    { const zm = (z0 + z1) / 2, fl = new THREE.Mesh(new THREE.CircleGeometry(48, 48).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color:'#7fc4ee', emissive:'#1a4a70' })); fl.position.set(0, F[k] + 1.4, zm); root.add(fl);   // 広場の まん中の 泉 (金の 輪で ふち取り)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(52, 3, 8, 64).rotateX(Math.PI / 2), gold); rim.position.set(0, F[k] + 2.3, zm); root.add(rim); } }

  yield;
  // 外郭の 門 (第 5 層の ふち): 左右の 門の 塔 + 大きな アーチ (レールが くぐる)
  { const z = cz(S[0]) - 4;
    put(arch, 0, F[0], z, 2 * AVE + 40, 210, 34, 0); put(box, 0, F[0] + 210, z, 2 * AVE + 60, 18, 40);
    for(const sg of [1, -1]){ const x = sg * (AVE + 50); put(box, x, F[0], z, 64, 240, 64); put(cyl, x, F[0] + 240, z, 50, 40, 50); put(bdome, x, F[0] + 280, z, 52, 46, 52, 0, WHITE); spire(x, F[0] + 300, z, 6, 120);
      for(const dx of [-24, 24]) spire(x + dx, F[0] + 240, z - 24, 5, 60);
      statue(x, F[0], z - 62, 80, Math.PI, 30); banners.push({ x, y:F[0] + 170, z:z - 33.5, w:22, h:100, ry:Math.PI }); }   /* 門の 塔の 前の 大きな 像 と 旗 */
    spire(0, F[0] + 228, z, 7, 90); }
  yield;
  // 門の 金の 扉 2 枚 (11/2 社長「大きな 門が ゆっくり 開いて 出迎えて。遠くでは 閉まって いて、近づくと 開く」): アーチの 開口 (幅 108・まっすぐ 115.5 m + 楕円の 上 63 m) を ふさぐ 形、アーチの 奥の 面に 蝶番、内側 (街の 側) へ 開く
  const doors = [], gz = cz(S[0]) - 4, camL = new THREE.Vector3(), doorM = new THREE.MeshLambertMaterial({ color:"#3a5fc4", emissive:"#101e48" });   // 扉は お城の 丸屋根と 同じ 青 (11/2 社長)、飾りは 金
  { const W = 54, H0 = 115.5, RY = 63, zb = gz - 17;   // 蝶番は アーチの 手前の 面 (手前へ 開く、11/2 社長)
    for(const sg of [1, -1]){ const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0, H0); for(let i = 1; i <= 16; i++){ const u = i / 16; s.lineTo(-sg * W * u, H0 + RY * Math.sqrt(Math.max(0, 1 - (1 - u) ** 2))); } s.lineTo(-sg * W, 0); s.lineTo(0, 0);   // 蝶番 (原点) から まん中へ
      const pv = new THREE.Group(); pv.position.set(sg * W, F[0], zb); root.add(pv);
      pv.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:5, bevelEnabled:false }), doorM));   // 厚み 5 m は アーチの 中 (奥) 側
      for(const y of [28, 64]){ const b = new THREE.Mesh(new THREE.BoxGeometry(W, 2.6, 1.2), gold); b.position.set(-sg * W / 2, y, -0.6); pv.add(b); }   // 金の 帯 2 本
      { const b = new THREE.Mesh(new THREE.BoxGeometry(3, H0 + RY, 1.2), gold); b.position.set(-sg * (W - 1.5), (H0 + RY) / 2, -0.6); pv.add(b); }   // 合わせ目の 金の 縁
      const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 1.6, 8, 40), gold), boss = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), gold); ring.position.set(-sg * 27, 92, -0.8); boss.position.set(-sg * 27, 92, -1); pv.add(ring, boss);   // 丸い 紋章
      doors.push({ pv, sg }); } }

  yield;
  // 南の 橋 (原点の 手前から 門まで): 床・手すり・灯・雲へ 落ちる 柱
  { const z0 = -500, z1 = cz(S[0]) - 20, Fb = F[0];
    put(box, 0, Fb - 22, (z0 + z1) / 2, 2 * AVE + 16, 22, z1 - z0);
    for(const sg of [1, -1]){ put(box, sg * (AVE + 6), Fb, (z0 + z1) / 2, 4, 5, z1 - z0); for(let z = z0 + 40; z < z1; z += 90){ put(cyl, sg * (AVE + 6), Fb, z, 6, 22, 6); put(ball, sg * (AVE + 6), Fb + 22, z, 4, 4, 4, 0, WHITE); flames.push(sg * (AVE + 6), Fb + 28, z); } }
    for(let z = z0 + 300; z < z1 - 100; z += 340) for(const sg of [1, -1]) statue(sg * (AVE - 8), Fb, z, 40, sg > 0 ? -2.356 : 2.356, 12);   // 橋の 上の 像
    for(let z = z0 + 80; z < z1; z += 170){ for(const sg of [1, -1]) put(box, sg * (AVE - 6), -1100, z, 28, Fb - 22 + 1100, 36);
      put(arch, AVE + 8, Fb - 22 - 150, z + 85, 170, 150, 10, Math.PI / 2); put(arch, -AVE - 8, Fb - 22 - 150, z + 85, 170, 150, 10, -Math.PI / 2); } }

  yield;
  // 層の 上の 建物 (大通りから 離れるほど まばら・低く)。重ならない ように 間を あける
  const lots = [], free = (x, z, r) => { for(const o of lots) if((o.x - x) ** 2 + (o.z - z) ** 2 < (o.r + r) ** 2) return false; lots.push({ x, z, r }); return true; };
  const building = (x, y, z, ry, near, k) => {
    const kind = rnd(), s = 0.65 + 0.7 * near;
    if(kind < 0.34){ const w = 50 + rnd() * 60, d = 40 + rnd() * 50, h = (45 + rnd() * 70) * s; if(!free(x, z, Math.max(w, d) * 0.6)) return;   // 大広間 (角に 尖塔、ときどき 青い 丸屋根)
      put(box, x, y, z, w, h, d, ry); put(box, x, y + h, z, w * 0.8, 8, d * 0.8, ry);
      if(rnd() < 0.5) put(bdome, x, y + h + 8, z, w * 0.45, w * 0.32, w * 0.45, 0, WHITE);
      const c = Math.cos(ry), sn = Math.sin(ry); for(const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const lx = px * w * 0.45, lz = pz * d * 0.45; spire(x + lx * c + lz * sn, y + h, z - lx * sn + lz * c, 4, 25 + rnd() * 30); } }
    else if(kind < 0.68){ const r = 9 + rnd() * 11, h = (90 + rnd() * 170) * s; if(!free(x, z, r * 1.8)) return;   // 塔 + 尖塔
      put(cyl, x, y, z, r * 2, h, r * 2); put(cyl, x, y + h, z, r * 2.4, 6, r * 2.4); spire(x, y + h + 6, z, r * 1.05, r * (3.5 + rnd() * 3)); }
    else { const r = 20 + rnd() * 22, h = (35 + rnd() * 45) * s; if(!free(x, z, r * 1.5)) return;   // 丸屋根の 神殿 (四角い 台 + 太鼓 + 青い 丸屋根 + 金の 頂)
      put(box, x, y, z, r * 2.5, h, r * 2.5, ry); put(cyl, x, y + h, z, r * 2, r * 0.7, r * 2); put(bdome, x, y + h + r * 0.7, z, r * 2, r * (1.2 + rnd() * 0.8), r * 2, 0, WHITE); spire(x, y + h + r * 1.9, z, r * 0.2, r * 1.1); } };
  for(let k = 0; k < 5; k++){ const rIn = k < 4 ? R[k + 1] + 30 : 440, rOut = R[k] - 40, n = mob ? 55 : 95; if(rOut <= rIn) continue;
    for(let i = 0; i < n * 3 && i < 900; i++){ const sg = rnd() < 0.5 ? 1 : -1, lat = AVE + 45 + Math.pow(rnd(), 1.5) * (XM - AVE - 45), rr = rIn + rnd() * (rOut - rIn); if(lat >= rr) continue;
      const th = sg * Math.asin(lat / rr), [x, , z] = onRing(rr, th, 0); building(x, F[k], z, Math.PI - th, 1 - lat / XM, k);
      if(k === 2 && rnd() < 0.6){ for(let t = 0; t < 4; t++){ const tx = x + (rnd() - 0.5) * 120, tz = z + (rnd() - 0.5) * 120; if(Math.abs(tx) > AVE + 20) put(tree, tx, F[k], tz, 10 + rnd() * 6, 30 + rnd() * 30, 10 + rnd() * 6, 0, new THREE.Color().setHSL(0.33 + rnd() * 0.06, 0.45, 0.22 + rnd() * 0.08)); } } } }   /* 第 3 層 = 参拝の 庭園 (糸杉) */
  for(let k = 0; k < 4; k++) for(let i = 0; i < (mob ? 10 : 18); i++){ const sg = rnd() < 0.5 ? 1 : -1, lat = AVE + 120 + rnd() * 900, rr = R[k + 1] + 60 + rnd() * (R[k] - R[k + 1] - 120); if(lat >= rr) continue;   // 大きな 尖塔 (無数の 尖塔の 背の 高い もの)
    const th = sg * Math.asin(lat / rr), [x, , z] = onRing(rr, th, 0), h = 140 + rnd() * 120; if(!free(x, z, 22)) continue; put(cyl, x, F[k], z, 22, h, 22); spire(x, F[k] + h, z, 12, 160 + rnd() * 160); }

  yield;
  // 中央神殿 (第 1 層の まん中): 台座 → 本殿 (金の 大きな 門) → 太鼓 → 金の 大丸屋根 → 尖塔。まわりに 背の 高い 尖塔の 輪
  { const y = F[4];
    put(box, 0, y, zc, 620, 60, 470); put(box, 0, y + 60, zc + 20, 480, 150, 360); put(box, 0, y + 210, zc + 20, 420, 10, 300);
    put(arch, 0, y + 60, zc - 162, 130, 150, 14, 0, new THREE.Color('#ffe2a0'));
    for(const sg of [1, -1]){ statue(sg * 240, y + 60, zc - 200, 120, Math.PI, 0); for(const bx of [120, 200]) banners.push({ x:sg * bx, y:y + 145, z:zc - 161.5, w:26, h:110, ry:Math.PI }); }   // 本殿の 前の 巨大な 像 と 正面の 旗
    { const door = new THREE.Mesh(new THREE.PlaneGeometry(78, 82), new THREE.MeshBasicMaterial({ color:'#ffd77a' })); door.position.set(0, y + 60 + 41, zc - 161); door.rotation.y = Math.PI; root.add(door); }   // 門の 奥の 金の 光
    put(cyl, 0, y + 220, zc + 20, 190, 90, 190); put(dome, 0, y + 310, zc + 20, 190, 160, 190, 0, WHITE); put(cyl, 0, y + 390, zc + 20, 22, 40, 22); spire(0, y + 430, zc + 20, 15, 120);
    for(let i = 0; i < 10; i++){ const a = (i + 0.5) / 10 * Math.PI * 2, x = Math.sin(a) * 150, z = zc + 20 - Math.cos(a) * 150; put(cyl, x, y + 220, z, 18, 60 + (i % 2) * 40, 18); spire(x, y + 280 + (i % 2) * 40, z, 10, 170 + (i % 2) * 60); }
    for(const [x, z] of [[-200, zc - 120], [200, zc - 120], [-200, zc + 170], [200, zc + 170]]){ put(cyl, x, y + 60, z, 56, 230, 56); put(cyl, x, y + 290, z, 64, 10, 64); put(bdome, x, y + 300, z, 60, 64, 60, 0, WHITE); spire(x, y + 362, z, 6, 90); }
    for(let i = 0; i < 26; i++){ const t = i / 26, side = Math.floor(t * 4), u = (t * 4) % 1, hw = 230, hd = 170, px = [-hw + 2 * hw * u, hw, hw - 2 * hw * u, -hw][side], pz = [-hd, -hd + 2 * hd * u, hd, hd - 2 * hd * u][side]; spire(px, y + 210, zc + 20 + pz, 5, 40 + rnd() * 40); } }

  yield;
  // 浮島の 岩 (街の 下、雲へ 細く なって 消える)
  { const r0 = R[0] + 80, pts = [[60, F[0] - 2300], [r0 * 0.35, F[0] - 1700], [r0 * 0.75, F[0] - 950], [r0 - 160, F[0] - 380], [r0 - 20, F[0] - 90], [r0, F[0] - 4]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 72), p = g.attributes.position, cl = new Float32Array(p.count * 3), c = new THREE.Color();
    for(let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z), k = (y < F[0] - 30 ? 1 : 0) * (0.85 + 0.3 * Math.sin(x * 0.004 + y * 0.003) * Math.cos(z * 0.005)); p.setX(i, x * k + x * (1 - (y < F[0] - 30 ? 1 : 0))); p.setZ(i, z * k + z * (1 - (y < F[0] - 30 ? 1 : 0)));
      c.set('#bda98e').lerp(new THREE.Color('#7d6f60'), Math.min(1, (F[0] - y) / 2000)); if(y > F[0] - 200 && r > r0 * 0.8 && Math.sin(x * 0.01) * Math.cos(z * 0.012) > 0.2) c.set('#6f8a4e'); cl.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors:true })); m.position.z = zc; m.frustumCulled = false; root.add(m);
    for(let i = 0; i < 9; i++){ const a = (rnd() - 0.5) * 1.6, [x, , z] = onRing(R[0] + 4, a, 0); if(Math.abs(x) < AVE + 200) continue; falls.push({ x, y:F[0] - 900, z, w:50 + rnd() * 50, h:1800, ry:Math.PI - a }); } }   // 島の ふちから 雲へ 落ちる 滝

  yield;
  // 遠くの 浮島の 城 (左右の 空、形が 分かる 程度)
  for(let i = 0; i < 6; i++){ const sg = i % 2 ? 1 : -1, x = sg * (3200 + rnd() * 3500), z = 1500 + i * 2300 + rnd() * 1200, y = -200 + rnd() * 900, r = 260 + rnd() * 260;
    put(cone, x, y, z, r * 2, r * 2.2, r * 2, 0, new THREE.Color('#b3a289'), Math.PI);   // 逆さの 円すい = 岩 (上の 面が y)
    for(let j = 0; j < 7; j++){ const dx = (rnd() - 0.5) * r, dz = (rnd() - 0.5) * r, h = r * (0.3 + rnd() * 0.9); put(cyl, x + dx, y, z + dz, r * 0.16, h, r * 0.16); spire(x + dx, y + h, z + dz, r * 0.1, r * (0.4 + rnd() * 0.5)); }
    put(bdome, x, y + r * 0.5, z, r * 0.5, r * 0.4, r * 0.5, 0, WHITE); }

  yield;
  // 部品を 描く (InstancedMesh)
  const stone = stoneTex(rnd), marble = stoneMat(stone, '#ffffff'), smooth = new THREE.MeshLambertMaterial({ color:'#ffffff' }), blue = new THREE.MeshLambertMaterial({ color:'#3a5fc4', emissive:'#101e48' }), green = new THREE.MeshLambertMaterial({ color:'#ffffff' });
  const inst = (geo, mat, list) => { if(!list.length) return null; const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((o, i) => { mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e.set(o.rx, o.ry, 0, 'YXZ')), s3.set(o.w, o.h, o.d))); mesh.setColorAt(i, o.c); });
    mesh.instanceMatrix.needsUpdate = true; if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; root.add(mesh); return mesh; };
  inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), marble, box);
  inst(new THREE.CylinderGeometry(0.5, 0.5, 1, 12).translate(0, 0.5, 0), marble, cyl);
  inst(new THREE.CylinderGeometry(0, 0.5, 1, 8).translate(0, 0.5, 0), marble, cone);
  inst(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1), gold, dome);
  inst(new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1), blue, bdome);
  inst(new THREE.SphereGeometry(0.5, 10, 6), gold, ball);
  inst(archGeo(), marble, arch);
  inst(new THREE.ConeGeometry(0.5, 1, 7).translate(0, 0.5, 0), green, tree);
  { const [sm, sgld] = statueGeo(); inst(sm, smooth, statues); inst(sgld, gold, statues.map(o => ({ ...o, c:WHITE }))); }   // 像 (大理石の 体 + 金の 光の 輪と 杖)
  const bu = { value:0 }, bm = new THREE.MeshLambertMaterial({ map:bannerTex(), side:THREE.DoubleSide, alphaTest:0.5 });   // 旗: 下ほど 大きく 風に ゆれる (板の 厚み方向の 拡大 10 = ゆれ 最大 約 2.5 m)
  bm.onBeforeCompile = s => { s.uniforms.uTime = bu; s.vertexShader = 'uniform float uTime;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed.z += (0.5 + 0.5 * sin(uTime * 2.2 + position.y * 5.0 + float(gl_InstanceID) * 1.7)) * 0.25 * (0.5 - position.y);'); };   /* 前 (壁から 離れる 向き) だけに ゆれる (後ろへ ゆれると 壁に めり込んだ、11/2 社長) */
  inst(new THREE.PlaneGeometry(1, 1, 1, 8), bm, banners.map(o => ({ ...o, d:10, rx:0, c:WHITE })));
  { const mt = stoneMat(stone, '#cfc0a6'); mt.side = THREE.DoubleSide; const m = new THREE.Mesh(mergeGeometries(backs), mt); m.frustumCulled = false; root.add(m); }   // アーチの 奥の 影の 壁
  { const m = new THREE.Mesh(mergeGeometries(floors), stoneMat(stone, '#efe5d2')); m.frustumCulled = false; root.add(m); }   // 層の 床 (上から 見ると 石畳)
  const fm = fallMat();
  { const mesh = inst(new THREE.PlaneGeometry(1, 1), fm, falls.map(o => ({ ...o, rx:0, d:1, c:WHITE })));   // 滝 (板の まん中が 位置)
    if(mesh) falls.forEach((o, i) => mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e.set(0, o.ry, 0)), s3.set(o.w, o.h, 1)))); }
  const gt = glowTex();
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flames), 3));   // 灯の 青い 炎
    const fmt = new THREE.PointsMaterial({ color:"#8fdcff", size:16, map:gt, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
    fmt.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace("#include <fog_fragment>", "#ifdef USE_FOG\n  gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);\n#endif"); };   // 遠いほど 薄く (加算の 光に ふつうの もやを かけると 遠くで 白く 残る、Codex 指摘)
    const p = new THREE.Points(g, fmt); p.frustumCulled = false; root.add(p); }
  const spm = sparkMat(gt);
  { const n = mob ? 1400 : 2800, pos = new Float32Array(n * 3), run = new Float32Array(n * 4);   // 光の 粒 (大通りの まわりに 多く、各 層の 床・島の 外は 雲から 昇る)
    for(let i = 0; i < n; i++){ const x = (rnd() < 0.5 ? 1 : -1) * Math.pow(rnd(), 1.3) * 1300, z = -400 + rnd() * (zc + 600), r = Math.hypot(x, z - zc);
      let y0 = -650, H = 600; for(let k = 4; k >= 0; k--) if(r <= R[k]){ y0 = F[k]; H = 350 + rnd() * 250; break; }
      pos.set([x, y0, z], i * 3); run.set([8 + rnd() * 14, rnd(), H, rnd()], i * 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aRun', new THREE.BufferAttribute(run, 4));
    const p = new THREE.Points(g, spm); p.frustumCulled = false; root.add(p); }

  yield;
  // 雲 (11/2 社長「晴れ渡って いるけど 雲が めっちゃ カッコいい」): 眼下の 雲の 海・遠くに そびえる 入道雲の 柱・中央神殿の 奥の 大きな 雲・島の そばを 流れる 小さな 雲。全部 1 回で 描く
  { const puffs = [], K = mob ? 0.65 : 1;
    const tower = (cx, cy, cz, w, h) => { const n = Math.round((18 + h / 110) * K); for(let j = 0; j < n; j++){ const u = Math.pow(rnd(), 0.8), rr = w * 0.5 * (1 - u * 0.6) * Math.sqrt(rnd()), a = rnd() * Math.PI * 2;   // 入道雲: 下ほど 太く、上ほど 細く 明るい
      puffs.push([cx + Math.cos(a) * rr, cy + u * h, cz + Math.sin(a) * rr * 0.7, w * (0.3 + rnd() * 0.22) * (1 - u * 0.45), 0.3 + 0.7 * u, (rnd() - 0.5) * 0.5]); } };
    for(let i = 0; i < Math.round(170 * K); i++) puffs.push([(rnd() - 0.5) * 18000, -2000 + rnd() * 250, -4000 + rnd() * (zc + 13000), 1600 + rnd() * 1200, 0.55 + rnd() * 0.3, (rnd() - 0.5) * 0.4]);   // 雲の 海 (島の 約 1.8 km 下。板の 上の 端 = 中心 + 大きさの 半分 が 橋より 下に 収まる: 前は −1150 m・最大 3.2 km で 上の 端が 橋や 門の 高さに 突き出し 白い 壁に 見えた、11/2 社長)
    for(let i = 0; i < 10; i++){ const sg = i % 2 ? 1 : -1; tower(sg * (5500 + rnd() * 5000), -1900, -1000 + i * 1900 + rnd() * 800, 2200 + rnd() * 1400, 2200 + rnd() * 3000); }   // 左右の 遠くの 入道雲
    for(const sg of [1, -1]) tower(sg * (2400 + rnd() * 600), -2000, zc + 6500 + rnd() * 1500, 3600, 6000);   // 中央神殿の 奥の 大きな 雲 (光の 輪の 真後ろは あける)
    for(let i = 0; i < 12; i++){ const sg = i % 2 ? 1 : -1, cx = sg * (1900 + rnd() * 1600), cy = -600 + rnd() * 900, cz = rnd() * (zc + 1500);   // 島の そばを 流れる 小さな 雲
      for(let j = 0; j < 5; j++) puffs.push([cx + (rnd() - 0.5) * 500, cy + (rnd() - 0.5) * 120, cz + (rnd() - 0.5) * 400, 300 + rnd() * 300, 0.6 + rnd() * 0.4, (rnd() - 0.5) * 0.5]); }
    const ref = new THREE.Vector3(0, 0, -2000); puffs.sort((a, b) => ref.distanceToSquared(v.set(b[0], b[1], b[2])) - ref.distanceToSquared(v.set(a[0], a[1], a[2])));   // 遠い 順に 描く (手前の 雲が 上に 重なる)
    const n = puffs.length, aP = new Float32Array(n * 4), aS = new Float32Array(n * 2); puffs.forEach((p, i) => { aP.set([p[0], p[1], p[2], p[3]], i * 4); aS.set([p[4], p[5]], i * 2); });
    const base = new THREE.PlaneGeometry(1, 1), ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv);
    ig.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); ig.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 2)); ig.instanceCount = n;
    const cm = new THREE.Mesh(ig, puffMat(puffTex(rnd))); cm.frustumCulled = false; cm.renderOrder = -1; root.add(cm); }

  yield;
  // 金の 光の 輪 (= ワープの 輪、コースの 終わり)。輪の 面は コースの 終わりの 向き (2.2 = index.html の RING3_UP)
  path.frame(L, v, q); const E = v.clone().add(new THREE.Vector3(0, 2.2, 0).applyQuaternion(q)), halo = new THREE.Group(); halo.position.copy(E); halo.quaternion.copy(q); root.add(halo);
  const hm = new THREE.MeshStandardMaterial({ color:'#ffd56a', metalness:1, roughness:0.2, emissive:'#c8901e', emissiveIntensity:0.9, envMap:env, envMapIntensity:1.2, fog:false });   // 光の 輪も 金属 (映り込み) + 自分で 光る (遠くからの 目印)
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(62, 3.2, 12, 128), hm), new THREE.Mesh(new THREE.TorusGeometry(52, 1.2, 8, 128), hm));
  for(let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2, long = i % 2 === 0, r = new THREE.Mesh(new THREE.BoxGeometry(long ? 2.4 : 1.4, long ? 60 : 34, 1), hm); r.position.set(Math.sin(a) * (66 + (long ? 30 : 17)), Math.cos(a) * (66 + (long ? 30 : 17)), 0); r.rotation.z = -a; halo.add(r); }
  const hg = new THREE.Sprite(new THREE.SpriteMaterial({ map:gt, color:'#fff0b8', transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false })); hg.scale.setScalar(420); halo.add(hg);
  out.exitP = E.clone();

  let t = 0;
  return [(cam, dt) => { if(out.dead) return; t += dt; fm.uniforms.uTime.value = t; bu.value = t; spm.uniforms.uTime.value = t;
    camL.copy(cam.position); root.worldToLocal(camL); const f = THREE.MathUtils.clamp((1900 - (gz - camL.z)) / 2900, 0, 1), op = f * f * (3 - 2 * f) * 1.75; for(const o of doors) o.pv.rotation.y = -o.sg * op;   /* 門の 扉: 門の 1.9 km 手前から 手前へ ゆっくり 開き、門に 着いた 時は まだ 約 70 度 (開ききる 100 度 = 1.75 は くぐった 後、11/2 社長「もっと ゆっくり・到着しても まだ 開き切って ない」) */ gold.envMapRotation.setFromQuaternion(root.quaternion); hm.envMapRotation.copy(gold.envMapRotation);   /* 映り込みの 景色を 世界の 向きに (朝日の 映る 向きが 空の 太陽と 合う) */ hg.material.opacity = 0.75 + 0.25 * Math.sin(t * 2.2); halo.rotation.z += dt * 0.05; }];   // 光の 輪は ゆっくり 回り、光が 息づく
}
