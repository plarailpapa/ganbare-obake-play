// ミクロの 世界 (3 面 分かれ道 ① 右、11/3 社長「どんどん 小さく」「花びらに 行く 前に 花びらが 見える 写真に 飛び込む 感じを」)
// 本物の ダリア (写真 Annie Spratt / Unsplash、CC0、Wikimedia Commons) へ 急降下 → 白く 光って 花びらの 表面 (丸い 粒の 細胞・朝露・気孔) → 気孔へ 飛び込む → 細胞の 中 → 核へ → DNA の 二重らせん → 水の 分子の 酸素へ 飛び込む → 酸素の 原子 (原子核の 手前に 次の 世界への 3 つの 門、11/3 社長「ア」)
// 場面は 道のりで 切り替える: FL の 地点で 白く 光り、光の 間に 次の 場面だけを 見せる (縮んで いく 感じ)。座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)
import * as THREE from 'three';
import { coursePath3, exit3 } from '../stage3.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし
const FL = [1650, 3450, 5100, 6900, 8700];   // 白く 光る 地点 (道のり m): ダリアの 花びらへ / 気孔へ / 核へ / 分子へ / 原子へ (legs の 5.5・11.5・17・23・29 秒。11/3 社長「原子や 水分子の 世界も 長めに」→ 花びら・細胞・DNA を 1〜2 秒ずつ 詰めて 分子 6 秒・原子 5.8 秒)
const MPP = 2.2, PW = 1920 * MPP, PH = 2884 * MPP, U0 = 0.589, V0 = 0.446, TILT0 = 45;   // 写真 1 画素 = 2.2 m (手前の ダリア 約 1.65 km) / 飛び込む 花びらの 写真上の 位置 (手前の ダリアの 真ん中の 少し 手前) / 写真を 手前へ 起こす 角度 (11/3 社長「入った 時に 写真の 端が 見えない ように・すでに 写真に 斜めに 進んで いる ように」→ 15 度で 下りる コースと 合わせて 約 60 度で 突っ込む)
const DOME_R = 40, DOME_H = 60;   // 花びらの 細胞 (丸い 粒) の 半径・高さ (m)。コースは 粒の 地面から 約 114 m (粒の 頭の 上 約 50 m)
const HAZE1 = '0.97, 0.82, 0.9';   // 花びらの 表面の 霞 = 空の 地平線の 色

function photoMat(tex){   // ダリアの 写真 (板の 上の 位置 = 板の 中の 座標、原点 = 飛び込む 花びら。写真の 外は 背景の 暗い 緑へ 溶かす)
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uTex:{ value:tex } },
    vertexShader:`varying vec2 vP;
      ${clip.pv}
      void main(){ vP = position.xy; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform sampler2D uTex; varying vec2 vP;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec2 uv = vec2(${U0} + vP.x / ${PW.toFixed(1)}, ${V0} + vP.y / ${PH.toFixed(1)});
        float inside = smoothstep(0.0, 0.04, uv.x) * (1.0 - smoothstep(0.96, 1.0, uv.x)) * smoothstep(0.0, 0.03, uv.y) * (1.0 - smoothstep(0.97, 1.0, uv.y));
        gl_FragColor = vec4(mix(vec3(0.0045, 0.0085, 0.0075), texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb, inside), 1.0);
        #include <colorspace_fragment>
      }` });
}

function cellMat(lo, hi, groove){   // 花びらの 細胞 (丸い 粒) と 気孔の 唇: 上ほど 明るい ピンク、縁が 白く 透ける、粒の 表面の しわ (groove)、遠いほど 霞
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`varying vec3 vN; varying vec3 vW; varying vec3 vL;
      ${clip.pv}
      void main(){ vL = position; vec4 w = instanceMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal); vec4 mvPosition = modelViewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW; varying vec3 vL;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 n = normalize(vN), V = normalize(uCam - vW); float f = abs(dot(n, V)), h = clamp(vL.y / ${DOME_H.toFixed(1)}, 0.0, 1.0);
        float gr = 1.0 - ${groove.toFixed(2)} * (0.5 - 0.5 * sin(atan(vL.z, vL.x) * 34.0 + h * 5.0)) * (1.0 - h * h);
        vec3 c = mix(vec3(${lo}), vec3(${hi}), 0.4 + 0.45 * max(n.y, 0.0)) * gr + vec3(1.0, 0.86, 0.93) * pow(1.0 - f, 2.5) * 0.55;
        c = mix(c, vec3(${HAZE1}), smoothstep(500.0, 2400.0, length(uCam - vW)));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}

function flatMat(col){   // 細胞の すき間の 地面・気孔の 穴 (遠いほど 霞)
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`varying vec3 vW;
      ${clip.pv}
      void main(){ vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vW;
      ${clip.pf}
      void main(){
        ${clip.f}
        gl_FragColor = vec4(mix(vec3(${col}), vec3(${HAZE1}), smoothstep(500.0, 2400.0, length(uCam - vW))), 1.0);
        #include <colorspace_fragment>
      }` });
}

const HAZE2 = '0.01, 0.045, 0.06';   // 細胞の 中の 霞 (膜の 暗い 青緑)

function membraneMat(){   // 細胞の 膜 (内側から 見る 大きな 楕円の 球): 暗い 青緑に 網目の ような 淡い 光
  return new THREE.ShaderMaterial({ clipping:true, side:THREE.BackSide,
    vertexShader:`varying vec3 vW;
      ${clip.pv}
      void main(){ vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`varying vec3 vW;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 p = vW * 0.004; float n = sin(p.x * 2.1 + sin(p.z * 1.3)) * sin(p.z * 2.4 + sin(p.y * 1.7)) * sin(p.y * 2.7 + sin(p.x * 1.9)), vein = pow(1.0 - abs(n), 8.0);
        gl_FragColor = vec4(vec3(${HAZE2}) + vec3(0.04, 0.3, 0.36) * vein + vec3(0.0, 0.03, 0.04) * (0.5 + 0.5 * n), 1.0);
        #include <colorspace_fragment>
      }` });
}

