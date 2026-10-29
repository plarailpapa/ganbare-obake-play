// がんばれおばけ！ 3 面 (神々の世界めぐり → 子ども部屋) の「表と計算」と 世界の景色。画面・曲・ライバルの動きは index.html (import * as S3 from './stage3.js')
// 設計書: younglion/docs/superpowers/specs/2026-10-07-ganbare-obake-stage3-design.md
import * as THREE from 'three';
import { ctrlLen } from './stage2.js';   // 制御点の間隔は 2 面と同じ決め方 (速さに応じて)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';   // 星座の神々の像 (模型)
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';   // 神殿の部品を 1 つの形にまとめる
import { nurseryWorld, nurseryPath, NURSERY, MM3 } from './nursery3.js';   // ⑤ 子ども部屋 (10/22) と その コース (10/27)
import { buildDraft } from './worlds/draft.js';   // 仮の 世界 (分かれ道の まだ 無い 世界、確かめ用 ?draft=1、10/27)
import * as GALAXY from './worlds/galaxy.js';   // 銀河の 公転を 追う (合流、10/28)
import * as CRYSTAL from './worlds/crystal.js';   // ① クリスタルの 洞窟 (10/28)
import * as NEON from './worlds/neon.js';   // ② 光の 都市 (10/29)

export const V3_START = 108000/3.6;   // 速度計の始まり (m/s) = 2 面の目標 地球の公転 (107,200) の きりのいい数 (10/26 社長。前は 水星の 170,500)。数字は スコアのように上がり続けてよい (設計書 2.1)
export const V3_MOVE = 300;           // おばけが 実際に進む速さ (m/s、ずっと一定。10/28 社長「子ども部屋に 合わせた方が スピード感が ある」= 子ども部屋の 床を走る所と 同じ 約 300 (1 秒で おばけ 約 250 個ぶん)、各 世界 約 9 km。10/27 は 10、前は 150)。速度計の数字とは切り離す (F-ZERO 方式: 神殿や像を じっくり見せる、2.1、仮)
// 3 面の加速は index.html の STEP3_FIRST・STEP3_ADD (10/26 から 決まった数ずつ。前は 輪をくぐるたび +3% の倍々)
export const CAM3_K = 0.5;            // カメラの引き (2 面の速さの演出 0〜1 の真ん中: 視野 +7°・後ろへ 1.5 m・上へ 0.4 m。大きな景色が入るように、仮)
export const LANE_W3 = 3;             // レール間隔 (m。10/27: 秒速 10 m の 時に 6 → 3。10/28 秒速 300 m に しても そのまま、プレビューで 決める)。広げすぎない (建物の大きさが引き立つように、2.1。10/8 社長: 10 m は広すぎ・3 本とも 世界が変わる輪を通るように → 6 m)
export const RING_R3 = 1.4, RING_H3 = 1.0;   // 加速の輪の半径 (m) と 中心の高さ (レールの面から m) = おばけの体の真ん中 (体は 0.4〜1.6 m)。おばけが 輪の真ん中をくぐる (10/8 社長: 小さく・真ん中を。2 面は レール間隔の半分で 下端がレールの上)
export const BEAM_H3 = 40, BEAM_W3 = 0.8, BEACON3 = 7;   // 加速の輪の上の 光の柱の高さ・太さ (m) と 柱の先の光の点 (画素)。2 面は 200 m・3 m・14 画素 (10/8 社長: 柱が長すぎて変・上の輪っかも小さく)
const D2R = Math.PI/180, GATE_CALM = 2.5;   // ワープの輪の前後 2.5 秒は まっすぐ (輪と窓が 正面に見えるように)
const _f=new THREE.Vector3(), _dq=new THREE.Quaternion(), AXX=new THREE.Vector3(1,0,0), AXY=new THREE.Vector3(0,1,0);
function turn(g, axis, ang){ if(ang) g.q.multiply(_dq.setFromAxisAngle(axis, ang)); }   // 自分の向きを基準に回す (x = 機首を下げる、y = 左へ)

