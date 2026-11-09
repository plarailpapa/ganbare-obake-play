// 九龍城 (3 面 分かれ道 ② 左、11/3 社長「本物の 九龍城と いうより、九龍城の ように 入り組んだ 超建築」「入った 時に 上に 見切れない ほど 建物が 重なって いる (ビルでは ない)、進むと 建物が 途切れた 所から 空が 開けて、空中の 高い 所を 走って いると 分かる」「青空・巨大な 入道雲」。絵 = assets-warehouse/art-2026-11-03/kowloon-concept-*.png)
// 1 回目: 谷間 (0〜13 秒)。色とりどりの トタンと 板の 家 (1 軒 30〜55 m = おばけが 小人に 見える 大きさ) を コースの 左右に 何十層も 積み、上ほど 谷へ せり出して 空は 細い 隙間に。渡り廊下・洗濯物・水タンク・配管・日よけ・支え柱。谷底は 暗い 路地の 灯り・深い 所は 暗く かすむ (空の 上と 分からない)。2 回目: 抜けると 青空 (はるか 下に 雲の 海・正面に 巨大な 入道雲・遠くに 超建築の 塔)、レールは 鉄骨の 橋の 上。3 回目: 出口 = 正面の 太い 塔の 壁に 3 つの 門 (トンネル・看板・提灯、社長「イ」)
// 座標: 輪の 入口が 原点、+Z = 進む 向き、+Y = 上、+X = 左 (root)。家の 向き = コースの 水平な 向き (箱の x = 谷を 横切る 向き・z = コースに 沿う 向き)
import * as THREE from 'three';
import { LANE_HEX, LANE_CSS } from '../colors.js';
import { coursePath3, exit3, RECONV3_SEC, FORK3_W, SPREAD3_SEC, LANE_W3 } from '../stage3.js';
import { puffTex, puffMat } from './temple.js';   // 雲 (神殿と 同じ 作り方: カメラを 向く もくもくの 板)

const clip = { pv:'#include <clipping_planes_pars_vertex>', v:'#include <clipping_planes_vertex>', pf:'#include <clipping_planes_pars_fragment>', f:'#include <clipping_planes_fragment>' };   // 輪の 窓の 中に 描く 時の 切り落とし
const GLSL_HASH = 'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }';
const SUN = new THREE.Vector3(0.25, 0.9, 0.35).normalize();   // 日の 向き (root、高く 少し 前 = 谷の 隙間から 見える。左の 壁の 内側は 日陰・右は 日なた)
const CANYON_END = 3900;   // 谷間の 終わり (道のり m、13 秒 = 建物が 途切れて 空が 開ける)
const SEA_DROP = 2000;   // 雲の 海の 高さ = 抜けた 所の コースの 2 km 下
const TOWERS = [[1800, -760, 1700, 420], [3800, 1150, 2300, 460], [6000, -3200, 1500, 380], [7800, -400, 2000, 430], [3200, 3800, 1300, 360]];   // 遠くの 超建築の 塔 [抜けた 所から 前へ m, 左へ m, てっぺんの 高さ (コースから m), 根もとの 半径] (スマホは 前の 4 本)。11/3 社長「見ごたえ あります、もっと 太くても」→ 半径 約 1.8 倍・細り方 控えめ。「もっと 塔の 近くを 通過したい」→ 1 本目は 右カーブで 向かって 左カーブで 壁面から 約 80 m を かすめる (19.5 秒)
const DEEP_FOG = y => `#ifdef USE_FOG
        gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(vec3(0.36, 0.45, 0.58), fogColor, smoothstep(-600.0, 50.0, ${y})), smoothstep(fogNear, fogFar, vFogDepth));
        #endif`;   // もや: 上は 明るい 水色、谷の 深い 所は 昼の 日陰の 青灰色 (11/3 社長「下が 透明だと 空の 上って バレちゃう」→ 黒っぽい 影の 色は「雰囲気が 暗く なった」で 明るく)
const PAL = { wall:['#5b8db8', '#4fa3a0', '#c4574a', '#a8613a', '#e8dcc0', '#8fb88a', '#8a78b8', '#d8d4cc', '#d9a74a', '#d88a9a', '#6f9fd0', '#b8c4cc'], roof:['#b0503a', '#3f8f8a', '#8a8e94', '#4a74a8', '#9a6a3a'],
  awn:['#d84a3a', '#f0c040', '#4aa860', '#3f7fd0'], tank:['#3f6fa8', '#b8483a', '#4f9a7a', '#8a9098', '#c8a060'], cloth:['#ff8fb0', '#ffd54a', '#f4f4f0', '#5aa0ff', '#ff5a5a', '#8fe0a0', '#c89aff'] };   // 絵の 色 (色あせた トタン・板の 壁 / 屋根 / 日よけ / 水タンク / 洗濯物)

