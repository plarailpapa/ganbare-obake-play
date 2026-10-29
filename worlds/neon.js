// 光の 都市 (3 面 分かれ道 ② まん中、10/29 社長「摩天楼と ニューヨークや 東京の ような、遠くに スカイツリーや 東京タワーの ような ものが 見える 都市」「スパイダーマンの ように 地面から 空に 浮かび、ビルの 間を くぐり抜ける」「未来的な 建物は いくら あっても いい」「急な うねりや カーブは スマホの 画面で 見にくい」)
// 夜の 未来都市。コースは 大通りの 上 (道路の 4 m 上) から ゆっくり 空へ 上がり、ゆるく うねりながら 高層ビルの 間を 抜ける。ビルは 碁盤の 目の 街区に 並べ、コースに かかる ビルは 低く して よける (横は すれすれまで 立てる)。
// 座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)。コースは coursePath3 で なぞる (左右・上下に 曲がる)。ビルは root の 上向きに まっすぐ 立てる。窓は 絵を 使わず 計算で 描く (ビルを たくさん 置ける・スマホの 点々の 心配なし)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { coursePath3, exit3, RECONV3_SEC, SPREAD3_SEC } from '../stage3.js';

const GROUND = -4, BP = 90, ST = 26;   // 道路の 高さ (m、入口の レールの 4 m 下) / 街区の 間隔 (道路の まん中から 次の 道路の まん中まで) / 道路の 幅
const NEON = ['#ff3fb4', '#3fd8ff', '#9a5cff', '#4f6bff', '#c8f0ff', '#ff6ae0'].map(c => new THREE.Color(c));   // ネオンの 色 (桃・水色・紫・青・白・薄桃)。レールと 加速の 輪の 色 (緑・黄・赤) は 使わない = 輪が 街に 埋もれない (10/29 社長)
const LANE = [0x4cd964, 0xffd54a, 0xff5a5a].map(c => new THREE.Color(c));   // レールの 色 (index.html の RAIL_COLORS: 左 緑・まん中 黄・右 赤) = 出口の 看板の ふち
const GLSL_HASH = 'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }';
const ADD_FOG = '#ifdef USE_FOG\n  #ifdef FOG_EXP2\n  float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);\n  #else\n  float fogF = smoothstep(fogNear, fogFar, vFogDepth);\n  #endif\n  gl_FragColor.rgb *= 1.0 - fogF;\n#endif';   // 光を 足す (加算) 描き方の もや: 遠いほど 光を 弱めて 消す (ふつうの もやは もやの 色に 置き換えて 足して しまい、遠くに 紫の 板が 残る、Codex 指摘 10/29)
const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし (洞窟の Codex 指摘の 教訓)