/* 世界の表 (設計書 2〜4 章)。sec = 長さの目安 (秒。曲の長さに合わせて 全部まとめて伸び縮み、7 章)。legs = レールの曲がり方 [秒, 左右 (度/秒、+ = 左), 上下 (度/秒、+ = 下)] を順に繰り返す (世界の中は 毎回同じ形 = 置き物の場所が決められる)。sky = 空の色 (上・下) と 天の川の帯 (band = 濃さ、dust = 暗い筋、bulge = 中心のふくらみ)。name/kana = 世界に入った時に出す名前 (子ども部屋は 出さない = 気づかせない入り方、4 章)。rival = その世界のライバル (②〜⑤。① 天の川は なし、10/8 社長。動きは ② の便で作る) */
export const WORLDS3=[
  {key:'milkyway', name:'天の川', kana:'あまのがわ', sec:40, legs:[[4,0,0],[10,2,0],[10,-2,0.5]], sky:{top:'#05040f', bot:'#120a26', band:1, dust:true, bulge:true}, look:'milkyway', color:'#8a9cff', ready:true},   /* ライバルなし (10/8 社長: 流れ星はいらない) */   // ① 始まりから 天の川 (10/8 社長: 宇宙の場面と天の川の場面は 同じでよい = スタートした時から 天の川や ほかの銀河が見えている)
  {key:'temple',   name:'星座の神々', kana:'せいざの かみがみ', sec:75, legs:[[999,0,0]], sky:{top:'#5f93d8', bot:'#ffd6a6', band:0, day:true, sun:[0.55, 0.2, -0.8]}, look:'castle',   /* ② 朝 (10/14 社長: 神々の世界は朝・インドは昼・日本の神々は夕方・子ども部屋は夜 = 低い太陽・地平線は 金色〜桃色・上は 淡い青)。城の大広間 (10/12 社長: 晴れた青空の世界・水の上・城の中から始まる・像の体を上に走る、速度計は増え続ける)。進む速さ = コースの長さ ÷ この世界の時間 (曲が長いほど ゆっくり、planWorlds) */
    path:{type:'statue', s:2000, dz:1250, turn:400, clear:80, rmin:350, smooth:12, beta:20,   // 像を見上げて近づき、体のまわりを らせんに のぼる (statuePath。10/12 社長: 正面から見上げる → らせん → 翼を越えて 顔の高さで ワープ): 像の高さ 2,000 m (ニケを 今の 4 倍) / 入口から 像の中心まで / 右へ曲がる半径 / 体との すき間 (上下も含めた 3 次元) / 半径の下限 / なめらかにする幅 (度) / 体へ寄る・膨らむ 傾きの上限 (度)
      climb:[[720, 0.72], [765, 0.76], [860, 0.93], [885, 0.93]],   // 高さの印 [像のまわりの角度 (度。正面 = 180・左 = 90・後ろ = 0、左回りに 2 周目まで数える), 高さ (像の高さに対して)]。翼 (右〜後ろ〜左後ろ = 270〜405°) の所は 高さ 72% までで通り、翼を過ぎて (765°) から 顔の高さ 93% へ。最後の 25° は 水平 (高さを なめらかにする幅 16° より長く = 終わりが きちんと水平、Codex 指摘 10/12)。assets-warehouse/scans/coursecheck.py (同じ計算) で 本物の像との すき間 80 m 以上・坂 20° 以下・全長 約 7 km を確かめた
      statue:{glb:'assets/gods/nike-samothrace.glb', axis:[-0.1347, 0.2239], ry:Math.PI},   // サモトラケのニケ (ルーヴル)。axis = 体の縦の線 (模型の x・z、profile.py で 高さ 15〜60% の点の平均)。向き = 入口の方
      sect:[[0.18,0.183,0.198,0.171,0.178,0.182,0.234,0.193],[0.182,0.185,0.198,0.17,0.164,0.182,0.234,0.189],[0.183,0.185,0.198,0.177,0.176,0.182,0.234,0.194],[0.171,0.177,0.162,0.168,0.176,0.181,0.186,0.161],[0.147,0.137,0.168,0.103,0.076,0.115,0.147,0.114],
        [0.105,0.099,0.162,0.104,0.077,0.136,0.153,0.143],[0.098,0.097,0.147,0.101,0.074,0.136,0.157,0.147],[0.097,0.108,0.149,0.1,0.067,0.143,0.157,0.146],[0.102,0.108,0.148,0.101,0.089,0.143,0.157,0.147],[0.105,0.105,0.142,0.094,0.092,0.143,0.159,0.149],
        [0.091,0.111,0.134,0.078,0.093,0.096,0.159,0.152],[0.089,0.113,0.128,0.069,0.056,0.111,0.157,0.147],[0.095,0.107,0.12,0.066,0.118,0.155,0.154,0.145],[0.096,0.104,0.111,0.143,0.121,0.149,0.16,0.153],[0.097,0.098,0.207,0.222,0.078,0.136,0.16,0.156],
        [0.093,0.097,0.233,0.257,0.075,0.137,0.159,0.153],[0.095,0.098,0.267,0.275,0.068,0.137,0.157,0.15],[0.098,0.1,0.275,0.282,0.083,0.138,0.156,0.146],[0.1,0.098,0.276,0.288,0.082,0.134,0.153,0.139],[0.099,0.096,0.252,0.285,0.076,0.142,0.147,0.143],
        [0.097,0.094,0.22,0.275,0.088,0.142,0.146,0.141],[0.105,0.095,0.194,0.26,0.102,0.138,0.147,0.138],[0.106,0.091,0.129,0.173,0.105,0.138,0.138,0.126],[0.1,0.086,0.111,0.106,0.105,0.153,0.151,0.108],[0.095,0.08,0.083,0.065,0.104,0.152,0.148,0.102],
        [0.085,0.063,0.07,0.066,0.099,0.129,0.117,0.1],[0.081,0.059,0.057,0.068,0.096,0.13,0.122,0.108],[0.078,0.043,0.041,0.076,0.084,0.129,0.13,0.116],[0.084,0.037,0.06,0.17,0.146,0.131,0.131,0.119],[0.096,0.078,0.17,0.256,0.224,0.135,0.134,0.121],
        [0.106,0.107,0.278,0.306,0.228,0.137,0.145,0.129],[0.114,0.118,0.279,0.532,0.288,0.141,0.148,0.123],[0.104,0.109,0.43,0.586,0.329,0.139,0.148,0.115],[0.099,0.101,0.521,0.59,0.364,0.126,0.124,0.094],[0.087,0.106,0.541,0.583,0.48,0.128,0.112,0.082],
        [0.041,0.113,0.537,0.577,0.516,0.128,0.085,0.043],[0,0,0.519,0.563,0.53,0,0,0],[0,0.215,0.497,0.558,0.547,0,0,0],[0,0,0.454,0,0.514,0,0,0],[0,0,0.294,0,0.457,0,0,0]]},   // 高さ 40 段 (2.5% ずつ、下から) × 8 方向 (模型の正面 +Z から 45° ずつ +X 側へ) の 体の線からの いちばん遠い所 (高さ 1 に対して、profile.py)。翼 = 72% から上の 3〜5 番目 (ゲームでは 右〜後ろ)
    color:'#e8d9a8', ready:true},   /* 3 面の ライバルは 名前だけの 別の 表 (手順書 Task 3)。ペガサスは 外した (姿が 無かった、10/27) */
  {key:'india',    name:'インドの宇宙', kana:'インドの うちゅう', sec:35, legs:[[999,0,0]], sky:{top:'#2f7fe6', bot:'#d8ecff', band:0, day:true, sun:[0.25, 0.92, 0.3]}, look:'india',   /* ③ 昼の空 (10/13 社長: 神々の世界は朝・インドは昼・日本の神々は夕方・子ども部屋は夜)。亀 → 象 4 → 大地 → 象 4 → 雲の台と須弥山 の塔を 大蛇が囲む。おばけは 大蛇の背中を走る (10/13 社長: 博物館の「古代インド人の宇宙観」の写真から、ベースは秘書の模型) */
    path:{type:'serpent', s:3100, start:205, jump:228, ride:{look:2, bank:30, pts:[[0,-0.25,-5.4],[0,-0.05,-3.9],[0.05,0.5,-3.1],[0,0.78,-2.05],[0,0.86,-1.6],[0,1.0,-1.05],[0,1.18,-0.45],[0,1.2,0],[0,1.2,0.45],[0,1.32,1.0],[0,1.5,1.75],[0.35,1.68,2.75],[1.25,1.85,3.45],[2.35,2.02,3.25],[2.95,2.2,2.35],[2.6,2.45,1.6],[1.725,2.83,0.95],[0.85,3.21,0.3]]}, noCalm:true, step:40, loop:{speed:300, sec:33.03, look:2, bank:30, headK:1.5, body:[[0,-1.6,-6.5],[0,-1.5,-5.5],[0.05,-1.38,-4.4],[0.2,-1.26,-3.2],[0.391,-1.150,-2.216],[-0.756,-1.115,-2.077],[-1.663,-1.079,-1.395],[-2.099,-1.044,-0.370],[-1.966,-1.008,0.715],[-1.319,-0.973,1.572],[-0.349,-0.937,1.982],[0.675,-0.902,1.854],[1.481,-0.867,1.243],[1.865,-0.831,0.329],[1.742,-0.796,-0.634],[1.166,-0.760,-1.390],[0.308,-0.725,-1.748],[-0.594,-0.690,-1.631],[-1.299,-0.654,-1.090],[-1.631,-0.619,-0.288],[-1.519,-0.583,0.553],[-1.014,-0.548,1.208],[-0.267,-0.512,1.514],[0.512,-0.477,1.408],[1.117,-0.442,0.937],[1.397,-0.406,0.246],[1.296,-0.371,-0.472],[0.861,-0.335,-1.026],[0.226,-0.300,-1.280],[-0.431,-0.300,-1.184],[-0.935,-0.300,-0.785],[-1.163,-0.300,-0.205],[-1.073,-0.300,0.390],[-0.708,-0.300,0.844],[-0.185,-0.300,1.046],[0.350,-0.300,0.961],[0.753,-0.300,0.632],[0.929,-0.300,0.164],[0.850,-0.300,-0.309],[0.556,-0.300,-0.662],[0.143,-0.300,-0.812],[-0.269,-0.300,-0.738],[-0.571,-0.300,-0.479],[-0.696,-0.300,-0.123],[-0.626,-0.300,0.228],[-0.403,-0.300,0.480],[-0.102,-0.300,0.579],[0.187,-0.300,0.515],[0.389,-0.300,0.327],[0.462,-0.300,0.081],[0.403,-0.300,-0.147],[0.250,-0.300,-0.298],[0.061,-0.300,-0.345],[0.05,-0.7,0.2],[0,-1.2,0.4],[0,-1.62,1.0],[0,-1.64,2.0],[0,-1.42,2.9],[0,-0.7,3.5],[0,0.3,3.85],[0,1.2,3.98],[0,1.967,3.933],[0,2.445,4.301],[0,3.002,4.531],[0,3.600,4.610],[0,4.198,4.531],[0,4.755,4.301],[0,5.233,3.933],[0,5.601,3.455],[0,5.831,2.898],[0,5.910,2.300],[0,5.831,1.702],[0,5.601,1.145],[0,5.233,0.667]], brad:[0.04,0.1,0.18,0.22,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.22,0.2,0.18], pts:[[0,-1.45,-6.6],[0,-1.3,-5.6],[0,-1.12,-4.6],[0,-0.72,-3.7],[0,-0.15,-2.9],[0,0.3,-2.4],[0,0.56,-2.08],[0,0.675,-1.9],[0,0.72,-1.65],[0,0.71,-1.4],[0,0.77,-1.2],[0,0.9,-1.0],[0,0.99,-0.8],[0,1.06,-0.55],[0,1.11,-0.2],[0,1.12,0.15],[0,1.12,0.5],[0,1.2,1.0],[0,1.4,1.75],[0,1.6,2.3],[0,1.87,3.3],[0,2.6,4.03],[0,3.6,4.3],[0,4.6,4.03],[0,5.33,3.3],[0,5.6,2.3],[0,5.33,1.3],[0,4.6,0.57],[0,3.6,0.3]]},   /* loop = 宙返りの 試作 (10/29 社長。22:40「亀の 下の 土台の 模様を 蛇の 体の ように、今は 白い パンケーキの 上に 載って いる ように 見える」= とぐろの 真ん中の 穴から 下の 雲が 透けて いた → 真ん中も 巻いて 埋める): speed / sec = コースを 33.03 秒で 秒速 300 m で 走る 大きさ (模型の 1 = 約 510 m)。大蛇 (太さ 0.24) = しっぽ (正面の 雲の 中、まっすぐ) → 亀の 真下で 外から 内へ・下から 上へ 巻く とぐろ 2 周 (半径 2.25・高さ −1.15 → 半径 1.3・高さ −0.3) → そのまま 亀の 底の すぐ 下で 平らに 内へ 2 周 (半径 1.3 → 0.35 = 真ん中まで 埋める) → 真ん中から 下へ 潜り いちばん 下の 輪の 下を くぐって 後ろへ → 空へ そびえ → 輪 (中心 (0, 3.6, 2.3)・半径 2.31) → 頭は 山の 上へ 下向き。レールは しっぽの 上 → 亀の 鼻先の すぐ 上 → 頭と 甲羅の 上を なめる ように → 象の 間 → 輪の 内側 (半径 2.0) を 宙返り → 頂上の 太陽 (0, 3.6, 0.3) へ 上から 突入。カメラは レールと 一緒に 回る。loop を 消すと ride に 戻る */   /* 象の すき間を 後ろへ 抜けた 後は 塔の 後ろの 外で 半回転 (U ターン) → 塔へ 戻りながら 須弥山の 頂上の 太陽 (模型の 太陽 = 中心 (0.85, 3.21, 0.30)、後ろ向き) へ まっすぐ のぼる (10/29 社長「太陽の 位置は 上の 象たちが 支える 山の 頂上に あった はず」)。noCalm = 道すじの 後の 2.5 秒の まっすぐを なくし ワープの 輪 = 太陽の 中心。camRoll = カメラは レールの 傾きの 35% だけ 傾く (社長「半回転は 曲がる 方向に レールを 傾けた 方が 見やすい」) */   /* ride = 社長の 道すじ (10/29): 正面の 遠く・雲の 高さから 塔 全体を 見上げて 近づく (look = 2 番目の 点まで カメラは 塔の 方へ) → 亀の 顔の 下の 大蛇の しっぽ・とぐろの 上を のぼり → 亀の 頭 → 甲羅の 上 → 甲羅と 大地の 間 (象の すき間) を くぐって 後ろへ → 右回りに 半周しながら のぼる → 正面から 須弥山の てっぺんへ → 太陽。消すと 前の 道すじ (route) に 戻る */   // 大蛇のコース (serpentPath): 模型の 1 (亀の甲羅の半径) = 3,100 m (10/13 社長: めちゃんこ大きく = 20 倍、塔の高さ 約 11 km) / 大蛇の背中に降りる所・跳び上がる所 = とぐろの角度 (度、200 = しっぽの入口・亀の顔の右前)
      route:[[-1.187, 0.75, -0.996], [-1.143, 1.05, -0.66],   // 道すじ (塔の中心からの 模型の単位、10/14 社長: 下から上へ): 甲羅の横 (右前) を上る
        [-0.883, 1.34, -0.51], [-0.695, 1.42, -0.719],   // 大地の下を くぐる (半径 約 1.0 = 象の鼻の先 0.76 より外、大地の下の面より 0.2〜0.3 下)
        [-0.729, 1.62, -1.003], [-0.622, 1.84, -1.276], [-0.319, 2.04, -1.281], [-0.098, 2.25, -1.116],   // 大地の縁を 横へ回りながら 上へ越える (坂は 40° まで、真上を向かない)
        [0.08, 2.45, -0.92], [0.33, 2.60, -0.572], [0.476, 2.80, -0.275], [0.45, 3.00, 0], [0.62, 3.12, 0.12], [0.85, 3.21, 0.30]]},   // 須弥山のまわりを 回りながら上り (山・雲の台から 0.1 以上 離す) → 太陽の中へ
    cosmos:{glb:'assets/gods/india-cosmos.glb', place:[[0.2546, 0.9728, -0.2546, -0.7854, 0.38], [-0.2546, 0.9708, -0.2546, 0.7854, 0.38], [-0.2546, 0.9728, 0.2546, 2.3562, 0.38], [0.2546, 0.9708, 0.2546, 3.927, 0.38], [0.34, 1.9372, 0, -1.5708, 0.3], [0, 1.9372, -0.34, 0, 0.3], [-0.34, 1.9372, 0, 1.5708, 0.3], [0, 1.9372, 0.34, 3.1416, 0.3]]},   // 塔の模型 (assets-warehouse/codex-work/india.py: turtle・elephant・land・sun) と 象 8 頭の置き方 [x, y, z, 向き, 大きさ] (india.py の PLACE。下の 4 頭 = 大地を支える、上の 4 頭 = 雲と山を支える)
    color:'#5fb0e8', ready:true},
  /* 分かれ道の 新しい 世界 (10/27 社長と 決めた 設計書 2026-10-27-ganbare-obake-stage3-branching-design.md)。ready = できている (公開版で 輪を 出す)。できるまでは 確かめ用 ?draft=1 で 仮の 世界 (worlds/draft.js、color の 色)。legs は 仮の 世界の ゆるい 曲がり。名前は 作る時に 決め直す */
  {key:'crystal',    name:'クリスタルの 洞窟', kana:'くりすたるの どうくつ', sec:30, legs:[[6,3,0],[10,-3,0],[10,3,0]], exit:{w:24, h:0, up:40}, sky:{top:'#120a26', bot:'#2a1650', band:0, stars:false}, color:'#c08cff', ready:true, mod:CRYSTAL},   /* 出口 (10/29 社長「緩やかに 扇形に 広がりながら 上に 上がって いき、光る 城壁の 門へ」): 3 本が 上下に ずれず 24 m 間隔まで 広がり、そろって 40 m 上がる */   /* worlds/crystal.js (10/28 社長の ChatGPT の 絵)。コースは ゆるい S 字 (10/29 社長「コースの 緩やかな カーブ」: 左 → 右 → 左、1 秒に 3 度。秒速 300 m で 曲がりの 半径 約 5.7 km = 洞窟の 幅より ずっと 大きい)。洞窟・岩・門は coursePath で コースに 沿わせる。上下には 曲げない (岩の 柱を まっすぐ 立てたまま) */
  {key:'deepsea',    name:'深海', kana:'しんかい', sec:30, legs:[[6,0,1],[6,0,-1]], sky:{top:'#02101e', bot:'#06324a', band:0, stars:false}, color:'#3fc8ff', ready:false},
  {key:'kowloon',    name:'九龍城', kana:'くーろんじょう', sec:30, legs:[[4,6,0],[4,-6,0]], sky:{top:'#3a2a3a', bot:'#c88060', band:0, day:true}, color:'#ff9a50', ready:false},
  {key:'neon',       name:'光の 都市', kana:'ひかりの とし', sec:30, legs:[[4,0,-3],[4,2,3],[5,-3,0],[3,0,2.5],[3,0,-2.5],[4,3,0]], bank:2.5, exit:{w:44, h:0, up:300, sw:0.4, k0:0.3}, ringGlow:1.7, sky:{top:'#05020f', bot:'#2a0a3a', band:0}, color:'#ff4fd8', ready:true, mod:NEON},   /* 10/29 2 回目 (社長「ほぼ 完璧」): bank = 曲がる 時に レールの 面を 少し 傾ける (3 度/秒で 約 7.5 度)。exit = 出口は スカイツリー風の 塔の 展望台の 3 枚の 光る 看板 (3 本が 4 割で 44 m まで 分かれ、3 割 進んだ 所から 300 m のぼる)。ringGlow = この 世界では 加速の 輪の 光を 強く (ネオンに 埋もれない) */   /* worlds/neon.js (10/29 社長「摩天楼・遠くに スカイツリーや 東京タワー」「スパイダーマンの ように 地面から 空へ、ビルの 間を くぐり抜ける」「急な うねり・カーブは スマホで 見にくい」= 1 秒 3 度まで): 大通りの 上 → 4 秒で 機首上げ・4 秒で 水平 (約 250 m 上空) → 右へ → ゆるく 下って 上がる → 左へ。出口は 決める 前 (今は ジャンクション) */
  {key:'torii',      name:'鳥居と 湯けむりの 町', kana:'とりいと ゆけむりの まち', sec:30, legs:[[6,3,0],[6,-3,0]], sky:{top:'#2a2010', bot:'#c89040', band:0}, color:'#ff5a3a', ready:false},   /* 旧 悟空と 日本の 神々 (空の 色だけで 景色が 無かった)。たくさんの 鳥居と 道後温泉を 積み重ねた ような 和風建築 (10/27 社長) */
  {key:'prominence', name:'太陽の プロミネンス', kana:'たいようの ぷろみねんす', sec:30, legs:[[6,2,-1],[6,-2,1]], sky:{top:'#1a0400', bot:'#ff7a20', band:0}, color:'#ffb030', ready:false},
  {key:'micro',      name:'ミクロの 世界', kana:'みくろの せかい', sec:30, legs:[[5,4,1],[5,-4,-1]], sky:{top:'#001820', bot:'#00485a', band:0, stars:false}, color:'#60ffe0', ready:false},
  {key:'galaxy',     name:'銀河の 公転', kana:'ぎんがの こうてん', sec:30, legs:[[999,0,0]], sky:{top:'#000006', bot:'#0a0a24', band:0}, color:'#ffd27a', ready:true, mod:GALAXY},   /* 合流 (みんな 通る、約 30 秒)。worlds/galaxy.js。太陽の 公転 (時速 約 83 万 km) を 追う 場面 (10/28 社長。前は ブラックホール) */
  {key:'catchup',    name:'太陽に 追いつけ！', kana:'たいように おいつけ', sec:25, legs:[[999,0,0]], sky:{top:'#000006', bot:'#1a1030', band:0}, color:'#fff0a0', ready:true, mod:GALAXY.CATCHUP},   /* 最後の 盛り上がりの フレーズ (約 25 秒) = パチンコの 大当たり 演出、追いつけたら 当たり・足りなければ はずれ (10/28 社長「最後の 盛り上がりの フレーズに 入る 時に 世界 変更」)。名前は 仮 */
  {key:'nursery',  name:'？？？の世界', sec:60, legs:[[999,0,0]], sky:{top:'#0d0718', bot:'#1c1030', band:0, stars:false}, look:'nursery', color:'#f0c8ff', ready:true,
    path:{type:'nursery', times:{climb:5, merry:23, down:25, bed:28}}},   /* ドアの前から 黄金の らせん (左回り 約 2 周): 積み木の 門 → レールが ふわっと 浮き上がり → メリーの 高さで 回って → らせんの まま ベッドの まん中へ 下りる (10/26・10/27 社長)。times = 子ども部屋の始まりから 各印に 着く秒 (設計書 2 章の表。区間ごとに 速さを決める) */   /* ⑤ 子ども部屋 (名前は 伏せる、10/21 社長)。最後の輪を 時速 830,000 km 以上で くぐった時だけ。足りなければ 代わりに ① と同じ 天の川 (index.html の lost3) */
];
export const W3=Object.fromEntries(WORLDS3.map(w=>[w.key, w]));   // key → 世界
export const LAYERS3=[['milkyway'], ['crystal','deepsea','micro'], ['kowloon','neon','torii'], ['temple','india','prominence'], ['galaxy'], ['catchup']];   // 段 (10/28 社長: 分かれ道 3 回・オーロラ / ブロック / 万華鏡を 外す): はじまり / ① ふしぎな 自然 / ② 人の 街 / ③ 神話と 宇宙 / 合流 = 銀河の 公転 / 最後の フレーズ = 太陽に 追いつけ (大当たり 演出)。子ども部屋は 結果発表の 後 (作り替え中)。分かれ道の 段の 並び = レーン 0・1・2 (左・まん中・右、タップの 左右と 同じ)
export const FORK3_W=1;   // 輪の 後で 新しく 生える 2 本の 最初の 間隔 (m、光の 管が 重ならない)
export const SPREAD3_SEC=4, SPREAD3_W=14, RECONV3_SEC=1.5, SPLIT3_H=10;   // 分かれ道の 手前で レールが 広がる 秒 / 広がった レール間隔 (m) / 輪の 後で 元の 間隔へ 戻る 秒 / 広がった 時の 上下の ずれ (m、左の レーンが 上・右が 下・まん中は そのまま、10/28 社長「高速道路の ジャンクション」「もっと ワイルドに 変化しても いい」→ 8・6 から 14・10 へ。カメラは 選んだ レーンを 追う) (10/27 社長「輪の 前に 3 本の コースが 広がる、その 間は 加速の 輪も コース変更も なし」)
export function exit3(def){ const e=def && def.exit; return {w: e ? e.w : SPREAD3_W, h: e ? e.h : SPLIT3_H, up: (e && e.up) || 0, sw: (e && e.sw) || 1, k0: Math.min(0.9, (e && e.k0) || 0)}; }   /* sw = 広がる 間の うち 何割で 広がり きるか、k0 = 何割 進んで から 上がり 始めるか (光の 都市「3 本 分かれた 後に 上に 上って 行く」10/29) */   // 世界ごとの 出口の 形 (10/29 社長「各世界の 分岐は オリジナリティの ある 出口を 一つ一つ 作って いこう」): w = 輪での レール間隔 (m)、h = 左右の 上下の ずれ (m、左が 上)、up = 3 本 そろって 上がる 高さ (m)。def.exit が 無い 世界は 高速道路の ジャンクション (14 m・上下 10 m)
export function exitLift3(def, move, left){ const e=exit3(def); if(!e.up) return 0; const k=Math.min(1, Math.max(0, (1-left/(SPREAD3_SEC*move)-e.k0)/(1-e.k0))); return e.up*k*k*(3-2*k); }   // 出口で 3 本 そろって 上がる 高さ (輪までの 残り left m。広がる 間 SPREAD3_SEC 秒で なめらかに、輪の 所では 水平)
export const MUSIC3={   /* 3 面の曲の時刻表 (設計書 2026-10-12-ganbare-obake-stage3-music-sync-design.md)。曲 = ロッシーニ「ウィリアム・テル」序曲 より「スイス軍の 行進」の 短い版 (2:47、10/28 社長: 元の 3:55 から 元の 66.88〜105.02 秒と 164.19〜185.45 秒を 切った)。時刻 = ステージの時計 (秒、1 曲目の頭の無音を切った所 = 0)。notes = 加速の輪 (社長が ?tap=1 で 拍を 記録 → 音の 立ち上がりに 合わせ、強い 拍の 側を 1 つおきに 選んだ 82 個)。gates = 世界の切り替え (段の数 − 1。10/28 社長が ?time=1 の 時計で 決めた 17・51・80・113・142 秒を いちばん 近い 音の 立ち上がりへ: 駆け足の 始まり / 音が 引いた 後の フレーズ / その 32 拍 後 / 強い アクセント / 一瞬 止まった 後の 最後の 盛り上がり)。曲を変えたら ?tap=1 で 記録し直す */
  notes:[4.19, 5.86, 7.46, 9.12, 10.82, 18.24, 19.80, 21.50, 23.24, 25.00, 26.66, 28.40, 30.20, 31.93, 33.69, 35.42, 37.17, 38.89, 40.64, 42.39, 44.11, 45.84, 47.64, 49.40, 51.05, 52.94, 54.53, 56.33, 58.02, 59.71, 61.54, 63.10, 64.98, 66.79, 68.49, 70.22, 71.96, 73.76, 75.44, 77.18, 78.92, 80.66, 82.41, 84.14, 85.91, 87.61, 89.36, 91.10, 92.88, 94.60, 96.36, 98.29, 99.77, 101.52, 103.31, 105.03, 106.74, 108.64, 110.26, 111.98, 113.72, 115.55, 117.18, 118.95, 120.66, 122.39, 124.17, 125.93, 127.73, 129.54, 131.35, 133.14, 134.88, 136.67, 138.34, 140.18, 143.70, 145.92, 148.58, 149.91, 151.76, 153.59],
  gates:[16.90, 51.74, 79.58, 112.61, 141.95],   /* 10/28: 天の川 17 秒 (ファンファーレ) / ① 35 秒 / ② 28 秒 / ③ 33 秒 / 銀河の 公転 29 秒 / 太陽に 追いつけ 25 秒 */
  cut:{rev:156.42, white:161.51}};   /* 太陽に 追いつけ (操作 なし): 154.5 秒で 一瞬 静まり 156.42 秒に 大きく 戻る = 当たり / はずれが 分かれる 瞬間、161.51 秒 = 最後の 和音 (当たりは ここで 真っ白)。音の 大きさで 測った (10/28) */