const TEX_LUM = '0.439, 0.151, 0.197';   // 質感の 写真の 平均の 明るさ (トタン・板・漆喰。家の 色で 塗り直す 時に 割る、Blender で 測った)
// 質感の 写真の 使い方 (kMat の TEX): 壁は 家ごとに トタン 45%・板張り 30%・漆喰 25%、屋根は トタン。色 = 写真の 地の 色 (板は 灰色寄りの 木の 地肌) と 家の 色 × 写真の 明るさ を 半分ずつ、さらに 3 割 色あせ (11/3 社長「カラフル 過ぎる、もうちょい 風情が 欲しい」)、凹凸の 写真で 面の 向きを 変えて 日の 当たり方に 波や 継ぎ目を 出す (vT・vB = 面に 沿う 向き = 写真の 横・縦)。1 枚の 写真 = トタン 40 m・板 28 m・漆喰 55 m 四方 (社長「質感は もう 少し 大きく」で 約 2.5 倍) (おばけの 大きさに 合わせた 家の 大きさ)。トタンは ときどき 錆の 筋
function kMat(kind, tx){   // 家の 部品 (箱・円柱、色は instanceColor): 0 壁 (質感の 写真 = トタン・板張り・漆喰 を 家の 色で 塗り、凹凸で 日の 当たり方が 変わる、トタンは ときどき 錆の 筋、窓 (半分は 明かり)) / 1 屋根 (錆びた トタン) / 2 日よけ (白との 縞) / 3 水タンク・配管・支え柱 (横の 帯) / 4 骨組み。日なた・日陰と、谷の 深い 所ほど 暗い
  const u0 = { uSun:{ value:SUN } }; if(tx) Object.assign(u0, { uTd0:{ value:tx.d0 }, uTd1:{ value:tx.d1 }, uTd2:{ value:tx.d2 }, uTn0:{ value:tx.n0 }, uTn1:{ value:tx.n1 }, uTn2:{ value:tx.n2 } });   // 写真 (Poly Haven、CC0: corrugated_iron・green_rough_planks・concrete_layers_02。11/3 社長「リアル向きの 表現に」)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, side: kind === 4 ? THREE.DoubleSide : THREE.FrontSide, defines:{ KIND:kind, TEX:tx ? 1 : 0 }, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u0]),
    vertexShader:`attribute float aY0; varying vec3 vL; varying vec3 vN; varying vec3 vNW; varying vec3 vS; varying vec3 vW; varying vec3 vCol; varying float vId; varying float vR; varying vec3 vT; varying vec3 vB;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vS = sc; vL = position * sc; vR = aY0 + vL.y; vN = normal; vNW = mat3(instanceMatrix) * (normal / (sc * sc)); vCol = instanceColor; vId = float(gl_InstanceID);
        vT = normalize(mat3(instanceMatrix) * (abs(normal.x) > 0.5 || abs(normal.y) > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0))); vB = normalize(mat3(instanceMatrix) * (abs(normal.y) > 0.5 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
        vec4 w = instanceMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * modelMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform vec3 uSun; varying vec3 vL; varying vec3 vN; varying vec3 vNW; varying vec3 vS; varying vec3 vW; varying vec3 vCol; varying float vId; varying float vR; varying vec3 vT; varying vec3 vB;
      #if TEX == 1
      uniform sampler2D uTd0; uniform sampler2D uTd1; uniform sampler2D uTd2; uniform sampler2D uTn0; uniform sampler2D uTn1; uniform sampler2D uTn2;
      #endif
      #include <fog_pars_fragment>
      ${clip.pf}
      ${GLSL_HASH}
      void main(){
        ${clip.f}
        vec3 nW = normalize(vNW), c = vCol, glow = vec3(0.0);
        float ao = mix(0.5, 1.0, smoothstep(-650.0, 400.0, vR)), r2 = h1(vec2(vId, 5.3)), r3 = h1(vec2(vId, 9.1));
        #if TEX == 1
        {
          bool sx = abs(vN.x) > 0.5; vec2 p2 = abs(vN.y) > 0.5 ? vL.zx : vec2(sx ? vL.z : vL.x, vL.y);
          vec3 w = KIND == 1 ? vec3(1.0, 0.0, 0.0) : vec3(step(r2, 0.45), step(0.45, r2) * step(r2, 0.75), step(0.75, r2)), lm = vec3(${TEX_LUM});
          vec2 o = vec2(r3 * 7.0, r2 * 5.0); vec2 q0 = p2 / 40.0 + o, q1 = p2 / 28.0 + o, q2 = p2 / 55.0 + o;
          vec3 td = texture2D(uTd0, q0).rgb * w.x + texture2D(uTd1, q1).rgb * w.y + texture2D(uTd2, q2).rgb * w.z;
          vec3 tn = (texture2D(uTn0, q0).rgb * w.x + texture2D(uTn1, q1).rgb * w.y + texture2D(uTn2, q2).rgb * w.z) * 2.0 - 1.0;
          float lum = dot(td, vec3(0.2126, 0.7152, 0.0722)) / dot(lm, w);
          vec3 nat = td / dot(lm, w) * 0.42; nat = mix(nat, vec3(dot(nat, vec3(0.2126, 0.7152, 0.0722))) * vec3(1.08, 1.0, 0.86), 0.65 * w.y);
          c = mix(nat, vCol * clamp(lum, 0.15, 1.9), 0.5); c = mix(c, vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))) * vec3(1.06, 1.0, 0.9), 0.3);
          float rust = w.x * step(KIND == 1 ? 0.3 : 0.55, r3) * smoothstep(0.5, 1.0, h1(vec2(floor(p2.x / 4.0), vId))) * smoothstep(0.0, 1.0, h1(vec2(floor(p2.y / 20.0), floor(p2.x / 4.0) + vId)));
          c = mix(c, vec3(0.3, 0.11, 0.04) * (0.6 + 0.8 * lum), rust * 0.75);
          nW = normalize(vT * tn.x + vB * tn.y + nW * tn.z);
        }
        #endif
        float dif = 0.55 + 0.45 * max(dot(nW, uSun), 0.0);
        #if KIND == 0
        if(abs(vN.y) > 0.5) c *= 0.5;
        else {
          bool sx = abs(vN.x) > 0.5; float u = sx ? vL.z : vL.x, hw = sx ? vS.z * 0.5 : vS.x * 0.5, y = vL.y;
          #if TEX == 0
          c *= r2 < 0.5 ? 0.86 + 0.14 * sin(u * 2.4) : 0.9 + 0.1 * step(0.1, fract(y / 3.2));
          #endif
          c *= 0.82 + 0.18 * h1(vec2(vId, 0.37));
          float n = max(1.0, floor(2.0 * hw / 13.0)), m = max(1.0, floor(vS.y / 15.0));
          vec2 g = vec2((u + hw - (2.0 * hw - n * 13.0) * 0.5) / 13.0, (y - (vS.y - m * 15.0) * 0.5) / 15.0), cl = floor(g), f = fract(g);
          float ok = step(0.0, cl.x) * step(cl.x, n - 1.0) * step(0.0, cl.y) * step(cl.y, m - 1.0) * step(0.3, h1(cl + vec2(vId * 3.1, vN.x + 2.0 * vN.z)));
          float fr = ok * step(0.24, f.x) * step(f.x, 0.76) * step(0.24, f.y) * step(f.y, 0.82), wn = ok * step(0.29, f.x) * step(f.x, 0.71) * step(0.3, f.y) * step(f.y, 0.76), lit = step(h1(cl * 1.7 + vec2(vId, 4.0)), 0.5);
          c = mix(c, vec3(0.92, 0.9, 0.84), fr); c = mix(c, vec3(0.1, 0.15, 0.22), wn * (1.0 - lit)); c *= 1.0 - wn * lit;
          glow = vec3(1.0, 0.76, 0.4) * 1.1 * wn * lit;
        }
        #elif KIND == 1
        #if TEX == 0
        c *= (0.8 + 0.2 * sin(vL.x * 2.6)) * (0.85 + 0.15 * h1(floor(vL.xz / 5.0) + vId));
        #endif
        if(abs(vN.y) < 0.5) c *= 0.7;
        #elif KIND == 2
        c = mix(c, vec3(0.96, 0.95, 0.9), step(0.5, fract(vL.z / 4.0))); c = mix(c, vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), 0.35);
        #elif KIND == 4
        if(abs(vN.y) > 0.5) discard;
        float u = abs(vN.x) > 0.5 ? vL.z : vL.x, hw = (abs(vN.x) > 0.5 ? vS.z : vS.x) * 0.5, p = 2.0 * hw, bw = 0.9 / p;
        float d1 = abs(fract((vL.y + u + hw) / p) - 0.5), d2 = abs(fract((vL.y - u + hw) / p) - 0.5);
        if(step(hw - 0.9, abs(u)) + step(fract(vL.y / p), bw) + step(0.5 - 0.7 * bw, max(d1, d2)) < 0.5) discard;
        #else
        c *= (1.0 - 0.3 * step(0.9, fract(vL.y / 3.5))) * (0.85 + 0.15 * h1(vec2(floor(vL.y / 6.0), vId)));
        #endif
        gl_FragColor = vec4(c * dif * ao + glow, 1.0);
        #include <colorspace_fragment>
        ${DEEP_FOG("vR")}
      }` });
}

