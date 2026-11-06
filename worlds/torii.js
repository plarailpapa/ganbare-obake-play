// 鳥居と 湯けむりの 町 (3 面 分かれ道 ② 右、11/2。設計書「たくさんの 鳥居と、道後温泉を 何重にも 積み重ねた ような 和風建築の 間を 駆け抜ける」)
// 1 回目: 夕暮れの 空・湯けむりの 立つ 川・土手・谷の 両側の 斜面に 段々に 積み重なる 木造の 湯屋 (窓の 灯り)・赤い 提灯・レールの 上を またぐ 太鼓橋・湯けむり。11/2 社長「もっと ぎっしり、光の 都市と 違う 感じに」「太鼓橋の 下を くぐる、川沿いに 土手」「山で めり込む、左右の 曲がりも」
// 座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)。コースは coursePath3 で なぞる (谷の 町は 平らに ゆるい S 字、その 後 山を 上る)
import * as THREE from 'three';
import { coursePath3, exit3, SPREAD3_SEC } from '../stage3.js';

const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし
const ADD_FADE = '#ifdef USE_FOG\n  gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);\n#endif';   // 光を 足す 描き方は 遠いほど 薄く
const WATER_Y = -8, BANK = 46, DOTE = 66, PROM = 82, DOTE_Y = 12, SLOPE = 0.55, TOWN_K = 0.42;   // 川の 水面 (レールの 8 m 下) / 川の 半分の 幅 / 土手の 上 / 川沿いの 道の 外 / 土手の 高さ / 谷の 斜面の 傾き / 谷の 町が 続く 割合 (コースの 長さに 対して、その 先は 山)

function wallTex(rnd){   // 湯屋の 壁 (512 四方 = 横 40 m × 縦 48 m: 柱の 間 4 つ × 4 階)。色の 絵 と 光る 窓の 絵 (灯りの ついた 障子)
  const N = 512, c = document.createElement('canvas'), e = document.createElement('canvas'); c.width = c.height = e.width = e.height = N; const g = c.getContext('2d'), h = e.getContext('2d');
  g.fillStyle = '#3b2618'; g.fillRect(0, 0, N, N); h.fillStyle = '#000'; h.fillRect(0, 0, N, N);
  for(let f = 0; f < 4; f++) for(let b = 0; b < 4; b++){ const x = b * 128, y = f * 128;
    g.fillStyle = '#e6d8be'; g.fillRect(x + 6, y + 4, 116, 22);   // 上の 白い 漆喰
    const lit = rnd() < 0.72, wc = lit ? '#ffcf78' : '#6a5038'; g.fillStyle = wc; g.fillRect(x + 12, y + 34, 104, 74);
    if(lit){ const k = 0.75 + rnd() * 0.25; h.fillStyle = `rgba(255,${(180 * k) | 0},${(90 * k) | 0},1)`; h.fillRect(x + 12, y + 34, 104, 74); }
    g.strokeStyle = '#2a1a10'; h.strokeStyle = '#000'; g.lineWidth = h.lineWidth = 3;   // 障子の 格子
    for(let i = 1; i < 4; i++){ for(const ctx of [g, h]){ ctx.beginPath(); ctx.moveTo(x + 12 + i * 26, y + 34); ctx.lineTo(x + 12 + i * 26, y + 108); ctx.stroke(); } }
    for(const ctx of [g, h]){ ctx.beginPath(); ctx.moveTo(x + 12, y + 71); ctx.lineTo(x + 116, y + 71); ctx.stroke(); }
    g.fillStyle = '#24160d'; g.fillRect(x, y, 6, 128); g.fillRect(x, y + 112, 128, 16); }   // 柱 と 床の 梁
  const t = new THREE.CanvasTexture(c), te = new THREE.CanvasTexture(e); for(const x of [t, te]){ x.wrapS = x.wrapT = THREE.RepeatWrapping; x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; } return [t, te];
}