export const LADDER3=WORLDS3.flatMap((w,i)=>w.rival ? [{name:w.rival.name, wi:i, kind:'rival'}] : []);   // 左上の点と「つぎの あいて」= ライバル (②〜④ の 3 つ) (速さの数字は出さない)
export function ctrlLen3(vm){ return Math.max(4, vm*0.5); }   // 3 面の 制御点の 間隔 (m)。秒速 10 m で 5 m = 1 区間 (8 点) 40 m (2 面の ctrlLen は 最低 30 m で 区間が 240 m に なり、4 秒の 広がりを 作れない、10/27)
export function availableKeys3(li, draft){   // その 段で 選べる 世界 (レーン順、選べない 所は null)。できている (ready) 世界だけ、確かめ用 draft では 全部。1 つも 無い 段は 全部 (仮の 世界で 通れる)
  const ks=LAYERS3[li].map(k=>(W3[k].ready || draft) ? k : null); return ks.some(Boolean) ? ks : LAYERS3[li].slice(); }
function rowMove3(def, T, vm){ return def.path && !def.path.times ? pathFor(def.path).len/Math.max(5, T-(def.path.noCalm ? 0 : GATE_CALM)) : vm; }   /* noCalm = 道すじの 終わりが ワープの 輪 (インドの 太陽、10/29) */   // 形の 決まった コース (神殿・インド) は 長さ ÷ 時間、ほかは 一定の 速さ
function layout3(plan){ let s0=plan.length ? plan[0].s0 : 0; for(const o of plan){ o.move=rowMove3(o.def, o.T, plan.vm); o.wi=WORLDS3.indexOf(o.def); o.s0=s0; o.sA=s0+o.lead; o.len=o.lead+o.T*o.move; s0+=o.len; } }   // 行ごとの 速さ・長さ・始まりの 位置 (前の 行の 長さを 足していく)
export function planWorlds(runSec, startLi, vm, music, startS, opt={}){   // 段ごとの 始まりの時刻 t0・進む速さ move・コースの長さ len・始まりの位置 sA (設計書 3.2、10/27 段に)。music (MUSIC3) が使える時 (区切りの数 = 段の数 − 1、最後の区切りが FINISH より前) は 区切り = music.gates、使えない時は 段の 最初の 世界の sec の割合で 伸び縮み。startLi = 確かめ用の 始まりの 段。opt.draft = 全部の 世界を 選べる、opt.pick(li) = 最初から 決める 世界の key (確かめ用 ?w3=)。分かれ道の 段は chosen:false (輪の 手前で レーンで 決める = chooseRow3)
  const n=LAYERS3.length, G= music && music.gates.length===n-1 && music.gates[n-2]<runSec ? music.gates : null, sec=LAYERS3.map(l=>W3[l[0]].sec), k=Math.max(0.3, runSec/sec.reduce((a,b)=>a+b, 0)), t0=[0];
  for(let i=1;i<n;i++) t0.push(G ? G[i-1] : t0[i-1]+sec[i-1]*k);
  const plan=LAYERS3.slice(startLi).map((_,j)=>{ const li=startLi+j, T=Math.max(1, (li<n-1 ? t0[li+1] : Math.max(runSec, t0[li]+1))-t0[li]), choices=availableKeys3(li, opt.draft), one=choices.filter(Boolean).length===1, pk=opt.pick ? opt.pick(li) : null, key= pk && choices.includes(pk) ? pk : one || j===0 ? choices.find(Boolean) : null;   /* 始まりの 段は 決めておく (?world=2 など 分かれ道の 段から 始めた 時、決まって いないと コースが 1 歩も 作れない、10/28) */
    return {li, pi:j, t0:t0[li], T, lead: j===0 ? startS : 0, choices, branch:!one, chosen:!!key, def:W3[key || choices.find(Boolean)], s0:0}; });   /* def = 決まるまでは 仮に 左から 最初の 世界 (長さの 見積もり用) */
  plan.vm=vm; layout3(plan); plan.music=!!G; plan.t0all=t0; return plan; }   /* t0all = 全部の 段の 始まりの 時刻 (?world=6 で 銀河の 段が 無くても 銀河の 遠景の 時計が 分かる) */
export const DOOR3=(NURSERY.room.z1-40-NURSERY.entry.z)*MM3;   // 子ども部屋の 入口から ドアの 板の 内側までの 長さ (霧の 道は ドアを すり抜けて 入る。カメラが ここを 越えたら 部屋を 描く)
export const FOG3_SEC=5;   // 子ども部屋の 回の はじめ: どこを 走って いるか 分からない 霧の 中の 秒 (ドアの 手前の まっすぐな 道。10/28 社長「ワンテンポ」)
export function planNursery3(vm, startS){ const def=W3.nursery, H=def.path, T=pathFor(H), k0=Object.keys(H.times)[0], preV=T.marks[k0]/H.times[k0];   // 霧の 道の 速さ = ドアから 最初の 印までと 同じ (つなぎ目で 速さが 変わらない)
  const plan=[{li:-1, pi:0, t0:FOG3_SEC, T:def.sec, lead:startS, choices:['nursery'], branch:false, chosen:true, def, s0:0, pre:FOG3_SEC*preV, preV}]; plan.vm=vm; layout3(plan); plan.music=false; plan.t0all=[]; return plan; }   // 結果発表の 後の 子ども部屋 & エンディング だけの 並び (時計 0 = 霧の 道の 始まり、FOG3_SEC = ドア = 子ども部屋の 始まり。3 面の 当たりの「つぎへ」、10/28 社長)。pre = ドアの 手前の 霧の 道の 長さ
export function chooseRow3(plan, li, key, lane){ const r=plan.find(o=>o.li===li); if(!r) return null; r.def=W3[key]; r.lane=lane; r.chosen=true; layout3(plan); return r; }   // 分かれ道で 世界を 決める: この 行の 速さ・長さと 後ろの 行の 位置を 決め直す (この 行より 前は 変わらない)。lane = 選んだ レーン (輪の 後で この 線だけが 残って 3 本に 分かれる)
export function lanes3(plan, s, o){ o.cx=0; o.cy=0; o.w=LANE_W3; o.ty=0;   // 3 面の レーンの 並び (コース上の 距離 s): cx・cy = まん中の レーンの 横・上の ずれ (m)、w = 間隔、ty = 横 1 m あたりの 上下 (左が 上)。分かれ道 = 高速道路の ジャンクション (10/28 社長): 輪の 手前 SPREAD3_SEC 秒で 3 本が 上下左右に 離れ、輪の 後は 選んだ 1 本だけが 残って RECONV3_SEC 秒で また 3 本に 分かれる (選ばなかった 線は 別の 世界へ 行った)
  const sm=x=>x*x*(3-2*x);
  for(let i=1;i<plan.length;i++){ const r=plan[i]; if(!r.branch) continue; const spreadL=SPREAD3_SEC*plan[i-1].move, backL=RECONV3_SEC*r.move, before=r.s0-s, after=s-r.s0;
    if(before>0 && before<spreadL){ const e=exit3(plan[i-1].def), u=sm(Math.min(1, (1-before/spreadL)/e.sw)); o.w=LANE_W3+(e.w-LANE_W3)*u; o.ty=-e.h*u/o.w; return o; }
    if(after>=0 && after<backL && r.lane!=null){ const u=sm(after/backL), d=r.lane-1; o.w=FORK3_W+(LANE_W3-FORK3_W)*u; const e=exit3(plan[i-1].def); o.cx=d*(e.w-FORK3_W)*(1-u); o.cy=-d*e.h*(1-u); return o; } }   /* 輪の 後: おばけの いる 線 (選んだ レーン = 同じ 色) は そのまま 続き、ほかの 2 本は FORK3_W 離れた 所から 生えて 広がる (10/28 社長「赤に いたら 分かれた 先でも 赤」。1 点から 3 本 生やすと 色が 重なって 今いる レーンが 分かりにくかった) */
  return o; }
export function rowAt3(plan, t){ let r=plan[0]; for(const o of plan) if(t>=o.t0) r=o; return r; }   // 時刻 t (ステージの時計) の世界 (並びの行)
const RAMP3=2.5;   // 世界が 変わった 後、前の 世界の 速さから この 秒数で 自分の 速さへ なめらかに (10/29 社長: インド (秒速 約 1.7 km) から 銀河 (300 m) へ 輪で 一瞬に 落ちて「大減速」に 見えた)
function endV3(plan, p){ const q=ramp3(plan, p); return q ? q.vc : p.move; }   // その 行を 出る 時の 本当の 速さ (加減速 した 行は vc、Codex 指摘 10/29)
function ramp3(plan, r){ const i=plan.indexOf(r), v1= i>0 ? endV3(plan, plan[i-1]) : r.move, R=Math.min(RAMP3, r.T*0.3); if(Math.abs(v1-r.move)<1e-3 || R<=0) return null; const vc=(r.T*r.move-v1*R/2)/(r.T-R/2); return vc>0 ? {v1, R, vc} : null; }   // v1 = 入る 速さ、vc = 加減速の 後の 速さ (行の 道のりの 合計は 同じ = 次の 輪は 曲の 時刻の まま)
function run3(plan, r, dt){ const p=ramp3(plan, r); if(!p) return r.move*dt; const {v1, R, vc}=p; return dt<=R ? v1*dt+(vc-v1)*dt*dt/(2*R) : v1*R+(vc-v1)*R/2+vc*(dt-R); }   // 行の 始まりから dt 秒で 進む 道のり
function runT3(plan, r, d){ const p=ramp3(plan, r); if(!p) return d/r.move; const {v1, R, vc}=p, dR=v1*R+(vc-v1)*R/2, a=(vc-v1)/(2*R); if(d>=dR) return R+(d-dR)/vc; return Math.abs(a)<1e-9 ? d/v1 : (-v1+Math.sqrt(Math.max(0, v1*v1+4*a*d)))/(2*a); }   // 逆: 道のり d に 着く 秒
export function sAt3(plan, t, plain){ const r=rowAt3(plan, t), H=r.def.path; if(H && H.times && !plain && r.pre && t<r.t0) return (r.org ?? r.s0)+(t-r.t0)*r.preV;   /* 子ども部屋の 回: ドアの 手前の 霧の 道 (一定の 速さで ドアへ) */ return H && H.times && !plain ? Math.max(r.sA, (r.org ?? r.s0)+timedS(pathFor(H).marks, H.times, t-r.t0)) : r.sA+run3(plan, r, t-r.t0); }   /* 子ども部屋 (times の ある行) は 印ごとに 着く時刻で 進み、最後の印 (ベッド) で 止まる。plain = 足りなくて 天の川へ 入った時 (いつもの 一定の速さ = 10/21 のまま)。org = 道の原点の コース上の位置 (最初の行だけ index.html が入れる) */
function timedS(mk, tm, u){ let t0=0, s0=0; for(const k in tm){ const t1=tm[k], s1=mk[k]; if(u<t1) return s0+(s1-s0)*Math.max(0, u-t0)/(t1-t0); t0=t1; s0=s1; } return s0; }   // 印と印の間は 一定の速さ
export function pathMarks3(r){ return r.def.path && r.def.path.times ? pathFor(r.def.path).marks : null; }   // 確かめ用 (?errlog=1 の 印を通った時刻)   // 時刻 t の おばけの位置 (コース上の m、設計書 3.3)。世界が変わる輪 (行の s0) を ちょうど切り替えの時刻に通る
export function tAt3(plan, s){ let r=plan[0]; for(const o of plan) if(s>=o.sA) r=o; return r.t0+runT3(plan, r, s-r.sA); }   // 逆: 位置 s を おばけが通る時刻 (確かめ用の記録、Codex 指摘 10/12: 速さの違う世界をまたいでも 正しく)
/* ② のコース (10/12 社長: 正面から 像を見上げて近づき、らせん状に のぼり、翼を越えて 顔の高さで ワープ)。入口 (原点、+Z へ) から 像の中心 (0, 0, dz) へ まっすぐ → 右へ曲がって らせんに 外から入る → 左回りに のぼる → 顔の高さで 水平 (この先は nextCtrl3 が まっすぐ 輪へ)
   半径 = 各点で 上下 clear 以内の 体から 3 次元で clear 離れる 最小の半径 (sect の 8 方向を 扇形とみなす)。角度の向きに「最大 → 平均 2 回」で なめらかにしても 必ず その半径以上。体へ寄る・膨らむ傾きは beta まで
   高さ = climb の印の間を 水平の道のりに比例 (坂が一定)。assets-warehouse/scans/coursecheck.py が 同じ計算 (数字を変えたら そろえる) */