function clothMat(){   // 洗濯物 (板、上の 辺が ロープ。色は instanceColor、3 割は 白との 縞。風で 下ほど 揺れる)
  return new THREE.ShaderMaterial({ fog:true, clipping:true, side:THREE.DoubleSide, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime:{ value:0 } }]),
    vertexShader:`uniform float uTime; varying vec2 vUv; varying vec3 vCol; varying float vId; varying float vY; attribute float aY0;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vUv = uv; vCol = instanceColor; vId = float(gl_InstanceID); vec3 p = position; p.z += sin(uTime * 2.2 + vId * 1.7) * 1.6 * -p.y;
        vec4 w = instanceMatrix * vec4(p, 1.0); vY = aY0 + p.y * length(instanceMatrix[1].xyz); vec4 mvPosition = viewMatrix * modelMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying vec2 vUv; varying vec3 vCol; varying float vId; varying float vY;
      #include <fog_pars_fragment>
      ${clip.pf}
      ${GLSL_HASH}
      void main(){
        ${clip.f}
        vec3 c = h1(vec2(vId, 2.0)) < 0.3 ? mix(vCol, vec3(0.95), step(0.5, fract(vUv.y * 4.0))) : vCol; c = mix(c, vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), 0.25);
        gl_FragColor = vec4(c * (0.75 + 0.25 * vUv.y) * mix(0.5, 1.0, smoothstep(-650.0, 400.0, vY)), 1.0);
        #include <colorspace_fragment>
        ${DEEP_FOG("vY")}
      }` });
}

function floorMat(ylo){   // 谷底 (いちばん 下の 家の 高さ): 暗い 路地に ぽつぽつ 灯る 明かり = 底の 見えない 深い 街に 見せる
  return new THREE.ShaderMaterial({ fog:true, clipping:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
    vertexShader:`varying vec3 vW;
      #include <fog_pars_vertex>
      ${clip.pv}
      void main(){ vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
        #include <fog_vertex>
      }`,
    fragmentShader:`varying vec3 vW;
      #include <fog_pars_fragment>
      ${clip.pf}
      ${GLSL_HASH}
      void main(){
        ${clip.f}
        vec2 p = vW.xz / 14.0, cl = floor(p); float lamp = step(0.93, h1(cl)) * (1.0 - smoothstep(0.08, 0.3, length(fract(p) - 0.5)));
        vec3 c = vec3(0.06, 0.07, 0.09) * (0.7 + 0.6 * h1(floor(vW.xz / 40.0))) + vec3(1.0, 0.7, 0.35) * lamp * (0.6 + 0.6 * h1(cl + 7.0));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        ${DEEP_FOG(ylo.toFixed(1))}
      }` });
}