function organMat(core, rim, kind, haze = HAZE2){   // 光る 器官 (蛍光の 色): 正面は 中身の 色 (kind 1 = ミトコンドリアの ひだ、2 = 色素体の 積み重なった 円盤、0 = 模様なし)、縁が 明るく 光る、遠いほど 細胞の 中の 霞
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`varying vec3 vN; varying vec3 vW; varying vec3 vL;
      ${clip.pv}
      void main(){ vL = position; vec4 w = instanceMatrix * vec4(position, 1.0); vW = w.xyz; mat3 im = mat3(instanceMatrix); vN = normalize(im * (normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2])))); vec4 mvPosition = modelViewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW; varying vec3 vL;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 n = normalize(vN), V = normalize(uCam - vW); float f = abs(dot(n, V));
        float st = ${kind === 1 ? '0.6 + 0.4 * abs(sin(vL.y * 0.12 + sin(vL.x * 0.06) * 1.5))' : kind === 2 ? '0.65 + 0.35 * step(0.45, fract(vL.y * 5.0))' : '1.0'};
        vec3 c = vec3(${core}) * st * (0.45 + 0.55 * f) + vec3(${rim}) * pow(1.0 - f, 2.0) * 0.9;
        c = mix(c, vec3(${haze}), smoothstep(400.0, 2200.0, length(uCam - vW)));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}

function nucleusMat(){   // 細胞の 核: 紫に 染色体の まだら模様、縁が 淡く 光る
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`varying vec3 vN; varying vec3 vW;
      ${clip.pv}
      void main(){ vW = position; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 n = normalize(vN), V = normalize(uCam - vW), p = vW * 0.02; float f = abs(dot(n, V)), m = 0.5 + 0.5 * sin(p.x * 1.3 + sin(p.y * 1.1)) * sin(p.y * 1.4 + sin(p.z * 1.2)) * sin(p.z * 1.5 + sin(p.x * 0.9));
        vec3 c = mix(vec3(0.16, 0.05, 0.32), vec3(0.55, 0.3, 0.9), m * m) * (0.5 + 0.5 * f) + vec3(0.85, 0.7, 1.0) * pow(1.0 - f, 2.5) * 0.8;
        gl_FragColor = vec4(mix(c, vec3(${HAZE2}), smoothstep(600.0, 2600.0, length(uCam - vW))), 1.0);
        #include <colorspace_fragment>
      }` });
}

function fiberMat(){   // 細胞の 骨組みの 糸 (光る 細い 管、加算。遠いほど 薄く)
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`varying vec3 vN; varying vec3 vW;
      ${clip.pv}
      void main(){ vW = position; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW;
      ${clip.pf}
      void main(){
        ${clip.f}
        float f = abs(dot(normalize(vN), normalize(uCam - vW)));
        gl_FragColor = vec4(0.35, 1.0, 0.75, pow(f, 1.5) * 0.7 * (1.0 - smoothstep(500.0, 2200.0, length(uCam - vW))));
        #include <colorspace_fragment>
      }` });
}

function riboMat(box, col = '0.6, 0.95, 1.0'){   // ただよう 細かい 粒 (カメラの まわり box m 四方に いつも、位置は 箱の 大きさで 折り返す) = 速さが 分かる
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:{ uCam:{ value:new THREE.Vector3() }, uTime:{ value:0 } },
    vertexShader:`uniform vec3 uCam; uniform float uTime; attribute float aR; varying float vA;
      ${clip.pv}
      void main(){ vec3 q = position + vec3(sin(uTime * 0.3 + aR * 30.0), cos(uTime * 0.25 + aR * 20.0), sin(uTime * 0.2 + aR * 11.0)) * 6.0;
        vec3 p = mod(q - uCam + ${(box / 2).toFixed(1)}, ${box.toFixed(1)}) + uCam - ${(box / 2).toFixed(1)};
        vA = 1.0 - smoothstep(${(box * 0.3).toFixed(1)}, ${(box * 0.5).toFixed(1)}, length(p - uCam));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = clamp(500.0 / -mvPosition.z, 1.5, 7.0);
        ${clip.v}
      }`,
    fragmentShader:`varying float vA;
      ${clip.pf}
      void main(){
        ${clip.f}
        float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard;
        gl_FragColor = vec4(${col}, (1.0 - d * 2.0) * vA * 0.8);
        #include <colorspace_fragment>
      }` });
}

function dropMat(tint = '0.92, 0.96, 1.0'){   // 朝露・細胞の 中の 小さな 袋: ほぼ 透明で 縁が 光り、光の 当たる 所が きらりと
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`varying vec3 vN; varying vec3 vW;
      ${clip.pv}
      void main(){ vW = position; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 n = normalize(vN), V = normalize(uCam - vW); float f = abs(dot(n, V)), sp = pow(max(dot(reflect(-V, n), normalize(vec3(0.3, 1.0, 0.2))), 0.0), 60.0);
        gl_FragColor = vec4(mix(vec3(${tint}), vec3(1.0), sp), min(1.0, 0.1 + 0.75 * pow(1.0 - f, 3.0) + sp));
        #include <colorspace_fragment>
      }` });
}

const HAZE3 = '0.66, 0.38, 0.50', HAZE4 = '0.015, 0.045, 0.12', HAZE5 = '0.008, 0.012, 0.04';   // 霞: 核の 中 = DNA の 場面 (くすんだ ローズピンク、11/4 社長「背景が むらさきで 他の 世界との 差が 見えにくい、ピンク系」。前は 暗い 藍紫 0.035, 0.012, 0.07) / 分子の 世界 (深い 青) / 原子の 中 (ほとんど 黒の 紺)

function baseMat(haze = HAZE3, rimK = 0.9){   // DNA の 段 (塩基)・分子の 原子・原子核の 粒 (色は 1 つずつ aCol): 正面は 鮮やかな 色、縁が 白っぽく 光る、遠いほど 霞
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`attribute vec3 aCol; varying vec3 vN; varying vec3 vW; varying vec3 vC;
      ${clip.pv}
      void main(){ vC = aCol; vec4 w = instanceMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal); vec4 mvPosition = modelViewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW; varying vec3 vC;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 n = normalize(vN), V = normalize(uCam - vW); float f = abs(dot(n, V));
        vec3 c = vC * (0.5 + 0.5 * f) + mix(vC, vec3(1.0), 0.6) * pow(1.0 - f, 2.0) * ${rimK.toFixed(2)};
        gl_FragColor = vec4(mix(c, vec3(${haze}), smoothstep(400.0, 2200.0, length(uCam - vW))), 1.0);
        #include <colorspace_fragment>
      }` });
}
const DNA_IRON = new URLSearchParams(location.search).get('dna') === 'iron';   // 確かめ用 ?dna=iron = 鉄の DNA
function modelMat(core, haze = HAZE3){   // 科学模型の ような DNA (11/4 社長「明るすぎ、科学模型くらいの 色合い、何なら 鉄でも」): 自分では 光らず、上と 手前からの 光で 陰が つき 少し つや。core = null は 1 つずつの 色 (aCol)
  const col = core ? `vec3(${core})` : 'vC', base = DNA_IRON ? 'vec3(0.30, 0.31, 0.33)' : col;
  return new THREE.ShaderMaterial({ clipping:true, uniforms:{ uCam:{ value:new THREE.Vector3() } },
    vertexShader:`${core ? '' : 'attribute vec3 aCol; varying vec3 vC;'} varying vec3 vN; varying vec3 vW;
      ${clip.pv}
      void main(){ ${core ? '' : 'vC = aCol;'} vec4 w = instanceMatrix * vec4(position, 1.0); vW = w.xyz; mat3 im = mat3(instanceMatrix); vN = normalize(im * (normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2])))); vec4 mvPosition = modelViewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uCam; varying vec3 vN; varying vec3 vW; ${core ? '' : 'varying vec3 vC;'}
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 n = normalize(vN), V = normalize(uCam - vW), L = normalize(V + vec3(0.0, 0.8, 0.0)); if(dot(n, V) < 0.0) n = -n;
        float d = max(0.0, dot(n, L)), sp = pow(max(0.0, dot(reflect(-L, n), V)), ${DNA_IRON ? '18.0' : '36.0'});
        vec3 c = ${base} * (0.16 + 0.74 * d) + vec3(${DNA_IRON ? '0.5' : '0.14'}) * sp;
        gl_FragColor = vec4(mix(c, vec3(${haze}), smoothstep(400.0, 2200.0, length(uCam - vW))), 1.0);
        #include <colorspace_fragment>
      }` });
}

function orbitMat(col){   // 電子の 通り道 (光る 細い 管、加算): 電子 (道の 位置 uP と その 反対側) の 後ろに 光の 尾
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:{ uP:{ value:0 } },
    vertexShader:`varying float vU;
      ${clip.pv}
      void main(){ vU = uv.x; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform float uP; varying float vU;
      ${clip.pf}
      void main(){
        ${clip.f}
        float tr = exp(-fract(uP - vU) * 9.0) + exp(-fract(uP + 0.5 - vU) * 9.0);
        gl_FragColor = vec4(vec3(${col}) * (0.22 + 1.4 * tr), 1.0);
        #include <colorspace_fragment>
      }` });
}

function skyMat(top, hor, bot){   // 場面ごとの 空 (カメラを 包む 球): 上 → 地平線 → 下
  return new THREE.ShaderMaterial({ clipping:true, side:THREE.BackSide, depthWrite:false,
    vertexShader:`varying vec3 vD;
      ${clip.pv}
      void main(){ vD = normalize(position); vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`varying vec3 vD;
      ${clip.pf}
      void main(){
        ${clip.f}
        float y = vD.y; gl_FragColor = vec4(y > 0.0 ? mix(vec3(${hor}), vec3(${top}), pow(y, 0.6)) : mix(vec3(${hor}), vec3(${bot}), pow(-y, 0.5)), 1.0);
        #include <colorspace_fragment>
      }` });
}