const DEG=Math.PI/180, pathCache=new WeakMap();
function boxAvg(a, w){ const n=a.length, o=new Float64Array(n); for(let i=0;i<n;i++){ let t=0; for(let j=i-w;j<=i+w;j++) t+=a[Math.max(0, Math.min(n-1, j))]; o[i]=t/(2*w+1); } return o; }   // 前後 w 個の平均 (端は 端の値)
function maxF(a, w){ const n=a.length, o=new Float64Array(n); for(let i=0;i<n;i++){ let m=0; for(let j=Math.max(0, i-w); j<=Math.min(n-1, i+w); j++) m=Math.max(m, a[j]); o[i]=m; } return o; }   // 前後 w 個の最大
function statuePath(H){ if(pathCache.has(H)) return pathCache.get(H);
  const S=H.sect, nb=S.length, hs=H.s, C=H.clear, ry=H.statue.ry, y0=CASTLE.water, st=0.5*DEG, w=Math.round(H.smooth*DEG/st), w2=Math.round(6*DEG/st), wy=Math.round(8*DEG/st), tb=Math.tan(H.beta*DEG)*st, cx=0, cz=H.dz;
  const need=(phi, y)=>{ let r=H.rmin; const k0=Math.max(0, Math.floor((y-C-y0)/hs*nb)), k1=Math.min(nb-1, Math.floor((y+C-y0)/hs*nb));   // 角度 phi・高さ y の点が 体から clear 離れる 最小の半径
    for(let k=k0;k<=k1;k++){ const gap=Math.max(0, y0+k/nb*hs-y, y-y0-(k+1)/nb*hs); if(gap>=C) continue; const ce=Math.sqrt(C*C-gap*gap);   // 上下に離れている分だけ 横は近くてよい
      for(let j=0;j<8;j++){ const R=S[k][j]*hs; if(!R) continue; const a=phi-ry-(j+0.5)*Math.PI/4, D=Math.max(0, Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))-Math.PI/8);   // D = 扇形の外へ 何度はずれているか
        let q; if(D===0) q=R+ce; else if(D>=Math.PI/2) q=ce; else { const r1=ce/Math.sin(D); q= r1*Math.cos(D)<=R ? r1 : R*Math.cos(D)+Math.sqrt(Math.max(0, ce*ce-(R*Math.sin(D))**2)); }
        if(q>r) r=q; } }
    return r; };
  let r0=H.rmin, phiJ=0, N=0, phi=null, r=null, y=null;
  for(let it=0; it<4; it++){   // らせんへ入る角度 phiJ は 最初の半径 r0 で決まり、r0 は らせんの計算で決まる → くり返して そろえる
    phiJ=Math.PI+Math.atan2(H.turn, Math.sqrt(r0*r0+2*H.turn*r0));
    const keys=[[phiJ+20*DEG, 0], ...H.climb.map(([a, f])=>[a*DEG, f*hs])]; N=Math.ceil((keys[keys.length-1][0]-phiJ)/st);
    phi=Float64Array.from({length:N+1}, (_, i)=>phiJ+i*st); if(!r || r.length!==N+1) r=new Float64Array(N+1).fill(r0);
    for(let ps=0; ps<3; ps++){   // 高さ (道のりで決まる) と 半径 (高さで決まる) を 交互に
      const sh=new Float64Array(N+1); for(let i=1;i<=N;i++) sh[i]=sh[i-1]+Math.hypot(r[i]-r[i-1], (r[i]+r[i-1])/2*st);
      const shAt=a=>{ const t=Math.max(0, Math.min(N, (a-phiJ)/st)), i=Math.min(N-1, Math.floor(t)); return sh[i]+(sh[i+1]-sh[i])*(t-i); }, ks=keys.map(([a, v])=>[shAt(a), v]);
      y=new Float64Array(N+1); for(let i=0;i<=N;i++){ const d=sh[i]; let v=ks[ks.length-1][1]; if(d<=ks[0][0]) v=ks[0][1]; else for(let k=1;k<ks.length;k++) if(d<=ks[k][0]){ v=ks[k-1][1]+(ks[k][1]-ks[k-1][1])*(d-ks[k-1][0])/Math.max(1e-6, ks[k][0]-ks[k-1][0]); break; } y[i]=v; }
      y=boxAvg(boxAvg(y, wy), wy);
      r=boxAvg(boxAvg(maxF(phi.map((p, i)=>need(p, y[i])), 2*w), w), w);
      for(let i=1;i<=N;i++) r[i]=Math.max(r[i], r[i-1]*(1-tb)); for(let i=N-1;i>=0;i--) r[i]=Math.max(r[i], r[i+1]*(1-tb));   // 寄る・膨らむ速さの上限 (翼を過ぎて 急に内へ切れ込まない)
      r=boxAvg(boxAvg(maxF(r, 2*w2), w2), w2); }
    r0=r[0]; }
  const pts=[], sp=i=>new THREE.Vector3(cx+r[i]*Math.sin(phi[i]), y[i], cz+r[i]*Math.cos(phi[i])), p0=sp(0), p1=sp(1);
  const al=Math.atan2(-(p1.x-p0.x), p1.z-p0.z), rho=-p0.x/(1-Math.cos(al)), zA=p0.z-rho*Math.sin(al);   // 右へ曲がる角度・半径・曲がり始め (らせんの始まりに ぴったり つながるように 決め直す)
  for(let z=0; z<zA; z+=5) pts.push(new THREE.Vector3(0, 0, z));
  const na=Math.max(2, Math.ceil(rho*al/5)); for(let i=0;i<na;i++){ const t=al*i/na; pts.push(new THREE.Vector3(-rho+rho*Math.cos(t), 0, zA+rho*Math.sin(t))); }
  const iJ=pts.length; for(let i=0;i<=N;i++) pts.push(sp(i));
  const cum=new Float64Array(pts.length); for(let i=1;i<pts.length;i++) cum[i]=cum[i-1]+pts[i].distanceTo(pts[i-1]);
  const find=sl=>{ let lo=0, hi=pts.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=sl) lo=m; else hi=m; } return lo; };
  const T={len:cum[pts.length-1], sJ:cum[iJ], c:new THREE.Vector3(cx, 0, cz),   // 全長 / らせんに入る所までの道のり / 像の中心 (世界の入口の座標)
    at(sl, o){ const s=Math.max(0, Math.min(T.len, sl)), i=find(s), t=(s-cum[i])/Math.max(1e-9, cum[i+1]-cum[i]); return o.copy(pts[i]).lerp(pts[i+1], t); }};   // 道のり sl の位置 (世界の入口の座標)
  pathCache.set(H, T); return T; }
/* ③ 大蛇 (10/14 社長: 顔は 写真のように 天高く): しっぽ (亀の顔の 右前) → 亀のまわりの とぐろ 1 周 (楕円: 亀の頭の前と しっぽを よける、少しずつ上がる) → 前で 起き上がり、塔の上を越える 輪 → 首 → 頭 (天高く、後ろの上)。制御点は 塔の中心 (亀の底の真ん中) からの 模型の単位 (亀の甲羅の半径 = 1、H.s m)。背中の向きは しっぽの側から ねじれの少ない運び方 (とぐろで 上 = 真上)
   おばけのコース (10/14 社長: 速すぎない・下から上へ・20 倍で 上まで): ワープの直後に 大蛇の背中 (しっぽ寄り、とぐろの角度 H.start) へ降りて 少し走り (〜 H.jump) → 亀の甲羅の横へ 跳ぶ → H.route = 大地の下 (象の鼻の外側) をくぐる → 大地の縁を 回り込んで上へ → 須弥山のまわりを 回りながら上る → 太陽の中へ (この先は nextCtrl3 が まっすぐ 輪へ)。速さ = 全長 ÷ ③ の時間 (今の仮の曲では速い。ステージが 約 5 分になれば ゆっくりに)
   世界の入口 = コースの始まり、向き = 最初の水平の進む向き になるよう 塔ごと回して置く (yaw・gpos。indiaWorld が 塔と大蛇を その置き場に) */
const sstep=(a, b, x)=>{ const t=Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };
function loopPath(H){   // ③ インドの コース (10/29 社長の 道すじ 2「見上げる → 蛇を 大きく、尻尾から 胴体を 上り → 亀の 頭を 越え 象の 下を くぐって 反対側へ → 天を 衝く 蛇の 体を 宙返りの ように 駆け上がり 上下 さかさまに → 山の 頂上の 太陽に 突入」・試作): 大蛇の 体も この 道すじに 合わせて 作る。点は Blender で 塔・象・大蛇との 近さを 測って 決めた (大蛇の 背中から 0.06〜0.09・象の 間 0.156)
  const X=H.loop, cp=X.pts.map(p=>new THREE.Vector3(...p)), curve=new THREE.CatmullRomCurve3(cp, false, 'centripetal'), S= X.speed ? X.speed*X.sec/curve.getLength() : H.s;   // S = 模型の 1 (m)。speed が あれば コースを sec 秒で ちょうど speed (m/秒) で 走る 大きさ (10/29 社長「インドも 300 m に 合わせて 世界を 直したい」)
  const bcp=X.body.map(p=>new THREE.Vector3(...p)), bc=new THREE.CatmullRomCurve3(bcp, false, 'centripetal'), Lb=bc.getLength(), N=Math.ceil(Lb/0.02), P=bc.getSpacedPoints(N), Tg=[], U=[], rr=[], sA=[];   // 体 (模型の 単位、0.02 ごと)
  let up=new THREE.Vector3(0, 1, 0);
  for(let i=0;i<=N;i++){ const t=bc.getTangentAt(i/N), c=bc.getUtoTmapping(i/N)*(bcp.length-1), j=Math.min(bcp.length-2, Math.floor(c)); Tg.push(t); up=up.clone().addScaledVector(t, -up.dot(t)).normalize(); U.push(up); sA.push(i/N*Lb); rr.push(X.brad[j]+(X.brad[j+1]-X.brad[j])*(c-j)); }   // 背中の 向きは 前から 順に 引き継ぐ (宙返りの 輪では 輪の 内側を 向く)・太さは 点ごとの brad を なめらかに
  const M=Math.ceil(curve.getLength()*S/3), R=curve.getSpacedPoints(M), Rt=[], RU=[], k=new Float64Array(M+1);   // レール (模型の 単位、3 m ごと)
  for(let i=0;i<=M;i++) Rt.push(curve.getTangentAt(i/M));
  const hv=i=>new THREE.Vector3(Rt[i].x, 0, Rt[i].z), ds=curve.getLength()/M;
  for(let i=1;i<M;i++){ const a=hv(i-1), b=hv(i+1); if(a.lengthSq()>1e-6 && b.lengthSq()>1e-6) k[i]=new THREE.Vector3().crossVectors(a.normalize(), b.normalize()).y/(2*ds); }   // 水平の 曲がり (+ = 左へ)
  const W=Math.round(0.3/ds), cs=new Float64Array(M+2); for(let i=0;i<=M;i++) cs[i+1]=cs[i]+k[i];
  const B=(X.bank ?? 30)*DEG; let ru=new THREE.Vector3(0, 1, 0);
  for(let i=0;i<=M;i++){ const t=Rt[i], a=Math.max(0, i-W), b=Math.min(M, i+W), bk=Math.max(-B, Math.min(B, (cs[b+1]-cs[a])/(b-a+1)*(X.bankK ?? 0.9)))*sstep(0.5, 0.8, Math.hypot(t.x, t.z));   // 傾き = 曲がりの 強さに 比べて (急な 坂・宙返りでは 0)
    ru=ru.clone().addScaledVector(t, -ru.dot(t)).normalize(); RU.push(ru.clone().applyAxisAngle(t, -bk)); }   // レールの 上 = 前から 引き継いだ 上向き (宙返りでは 輪の 内側 = さかさま) を 曲がる 側へ bk 傾けた もの
  const d0=R[1].clone().sub(R[0]).setY(0).normalize(), yaw=Math.atan2(d0.x, d0.z), toRoot=p=>p.clone().sub(R[0]).applyAxisAngle(AXY, -yaw).multiplyScalar(S);
  const pts=R.map(toRoot), cum=new Float64Array(pts.length); for(let i=1;i<pts.length;i++) cum[i]=cum[i-1]+pts[i].distanceTo(pts[i-1]);
  const find=sl=>{ let lo=0, hi=pts.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=sl) lo=m; else hi=m; } return lo; }, frac=(sl, i)=>(sl-cum[i])/Math.max(1e-9, cum[i+1]-cum[i]);
  let iL=0; if(X.look!=null){ let bd=1e9; for(let i=0;i<=M;i++){ const d=R[i].distanceToSquared(cp[X.look]); if(d<bd){ bd=d; iL=i; } } }   // 見上げる 区間の 終わり
  const T={len:cum[pts.length-1], S, yaw, gpos:toRoot(new THREE.Vector3()), body:{P, U, Tg, r:rr, s:sA}, helix:true, headK:X.headK || 1, lookLen:cum[iL],
    at(sl, o){ const s=Math.max(0, Math.min(T.len, sl)), i=find(s); return o.copy(pts[i]).lerp(pts[i+1], frac(s, i)); },
    upAt(sl, o){ const s=Math.max(0, Math.min(T.len, sl)), i=find(s); return o.copy(RU[i]).lerp(RU[i+1], frac(s, i)).normalize().applyAxisAngle(AXY, -yaw); }};
  pathCache.set(H, T); return T; }