function towerMat(cyl){   // ビル (箱 / 円柱)。窓の 格子・ついて いる 窓 (ビルごとに 割合と 色が ちがう)・未来的な 光の 線 (角・屋上の ふち・横の 帯)。遠くは 窓の 模様を 平均の 明るさに (ちらつき 防止)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCyl:{ value:cyl ? 1 : 0 } }]),
    vertexShader:`varying vec3 vL; varying vec3 vN; varying vec3 vS; varying vec3 vCol; varying float vId; varying float vD;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vS = sc; vL = position * sc; vN = normal; vCol = instanceColor; vId = float(gl_InstanceID);
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); vD = -mvPosition.z; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uCyl; varying vec3 vL; varying vec3 vN; varying vec3 vS; varying vec3 vCol; varying float vId; varying float vD;
      #include <fog_pars_fragment>
      ${clip.pf}
      ${GLSL_HASH}
      void main(){
        ${clip.f}
        float r1 = h1(vec2(vId, 1.7)), r2 = h1(vec2(vId, 5.3)), r3 = h1(vec2(vId, 9.1)), fut = step(0.42, r2);   // ビルごとの くせ (窓の 割合・色・光の 線が あるか)
        vec3 wall = vec3(0.022, 0.026, 0.05) * (0.7 + 0.6 * r3), c;
        if(abs(vN.y) > 0.5){   // 屋上: 暗く、未来的な ビルは ふちが 光る
          float rim = uCyl > 0.5 ? smoothstep(0.4, 0.5, length(vL.xz / vS.xz)) : max(smoothstep(vS.x * 0.5 - 1.5, vS.x * 0.5, abs(vL.x)), smoothstep(vS.z * 0.5 - 1.5, vS.z * 0.5, abs(vL.z)));
          c = wall * 0.6 + vCol * rim * fut * 1.6;
        } else {
          float u, hw;
          if(uCyl > 0.5){ u = atan(vL.z, vL.x) * vS.x * 0.5; hw = 1e6; } else if(abs(vN.x) > 0.5){ u = vL.z; hw = vS.z * 0.5; } else { u = vL.x; hw = vS.x * 0.5; }
          float y = vL.y, fh = 3.6 + r1 * 0.8, fw = 3.0 + r2 * 1.4;
          vec2 g = vec2(u / fw, y / fh), cell = floor(g), f = fract(g);
          float win = step(0.16, f.x) * step(f.x, 0.84) * step(0.2, f.y) * step(f.y, 0.8) * step(5.0, y);   // 窓 (いちばん 下の 階は 店の 光 = 下で)
          float on = 0.22 + 0.5 * r1, lit = step(h1(cell + vec2(vId * 3.1, dot(vN, vec3(1.0, 2.0, 3.0)))), on);
          vec3 wc = r3 < 0.15 ? vec3(1.0, 0.84, 0.62) : mix(vec3(0.78, 0.86, 1.0), vec3(0.5, 0.68, 1.0), step(0.55, r3)); wc = mix(wc, vCol, 0.4 * step(0.72, r2));   // 窓の 色 (ほとんど 白っぽい 青、少し あたたかい 色 / ネオンの 色)
          float fd = smoothstep(450.0, 1500.0, vD);
          c = wall + wc * mix(win * lit, on * 0.45, fd) * 1.15;
          c += vCol * (1.0 - smoothstep(0.0, 5.0, y)) * 0.9 * step(0.3, r3);   // 1 階の 店の 光
          float edge = uCyl > 0.5 ? 0.0 : smoothstep(hw - 0.8, hw, abs(u)), crown = smoothstep(vS.y - 3.0, vS.y - 0.6, y), band = step(0.7, r3) * step(abs(mod(y, fh * 8.0) - fh * 4.0), 0.35);
          c += vCol * (edge + crown + band) * fut * 1.7;   // 未来的な 光の 線
        }
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
}
function groundMat(){   // 道路と 地面: 街区は 暗く、道路は 少し 明るく、まん中の 線・流れる 車の 光 (白 = 向こうへ、赤 = こちらへ)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`varying vec2 vP; varying float vD;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vP = position.xz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vD = -mvPosition.z; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; varying vec2 vP; varying float vD;
      #include <fog_pars_fragment>
      ${clip.pf}
      float lane(float a, float b, float sp){ float m = step(abs(a - 5.0), 1.2) * step(fract((b - uTime * sp) / 37.0), 0.07), n = step(abs(a + 5.0), 1.2) * step(fract((b + uTime * sp) / 41.0), 0.07); return m + n * 10.0; }
      void main(){
        ${clip.f}
        float dx = mod(vP.x + ${BP / 2}.0, ${BP}.0) - ${BP / 2}.0, dz = mod(vP.y + ${BP / 2}.0, ${BP}.0) - ${BP / 2}.0;   // 道路の まん中からの ずれ
        float rx = step(abs(dx), ${ST / 2}.0), rz = step(abs(dz), ${ST / 2}.0), road = max(rx, rz), near = 1.0 - smoothstep(300.0, 1200.0, vD);
        vec3 c = mix(vec3(0.008, 0.008, 0.016), vec3(0.03, 0.03, 0.045), road);
        c += vec3(0.3, 0.85, 1.0) * 0.6 * step(abs(dx), 0.25) * rx * step(fract(vP.y / 12.0), 0.5) * near;   // 道路の まん中の 線 (水色)
        float a = lane(dx, vP.y, 26.0) * rx * (1.0 - rz), b = lane(dz, vP.x, 23.0) * rz * (1.0 - rx);   // 車の 光 (白 = 向こうへ、桃 = こちらへ。赤は 加速の 輪と まぎらわしい ので 使わない)
        c += (vec3(0.9, 0.95, 1.0) * mod(a + b, 10.0) + vec3(1.0, 0.3, 0.8) * floor((a + b) / 10.0)) * 1.3 * near;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
}
function signMat(){   // 宙に 浮かぶ 光る 看板 (ホログラム): 色の 流れ・横の 走査線・ふちの 光・ときどき ちらつく
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`varying vec2 vUv; varying vec3 vCol; varying float vId;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; vCol = instanceColor; vId = float(gl_InstanceID); vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime; varying vec2 vUv; varying vec3 vCol; varying float vId;
      #include <fog_pars_fragment>
      ${clip.pf}
      ${GLSL_HASH}
      void main(){
        ${clip.f}
        float r = h1(vec2(vId, 2.3)), t = uTime * (0.4 + r), e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        vec3 c2 = vec3(1.0) - vCol * 0.7, k = mix(vCol, c2, 0.5 + 0.5 * sin(vUv.y * 6.0 + vUv.x * 3.0 - t * 2.0));
        float scan = 0.75 + 0.25 * sin(vUv.y * 120.0 - t * 8.0), bars = step(0.5, fract(vUv.x * (3.0 + floor(r * 5.0)) + floor(t * 0.7) * 0.37)) * step(0.25, vUv.y) * step(vUv.y, 0.75);
        float flick = 0.85 + 0.15 * step(0.93, h1(vec2(floor(uTime * 12.0), vId)));
        vec3 c = (k * (0.35 + 0.35 * bars) * scan + vCol * 2.0 * (1.0 - smoothstep(0.0, 0.03, e))) * flick;
        gl_FragColor = vec4(c, 0.9);
        #include <colorspace_fragment>
        ${ADD_FOG}
      }` });
}
function carMat(){   // 空の 車の 光 (光の 点が 空中の 道を 流れる。位置は 時間で 計算 = 毎コマ 書き換え なし)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`attribute vec4 aRun; uniform float uTime; varying vec3 vCol;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vCol = color; float d = mod(uTime * aRun.w + aRun.y, aRun.x) - aRun.x * 0.5; vec3 dir = aRun.z > 0.5 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
        vec4 mvPosition = modelViewMatrix * vec4(position + dir * d, 1.0); gl_PointSize = clamp(2200.0 / -mvPosition.z, 1.5, 22.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying vec3 vCol;
      #include <fog_pars_fragment>
      ${clip.pf}
      void main(){
        ${clip.f}
        vec2 q = gl_PointCoord - 0.5; float a = exp(-dot(q, q) * 18.0);
        gl_FragColor = vec4(vCol * a * 1.6, a);
        #include <colorspace_fragment>
        ${ADD_FOG}
      }` });
}
function beams(segs, w){   // 骨組み: 線分の 並び [a, b, …] を 細い 角柱に して 1 つの 形に まとめる
  const gs = [], up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), q = new THREE.Quaternion(), m = new THREE.Matrix4(), s = new THREE.Vector3();
  for(let i = 0; i < segs.length; i += 2){ const a = segs[i], b = segs[i + 1], len = d.subVectors(b, a).length(); if(len < 0.01) continue; q.setFromUnitVectors(up, d.normalize());
    gs.push(new THREE.BoxGeometry(1, 1, 1).applyMatrix4(m.compose(s.addVectors(a, b).multiplyScalar(0.5), q, new THREE.Vector3(w, len, w)))); }
  const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); return g;
}
function skyTower(k){   // 光の 塔 (スカイツリー風、高さ 640 m × k): 下は 三角、上へ 行くほど 丸く 細く。上の 展望台 (450 m) と てっぺんの アンテナ。下の 展望台 (350 m) は 出口 (光る 看板の 輪) として build が 作る
  const S = [], P = (r, a, y) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), N = 12, rad = y => y < 350 ? 38 - 26 * Math.pow(y / 350, 0.8) : y < 495 ? 12 : 6;
  for(let y = 0; y < 495; y += 22){ const y2 = Math.min(495, y + 22);
    for(let i = 0; i < N; i++){ const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; S.push(P(rad(y), a, y), P(rad(y2), a, y2), P(rad(y), a, y), P(rad(y), b, y)); if(i % 2 === 0) S.push(P(rad(y), a, y), P(rad(y2), b, y2)); } }
  S.push(new THREE.Vector3(0, 495, 0), new THREE.Vector3(0, 640, 0));
  const g = new THREE.Group(), lat = new THREE.Mesh(beams(S, 2.2), new THREE.MeshBasicMaterial({ color:'#cfe9ff', fog:false })); g.add(lat);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(19, 17, 12, 24), new THREE.MeshBasicMaterial({ color:'#b98cff', fog:false })); deck.position.y = 450; g.add(deck);   // 上の 展望台 (紫の 光)
  g.scale.setScalar(k); return g;
}
function screenMat(c, w, h){   // 出口の 光る 看板 (ホログラム、w × h m): ふちは レールの 色で 強く、中は 流れる 走査線と 格子。まん中は 輪の 窓 (行き先の 世界が 見える) なので 抜く。もやで 消さない (遠くから 目印)
  return new THREE.ShaderMaterial({ clipping:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, uniforms:{ uTime:{ value:0 }, uC:{ value:c.clone() }, uS:{ value:new THREE.Vector2(w, h) } },
    vertexShader:`varying vec2 vUv;
      ${clip.pv}
      void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform float uTime; uniform vec3 uC; uniform vec2 uS; varying vec2 vUv;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec2 m = (vUv - 0.5) * uS; float e = min(uS.x * 0.5 - abs(m.x), uS.y * 0.5 - abs(m.y)), hole = smoothstep(6.0, 9.0, length(m));
        float scan = 0.55 + 0.45 * sin(m.y * 1.6 - uTime * 6.0), grid = step(0.88, fract(m.x * 0.22)) + step(0.88, fract(m.y * 0.22 + uTime * 0.3));
        vec3 c = uC * ((0.22 + 0.2 * grid) * scan * hole + (1.0 - smoothstep(0.0, 1.4, e)) * 2.4);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}
// 名所 (10/29 社長「シンガポールの ビルの 上に 船が のっかって いる もの・東京都庁・エンパイア・ステート・ビル・ビッグ・ベン などの 近代の でかい 建物を ステージに」)。本物 そっくりで なく 「それらしい」 形。
// 座標は 名所の 中心が 原点 (+Z = コースの 進む 向き・+X = 左)。win(x, y, z, w, h, d, ry) = 窓の ある ビルの 部品 (y = 地面からの 高さ)、g = 特別な 部品 (地面が y 0)
const glowM = (c, o = 1) => new THREE.MeshBasicMaterial({ color:c, transparent:o < 1, opacity:o, blending: o < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: o >= 1 });
function bigBen(win, g){   // ビッグ・ベン風: 金色に 照らされた 時計塔 (4 面の 光る 文字盤) と 後ろに のびる 議事堂
  const stone = new THREE.MeshBasicMaterial({ color:'#c9974f' }), dark = new THREE.MeshBasicMaterial({ color:'#6b4f2c' }), face = new THREE.MeshBasicMaterial({ color:'#fff2c8' }), hand = new THREE.MeshBasicMaterial({ color:'#2a1d10' });
  const B = (w, h, d, y, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(0, y, -45); g.add(o); return o; };
  B(16, 62, 16, 31, stone); B(19, 16, 19, 70, stone); B(15, 14, 15, 85, stone);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(11, 38, 4), dark); sp.rotation.y = Math.PI / 4; sp.position.set(0, 111, -45); g.add(sp);
  for(let i = 0; i < 4; i++){ const a = i * Math.PI / 2, f = new THREE.Group(); f.position.set(Math.sin(a) * 9.6, 70, -45 + Math.cos(a) * 9.6); f.rotation.y = a; g.add(f);   // 文字盤 (外向き)
    const disc = new THREE.Mesh(new THREE.CircleGeometry(6.2, 32), face); f.add(disc);
    for(const [len, ang] of [[4.5, 0.6], [3.2, -1.9]]){ const hm = new THREE.Mesh(new THREE.BoxGeometry(0.5, len, 0.2), hand); hm.position.set(Math.sin(ang) * len / 2, Math.cos(ang) * len / 2, 0.15); hm.rotation.z = -ang; f.add(hm); } }
  win(0, 0, 15, 30, 28, 110, 0);   // 議事堂 (窓の ある 長い 建物)
  for(let z = -36; z <= 66; z += 12){ const p = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 4), dark); p.position.set(14, 32, z); g.add(p); const p2 = p.clone(); p2.position.x = -14; g.add(p2); }   // 小さな 尖塔
}
function empireState(win, g){   // エンパイア・ステート・ビル風: 段々に 細く なる 塔 + 光る 王冠 + アンテナ
  for(const [w, d, y0, y1] of [[124, 58, 0, 24], [92, 52, 24, 86], [62, 46, 86, 300], [52, 40, 300, 318], [42, 32, 318, 334], [32, 26, 334, 352], [22, 20, 352, 368]]) win(0, y0, 0, w, y1 - y0, d, 0);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 16), glowM('#ff9ad8')); crown.position.y = 377; g.add(crown);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3.4, 70, 8), glowM('#d8dcff')); mast.position.y = 421; g.add(mast);
}
function tokyoGov(win, g){   // 東京都庁風: 横長の 本体の 上に 2 本の 塔、てっぺんは 2 つずつに 分かれて 45 度 回る
  win(0, 0, 0, 110, 160, 46, 0);
  for(const x0 of [-33, 33]){ win(x0, 160, 0, 44, 40, 44, 0); for(const s of [-1, 1]) win(x0 + s * 8, 200, s * 8, 24, 43, 24, Math.PI / 4);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(46, 1.2, 46), glowM('#c8f0ff', 0.8)); lamp.position.set(x0, 200, 0); g.add(lamp); }   // 塔が 分かれる 所の 光の 帯
}
function marinaBay(win, g){   // マリーナベイ・サンズ風: 3 本の 板の ような 塔の 上に 船 (光る 船体・青い プール)
  for(const z of [-80, 0, 80]) win(0, 0, z, 46, 195, 24, 0);
  const sh = new THREE.Shape(); sh.moveTo(-20, 175); sh.lineTo(20, 175); sh.lineTo(20, -150); sh.quadraticCurveTo(20, -192, 0, -200); sh.quadraticCurveTo(-20, -192, -20, -150); sh.lineTo(-20, 175);   // 船の 形 (y = −z: 船首が +z)
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:9, bevelEnabled:false, curveSegments:8 }).rotateX(-Math.PI / 2), [new THREE.MeshBasicMaterial({ color:'#162040' }), glowM('#7fe8ff')]); hull.position.y = 195; g.add(hull);   // 上下 = 暗い 紺・横 = 光る 水色
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(26, 230).rotateX(-Math.PI / 2), glowM('#3fa9ff', 0.6)); pool.position.set(0, 204.3, -20); g.add(pool);
}
function redTower(){   // 光の 塔 B (東京タワー風、高さ 400 m): 4 本の 脚が 上へ 細く まとまる 骨組み、橙と 白。展望台 2 つ
  const S = [], hw = y => 52 * Math.exp(-y / 120) + 4, C = (y, i) => new THREE.Vector3((i & 1 ? 1 : -1) * hw(y), y, (i & 2 ? 1 : -1) * hw(y)), ord = [0, 1, 3, 2];
  for(let y = 0; y < 330; y += 18){ const y2 = Math.min(330, y + 18);
    for(let k = 0; k < 4; k++){ const i = ord[k], j = ord[(k + 1) % 4]; S.push(C(y, i), C(y2, i), C(y, i), C(y, j), C(y, i), C(y2, j), C(y, j), C(y2, i)); } }
  S.push(new THREE.Vector3(0, 330, 0), new THREE.Vector3(0, 400, 0));
  const g = new THREE.Group(); g.add(new THREE.Mesh(beams(S, 2.4), new THREE.MeshBasicMaterial({ color:'#ff7a2a', fog:false })));
  for(const y of [150, 250]){ const w = hw(y) * 2 + 8, deck = new THREE.Mesh(new THREE.BoxGeometry(w, 10, w), new THREE.MeshBasicMaterial({ color:'#fff1d8', fog:false })); deck.position.y = y; g.add(deck); }
  return g;
}

