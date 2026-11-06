// 深海 (3 面 分かれ道 ① 右、11/2。社長「大きい 生物が いたら カッコいい、クジラ・メガロドン・ダイオウイカ」)
// 1 回目: 暗い 青の 海・上から 差し込む 光の 筋・マリンスノー (カメラの まわりに いつも 漂う 白い 粒)・光る クラゲの 大群 (傘は r187 の 虹色の 膜 iridescence)。生き物と 出口は 次の 回から
// 座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)。コースは coursePath3 で なぞる (はじめに ゆるく 潜って、ゆるい S 字)
import * as THREE from 'three';
import { coursePath3, exit3 } from '../stage3.js';

const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし
const GLSL_HASH = 'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }';
const ADD_FADE = '#ifdef USE_FOG\n  gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);\n#endif';   // 光を 足す 描き方は 遠いほど 薄く (もやの 色を 足さない)
const JELLY = ['#4fd8ff', '#7a6bff', '#ff6ad5', '#6affc8', '#b48cff', '#5f9bff'].map(c => new THREE.Color(c));

function envTex(){   // クラゲの 傘に 映す 景色: 上 = 水面の 光、まわり = 青、下 = 闇
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#bfeaff'); lg.addColorStop(0.18, '#3c9ccc'); lg.addColorStop(0.5, '#0b3550'); lg.addColorStop(1, '#000000'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function shaftMat(){   // 光の 筋: 上ほど 明るく 下へ 消える 縦の 帯、ゆらゆら 揺れて 明るさが 変わる (加算)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`uniform float uTime; varying vec2 vUv; varying float vId;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; vId = float(gl_InstanceID); vec3 p = position; p.x += sin(uTime * 0.4 + vId * 1.7 + uv.y * 2.0) * 0.08 * (1.0 - uv.y);
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; varying vec2 vUv; varying float vId;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        float e = smoothstep(0.0, 0.35, vUv.x) * (1.0 - smoothstep(0.65, 1.0, vUv.x)), k = pow(vUv.y, 1.6) * (0.75 + 0.25 * sin(uTime * 0.7 + vId * 3.1));
        gl_FragColor = vec4(0.55, 0.85, 1.0, 0.22 * e * k);
        ${ADD_FADE}
        #include <colorspace_fragment>
      }` });
}

function rockTex(rnd){   // 岩肌 (512 四方): まだら・地層の 線・ひび (崖と 岩の かたまりに 3 方向から 貼る)
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = '#b8bec0'; g.fillRect(0, 0, N, N);
  for(let i = 0; i < 900; i++){ const x = rnd() * N, y = rnd() * N, r = 4 + rnd() * 40, l = rnd() < 0.5 ? 0 : 255, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${l},${l},${l},${0.08 + rnd() * 0.12})`); rg.addColorStop(1, `rgba(${l},${l},${l},0)`); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  for(let i = 0; i < 14; i++){ const y0 = rnd() * N; g.strokeStyle = `rgba(40,45,50,${0.25 + rnd() * 0.25})`; g.lineWidth = 1 + rnd() * 3; g.beginPath(); for(let x = 0; x <= N; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 6 + (rnd() - 0.5) * 3); g.stroke(); }
  for(let i = 0; i < 40; i++){ let x = rnd() * N, y = rnd() * N; g.strokeStyle = `rgba(20,24,28,${0.35 + rnd() * 0.3})`; g.lineWidth = 1 + rnd() * 1.5; g.beginPath(); g.moveTo(x, y); for(let k = 0; k < 6; k++){ x += (rnd() - 0.5) * 50; y += 10 + rnd() * 30; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function rockMat(tex, vc, lite){   // 岩: 置いた 後の 大きさで 岩肌を 貼る (90 m と 23 m の 2 つの 大きさを 重ねる、面の 向きで 3 方向から 混ぜる)。遠いほど 薄く。vc = 頂点の 色 (崖) / 無し (岩の かたまり = 1 つずつの 色)   // lite (スマホ) = 細かい 模様を 省いて 絵の 読みを 半分に (Codex 指摘)
  const m = new THREE.MeshLambertMaterial({ vertexColors:vc, side:THREE.DoubleSide }); m.userData.stone = tex;   // 片づけの 時に 絵も 捨てる (stage3.js の dispose)
  m.onBeforeCompile = s => { s.uniforms.uRock = { value:tex };
    s.vertexShader = 'varying vec3 vSP; varying vec3 vSN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n  vSP = (instanceMatrix * vec4(transformed, 1.0)).xyz; vec3 isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vSN = mat3(instanceMatrix) * (objectNormal / (isc * isc));\n#else\n  vSP = transformed; vSN = objectNormal;\n#endif');
    s.fragmentShader = 'uniform sampler2D uRock; varying vec3 vSP; varying vec3 vSN;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  vec3 sn = abs(normalize(vSN)), sw = sn * sn * sn * sn; sw /= sw.x + sw.y + sw.z + 1e-5;
  vec3 r1 = texture2D(uRock, vSP.zy / 90.0).rgb * sw.x + texture2D(uRock, vSP.xz / 90.0).rgb * sw.y + texture2D(uRock, vSP.xy / 90.0).rgb * sw.z;
  ${lite ? "vec3 r2 = vec3(0.47);" : "vec3 r2 = texture2D(uRock, vSP.zy / 23.0).rgb * sw.x + texture2D(uRock, vSP.xz / 23.0).rgb * sw.y + texture2D(uRock, vSP.xy / 23.0).rgb * sw.z;"}
  diffuseColor.rgb *= mix(r1 * r2 * 4.4, vec3(1.0), smoothstep(500.0, 1500.0, length(vViewPosition)));`); };   /* 4.4 = 2 枚 重ねた 絵の 平均の 明るさを 1 に */
  return m;
}

let waterTex = null;   // 海面の 凹凸の 絵 (three.js 付属の waternormals.jpg、クリスタルの 洞窟の 湖と 同じ)。世界を 作り直しても 1 枚を 使い回す
function waterNormals(){ if(!waterTex){ waterTex = new THREE.TextureLoader().load('assets/nature/waternormals.jpg'); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.userData.shared = true; } return waterTex; }

function surfaceMat(sunDir){   // 海面 (11/2 社長「three.js の 水面を ちょっと 使って リアルに」): 上から = three.js の Water と 同じ 計算 (凹凸の 絵 4 枚を 流して 波・太陽の 照り返し・角度で 空を 映す)。鏡の 代わりに 空の グラデーションを 映す (鏡は 重く、輪の 窓から はみ出る)。下から = 光の 窓 (真上ほど 明るく 揺らめく)   // 中の getNoise = three.js Water と 同じ。skyCol = 海の 上の 空 (地平線 白っぽい 水色・上 青)。下から = 真上 (光の 窓) ほど 明るく 斜めは 深い 水の 色
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true, side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 }, uCam:{ value:new THREE.Vector3() }, uN:{ value:null }, uSun:{ value:sunDir } }]),
    vertexShader:`varying vec3 vPos;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vPos = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; uniform vec3 uCam; uniform sampler2D uN; uniform vec3 uSun; varying vec3 vPos;
      #include <fog_pars_fragment>
      ${clip.pf}
      vec4 getNoise(vec2 uv){
        vec2 uv0 = (uv / 103.0) + vec2(uTime / 17.0, uTime / 29.0), uv1 = uv / 107.0 - vec2(uTime / -19.0, uTime / 31.0), uv2 = uv / vec2(8907.0, 9803.0) + vec2(uTime / 101.0, uTime / 97.0), uv3 = uv / vec2(1091.0, 1027.0) - vec2(uTime / 109.0, uTime / -113.0);
        return (texture2D(uN, uv0) + texture2D(uN, uv1) + texture2D(uN, uv2) + texture2D(uN, uv3)) * 0.5 - 1.0; }
      vec3 skyCol(vec3 d){ return mix(vec3(0.82, 0.92, 0.98), vec3(0.18, 0.46, 0.85), pow(clamp(d.y, 0.0, 1.0), 0.45)); }
      void main(){
        ${clip.f}
        vec3 n = normalize(getNoise(vPos.xz).xzy * vec3(1.5, 1.0, 1.5)), e = normalize(uCam - vPos), c;
        if(gl_FrontFacing){ vec3 sunC = vec3(1.0, 0.96, 0.86), r = normalize(reflect(-uSun, n));
          vec3 spec = pow(max(0.0, dot(e, r)), 100.0) * sunC * 2.0, dif = max(dot(uSun, n), 0.0) * sunC * 0.5;
          float th = max(dot(e, n), 0.0), refl = 0.02 + 0.98 * pow(1.0 - th, 5.0);
          vec3 scatter = max(0.0, dot(n, e)) * vec3(0.0, 0.14, 0.24);
          c = mix(sunC * dif * 0.3 + scatter, skyCol(reflect(-e, n)) + spec, refl); }
        else { float up = clamp(-e.y, 0.0, 1.0), win = smoothstep(0.62, 0.8, up), rip = 0.5 + 0.5 * n.x * 2.5;
          c = mix(vec3(0.05, 0.3, 0.45), mix(vec3(0.45, 0.8, 0.95), vec3(0.9, 0.98, 1.0), clamp(rip, 0.0, 1.0)), win); }
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uN.value = waterNormals(); return m;
}

function skyTex(){ const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), lg = g.createLinearGradient(0, 0, 0, 256);   // 海の 上の 空 (半球の 上 = 濃い 青、地平線 = 白っぽい 水色)
  lg.addColorStop(0, '#2f7fd8'); lg.addColorStop(0.7, '#9fd0f2'); lg.addColorStop(1, '#e2f2fc'); g.fillStyle = lg; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function snowMat(box){   // マリンスノー: カメラの まわり box m 四方に いつも 漂う 白い 粒 (カメラが 進むと 後ろへ 流れて 速さが 伝わる)。位置は 箱の 大きさで 折り返す   // 海面より 上には 出さない (step(p.y, uSurf))
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCam:{ value:new THREE.Vector3() }, uTime:{ value:0 }, uSurf:{ value:0 } }]),
    vertexShader:`uniform vec3 uCam; uniform float uTime; uniform float uSurf; varying float vA;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vec3 q = position + vec3(0.0, -uTime * 1.5, 0.0); vec3 p = mod(q - uCam + ${(box / 2).toFixed(1)}, ${box.toFixed(1)}) + uCam - ${(box / 2).toFixed(1)};
        vA = (1.0 - smoothstep(${(box * 0.32).toFixed(1)}, ${(box * 0.5).toFixed(1)}, length(p - uCam))) * step(p.y, uSurf);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = clamp(260.0 / -mvPosition.z, 1.0, 6.0);
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying float vA;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard;
        gl_FragColor = vec4(0.8, 0.92, 1.0, (1.0 - d * 2.0) * 0.7 * vA);
        ${ADD_FADE}
        #include <colorspace_fragment>
      }` });
}