function ridePath(H){   // ③ インドの 新しい コース (10/29 社長の 道すじ: 下から 全体を 見上げ → 蛇の 体を 上り → 亀の 頭から 背中を 走り抜け → 象の すき間 (大地の 下) → 半回転 → てっぺんの 太陽へ。大蛇は 前の 形のまま、レールは 空中): H.ride.pts = 道すじの 点 (模型の 単位、Blender で 塔・象・大蛇との 近さを 測って 決めた: 最も 近い 0.067 = 大蛇の とぐろの 上、象の 間 0.156)
  const S=H.s, X=H.ride, old=serpentPath({...H, ride:null}), cp=X.pts.map(p=>new THREE.Vector3(...p));
  const curve=new THREE.CatmullRomCurve3(cp, false, 'centripetal'), M=Math.ceil(curve.getLength()*S/3), P=curve.getSpacedPoints(M), Tg=[], U=[], k=new Float64Array(M+1);   // レール (模型の 単位、3 m ごと)
  for(let i=0;i<=M;i++) Tg.push(curve.getTangentAt(i/M));
  const h=i=>new THREE.Vector3(Tg[i].x, 0, Tg[i].z).normalize(), ds=1/M*curve.getLength();
  for(let i=1;i<M;i++) k[i]=new THREE.Vector3().crossVectors(h(i-1), h(i+1)).y/(2*ds);   // 水平の 曲がり (+ = 左へ、模型の 単位 1 あたりの 角度)
  const W=Math.round(0.3/ds), cs=new Float64Array(M+2); for(let i=0;i<=M;i++) cs[i+1]=cs[i]+k[i];   // 前後 0.3 で ならす
  const B=(X.bank ?? 30)*DEG, v=new THREE.Vector3(), w=new THREE.Vector3();
  for(let i=0;i<=M;i++){ const a=Math.max(0, i-W), b=Math.min(M, i+W), km=(cs[b+1]-cs[a])/(b-a+1), t=Tg[i], bk=Math.max(-B, Math.min(B, km*(X.bankK ?? 0.9)))*sstep(0.5, 0.8, Math.hypot(t.x, t.z));   // 傾き = 曲がりの 強さに 比べて (曲がる 側へ、最大 B)。急な 坂 (水平の 割合 0.5〜0.8 = 37〜60 度) では 弱める (横の 向きが 決まらず 暴れる)
    v.set(0, 1, 0).addScaledVector(t, -t.y).normalize(); w.crossVectors(new THREE.Vector3(0, 1, 0), h(i)); w.addScaledVector(t, -w.dot(t)).normalize();   // 上 と 左 (どちらも 進む 向きと 直角)
    U.push(v.clone().multiplyScalar(Math.cos(bk)).addScaledVector(w, Math.sin(bk)).normalize()); }
  const d0=P[1].clone().sub(P[0]).setY(0).normalize(), yaw=Math.atan2(d0.x, d0.z), toRoot=p=>p.clone().sub(P[0]).applyAxisAngle(AXY, -yaw).multiplyScalar(S);
  const pts=P.map(toRoot), cum=new Float64Array(pts.length); for(let i=1;i<pts.length;i++) cum[i]=cum[i-1]+pts[i].distanceTo(pts[i-1]);
  const find=sl=>{ let lo=0, hi=pts.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=sl) lo=m; else hi=m; } return lo; }, frac=(sl, i)=>(sl-cum[i])/Math.max(1e-9, cum[i+1]-cum[i]);
  let iL=0; if(X.look!=null){ let bd=1e9; for(let i=0;i<=M;i++){ const d=P[i].distanceToSquared(cp[X.look]); if(d<bd){ bd=d; iL=i; } } }   // 見上げる 区間の 終わり (この 点まで カメラは 塔の 真ん中の 方へ)
  const T={len:cum[pts.length-1], S, yaw, gpos:toRoot(new THREE.Vector3()), body:old.body, helix:true, lookLen:cum[iL],
    at(sl, o){ const s=Math.max(0, Math.min(T.len, sl)), i=find(s); return o.copy(pts[i]).lerp(pts[i+1], frac(s, i)); },
    upAt(sl, o){ const s=Math.max(0, Math.min(T.len, sl)), i=find(s); return o.copy(U[i]).lerp(U[i+1], frac(s, i)).normalize().applyAxisAngle(AXY, -yaw); }};   // レールの 上 (曲がる 所で 内側へ 傾く)
  pathCache.set(H, T); return T; }
function serpentPath(H){ if(pathCache.has(H)) return pathCache.get(H); if(H.loop) return loopPath(H); if(H.ride) return ridePath(H);   /* 社長の 道すじ (10/29: loop = 宙返り、ride = 1 つ前) */
  const S=H.s, ax=1.75, az=2.4, R=2.85, LC=new THREE.Vector3(-0.42, 1.6, -0.5);   // とぐろの楕円 (左右・前後) / 輪の 半径と中心
  const ell=a=>new THREE.Vector3(ax*Math.sin(a), 0.2+0.25*(a/DEG-200)/340, az*Math.cos(a)), a0=200*DEG, t0=new THREE.Vector3(ax*Math.cos(a0), 0, -az*Math.sin(a0)).normalize();   // とぐろの点 (角度 a、少しずつ上がる)
  const cp=[ell(a0).addScaledVector(t0, -0.8)];   // しっぽの先 (とぐろの入口の 手前)
  for(let a=200; a<=540; a+=15) cp.push(ell(a*DEG));   // とぐろ (前 → 右 → 後ろ → 左 → 前)
  for(const p of [[-0.25, 0.45, -2.47], [-0.40, 0.46, -2.66], [-0.42, 0.55, -2.95], [-0.42, 0.85, -3.17]]) cp.push(new THREE.Vector3(...p));   // 前で 外へ曲がり、上へ 起き上がる
  for(let a=0; a<=135; a+=15){ const r=a*DEG; cp.push(new THREE.Vector3(LC.x, LC.y+R*Math.sin(r), LC.z-R*Math.cos(r))); }   // 輪 (前 → 塔の上 → 後ろの上)
  const last=cp[cp.length-1]; cp.push(new THREE.Vector3(last.x, last.y-0.8*Math.SQRT1_2, last.z+0.8*Math.SQRT1_2));   // 首 → 頭 (天高く)
  const curve=new THREE.CatmullRomCurve3(cp, false, 'centripetal'), Lb=curve.getLength(), N=Math.ceil(Lb/0.02), P=curve.getSpacedPoints(N), Tg=[], U=[], rr=[], sA=[];   // 中心線 (模型の単位、0.02 ごと) / 進む向き / 背中の向き / 体の太さ / 道のり (模型の単位)
  let up=new THREE.Vector3(0, 1, 0);
  for(let i=0;i<=N;i++){ const t=curve.getTangentAt(i/N); Tg.push(t); up=up.clone().addScaledVector(t, -up.dot(t)).normalize(); U.push(up); sA.push(i/N*Lb); }
  const sE=sA[N]; for(let i=0;i<=N;i++){ const s=sA[i]; rr.push(Math.max(0.02, 0.16*sstep(0, 1.5, s))*(1-0.25*sstep(sE-1.6, sE-0.6, s))); }   // 体の太さ: しっぽの先は 細く → 1.5 で 0.16 → 首で 少し細く
  const at=a=>{ const q=ell(a*DEG); let k=0, b=1e9; for(let i=0;i<=N;i++){ const d=P[i].distanceToSquared(q); if(d<b){ b=d; k=i; } } return k; }, iS=at(H.start), iJ=at(H.jump);   // 背中を走る所 (とぐろの角度 → 中心線の番号)
  const back=i=>P[i].clone().addScaledVector(U[i], rr[i]+20/S);   // 背中の上 (20 m 上。跳び上がる手前で 曲線が 下へ膨らみ 12 m が 約 5 m に縮んだ、Codex 指摘 10/14)
  const cc=[back(iS).addScaledVector(Tg[iS], -0.18).add(new THREE.Vector3(0, 0.04, 0)), back(iS).addScaledVector(Tg[iS], -0.07).add(new THREE.Vector3(0, 0.008, 0))];   // ワープの直後: 背中の 少し上 → 背中の向きに沿って ゆるく 降りる
  for(let i=iS;i<iJ;i+=6) cc.push(back(i)); cc.push(back(iJ), back(iJ).addScaledVector(Tg[iJ], 0.18).add(new THREE.Vector3(0, 0.06, 0)));   // 背中を走り → 背中の向きのまま 跳び上がる
  for(const p of H.route) cc.push(new THREE.Vector3(...p));   // 甲羅の横 → 大地の下 → 縁 → 須弥山 → 太陽
  const ride=new THREE.CatmullRomCurve3(cc, false, 'centripetal'), d0=cc[1].clone().sub(cc[0]).setY(0).normalize(), yaw=Math.atan2(d0.x, d0.z);   // 入口の向き = 最初の進む向き (水平)
  const toRoot=v=>v.clone().sub(cc[0]).applyAxisAngle(AXY, -yaw).multiplyScalar(S);   // 塔の模型の単位 → 世界の入口の座標 (m)
  const pts=ride.getSpacedPoints(Math.ceil(ride.getLength()*S/3)).map(toRoot);   // おばけの レール (3 m ごと)
  const cum=new Float64Array(pts.length); for(let i=1;i<pts.length;i++) cum[i]=cum[i-1]+pts[i].distanceTo(pts[i-1]);
  const find=sl=>{ let lo=0, hi=pts.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=sl) lo=m; else hi=m; } return lo; }, frac=(sl, i)=>(sl-cum[i])/Math.max(1e-9, cum[i+1]-cum[i]);
  const T={len:cum[pts.length-1], S, yaw, gpos:toRoot(new THREE.Vector3()), body:{P, U, Tg, r:rr, s:sA},   // 全長 / 模型の 1 (m) / 塔を回す角度 / 塔の中心 (世界の入口の座標) / 大蛇の体 (模型の単位)
    at(sl, o){ const s=Math.max(0, Math.min(T.len, sl)), i=find(s); return o.copy(pts[i]).lerp(pts[i+1], frac(s, i)); }};   // 道のり sl の位置。レールの上は 世界の入口の上 (真上に向く所が無いので upAt なし)
  pathCache.set(H, T); return T; }
function pathFor(H){ return H.type==='serpent' ? serpentPath(H) : H.type==='nursery' ? nurseryPath() : statuePath(H); }   // 形の決まったコース (② の像のらせん / ③ の大蛇 / ⑤ 子ども部屋)

/* 3 面のコースの作り手 (2 面と同じ「亀」の進み方)。世界の中は legs どおりに曲がり、世界の終わり (= ワープの輪) の前後 GATE_CALM 秒は まっすぐ。世界の終わりを越えた点に 印 'at' (ev.at = 輪のコース上の距離。index.html が 区間を作る時に入れる) */
const _sp=new THREE.Vector3(), _sx=new THREE.Vector3(), _sy=new THREE.Vector3(), _su=new THREE.Vector3(), _sm=new THREE.Matrix4();
export function makeGen3(plan){ const p=new THREE.Vector3(0,0.45,0), q=new THREE.Quaternion(); return {p, q, s:0, w:LANE_W3, plan, pi:0, legI:0, legLeft:0, yawR:0, pitchR:0, entry:{p:p.clone(), q:q.clone()}, pre:(plan[0] && plan[0].pre) || 0}; }   // pre = 最初の 世界の 前の まっすぐな 道 (子ども部屋の 回の 霧の 道)   // entry = いまの世界の入口 (位置と向き)
export function nextCtrl3(g, ctx){   // 次の制御点 (2 面の nextCtrl2 と同じ形で返す)。速さは 作っている世界の速さ (planWorlds の move) を使う (おばけより先を作るため)
  const W=g.plan[g.pi]; if(!W.chosen) return null;   /* 分かれ道で まだ 世界が 決まって いない = コースは 輪の 所で 止める (10/27。決まったら chooseRow3 で 続きを 作る) */
  const vm=W.move, cl=(W.def.path && W.def.path.step) || ctrlLen3(vm), last=g.pi>=g.plan.length-1, nb=g.plan[g.pi+1], rem=W.s0+W.len-g.s, L= !last && rem>0.5 && rem<cl+0.5 ? rem : cl,   /* cl = 点の 間隔 (形の 決まった コースは path.step で 細かく できる: インドの 亀の 鼻先 〜 頭の 山なりが 100〜200 m しか なく、150 m おきでは 角ばって カクカク した、10/29) */ dt=L/Math.max(1, vm), calm=(nb && nb.branch ? Math.max(GATE_CALM, SPREAD3_SEC) : GATE_CALM)*vm;   /* 分かれ道の 手前は 広がる 間 まっすぐ (レールの 並びは lanes3) */   /* 世界の終わりの手前の 1 歩は ちょうど終わりまで (世界が変わる輪を 曲の切り替えの時刻に通る、Codex 指摘 10/12: 越えた所に置くと 0.3 秒遅れた。残りが 0.5 m 以下に なりそうな 時は その 手前の 1 歩を 少し 長く して 必ず ちょうど 止まる = 次の 世界の 入口が いつも 境目、10/29 Codex 指摘: はみ出すと 洞窟の 城壁と 輪が ずれる) */
  const left=W.s0+W.len-g.s, free=(last || left>=calm) && (g.pi===0 || g.s-W.s0>=calm), H=W.def.path;   // free = 輪の前後の まっすぐの所でない
  let moved=false;
  if(H && g.pre>0){ const l=Math.min(L, g.pre); g.pre-=l; _f.set(0,0,1).applyQuaternion(g.q); g.p.addScaledVector(_f, l); g.s+=l; moved=true; if(g.pre<=1e-6){ g.pre=0; g.entry={p:g.p.clone(), q:g.q.clone()}; } }   /* 子ども部屋の 回: ドアの 手前の 霧の 道 (まっすぐ)。終わった 所が 子ども部屋の 入口 */
  else if(H){   /* 形の決まったコース (② 像を見上げて らせんに のぼる / ③ 大蛇の背中): pathFor の道のりどおりに 点を置く。基準 = 世界の入口 g.entry。レールの上の向きは コースが持っていれば それ (③ の宙返り)、なければ 世界の入口の上。終わったら いまの向きのまま まっすぐ 輪へ */
    const T=pathFor(H); if(!g.h) g.h={q0:g.entry.q.clone(), p0:g.entry.p.clone(), up:new THREE.Vector3(0,1,0).applyQuaternion(g.entry.q), sl:0};
    const h=g.h;
    if(h.sl<T.len){ const sl0=h.sl; h.sl=Math.min(T.len, h.sl+L); T.at(h.sl, _sp).applyQuaternion(h.q0).add(h.p0); const d=_sp.clone().sub(g.p), dl=d.length();
      if(dl>1e-6){ d.normalize(); _sx.crossVectors(T.upAt ? T.upAt(h.sl, _su).applyQuaternion(h.q0) : h.up, d).normalize(); _sy.crossVectors(d, _sx); g.q.setFromRotationMatrix(_sm.makeBasis(_sx, _sy, d)); g.p.copy(_sp); g.s+=h.sl-sl0; moved=true; } } }   /* 道のりは 曲線に 沿った 長さで 数える (弦の 長さだと 終わりに 端数が 残り、さらに 1 歩 余分に 進んで 輪が ずれた、Codex 指摘 10/29) */   // 進む向き = 前の点から この点へ。上 = 世界の入口の上 (横転しない)
  else if(free){
    if(g.legLeft<=0){ const lg=W.def.legs[g.legI++%W.def.legs.length]; g.legLeft=lg[0]; g.yawR=lg[1]*D2R; g.pitchR=lg[2]*D2R; }
    g.legLeft-=dt; turn(g, AXY, g.yawR*dt); turn(g, AXX, g.pitchR*dt); }
  if(!moved){ _f.set(0,0,1).applyQuaternion(g.q); g.p.addScaledVector(_f, L); g.s+=L; }
  if(nb && nb.branch && !last){ const dz=exitLift3(W.def, vm, W.s0+W.len-g.s)-exitLift3(W.def, vm, left); if(dz) g.p.addScaledVector(_su.set(0,1,0).applyQuaternion(g.q), dz); }   /* 出口で 3 本 そろって 上がる 世界 (クリスタルの 洞窟の 光る 城壁、10/29) は 中心線ごと 持ち上げる (向きは 変えない = 次の 世界は 上がった 所から 水平に 始まる) */
  let ev=null; if(!last && g.s>=W.s0+W.len-1e-6){ g.pi++; g.legI=0; g.legLeft=0; g.h=null; g.entry={p:g.p.clone(), q:g.q.clone()}; ev={pi:g.pi, p:g.p.clone(), q:g.q.clone(), at:null}; }   // 次の世界の入口 = この点 (位置と向き → 置き物の原点)
  const bk=W.def.bank||0, tb= bk && free ? g.yawR*bk : 0, upv=new THREE.Vector3(0,1,0).applyQuaternion(g.q); g.bank=(g.bank||0)+(tb-(g.bank||0))*0.4; if(Math.abs(g.bank)>1e-4) upv.applyAxisAngle(_f.set(0,0,1).applyQuaternion(g.q), -g.bank);   /* 曲がる 時に レールの 面を 曲がる 側へ 少し 傾ける (def.bank = 1 度/秒の 曲がりあたりの 傾き。光の 都市「ゆっくり 左や 右に 平面を 傾けながら」10/29)。向きと 位置は 変えない = 置き物の 中心線は そのまま */
  return {p:g.p.clone(), up:upv, bend:0, w:g.w, mark: ev ? 'at' : null, ev, spawn:!!ev};
}
export function coursePath3(P, branch){   // コースの 中心線 (10/29 社長「コースの 緩やかな カーブ」): index.html と 同じ 作り手 nextCtrl3 で 世界の 入口 (原点・+Z 向き) から 終わりまで なぞる。branch = 次の 段が 分かれ道 (終わりの まっすぐが 長い)
  const row = { chosen:true, move:P.move, s0:0, len:P.len, def:P.def }, pi = P.pi === 0 ? 0 : 1, st = pi ? 0 : ctrlLen3(P.move);   // 最初の 段 (確かめ用 ?w3= ・?world=) は 入口の まっすぐが 無く、作り手は ctrlLen3 進んだ 所から 数え始める (index.html の addSegment が 最初の 3 点を 持ち越す = org。10/29 これを 知らずに 城壁が 150 m 奥・37 m 横に ずれた)
  const g = { p:new THREE.Vector3(), q:new THREE.Quaternion(), s:st, w:0, plan: pi ? [null, row, { branch }] : [row, { branch }], pi, legI:0, legLeft:0, yawR:0, pitchR:0, entry:{ p:new THREE.Vector3(), q:new THREE.Quaternion() }, pre:0 };   /* entry = 世界の 入口 (形の 決まった コースの 原点、インドの らせん 10/29) */
  const S = [0], C = [new THREE.Vector3()], Q = [new THREE.Quaternion()];
  while(g.pi === pi && S.length < 20000){ nextCtrl3(g); S.push(g.s - st); C.push(g.p.clone()); Q.push(g.q.clone()); }   // S = 入口からの 道のり
  const n = S.length - 1;
  return { S, Q, len:S[n],   /* len = 入口から 出口 (輪) までの 道のり */
    frame(s, p, q){   // 道のり s の 点と 向き (入口の 手前・終わりの 先は まっすぐ 延ばす)
      if(s <= 0 || s >= S[n]){ const i = s <= 0 ? 0 : n; q.copy(Q[i]); return p.set(0, 0, s - S[i]).applyQuaternion(q).add(C[i]); }
      let lo = 0, hi = n; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(S[m] <= s) lo = m; else hi = m; }
      const k = (s - S[lo]) / (S[hi] - S[lo]); q.slerpQuaternions(Q[lo], Q[hi], k); return p.copy(C[lo]).lerp(C[hi], k); },
    near(p, i){ const d = j => C[j].distanceToSquared(p); while(i < n && d(i + 1) < d(i)) i++; while(i > 0 && d(i - 1) < d(i)) i--; return i; } };   // p に 一番 近い 点の 番号 (前の 番号から たどる)
}