function wallMat(tc, te){   // 湯屋の 壁: 置いた 後の 大きさで 壁の 絵を 貼る (横向きの 面だけ、2 方向から 混ぜる)。窓は 自分で 光る。上と 下の 面は 黒っぽい 木
  const m = new THREE.MeshLambertMaterial({ color:'#ffffff' }); m.userData.stone = tc; m.userData.tex2 = te;
  m.onBeforeCompile = s => { s.uniforms.uW = { value:tc }; s.uniforms.uE = { value:te };
    s.vertexShader = 'varying vec3 vSP; varying vec3 vSN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vec3 isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vSP = (instanceMatrix * vec4(transformed, 1.0)).xyz; vSN = mat3(instanceMatrix) * (objectNormal / (isc * isc));');
    s.fragmentShader = 'uniform sampler2D uW; uniform sampler2D uE; varying vec3 vSP; varying vec3 vSN;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  vec3 wn = abs(normalize(vSN)); float wx = wn.x * wn.x, wz = wn.z * wn.z, side = 1.0 - wn.y * wn.y; vec2 ua = vec2(vSP.z, vSP.y) / vec2(40.0, 48.0), ub = vec2(vSP.x, vSP.y) / vec2(40.0, 48.0);
  vec3 wc = (texture2D(uW, ua).rgb * wx + texture2D(uW, ub).rgb * wz) / max(wx + wz, 1e-4); vec3 we = (texture2D(uE, ua).rgb * wx + texture2D(uE, ub).rgb * wz) / max(wx + wz, 1e-4);
  diffuseColor.rgb *= mix(vec3(0.16, 0.1, 0.07), wc, side);`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += we * side * 1.15;'); };
  return m;
}

function roofGeo(){   // 反りの ある 寄棟の 屋根 (幅 1 の 四角に かぶせる、高さ 1): 4 つの 面が 内側へ くぼむ 回転体を 45 度 回す。軒は 0.62 まで 張り出す
  const pts = [[0.877, 0], [0.76, 0.1], [0.58, 0.3], [0.38, 0.58], [0.17, 0.86], [0.0, 1.0]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 4).rotateY(Math.PI / 4);
}

function steamMat(tex){   // 湯けむり: いつも カメラを 向く 板が ゆっくり 昇りながら 広がって 消える (aP = 中心・大きさ、aR = 昇る 速さ・高さ・始まりの ずれ)
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 }, uTex:{ value:null } }]),
    vertexShader:`uniform float uTime; attribute vec4 aP; attribute vec3 aR; varying vec2 vUv; varying float vA;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; float k = fract(aR.z + uTime * aR.x / aR.y); vA = smoothstep(0.0, 0.2, k) * (1.0 - smoothstep(0.55, 1.0, k));
        vec4 mvPosition = modelViewMatrix * vec4(aP.xyz + vec3(sin(uTime * 0.3 + aR.z * 9.0) * 6.0, k * aR.y, 0.0), 1.0); mvPosition.xy += position.xy * aP.w * (0.6 + 0.9 * k); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform sampler2D uTex; varying vec2 vUv; varying float vA;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        float a = texture2D(uTex, vUv).a * vA * 0.5; if(a < 0.005) discard;
        gl_FragColor = vec4(1.0, 0.94, 0.88, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uTex.value = tex; return m;
}

let waterTex = null;   // 川面の 凹凸の 絵 (three.js 付属の waternormals.jpg、深海の 海面・洞窟の 湖と 同じ)。世界を 作り直しても 1 枚を 使い回す
function waterNormals(){ if(!waterTex){ waterTex = new THREE.TextureLoader().load('assets/nature/waternormals.jpg'); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.userData.shared = true; } return waterTex; }
function waterMat(sunDir){   // 夕暮れの 川 (11/2 社長「川の 水面を いつもの いい感じに」): three.js の Water と 同じ 計算 (凹凸の 絵 4 枚を 流して 波・夕日の 照り返し = 正面の 金色の 光の 道・角度で 夕焼け空を 映す) + 灯りの きらめき。鏡の 代わりに 空の 色
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true,
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
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      vec4 getNoise(vec2 uv){
        vec2 uv0 = (uv / 103.0) + vec2(uTime / 17.0, uTime / 29.0), uv1 = uv / 107.0 - vec2(uTime / -19.0, uTime / 31.0), uv2 = uv / vec2(8907.0, 9803.0) + vec2(uTime / 101.0, uTime / 97.0), uv3 = uv / vec2(1091.0, 1027.0) - vec2(uTime / 109.0, uTime / -113.0);
        return (texture2D(uN, uv0) + texture2D(uN, uv1) + texture2D(uN, uv2) + texture2D(uN, uv3)) * 0.5 - 1.0; }
      void main(){
        ${clip.f}
        vec3 n = normalize(getNoise(vPos.xz).xzy * vec3(1.5, 1.0, 1.5)), e = normalize(uCam - vPos), sunC = vec3(1.0, 0.7, 0.4), r = normalize(reflect(-uSun, n)), rd = reflect(-e, n);
        vec3 spec = pow(max(0.0, dot(e, r)), 110.0) * sunC * 2.6, dif = max(dot(uSun, n), 0.0) * sunC * 0.4;
        float th = max(dot(e, n), 0.0), refl = 0.02 + 0.98 * pow(1.0 - th, 5.0);
        vec3 sky = mix(vec3(1.0, 0.62, 0.4), vec3(0.42, 0.36, 0.56), pow(clamp(rd.y, 0.0, 1.0), 0.5)), scatter = max(0.0, dot(n, e)) * vec3(0.05, 0.035, 0.04);
        vec3 c = mix(sunC * dif * 0.3 + scatter, sky + spec, refl);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uN.value = waterNormals(); return m;
}

function groundTex(rnd){   // 土手の 地面の 絵 3 枚: 石垣 (不ぞろいな 石を 積む)・草・石畳。どれも 平均の 明るさ 約 0.6
  const mk = draw => { const c = document.createElement('canvas'); c.width = c.height = 256; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const ishi = mk(g => { g.fillStyle = '#4a4440'; g.fillRect(0, 0, 256, 256); for(let y = 0; y < 256; ){ const h = 22 + rnd() * 18; for(let x = -rnd() * 40; x < 256; ){ const w = 30 + rnd() * 40, l = 150 + rnd() * 60; g.fillStyle = `rgb(${l},${l - 6},${l - 14})`; g.beginPath(); g.moveTo(x + 3 + rnd() * 4, y + 2); g.lineTo(x + w - 2 - rnd() * 4, y + 2 + rnd() * 3); g.lineTo(x + w - 2, y + h - 2 - rnd() * 4); g.lineTo(x + 2 + rnd() * 5, y + h - 2); g.closePath(); g.fill(); x += w; } y += h; } });
  const grass = mk(g => { g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, 256, 256); for(let i = 0; i < 2600; i++){ const x = rnd() * 256, y = rnd() * 256, l = 90 + rnd() * 120; g.strokeStyle = `rgb(${l},${l},${l})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 6); g.stroke(); } });
  const pave = mk(g => { g.fillStyle = '#5a5654'; g.fillRect(0, 0, 256, 256); for(let r = 0; r < 4; r++) for(let k = 0; k < 4; k++){ const l = 150 + rnd() * 50; g.fillStyle = `rgb(${l},${l - 4},${l - 10})`; g.fillRect(k * 64 + 3 + (r % 2) * 32, r * 64 + 3, 58, 58); g.fillRect(k * 64 + 3 + (r % 2) * 32 - 256, r * 64 + 3, 58, 58); } });
  return [ishi, grass, pave];
}

function groundMat(texs){   // 土手の 地面: 頂点の kind で 絵を 選ぶ (0 = 石垣 (横から 貼る)・1 = 草・2 = 石畳・3 = 斜面の 土 (草の 絵を 大きく)) × 頂点の 色。置いた 後の 大きさで 貼る
  const m = new THREE.MeshLambertMaterial({ vertexColors:true, side:THREE.DoubleSide }); m.userData.stone = texs[0]; m.userData.tex2 = texs[1]; m.userData.tex3 = texs[2];
  m.onBeforeCompile = s => { s.uniforms.uI = { value:texs[0] }; s.uniforms.uG = { value:texs[1] }; s.uniforms.uP = { value:texs[2] };
    s.vertexShader = 'attribute float kind; varying float vKind; varying vec3 vSP; varying vec3 vSN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = kind; vSP = transformed; vSN = objectNormal;');
    s.fragmentShader = 'uniform sampler2D uI; uniform sampler2D uG; uniform sampler2D uP; varying float vKind; varying vec3 vSP; varying vec3 vSN;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  float kd = floor(vKind + 0.5); vec3 wn = abs(normalize(vSN)); float bx = wn.x * wn.x / max(wn.x * wn.x + wn.z * wn.z, 1e-4); vec3 tx;
  if(kd < 0.5) tx = texture2D(uI, vSP.zy / 9.0).rgb * bx + texture2D(uI, vSP.xy / 9.0).rgb * (1.0 - bx);
  else if(kd < 1.5) tx = texture2D(uG, vSP.xz / 6.0).rgb;
  else if(kd < 2.5) tx = texture2D(uP, vSP.xz / 14.0).rgb;
  else tx = texture2D(uG, vSP.xz / 40.0).rgb;
  diffuseColor.rgb *= mix(tx * 1.75, vec3(1.0), smoothstep(400.0, 1600.0, length(vViewPosition)));`); };
  return m;
}

function flowerTex(){   // 桜の 花 1 輪 (5 枚の 花びら、先に 切れ込み、まん中は 白く 外は 桃色、黄色い しべ)
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.translate(64, 64);
  for(let i = 0; i < 5; i++){ g.save(); g.rotate(i / 5 * Math.PI * 2); const rg = g.createLinearGradient(0, 0, 0, -60); rg.addColorStop(0, '#fff8fb'); rg.addColorStop(0.55, '#ffd9e6'); rg.addColorStop(1, '#ffa9c6'); g.fillStyle = rg;
    g.beginPath(); g.moveTo(0, -4); g.bezierCurveTo(-26, -20, -24, -52, -9, -60); g.lineTo(0, -52); g.lineTo(9, -60); g.bezierCurveTo(24, -52, 26, -20, 0, -4); g.closePath(); g.fill(); g.restore(); }   // 花びら (先の まん中が V 字に 切れ込む)
  g.fillStyle = '#e8708e'; g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffe08a'; for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * 12, Math.sin(a) * 12, 2.2, 0, Math.PI * 2); g.fill(); }   // しべ
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function flowerMat(tex){   // 桜の 花 (いつも カメラを 向く 板。形は 絵で 切り抜き = 奥行きを 書く ので 並べ替え 不要。aP = 中心・大きさ、aR = 回転・明るさ)。夕日に 透けて 少し 光る
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex:{ value:null } }]),
    vertexShader:`attribute vec4 aP; attribute vec2 aR; varying vec2 vUv; varying float vB;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vB = aR.y; float c = cos(aR.x), s = sin(aR.x); vUv = mat2(c, s, -s, c) * (uv - 0.5) + 0.5; vec4 mvPosition = modelViewMatrix * vec4(aP.xyz, 1.0); mvPosition.xy += position.xy * aP.w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform sampler2D uTex; varying vec2 vUv; varying float vB;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        vec4 t = texture2D(uTex, vUv); if(t.a < 0.5) discard;
        gl_FragColor = vec4(t.rgb * vB + vec3(0.12, 0.04, 0.06), 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uTex.value = tex; return m;
}

function toriiGeo(){   // 鳥居 (幅 1・高さ 1、足元の まん中が 原点、+X = 横): 朱の 柱 2 本 (根元は 黒い 根巻)・貫・額束・島木・笠木 (黒い 屋根、両端が 少し 反り上がる)。頂点の 色で 朱と 黒
  const parts = [], RED = new THREE.Color('#e8401c'), BLK = new THREE.Color('#1a1210'), add = (g, c) => { const n = g.index ? g.toNonIndexed() : g, cl = new Float32Array(n.attributes.position.count * 3); for(let i = 0; i < cl.length; i += 3) cl.set([c.r, c.g, c.b], i); n.setAttribute('color', new THREE.BufferAttribute(cl, 3)); n.deleteAttribute('uv'); parts.push(n); };
  for(const sx of [-0.42, 0.42]){ add(new THREE.CylinderGeometry(0.05, 0.058, 1.0, 12).translate(sx, 0.5, 0), RED); add(new THREE.CylinderGeometry(0.066, 0.066, 0.08, 12).translate(sx, 0.04, 0), BLK); }
  add(new THREE.BoxGeometry(1.08, 0.05, 0.06).translate(0, 0.8, 0), RED); add(new THREE.BoxGeometry(0.06, 0.12, 0.05).translate(0, 0.9, 0), RED); add(new THREE.BoxGeometry(1.16, 0.05, 0.085).translate(0, 0.98, 0), RED);
  for(const sx of [-1, 1]){ add(new THREE.BoxGeometry(0.66, 0.06, 0.1).rotateZ(sx * 0.06).translate(sx * 0.31, 1.035, 0), RED); add(new THREE.BoxGeometry(0.68, 0.03, 0.12).rotateZ(sx * 0.06).translate(sx * 0.32, 1.075, 0), BLK); }   // 笠木 (左右 2 つで 反り)
  const pos = [], nor = [], cl = []; for(const g of parts){ pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); cl.push(...g.attributes.color.array); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); return g;
}

function petalMat(box){   // 桜吹雪: カメラの まわり box m 四方に いつも 舞う 花びら (風で 横へ 流れ、ゆっくり 落ちる、ひらひら 明滅)。位置は 箱の 大きさで 折り返す。box = 0 なら 置いた 所で ゆらゆら (遠くの 花びらの 渦)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCam:{ value:new THREE.Vector3() }, uTime:{ value:0 }, uAmt:{ value:1 } }]),
    vertexShader:`uniform vec3 uCam; uniform float uTime; uniform float uAmt; attribute float aR; varying float vA;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vec3 q = position + vec3(uTime * 9.0 + sin(uTime * 0.8 + aR * 20.0) * 6.0, -uTime * 4.0, cos(uTime * 0.6 + aR * 13.0) * 6.0);
        ${box ? `vec3 p = mod(q - uCam + ${(box / 2).toFixed(1)}, ${box.toFixed(1)}) + uCam - ${(box / 2).toFixed(1)}; vA = 1.0 - smoothstep(${(box * 0.3).toFixed(1)}, ${(box * 0.5).toFixed(1)}, length(p - uCam));` : 'vec3 p = position + (q - position) * 0.4; vA = 1.0;'}
        vA *= (0.55 + 0.45 * sin(uTime * 4.0 + aR * 50.0)) * uAmt;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = clamp(${box ? '900.0' : '2400.0'} / -mvPosition.z, 2.0, ${box ? '11.0' : '7.0'});
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying float vA;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        vec2 c = gl_PointCoord - 0.5; float d = length(c * vec2(1.0, 1.6)); if(d > 0.5) discard;
        if(vA < 0.01) discard; gl_FragColor = vec4(1.0, 0.62, 0.78, (1.0 - d * 2.0) * 0.9 * vA);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
}

function cloudMat(tex){   // 雲 (いつも カメラを 向く 板を 1 回で 描く。aP = 中心・大きさ、aS = 明るさ・少しの 傾き)。夕日で 縁が 桃色に
  const m = new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex:{ value:null } }]),
    vertexShader:`attribute vec4 aP; attribute vec2 aS; varying vec2 vUv; varying float vShade;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; vShade = aS.x; vec4 mvPosition = modelViewMatrix * vec4(aP.xyz, 1.0); float c = cos(aS.y), s = sin(aS.y); mvPosition.xy += mat2(c, s, -s, c) * position.xy * aP.w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform sampler2D uTex; varying vec2 vUv; varying float vShade;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        float a = texture2D(uTex, vUv).a; if(a < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(0.62, 0.5, 0.58), vec3(1.0, 0.86, 0.8), vShade * (0.6 + 0.4 * vUv.y)), a * 0.9);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  m.uniforms.uTex.value = tex; return m;
}

function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }

function puffTex(rnd){ const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');   // 湯けむりの ふわふわ
  for(let i = 0; i < 12; i++){ const x = 64 + (rnd() - 0.5) * 50, y = 64 + (rnd() - 0.5) * 50, r = 22 + rnd() * 26, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.7)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function* build(scene, root, P, opts, out){
  const mob = !!opts.mobile, branch = opts.nextBranch !== false, path = coursePath3(P, branch), L = path.len, TE = 7 * P.move;   // 谷の 町は 7 秒 (その 先 野原 4 秒 → 機首上げ → 螺旋)
  let seed = 20261103; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  scene.fog = new THREE.Fog('#b9714f', 700, mob ? 10000 : 12000);   // 夕暮れの 温かい 霞 (遠くまで: 天を 衝く 巨木が 町から 見える)
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3(), X = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  root.add(new THREE.HemisphereLight('#ffb27a', '#3a2830', 0.9)); const sun = new THREE.DirectionalLight('#ffa860', 1.3); sun.position.set(...(P.def.sky.sun || [0, 0.1, 1])).normalize().multiplyScalar(1000); root.add(sun, sun.target);   // 正面の 低い 夕日 (建物の 輪郭が 光る)
  { const fill = new THREE.DirectionalLight('#ffc8a0', 1.0); fill.position.set(0.3, 0.5, -1).normalize().multiplyScalar(1000); root.add(fill, fill.target); }   // こちら側からの 柔らかい 照り返し (夕日は 巨木の 向こう = 幹の こちら側が 完全な 逆光で 真っ黒な 影の 壁に なり、形が 無い ように 見えた、11/2 社長の 写真)

  yield;
  // コースの 点 (20 m ごと): 位置・高さ・左向き (水平)
  const pts = []; for(let s = -400; s <= L + 400; s += 20){ path.frame(s, v, q); X.set(1, 0, 0).applyQuaternion(q); X.y = 0; X.normalize(); pts.push({ s, x:v.x, y:v.y, z:v.z, lx:X.x, lz:X.z }); }
  const town = pts.filter(p => p.s <= TE + 300), hillPts = pts.filter(p => p.s >= TE - 300);
  yield;
  // 巨木の 中心 = 螺旋の 中心 (コースの 螺旋の 3 点を 水平に 見た 円の 中心、11/2 社長「螺旋に 上る、左カーブ」) と 幹の 太さ (螺旋との 間 約 180 m、上は 細く、根元は 少し 広がる)
  const S1 = 12.5 * P.move, S2 = 23.84 * P.move, TTOP = 8600, ss = THREE.MathUtils.smoothstep;   // 螺旋の 始め / 終わり (legs の 12.5 秒・23.84 秒 = 出口の まっすぐ (4 秒) の 始まり。入口の まっすぐは calmIn:false で 省く = 試し用と 本番で 同じ)
  const TC = (() => { const P3 = [S1 + 600, S1 + 1800, S1 + 3000].map(s => { path.frame(s, v, q); return [v.x, v.z]; }), [[ax, az], [bx, bz], [cx, cz]] = P3, d = 2 * (ax * (bz - cz) + bx * (cz - az) + cx * (az - bz));
    return new THREE.Vector3(((ax * ax + az * az) * (bz - cz) + (bx * bx + bz * bz) * (cz - az) + (cx * cx + cz * cz) * (az - bz)) / d, 0, ((ax * ax + az * az) * (cx - bx) + (bx * bx + bz * bz) * (ax - cx) + (cx * cx + cz * cz) * (bx - ax)) / d); })();
  const capR = new Float32Array(300).fill(1e9); for(const p of pts){ if(p.s < 0 || p.s > S2 + 400) continue; const b = Math.round(p.y / 20); for(let k = b - 3; k <= b + 3; k++) if(k >= 0 && k < 300) capR[k] = Math.min(capR[k], (Math.hypot(p.x - TC.x, p.z - TC.z) - 30) / 1.095); }   // 高さ 20 m ごとの 幹の 太さの 上限 = その 高さ (±60 m) を 通る コースから 樹皮の しわの 出っ張り (最大 9.2%) を 含めて 30 m 以上 離れる 太さ (11/2 社長「根を 登り 始めると コースが めり込む」= 根元の 広がりが 機首上げの 所で コースに かぶって いた)
  const rT = y => Math.min(300 + 470 * ss(TTOP - y, 0, 5800) + 300 * Math.exp(-Math.max(0, y - DOTE_Y) / 150), capR[Math.max(0, Math.min(299, Math.round(y / 20)))]);   // 高さ y での 幹の 太さ (螺旋の 所 約 770、根元は 広がるが コースには かぶらない)
  path.frame(S1, v, q); const dirC = new THREE.Vector3(v.x - TC.x, 0, v.z - TC.z).normalize(); path.frame(0, v, q); const dTown0 = new THREE.Vector3(v.x - TC.x, 0, v.z - TC.z).normalize();   // 幹から 螺旋の 始め / 町への 向き (根を 這わせない 側)
  const groundAt = d => { const a = Math.abs(d); return a < BANK ? WATER_Y - 2 : a < BANK + 2 ? WATER_Y - 2 + 3.5 * (a - BANK) : a < DOTE ? WATER_Y + 5 + (DOTE_Y - WATER_Y - 5) * (a - BANK - 2) / (DOTE - BANK - 2) : a < PROM ? DOTE_Y : DOTE_Y + (a - PROM) * SLOPE; };   // 谷の 横の 断面 (川 → 水ぎわの 石垣 (高さ 7 m) → 草の 土手 → 川沿いの 石畳の 道 → 斜面)

  yield;
  // 谷の 地面 (左右の 帯、頂点の 色で 石の 護岸・草の 土手・石畳の 道・斜面の 土)
  const wm = waterMat(new THREE.Vector3(...(P.def.sky.sun || [0, 0.1, 1])).normalize());   // 夕日の 向き = 空の 太陽と 同じ
  { const pos = [], idx = []; pts.filter(p => p.s <= TE + 750).forEach((p, i) => { pos.push(p.x + p.lx * BANK, WATER_Y, p.z + p.lz * BANK, p.x - p.lx * BANK, WATER_Y, p.z - p.lz * BANK); if(i){ const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });   /* 川は 巨木の 根元の 泉まで (根を 登り 始める 所 = TE + 750、11/2 社長「川から 木を 登り始めるまでが 寂しい」) */
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); const m = new THREE.Mesh(g, wm); m.frustumCulled = false; root.add(m); }   // 川の 水面
  const prof = [[BANK - 2, 0], [BANK, 0], [BANK + 2, 0], [BANK + 2, 1], [(BANK + DOTE) / 2 + 1, 1], [DOTE, 1], [DOTE, 2], [PROM, 2], [PROM, 3], [PROM + 1, 3], [120, 3], [180, 3], [260, 3], [360, 3], [480, 3], [620, 3], [800, 3], [1000, 3], [1300, 3]];   // [横の 距離, 種類]。種類の 境目は 同じ 所に 2 点 (帯ごとに 1 種類の 絵、11/2 社長「川の 両側の 土手も 改善」)
  const KC = ['#a29a92', '#6a8a48', '#b8a898', '#6e5c46'].map(c => new THREE.Color(c)), gmat = groundMat(groundTex(rnd));   // 石垣・草・石畳・斜面の 土
  for(const sg of [1, -1]){ const pos = [], cl = [], kd = [], idx = [], K = prof.length, c = new THREE.Color();
    town.forEach((p, i) => { prof.forEach(([d, kind], k) => { const yy = (k === 0 ? WATER_Y - 3 : groundAt(d)) + (d > PROM + 1 ? Math.sin(p.s * 0.004 + d * 0.01 + sg) * 12 : 0); pos.push(p.x + p.lx * d * sg, yy, p.z + p.lz * d * sg); c.copy(KC[kind]).multiplyScalar(0.88 + 0.2 * Math.sin(p.s * 0.03 + k)); cl.push(c.r, c.g, c.b); kd.push(kind); });
      if(i) for(let k = 0; k < K - 1; k++){ const a = (i - 1) * K + k, b = a + K; if(sg > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('kind', new THREE.Float32BufferAttribute(kd, 1)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, gmat); m.frustumCulled = false; root.add(m); }

  yield;
  // 湯屋 (谷の 斜面に 段々に ぎっしり): 胴 (壁の 絵) + 縁側 + 反りの ある 屋根。斜面の 下ほど 段が 多い。正面は 川の 方
  const bodies = [], roofs = [], decks = [], lan = [], lcol = [], LC = ['#ff4a2a', '#ff7a3a', '#ffb050', '#ff3a3a'].map(c => new THREE.Color(c));
  const HC = 50, hash = new Map(), hk = (x, z) => Math.floor(x / HC) * 100003 + Math.floor(z / HC);
  const free = (x, z, r) => { for(let i = -1; i <= 1; i++) for(let j = -1; j <= 1; j++){ const a = hash.get((Math.floor(x / HC) + i) * 100003 + Math.floor(z / HC) + j); if(a) for(const o of a) if((o.x - x) ** 2 + (o.z - z) ** 2 < (o.r + r) ** 2) return false; } const k = hk(x, z); if(!hash.has(k)) hash.set(k, []); hash.get(k).push({ x, z, r }); return true; };   // 重ならない (近くの 区画だけ 調べる)
  const tower = (x, y, z, ry, w0, tiers) => { let w = w0; const c = Math.cos(ry), sn = Math.sin(ry);
    for(let i = 0; i < tiers; i++){ const h = 13 + rnd() * 7, d = w * (0.8 + rnd() * 0.3); bodies.push({ x, y, z, w, h, d, ry });
      decks.push({ x, y:y + 1, z, w:w * 1.12, h:1.4, d:d * 1.12, ry }); const top = i === tiers - 1, rh = top ? w * (0.48 + rnd() * 0.2) : w * 0.26; roofs.push({ x, y:y + h - (top ? 0 : 2), z, w:w * 1.1, h:rh, d:d * 1.1, ry });
      if(rnd() < 0.7) for(let k = -1; k <= 1; k += 2){ const lx = k * w * 0.3, lz = d * 0.6, cc = LC[(rnd() * LC.length) | 0]; lan.push(x + lx * c + lz * sn, y + 3, z - lx * sn + lz * c); lcol.push(cc.r, cc.g, cc.b); }   // 縁側の 提灯
      y += h + (top ? 0 : rh * 0.3); w *= 0.86 + rnd() * 0.08; } };
  const LMAX = mob ? 520 : 760;
  for(let i = 0; i < town.length; i += mob ? 3 : 2){ const p = town[i]; if(p.s < -250) continue;
    for(const sg of [1, -1]) for(let lat = PROM + 16; lat < LMAX; lat += 30 + rnd() * 14){ const w0 = 22 + rnd() * 20, x = p.x + p.lx * lat * sg + (rnd() - 0.5) * 16, z = p.z + p.lz * lat * sg + (rnd() - 0.5) * 30;
      if(Math.hypot(x - TC.x, z - TC.z) < rT(0) + 150 || !free(x, z, w0 * 0.62)) continue; const near = 1 - (lat - PROM) / (LMAX - PROM);
      tower(x, groundAt(lat) - 4, z, Math.atan2(-p.lx * sg, -p.lz * sg) + (rnd() - 0.5) * 0.25, w0, 2 + ((rnd() * (2 + near * 3)) | 0)); } }   /* 斜面の 高さに 建てる = 奥ほど 高い 所 = 谷の 壁の ように 積み重なる */

  yield;
  // 太鼓橋 (土手の 上から レールの 上を またぐ 赤い アーチ、その 下を おばけが くぐる)・川を わたる 提灯の 列 (レールの 上)・土手の 灯籠
  const bridgeM = new THREE.MeshLambertMaterial({ color:'#c8321e', emissive:'#3a0a04' }), deckM = new THREE.MeshLambertMaterial({ color:'#5a3a2a', side:THREE.DoubleSide }), BR = PROM - 6, BK = 26 / BR;   // 橋の 半分の 長さ / アーチの 高さの 割合 (まん中が 土手より 26 m 上 = レールの 38 m 上)
  for(let i = 14; i < town.length - 12; i += 30){ const p = town[i]; if(p.s > TE - 300) break; const g = new THREE.Group(); g.position.set(p.x, DOTE_Y, p.z); g.rotation.y = Math.atan2(-p.lz, p.lx); root.add(g);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(BR, 3, 4, 40, Math.PI).scale(1, BK, 1.8), deckM));   // 床 (幅 約 11 m の 反った 板)
    for(const dz of [-5.5, 5.5]){ for(const [r, t, yy] of [[BR, 1.4, 0], [BR, 0.6, 4.5]]){ const a = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 40, Math.PI).scale(1, BK, 1), bridgeM); a.position.set(0, yy, dz); g.add(a); }   // 欄干 (下の 太い 桁 + 上の 手すり)
      for(let k = 1; k < 10; k++){ const u = k / 10 * Math.PI, px = Math.cos(u) * BR, py = Math.sin(u) * BR * BK, post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5, 1.2).translate(0, 2.5, 0), bridgeM); post.position.set(px, py, dz); g.add(post); if(k % 3 === 0){ const cc = LC[k % LC.length]; v.set(px, py + 6, dz).applyQuaternion(g.quaternion).add(g.position); lan.push(v.x, v.y, v.z); lcol.push(cc.r, cc.g, cc.b); } } } }   // 親柱 と 欄干の 提灯
  for(let i = 6; i < town.length; i += 4){ const p = town[i]; if(p.s > TE) break;
    for(const sg of [1, -1]){ const cc = LC[(rnd() * LC.length) | 0]; lan.push(p.x + p.lx * (DOTE + 2) * sg, DOTE_Y + 4, p.z + p.lz * (DOTE + 2) * sg); lcol.push(cc.r, cc.g, cc.b); }   // 土手の 上の 灯籠
    if(i % 20 === 6 && i % 30 !== 14) for(let k = 0; k <= 14; k++){ const u = k / 14 * 2 - 1, d = u * PROM, yy = DOTE_Y + 10 - 6 * (1 - u * u), cc = LC[(rnd() * LC.length) | 0]; lan.push(p.x + p.lx * d, yy, p.z + p.lz * d); lcol.push(cc.r, cc.g, cc.b); } }   // 川を わたる 提灯の 列 (まん中で レールの 16 m 上)


  yield;
  // 天を 衝く 巨大な 桜の 木 (2 回目、11/2 社長「めちゃくちゃ でかい 桜の 木を 登りたい」→「天を 衝く 巨木、世界樹の 迷宮の 扉絵くらい」): 谷の 町の 先の 野原に 立つ ご神木。幹 = 直径 約 1.3 km (根元は 広がる)・高さ 約 9 km、てっぺんの 花は 雲の 上。
  // コースは 町の 先の 野原を 抜け、幹を 左に 見ながら 板根の 尾根を 左カーブの 螺旋で 上り (35 度・約 150 度 回る、幹の 壁は 約 170 m 左)、幹から 張り出す 大枝へ 乗り移って 花の トンネルへ。板根と 大枝は コースの 真下に 沿わせる (めり込まない)。幹の まわりに 雲の 層 (1.5 km・4 km・6.5 km)、桜吹雪
  const TDBG = typeof location !== 'undefined' && /[?&]tdbg=1/.test(location.search), TDBG2 = typeof location !== 'undefined' && /[?&]tdbg=2/.test(location.search);   // tdbg=2: 花びらを 全部 消す (町の 終わりの 星空 調べ)   // 確かめ用 &tdbg=1: 巨木の 幹を マゼンタ・花を 水色に 光らせ、霞の 影響なし、雲の 層を 消す (11/2 町から 木が 見えない 調べ)
  const trees = [], blossoms = [], clouds = [], sakura = [], toriiBig = [], exitTorii = [], Yv = new THREE.Vector3(), barkM = new THREE.MeshLambertMaterial({ vertexColors:true, side:THREE.DoubleSide, emissive: TDBG ? '#ff00ff' : '#000000', fog:!TDBG }), BARK = new THREE.Color('#7a5a44');
  { const RS = mob ? 48 : 96, pos = [], cl = [], idx = [], c = new THREE.Color(); let rows = 0;   // 幹 (ねじれながら 上る 深い 溝)
    for(let y = DOTE_Y - 60; y <= TTOP + 1; y += 120){ const R = rT(y); for(let k = 0; k <= RS; k++){ const a = k / RS * Math.PI * 2, tw = a + y * 0.00018, f = 1 + 0.055 * Math.sin(tw * 23) + 0.025 * Math.sin(tw * 61 + y * 0.002) + 0.012 * Math.sin(a * 140 + y * 0.01);
        pos.push(TC.x + Math.cos(a) * R * f, y, TC.z + Math.sin(a) * R * f); c.copy(BARK).multiplyScalar(0.72 + (f - 1) * 5 + 0.08 * Math.sin(y * 0.003 + k * 0.7)); cl.push(c.r, c.g, c.b); }
      if(rows) for(let k = 0; k < RS; k++){ const a = (rows - 1) * (RS + 1) + k, b = a + RS + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); } rows++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, barkM); m.frustumCulled = false; root.add(m); }
  const RS2 = mob ? 16 : 28;
  const ring = (pos, cl, C, nx, ny, R, s) => { for(let k = 0; k <= RS2; k++){ const a = k / RS2 * Math.PI * 2, f = 1 + 0.07 * Math.sin(a * 13 + s * 0.003) + 0.04 * Math.sin(a * 31 - s * 0.011), rr = R * f, ca = Math.cos(a) * rr, sa = Math.sin(a) * rr;
    pos.push(C.x + nx.x * ca + ny.x * sa, C.y + nx.y * ca + ny.y * sa, C.z + nx.z * ca + ny.z * sa); const c = BARK.clone().multiplyScalar(0.75 + (f - 1) * 4 + 0.1 * Math.sin(s * 0.013 + k)); cl.push(c.r, c.g, c.b); } };
  const tubeMesh = rows => { const pos = [], cl = [], idx = []; rows.forEach((r, i) => { ring(pos, cl, r.C, r.nx, r.ny, r.R, r.s); if(i) for(let k = 0; k < RS2; k++){ const a = (i - 1) * (RS2 + 1) + k, b = a + RS2 + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, barkM); m.frustumCulled = false; root.add(m); };
  const courseTube = (s0, s1, rad, lo, dn) => { const rows = []; for(let s = s0; s <= s1; s += 30){ path.frame(s, v, q); X.set(1, 0, 0).applyQuaternion(q); Yv.set(0, 1, 0).applyQuaternion(q); const R = rad(s); rows.push({ C:v.clone().addScaledVector(Yv, -(R * 1.12 + 8 + (dn ? dn(s) : 0))).addScaledVector(X, lo(s)), nx:X.clone(), ny:Yv.clone(), R, s }); } tubeMesh(rows); };   /* 1.12 = 樹皮の しわの いちばん 出っ張った 所 (1 + 0.07 + 0.04) でも レールの 8 m 下 (前は しわが 8 m を 超えて レールに 食い込んだ、11/2 社長) */   // コースの 真下の 太い 枝・根 (lo = 幹の 方 (左) へ ずらす 量 = 幹と つながって 見える)
  const freeTube = (cp, r0, r1, n) => { const cv = new THREE.CatmullRomCurve3(cp), fr = cv.computeFrenetFrames(n, false), rows = []; for(let i = 0; i <= n; i++){ const u = i / n; rows.push({ C:cv.getPointAt(u), nx:fr.normals[i], ny:fr.binormals[i], R:r0 + (r1 - r0) * u, s:u * 3000 }); } tubeMesh(rows); return cv; };
  courseTube(TE - 150, S2 + 250, s => 50 + 100 * ss(s, TE - 150, TE + 750) + 60 * ss(s, TE + 750, S1), s => 170 * ss(s, TE + 300, S1), s => 240 * (1 - ss(s, TE - 150, TE + 750)));   /* 板根: 始まりは 地面の 中に 埋め、細い 根の 先が 川沿いの くぼ地から 約 900 m かけて 太く なりながら レールの すぐ 下まで 盛り上がる (前は 川の 上で いきなり 太い 筒の 断面で 始まり ちょん切れて 見えた、11/2 社長) */   // 板根の 尾根 (町の 終わりから 幹に 寄り添って 上る)
  const EXT = exit3(P.def), spL = SPREAD3_SEC * P.move, SPL0 = L - spL;   // 出口 (11/2 社長「ア: 花の 中の 3 つの 鳥居」): 輪の 手前 spL m で 大枝が 三又に 分かれ、3 本の レーンが それぞれの 枝の 上を 左・まん中・右へ 広がる (11/4 社長「三又に 枝が 分かれる」。前の 上下に 分かれる 形は 下の レーンが 大枝に めり込んだ)
  const laneOff = (s, k) => { const before = L - s, u0 = before >= spL ? 0 : Math.min(1, (1 - Math.max(0, before) / spL) / EXT.sw), u = u0 * u0 * (3 - 2 * u0), w = 3 + (EXT.w - 3) * u; return [(1 - k) * w, -(k - 1) * EXT.h * u]; };   // レーン k の コースの 左 / 上への ずれ (stage3.js lanes3 と 同じ 計算)
  courseTube(S2 - 250, SPL0 + 300, s => 95 - 50 * ss(s, S2, SPL0 + 300), s => 200 * (1 - ss(s, S2 - 250, S2 + 700)));   // 大枝 (幹から 張り出して コースの 下へ、先は 細く)
  for(let k = 0; k < 3; k++){ const rows = []; for(let s = SPL0; s <= L + 150; s += 30){ path.frame(s, v, q); X.set(1, 0, 0).applyQuaternion(q); Yv.set(0, 1, 0).applyQuaternion(q); const R = 42 - 26 * ss(s, SPL0, L + 150), [ox, oy] = laneOff(s, k); rows.push({ C:v.clone().addScaledVector(X, ox).addScaledVector(Yv, oy - (R * 1.12 + 8)), nx:X.clone(), ny:Yv.clone(), R, s }); } tubeMesh(rows); }   // 3 本の 枝 (各 レーンの 真下、先へ 細く)
  { path.frame(L, v, q); X.set(1, 0, 0).applyQuaternion(q); Yv.set(0, 1, 0).applyQuaternion(q);   // 各 枝の 先の 朱の 鳥居 (中に ワープの 輪 = 輪の 中心は レールの 2.2 m 上、半径 4.2 m)。行き先の ない 枝は 鳥居なし
    for(let k = 0; k < 3; k++){ if(opts.nextChoices && !opts.nextChoices[k]) continue; const [ox, oy] = laneOff(L, k), p = v.clone().addScaledVector(X, ox).addScaledVector(Yv, oy - 7); exitTorii.push({ x:p.x, y:p.y, z:p.z, q:q.clone() }); }
    const Fw = new THREE.Vector3(0, 0, 1).applyQuaternion(q);   // コースの 終わりの 進む 向き
    for(let k = 0; k < 3; k++){ const [ox, oy] = laneOff(L, k), p = v.clone().addScaledVector(X, ox).addScaledVector(Yv, oy); for(let i = 0; i < (mob ? 13 : 26); i++){ const a = rnd() * Math.PI * 2, rr = 26 + rnd() * 70, fz = 40 + rnd() * 160, sz = 10 + rnd() * 18, b = p.clone().addScaledVector(X, Math.cos(a) * rr).addScaledVector(Yv, Math.sin(a) * rr * 0.8).addScaledVector(Fw, fz); blossoms.push({ x:b.x, y:b.y, z:b.z, s:sz }); } } }   // 枝の 先の 花の 雲 (鳥居の 向こう、輪の 通り道は あける)
  for(let i = 0; i < 9; i++){ const a = i / 9 * Math.PI * 2 + 0.3, len = 1600 + rnd() * 1300, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), b = TC.clone().addScaledVector(d, rT(200) * 0.8).setY(260);   // 地面を 這う 巨大な 根
    if(d.dot(dirC) > 0.64 || d.dot(dTown0) > 0.35) continue; freeTube([b, TC.clone().addScaledVector(d, rT(200) + len * 0.45).setY(120), TC.clone().addScaledVector(d, rT(200) + len).setY(DOTE_Y - 20)], 220, 50, 20); }   /* 螺旋の 始めの 側の 根は 板根と 重ならない ように 省く */
  const cloud = (cx, cy, cz, rad, n, smin, smax) => { for(let i = 0; i < n; i++){ const a = rnd() * Math.PI * 2, b = Math.acos(rnd() * 2 - 1), r = rad * Math.cbrt(rnd()); blossoms.push({ x:cx + Math.sin(b) * Math.cos(a) * r, y:cy + Math.cos(b) * r * 0.6, z:cz + Math.sin(b) * Math.sin(a) * r, s:smin + rnd() * (smax - smin) }); } };   // 花の 雲 (平たい 球の 中に 花の かたまり)
  const K = mob ? 0.5 : 1;
  for(let i = 0; i < 11; i++){ const a = i / 11 * Math.PI * 2 + rnd() * 0.3, y0 = 3600 + rnd() * 3200, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), len = 2000 + rnd() * 1600, at = TC.clone().addScaledVector(d, rT(y0) * 0.7).setY(y0);   // 大枝 (幹の 上の 方から 四方へ、先は 垂れる) と 先の 花の 雲
    const lc = freeTube([at, at.clone().addScaledVector(d, len * 0.5).add(new THREE.Vector3(0, len * 0.22, 0)), at.clone().addScaledVector(d, len).add(new THREE.Vector3(0, len * 0.05, 0))], 230, 60, 18);
    for(let k = 0; k < 3; k++){ const p = lc.getPointAt(0.5 + k * 0.25); cloud(p.x, p.y + 150, p.z, 520 + k * 200, Math.round(80 * K), 60, 160); } }
  cloud(TC.x, TTOP + 300, TC.z, 2400, Math.round(900 * K), 90, 230);   // てっぺんの 花の 雲 (雲の 上)
  { path.frame(0, v, q); const dTown = new THREE.Vector3(v.x - TC.x, 0, v.z - TC.z).normalize(), a0 = Math.atan2(dTown.z, dTown.x);   // 町の 方 (手前) へ 低めに 張り出す 大枝 3 本 (高さ 約 2〜3 km) と 先の 花 = 町から 左斜め前に 桃色の 巨木が 見える (11/2 社長「街を 走って いる 時に 遠くの 木が 見えなく なった」)
    for(const [da, y0] of [[-0.55, 2100], [0.05, 2600], [0.6, 2300]]){ const a = a0 + da, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), len = 900 + rnd() * 300, at = TC.clone().addScaledVector(d, rT(y0) * 0.7).setY(y0);
      if(d.dot(dirC) > 0.7) continue;   /* 螺旋の 通り道 (始めの 側) には 張り出さない */
      const lc = freeTube([at, at.clone().addScaledVector(d, len * 0.5).add(new THREE.Vector3(0, len * 0.15, 0)), at.clone().addScaledVector(d, len).add(new THREE.Vector3(0, -len * 0.05, 0))], 200, 55, 16);
      for(let k = 0; k < 3; k++){ const p = lc.getPointAt(0.5 + k * 0.25); cloud(p.x, p.y + 120, p.z, 420 + k * 160, Math.round(80 * K), 50, 140); } } }
  for(let i = 0; i < 900 * K; i++){ const s = S2 - 400 + rnd() * (L + 200 - S2), sg = rnd() < 0.5 ? 1 : -1, lat = sg * (30 + Math.pow(rnd(), 1.3) * 190), upo = -40 + rnd() * 260, sz = 14 + rnd() * 34;   // 大枝の 上の 花の トンネル (両側と 上、通り道は あける)
    if(Math.hypot(lat, upo) < 30 + sz || [0, 1, 2].some(k => { const [ox, oy] = laneOff(s, k); return Math.hypot(lat - ox, upo - oy) < 26 + sz; })) continue; path.frame(s, v, q);   /* 上下に 分かれる 3 本の 通り道も あける */ X.set(1, 0, 0).applyQuaternion(q); Yv.set(0, 1, 0).applyQuaternion(q); const p = v.clone().addScaledVector(X, lat).addScaledVector(Yv, upo); blossoms.push({ x:p.x, y:p.y, z:p.z, s:sz }); }
  for(const [y0, n, r0, r1] of [[1500, 260, 60, 6500], [4100, 200, 700, 7000], [6600, 140, 500, 6000]]) for(let i = 0; i < n * K; i++){ const a = rnd() * Math.PI * 2, r = r0 + Math.sqrt(rnd()) * (r1 - r0);   // 幹を 巻く 雲の 層 (コースは 下の 層を 突き抜ける)
    const cx = TC.x + Math.cos(a) * (rT(y0) + r), cz = TC.z + Math.sin(a) * (rT(y0) + r); path.frame(Math.min(TE, Math.max(0, cz - 0)), v, q); if(y0 < 3000 && Math.abs(cx - v.x) < 2600 && cz < TE + 1200) continue;   /* 町の 上空には 雲を 置かない (木が 町から 見える ように) */
    clouds.push([TC.x + Math.cos(a) * (rT(y0) + r), y0 + (rnd() - 0.5) * 260, TC.z + Math.sin(a) * (rT(y0) + r), 500 + rnd() * 900, 0.5 + rnd() * 0.5, (rnd() - 0.5) * 0.4]); }
  yield;
  // 木の まわりの 野原 と 遠くの 山並み・野原の 木
  { const mp = pts.filter(p => p.s >= TE + 300 && p.s <= S1), e0 = mp[mp.length - 1]; for(let k = 1; k <= 200; k++) mp.push({ s:S1 + k * 50, x:e0.x - e0.lz * k * 50, z:e0.z + e0.lx * k * 50, lx:e0.lx, lz:e0.lz });   /* 町の 終わり (谷の 地面と 同じ 列) から。螺旋の 始めまでは コースに 沿い、その 先は まっすぐ 延ばす (螺旋に 沿わせると 地面の 帯が 扇の ように 回って 折り重なり 巨木を 隠した、11/2) */
    const RIV = TE + 750, half = [[BANK - 2, 0], [BANK, 0], [BANK + 2, 0], [BANK + 2, 1], [(BANK + DOTE) / 2 + 1, 1], [DOTE, 1], [DOTE, 2], [PROM, 2], [PROM, 3], [PROM + 1, 3], [170, 3], [400, 3], [1000, 3], [2000, 3], [3000, 3], [4000, 3], [6000, 3], [9000, 3]];   // 横の 点 [距離, 種類] (川の 断面 = 谷の 町と 同じ 石垣・草の 土手・石畳、その 外は 野原)
    const LP = [...half.slice().reverse().map(([d, k]) => [-d, k]), ...half], KK = LP.length - 1, pos = [], cl = [], kd = [], idx = [], c = new THREE.Color(), MC = [KC[0], KC[1], KC[2], new THREE.Color('#5e7034')];   // 野原の 色 (土の 代わりに 草の 緑)
    const gy = (a, p) => { let y = a <= PROM ? (a < BANK ? WATER_Y - 3 : groundAt(a)) : DOTE_Y - 1; if(p.s > RIV && a <= PROM) y += (DOTE_Y - 1 - y) * ss(p.s, RIV, RIV + 250); if(a < 70 && p.y !== undefined) y = Math.min(y, p.y - 10);   // 野原の 高さ: 川の 所は 谷と 同じ 断面、根元の 泉の 先は 野原の 高さまで 埋める。コースの 真下は いつも レールの 10 m 下より 低く (地面の 下を 走らない)
      return y + Math.max(0, a - 3000) * 0.3 + Math.sin(a * 0.0015 + p.s * 0.001) * 60 * ss(a, 3000, 4000); };
    mp.forEach((p, i) => { LP.forEach(([d, kind], k) => { pos.push(p.x + p.lx * d, gy(Math.abs(d), p), p.z + p.lz * d); c.copy(MC[kind]).multiplyScalar(0.88 + 0.2 * Math.sin(p.s * 0.03 + k)); cl.push(c.r, c.g, c.b); kd.push(kind); });
      for(let k = 0; k < 4; k++){ const d = (rnd() < 0.5 ? 1 : -1) * (220 + rnd() * 3800), tx = p.x + p.lx * d + (rnd() - 0.5) * 160, tz = p.z + p.lz * d + (rnd() - 0.5) * 160; if(rnd() < 0.55 && Math.hypot(tx - TC.x, tz - TC.z) > rT(0) + 200) trees.push({ x:tx, y:gy(Math.abs(d), p) - 2, z:tz, h:30 + rnd() * 50 }); }   // 野原の 木
      if(p.s <= RIV && i % 3 === 0) for(const sg of [1, -1]){ const d = (DOTE + 7) * sg, x = p.x + p.lx * d, z = p.z + p.lz * d, y = DOTE_Y; sakura.push({ x, y, z, h:11 + rnd() * 4 }); blossoms.push({ x, y:y + 14 + rnd() * 3, z, s:9 + rnd() * 3 }, { x:x + (rnd() - 0.5) * 8, y:y + 11, z:z + (rnd() - 0.5) * 8, s:7 + rnd() * 2 }); }   // 川沿いの 桜並木 (幹 + 花の かたまり 2 つ → 下で 5 枚花びらの 花に)
    if(i) for(let k = 0; k < KK; k++){ const a = (i - 1) * (KK + 1) + k, b = a + KK + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('kind', new THREE.Float32BufferAttribute(kd, 1)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, gmat); m.frustumCulled = false; root.add(m); }
  { const o = (() => { path.frame(TE + 650, v, q); X.set(1, 0, 0).applyQuaternion(q); X.y = 0; X.normalize(); return { x:v.x, z:v.z, ry:Math.atan2(-X.z, X.x) }; })(); toriiBig.push({ ...o, y:DOTE_Y, w:2 * (PROM + 2) / 0.84, h:190 }); }   // 川を またぐ 朱の 大鳥居 (柱は 両岸の 石畳の 上、幅 約 200 m・高さ 約 200 m = 正方形に 近い 形 (社長「横長より 高さを」)、根を 登り 始める 直前 = ご神木の 入口)
  yield;
  // 部品を 描く
  const [wt, we] = wallTex(rnd), wmat = wallMat(wt, we);
  const inst = (geo, mat, list, colr) => { if(!list.length) return null; const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((o, i) => { mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromAxisAngle(up, o.ry || 0), s3.set(o.w, o.h, o.d))); if(colr) mesh.setColorAt(i, colr(o)); });
    mesh.instanceMatrix.needsUpdate = true; if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; root.add(mesh); return mesh; };
  inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), wmat, bodies);
  inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color:'#ffffff' }), decks, () => col.set('#6e2a1a').multiplyScalar(0.8 + rnd() * 0.3));
  inst(roofGeo(), new THREE.MeshLambertMaterial({ color:'#ffffff', side:THREE.DoubleSide }), roofs, () => col.set('#3c4150').multiplyScalar(0.75 + rnd() * 0.3));
  inst(new THREE.ConeGeometry(0.5, 1, 7).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color:'#ffffff' }), trees.map(o => ({ ...o, w:o.h * 0.32, d:o.h * 0.32 })), () => col.setHSL(0.3 + rnd() * 0.05, 0.4, 0.13 + rnd() * 0.06));
  inst(new THREE.CylinderGeometry(0.35, 0.5, 1, 7).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color:'#5a3e2e' }), sakura.map(o => ({ ...o, w:1.6, d:1.6 })));   // 桜並木の 幹
  inst(toriiGeo(), new THREE.MeshLambertMaterial({ vertexColors:true, emissive:'#2a0804' }), toriiBig.map(o => ({ ...o, d:o.w * 0.5 })));   // 大鳥居 (朱が 夕暮れでも 沈まない ように 少し 自分で 光る)
  { const tm = new THREE.MeshLambertMaterial({ vertexColors:true, emissive:'#3a0a04' }), tg = toriiGeo(), mesh = new THREE.InstancedMesh(tg, tm, Math.max(1, exitTorii.length));   // 出口の 鳥居 (コースの 終わりの 向き = 輪と 同じ 面、幅 22 m・高さ 20 m)
    exitTorii.forEach((o, i) => mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), o.q, s3.set(22, 20, 6)))); mesh.count = exitTorii.length; mesh.frustumCulled = false; root.add(mesh); }
  { const list = [], per = mob ? 3 : 6;   // 満開の 桜の 花 (11/2 社長「花が 丸だと 植物の 感じが 遠のく、せめて 花びら型に」): 花の かたまり 1 つを 5 枚花びらの 花 per 輪に (かたまりの 中に 散らす、大きさ かたまりの 0.45〜0.75 倍)
    for(const o of blossoms) for(let k = 0; k < per; k++){ const a = rnd() * Math.PI * 2, b = Math.acos(rnd() * 2 - 1), r = o.s * 0.6 * Math.cbrt(rnd()); list.push([o.x + Math.sin(b) * Math.cos(a) * r, o.y + Math.cos(b) * r * 0.8, o.z + Math.sin(b) * Math.sin(a) * r, o.s * (0.45 + rnd() * 0.3), rnd() * 6.283, TDBG ? 0 : 0.78 + rnd() * 0.32]); }
    const n = list.length, aP = new Float32Array(n * 4), aR = new Float32Array(n * 2); list.forEach((p, i) => { aP.set(p.slice(0, 4), i * 4); aR.set(p.slice(4, 6), i * 2); });
    const base = new THREE.PlaneGeometry(1, 1), ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv);
    ig.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); ig.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 2)); ig.instanceCount = n; const m = new THREE.Mesh(ig, flowerMat(flowerTex())); m.frustumCulled = false; root.add(m); }
  const gt = glowTex();
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lan, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(lcol, 3));   // 提灯の 灯り
    const pm = new THREE.PointsMaterial({ size:6, vertexColors:true, map:gt, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
    pm.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <fog_fragment>', ADD_FADE); };
    const p = new THREE.Points(g, pm); p.frustumCulled = false; root.add(p); }

  { const n = clouds.length, aP = new Float32Array(n * 4), aS = new Float32Array(n * 2); clouds.forEach((p, i) => { aP.set(p.slice(0, 4), i * 4); aS.set(p.slice(4, 6), i * 2); });   // 幹を 巻く 雲の 層
    const base = new THREE.PlaneGeometry(1, 1), ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv);
    ig.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); ig.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 2)); ig.instanceCount = n; const m = new THREE.Mesh(ig, cloudMat(puffTex(rnd))); m.frustumCulled = false; m.renderOrder = -1; m.visible = !TDBG; root.add(m); }
  yield;
  // 桜吹雪 (カメラの まわり + 木の まわりの 遠くからも 見える 花びらの 渦)
  const pBox = petalMat(300), pFar = petalMat(0);
  { const n = mob ? 700 : 1200, pos = new Float32Array(n * 3), r = new Float32Array(n); for(let i = 0; i < n; i++){ pos.set([rnd() * 300, rnd() * 300, rnd() * 300], i * 3); r[i] = rnd(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(r, 1)); const p = new THREE.Points(g, pBox); p.frustumCulled = false; root.add(p); }
  { const n = mob ? 1200 : 2500, pos = new Float32Array(n * 3), r = new Float32Array(n); for(let i = 0; i < n; i++){ const b = blossoms[(rnd() * blossoms.length) | 0] || { x:0, y:0, z:0 }; pos.set([b.x + (rnd() - 0.5) * 250, b.y - rnd() * 300, b.z + (rnd() - 0.5) * 250], i * 3); r[i] = rnd(); }   /* 花の 雲の すぐ まわりだけ (広く 散らすと 野原から 見上げた 空に 1 画素の 点が びっしり = 星空に 見えた、11/2 社長) */
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(r, 1)); const p = new THREE.Points(g, pFar); p.frustumCulled = false; root.add(p); }
  yield;
  // 湯けむり (川面・湯屋の 屋根から ゆっくり 昇る)
  const stm = steamMat(puffTex(rnd));
  { const list = [];
    for(let i = 0; i < (mob ? 160 : 300); i++){ const p = town[(rnd() * town.length) | 0]; if(p.s > TE) continue; const d = (rnd() - 0.5) * 2 * BANK; list.push([p.x + p.lx * d, WATER_Y + 1, p.z + p.lz * d, 16 + rnd() * 16, 5 + rnd() * 5, 50 + rnd() * 50, rnd()]); }   // 川面から
    for(let i = 0; i < (mob ? 120 : 240) && bodies.length; i++){ const b = bodies[(rnd() * bodies.length) | 0]; list.push([b.x, b.y + b.h + 4, b.z, 20 + rnd() * 22, 5 + rnd() * 5, 60 + rnd() * 70, rnd()]); }   // 屋根から
    const n = list.length, aP = new Float32Array(n * 4), aR = new Float32Array(n * 3); list.forEach((o, i) => { aP.set(o.slice(0, 4), i * 4); aR.set(o.slice(4, 7), i * 3); });
    const base = new THREE.PlaneGeometry(1, 1), ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv);
    ig.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); ig.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 3)); ig.instanceCount = n; const m = new THREE.Mesh(ig, stm); m.frustumCulled = false; root.add(m); }

  let t = 0;
  const camL = new THREE.Vector3();
  return [(cam, dt) => { if(out.dead) return; t += dt; wm.uniforms.uTime.value = t; stm.uniforms.uTime.value = t; pBox.uniforms.uTime.value = pFar.uniforms.uTime.value = t; camL.copy(cam.position); root.worldToLocal(camL); pBox.uniforms.uCam.value.copy(camL); wm.uniforms.uCam.value.copy(camL); pBox.uniforms.uAmt.value = TDBG2 ? 0 : 1 - ss(Math.hypot(camL.x - TC.x, camL.z - TC.z) - rT(Math.max(0, camL.y)), 1500, 2500); pFar.uniforms.uAmt.value = TDBG2 ? 0 : 1;   /* 近くの 花びらは 巨木の 幹から 約 2.5 km 以内で だけ 舞う (町を 抜けて 暗い 空が 背景に なると 小さな 点が 星空に 見えた、11/2 社長) */ }];
}