export function* build(scene, root, P, opts, out){
  const mob = !!opts.mobile, branch = opts.nextBranch !== false, path = coursePath3(P, branch);
  let seed = 20261104; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3(), e = new THREE.Euler(), fw = new THREE.Vector3();
  const PS = path.S.map(sv => path.frame(sv, new THREE.Vector3(), new THREE.Quaternion()));   // コースの 点 (道のりを 求める 用)
  let ci = 0; const sAt = p => { ci = path.near(p, ci); let best = 1e18, s = path.S[ci];   // カメラの 道のり: 一番 近い 点の 前後の 区間へ 投げて 補間
    for(const [a, b] of [[ci - 1, ci], [ci, ci + 1]]){ if(a < 0 || b >= PS.length) continue; const A = PS[a], B = PS[b], ab = v.subVectors(B, A), l2 = ab.lengthSq(); if(l2 < 1e-6) continue;
      const k = Math.min(1, Math.max(0, s3.subVectors(p, A).dot(ab) / l2)), d = s3.copy(A).addScaledVector(ab, k).distanceToSquared(p); if(d < best){ best = d; s = path.S[a] + k * (path.S[b] - path.S[a]); } }
    return s; };

  yield;
  // ① 本物の ダリア (写真を 地面に、コースが 写真を 突き抜ける 所 = 飛び込む 花びら)
  const z0 = new THREE.Group(); root.add(z0);
  const photo = new THREE.TextureLoader().load('photos/dahlia.jpg'); photo.colorSpace = THREE.SRGBColorSpace; photo.anisotropy = 8;
  { path.frame(FL[0], v, q); const d = new THREE.Vector3(0, 0, 1).applyQuaternion(q), fh = new THREE.Vector3(d.x, 0, d.z).normalize(), a = TILT0 * Math.PI / 180, n = new THREE.Vector3(0, Math.cos(a), 0).addScaledVector(fh, -Math.sin(a)), Y = d.clone().addScaledVector(n, -d.dot(n)).normalize(), X = new THREE.Vector3().crossVectors(Y, n);   // 板の 向き: 表 = 上と 手前の 間 (TILT0 度 起こす)、写真の 上 = 板に 沿って 奥、写真の 右 = おばけの 右
    const m = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), photoMat(photo)); m.position.copy(v); m.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, n)); m.frustumCulled = false; z0.add(m); }
  const sky0 = new THREE.Mesh(new THREE.SphereGeometry(15000, 16, 8), skyMat("0.0045, 0.0085, 0.0075", "0.0045, 0.0085, 0.0075", "0.0045, 0.0085, 0.0075")); sky0.renderOrder = -5; sky0.frustumCulled = false; z0.add(sky0);   // 写真の まわりも 写真の 背景と 同じ 暗い 色 (地平線や 写真の 端を 見せない)

  yield;
  // ② 花びらの 表面: 丸い 粒の 細胞が びっしり (六角に 並べる)・朝露・気孔 (コースが 飛び込む 所)
  const z1 = new THREE.Group(); z1.visible = false; root.add(z1);
  path.frame(FL[1], v, q); const SC = v.clone(), YB = v.y; fw.set(0, 0, 1).applyQuaternion(q); fw.y = 0; fw.normalize();   // 気孔の 真ん中 = 地面の 高さ
  const line = []; for(let s = FL[0] - 300; s <= FL[1] + 900; s += 50){ path.frame(s, v, q); line.push(v.x, v.z); }   // コースの 道すじ (横の 広がりを 決める)
  const cm = cellMat('0.72, 0.3, 0.46', '0.98, 0.7, 0.83', 0.22), gm = flatMat('0.5, 0.18, 0.32'), lm = cellMat('0.45, 0.62, 0.32', '0.82, 0.95, 0.62', 0.0), hm = flatMat('0.03, 0.0, 0.04'), dm = dropMat();
  { let x0 = 1e9, x1 = -1e9, z0b = 1e9, z1b = -1e9; for(let i = 0; i < line.length; i += 2){ x0 = Math.min(x0, line[i]); x1 = Math.max(x1, line[i]); z0b = Math.min(z0b, line[i + 1]); z1b = Math.max(z1b, line[i + 1]); }
    const W = mob ? 700 : 1000, dx = DOME_R * 1.9, dz = dx * 0.866, cells = [];
    for(let z = z0b - W, r = 0; z <= z1b + W; z += dz, r++) for(let x = x0 - W + (r % 2) * dx / 2; x <= x1 + W; x += dx){
      let dmin = 1e18; for(let i = 0; i < line.length; i += 2) dmin = Math.min(dmin, (x - line[i]) ** 2 + (z - line[i + 1]) ** 2);
      if(dmin > W * W || (x - SC.x) ** 2 + (z - SC.z) ** 2 < 300 * 300) continue; cells.push([x + (rnd() - 0.5) * 6, z + (rnd() - 0.5) * 6]); }
    const prof = []; for(let i = 0; i <= 8; i++){ const t = i / 8; prof.push(new THREE.Vector2(Math.max(0.01, DOME_R * Math.sqrt(1 - t * t) * (1 - 0.35 * t)), DOME_H * t)); }   // 少し とがった 丸い 粒
    const mesh = new THREE.InstancedMesh(new THREE.LatheGeometry(prof, mob ? 12 : 16), cm, cells.length);
    cells.forEach(([x, z], i) => { const k = 0.85 + rnd() * 0.3; mesh.setMatrixAt(i, m4.compose(v.set(x, YB, z), q.setFromEuler(e.set((rnd() - 0.5) * 0.12, rnd() * 6.28, (rnd() - 0.5) * 0.12)), s3.set(k, k * (0.9 + rnd() * 0.3), k))); });
    mesh.frustumCulled = false; z1.add(mesh);
    const gd = new THREE.PlaneGeometry(x1 - x0 + W * 2 + 2000, z1b - z0b + W * 2 + 2000).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, YB + 0.5, (z0b + z1b) / 2), gmh = new THREE.Mesh(gd, gm); gmh.frustumCulled = false; z1.add(gmh); }   // 細胞の すき間の 地面
  { const yaw = Math.atan2(fw.x, fw.z);   // 気孔: 細長い 唇 (2 つの 孔辺細胞) と 真ん中の 暗い 穴。長い 向き = コースの 向き (形に 向きと 位置を 焼き込む = 霞の 距離が root の 座標で 合う)
    const lip = new THREE.InstancedMesh(new THREE.TorusGeometry(100, 45, 16, 48).rotateX(Math.PI / 2).scale(1, 0.8, 1.9).rotateY(yaw).translate(SC.x, SC.y, SC.z), lm, 1); lip.setMatrixAt(0, m4.identity()); lip.frustumCulled = false; z1.add(lip);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(82, 32).rotateX(-Math.PI / 2).scale(1, 1, 1.9).rotateY(yaw).translate(SC.x, SC.y + 1.5, SC.z), hm); hole.frustumCulled = false; z1.add(hole); }
  { const DR = [[2300, 360, 150], [2850, -400, 120], [3100, 300, 90]];   // 朝露 [道のり, 横 (+ = 左), 半径]
    for(const [s, lat, r] of DR){ path.frame(s, v, q); const X = new THREE.Vector3(1, 0, 0).applyQuaternion(q); X.y = 0; X.normalize();
      const g = new THREE.SphereGeometry(r, 48, 32).translate(v.x + X.x * lat, YB + DOME_H * 0.8 + r * 0.85, v.z + X.z * lat), m = new THREE.Mesh(g, dm); m.frustumCulled = false; z1.add(m); } }

  yield;
  // ③ 細胞の 中 (蛍光顕微鏡の ような 色): すき通った 膜の 部屋に ミトコンドリア (橙・ひだ)・色素体 (緑・積み重なった 円盤)・小さな 袋 (泡)・骨組みの 光る 糸・ただよう 粒、奥に 細胞の 核 (紫) と 入口 (コースが 飛び込む 所)
  const z2 = new THREE.Group(); z2.visible = false; root.add(z2);
  path.frame(FL[2], v, q); const C2 = v.clone(), D2 = new THREE.Vector3(0, 0, 1).applyQuaternion(q), NR = 350, NC = C2.clone().addScaledVector(D2, NR), yaw2 = Math.atan2(D2.x, D2.z);   // 核の 中心 = 入口 (コースが 当たる 所) から 進む 向きへ 半径 分
  const CC = C2.clone().addScaledVector(D2, -500); CC.y -= 100;   // 細胞の 真ん中 (膜の 楕円: 横 1300・高さ 1000・前後 1800 m)
  const om = organMat('1.0, 0.42, 0.12', '1.0, 0.85, 0.5', 1), pm = organMat('0.25, 0.75, 0.3', '0.75, 1.0, 0.6', 2), nm = nucleusMat(), qm = organMat('0.5, 0.3, 0.85', '0.95, 0.85, 1.0', 0), vm2 = dropMat('0.6, 0.88, 1.0'), fbm = fiberMat(), rbm = riboMat(400);
  { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32).scale(1300, 1000, 1800).rotateY(yaw2).translate(CC.x, CC.y, CC.z), membraneMat()); m.frustumCulled = false; z2.add(m); }
  const around = (sMin, sMax, latMin, latMax, hMin, hMax) => { const s = sMin + rnd() * (sMax - sMin); path.frame(s, v, q); const X = new THREE.Vector3(1, 0, 0).applyQuaternion(q); X.y = 0; X.normalize(); const lat = (latMin + rnd() * (latMax - latMin)) * (rnd() < 0.5 ? -1 : 1); return v.clone().addScaledVector(X, lat).add(new THREE.Vector3(0, hMin + rnd() * (hMax - hMin), 0)); };   // コースの まわりの 場所 (横は コースから latMin 以上)
  { const n = 12, mesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(45, 160, 6, 16), om, n);   // ミトコンドリア
    for(let i = 0; i < n; i++) mesh.setMatrixAt(i, m4.compose(around(FL[1] + 300, FL[2] - 250, 190, 650, -250, 300), q.setFromEuler(e.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)), s3.set(1, 1, 1))); mesh.frustumCulled = false; z2.add(mesh); }
  { const n = 6, mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), pm, n);   // 色素体 (花びらの 色の もと)
    for(let i = 0; i < n; i++){ const k = 0.8 + rnd() * 0.4; mesh.setMatrixAt(i, m4.compose(around(FL[1] + 400, FL[2] - 300, 260, 700, -200, 250), q.setFromEuler(e.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)), s3.set(110 * k, 55 * k, 75 * k))); } mesh.frustumCulled = false; z2.add(mesh); }
  { const gs = []; for(let i = 0; i < (mob ? 25 : 40); i++){ const p = around(FL[1] + 200, FL[2] - 150, 90, 700, -250, 300); gs.push(new THREE.SphereGeometry(12 + rnd() * 33, 20, 14).translate(p.x, p.y, p.z)); }   // 小さな 袋 (泡)
    const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, vm2); m.frustumCulled = false; z2.add(m); }
  { const gs = []; for(let i = 0; i < 16; i++){ const pts = []; const a = rnd() * 6.28, b = (rnd() - 0.5) * 2.4;   // 骨組みの 糸: 膜の 内側を ゆるく 曲がって 横切る
      for(let k = 0; k < 4; k++){ const t = k / 3, r = 0.85, ang = a + (t - 0.5) * (1.2 + rnd()), el = b * (1 - t) + (rnd() - 0.5) * t * 2.4;
        pts.push(new THREE.Vector3(Math.cos(ang) * Math.cos(el) * 1300 * r, Math.sin(el) * 1000 * r * 0.8, Math.sin(ang) * Math.cos(el) * 1800 * r).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw2).add(CC)); }
      gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 5, 6, false)); }
    const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, fbm); m.frustumCulled = false; z2.add(m); }
  const rg = new THREE.BufferGeometry();   // ただよう 粒 (細胞の 中と 核の 中で 共用)
  { const n = mob ? 700 : 1500, pos = new Float32Array(n * 3), r = new Float32Array(n); for(let i = 0; i < n; i++){ pos.set([rnd() * 400, rnd() * 400, rnd() * 400], i * 3); r[i] = rnd(); }
    rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('aR', new THREE.BufferAttribute(r, 1)); const p = new THREE.Points(rg, rbm); p.frustumCulled = false; z2.add(p); }
  { const m = new THREE.Mesh(new THREE.SphereGeometry(NR, 96, 64).translate(NC.x, NC.y, NC.z), nm); m.frustumCulled = false; z2.add(m);   // 核と 表面の 小さな 穴 (核膜孔)、入口は 大きく 光る 輪
    const n = 70, pores = new THREE.InstancedMesh(new THREE.TorusGeometry(22, 6, 8, 24), qm, n + 1), dir = new THREE.Vector3(), zA = new THREE.Vector3(0, 0, 1);
    for(let i = 0; i < n; i++){ do { dir.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); } while(dir.lengthSq() > 1 || dir.lengthSq() < 0.01 || dir.clone().normalize().dot(D2) < -0.93); dir.normalize();
      pores.setMatrixAt(i, m4.compose(NC.clone().addScaledVector(dir, NR + 2), q.setFromUnitVectors(zA, dir), s3.set(1, 1, 1))); }
    pores.setMatrixAt(n, m4.compose(C2.clone().addScaledVector(D2, -3), q.setFromUnitVectors(zA, D2), s3.set(2.4, 2.4, 2.4))); pores.frustumCulled = false; z2.add(pores); }   // 入口 = 半径 53 m の 輪
  const sky1 = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), skyMat('0.86, 0.84, 1.0', HAZE1, '0.7, 0.36, 0.52')); sky1.renderOrder = -5; sky1.frustumCulled = false; z1.add(sky1);

  yield;
  // ④ DNA の 二重らせん (核の 中): らせんの 軸 = コース (17〜23 秒は まっすぐ、途中 4 秒で 体ごと 1 回転)。右巻き・1 段 HRISE m・10 段で 1 回り。2 本の 背骨は 140 度 ずらす (段は 軸から 約 31 m 離れた 所を 横切る = コースの まわりに すき間)。段の 色 = A 赤・T 黄・G 緑・C 青 (A–T・G–C が 組)
  const z3 = new THREE.Group(); z3.visible = false; root.add(z3);
  const HR = 90, HRISE = 30, OFF = 140 * Math.PI / 180;
  path.frame(FL[2], v, q); const X3 = new THREE.Vector3(1, 0, 0).applyQuaternion(q), Y3 = new THREE.Vector3(0, 1, 0).applyQuaternion(q);   // 軸に 直角な 向き (17 秒の 向き、横回転の 前)
  const s1m = modelMat('0.18, 0.38, 0.90'), s2m = modelMat('0.88, 0.88, 0.90'), bm = modelMat(null),   /* DNA は 科学模型 (光らない・陰が つく)。色は プラスチックの 模型の ように 鮮やか (背骨 = 青と 白、ピンクの 背景に 溶けない ように。11/4 社長「科学模型式なら くすんだ 色で なくて 大丈夫」) */ hm3 = organMat('0.5, 0.28, 0.8', '0.9, 0.8, 1.0', 0, HAZE3), rbm2 = riboMat(400, '1.0, 0.8, 1.0');
  const ang = s => (s - FL[2]) / HRISE * Math.PI / 5, hx = (s, a) => { path.frame(s, v, q); return v.clone().addScaledVector(X3, Math.cos(a) * HR).addScaledVector(Y3, Math.sin(a) * HR); };   // 道のり s での 背骨の 位置 (a = 回りの 角度)
  { const s0 = FL[2] - 150, s1 = FL[3] + 450, n = Math.floor((s1 - s0) / HRISE) + 1;
    for(const [k, m] of [[0, s1m], [OFF, s2m]]){ const pts = []; for(let s = s0; s <= s1; s += 10) pts.push(hx(s, ang(s) + k));   // 背骨 (糖と リン酸) = 管 + 段ごとの 玉
      const tube = new THREE.InstancedMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 13, 10, false), m, 1); tube.setMatrixAt(0, m4.identity()); tube.frustumCulled = false; z3.add(tube);
      const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(20, 16, 12), m, n);
      for(let i = 0; i < n; i++){ const s = s0 + i * HRISE, c = hx(s, ang(s) + k); balls.setMatrixAt(i, m4.compose(c, q.identity(), s3.set(1, 1, 1))); }
      balls.frustumCulled = false; z3.add(balls); }
    const g = new THREE.CylinderGeometry(8, 8, 1, 10, 1).translate(0, 0.5, 0), col = new Float32Array(n * 6), mesh = new THREE.InstancedMesh(g, bm, n * 2), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
    const BASE = [[0.90, 0.18, 0.15], [0.95, 0.80, 0.10], [0.15, 0.75, 0.25], [0.15, 0.40, 0.95]];   // 段の 色 = 赤・黄・緑・青 (模型の 鮮やかな 色、11/4 社長)
    for(let i = 0; i < n; i++){ const s = s0 + i * HRISE, A = hx(s, ang(s)), B = hx(s, ang(s) + OFF), M = A.clone().add(B).multiplyScalar(0.5), b = Math.floor(rnd() * 4), pair = [b, b ^ 1];   // 段 = 背骨から 真ん中の 少し 手前 (3 m すき間 = 水素結合) までの 棒 2 本
      [A, B].forEach((E, j) => { dir.subVectors(M, E); const L = dir.length() - 3; dir.normalize(); mesh.setMatrixAt(i * 2 + j, m4.compose(E, q.setFromUnitVectors(up, dir), s3.set(1, L, 1))); col.set(BASE[pair[j]], (i * 2 + j) * 3); }); }
    g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3)); mesh.frustumCulled = false; z3.add(mesh); }
  { const gs = [], balls = [], rings = [], tg = new THREE.Vector3(), zA = new THREE.Vector3(0, 0, 1);   // 遠くの 染色体の 糸 (ヒストンの 玉に 巻きついた DNA = ビーズの 首飾り)
    for(let i = 0; i < 8; i++){ const sA = FL[2] + rnd() * (FL[3] - FL[2] + 200), a0 = rnd() * 6.28, d0 = 500 + rnd() * 800, pts = [];
      for(let k = 0; k < 4; k++){ const t = k - 1.5; path.frame(sA + t * 380, v, q); const a = a0 + t * 0.45 + (rnd() - 0.5) * 0.3, d = d0 + (rnd() - 0.5) * 300; pts.push(v.clone().addScaledVector(X3, Math.cos(a) * d).addScaledVector(Y3, Math.sin(a) * d)); }
      const cv = new THREE.CatmullRomCurve3(pts); gs.push(new THREE.TubeGeometry(cv, 60, 7, 6, false));
      const nb = Math.floor(cv.getLength() / 190); for(let j = 0; j < nb; j++){ const t = (j + 0.5) / nb, p = cv.getPointAt(t); cv.getTangentAt(t, tg); balls.push(p); rings.push([p, tg.clone()]); } }
    const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const str = new THREE.InstancedMesh(g, hm3, 1); str.setMatrixAt(0, m4.identity()); str.frustumCulled = false; z3.add(str);
    const hb = new THREE.InstancedMesh(new THREE.SphereGeometry(48, 20, 14), hm3, balls.length), hr = new THREE.InstancedMesh(new THREE.TorusGeometry(52, 11, 8, 32), hm3, rings.length);
    balls.forEach((p, i) => hb.setMatrixAt(i, m4.compose(p, q.identity(), s3.set(1, 1, 1)))); rings.forEach(([p, t], i) => hr.setMatrixAt(i, m4.compose(p, q.setFromUnitVectors(zA, t), s3.set(1, 1, 1))));
    hb.frustumCulled = false; hr.frustumCulled = false; z3.add(hb, hr); }
  { const p = new THREE.Points(rg, rbm2); p.frustumCulled = false; z3.add(p); }
  const sky2 = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), skyMat('0.80, 0.52, 0.64', HAZE3, '0.36, 0.16, 0.26')); sky2.renderOrder = -5; sky2.frustumCulled = false; z3.add(sky2);

  const QI = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1), AX1 = new THREE.Vector3(1, 0, 0), AZ1 = new THREE.Vector3(0, 0, 1), rbm3 = riboMat(400, '0.75, 0.88, 1.0');
  const dc = document.createElement('canvas'); dc.width = dc.height = 64; { const x = dc.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
  const dotT = new THREE.CanvasTexture(dc), halo = (c, op, sc) => { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map:dotT, color:c, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false, fog:false })); h.scale.setScalar(sc); return h; };   // ぼんやり 光る 玉 (電子・門の 光・電子の 雲)

  yield;
  // ⑤ 分子: 水 (赤い 酸素に 白い 水素 2 つ = ミッキーの 顔の 形)・二酸化炭素 (灰色の 炭素の 両側に 酸素、まっすぐ)・酸素 (酸素 2 つ) が ゆらゆら 回りながら 漂う 中を S 字で 縫い、正面の 1 つの 水の 酸素へ 飛び込む (29 秒)。花が 水と 二酸化炭素から 酸素を 作る (光合成) 3 つ (11/3 社長「水分子 以外も あと 2 種類」)
  const z4 = new THREE.Group(); z4.visible = false; root.add(z4);
  const am = baseMat(HAZE4), WO = 45, HA = 52.25 * Math.PI / 180, RED = [1.0, 0.2, 0.18], WHT = [0.95, 0.95, 1.0], GRY = [0.32, 0.33, 0.36];   // 水の 酸素の 半径 / 水素の 開き (104.5 度の 半分) / 原子の 色 (本物の 色分け: 酸素 赤・水素 白・炭素 黒 → 暗い 所で 見える 灰)
  const MOL = [[[new THREE.Vector3(), WO, RED], [new THREE.Vector3(Math.sin(HA), Math.cos(HA), 0).multiplyScalar(40), 30, WHT], [new THREE.Vector3(-Math.sin(HA), Math.cos(HA), 0).multiplyScalar(40), 30, WHT]],   // 分子の 形 [中心からの 位置, 半径, 色]: 水
    [[new THREE.Vector3(), 42, GRY], [new THREE.Vector3(52, 0, 0), 40, RED], [new THREE.Vector3(-52, 0, 0), 40, RED]],   // 二酸化炭素 (端から 端まで 約 180 m)
    [[new THREE.Vector3(26, 0, 0), 40, RED], [new THREE.Vector3(-26, 0, 0), 40, RED]]], mols = [];   // 酸素
  for(let i = 0; i < (mob ? 220 : 390); i++){ const r = rnd(); mols.push({ k: r < 0.5 ? 0 : r < 0.75 ? 1 : 2, c:around(FL[3] - 100, FL[4] + 100, 120, 650, -320, 320), ax:new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), w:0.4 + rnd() * 1.2, ph:rnd() * 6.28 }); }   // 半分が 水、4 分の 1 ずつ 二酸化炭素・酸素。コースから 横 120 m 以上 (いちばん 長い 二酸化炭素が 回っても 約 30 m 空く)
  { path.frame(FL[4] + WO - 5, v, q); mols.push({ k:0, c:v.clone(), q0:q.clone() }); }   // 飛び込む 分子: コースが 酸素の 真ん中を 通る (光る 5 m 手前で 表面に 当たる)、水素は 上に 開く = 正面から ミッキーの 顔
  const nA = mols.reduce((a, o) => a + MOL[o.k].length, 0), molM = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), am, nA), mcol = new Float32Array(nA * 3);
  { let j = 0; for(const o of mols) for(const a of MOL[o.k]) mcol.set(a[2], (j++) * 3); } molM.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(mcol, 3)); molM.frustumCulled = false; z4.add(molM);
  const mq = new THREE.Quaternion(), placeMols = t => { let j = 0; for(const o of mols){ if(o.q0) mq.copy(o.q0); else mq.setFromAxisAngle(o.ax, o.ph + t * o.w);
      for(const [d, r] of MOL[o.k]) molM.setMatrixAt(j++, m4.compose(v.copy(d).applyQuaternion(mq).add(o.c), mq, s3.setScalar(r))); }
    molM.instanceMatrix.needsUpdate = true; };
  placeMols(0);
  { const p = new THREE.Points(rg, rbm3); p.frustumCulled = false; z4.add(p); }
  const sky3 = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), skyMat('0.03, 0.09, 0.22', HAZE4, '0.005, 0.02, 0.06')); sky3.renderOrder = -5; sky3.frustumCulled = false; z4.add(sky3);

  yield;
  // ⑥ 酸素の 原子: 電子 8 個が 光の 尾を 引いて 回る (外の 3 本の 楕円に 2 個ずつ = おなじみの 原子の マーク + 内の 輪に 2 個) 中を 真ん中へ。原子核 (赤い 陽子 8・青い 中性子 8) の 手前に 次の 世界への 3 つの 門 (11/3 社長「ア」)
  // 原子の マークの 面 = コースの 終わりの 向きに 直角 (正面から マークが 見える)。座標: EO = まん中の 門 (輪の 中心 = コースの 終わり + 上 2.2 m = index.html の RING3_UP)、X5 = 左・Y5 = 上・D5 = 進む 向き。レーン k の 門 = EO + (1 − k) × ex.w 左・−(k − 1) × ex.h 上
  const z5 = new THREE.Group(); z5.visible = false; root.add(z5);
  path.frame(path.len, v, q); const EQ = q.clone(), X5 = new THREE.Vector3(1, 0, 0).applyQuaternion(EQ), Y5 = new THREE.Vector3(0, 1, 0).applyQuaternion(EQ), D5 = new THREE.Vector3(0, 0, 1).applyQuaternion(EQ), EO = v.clone().addScaledVector(Y5, 2.2), NC5 = EO.clone().addScaledVector(D5, 70);   // NC5 = 原子核の 中心 (門の 70 m 奥、手前の 粒でも 門から 約 20 m 奥 = 門を くぐると この 世界は 消える)
  const nm5 = baseMat(HAZE5), nuc = [];
  for(let k = 0; nuc.length < 16 && k < 20000; k++){ const p = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(32); if(p.length() <= 32 && !nuc.some(o => o.distanceTo(p) < 21)) nuc.push(p); }   // 原子核の 粒 (半径 17 m) を 少し 重ねて 丸く 固める
  const nucM = new THREE.InstancedMesh(new THREE.SphereGeometry(17, 24, 16), nm5, nuc.length), ncol = new Float32Array(nuc.length * 3);
  nuc.forEach((p, i) => ncol.set(i % 2 ? [0.35, 0.55, 1.0] : [1.0, 0.3, 0.25], i * 3)); nucM.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(ncol, 3)); nucM.frustumCulled = false; z5.add(nucM);
  const nq = new THREE.Quaternion(), placeNuc = t => { nq.setFromAxisAngle(Y5, t * 0.6); nuc.forEach((p, i) => nucM.setMatrixAt(i, m4.compose(v.copy(p).applyQuaternion(nq).add(NC5), QI, ONE))); nucM.instanceMatrix.needsUpdate = true; };   // ゆっくり 回る
  placeNuc(0);
  const ORB = [[650, 230, 0, 0.25], [650, 230, Math.PI / 3, -0.2], [650, 230, Math.PI * 2 / 3, 0.15], [260, 260, 0, 1.1]];   // 電子の 通り道 [長い 半径, 短い 半径, マークの 面の 中の 向き, 面からの 傾き] (どれも 原子核の 中心を 囲む = コースとは 原子核でしか 交わらない)
  const elM = new THREE.InstancedMesh(new THREE.SphereGeometry(9, 12, 8), new THREE.MeshBasicMaterial({ color:0xd8f0ff, fog:false }), ORB.length * 2), els = [];
  const orbs = ORB.map(([a, b, rot, tilt], i) => { const pts = [];
    for(let k = 0; k < 96; k++){ const t = k / 96 * Math.PI * 2, p = new THREE.Vector3(Math.cos(t) * a, Math.sin(t) * b, 0).applyAxisAngle(AX1, tilt).applyAxisAngle(AZ1, rot); pts.push(NC5.clone().addScaledVector(X5, p.x).addScaledVector(Y5, p.y).addScaledVector(D5, p.z)); }
    const curve = new THREE.CatmullRomCurve3(pts, true), m = orbitMat('0.45, 0.8, 1.0'), tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 192, 3, 6, true), m); tube.frustumCulled = false; z5.add(tube);
    for(let j = 0; j < 2; j++){ const h = halo(0x66b8ff, 0.8, 70); z5.add(h); els.push(h); }
    return { curve, m, w: i === 3 ? 0.8 : 0.45, ph:rnd() }; });
  elM.frustumCulled = false; z5.add(elM);
  const placeEl = t => { orbs.forEach((o, i) => { const u = (o.ph + t * o.w) % 1; o.m.uniforms.uP.value = u;
      for(let j = 0; j < 2; j++){ o.curve.getPointAt((u + j * 0.5) % 1, v); elM.setMatrixAt(i * 2 + j, m4.compose(v, QI, ONE)); els[i * 2 + j].position.copy(v); } }); elM.instanceMatrix.needsUpdate = true; };
  placeEl(0);
  { const h = halo(0x2850c8, 0.35, 1900); h.position.copy(NC5); z5.add(h); }   // 電子の 雲 (原子核の まわりの ぼんやりした 光)
  if(branch){ const ex = exit3(P.def), LC = [0x4cd964, 0xffd54a, 0xff5a5a], has = k => !opts.nextChoices || !!opts.nextChoices[k];   // 次の 世界への 門 (レーンの 色の 光る 輪)。行き先の ない 門は 灰色の 玉で ふさぐ
    for(let k = 0; k < 3; k++){ const p = EO.clone().addScaledVector(X5, (1 - k) * ex.w).addScaledVector(Y5, -(k - 1) * ex.h);
      if(!has(k)){ const plug = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color:0x3a4250, fog:false })); plug.position.copy(p); z5.add(plug); continue; }
      const fr = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.7, 10, 48), new THREE.MeshBasicMaterial({ color:LC[k], transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false, fog:false })); fr.position.copy(p); fr.quaternion.copy(EQ); z5.add(fr);
      const h = halo(LC[k], 0.5, 45); h.position.copy(p).addScaledVector(D5, 3); z5.add(h); } }
  { const p = new THREE.Points(rg, rbm3); p.frustumCulled = false; z5.add(p); }
  const sky4 = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), skyMat('0.02, 0.03, 0.09', HAZE5, '0.0, 0.0, 0.015')); sky4.renderOrder = -5; sky4.frustumCulled = false; z5.add(sky4);

  yield;
  // 場面の 切り替わりの 白い 光 (カメラを 包む 小さな 球、いちばん 手前に)
  const fm = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, side:THREE.BackSide, depthTest:false, depthWrite:false, fog:false });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), fm); flash.renderOrder = 999; flash.frustumCulled = false; flash.visible = false; root.add(flash);

  const camL = new THREE.Vector3(); let t = 0;
  return [(cam, dt) => { if(out.dead) return; t += dt;
    camL.copy(cam.position); root.worldToLocal(camL); const s = sAt(camL);
    z0.visible = s < FL[0]; z1.visible = s >= FL[0] && s < FL[1]; z2.visible = s >= FL[1] && s < FL[2]; z3.visible = s >= FL[2] && s < FL[3]; z4.visible = s >= FL[3] && s < FL[4]; z5.visible = s >= FL[4];
    if(z4.visible) placeMols(t); if(z5.visible){ placeNuc(t); placeEl(t); }
    let fo = 0; for(const f of FL){ const d = s - f; fo = Math.max(fo, d < 0 ? 1 - Math.min(1, -d / 60) : 1 - Math.min(1, d / 150)); }   // 光る 地点の 0.2 秒 前から 白く、0.5 秒で 晴れる
    fm.opacity = fo; flash.visible = fo > 0.001; flash.position.copy(camL); sky0.position.copy(camL); sky1.position.copy(camL); sky2.position.copy(camL); sky3.position.copy(camL); sky4.position.copy(camL);
    for(const m of [cm, gm, lm, hm, dm, om, pm, nm, qm, vm2, fbm, rbm, s1m, s2m, bm, hm3, rbm2, am, nm5, rbm3]) m.uniforms.uCam.value.copy(camL); for(const m of [rbm, rbm2, rbm3]) m.uniforms.uTime.value = t; }];
}