/* 世界の景色 (1 つの世界 = 1 つの Scene)。bg = 空 (カメラと一緒に動く。向きは 世界の入口に合わせる)、root = 置き物 (入口 = ワープの輪の所が原点: +Z = 進む向き・+Y = 上・−X = 右)。index.html が いまの世界を レールより先に描き、次の世界を 輪の窓に描く */
const TILT=35*D2R, BAND_STAR=0.07, BAND_GLOW=0.09;   // 天の川の帯の傾き: 入口から見て 前の 35° 上を通り、左右の地平線へ降りる大きな弧 / 帯の太さ (rad、星 ±4° と ぼんやりした光 ±5°。10/8 社長: 大きすぎ → 細く)
function bandLat(u){ return Math.atan(Math.tan(TILT)*Math.sin(2*Math.PI*u)); }   // 空の地図の横 u (0 = 右、0.25 = 前、0.5 = 左、0.75 = 後ろ) での 帯の真ん中の高さ (rad)
function skyTex(sky){ const W=2048, H=1024, c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'), lg=g.createLinearGradient(0, 0, 0, H);   // 空の地図 (正距円筒: 上端 = 真上、下端 = 真下)
  lg.addColorStop(0, sky.top); lg.addColorStop(1, sky.bot); g.fillStyle=lg; g.fillRect(0, 0, W, H);
  if(sky.band>0){ const k=sky.band, gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)/1.5;
    const dot=(u, lat, r, col)=>{ const y=(0.5-lat/Math.PI)*H; g.fillStyle=col; for(const o of [-W, 0, W]){ const x=u*W+o; if(x<-r || x>W+r) continue; g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill(); } };   /* 左右の端は つないで描く */
    for(let i=0;i<1800;i++){ const u=Math.random(); dot(u, bandLat(u)+gauss()*BAND_GLOW, 6+Math.random()*14, `hsla(${215+Math.random()*30},45%,70%,${0.07*k})`); }   // ぼんやりした光 (細かい星は 絵に描くと引き伸ばされて ぼやけるので 光の点 bandStars で)
    if(sky.bulge){ const x=0.3*W, y=(0.5-bandLat(0.3)/Math.PI)*H, rg=g.createRadialGradient(0, 0, 0, 0, 0, 150); rg.addColorStop(0,'rgba(255,236,200,0.6)'); rg.addColorStop(0.4,'rgba(255,200,150,0.25)'); rg.addColorStop(1,'rgba(255,190,140,0)'); g.save(); g.translate(x, y); g.scale(1.7, 0.6); g.fillStyle=rg; g.fillRect(-150, -150, 300, 300); g.restore(); }   // 銀河の中心のふくらみ (前の 少し左)
    if(sky.dust) for(let i=0;i<2600;i++){ const u=Math.random(); dot(u, bandLat(u)+gauss()*0.03+0.02*Math.sin(u*40), 3+Math.random()*9, 'rgba(8,5,16,0.22)'); } }   // 暗い筋 (ちりの帯)
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
function starField(n){ const pos=new Float32Array(n*3), col=new Float32Array(n*3), c=new THREE.Color(), R=80000;   // 遠くの星 (画面の大きさ一定)
  for(let i=0;i<n;i++){ const z=Math.random()*2-1, a=Math.random()*Math.PI*2, r=Math.sqrt(1-z*z); pos.set([Math.cos(a)*r*R, z*R, Math.sin(a)*r*R], i*3); c.setHSL(0.55+Math.random()*0.15, 0.3, 0.7+Math.random()*0.3); col.set([c.r, c.g, c.b], i*3); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3)); geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  const p=new THREE.Points(geo, new THREE.PointsMaterial({size:1.8, sizeAttenuation:false, vertexColors:true, transparent:true, opacity:0.9, depthWrite:false, fog:false})); p.renderOrder=-9; return p; }
/* ① 天の川 (設計書 3 章: 色とりどりの星雲の雲 / 天の川の光の帯 / 眼下に広がる渦巻き銀河、秘書が光と雲で作る。10/8 社長: 始まりから ほかの銀河も見えている) */
function dotTex(){ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'), rg=g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(0.3,'rgba(255,255,255,0.55)'); rg.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=rg; g.fillRect(0, 0, 64, 64); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }   // 光の点 (中心が明るく ふちが透明)
function edgeFade(g, N){ g.globalCompositeOperation='destination-in'; const m=g.createRadialGradient(N/2, N/2, N*0.3, N/2, N/2, N/2); m.addColorStop(0,'rgba(0,0,0,1)'); m.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=m; g.fillRect(0, 0, N, N); g.globalCompositeOperation='source-over'; }   // 絵の外周を 必ず透明に (板の まっすぐな縁が見えないように、Codex 指摘 10/8)
const hexRGB=h=>[1, 3, 5].map(i=>parseInt(h.slice(i, i+2), 16));
export function cloudTex(pal){ const N=256, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'), cs=pal.map(hexRGB);   // 星雲の雲 1 枚: やわらかい丸を重ねた ふぞろいな形 (ふちは透明)。2 色を 1 枚に混ぜて描く (10/8: 色ごとに板を重ねると 画面を何度も塗って重い → 板を 1/3 に)
  for(let i=0;i<34;i++){ const a=Math.random()*Math.PI*2, d=Math.random()*N*0.22, x=N/2+Math.cos(a)*d, y=N/2+Math.sin(a)*d, r=N*(0.12+Math.random()*0.2), k=Math.random(), col=cs[0].map((v,j)=>Math.round(v+(cs[1][j]-v)*k)).join(','), rg=g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0,`rgba(${col},${0.15+Math.random()*0.2})`); rg.addColorStop(1,`rgba(${col},0)`); g.fillStyle=rg; g.fillRect(0, 0, N, N); }
  edgeFade(g, N); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
const NEB_COLS=[['#ff4fa0','#ff9a5c'], ['#4fd8ff','#5a6aff'], ['#b06aff','#ff6ad8'], ['#ffd27a','#ff7a4a'], ['#5affc8','#3a8aff']];   // 星雲の色の組 (赤い水素の雲・青い反射星雲 などを 絵本の色に)
function spiralGalaxy(mobile){   // 渦巻き銀河: 2 本の腕 (対数らせん、外ほど ばらける)・中心のふくらみ (黄色っぽく)・ところどころ桃色 (星の生まれる所)。1 枚の絵を貼った 平らな円盤 + 中心の光 (10/8: 光の点 3 万個だと 社長の PC で 60 → 44〜50 fps。?gal=0 で 60 に戻った → 絵 1 枚に)
  const N= mobile ? 1024 : 2048, HALF=18000, m=N/(2*HALF), R0=1500, R1=17000, B=0.28, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'), col=new THREE.Color();   // 絵の 1 画素 = 約 18 m (スマホ 35 m)
  const at=(x, z)=>[N/2+x*m, N/2+z*m], armPt=()=>{ const r=R0+Math.pow(Math.random(), 0.8)*(R1-R0), th=Math.log(r/R0)/B+((Math.random()*2)|0)*Math.PI+(Math.random()-0.5)*(0.35+0.5*r/R1); return [Math.cos(th)*r+(Math.random()-0.5)*500, Math.sin(th)*r+(Math.random()-0.5)*500, r]; };
  for(let i=0;i<(mobile ? 900 : 1800);i++){ const [x, z]=armPt(), [px, pz]=at(x, z), rr=(300+Math.random()*700)*m, rg=g.createRadialGradient(px, pz, 0, px, pz, rr); rg.addColorStop(0,'rgba(120,150,255,0.10)'); rg.addColorStop(1,'rgba(120,150,255,0)'); g.fillStyle=rg; g.fillRect(px-rr, pz-rr, rr*2, rr*2); }   // 腕の ぼんやりした光
  { const [px, pz]=at(0, 0), rr=3200*m, rg=g.createRadialGradient(px, pz, 0, px, pz, rr); rg.addColorStop(0,'rgba(255,236,200,0.95)'); rg.addColorStop(0.35,'rgba(255,205,150,0.45)'); rg.addColorStop(1,'rgba(255,190,140,0)'); g.fillStyle=rg; g.fillRect(px-rr, pz-rr, rr*2, rr*2); }   // 中心のふくらみ
  for(let i=0;i<(mobile ? 20000 : 40000);i++){ let x, z, pink=false; if(Math.random()<0.15){ const r=Math.pow(Math.random(), 2)*2800, a=Math.random()*Math.PI*2; x=Math.cos(a)*r; z=Math.sin(a)*r; col.setRGB(1, 0.85, 0.6); } else { [x, z]=armPt(); pink=Math.random()<0.04; if(pink) col.setRGB(1, 0.5, 0.75); else col.setHSL(0.58+Math.random()*0.06, 0.55, 0.65+Math.random()*0.3); }   // 星: 中心のふくらみ (黄色) と 腕 (青白、ところどころ桃色)
    col.convertLinearToSRGB(); const [px, pz]=at(x, z); g.fillStyle=`rgba(${col.r*255|0},${col.g*255|0},${col.b*255|0},${pink ? 0.9 : 0.35+Math.random()*0.5})`; g.beginPath(); g.arc(px, pz, (pink ? 1.6 : 0.7+Math.random()*1.3)*N/2048, 0, Math.PI*2); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;   // 斜めから見ても にじまないように
  const grp=new THREE.Group(), disc=new THREE.Mesh(new THREE.PlaneGeometry(2*HALF, 2*HALF).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({map:t, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, forceSinglePass:true}));   /* 絵の色は sRGB に直してから描く (THREE.Color は線形、Codex 指摘 10/8) / 両面でも 1 回で描く */
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex(), color:0xffe2b0, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false})); core.scale.setScalar(5500); core.position.y=300;   // 中心の光 (少し浮かせて ふくらみの厚みに)
  grp.add(disc, core); return grp; }