export function build(scene, root, P, opts, out){
  const mob = !!opts.mobile, branch = opts.nextBranch !== false, path = coursePath3(P, branch), L = path.len, ex = exit3(P.def);
  let seed = 20261029; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  scene.fog = new THREE.Fog('#170b2c', 260, mob ? 2000 : 2600);
  const col = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

  // コースの 点 (20 m ごと) と まわりの 空き (横 cl m 以内に かかる ビルは コースの 高さ − 16 m まで 低く する)
  const pts = [], back = P.pi === 0 ? 0 : RECONV3_SEC * P.move + 150, endZ = L - SPREAD3_SEC * P.move - 150, endCl = ex.w + 14;   // 入口の 輪の 後 (3 本が 戻る 間) と 出口の 手前 (広がる 間) は 広く
  for(let s = -300; s <= L + 300; s += 20){ path.frame(s, v, q); pts.push({ x:v.x, y:v.y, z:v.z, cl: s < back ? 38 : s > endZ ? endCl : 15 }); }
  const CELL = 100, grid = new Map(), key = (i, j) => i * 100003 + j, pad = Math.max(38, endCl);
  for(const p of pts){ const k = key(Math.floor(p.x / CELL), Math.floor(p.z / CELL)); if(!grid.has(k)) grid.set(k, []); grid.get(k).push(p); }
  const topMax = (x0, z0, x1, z1) => { let t = Infinity;   // この 敷地に 建てて よい 高さ (root の y)
    for(let i = Math.floor((x0 - pad) / CELL); i <= Math.floor((x1 + pad) / CELL); i++) for(let j = Math.floor((z0 - pad) / CELL); j <= Math.floor((z1 + pad) / CELL); j++){ const a = grid.get(key(i, j)); if(!a) continue;
      for(const p of a){ const dx = Math.max(x0 - p.x, 0, p.x - x1), dz = Math.max(z0 - p.z, 0, p.z - z1); if(dx * dx + dz * dz < p.cl * p.cl) t = Math.min(t, p.y - 16); } }
    return t; };

  // 目印の 塔 (東京タワー風、コースの 左 遠く)・名所 4 つ (コースの すぐ 脇、ぶつからない ぎりぎりを 探す)・出口の スカイツリー風の 塔。まわりの ふつうの ビルは 建てない (marks)
  const box = [], cyl = [], spires = [], signs = [], marks = [], f = new THREE.Vector3(), scr = [];
  const fwd = s => { path.frame(s, v, q); f.set(0, 0, 1).applyQuaternion(q); f.y = 0; return f.normalize(); };   // 道のり s の 点 (v) と 水平な 進む 向き (f)。左 = (f.z, 0, −f.x)
  { fwd(L * 0.84); const lat = mob ? 950 : 1100, x = v.x + f.z * lat, z = v.z - f.x * lat, t = redTower(); t.position.set(x, GROUND, z); root.add(t); marks.push({ x, z, r:150 }); }
  const rectTop = (cx, cz, ry, hw, hd) => { let t = Infinity; const c = Math.cos(ry), sn = Math.sin(ry), r = Math.hypot(hw, hd) + pad;   // 向きの ある 長方形の 敷地 (半分の 幅 hw・奥行き hd) に 建てて よい 高さ
    for(let i = Math.floor((cx - r) / CELL); i <= Math.floor((cx + r) / CELL); i++) for(let j = Math.floor((cz - r) / CELL); j <= Math.floor((cz + r) / CELL); j++){ const a = grid.get(key(i, j)); if(!a) continue;
      for(const p of a){ const dx = p.x - cx, dz = p.z - cz, lx = dx * c - dz * sn, lz = dx * sn + dz * c, ex2 = Math.max(Math.abs(lx) - hw, 0), ez = Math.max(Math.abs(lz) - hd, 0); if(ex2 * ex2 + ez * ez < p.cl * p.cl) t = Math.min(t, p.y - 16); } }
    return t; };
  for(const [k, side, hw, hd, H, mk] of [[0.1, 1, 30, 75, 130, bigBen], [0.3, -1, 62, 29, 460, empireState], [0.52, 1, 25, 200, 210, marinaBay], [0.7, -1, 60, 24, 245, tokyoGov]]){   // [道のりの 割合, 左 1 / 右 −1, 敷地の 半分の 幅・奥行き, 高さ, 作り方]
    fwd(L * k); const ry = Math.atan2(f.x, f.z), lx = f.z * side, lz = -f.x * side;
    for(let d = hw + 20; d < hw + 900; d += 15){ const x = v.x + lx * d, z = v.z + lz * d; if(rectTop(x, z, ry, hw, hd) - GROUND < H) continue;   // コースから 近い 順に ためして 最初に 建てられる 所
      const g = new THREE.Group(), c = Math.cos(ry), sn = Math.sin(ry), nc = NEON[(rnd() * NEON.length) | 0]; g.position.set(x, GROUND, z); g.rotation.y = ry; root.add(g);
      mk((px, py, pz, w, h, dd, r) => box.push({ x:x + px * c + pz * sn, y:GROUND + py, z:z - px * sn + pz * c, w, h, d:dd, c:nc, ry:ry + r }), g);
      marks.push({ x, z, r:Math.hypot(hw, hd) + 30 }); break; } }
  if(branch){ path.frame(L, v, q); const E = v.clone(), QE = q.clone(); fwd(L); const ry = Math.atan2(f.x, f.z), yr = E.y + 2.2;   // 出口: まん中の 輪の 中心 (2.2 = index.html の RING3_UP)
    const T = new THREE.Vector3(E.x + f.x * 46, GROUND, E.z + f.z * 46), tw = skyTower((yr - GROUND) / 350); tw.position.copy(T); root.add(tw); marks.push({ x:T.x, z:T.z, r:130 });   // 塔の 下の 展望台 (350 m) が 輪の 高さに なる 大きさ
    const grp = new THREE.Group(), sg = new THREE.Group(); grp.position.set(E.x, yr, E.z); grp.rotation.y = ry; sg.quaternion.copy(QE); sg.position.set(0, 2.2, 0).applyQuaternion(QE).add(E); root.add(grp, sg);   /* grp = 展望台 (まっすぐ 立てる)・sg = 看板と 枠 (輪と 同じ コースの 終わりの 向き。水平だけ だと 上下の 傾きが 残る 時に 輪と ずれる、Codex 指摘 10/29) */   // 出口の 座標: 原点 = まん中の 輪、+Z = 進む 向き、+X = 左
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(40, 36, 26, 48), new THREE.MeshBasicMaterial({ color:'#2a2350' })); drum.position.set(0, 0, 46); grp.add(drum);   // 展望台
    for(const y of [-9, 9]){ const band = new THREE.Mesh(new THREE.TorusGeometry(40.5, 1.0, 8, 64).rotateX(Math.PI / 2), glowM('#b98cff')); band.position.set(0, y, 46); grp.add(band); }   // 展望台の 光の 帯
    const SW = 32, SH = 24;   // 看板の 大きさ (m)
    for(let k = 0; k < 3; k++){ if(opts.nextChoices && !opts.nextChoices[k]) continue; const m = screenMat(LANE[k], SW, SH), s = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), m);   /* 行き先の 無い レーンは 看板なし */ s.position.set((1 - k) * ex.w, -(k - 1) * ex.h, 1.5); sg.add(s); scr.push(m); }   // レーン 0 (左 = +X) = 緑・1 = 黄・2 (右) = 赤。輪の すぐ 向こう
    for(const y of [-SH / 2 - 2, SH / 2 + 2]){ const bar = new THREE.Mesh(new THREE.BoxGeometry(2 * ex.w + SW + 6, 2.2, 3), new THREE.MeshBasicMaterial({ color:'#3a3060' })); bar.position.set(0, y, 3); sg.add(bar);   // 看板を 展望台に つなぐ 枠
      const gl = new THREE.Mesh(new THREE.BoxGeometry(2 * ex.w + SW + 6, 0.5, 0.5), glowM('#c8f0ff')); gl.position.set(0, y, 1.3); sg.add(gl); } }
  else { fwd(L * 0.42); const x = v.x + f.z * 1300, z = v.z - f.x * 1300, tw = skyTower(1); tw.position.set(x, GROUND, z); root.add(tw); marks.push({ x, z, r:150 }); }   // 次が 分かれ道で ない 時は 遠くの 目印

  // 街区 (コースから R m 以内) → 敷地を 1〜4 つに 分けて ビル
  const R = mob ? 1000 : 1500, blocks = new Map(), rr = Math.ceil(R / BP);
  for(let k = 0; k < pts.length; k += 5){ const p = pts[k], bi = Math.floor(p.x / BP), bj = Math.floor(p.z / BP);
    for(let i = bi - rr; i <= bi + rr; i++) for(let j = bj - rr; j <= bj + rr; j++){ const d = Math.hypot((i + 0.5) * BP - p.x, (j + 0.5) * BP - p.z); if(d > R) continue; const kk = key(i, j), o = blocks.get(kk); if(!o) blocks.set(kk, { i, j, d }); else if(d < o.d) o.d = d; } }
  /* box・cyl・spires・signs は 上 (名所の 部品も box へ) */
  const add = (list, x, y, z, w, h, d, c) => list.push({ x, y, z, w, h, d, c });
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for(const b of blocks.values()){ const x0 = b.i * BP + ST / 2, z0 = b.j * BP + ST / 2, S = BP - ST; bx0 = Math.min(bx0, x0); bx1 = Math.max(bx1, x0 + S); bz0 = Math.min(bz0, z0); bz1 = Math.max(bz1, z0 + S);
    if(marks.some(o => Math.hypot(o.x - (x0 + S / 2), o.z - (z0 + S / 2)) < o.r)) continue;
    const n = rnd() < 0.4 ? 1 : 2, m = rnd() < 0.5 ? 1 : 2, nearK = 1 - Math.min(1, b.d / R);
    for(let a = 0; a < n; a++) for(let c = 0; c < m; c++){ const lw = S / n, ld = S / m, fw = lw * (0.62 + rnd() * 0.3), fd = ld * (0.62 + rnd() * 0.3), cx = x0 + lw * (a + 0.5), cz = z0 + ld * (c + 0.5), tall = rnd();
      let h = 22 + Math.pow(tall, 2.2) * (110 + 380 * nearK) + (tall > 0.985 ? 260 : 0);   // コースの 近くほど 高い (谷間)、ときどき 超高層
      const tm = topMax(cx - fw / 2, cz - fd / 2, cx + fw / 2, cz + fd / 2) - GROUND; if(h > tm) h = tm; if(h < 10) continue;
      const nc = NEON[(rnd() * NEON.length) | 0], kind = rnd();
      if(kind < 0.13){ const r = Math.min(fw, fd); add(cyl, cx, GROUND, cz, r, h, r, nc); }   // 円柱の ビル
      else if(h > 160 && kind < 0.5){ const k2 = 0.55 + rnd() * 0.15; add(box, cx, GROUND, cz, fw, h * k2, fd, nc); add(box, cx, GROUND + h * k2, cz, fw * 0.66, h * (1 - k2), fd * 0.66, nc); }   // 上が 細く なる 段の ある ビル
      else add(box, cx, GROUND, cz, fw, h, fd, nc);
      if(h > 200 && rnd() < 0.5){ const sh = 20 + rnd() * 40; if(GROUND + h + sh < tm + GROUND) spires.push({ x:cx, y:GROUND + h, z:cz, h:sh }); }   // てっぺんの アンテナ
      if(b.d < 420 && h > 50 && signs.length < (mob ? 40 : 80) && rnd() < 0.35){ const pp = pts[nearest(cx, cz)], dx = pp.x - cx, dz = pp.z - cz, fx = Math.abs(dx) * fd > Math.abs(dz) * fw;   // コースに 向いた 面に 光る 看板
        const fwid = fx ? fd : fw, sw = Math.min(fwid * 0.8, 44), sh = sw * (0.45 + rnd() * 1.1), sy = GROUND + 12 + rnd() * Math.max(1, h - sh - 20);
        signs.push({ x: fx ? cx + Math.sign(dx) * (fw / 2 + 0.6) : cx, y: sy + sh / 2, z: fx ? cz : cz + Math.sign(dz) * (fd / 2 + 0.6), w:sw, h:sh, ry: fx ? Math.PI / 2 : 0, c:NEON[(rnd() * NEON.length) | 0] }); } } }
  function nearest(x, z){ let bi = 0, bd = Infinity; for(let i = 0; i < pts.length; i += 3){ const d = (pts[i].x - x) ** 2 + (pts[i].z - z) ** 2; if(d < bd){ bd = d; bi = i; } } return bi; }

  const inst = (geo, mat, list) => { if(!list.length) return null; const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((o, i) => { mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromAxisAngle(up, o.ry || 0), s3.set(o.w, o.h, o.d))); mesh.setColorAt(i, o.c); });   /* ry = 名所の 部品の 向き */
    mesh.instanceMatrix.needsUpdate = true; if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; root.add(mesh); return mesh; };
  inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), towerMat(false), box);
  inst(new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1).translate(0, 0.5, 0), towerMat(true), cyl);
  { const g = new THREE.CylinderGeometry(0.4, 1.4, 1, 6).translate(0, 0.5, 0), mesh = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color:'#3a3550' }), Math.max(1, spires.length));   // アンテナ + 赤い 灯
    spires.forEach((o, i) => mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.identity(), s3.set(1, o.h, 1)))); mesh.count = spires.length; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; root.add(mesh); }
  const blink = new THREE.PointsMaterial({ color:'#ff4d8d', size:4, transparent:true, opacity:1, blending:THREE.AdditiveBlending, depthWrite:false });
  { const pos = new Float32Array(Math.max(1, spires.length) * 3); spires.forEach((o, i) => pos.set([o.x, o.y + o.h + 1, o.z], i * 3)); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setDrawRange(0, spires.length); const p = new THREE.Points(g, blink); p.frustumCulled = false; root.add(p); }
  const sign = signMat();
  { const mesh = inst(new THREE.PlaneGeometry(1, 1), sign, signs.map(o => ({ ...o, y:o.y, d:1 })));   // 看板 (面の 向きは 下で)
    if(mesh) signs.forEach((o, i) => mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromAxisAngle(up, o.ry), s3.set(o.w, o.h, 1)))); }

  // 地面 (街の 広さ + まわり)
  const gm = groundMat();
  { const w = bx1 - bx0 + 3000, d = bz1 - bz0 + 3000, g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate((bx0 + bx1) / 2, GROUND, (bz0 + bz1) / 2), mesh = new THREE.Mesh(g, gm); mesh.frustumCulled = false; root.add(mesh); }

  // 空の 車 (道路の 上空を 行き来する 光の 点)
  const cm = carMat();
  { const n = mob ? 500 : 1000, pos = new Float32Array(n * 3), run = new Float32Array(n * 4), c = new Float32Array(n * 3), keys = [...blocks.values()].filter(b => b.d < 900);
    for(let i = 0; i < n; i++){ const b = keys[(rnd() * keys.length) | 0], alongX = rnd() < 0.5, y = GROUND + 45 + rnd() * 260, sgn = rnd() < 0.5 ? 1 : -1;
      pos.set([alongX ? (b.i + 0.5) * BP : b.i * BP + sgn * 5, y, alongX ? b.j * BP + sgn * 5 : (b.j + 0.5) * BP], i * 3);
      run.set([1600, rnd() * 1600, alongX ? 1 : 0, sgn * (50 + rnd() * 40)], i * 4); col.set(sgn > 0 ? '#eaf6ff' : '#ff4fd0'); if(rnd() < 0.25) col.copy(NEON[(rnd() * NEON.length) | 0]); c.set([col.r, col.g, col.b], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aRun', new THREE.BufferAttribute(run, 4)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const p = new THREE.Points(g, cm); p.frustumCulled = false; root.add(p); }

  let t = 0;
  return [(cam, dt) => { if(out.dead) return; t += dt;
    gm.uniforms.uTime.value = t; sign.uniforms.uTime.value = t; cm.uniforms.uTime.value = t; for(const m of scr) m.uniforms.uTime.value = t;
    blink.opacity = 0.25 + 0.75 * (Math.sin(t * 3.0) > 0.3 ? 1 : 0); }];   // アンテナの 赤い 灯が 点滅
}