function tentacleMat(){   // クラゲの 触手: 細い 帯が 下ほど 大きく ゆらめき、下へ 消える (加算、クラゲの 色)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`uniform float uTime; varying float vY; varying vec3 vCol;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vY = -position.y; vCol = instanceColor; float id = float(gl_InstanceID), w = vY * vY;
        vec3 p = position + vec3(sin(uTime * 1.3 + vY * 3.0 + id) * 0.12, 0.0, cos(uTime * 1.1 + vY * 2.6 + id * 1.3) * 0.12) * w;
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying float vY; varying vec3 vCol;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        gl_FragColor = vec4(vCol, 0.55 * (1.0 - smoothstep(0.2, 1.9, vY)));
        ${ADD_FADE}
        #include <colorspace_fragment>
      }` });
}

function tentacleGeo(){   // 触手 8 本 (傘の ふちから 下へ、長さ 1.4〜2.0、傘の 大きさ 1 に 対して)
  const pos = [], idx = []; let base = 0;
  for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2, r = 0.36, len = 1.4 + (i % 3) * 0.3, n = 12, w = 0.02, cx = Math.cos(a) * r, cz = Math.sin(a) * r, tx = -Math.sin(a) * w, tz = Math.cos(a) * w;
    for(let j = 0; j <= n; j++){ const y = -len * j / n; pos.push(cx - tx, y, cz - tz, cx + tx, y, cz + tz); if(j < n){ const k = base + j * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    base += (n + 1) * 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}

function whaleGeo(){   // クジラ (長さ 1、頭が +Z、背中が +Y): 胴体 (回転体、おなかは 少し 平ら) + 胸びれ 2 枚 + 尾びれ。背中は 濃い 青灰色、おなかは 明るい 色
  const ni = g => g.index ? g.toNonIndexed() : g;
  const prof = [[0.004, -0.5], [0.012, -0.47], [0.03, -0.4], [0.06, -0.25], [0.085, -0.05], [0.095, 0.1], [0.09, 0.25], [0.07, 0.38], [0.045, 0.46], [0.02, 0.495], [0.0, 0.5]].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.LatheGeometry(prof, 36).rotateX(Math.PI / 2).scale(1, 0.85, 1);   // 回転の 軸 (y) → 体の 前後 (z)
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.bezierCurveTo(0.05, -0.02, 0.11, -0.06, 0.14, -0.1); fs.bezierCurveTo(0.1, -0.05, 0.04, -0.06, 0, -0.03); fs.bezierCurveTo(-0.04, -0.06, -0.1, -0.05, -0.14, -0.1); fs.bezierCurveTo(-0.11, -0.06, -0.05, -0.02, 0, 0);   // 尾びれ (横に 広い 三日月)
  const fluke = new THREE.ExtrudeGeometry(fs, { depth:0.008, bevelEnabled:false, curveSegments:8 }).rotateX(Math.PI / 2).translate(0, 0.004, -0.49);
  const fin = sg => new THREE.SphereGeometry(0.5, 14, 6).scale(0.16, 0.012, 0.035).rotateY(sg * 0.35).rotateZ(sg * -0.35).translate(sg * 0.13, -0.045, 0.2);   // 長い 胸びれ (外へ・少し 下へ)
  const g = mergeGeo([body, fluke, fin(1), fin(-1)].map(ni)), p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color(), top = new THREE.Color('#3a4d60'), belly = new THREE.Color('#a9b8c2');
  for(let i = 0; i < p.count; i++){ c.lerpColors(belly, top, THREE.MathUtils.smoothstep(n.getY(i) + p.getY(i) * 8, -0.4, 0.3)); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
function mergeGeo(list){ const pos = [], nor = []; for(const g of list){ pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g; }   // 形を 1 つに (位置と 向きだけ)

function whaleMat(tt){   // クジラ: 後ろ半分が ゆったり 上下に しなる (尾びれを 打つ) + 輪郭が うっすら 光る (暗い 海でも 形が 分かる)
  const m = new THREE.MeshLambertMaterial({ vertexColors:true });
  m.onBeforeCompile = s => { s.uniforms.uTime = tt;
    s.vertexShader = 'uniform float uTime;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float wb = (1.0 - smoothstep(-0.5, 0.1, position.z)), fx = abs(position.x); transformed.y += sin(uTime * 0.8 - position.z * 6.0) * 0.035 * wb * wb + sin(uTime * 0.9) * 0.06 * smoothstep(0.08, 0.26, fx) * step(0.05, position.z) * step(position.z, 0.35);   // 尾びれ + 胸びれを ゆったり 上下に');
    s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.16, 0.38, 0.5) * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);'); };
  return m;
}

export function* build(scene, root, P, opts, out){
  const mob = !!opts.mobile, branch = opts.nextBranch !== false, path = coursePath3(P, branch), L = path.len;
  let seed = 20261102; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const SURF = -6;   // 海面の 高さ (入口の 6 m 下。はじめの 0.5 秒 まっすぐ 走って すぐ 潜る)
  scene.fog = new THREE.Fog('#a9d6ee', 3000, 40000);   // 毎コマ 深さで 変える (下の tick): 海の 上 = 澄んだ 空気、浅い 海 = 明るい 青、深い 海 = 真っ暗
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3(), e = new THREE.Euler(), X = new THREE.Vector3(), Y = new THREE.Vector3();
  const hemi = new THREE.HemisphereLight('#4a8fc0', '#020608', 1.1), top = new THREE.DirectionalLight('#7cc4ff', 0.9); top.position.set(0.2, 1, 0.1); root.add(hemi, top, top.target);   // 上からの 青い 光 (深いほど 弱く)
  const lamp = new THREE.PointLight('#9fe6ff', 0, 1600, 1), spot = new THREE.SpotLight('#d8f4ff', 0, 2600, 0.6, 0.6, 1); root.add(lamp, spot, spot.target);   // おばけの 灯り (11/2 社長「海溝が 真っ暗で 崖の 形も 見えない、明るさか レールの 光で 見える 演出を」): まわりを 照らす 灯り + 進む 方向を 照らす 光の 筋。深いほど 強く (下の tick)
  const env = envTex();

  yield;
  // 海面 と 海の 上の 空 (海の 中では 隠す)
  let sky = null, sun = null;
  const srf = surfaceMat(new THREE.Vector3(0.3, 0.45, 1).normalize());   // 太陽の 向き = 空の 太陽 (下の 光の 玉) と 同じ
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(160000, 160000).rotateX(-Math.PI / 2).translate(0, SURF, 0), srf); m.frustumCulled = false; root.add(m);
    sky = new THREE.Mesh(new THREE.SphereGeometry(25000, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map:skyTex(), side:THREE.BackSide, fog:false, depthWrite:false })); sky.position.y = SURF; sky.renderOrder = -5; root.add(sky);
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), rg = x.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.2, 'rgba(255,248,220,0.8)'); rg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = rg; x.fillRect(0, 0, 64, 64);
    sun = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false })); sun.position.set(0.3, 0.45, 1).normalize().multiplyScalar(20000).setY(9000 + SURF); sun.scale.setScalar(4000); sun.renderOrder = -4; root.add(sun); }

  yield;
  // コースの 点 (40 m ごと) と いちばん 低い 所
  let minY = 0; for(let s = 0; s <= L; s += 40){ path.frame(s, v, q); minY = Math.min(minY, v.y); }
  let sIn = 0; for(let s = 0; s <= L; s += 10){ path.frame(s, v, q); if(v.y < SURF - 15){ sIn = s; break; } }   // 海に 入った 所 (海面の 15 m 下)
  const SW = L * 0.75;   // クジラの 所 (クラゲの 区間の 後、海溝の 深さ 約 2.8 km。11/2 社長「クラゲ → クジラ の 順、後ろの クラゲは なし」)
  const PL = -1300, BOT = minY - 120, HT = 650, HB = 160;   // 海底の 平原の 深さ / 海溝の 底 / 海溝の 上と 底の 半分の 幅
  const hw = y => y >= PL ? Infinity : HB + (HT - HB) * (y - BOT) / (PL - BOT);   // 高さ y での 海溝の 半分の 幅
  const at = (s, lat, up) => { path.frame(s, v, q); X.set(1, 0, 0).applyQuaternion(q); Y.set(0, 1, 0).applyQuaternion(q); return v.clone().addScaledVector(X, lat).addScaledVector(Y, up); };   // 道のり s から 横 lat (+ = 左)・上 up

  yield;
  // 光の 筋 (海面から 下へ 1.5〜2.6 km、潜り始めの まわり。十字の 2 枚で どこから 見ても 帯)
  const shafts = [];
  for(let i = 0; i < (mob ? 26 : 44); i++){ const x = (rnd() - 0.5) * 3000, z = 1200 + rnd() * 3600, w = 40 + rnd() * 100, h = 1500 + rnd() * 1100, ry = rnd() * Math.PI;
    for(const k of [0, 1]) shafts.push({ x, y:SURF - h * 0.5, z, w, h, ry:ry + k * Math.PI / 2 }); }
  const sm = shaftMat();
  { const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), sm, shafts.length);
    shafts.forEach((o, i) => mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e.set(0.12, o.ry, 0)), s3.set(o.w, o.h, 1)))); mesh.frustumCulled = false; root.add(mesh); }

  yield;
  // マリンスノー
  const BOX = 260, sn = snowMat(BOX);
  { const n = mob ? 2200 : 4000, pos = new Float32Array(n * 3); for(let i = 0; i < n * 3; i++) pos[i] = rnd() * BOX; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, sn); p.frustumCulled = false; root.add(p); }

  yield;
  // 光る クラゲの 大群 (11/2 社長「クラゲは 正面に いた ほうが 存在感」): 海に 入って すぐ 〜 クジラの 1.2 km 手前。進む 先の 正面 (横 14〜160 m・上下 −60〜90 m) に 集め、カメラの 通り道 (14 m + 傘の 大きさ) は あける。海面の 30 m 下より 上には 置かない (前は 海の 上の 空中に 出て いた)
  const jel = [];
  for(let i = 0, tries = 0; i < (mob ? 110 : 260) && tries < 5000; tries++){ const big = rnd() < 0.07, sj = sIn + 200 + rnd() * Math.max(100, SW - 1200 - sIn), s = big ? 40 + rnd() * 35 : 7 + rnd() * 18;
    const sg = rnd() < 0.5 ? 1 : -1, up = big ? (rnd() - 0.3) * 300 : -60 + rnd() * 150; let lat = sg * (big ? 60 + rnd() * 200 : 14 + Math.pow(rnd(), 1.6) * 146);
    if(Math.hypot(lat, up) < 14 + s * 0.7) continue;
    let p = at(sj, lat, up); const lim = hw(p.y) - 30 - s; if(Math.abs(lat) > lim){ lat = sg * Math.max(12 + s * 0.5, lim); p = at(sj, lat, up); }   // 海溝の 中に 収める
    if(p.y + s > SURF - 30) continue;
    jel.push({ p, s, rx:(rnd() - 0.5) * 0.5, rz:(rnd() - 0.5) * 0.5, c:JELLY[(rnd() * JELLY.length) | 0] }); i++; }
  const jt = { value:0 }; let tm = null;   // jt = 傘の ゆれの 時計、tm = 触手の 素材
  const bell = new THREE.MeshPhysicalMaterial({ color:'#ffffff', transparent:true, opacity:0.45, roughness:0.2, metalness:0, iridescence:1, iridescenceIOR:1.35, iridescenceThicknessMinimum:200, iridescenceThicknessMaximum:650, envMap:env, envMapIntensity:1.8, emissive:'#ffffff', emissiveIntensity:0.6, side:THREE.DoubleSide, depthWrite:false });   // 傘: 半透明で 自分で 光り (クラゲの 色)、ふちに 虹色の つや (r187 の 膜の 厚さの 最小・最大)
  bell.onBeforeCompile = s => { s.uniforms.uTime = jt;
    s.vertexShader = 'uniform float uTime;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float jph = uTime * 1.6 + float(gl_InstanceID) * 2.1; transformed.xz *= 1.0 + 0.12 * sin(jph); transformed.y *= 1.0 - 0.1 * sin(jph);');   // 傘が ふわっ ふわっと 縮む
    s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance *= vColor.rgb;\n#endif'); };   // 光る 色 = クラゲごとの 色
  { const g = new THREE.SphereGeometry(0.5, mob ? 12 : 20, mob ? 6 : 10, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(1, 0.8, 1), mesh = new THREE.InstancedMesh(g, bell, jel.length); tm = tentacleMat(); const tmesh = new THREE.InstancedMesh(tentacleGeo(), tm, jel.length);
    jel.forEach((o, i) => { m4.compose(o.p, q.setFromEuler(e.set(o.rx, rnd() * Math.PI, o.rz)), s3.setScalar(o.s)); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, o.c); tmesh.setMatrixAt(i, m4); tmesh.setColorAt(i, o.c); });
    mesh.frustumCulled = tmesh.frustumCulled = false; mesh.renderOrder = 1; root.add(mesh, tmesh); }
  { const g = new THREE.BufferGeometry(), pos = new Float32Array(jel.length * 3), col = new Float32Array(jel.length * 3);   // 傘の 中の 光 (ぼんやり にじむ)
    jel.forEach((o, i) => { pos.set([o.p.x, o.p.y + o.s * 0.15, o.p.z], i * 3); col.set([o.c.r, o.c.g, o.c.b], i * 3); }); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), rg = x.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.4)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, 64, 64);
    const pm = new THREE.PointsMaterial({ size:24, vertexColors:true, map:new THREE.CanvasTexture(c), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
    pm.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <fog_fragment>', ADD_FADE); };
    const p = new THREE.Points(g, pm); p.frustumCulled = false; root.add(p); }

  yield;
  // 海底の 平原 と 海溝 (11/2 社長「海溝に 向かって 進んで 入って いる ように」): 平原 = 深さ PL、コースに 沿った 割れ目 (上の 幅 2 × HT・底の 幅 2 × HB) の 中へ 潜り、底 BOT まで。崖は 岩の でこぼこ
  const cl = [];   // 海溝の 中心線 (水平、35 m ごと): x・z・中心線に 沿った 長さ a と 左 向き (lx, lz)
  for(let s = -3000; s <= L + 2500; s += 10){ path.frame(s, v, q); X.set(0, 0, 1).applyQuaternion(q); X.y = 0; if(X.lengthSq() < 1e-6) X.set(0, 0, 1); X.normalize();
    const last = cl[cl.length - 1], dl = last ? Math.hypot(v.x - last.x, v.z - last.z) : 0; if(!last || dl >= (mob ? 50 : 35)) cl.push({ x:v.x, z:v.z, a:last ? last.a + dl : 0, lx:X.z, lz:-X.x }); }
  const rockN = (a, y, sd) => Math.sin(a * 0.0042 + y * 0.0031 + sd) * Math.cos(a * 0.0023 - y * 0.0051) * 95 + Math.sin(a * 0.017 + y * 0.012 + sd * 2.1) * Math.cos(y * 0.014 - a * 0.009) * 38 + Math.sin(a * 0.061 + y * 0.047 + sd) * Math.sin(y * 0.072 + a * 0.031) * 13;   // 崖の でこぼこ (m): 大きな うねり + 中くらい + 細かい (11/2 社長「崖が のっぺり」)
  const ledge = (a, y, sd) => { const f = ((y / 230 + Math.sin(a * 0.003 + sd) * 0.3) % 1 + 1) % 1; return f < 0.12 ? 45 * Math.sin(f / 0.12 * Math.PI) : 0; };   // 230 m ごとの 岩棚 (海溝の 内側へ 張り出す 段)
  const rockT = rockTex(rnd), rockM = rockMat(rockT, true, mob), walls = [];   // walls = 崖の 区画 (コースに 沿って 40 列ずつ。霞の 先の 区画は 描かない、Codex 指摘)
  const glow = [], gcol = [], rocks = [], GL = ['#2fd8ff', '#3affb4', '#7a7bff', '#c86bff', '#28a0ff'].map(c => new THREE.Color(c));
  for(const sg of [1, -1]){   // 左 (+1) と 右 (-1) の 崖 (遠い 平原 → 崖の 縁 → 崖 → 底の まん中)
    const sd = sg > 0 ? 0 : 7.3, prof = [[7000, PL, 0], [3200, PL + 25, 0], [HT + 260, PL, 0], [HT + 40, PL - 10, 0]], J = mob ? 20 : 34;
    for(let j = 0; j <= J; j++){ const y = PL - 30 - (PL - 30 - BOT) * j / J; prof.push([hw(Math.min(y, PL - 1)), y, 1]); }
    prof.push([HB * 0.55, BOT - 25, 0], [0, BOT - 35, 0]);
    const pos = [], col = [], idx = [], c = new THREE.Color(), K = prof.length;
    cl.forEach(o => prof.forEach(([d, y, wall]) => { const n = wall ? rockN(o.a, y, sd) - ledge(o.a, y, sd) : rockN(o.a, y, sd) * 0.15, dd = d + (wall ? n : 0), yy = y + (wall ? 0 : n);
      pos.push(o.x + o.lx * dd * sg, yy, o.z + o.lz * dd * sg);
      c.set(wall ? '#5a6870' : y < BOT ? '#2c363c' : '#3a4a50').multiplyScalar((0.85 + 0.2 * Math.sin(y * 0.05 + o.a * 0.002)) * (0.9 + 0.2 * Math.sin(o.a * 0.013 + y * 0.009 + sd))); col.push(c.r, c.g, c.b);   // 地層の しま + まだら
      if(wall && rnd() < (mob ? 0.11 : 0.18)){ const gg = GL[(rnd() * GL.length) | 0]; glow.push(o.x + o.lx * (dd - 6) * sg, yy + (rnd() - 0.5) * 60, o.z + o.lz * (dd - 6) * sg); gcol.push(gg.r, gg.g, gg.b); }   // 崖の 光る サンゴ・イソギンチャク
      if(wall && rnd() < (mob ? 0.012 : 0.02)){ const r = 15 + rnd() * 55; rocks.push({ x:o.x + o.lx * (dd - r * 0.4) * sg, y:yy, z:o.z + o.lz * (dd - r * 0.4) * sg, r, rx:rnd() * 3, ry:rnd() * 3, rz:rnd() * 3 }); } }));   // 崖から 突き出す 岩の かたまり
    for(let i = 0; i < cl.length - 1; i++) for(let k = 0; k < K - 1; k++){ const a = i * K + k, b = a + K; if(sg > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    for(let i0 = 0; i0 < cl.length - 1; i0 += 40){ const i1 = Math.min(cl.length - 1, i0 + 40), cg = new THREE.BufferGeometry(); for(const a of ["position", "normal", "color"]) cg.setAttribute(a, g.attributes[a]); cg.setIndex(idx.slice(i0 * (K - 1) * 6, i1 * (K - 1) * 6));   /* 頂点は 共有 (継ぎ目の 陰も なめらか)、三角形だけ 区画ごと */
      const m = new THREE.Mesh(cg, rockM); m.frustumCulled = false; root.add(m); walls.push({ m, z0:Math.min(cl[i0].z, cl[i1].z), z1:Math.max(cl[i0].z, cl[i1].z) }); } yield; }
  { const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;   // 岩の かたまり (でこぼこの 多面体。同じ 点は 同じだけ ずらす = 割れ目なし)
    for(let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.28 * Math.sin(x * 5.1 + y * 3.7) * Math.cos(z * 4.3 - x * 2.2); p.setXYZ(i, x * k, y * k * 0.8, z * k); }
    g.computeVertexNormals(); const mesh = new THREE.InstancedMesh(g, rockMat(rockT, false, mob), Math.max(1, rocks.length)), e2 = new THREE.Euler(), cc = new THREE.Color();
    rocks.forEach((o, i) => { mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e2.set(o.rx, o.ry, o.rz)), s3.setScalar(o.r))); mesh.setColorAt(i, cc.set('#5a6870').multiplyScalar(0.8 + rnd() * 0.35)); });
    mesh.count = rocks.length; mesh.frustumCulled = false; root.add(mesh); }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(glow, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), rg = x.createRadialGradient(16, 16, 0, 16, 16, 16); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, 32, 32);
    const pm = new THREE.PointsMaterial({ size:9, vertexColors:true, map:new THREE.CanvasTexture(c), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
    pm.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <fog_fragment>', ADD_FADE); };
    const p = new THREE.Points(g, pm); p.frustumCulled = false; root.add(p); }

  yield;
  // クジラ (11/2 社長「進行方向に 向かって 正面が クジラの 顔。クラゲが 途切れた タイミングで 真正面に いて ゆったり ひれを 動かして いる。おなかの 下を すり抜ける」): 全長 WL m、コースの SW の 所に こちらを 向いて 浮かぶ (おなかが レールの 約 35 m 上)
  const WL = 420, wt = { value:0 }, whale = new THREE.Mesh(whaleGeo(), whaleMat(wt)); whale.scale.setScalar(WL); whale.frustumCulled = false; root.add(whale);
  { path.frame(SW, v, q); Y.set(0, 1, 0).applyQuaternion(q); whale.position.copy(v).addScaledVector(Y, 72); whale.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)); }   // 頭を こちらへ (向きを 180 度)

  yield;
  // 出口 = 海溝の 底の 崖に 彫られた 古代の 神殿の 門 (11/2 社長「イ: 沈んだ 古代の 神殿の 門」): 3 本の レールの 先に 3 つの 門 (中に ワープの 輪)。柱 (いくつか 折れて いる)・梁・三角屋根・段・崩れた 石・倒れた 柱・青く 光る 古代文字。行き先の ない 門は 石の 扉で ふさぐ
  // 座標 sg: 原点 = まん中の 輪の 中心 (コースの 終わり + 上 2.2 m = index.html の RING3_UP)、向き = コースの 終わりの 向き (+X = 左・+Y = 上・+Z = 進む 向き)。レーン k の 輪 = ((1 − k) × ex.w, −(k − 1) × ex.h)
  let runeM = null;
  if(branch){ const ex = exit3(P.def), sg = new THREE.Group(); path.frame(L, v, q); sg.quaternion.copy(q); sg.position.set(0, 2.2, 0).applyQuaternion(q).add(v); root.add(sg);
    const stoneM = rockMat(rockT, false, mob); stoneM.color.set('#8d9a90');
    const W = 230, YB = -95, YT = 120, DH = 11, D0 = -14, D1 = 19, LC = [0x4cd964, 0xffd54a, 0xff5a5a], has = k => !opts.nextChoices || !!opts.nextChoices[k], lx = k => (1 - k) * ex.w, ly = k => -(k - 1) * ex.h;
    const rect = (P2, x0, y0, x1, y1) => { P2.moveTo(x0, y0); P2.lineTo(x1, y0); P2.lineTo(x1, y1); P2.lineTo(x0, y1); P2.lineTo(x0, y0); return P2; };
    { const sh = rect(new THREE.Shape(), -W, YB, W, YT); for(let k = 0; k < 3; k++) sh.holes.push(rect(new THREE.Path(), lx(k) - DH, ly(k) + D0, lx(k) + DH, ly(k) + D1));
      sg.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:14, bevelEnabled:false }).translate(0, 0, -2), stoneM)); }   // 崖の 壁 (門の 穴 3 つ)
    const dc = document.createElement('canvas'); dc.width = dc.height = 64; { const x = dc.getContext('2d'), rg = x.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.4)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, 64, 64); }
    const dotT = new THREE.CanvasTexture(dc), glowM = c => new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false });   // 光る 所は もやで 消さない (遠くから 目印)
    for(let k = 0; k < 3; k++){ const x = lx(k), y = ly(k);
      if(!has(k)){ const slab = new THREE.Mesh(new THREE.BoxGeometry(DH * 2, D1 - D0, 3), stoneM); slab.position.set(x, y + (D0 + D1) / 2, 6); sg.add(slab); continue; }   // 行き先の ない 門は 石の 扉
      const o = DH + 2.4, s = rect(new THREE.Shape(), -o, D0 - 2.4, o, D1 + 2.4); s.holes.push(rect(new THREE.Path(), -DH, D0, DH, D1)); const fr = new THREE.Mesh(new THREE.ShapeGeometry(s), glowM(LC[k])); fr.position.set(x, y, -2.4); sg.add(fr);   // 門の ふちの 光 (レールの 色)
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:dotT, color:LC[k], transparent:true, opacity:0.45, blending:THREE.AdditiveBlending, depthWrite:false, fog:false })); halo.position.set(x, y + 2, -5); halo.scale.setScalar(70); sg.add(halo); }
    // 柱 (間に 門、外へ 並ぶ。2 本は 折れて 短い)・柱の 頭・梁・三角屋根・段・倒れた 柱・崩れた 石
    const cols = [], blocks = [];
    for(const cx of [20, 60, 100, 145, 190]) for(const sn of [1, -1]){ const broken = (cx === 100 && sn > 0) || (cx === 145 && sn < 0), h = broken ? 70 + rnd() * 50 : YT - YB; cols.push({ x:sn * cx, h }); if(!broken) blocks.push([sn * cx, YT - 7, -12, 17, 7, 17]); }
    blocks.push([0, YT, -12, 2 * W - 30, 16, 26]);   // 梁
    for(let i = 0; i < 4; i++) blocks.push([0, YB + i * 6, -40 + i * 7, 2 * W - 20 - i * 8, 6, 28]);   // 段
    for(let i = 0; i < 55; i++){ const sz = 4 + rnd() * 10; blocks.push([(rnd() - 0.5) * 2 * W, YB + 24 + rnd() * 6, -70 + rnd() * 50, sz, sz * (0.5 + rnd() * 0.6), sz * (0.6 + rnd() * 0.6), rnd() * 3]); }   // 崩れた 石
    const cm = new THREE.InstancedMesh(new THREE.CylinderGeometry(5.2, 6, 1, 16, 1).translate(0, 0.5, 0), stoneM, cols.length + 1), cc = new THREE.Color();
    cols.forEach((o, i) => { cm.setMatrixAt(i, m4.compose(v.set(o.x, YB + 24, -12), q.identity(), s3.set(1, o.h - 24, 1))); cm.setColorAt(i, cc.set('#ffffff').multiplyScalar(0.85 + rnd() * 0.2)); });
    cm.setMatrixAt(cols.length, m4.compose(v.set(-120, YB + 30, -48), q.setFromEuler(e.set(0, 0.5, Math.PI / 2)), s3.set(1, 150, 1))); cm.setColorAt(cols.length, cc.set('#ffffff').multiplyScalar(0.8)); sg.add(cm);   // 倒れた 柱
    const bm2 = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), stoneM, blocks.length);
    blocks.forEach((b, i) => { bm2.setMatrixAt(i, m4.compose(v.set(b[0], b[1], b[2]), q.setFromEuler(e.set(0, b[6] || 0, 0)), s3.set(b[3], b[4], b[5]))); bm2.setColorAt(i, cc.set('#ffffff').multiplyScalar(0.8 + rnd() * 0.25)); }); sg.add(bm2);
    { const s = new THREE.Shape(); s.moveTo(-W + 10, 0); s.lineTo(W - 10, 0); s.lineTo(0, 75); s.lineTo(-W + 10, 0); const pd = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:22, bevelEnabled:false }), stoneM); pd.position.set(0, YT + 16, -24); sg.add(pd); }   // 三角屋根
    // 青く 光る 古代文字 (壁の 前に 薄い 板、門の 所は 空ける)
    { const CW = 1024, CH = 512, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'); g.strokeStyle = '#ffffff'; g.lineWidth = 2.2; g.lineCap = 'round';
      for(const [v0, v1] of [[0.62, 0.7], [0.74, 0.8], [0.84, 0.9], [0.06, 0.14], [0.18, 0.24]]) for(let x = 20; x < CW - 20; x += 18){ if(rnd() < 0.15) continue; const y0 = (1 - v1) * CH, hh = (v1 - v0) * CH, cx = x + 7, cy = y0 + hh / 2;   // 文字の 行 (絵の 上下に 5 行)
        g.beginPath(); const kind = (rnd() * 5) | 0; if(kind === 0){ g.arc(cx, cy, hh * 0.3, 0, Math.PI * 2); } else if(kind === 1){ g.moveTo(cx, y0 + 2); g.lineTo(cx, y0 + hh - 2); g.moveTo(cx - 5, cy); g.lineTo(cx + 5, cy); } else if(kind === 2){ g.moveTo(cx - 6, y0 + hh - 3); g.lineTo(cx, y0 + 3); g.lineTo(cx + 6, y0 + hh - 3); } else if(kind === 3){ g.moveTo(cx - 6, y0 + 3); g.lineTo(cx + 6, y0 + 3); g.lineTo(cx - 6, y0 + hh - 3); g.lineTo(cx + 6, y0 + hh - 3); } else { g.arc(cx, cy, hh * 0.32, Math.PI * 0.2, Math.PI * 1.8); g.moveTo(cx, cy); g.lineTo(cx + 6, cy); } g.stroke(); }
      for(let k = 0; k < 3; k++){ const u0 = (lx(k) - DH - 6 + W) / (2 * W), u1 = (lx(k) + DH + 6 + W) / (2 * W), v0 = (ly(k) + D0 - 6 - YB) / (YT - YB), v1 = (ly(k) + D1 + 6 - YB) / (YT - YB); g.clearRect(u0 * CW, (1 - v1) * CH, (u1 - u0) * CW, (v1 - v0) * CH); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; runeM = new THREE.MeshBasicMaterial({ map:t, color:'#5fe6ff', transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false });
      const rp = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, YT - YB), runeM); rp.position.set(0, (YT + YB) / 2, -2.3); rp.rotation.y = Math.PI; rp.scale.x = -1; sg.add(rp); } }

  yield;
  // 水の 中の 濁り: カメラを 包む 球 = いまの もやの 色 (背景の 空の 球の 色と もやの 色が 違うと、遠くの 海面・海底が 天井と 床、背景が 壁に 見えて 箱の 中に 見えた、11/2 社長)
  const murk = new THREE.Mesh(new THREE.SphereGeometry(4000, 24, 12), new THREE.MeshBasicMaterial({ color:'#1f7fab', side:THREE.BackSide, fog:false, depthWrite:false })); murk.renderOrder = -6; murk.frustumCulled = false; root.add(murk);

  yield;
  // 潜った 跡の 泡 (潜り始めの 600 m の まわりを ゆらゆら 昇り、海面で 消える)
  const bm = new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 }, uSurf:{ value:SURF } }]),
    vertexShader:`uniform float uTime; uniform float uSurf; attribute vec2 aB; varying float vA;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ float h = uSurf - position.y, k = fract(aB.x + uTime * aB.y / max(h, 1.0)); vec3 p = position + vec3(sin(uTime * 3.0 + aB.x * 40.0) * 1.5, k * h, 0.0);
        vA = smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.9, 1.0, k)); vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = clamp(500.0 / -mvPosition.z, 1.5, 14.0);
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying float vA;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard;
        gl_FragColor = vec4(0.85, 0.97, 1.0, (1.0 - smoothstep(0.3, 0.5, d)) * (0.35 + 0.65 * smoothstep(0.25, 0.45, d)) * vA * 0.8);
        ${ADD_FADE}
        #include <colorspace_fragment>
      }` });
  { const n = mob ? 400 : 700, pos = new Float32Array(n * 3), b = new Float32Array(n * 2);
    for(let i = 0; i < n; i++){ const p = at(sIn - 150 + rnd() * 650, (rnd() - 0.5) * 50, (rnd() - 0.5) * 50); p.y = Math.min(p.y, SURF - 5); pos.set([p.x, p.y, p.z], i * 3); b.set([rnd(), 4 + rnd() * 6], i * 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.BufferAttribute(b, 2)); const p = new THREE.Points(g, bm); p.frustumCulled = false; root.add(p); }

  const camL = new THREE.Vector3(), ahead = new THREE.Vector3(), fogUp = new THREE.Color('#a9d6ee'), fogShallow = new THREE.Color('#1f7fab'), fogDeep = new THREE.Color('#031420'); let t = 0;
  sn.uniforms.uSurf.value = SURF;
  return [(cam, dt) => { if(out.dead) return; t += dt; sm.uniforms.uTime.value = t; jt.value = t; tm.uniforms.uTime.value = t; sn.uniforms.uTime.value = t; srf.uniforms.uTime.value = t; bm.uniforms.uTime.value = t;
    camL.copy(cam.position); root.worldToLocal(camL); sn.uniforms.uCam.value.copy(camL); wt.value = t; for(const w of walls) w.m.visible = camL.z > w.z0 - 3000 && camL.z < w.z1 + 900; if(runeM) runeM.opacity = 0.55 + 0.3 * Math.sin(t * 1.4); srf.uniforms.uCam.value.copy(camL);
    const f = scene.fog, up = camL.y > SURF; murk.visible = !up; sky.visible = sun.visible = up;
    if(up){ f.color.copy(fogUp); f.near = 3000; f.far = 40000; hemi.intensity = 1.1; top.intensity = 0.9; lamp.intensity = spot.intensity = 0; }   /* 海の 上 (はじめの 一瞬・前の 世界の 輪の 窓から 見た 時) */
    else { const k = THREE.MathUtils.smoothstep(SURF - camL.y, 0, 2500); f.color.lerpColors(fogShallow, fogDeep, k); f.near = 20; f.far = (mob ? 900 : 1000) + 700 * k; hemi.intensity = 1.1 - 0.8 * k; top.intensity = 0.9 - 0.85 * k; const lk = THREE.MathUtils.smoothstep(SURF - camL.y, 300, 1800); lamp.intensity = 1500 * lk; spot.intensity = 2600 * lk; lamp.position.copy(camL); spot.position.copy(camL); ahead.set(0, 0, -600).applyQuaternion(cam.quaternion).add(cam.position); root.worldToLocal(ahead); spot.target.position.copy(ahead);
      murk.material.color.copy(f.color); murk.position.copy(camL); } }];   // 深いほど 暗く (2.5 km で 真っ暗)。見通しは 浅い 所 約 1 km・深い 所 約 1.7 km (透明すぎない、11/2 社長)。背景は もやと 同じ 色 (境目なし)
}