const NEB_CLEAR0=0.10, NEB_CLEAR1=0.35;   // 画面の真ん中 (コースと輪のある所) から 雲の端までの角度 (rad、約 6°〜20°): これより内側に入った雲は 薄くして消す (10/8 社長: コースの上に来ると 見えにくい → 奥に)
function milkyWay(root, len, opts){   // 置き物を root に足し、毎コマの動きを返す。len = この世界のコースの長さ (m)
  const texs=NEB_COLS.map(p=>[cloudTex(p), cloudTex(p)]), clouds=[], _w=new THREE.Vector3(), _fw=new THREE.Vector3(), n= opts.mobile ? 6 : 9, per= opts.mobile ? 2 : 3;   // 色の組ごとに 絵 2 枚
  if(opts.neb!==false) for(let k=0;k<n;k++){ const ti=k%NEB_COLS.length, cz=len*(0.08+0.84*k/(n-1)), cx=(k%2 ? 1 : -1)*(1800+Math.random()*3000), cy=-800+Math.random()*2400;   // 世界の長さに n か所。左右交互に コースから 中心を 1.8〜4.8 km 離して (板のばらつき込みで 1.2〜5.4 km。コースの上は通らない、10/8 社長)
    for(let j=0;j<per;j++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texs[ti][j%2], transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, rotation:Math.random()*Math.PI*2})), size=900+Math.random()*1500;
      sp.position.set(cx+(Math.random()-0.5)*1200, cy+(Math.random()-0.5)*800, cz+(Math.random()-0.5)*1200); sp.scale.set(size, size, 1); root.add(sp); clouds.push({sp, size, a:0.3+Math.random()*0.2}); } }
  const gal=spiralGalaxy(opts.mobile); gal.position.set(0, -6500, len*0.55); gal.rotation.x=0.22; gal.visible=opts.gal!==false; root.add(gal);   // コースの 6.5 km 下、世界の真ん中あたり (少し傾けて 向こう側も見える)
  return [(cam, dt)=>{ gal.rotateY(dt*0.01); cam.getWorldDirection(_fw);
    for(const o of clouds){ const v=o.sp.getWorldPosition(_w).sub(cam.position), d=Math.max(1, v.length()), edge=Math.acos(Math.min(1, Math.max(-1, v.dot(_fw)/d)))-Math.atan(o.size*0.45/d);   // edge = 画面の真ん中から 雲の端までの角度
      const op=o.a*Math.min(1, Math.max(0, (d-o.size*0.3)/(o.size*0.5)))*Math.min(1, Math.max(0, (edge-NEB_CLEAR0)/(NEB_CLEAR1-NEB_CLEAR0))); o.sp.material.opacity=op; o.sp.visible=op>0.004; } }];   // 銀河は ゆっくり回る。雲は 近づくと薄く・画面の真ん中に入ると薄く。消えた板は 描かない
}
function galaxyTex(arms){   // 遠くの銀河 1 つの絵 (真上から見た 渦巻き。arms 0 = 不規則な雲)。板 (Sprite) の縦横の比と回転で 傾きを出す
  const N=256, h=N/2, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'), rg=g.createRadialGradient(h, h, 0, h, h, h*0.35);
  rg.addColorStop(0, arms ? 'rgba(255,240,210,0.9)' : 'rgba(220,230,255,0.35)'); rg.addColorStop(1,'rgba(255,220,180,0)'); g.fillStyle=rg; g.fillRect(0, 0, N, N);   // 中心の明るい所 (不規則な雲は うすく)
  for(let i=0;i<2500;i++){ let x, y;
    if(arms){ const r=8+Math.pow(Math.random(), 0.7)*(h-14), th=Math.log(r/8)/0.35+((Math.random()*arms)|0)*2*Math.PI/arms+(Math.random()-0.5)*0.5; x=h+Math.cos(th)*r; y=h+Math.sin(th)*r; }
    else { const a=Math.random()*Math.PI*2, r=Math.pow(Math.random(), 0.6)*h*0.8; x=h+Math.cos(a)*r*(1+0.4*Math.sin(a*3)); y=h+Math.sin(a)*r*0.7; }
    g.fillStyle=`rgba(${200+Math.random()*55|0},${210+Math.random()*45|0},255,${0.08+Math.random()*0.2})`; g.beginPath(); g.arc(x, y, 0.8+Math.random()*2.2, 0, Math.PI*2); g.fill(); }
  edgeFade(g, N); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
const FAR_GALAXIES=[[0.17, 18, 9, 0.35, 0.6, 2], [0.42, 28, 3.5, 0.6, -0.4, 2], [0.07, -6, 2.5, 0.8, 1.1, 3], [0.36, -12, 6, 0.75, 0.3, 0], [0.31, -19, 3.5, 0.7, -0.8, 0]];   // 遠くの銀河 [空の横 u (0 = 右、0.25 = 前、0.5 = 左), 高さ (度), 見かけの大きさ (度), 縦の縮み, 回転 (rad), 腕の数 (0 = 不規則な雲)]: 前の右上に 大きなアンドロメダ風 / 小さな渦巻き 2 つ / 前の左下に 大小のマゼラン雲風
function farGalaxies(bg){ const R=75000; for(const [u, lat, deg, sq, rot, arms] of FAR_GALAXIES){ const la=lat*D2R, ph=2*Math.PI*u, cl=Math.cos(la), sz=2*R*Math.tan(deg*D2R/2), sp=new THREE.Sprite(new THREE.SpriteMaterial({map:galaxyTex(arms), transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false, rotation:rot}));
  sp.position.set(-Math.cos(ph)*cl*R, Math.sin(la)*R, Math.sin(ph)*cl*R); sp.scale.set(sz, sz*sq, 1); sp.renderOrder=-8; bg.add(sp); } }   // 並べ方は 空の地図と同じ (u → 横の角度)
function bandStars(n){ const pos=new Float32Array(n*3), col=new Float32Array(n*3), c=new THREE.Color(), R=79000, gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)/1.5;   // 天の川の帯の星: 画面の 1〜2 画素で くっきり (10/8 社長: 絵の星は ぼやけて見えた)。並べ方は 空の地図と同じ (u → 横の角度、bandLat → 高さ)
  for(let i=0;i<n;i++){ const u=Math.random(), lat=bandLat(u)+gauss()*BAND_STAR, ph=2*Math.PI*u, cl=Math.cos(lat); pos.set([-Math.cos(ph)*cl*R, Math.sin(lat)*R, Math.sin(ph)*cl*R], i*3); c.setHSL(0.55+Math.random()*0.12, 0.35, 0.45+Math.random()*0.5); col.set([c.r, c.g, c.b], i*3); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3)); geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  const p=new THREE.Points(geo, new THREE.PointsMaterial({size:1.4, sizeAttenuation:false, vertexColors:true, transparent:true, opacity:0.95, depthWrite:false, fog:false})); p.renderOrder=-9; return p; }
/* ② 星座の神々 = 超巨大な城の大広間 (10/12 社長、同日 像は 1 体を ど真ん中に・広間を 半径 1.35 km・壁 2.2 km に: 神様の世界は 晴れた青空の世界。おばけは水面の上を走る。ワープ先は 城に入ったところから始まる。窓から 青空と差し込む光。超巨大な像が 3 つ。コースは その像の周りを らせん状に のぼっていく)
   丸い大広間 (半径 1 km、壁の高さ 2 km、丸天井のてっぺんに 光の入る穴)。壁は 32 本の柱の間が 背の高いアーチの窓。床は 一面の水。中央に 3 体の像 (背中合わせ、外向き)。コースの らせん (nextCtrl3 の path) の中心 = 像の中心 */
const CASTLE={RH:1350, WH:2200, N:40, pw:90, water:-4, sill:120, top:260};   // 大広間の半径 / 壁の高さ (水面から) / 柱 (窓と窓の間) の数・幅 / 水面 (レールから) / 窓の下の壁の高さ / 窓の上の帯の高さ (m)
function seeded(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15, 1|a); t=t+Math.imul(t^t>>>7, 61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }   // 決まった並びの乱数
function shade(g, lo){ g= g.index ? g.toNonIndexed() : g; if(g.getAttribute('uv')) g.deleteAttribute('uv'); g.computeBoundingBox(); const p=g.attributes.position, b=g.boundingBox, h=Math.max(1e-3, b.max.y-b.min.y), c=new Float32Array(p.count*3);   // 下ほど暗く (影の代わり。高さと大きさが分かる)
  for(let i=0;i<p.count;i++){ const v=lo+(1-lo)*(p.getY(i)-b.min.y)/h; c[i*3]=c[i*3+1]=c[i*3+2]=v; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
function castleGeo(cx, cz){   // 大広間の形 (壁・窓のアーチ・柱・丸天井) を 1 つにまとめる。cx, cz = 中心
  const C=CASTLE, parts=[], y0=C.water, add=(g, lo=0.62, inside=false)=>{ const s=shade(g, lo); if(inside){ const n=s.attributes.normal; for(let i=0;i<n.array.length;i++) n.array[i]=-n.array[i]; } parts.push(s); }, step=2*Math.PI/C.N, R=C.RH;
  add(new THREE.CylinderGeometry(R+70, R+70, C.sill+60, 128, 1, true).translate(cx, y0-60+(C.sill+60)/2, cz), 0.5, true);   // 窓の下の壁 (水の中から)
  add(new THREE.CylinderGeometry(R+70, R+70, C.top, 128, 1, true).translate(cx, y0+C.WH-C.top/2, cz), 0.85, true);         // 窓の上の帯
  add(new THREE.CylinderGeometry(R+40, R+40, 24, 128, 1, true).translate(cx, y0+C.WH-C.top-12, cz), 0.95, true);           // 帯の下の ふち飾り
  for(let i=0;i<C.N;i++){ const a=i*step, sx=Math.sin(a), sz=Math.cos(a), am=a+step/2;
    add(new THREE.BoxGeometry(C.pw, C.WH, 70).rotateY(a).translate(cx+sx*(R+35), y0+C.WH/2, cz+sz*(R+35)), 0.55);   // 窓と窓の間の 壁の柱
    add(new THREE.CylinderGeometry(26, 30, C.WH-C.top-40, 24).translate(cx+sx*(R-40), y0+(C.WH-C.top-40)/2, cz+sz*(R-40)), 0.55);   // 壁の前の 大きな円柱
    add(new THREE.CylinderGeometry(44, 30, 50, 24).translate(cx+sx*(R-40), y0+C.WH-C.top-65, cz+sz*(R-40)), 0.9);   // 円柱の頭の飾り (広がる皿)
    const gw=(2*Math.PI*R/C.N-C.pw)/2; add(new THREE.TorusGeometry(gw, 10, 8, 20, Math.PI).rotateY(am).translate(cx+Math.sin(am)*(R+35), y0+C.WH-C.top-gw, cz+Math.cos(am)*(R+35)), 0.9); }   // 窓の上の アーチ
  add(new THREE.SphereGeometry(R+70, 96, 24, 0, Math.PI*2, 0.10, Math.PI/2-0.10).translate(cx, y0+C.WH, cz), 0.75, true);   // 丸天井 (てっぺんに 光の入る 丸い穴)
  const g=mergeGeometries(parts); for(const p of parts) p.dispose(); return g; }
/* 星座の神々の像 (美術館の本物の彫刻の 3D: Scan The World / MyMiniFactory、assets-warehouse/scans/scan2glb.py で 6 万三角形・高さ 1)。模型は 1 度だけ読み、世界を作るたびに 複製 */
const glbCache=new Map(), gltfLoader=new GLTFLoader();
function loadGLB(path){ if(!glbCache.has(path)) glbCache.set(path, gltfLoader.loadAsync(path).then(g=>g.scene).catch(e=>{ console.warn('像を読めない', path, e); glbCache.delete(path); return null; })); return glbCache.get(path); }
const SUN3=new THREE.Vector3(0.55, 0.2, -0.8);   // ② の日差しの向き = 朝の 低い太陽 (WORLDS3 の sky.sun と同じ、世界の入口の座標。光の焼き付けに使う)
function bakeLight(geo, L, tint=0){   // 光の当たり方を 頂点の色に 焼き付ける (10/12: 1 画素ずつ光を計算する材質だと 画面いっぱいの像と大広間で 20 FPS → 色だけの材質で描く)。明るさ = 空の明るさ (上向きほど明るい) + 日差し (向きが合うほど) × くぼみの陰影 (もとの頂点色)。tint > 0 = もとの頂点色の 色を残して その倍率で明るく (③ の青銅)
  if(!geo.attributes.normal) geo.computeVertexNormals();   /* 面の向きの無い模型でも 焼き付けられるように (Codex 指摘 10/12) */
  const n=geo.attributes.normal, c=geo.attributes.color, out=new Float32Array(n.count*3);
  for(let i=0;i<n.count;i++){ const ny=n.getY(i), d=Math.max(0, n.getX(i)*L.x+ny*L.y+n.getZ(i)*L.z), k=0.6+0.18*ny+0.48*d;
    if(tint && c){ out[i*3]=c.getX(i)*k*tint; out[i*3+1]=c.getY(i)*k*tint; out[i*3+2]=c.getZ(i)*k*tint; } else { const ao= c ? c.getX(i) : 1; out[i*3]=out[i*3+1]=out[i*3+2]=k*ao; } }
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3)); return geo; }
function bigStatue(root, H, c){   // らせんの中心 c に 像を 1 体 (H.statue)。体の縦の線 (axis、模型の x・z) を 中心に合わせ、向き ry・高さ H.s で 水に立てる
  const T=H.statue, g=new THREE.Group(), ay=new THREE.Vector3(0, 1, 0), ax=new THREE.Vector3(T.axis[0], 0, T.axis[1]).applyAxisAngle(ay, T.ry).multiplyScalar(H.s), Lm=SUN3.clone().normalize().applyAxisAngle(ay, -T.ry);   // Lm = 模型の向きで見た 日差し
  g.position.set(c.x-ax.x, CASTLE.water, c.z-ax.z); g.rotation.y=T.ry; g.scale.setScalar(H.s); root.add(g);
  loadGLB(T.glb).then(sc=>{ if(!sc) return; const m=sc.clone(true); m.traverse(o=>{ if(o.isMesh){ o.geometry=bakeLight(o.geometry.clone(), Lm); o.material=new THREE.MeshBasicMaterial({color:0xf8e6d0, vertexColors:true}); o.renderOrder=-1; } }); g.add(m); }); }   // 大理石 (形は 世界ごとに複製して 焼き付け)。大広間より先に描く (像の後ろの壁を 描かずに済む)
function castleWorld(scene, root, P, opts, out){   // 置き物を root に足し、毎コマの動きを返す。out.focus = カメラが向く所 (道のり → root の座標の点)。opts.statue / opts.hall = false で 像 / 大広間を出さない (重さの見比べ ?statue=0・?hall=0)
  const H=P.def.path, T=statuePath(H), c=T.c, cx=c.x, cz=c.z;   // 大広間の中心 = 像の体の線 = らせんの中心 (statuePath)
  if(opts.hall!==false){ const geo=castleGeo(cx, cz); root.add(new THREE.Mesh(bakeLight(geo, SUN3.clone().normalize()), new THREE.MeshBasicMaterial({color:0xf8e8d4, vertexColors:true, side:THREE.DoubleSide}))); }   // 白い大理石の 大広間 (内側から見る。光は焼き付け)
  const wt=waterTex(opts), water=new THREE.Mesh(new THREE.CircleGeometry(CASTLE.RH+80, 128).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({map:wt, color:0xe6dcd4, transparent:true, opacity:0.85, depthWrite:false})); water.position.set(cx, CASTLE.water, cz);   // 床の水 (半透明 = 下の明るい空が透けて 光る水に)
  const R=seeded(1012), ctex=cloudTex(['#fff1e2', '#ffd2b4']);   // 窓の外の 朝日に染まった雲
  for(let i=0;i<26;i++){ const a=R()*Math.PI*2, d=3000+R()*6000, sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex, transparent:true, opacity:0.9, depthWrite:false})), sz=700+R()*1600; sp.position.set(cx+Math.sin(a)*d, 100+R()*2600, cz+Math.cos(a)*d); sp.scale.set(sz*1.6, sz, 1); root.add(sp); }
  if(opts.statue===true) bigStatue(root, H, c);   // 像 (ニケ) は 出さない (10/27 社長「評判が よくなかった、のける」。公開版は 10/23 から なし)。模型は 倉庫 assets-warehouse/scans へ
  out.focus=(sl, o)=>{ const k=Math.min(1, Math.max(0, (sl-0.3*T.sJ)/(0.7*T.sJ+300))); T.at(sl, o); return o.set(cx, o.y+1100*(1-k*k*(3-2*k)), cz); };   // カメラが向く所 (道のり sl の時、root の座標) = 像の体の線の上の コースの高さ + 見上げ (入口では 1,100 m 上 = 見上げて近づく → らせんに入って 300 m で なくなる)
  root.add(water); scene.fog=new THREE.Fog(0xf2dcc8, 2200, 16000);   /* 朝もや = 広間の奥ほど 金色がかって かすむ (大きさが分かる)。光は 焼き付けたので 光源なし */
  return [(cam, dt)=>{ wt.offset.x+=dt*0.004; }];   // さざ波
}
function waterTex(opts){ const N=512, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'); g.fillStyle='#7fc4d8'; g.fillRect(0, 0, N, N);   // 水面: 明るい水色 + 横に細い さざ波の光 (つなぎ目なし)
  for(let i=0;i<260;i++){ const x=Math.random()*N, y=Math.random()*N, l=20+Math.random()*90; g.strokeStyle=`rgba(255,255,255,${0.08+Math.random()*0.16})`; g.lineWidth=1+Math.random()*1.5; for(const o of [-N, 0, N]){ g.beginPath(); g.moveTo(x+o, y); g.lineTo(x+o+l, y); g.stroke(); } }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(20, 20); t.anisotropy=8; return t; }   // 2 km の水面に 100 m ごと
