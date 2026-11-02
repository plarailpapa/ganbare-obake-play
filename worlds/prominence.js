// 太陽の プロミネンス (3 面 分かれ道 ③ 右、11/3)
// 1 回目: 燃える 太陽の 表面 (本物の 太陽の 絵、遠くの 丸み)・宇宙の 空 (地平線は 太陽の 光の 縁)・立ちのぼる 炎の 柱 (スピキュール)・舞い上がる 火の粉。2 回目: 炎の アーチ (プロミネンス)。出口は 次の 回
// 座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)。太陽の 表面は 大きな 球 (半径 RS) の てっぺんの あたりを レールの SURF m 下に
import * as THREE from 'three';
import { coursePath3 } from '../stage3.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし
const RS = 25000, SURF = 150, SDIVE = 11;   // 太陽の 半径 (高さ 約 1.4 km から 地平線が 大きく 丸く 曲がって 見える、11/3 社長「いきなり 表面だと 地獄かな？ 高い 所から 近寄って いくと 分かる ように」) / 降りきった 後の レールから 表面までの 高さ / 降りきる 時刻 (legs の 秒)

function sunMat(tex){   // 太陽の 表面 (11/3 社長「安っぽい」→ 本物の 太陽の 絵 (Solar System Scope 2k_sun、CC BY 4.0、2 面の 惑星と 同じ) だけで 描く: 1 画素 = 0.8 m・2.5 m・10 m の 3 段を 違う 向きに 重ね、ゆっくり うねらせる。社長「黒点も 実際は 黒くない・幾何学模様は ふさわしくない」→ 黒点の 丸・縞と 蜂の巣の 粒は 外した。絵は 極の 引き伸ばしを 避けて 真ん中の 帯だけ 使う) + 遠いほど 光の 霞
  return new THREE.ShaderMaterial({ clipping:true,
    uniforms:{ uTime:{ value:0 }, uCam:{ value:new THREE.Vector3() }, uTex:{ value:tex } },
    vertexShader:`varying vec3 vPos;
      ${clip.pv}
      void main(){ vPos = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform float uTime; uniform vec3 uCam; uniform sampler2D uTex; varying vec3 vPos;
      ${clip.pf}
      vec3 sun(vec2 p, float m){ return texture2D(uTex, vec2(p.x / (2048.0 * m), 0.3 + 0.4 * abs(fract(p.y / (820.0 * m)) * 2.0 - 1.0))).rgb; }
      void main(){
        ${clip.f}
        vec2 p = vPos.xz, w = vec2(sin(p.y * 0.0011 + uTime * 0.08), cos(p.x * 0.0013 - uTime * 0.07)) * 120.0;
        vec3 ta = sun(mat2(0.8, 0.6, -0.6, 0.8) * p + w + vec2(uTime * 12.0, 0.0), 2.5), tb = sun(mat2(0.34, -0.94, 0.94, 0.34) * p - w * 1.7 + vec2(0.0, uTime * 6.0), 0.8), tc = sun(p + vec2(uTime * 20.0, 0.0), 10.0);
        vec3 c = pow(ta * 0.5 + tb * 0.5, vec3(1.0, 1.8, 2.2)) * vec3(1.3, 1.25, 1.0) * (0.75 + 0.5 * tc.g);
        float dist = length(uCam - vPos); c = mix(c, vec3(1.0, 0.45, 0.1), smoothstep(2500.0, 24000.0, dist));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}

function jetMat(){   // 炎の 柱 (スピキュール): 根元が 明るく 上へ 消える 細い 炎、ちらちら 揺れる (加算)
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uTime:{ value:0 } },
    vertexShader:`uniform float uTime; varying float vY; varying float vId;
      ${clip.pv}
      void main(){ vY = position.y; vId = float(gl_InstanceID); vec3 p = position; p.x += sin(uTime * 2.0 + vId * 3.1 + p.y * 3.0) * 0.12 * p.y; p.z += cos(uTime * 1.7 + vId * 1.9) * 0.1 * p.y;
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform float uTime; varying float vY; varying float vId;
      ${clip.pf}
      void main(){
        ${clip.f}
        float fl = 0.65 + 0.35 * sin(uTime * 7.0 + vId * 5.3);
        gl_FragColor = vec4(mix(vec3(1.0, 0.85, 0.45), vec3(1.0, 0.3, 0.05), vY), (1.0 - vY) * 0.7 * fl);
        #include <colorspace_fragment>
      }` });
}

function emberMat(box){   // 火の粉: カメラの まわり box m 四方に いつも 舞い上がる 光の 粒 (位置は 箱の 大きさで 折り返す)
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uCam:{ value:new THREE.Vector3() }, uTime:{ value:0 } },
    vertexShader:`uniform vec3 uCam; uniform float uTime; attribute float aR; varying float vA;
      ${clip.pv}
      void main(){ vec3 q = position + vec3(sin(uTime * 0.9 + aR * 30.0) * 8.0, uTime * (14.0 + aR * 20.0), cos(uTime * 0.7 + aR * 17.0) * 8.0);
        vec3 p = mod(q - uCam + ${(box / 2).toFixed(1)}, ${box.toFixed(1)}) + uCam - ${(box / 2).toFixed(1)};
        vA = (1.0 - smoothstep(${(box * 0.3).toFixed(1)}, ${(box * 0.5).toFixed(1)}, length(p - uCam))) * (0.5 + 0.5 * sin(uTime * 5.0 + aR * 60.0));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = clamp(700.0 / -mvPosition.z, 1.5, 8.0);
        ${clip.v}
      }`,
    fragmentShader:`varying float vA;
      ${clip.pf}
      void main(){
        ${clip.f}
        float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard;
        gl_FragColor = vec4(1.0, 0.62, 0.2, (1.0 - d * 2.0) * vA);
        #include <colorspace_fragment>
      }` });
}

function archMat(glow, H0){   // 炎の アーチ: 光る ガスの 筋 (正面ほど 明るく 縁は 透ける・明るい 所が 頂上から 両足へ 流れ落ちる・ねじれた 筋模様・輪ごと ゆっくり うねる、加算)。glow = 外側の ぼんやりした 光の 筒。aS = (輪の 番号の 種, うねりの 幅 m, 筋の 長さ m, 筋の 種)。H0 = 噴き上がる 輪の 高さ (足元が 原点の 置き方): uE (0〜1) で 上ほど 横に ふくらみ 高さ 8 倍へ 伸び、てっぺんから 薄れて 明るさが 増す
  const er = H0 ? `float k = clamp(position.y / ${H0.toFixed(1)}, 0.0, 1.0), g = uE * uE * (3.0 - 2.0 * uE); p.x *= 1.0 + 2.5 * g * k * k; p.z *= 1.0 + 1.5 * g * k * k; p.y *= 1.0 + 7.0 * g * pow(k, 1.5); vK = k * g;` : 'vK = 0.0;';
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uTime:{ value:0 }, uE:{ value:0 } },
    vertexShader:`uniform float uTime; uniform float uE; attribute vec4 aS; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec4 vS; varying float vK;
      ${clip.pv}
      void main(){ vUv = uv; vS = aS; vec3 p = position; ${er}
        p += vec3(sin(uv.x * 7.0 + uTime * 0.5 + aS.x * 6.0), 0.5 * sin(uv.x * 5.0 - uTime * 0.4 + aS.x * 3.0), cos(uv.x * 6.0 + uTime * 0.45 + aS.x * 4.0)) * aS.y * sin(3.14159 * uv.x);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; vN = normalize(normalMatrix * normal); vV = -mvPosition.xyz;
        ${clip.v}
      }`,
    fragmentShader:`uniform float uTime; uniform float uE; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec4 vS; varying float vK;
      ${clip.pf}
      void main(){
        ${clip.f}
        float f = abs(dot(normalize(vN), normalize(vV))), m = abs(vUv.x - 0.5) * vS.z, s = vS.w * 10.0;
        float flow = 0.5 + 0.5 * sin(m * 0.012 - uTime * 2.0 + s) * sin(m * 0.0047 - uTime * 0.9 + s * 1.7), streak = 0.55 + 0.45 * sin(vUv.y * 18.85 + m * 0.006 + s);
        ${glow ? 'gl_FragColor = vec4(1.0, 0.38, 0.06, pow(f, 2.5) * 0.22);'
               : 'gl_FragColor = vec4(mix(vec3(1.0, 0.28, 0.04), vec3(1.0, 0.85, 0.5), pow(f, 3.0) * flow), pow(f, 1.5) * (0.35 + 0.65 * flow) * streak * 0.85);'}
        gl_FragColor.a *= (1.0 + 0.6 * uE) * (1.0 - 0.85 * smoothstep(0.5, 1.0, vK));
        #include <colorspace_fragment>
      }` });
}

function ejectaMat(){   // 噴き上がりで 宇宙へ 飛び散る 炎の かたまり (加算): aV = 速さ (m/秒)、aD = 飛び出す 時刻 (噴き上がりの 始まりから 秒)。uT = 噴き上がりの 始まりからの 秒 (始まる 前は −1)
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uT:{ value:-1 } },
    vertexShader:`uniform float uT; attribute vec3 aV; attribute float aD; varying float vA; varying float vTe;
      ${clip.pv}
      void main(){ float te = uT - aD; vTe = te; vA = step(0.0, te) * (1.0 - smoothstep(2.5, 6.0, te));
        vec4 mvPosition = modelViewMatrix * vec4(position + aV * max(te, 0.0), 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = vA > 0.0 ? clamp(40000.0 / -mvPosition.z, 2.0, 28.0) : 0.0;
        ${clip.v}
      }`,
    fragmentShader:`varying float vA; varying float vTe;
      ${clip.pf}
      void main(){
        ${clip.f}
        float d = length(gl_PointCoord - 0.5); if(d > 0.5 || vA <= 0.0) discard;
        gl_FragColor = vec4(mix(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.35, 0.06), clamp(vTe / 4.0, 0.0, 1.0)), (1.0 - d * 2.0) * vA);
        #include <colorspace_fragment>
      }` });
}

export function build(scene, root, P, opts, out){
  const mob = !!opts.mobile, branch = opts.nextBranch !== false, path = coursePath3(P, branch), L = path.len;
  let seed = 20261103; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3(), X = new THREE.Vector3(), e = new THREE.Euler();
  path.frame(SDIVE * P.move, v, q); const C0 = new THREE.Vector3(v.x, v.y - SURF - RS, v.z);   // 太陽の 中心 = 降りきった 所の 真下 (その 先は legs の 1 秒 0.68 度の 機首下げで 球の 丸みに 沿って 高さを 保つ)
  const surfY = (x, z) => C0.y + Math.sqrt(Math.max(0, RS * RS - (x - C0.x) ** 2 - (z - C0.z) ** 2));   // 地点 (x, z) の 表面の 高さ

  const sunT = new THREE.TextureLoader().load("planets/2k_sun.jpg"); sunT.wrapS = THREE.RepeatWrapping; sunT.colorSpace = THREE.SRGBColorSpace; sunT.anisotropy = 8;   // 本物の 太陽の 絵 (横は 継ぎ目なしで くり返す)
  const sm = sunMat(sunT);
  { const g = new THREE.SphereGeometry(RS, mob ? 192 : 320, mob ? 96 : 160).translate(C0.x, C0.y, C0.z), m = new THREE.Mesh(g, sm); m.frustumCulled = false; root.add(m); }   // 球の 形を 太陽の 中心へ 動かして 作る (模様・霞を root の 位置で 描く)

  // 炎の 柱 (スピキュール): コースの まわり ±2.5 km の 表面に
  const jets = [], jm = jetMat();
  for(let i = 0; i < (mob ? 350 : 700); i++){ const s = rnd() * (L + 1500) - 500; path.frame(s, v, q); X.set(1, 0, 0).applyQuaternion(q); X.y = 0; X.normalize(); const lat = (rnd() - 0.5) * 5000; if(Math.abs(lat) < (s > 5700 && s < 7800 ? 300 : 40)) continue;   // 一回転の あたり (道のり 5850〜7650 m は ほぼ 同じ 場所で 回る) は 柱を コースから 300 m 離す
    const x = v.x + X.x * lat, z = v.z + X.z * lat; jets.push({ x, y:surfY(x, z) - 4, z, h:60 + Math.pow(rnd(), 2) * 260, r:3 + rnd() * 6, ry:rnd() * 6.28 }); }
  { const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 1, 1, 6, 4, true).translate(0, 0.5, 0), jm, jets.length);
    jets.forEach((o, i) => mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e.set(0, o.ry, 0)), s3.set(o.r, o.h, o.r)))); mesh.frustumCulled = false; root.add(mesh); }

  // 炎の アーチ (プロミネンス): 両足を 表面に つけた 光る ガスの 輪 (足は 縦に 立ち上がる 半楕円、筋 6 本が ねじれ ながら 束に なる)。[道のり s, 横 (m、+ = 左), 足の 間隔, 高さ, 足を 結ぶ 線の 向き (コースの 向きから 度、+ = 左回り), 輪の 傾き (度、+ = 上が 手前へ), 筋の 数 (省くと 6)]。
  // ジェットコースターの 見せ場に 合わせる (11/3): ツイストの 輪 (頭上 約 80 m の 低い 輪) / 一回転の 輪 (入口で くぐり、上下 さかさまで 輪の 中を 通り、また くぐる) / 最後の 右カーブの 輪。左奥の 大きな 輪 (降りる 間・一回転の てっぺんから 見える) と 横の 輪 2 つ。輪と コースの 間合いは Blender で 計算済み (一回転は 道のり 1800 m で ほぼ 同じ 場所に 戻るので、その 後の 輪は 道のりより 近く なる 点に 注意)
  const ARCH = [[5100, 0, 700, 150, 90, 0], [5850, 0, 1300, 850, 90, 0], [8250, 0, 760, 240, 85, 0], [8850, 3200, 4200, 2600, 30, 15], [3900, -1400, 1500, 800, 20, -20], [9600, -3200, 2600, 1500, 50, -10],
    [9300, 0, 1000, 650, 90, 24, 9]];   // 出口の 炎の 輪: 急上昇 (24 度) する コースに 正面を 向ける ため 上を 手前へ 24 度 倒し、筋 9 本で 太く。輪の 真ん中 (てっぺん・両足から 約 290〜500 m) を 抜け、2 秒 後に ワープの 輪
  // 噴き上がる プロミネンス (噴出型、11/3 社長「宇宙空間に 飛び出て いく タイプは？」): 出口の 先 左の ねじれた 輪。おばけが 最後の カーブに 入る (道のり s0) と dur 秒で ふくらみ ながら 高さ 8 倍 (約 4 km) へ 伸び、てっぺんが 裂けて 炎の かたまりが 宇宙へ 飛び散る (出口の 炎の 輪を くぐる 頃に いちばん 大きく)
  const ER = { s:11000, lat:600, span:1200, H:500, yaw:20, s0:7800, dur:6 };
  const am = archMat(false), gm = archMat(true), erM = archMat(false, ER.H), erG = archMat(true, ER.H), ejM = ejectaMat();
  { const core = [], glow = [], AY = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3(), up = new THREE.Vector3(), d = new THREE.Vector3(), sd = new THREE.Vector3(), hv = new THREE.Vector3(), nP = new THREE.Vector3(), T = new THREE.Vector3(), N1 = new THREE.Vector3(), N2 = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    const tag = (g, s4) => { const n = g.attributes.position.count, buf = new Float32Array(n * 4); for(let i = 0; i < n; i++) buf.set(s4, i * 4); g.setAttribute('aS', new THREE.BufferAttribute(buf, 4)); return g; };
    const NS = mob ? 4 : 6, TS = mob ? 96 : 160;
    const bundle = (P, nP, H, ns, core, glow) => {   // 輪 1 つ分の 筋 (P = 輪の 中心線、nP = 輪の 面に 垂直な 向き)
      const R0 = Math.min(170, Math.max(30, H * 0.08)), seedA = rnd(), amp = H * 0.025, NP = 48;
      for(let i = 0, n = Math.round(ns * NS / 6); i < n; i++){ const ph = rnd() * 6.283, tw = (rnd() - 0.5) * 3, rr = R0 * (0.3 + 0.7 * rnd()), pts = [];
        for(let k = 0; k <= NP; k++){ const u = k / NP, ph2 = ph + tw * 6.283 * u, w = rr * (0.55 + 0.45 * Math.sin(Math.PI * u));
          P(u + 0.01, a); P(u - 0.01, b); T.subVectors(a, b).normalize(); N2.crossVectors(T, nP).normalize(); N1.crossVectors(N2, T);
          pts.push(P(u, new THREE.Vector3()).addScaledVector(N1, Math.cos(ph2) * w).addScaledVector(N2, Math.sin(ph2) * w)); }
        const cv = new THREE.CatmullRomCurve3(pts); core.push(tag(new THREE.TubeGeometry(cv, TS, R0 * (0.22 + 0.18 * rnd()), mob ? 6 : 8, false), [seedA, amp, cv.getLength(), rnd()])); }
      const pts = []; for(let k = 0; k <= NP; k++) pts.push(P(k / NP, new THREE.Vector3()));
      const cv = new THREE.CatmullRomCurve3(pts); glow.push(tag(new THREE.TubeGeometry(cv, TS, R0 * 2.2, 10, false), [seedA, amp, cv.getLength(), 0])); };
    const place = (s, lat, yaw) => { path.frame(s, v, q); X.set(1, 0, 0).applyQuaternion(q); X.y = 0; X.normalize(); fw.set(0, 0, 1).applyQuaternion(q); fw.y = 0; fw.normalize();
      const cx = v.x + X.x * lat, cz = v.z + X.z * lat; up.set(cx - C0.x, surfY(cx, cz) - C0.y, cz - C0.z).normalize(); d.copy(fw).applyAxisAngle(AY, yaw * Math.PI / 180); return [cx, cz]; };   // 輪の 足元の 真ん中 (cx, cz) と 上 up・足を 結ぶ 向き d
    ARCH.forEach(([s, lat, span, H, yaw, tilt, ns = 6]) => {
      const [cx, cz] = place(s, lat, yaw);
      sd.crossVectors(up, d).normalize(); hv.copy(up).multiplyScalar(Math.cos(tilt * Math.PI / 180)).addScaledVector(sd, Math.sin(tilt * Math.PI / 180)); nP.crossVectors(d, hv).normalize();
      bundle((u, o) => { const th = Math.PI * Math.min(1, Math.max(0, u)), k = 0.5 - 0.5 * Math.cos(th), x = cx + d.x * span * (k - 0.5), z = cz + d.z * span * (k - 0.5); return o.set(x, surfY(x, z) - 40, z).addScaledVector(hv, (H + 40) * Math.sin(th)); }, nP, H, ns, core, glow);   // 足は 表面の 40 m 下から
    });
    for(const [gs, mt] of [[core, am], [glow, gm]]){ const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, mt); m.frustumCulled = false; root.add(m); }
    // 噴き上がる 輪: 足元の 真ん中を 原点に x = 足を 結ぶ 向き・y = 上・z = 輪の 面に 垂直 の 置き方で 作り、ふくらみ・伸びは archMat の uE で
    { const [cx, cz] = place(ER.s, ER.lat, ER.yaw), grp = new THREE.Group(), ec = [], eg = [];
      d.addScaledVector(up, -d.dot(up)).normalize(); grp.position.set(cx, surfY(cx, cz), cz); grp.quaternion.setFromRotationMatrix(m4.makeBasis(d, up, nP.crossVectors(d, up))); root.add(grp);
      bundle((u, o) => { const th = Math.PI * Math.min(1, Math.max(0, u)), k = 0.5 - 0.5 * Math.cos(th); return o.set(ER.span * (k - 0.5), (ER.H + 40) * Math.sin(th) - 40, 0); }, new THREE.Vector3(0, 0, 1), ER.H, 8, ec, eg);
      for(const [gs, mt] of [[ec, erM], [eg, erG]]){ const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const m = new THREE.Mesh(g, mt); m.frustumCulled = false; grp.add(m); }
      const n = mob ? 400 : 900, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), dl = new Float32Array(n);   // 飛び散る かたまり: 飛び出す 時の てっぺんの あたりから 上へ
      for(let i = 0; i < n; i++){ const t0 = 0.8 + rnd() * 4.5, x = Math.min(1, t0 / ER.dur), gg = x * x * (3 - 2 * x); dl[i] = t0;
        pos.set([(rnd() - 0.5) * ER.span * (0.4 + 2 * gg), ER.H * (1 + 7 * gg) * (0.75 + 0.3 * rnd()), (rnd() - 0.5) * 200], i * 3); vel.set([(rnd() - 0.5) * 500, 350 + rnd() * 700, (rnd() - 0.5) * 300], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aV', new THREE.BufferAttribute(vel, 3)); g.setAttribute('aD', new THREE.BufferAttribute(dl, 1)); const p = new THREE.Points(g, ejM); p.frustumCulled = false; grp.add(p); } }

  // 火の粉
  const BOX = 320, em = emberMat(BOX);
  { const n = mob ? 1200 : 2500, pos = new Float32Array(n * 3), r = new Float32Array(n); for(let i = 0; i < n; i++){ pos.set([rnd() * BOX, rnd() * BOX, rnd() * BOX], i * 3); r[i] = rnd(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(r, 1)); const p = new THREE.Points(g, em); p.frustumCulled = false; root.add(p); }

  const camL = new THREE.Vector3(); let t = 0, ci = 0, e0 = -1;
  return [(cam, dt) => { if(out.dead) return; t += dt; sm.uniforms.uTime.value = t; jm.uniforms.uTime.value = t; em.uniforms.uTime.value = t; am.uniforms.uTime.value = t; gm.uniforms.uTime.value = t; erM.uniforms.uTime.value = t; erG.uniforms.uTime.value = t;
    camL.copy(cam.position); root.worldToLocal(camL); sm.uniforms.uCam.value.copy(camL); em.uniforms.uCam.value.copy(camL);
    ci = path.near(camL, ci); if(e0 < 0 && path.S[ci] >= ER.s0) e0 = t; const te = e0 < 0 ? -1 : t - e0;   // 噴き上がりは おばけ (カメラ) が 道のり s0 を 過ぎた 時から
    erM.uniforms.uE.value = erG.uniforms.uE.value = te < 0 ? 0 : Math.min(1, te / ER.dur); ejM.uniforms.uT.value = te; }];
}