function skyMat(){   // 空 (カメラを 包む 球): 真上は 濃い 青 → 地平線は 白っぽい 水色、日の 光
  return new THREE.ShaderMaterial({ clipping:true, side:THREE.BackSide, depthWrite:false, uniforms:{ uSun:{ value:SUN } },
    vertexShader:`varying vec3 vD;
      ${clip.pv}
      void main(){ vD = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${clip.v}
      }`,
    fragmentShader:`uniform vec3 uSun; varying vec3 vD;
      ${clip.pf}
      void main(){
        ${clip.f}
        vec3 d = normalize(vD); float y = d.y, s = max(dot(d, uSun), 0.0);
        vec3 c = y > 0.0 ? mix(vec3(0.55, 0.75, 0.95), vec3(0.03, 0.2, 0.75), pow(y, 0.55)) : mix(vec3(0.55, 0.75, 0.95), vec3(0.45, 0.65, 0.88), pow(-y, 0.5));
        c += vec3(1.0, 0.97, 0.88) * (pow(s, 600.0) * 4.0 + pow(s, 14.0) * 0.35);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}

export function* build(scene, root, P, opts, out){
  const mob = !!opts.mobile, branch = opts.nextBranch !== false, path = coursePath3(P, branch);
  let seed = 20261103; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[(rnd() * a.length) | 0];
  scene.fog = new THREE.Fog('#b4d6f4', 350, mob ? 2400 : 3200);
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), f = new THREE.Vector3(), m4 = new THREE.Matrix4(), s3 = new THREE.Vector3(), col = new THREE.Color(), e = new THREE.Euler();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let cy0 = 0; const at = s => { path.frame(s, v, q); cy0 = v.y; f.set(0, 0, 1).applyQuaternion(q); f.y = 0; f.normalize(); return Math.atan2(f.x, f.z); };   // 道のり s の 点 (v)・水平な 進む 向き (f)。戻り値 = 向きの 角度。左 = (f.z, 0, −f.x)
  const hw = (s, y) => Math.max(s < 650 ? 70 : 0, 85 + 20 * Math.sin(s / 430) + 10 * Math.sin(s / 170 + 1)) - 30 * sm(150, 1200, y) - 15 * sm(-150, -700, y);   // 谷の 半分の 幅 (コースから 家の 面まで、y = コースからの 高さ)。コースの 高さで 55〜115 m、入口 (3 本の レールが 戻る 間) は 70 m 以上、上ほど・下ほど せまく (空は 細い 隙間)
  const L = { house:[], roof:[], awn:[], tank:[], pipe:[], post:[], line:[], cloth:[], truss:[] }, put = (list, x, y, z, yaw, sx, sy, sz, c, rz = 0) => list.push({ x, y, z, yaw, sx, sy, sz, c, rz, r:y - cy0 });   // r = コースからの 高さ (かすみ・深い 所の 暗さ。コースが 上っても 同じ 見え方)

  yield;
  // 家の 壁: コースの 左右に 列を 並べ、列ごとに 下から 上へ 家を 積む。家の 面 (d) は 谷の 幅 + 引っ込み (ときどき 大きく 引っ込んで 段に なる → 屋根・水タンクが 見える、上の 家が せり出す 所は 支え柱)
  const YLO = mob ? -450 : -700, YHI = mob ? 1000 : 1500;
  for(const sg of [1, -1]) for(let s = -250; s < CANYON_END; ){ const w = 30 + rnd() * 25, sc = s + w / 2, yaw = at(sc), lx = f.z * sg, lz = -f.x * sg, fx = f.x, fz = f.z, cx = v.x, cy = v.y, cz = v.z, colm = [];
    for(let y = YLO - rnd() * 25; y < YHI; ){ const h = 22 + rnd() * 16; colm.push({ y, h, d:hw(sc, y + h / 2) + (rnd() < 0.2 ? 14 + rnd() * 22 : rnd() * 12), D:30 + rnd() * 20 }); y += h; }
    const P3 = (lat, y, along = 0) => [cx + lx * lat + fx * along, cy + y, cz + lz * lat + fz * along];
    colm.forEach((o, i) => { const nx = colm[i + 1], near = Math.abs(o.y) < 600;
      put(L.house, ...P3(o.d + o.D / 2, o.y), yaw, o.D, o.h, w + 2, pick(PAL.wall));
      const ledge = nx ? nx.d - o.d : o.D;   // 上の 家が 引っ込んで できた 段 (屋上)
      if(ledge > 8){ put(L.roof, ...P3(o.d + ledge / 2 - 1, o.y + o.h + 0.6), yaw, ledge + 4, 2.2, w + 5, pick(PAL.roof), sg * 0.14);
        if(ledge > 18 && rnd() < 0.35){ const r = 6 + rnd() * 3; put(L.tank, ...P3(o.d + ledge / 2, o.y + o.h + 1.5, (rnd() - 0.5) * w * 0.5), 0, r, 11 + rnd() * 5, r, pick(PAL.tank)); } }
      if(nx && o.d - nx.d > 6 && near) for(const a of [-1, 1]) put(L.post, ...P3(nx.d + 2.5, nx.y - 14, a * (w / 2 - 3)), yaw, 1.8, 14, 1.8, '#6a4a30');   // せり出した 上の 家の 支え柱
      if(near && rnd() < 0.13) put(L.awn, ...P3(o.d - 3.5, o.y + o.h * 0.42), yaw, 9, 0.8, w * (0.4 + rnd() * 0.3), pick(PAL.awn), sg * 0.35); });   // 日よけ (谷へ 下がる)
    s += w; }

  yield;
  // 渡り廊下 (谷を 横切る 窓の ある 細長い 家、屋根つき)。コースの 高さ ± 60 m 以内には 置かない、2 本だけ コースの すぐ 上 (くぐる)
  const bridge = (s, y) => { const yaw = at(s), len = 2 * hw(s, y + 8) + 50; put(L.house, v.x, v.y + y, v.z, yaw, len, 16, 22, pick(PAL.wall)); put(L.roof, v.x, v.y + y + 16.6, v.z, yaw, len, 2, 26, pick(PAL.roof)); };
  for(let s = 150; s < CANYON_END - 100; s += 160 + rnd() * 180) bridge(s, rnd() < 0.3 ? -(90 + rnd() * 700) : 70 + Math.pow(rnd(), 1.5) * 1000);
  bridge(1300, 34); bridge(2650, 40);   // 下の 面が コースの 34・40 m 上

  yield;
  // 洗濯物 (谷を 横切る ロープに 色とりどりの 布)。いちばん 低い ロープは コースの 48 m 上 (布の 下の 端で 37 m 上)
  for(let s = 60; s < CANYON_END; s += 50 + rnd() * 60){ const yaw = at(s), y = rnd() < 0.75 ? 48 + Math.pow(rnd(), 1.6) * 850 : -(60 + rnd() * 500), half = hw(s, y) + 4;
    put(L.line, v.x, v.y + y, v.z, yaw, 2 * half, 0.5, 0.5, '#4a4038');
    for(let x = -half + 6; x < half - 6; x += 7 + rnd() * 6){ if(rnd() < 0.35) continue; put(L.cloth, v.x + f.z * x, v.y + y, v.z - f.x * x, yaw, 5 + rnd() * 3, 6 + rnd() * 5, 1, pick(PAL.cloth)); } }

  yield;
  // 配管 (壁を 縦に 走る、上の 細い 所に 合わせて 少し 壁に 埋める)
  for(let i = 0; i < (mob ? 50 : 90); i++){ const s = rnd() * CANYON_END, sg = rnd() < 0.5 ? 1 : -1, y0 = -500 + rnd() * 900, len = 120 + rnd() * 380, d = Math.min(hw(s, y0), hw(s, y0 + len)) + rnd() * 4, r = 1.6 + rnd() * 1.4; at(s);
    put(L.pipe, v.x + f.z * sg * d, v.y + y0, v.z - f.x * sg * d, 0, r, len, r, '#7d848c'); }

  yield;
  // 空 (13 秒〜): 建物を 抜けると 青空。はるか 下 (SEA_DROP) に 雲の 海、正面に 巨大な 入道雲、遠くに 同じ ような 超建築の 塔 (家を 輪に 積んだ 上ほど 細い 塔)。座標 = 抜けた 所 (B) から 前へ fw・左へ lt
  at(CANYON_END); const byB = v.y, BX = v.x, BZ = v.z, fB = f.clone(), SEA = byB - SEA_DROP, W2 = (fw, lt) => [BX + fB.x * fw + fB.z * lt, BZ + fB.z * fw - fB.x * lt];
  const tower = (tx, tz, r0, y1, skip) => { const k = 1.6, y0 = SEA - 300; cy0 = byB - 1200;   // 塔の 家は 遠いので 1.6 倍 (太く した 分 数が 増えすぎない)。かすみ・暗さの 基準は 雲の 海の 少し 上。skip(x, y, z) = 置かない 所 (出口の 門の 前)
    for(let y = y0; y < y1; ){ const h = (22 + rnd() * 16) * k, r = r0 * (1 - 0.45 * (y - y0) / (y1 - y0)), n = Math.max(6, Math.floor(2 * Math.PI * r / (48 * k))), a0 = rnd() * 6.28;
      for(let i = 0; i < n; i++){ const a = a0 + (i + (rnd() - 0.5) * 0.3) / n * 2 * Math.PI, D = (30 + rnd() * 18) * k, rr = r + rnd() * 14 * k + D / 2, wd = 2 * Math.PI * r / n + 4, hx = tx + Math.cos(a) * rr, hz = tz + Math.sin(a) * rr;
        if(skip && skip(hx, y + h / 2, hz)) continue;
        put(L.house, hx, y, hz, -a, D, h, wd, pick(PAL.wall));
        if(rnd() < 0.3) put(L.roof, tx + Math.cos(a) * (rr + 4), y + h + 0.6, tz + Math.sin(a) * (rr + 4), -a, D + 4, 2.2 * k, wd + 2, pick(PAL.roof), -0.14); }
      y += h; } };
  for(const [fw, lt, top, r0] of TOWERS.slice(0, mob ? 4 : 5)){ const [tx, tz] = W2(fw, lt); tower(tx, tz, r0, byB + top); }

  yield;
  // 出口 = 超建築の 塔の 門 (11/3 社長「イ」): コースの 終わりの 正面に 太い 塔、手前の 壁に 3 つの 入り口 (中は トンネル)。門ごとに 鉄の 枠・レーンの 色の 看板・赤い 提灯、行き先の ない 門は トタンの シャッター
  // 座標: EO = まん中の 門 (輪の 中心 = コースの 終わり + 上 2.2 m = index.html の RING3_UP)、X5 = 左・Y5 = 上・D5 = 進む 向き。レーン k の 門 = EO + (1 − k) × ex.w 左・−(k − 1) × ex.h 上 (deepsea.js と 同じ 決まり)。家は 門の 面より 奥だけ (門を くぐると この 世界は 描かれなく なる)
  const gateMeshes = [], exitTW = [];   // exitTW = 出口の 塔の 根もと [x, z, 半径] (出口の 道の 脚を めり込ませない、Codex 指摘 11/4)
  if(branch){ const ex = exit3(P.def), OW = 13, OH = 15, LC = LANE_CSS, has = k => !opts.nextChoices || !!opts.nextChoices[k];
    path.frame(path.len, v, q); const qE = q.clone(), X5 = new THREE.Vector3(1, 0, 0).applyQuaternion(qE), Y5 = new THREE.Vector3(0, 1, 0).applyQuaternion(qE), D5 = new THREE.Vector3(0, 0, 1).applyQuaternion(qE), EO = v.clone().addScaledVector(Y5, 2.2), yawE = Math.atan2(D5.x, D5.z), yC = v.y;
    const G = k => [(1 - k) * ex.w, -(k - 1) * ex.h], inGate = (x, y, mx, my) => [0, 1, 2].some(k => { const [gx, gy] = G(k); return Math.abs(x - gx) < OW + mx && Math.abs(y - gy) < OH + my; });
    const EP = (x, y, z) => EO.clone().addScaledVector(X5, x).addScaledVector(Y5, y).addScaledVector(D5, z), rel = new THREE.Vector3();
    { const R0 = 520, y1 = yC + 1900, y0 = SEA - 300, rc = R0 * (1 - 0.45 * (EO.y - y0) / (y1 - y0)), TC = EP(0, 0, rc + 110); exitTW.push([TC.x, TC.z, R0]);   // 門の 塔 (中心は 門の 面から 門の 高さの 半径 + 110 m 奥 = 家の 外の 面は 門の 面より 奥)
      tower(TC.x, TC.z, R0, y1, (x, y, z) => { rel.set(x, y, z).sub(EO); const lz = rel.dot(D5); return lz < 160 && inGate(rel.dot(X5), rel.dot(Y5), 40, 32); }); }
    cy0 = yC;
    for(let y = -230; y < 280; ){ const h = 22 + rnd() * 16; for(let x = -280; x < 280; ){ const w = 30 + rnd() * 22, D = 40 + rnd() * 25;   // 門の ある 壁 (家を 積んだ 平らな 壁、門の 穴の 所は あける)
        if(!inGate(x + w / 2, y + h / 2, w / 2 + 1, h / 2 + 1)){ const p = EP(x + w / 2, y, D / 2 + rnd() * 6); put(L.house, p.x, p.y, p.z, yawE, w, h, D, pick(PAL.wall)); }
        x += w; } y += h; }
    const sm2 = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.copy(EP(x, y, z)); m.quaternion.copy(qE); m.frustumCulled = false; root.add(m); gateMeshes.push(m); return m; };
    const tunM = new THREE.MeshBasicMaterial({ color:'#2a1d16', side:THREE.BackSide }), litM = new THREE.MeshBasicMaterial({ color:'#ffcf7a' }), lanM = new THREE.MeshBasicMaterial({ color:'#ff4a36' }), frM = new THREE.MeshBasicMaterial({ color:'#2a2e34' });
    for(let k = 0; k < 3; k++){ const [gx, gy] = G(k);
      if(!has(k)){ const p = EP(gx, gy - OH, 1); put(L.roof, p.x, p.y, p.z, yawE, 2 * OW, 2 * OH, 1.2, '#8a8e94'); continue; }   // 行き先の ない 門は トタンの シャッター
      for(const sx of [-1, 1]){ const p = EP(gx + sx * (OW + 1.5), gy - OH - 2, -1.5); put(L.post, p.x, p.y, p.z, yawE, 3, 2 * OH + 6, 3, '#3e444c'); }   // 門の 柱
      { const p = EP(gx, gy + OH + 1, -1.5); put(L.post, p.x, p.y, p.z, yawE, 2 * OW + 6, 3, 3, '#3e444c'); }   // 門の 梁
      sm2(new THREE.BoxGeometry(2 * OW, 2 * OH, 90).translate(0, 0, 45), tunM, gx, gy, 0);   // 中の トンネル (暗い 板張り、天井の 両わきに 明かり)
      for(const sx of [-1, 1]) sm2(new THREE.BoxGeometry(0.8, 0.8, 84), litM, gx + sx * (OW - 1.2), gy + OH - 1.2, 46);
      sm2(new THREE.BoxGeometry(2 * OW + 8, 12, 0.8), frM, gx, gy + OH + 10, -1.6); sm2(new THREE.BoxGeometry(2 * OW + 4, 9, 1), new THREE.MeshBasicMaterial({ color:LC[k] }), gx, gy + OH + 10, -2.4);   // レーンの 色の 看板
      for(let i = 0; i < 7; i++) sm2(new THREE.SphereGeometry(1.5, 12, 8), lanM, gx + (i - 3) * (2 * OW / 7), gy + OH - 2.5, -3); } }   // 赤い 提灯

  yield;
  // 鉄骨の 橋: レールの 下の 土台 (上の 面が レールの 1.2 m 下 = 加速の 輪の 下の 端より 下) と 骨組みの 脚 (谷間は 谷底まで、空は 雲の 海の 下まで)。入口の 3 本が 戻る 間・出口の 3 本に 広がる 間は 置かない
  const S1 = path.len - 1300;
  const EXK = exit3(P.def), spK = SPREAD3_SEC * P.move, X0 = new THREE.Vector3(), Y0 = new THREE.Vector3(), hasK = k => k === 1 || !opts.nextChoices || !!opts.nextChoices[k];   // 出口の 3 本の 道 (11/4 社長「分かれ道を 選んだら 道路が なくなって いた」): 行き先の ない レーンは 道なし
  const exLane = (s, k, o) => { path.frame(s, o, q); const b = path.len - s, u0 = !branch || b >= spK ? 0 : Math.min(1, (1 - Math.max(0, b) / spK) / EXK.sw), u = u0 * u0 * (3 - 2 * u0), w = LANE_W3 + (EXK.w - LANE_W3) * u;   // レーン k の 道の 下の 面の まん中 (stage3.js lanes3 と 同じ 広がり方、+X = 左)
    return o.addScaledVector(X0.set(1, 0, 0).applyQuaternion(q), (1 - k) * w).addScaledVector(Y0.set(0, 1, 0).applyQuaternion(q), -(k - 1) * EXK.h * u - 3.7); };
  const TW = TOWERS.slice(0, mob ? 4 : 5).map(([fw, lt, , r0]) => [...W2(fw, lt), r0]);   // 塔の 根もと (下ほど 太い 塔に 脚が めり込む 所は 脚を 省く = 橋が 長く 渡る)
  for(let s = 900; s < S1; s += s < CANYON_END ? 320 : 170){ at(s); if(TW.some(([x, z, r]) => Math.hypot(v.x - x, v.z - z) < r + 130)) continue; const top = v.y - 3.7, bot = s < CANYON_END ? v.y + YLO : SEA - 200; put(L.truss, v.x, bot, v.z, Math.atan2(f.x, f.z), 7, top - bot, 7, '#5f6872'); }
  if(branch) for(let s = S1 + 60; s < path.len - 40; s += 170) for(let k = 0; k < 3; k++){ if(!hasK(k)) continue; exLane(s, k, v); if(TW.concat(exitTW).some(([x, z, r]) => Math.hypot(v.x - x, v.z - z) < r + 130)) continue; Y0.set(0, 0, 1).applyQuaternion(q); const bot = SEA - 200; put(L.truss, v.x, bot, v.z, Math.atan2(Y0.x, Y0.z), 7, v.y - bot, 7, '#5f6872'); }   // 出口の 3 本の 道の 脚

  const mk = (geo0, mat, list) => { if(!list.length) return; const geo = geo0.clone(); geo.setAttribute('aY0', new THREE.InstancedBufferAttribute(new Float32Array(list.map(o => o.r)), 1)); const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((o, i) => { mesh.setMatrixAt(i, m4.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e.set(0, o.yaw, o.rz, 'YXZ')), s3.set(o.sx, o.sy, o.sz))); mesh.setColorAt(i, col.set(o.c)); });
    mesh.frustumCulled = false; root.add(mesh); };
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), cm = clothMat();
  const tl = new THREE.TextureLoader(), tex = (n, srgb) => { const t = tl.load('textures/kowloon-' + n + '.jpg'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if(srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };   // 質感の 写真 (色は sRGB、凹凸は そのまま)
  const TX = { d0:tex('corrugated', 1), d1:tex('planks', 1), d2:tex('plaster', 1), n0:tex('corrugated-n'), n1:tex('planks-n'), n2:tex('plaster-n') };
  mk(box, kMat(0, TX), L.house); mk(box, kMat(1, TX), L.roof); mk(box, kMat(2), L.awn); mk(box, kMat(3), L.post);
  mk(new THREE.CylinderGeometry(1, 1, 1, 16, 1).translate(0, 0.5, 0), kMat(3), L.tank); mk(new THREE.CylinderGeometry(1, 1, 1, 8, 1).translate(0, 0.5, 0), kMat(3), L.pipe);
  mk(box, new THREE.MeshBasicMaterial({ color:0xffffff }), L.line); mk(new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0), cm, L.cloth); mk(box, kMat(4), L.truss);
  { const segs = []; for(let s = 0; s < (branch ? path.len + 40 : S1); s += 20) segs.push([s, 1]); if(branch) for(const k of [0, 2]) if(hasK(k)) for(let s = S1; s < path.len + 40; s += 20) segs.push([s, k]);   /* 出口: 道も 3 本に 分かれて 塔の 3 つの 門の 中まで (11/4) */   // 土台 (20 m ごとに 前後へ 1 m 長い 箱 = 継ぎ目なし)。入口から (11/3 社長「スタートした 時に 初めから 道が あった ほうが いい」)
    const ex0 = P.lane != null && opts.prevExit, d0 = ex0 ? P.lane - 1 : 0, bk = RECONV3_SEC * P.move;   // 入口で 3 本の レールが 前の 世界の 出口の レーンの 位置から 戻る (stage3.js の lanes3 と 同じ 式) → 道も その 真下から まん中へ 寄せる。確かめ用 (最初の 世界) は 前の 世界が ない ので まっすぐ
    const lane = (s, o) => { path.frame(s, o, q); const u = ex0 ? sm(0, bk, s) : 1; return o.addScaledVector(X1.set(1, 0, 0).applyQuaternion(q), -d0 * (ex0 ? ex0.w - FORK3_W : 0) * (1 - u)).addScaledVector(Y1.set(0, 1, 0).applyQuaternion(q), -d0 * (ex0 ? ex0.h : 0) * (1 - u) - 3.7); };   // 道の 下の 面の まん中 (+X = 左、レーンの ずれは 右向きが +)
    const X1 = new THREE.Vector3(), Y1 = new THREE.Vector3(), A = new THREE.Vector3(), Bv = new THREE.Vector3(), zx = new THREE.Vector3(), xx = new THREE.Vector3(), yy = new THREE.Vector3(), geo = box.clone(), mesh = new THREE.InstancedMesh(geo, kMat(3), segs.length);
    const pos = (s, k, o) => s < S1 ? lane(s, o) : exLane(s, k, o);
    segs.forEach(([s, k], i) => { pos(s, k, A); pos(s + 20, k, Bv); zx.subVectors(Bv, A); const len = zx.length(); zx.normalize(); yy.set(0, 1, 0).applyQuaternion(q); xx.crossVectors(yy, zx).normalize(); yy.crossVectors(zx, xx);
      mesh.setMatrixAt(i, m4.makeBasis(xx, yy, zx).scale(s3.set(9, 2.5, len + 2)).setPosition(A.lerp(Bv, 0.5))); mesh.setColorAt(i, col.set('#6d7680')); });
    geo.setAttribute('aY0', new THREE.InstancedBufferAttribute(new Float32Array(segs.length).fill(-3.7), 1)); mesh.frustumCulled = false; root.add(mesh); }
  { const puffs = [], K = mob ? 0.65 : 1;   // 雲 (神殿と 同じ もくもくの 板、遠い 順に 描く)
    const tower = (fw, lt, w, h) => { const [cx, cz] = W2(fw, lt), n = Math.round((18 + h / 110) * K); for(let j = 0; j < n; j++){ const u = Math.pow(rnd(), 0.8), rr = w * 0.5 * (1 - u * 0.6) * Math.sqrt(rnd()), a = rnd() * Math.PI * 2;   // 入道雲: 下ほど 太く、上ほど 細く 明るい
      puffs.push([cx + Math.cos(a) * rr, SEA + u * h, cz + Math.sin(a) * rr * 0.7, w * (0.3 + rnd() * 0.22) * (1 - u * 0.45), 0.3 + 0.7 * u, (rnd() - 0.5) * 0.5]); } };
    for(let i = 0; i < Math.round(200 * K); i++){ const [x, z] = W2(-1500 + rnd() * 17000, (rnd() - 0.5) * 22000); puffs.push([x, SEA + rnd() * 250, z, 1600 + rnd() * 1200, 0.55 + rnd() * 0.3, (rnd() - 0.5) * 0.4]); }   // 雲の 海 (板の 上の 端 = コースの 約 350 m 下まで)
    tower(7500, 1800, 4200, 7500);   // 正面の 巨大な 入道雲 (高さ 7.5 km)
    for(let i = 0; i < 6; i++) tower(1500 + i * 2000 + rnd() * 800, (i % 2 ? 1 : -1) * (5000 + rnd() * 4000), 2200 + rnd() * 1200, 3000 + rnd() * 2500);   // 左右の 遠くの 入道雲
    for(let i = 0; i < 12; i++){ const sg = i % 2 ? 1 : -1, [cx, cz] = W2(400 + rnd() * 7000, sg > 0 ? 900 + rnd() * 1800 : -(1500 + rnd() * 1800)), cy = byB - 700 + rnd() * 900;   // 近くを 流れる 小さな 雲 (速さと 高さが 分かる。右へ 曲がる コースから 離す)
      for(let j = 0; j < 5; j++) puffs.push([cx + (rnd() - 0.5) * 500, cy + (rnd() - 0.5) * 120, cz + (rnd() - 0.5) * 400, 300 + rnd() * 300, 0.6 + rnd() * 0.4, (rnd() - 0.5) * 0.5]); }
    const [rx, rz] = W2(1500, 0), ref = new THREE.Vector3(rx, byB, rz); puffs.sort((a, b) => ref.distanceToSquared(v.set(b[0], b[1], b[2])) - ref.distanceToSquared(v.set(a[0], a[1], a[2])));
    const n = puffs.length, aP = new Float32Array(n * 4), aS = new Float32Array(n * 2); puffs.forEach((p, i) => { aP.set([p[0], p[1], p[2], p[3]], i * 4); aS.set([p[4], p[5]], i * 2); });
    const base = new THREE.PlaneGeometry(1, 1), ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv);
    ig.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); ig.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 2)); ig.instanceCount = n;
    const pm = new THREE.Mesh(ig, puffMat(puffTex(rnd))); pm.frustumCulled = false; pm.renderOrder = -1; root.add(pm); }
  { const pos = [], idx = [], n = Math.ceil((CANYON_END + 300) / 40); for(let i = 0; i <= n; i++){ at(-300 + (CANYON_END + 300) * i / n); for(const x of [-320, 320]) pos.push(v.x + f.z * x, v.y + YLO, v.z - f.x * x); if(i) idx.push(2 * i - 2, 2 * i, 2 * i - 1, 2 * i - 1, 2 * i, 2 * i + 1); }   // 谷底の 帯 (コースに 沿って 左右 320 m、谷間の 終わりまで = 建物を 抜けた 所で 初めて 下の 雲の 海が 見える)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); const m = new THREE.Mesh(g, floorMat(YLO)); m.frustumCulled = false; root.add(m); }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), skyMat()); sky.renderOrder = -5; sky.frustumCulled = false; root.add(sky);

  const PS = path.S.map(sv => path.frame(sv, new THREE.Vector3(), new THREE.Quaternion())), ab = new THREE.Vector3(), ap = new THREE.Vector3();   // コースの 点 (カメラの 道のりを 求める 用)
  const sAt = p => { ci = path.near(p, ci); let best = 1e18, s = path.S[ci];   // カメラの 道のり: 一番 近い 点の 前後の 区間へ 投げて 補間 (点の 番号の まま だと 150 m の 段々 = もやが 0.5 秒ごとに 跳ねる、Codex 指摘 11/3)
    for(const [a, b] of [[ci - 1, ci], [ci, ci + 1]]){ if(a < 0 || b >= PS.length) continue; ab.subVectors(PS[b], PS[a]); const l2 = ab.lengthSq(); if(l2 < 1e-6) continue; const k = Math.min(1, Math.max(0, ap.subVectors(p, PS[a]).dot(ab) / l2)), d = ap.copy(PS[a]).addScaledVector(ab, k).distanceToSquared(p); if(d < best){ best = d; s = path.S[a] + k * (path.S[b] - path.S[a]); } }
    return s; };
  const camL = new THREE.Vector3(), FOG_A = [350, mob ? 2400 : 3200], FOG_B = [1500, mob ? 16000 : 22000]; let t = 0, ci = 0;   // もや: 谷間 (遠くは かすむ) → 空 (20 km 先まで 見える)
  return [(cam, dt) => { if(out.dead) return; t += dt;
    camL.copy(cam.position); root.worldToLocal(camL); sky.position.copy(camL); cm.uniforms.uTime.value = t;
    const k = sm(CANYON_END - 400, CANYON_END + 200, sAt(camL)); scene.fog.near = FOG_A[0] + (FOG_B[0] - FOG_A[0]) * k; scene.fog.far = FOG_A[1] + (FOG_B[1] - FOG_A[1]) * k; }];
}