/* ③ インドの宇宙の置き物 (10/13): 塔 (亀・象 8 頭・大地と雲の台と須弥山・太陽、india-cosmos.glb) + 大蛇 (コースの中心線から作る 体と頭)。青銅の色 (緑青) に 光を焼き付けて 色だけの材質で描く (② と同じ 軽い描き方) */
const INDIA_SUN=new THREE.Vector3(0.25, 0.92, 0.3).normalize();   // ③ の光の向き = 昼の高い太陽 (WORLDS3 の sky.sun と同じ、世界の入口の座標)
function scaleTex(){   // 大蛇の うろこ: 半円の鱗を 段違いに重ねた 青銅色の絵 (つなぎ目なし)
  const N=256, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'); g.fillStyle='#5f8676'; g.fillRect(0, 0, N, N);
  const w=32, h=32;   // 段の高さは 絵の高さを 割り切る値 (段違いの周期 64 も 256 を割り切る = 上下も つなぎ目なし、Codex 指摘 10/13)
  for(let row=-1; row<=N/h+1; row++) for(let col=-1; col<=N/w+1; col++){ const x=col*w+(row%2 ? w/2 : 0), y=row*h;
    for(const o of [-N, 0, N]) for(const oy of [-N, 0, N]){ const gr=g.createRadialGradient(x+o, y+oy+h*0.35, 2, x+o, y+oy+h*0.35, w*0.62); gr.addColorStop(0, '#a6cbb8'); gr.addColorStop(1, '#4a695b');
      g.fillStyle=gr; g.beginPath(); g.ellipse(x+o, y+h*0.45, w*0.56, h*0.9, 0, 0, Math.PI); g.fill(); g.strokeStyle='#38503f'; g.lineWidth=1.5; g.stroke(); } }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; }
function serpentMesh(T, tex, L){   // 大蛇の体 (模型の単位、塔と同じ置き場): 中心線に沿って 輪を並べた筒。明るさは 面の向きで焼き付け (L = 模型の向きで見た 日差し)
  const b=T.body, n=b.P.length, seg=32, pos=[], uv=[], col=[], idx=[], nv=new THREE.Vector3(), sd=new THREE.Vector3();
  for(let i=0;i<n;i++){ sd.crossVectors(b.Tg[i], b.U[i]).normalize(); const c=b.P[i], r=b.r[i];
    for(let j=0;j<=seg;j++){ const a=2*Math.PI*j/seg; nv.copy(b.U[i]).multiplyScalar(Math.cos(a)).addScaledVector(sd, Math.sin(a));
      pos.push(c.x+nv.x*r, c.y+nv.y*r, c.z+nv.z*r); uv.push(4*j/seg, b.s[i]/0.25);   // うろこ: 周りに 4 枚・体の太さに合わせた 正方形の絵 (大きさを変えても 形が同じ)
      const k=0.6+0.18*nv.y+0.48*Math.max(0, nv.dot(L)); col.push(k, k, k); } }
  for(let i=0;i<n-1;i++) for(let j=0;j<seg;j++){ const a=i*(seg+1)+j, d=a+seg+1; idx.push(a, d, a+1, a+1, d, d+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({map:tex, vertexColors:true, side:THREE.DoubleSide})); }
function serpentHead(T, tex, L){   // 大蛇の頭 (模型の単位): 首の先に 平たい楕円の頭 + 目 (首の向き・背中の向きに合わせる)
  const b=T.body, n=b.P.length-1, tg=b.Tg[n], up=b.U[n], sd=new THREE.Vector3().crossVectors(up, tg).normalize(), grp=new THREE.Group();   /* 横 = 上 × 前 (逆だと 鏡に映した向きになり 頭の形と向きが首と合わない、Codex 指摘 10/13) */
  const hk=T.headK || 1; grp.position.copy(b.P[n]).addScaledVector(tg, 0.18*hk); grp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sd, up, tg)); grp.scale.setScalar(hk);   /* hk = 頭の 大きさ (らせんの 試作の 細い 体、10/29) */   // 頭の中心 (首の先の 少し先)、向き = 首の向き
  const head=new THREE.SphereGeometry(1, 40, 20).scale(0.16, 0.095, 0.33), snout=new THREE.SphereGeometry(1, 24, 12).scale(0.10, 0.06, 0.14).translate(0, -0.01, 0.26);
  const mat=new THREE.MeshBasicMaterial({map:tex, vertexColors:true}); for(const gg of [head, snout]) grp.add(new THREE.Mesh(bakeLight(gg, L.clone().applyQuaternion(grp.quaternion.clone().invert())), mat));
  for(const s of [-1, 1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 8), new THREE.MeshBasicMaterial({color:0x2a3a30})); e.position.set(s*0.13, 0.04, 0.10); grp.add(e); }   // 目
  return grp; }
function indiaWorld(scene, root, P, opts, out){   // 置き物を root に足す。out.focus = カメラが向く所 (塔の真ん中)
  const H=P.def.path, T=serpentPath(H), K=P.def.cosmos, S=T.S, g=new THREE.Group(), Lm=INDIA_SUN.clone().applyAxisAngle(AXY, T.yaw);   // Lm = 模型の向きで見た 日差し
  g.position.copy(T.gpos); g.rotation.y=-T.yaw; g.scale.setScalar(S); root.add(g);   // 塔と大蛇 (模型の単位 → m)。コースの始まり = 世界の入口 に合わせて 回して置く
  loadGLB(K.glb).then(sc=>{ if(!sc) return;
    const mat=new THREE.MeshBasicMaterial({vertexColors:true}), bk=o=>bakeLight(o.geometry.clone(), Lm, 1.25);   // 青銅の色を残して 光を焼き付け (少し明るく)
    const mat2=new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.DoubleSide}); mat2.onBeforeCompile=s=>{ s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  if(!gl_FrontFacing) diffuseColor.rgb *= 0.3;'); };   /* 亀の 甲羅は 外側だけの 面 → 鼻先の 近くから 甲羅の 中を のぞくと 向こうが 透けた (10/29 社長「甲羅の 隙間から 向こうの 風景が 見える」) → 内側も 描き、内側は 暗い 影の 色 */
    for(const nm of ['turtle', 'land']){ const o=sc.getObjectByName(nm); if(o && o.isMesh) g.add(new THREE.Mesh(bk(o), nm==='turtle' ? mat2 : mat)); }
    const el=sc.getObjectByName('elephant');
    if(el && el.isMesh){ const im=new THREE.InstancedMesh(bakeLight(el.geometry.clone(), AXY, 1.25), mat, K.place.length), m4=new THREE.Matrix4(), q=new THREE.Quaternion();   // 象は 1 頭の形を 8 回描く。光は 真上から (1 頭に焼き付けてから回すので、横からの光だと 明るい面が 向きと一緒に回る、Codex 指摘 10/13)
      K.place.forEach(([x, y, z, yaw, s], i)=>im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(AXY, yaw), new THREE.Vector3(s, s, s)))); im.computeBoundingSphere(); g.add(im); }
    const su=sc.getObjectByName('sun');
    if(su && su.isMesh && T.helix){ const sg=su.geometry.clone(); sg.computeBoundingSphere(); const c=sg.boundingSphere.center.clone(), cp=coursePath3(P, opts.nextBranch!==false), e=new THREE.Vector3(), eq=new THREE.Quaternion(); sg.translate(-c.x, -c.y, -c.z); cp.frame(cp.len, e, eq);   /* らせんの 試作: 太陽 = ゴール (ワープの 輪の 所、大蛇の 頭の 向きの 先)。正面 (模型の +Z) を 来る 向きへ */
      const sun=new THREE.Mesh(sg, new THREE.MeshBasicMaterial({color:0xffd27a, side:THREE.DoubleSide})); sun.scale.setScalar(S); sun.position.copy(e); sun.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1).applyQuaternion(eq)); root.add(sun);
      const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex(), color:0xffc860, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false})); glow.position.copy(e); glow.scale.setScalar(1.1*S); root.add(glow); }
    else if(su && su.isMesh){ const sg=su.geometry.clone(); sg.computeBoundingSphere(); g.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({color:0xffd27a})));   // 太陽 (金色に光る)
      const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex(), color:0xffc860, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false})); glow.position.copy(sg.boundingSphere.center); glow.scale.setScalar(1.1); g.add(glow); }
  });
  const tex=scaleTex(); g.add(serpentMesh(T, tex, Lm), serpentHead(T, tex, Lm));
  const R=seeded(1013), ctex=cloudTex(["#ffffff", "#f2f7ff"]), C=T.gpos;   // 白い雲 (塔の大きさに合わせる): 塔の下の 雲の海 (30) と 遠くの空の雲 (14)
  for(let i=0;i<44;i++){ const low=i<30, a=R()*Math.PI*2, d=((low ? 2.8 : 3)+R()*(low ? 3.6 : 4))*S,   /* 雲の 海は 塔の 真下を 空ける (とぐろの 外 2.5 より 外、10/29) */ sz=((low ? 1.2 : 1)+R()*1.6)*S, sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex, transparent:true, opacity:0.95, depthWrite:false}));
    sp.position.set(C.x+Math.sin(a)*d, C.y+(low ? -2.7-R()*0.6 : 0.5+R()*3.5)*S, C.z+Math.cos(a)*d);   /* 雲の 海は とぐろ・しっぽ (高さ −1.6 まで) より 下へ (前は −0.7〜−1.2 で 大蛇と 亀の 下に かかって 白く 見えた、10/29 社長) */ sp.scale.set(sz*1.7, sz*(low ? 0.6 : 1), 1); root.add(sp); }
  scene.fog=new THREE.Fog(0xd8ecff, 6*S, 30*S);   /* 昼の もや = 遠くが 白く かすむ (塔は くっきり) */
  const F=new THREE.Vector3(0, 1.7*S, 0).applyAxisAngle(AXY, -T.yaw).add(C); if(!T.helix) out.focus=(sl, o)=>o.copy(F); else if(T.lookLen) out.focus=(sl, o)=>sl<T.lookLen ? o.copy(F) : null;   // 塔の真ん中 (社長の 道すじ 10/29: 最初の 見上げる 間だけ、その 後は なし = カメラは コースの 先を 見る、縦持ちで 先が 見える ように)
  return []; }
export function buildWorld(P, opts){   // P = planWorlds の 1 行、opts = {mobile, neb, gal} (neb/gal = false で 星雲・眼下の銀河を出さない: 重さの見比べ用 ?neb=0・?gal=0)
  const def=P.def, scene=new THREE.Scene(), bg=new THREE.Group(), root=new THREE.Group(), ticks=[], out={focus:null};   // out.focus = カメラが向く所 (② だけ: 道のり → root の座標の点)
  const dome=new THREE.Mesh(new THREE.SphereGeometry(90000, 64, 32), new THREE.MeshBasicMaterial({map:skyTex(def.sky), side:THREE.BackSide, depthWrite:false, fog:def.look==='nursery'})); dome.renderOrder=-10;   /* 子ども部屋は 霧の 中から 晴れる (空も 霧の 色に、10/28 社長) */
  bg.add(dome); if(!def.sky.day && def.sky.stars!==false) bg.add(starField(opts.mobile ? 1500 : 3000)); if(def.sky.band>0) bg.add(bandStars(Math.round(def.sky.band*(opts.mobile ? 5000 : 10000)))); scene.add(bg, root);   // 昼の空 (② の青空) は 星なし
  if(def.sky.sun){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex(), color:0xfff6d8, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false})); s.position.set(...def.sky.sun).normalize().multiplyScalar(70000); s.scale.setScalar(9000); s.renderOrder=-8; bg.add(s); }   // 太陽 (空の向き [x, y, z])
  if(def.look==='milkyway'){ ticks.push(...milkyWay(root, P.len, opts)); farGalaxies(bg); }   // ① 天の川の置き物 と 空の ほかの銀河
  if(def.look==='castle') ticks.push(...castleWorld(scene, root, P, opts, out));   // ② 城の大広間 と 3 体の像 (10/12)
  if(def.look==='india') ticks.push(...indiaWorld(scene, root, P, opts, out));   // ③ 亀と象の塔 と 大蛇 (10/13)
  if(def.look==='nursery') ticks.push(...nurseryWorld(scene, root, P, opts, out));   // ⑤ 子ども部屋 (10/22。天井なしの 部屋の中、夜)
  if(def.mod) ticks.push(...def.mod.build(scene, root, P, opts, out)); else if(!def.look) ticks.push(...buildDraft(scene, root, P, opts, out));   // 分かれ道の 新しい 世界 (worlds/<key>.js、10/27) / まだ 無い 世界は 仮の 世界 (確かめ用)
  return {P, scene, bg, root, placed:false, focus:out.focus, nursery:out.nursery, frame:out.frame, cine:out.cine, exitP:out.exitP,
    tick(cam, dt, portal){ bg.position.copy(cam.position); for(const f of ticks) f(cam, dt, portal); },   // portal = 輪の 窓の 中に 描いて いる (次の 世界)
    dispose(){ out.dead=true; scene.traverse(o=>{ if(o.isInstancedMesh) o.dispose(); if(o.geometry && !o.isSprite) o.geometry.dispose(); for(const m of (o.material ? [].concat(o.material) : [])){ if(m.map) m.map.dispose(); if(m.alphaMap) m.alphaMap.dispose(); m.dispose(); } }); } };   /* 光の板 (Sprite) の形は three.js 全体の共用なので 捨てない。alphaMap も 片づける (銀河の 窓の 円い ぼかし、Codex 指摘 10/29) */
}
