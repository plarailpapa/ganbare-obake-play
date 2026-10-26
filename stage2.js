// がんばれおばけ！ 2 面 (宇宙・惑星レース) の「計算と表」。画面・曲・相手の仕組みは index.html (import * as S2 from './stage2.js')
// 設計書: younglion/docs/superpowers/specs/2026-09-30-ganbare-obake-stage2-design.md
import * as THREE from 'three';

export const V2_START = 1500/3.6;            // 2 面の走り出し (m/s)。地球の自転 1,360 km/h の少し上の きりのいい数 (10/26 社長: 定量の加速に合わせて 1,500 km/h)
export const LANE_W2 = 10;                   // レール間隔 (m)。断面が円になると 半径 = 3×10/2π ≒ 4.8 m (10/1: 輪を大きくするため 8 → 10)
const CTRL_MIN = 30, CTRL_SEC = 0.12;        // 制御点の間隔 = 0.12 秒ぶん (最低 30 m)。速いほど広げて 1 秒に作る区間の数を抑える
const CRUISE_TURN = 0.12;                    // 巡航中の曲がり (rad/秒)
const STRAIGHT_FROM = 50000/3.6, STRAIGHT_FADE = 10000/3.6;   // 時速 4 万 km から 曲がりを弱め、5 万 km から まっすぐ (10/1 社長。惑星のそばの弧は別)
const MORPHS=[[0.5,8],[-0.6,8],[0,12]];   // [断面の曲がり, 秒]: ハーフパイプ → 丸い背 → 平ら (パイプの内側は 海王星で使うので外す。チューブの外側も 左右のレーンの おばけが 画面から消えるので外す、10/5 社長)。土台の確認用に順に巡る (使いどころは惑星ごとの便で決め直す)
const BEND_SEC = 2.5, W_MIN = 9, W_MAX = 14, W_RATE = 2;   // 断面が 0→1 に変わる秒数 / 平らな時のレール間隔の範囲 (m。輪は間隔の半分なので 小さくしすぎない) / 間隔の変わる速さ (m/秒)

/* 断面: レール面の上の横位置 x (m、弧の長さ) → 断面の中の位置 (x, y) と 面の向き (nx, ny)。
   bend 0 = 平ら / +1 = 内側へ曲がって 3 本が円を 3 等分 (パイプの内側) / −1 = 外側へ丸まる (チューブの外側)。間の値は その途中の形 */
export function profilePos(x, bend, w, out){
  const c=bend*(2*Math.PI/3)/w;              // 曲がり (1/半径)。レール 1 本ぶん (w) が 円周の 1/3 になると 円が閉じる
  if(Math.abs(c)<1e-6){ out.x=x; out.y=0; out.nx=0; out.ny=1; return out; }
  const a=x*c; out.x=Math.sin(a)/c; out.y=(1-Math.cos(a))/c; out.nx=-Math.sin(a); out.ny=Math.cos(a); return out;
}

/* 宇宙のコースの作り手: 向き (クォータニオン) を持った「亀」が 1 点ずつ進む。上向きも一緒に回るので 上下斜め・ループ・横転ができる */
const _f=new THREE.Vector3(), _dq=new THREE.Quaternion(), AXX=new THREE.Vector3(1,0,0), AXY=new THREE.Vector3(0,1,0);
function turn(g, axis, ang){ if(ang) g.q.multiply(_dq.setFromAxisAngle(axis, ang)); }   // 自分の向きを基準に回す (x = 機首を下げる、y = 左右、z = 横転)
export function ctrlLen(vm){ return Math.max(CTRL_MIN, vm*CTRL_SEC); }   // 制御点の間隔 (m)。始まりの持ち越し点も これに合わせる (間隔が急に変わると 曲線が後ろへ折り返す、Codex 指摘 10/1)
/* 惑星イベント: 近づく (まっすぐ) → そばを飛ぶ弧 (惑星の中心の周りの円) → 離れる (まっすぐ)。惑星は おばけから見て 下・上・左・右 のどれか (10/2 社長: 全部「下」で同じに見えた) */
const APP_SEC=9, DEP_SEC=2, GAP_SEC=4.5, FAST_START=0.8, ORBIT_MIN=5.5;   // 近づく (遠くの点から 9 秒) / 離れる / 次までの最低の間 (秒。ワープ 2.5 秒 + 少し、10/1 社長: 惑星どうしの遠さ)。速さが惑星の 80% で 専用コースへ (10/5 社長)。ORBIT_MIN = 専用コースを 最低 何秒 回るか (速い人も 見せ場が一瞬で終わらないように。始まった時の速さで 5.5 秒ぶん = その後 加速するので 実際は 約 4 秒、Codex 指摘 10/5)
export const PREVIEW2=0.6;   // 惑星が 遠くに見え始める速さ (公転速度の 60%、10/5 社長)。80% で 専用コース、100% で 抜く
const SIZE_DIV=35, HOVER2=3000;   // 惑星の大きさ = 本物の半径 ÷ 35 (10/2 社長: 本物どおりの比率。木星 ≒ 2,000 km が 遠景の描画距離 5,000 km に収まる上限) / そばを飛ぶ高さ (m、全惑星で同じ → 小さい星ほど足元に丸く見える)
export function planetR(def){ return def.rkm*1000/SIZE_DIV; }   // ゲームの半径 (m)
export const PLANET_SEG=128;   // 惑星の球の分割 (横)。レールを隠す見えない球も 同じ分割・同じ向きにして ふちを揃える (木星では 分割の角の凹みが km 単位になるため、Codex 指摘 10/2)
const SIDES={below:{u:-1, r:0, ax:AXX, sg:1}, above:{u:1, r:0, ax:AXX, sg:-1}, left:{u:0, r:-1, ax:AXY, sg:1}, right:{u:0, r:1, ax:AXY, sg:-1}};   // 惑星の見える側 → 中心の向き (上 u・右 r) と 弧の曲がり方 (下 = 機首を下げて外回り / 上 = 機首を上げて内回り、惑星が頭上 / 左右 = 横へカーブ)。コースを横転させると カメラも一緒に回って いつも「下」に見えるため、曲がる向きで変える
const RR={r:1.75, h:500, dive:6*Math.PI/180, lev:1.5, lift:10*Math.PI/180};   // 土星の環を走る (10/2 社長): 走る所の半径 (R の倍、B 環の真ん中) / 環の面からの高さ (m、300 では環に張り付いて見えた → 500、10/2 社長) / 滑り降りる角度 / 着地で機首を起こす秒 / 浮き上がる角度
function startRingRun(g, P, vm, L){   // 土星: 環の面へ滑り降り、土星を横に見ながら 周回の向きに走り、浮き上がって離れる
  const R=planetR(P), rr=R*RR.r, sd=SIDES[P.from]||SIDES.left;
  const nA=Math.max(3, Math.round(APP_SEC*vm/L)), nLev=Math.max(1, Math.min(nA-1, Math.round(RR.lev*vm/L))), nD=Math.max(2, Math.round(DEP_SEC*vm/L));
  const q=g.q.clone(), p=g.p.clone(), dq=new THREE.Quaternion().setFromAxisAngle(AXX, -RR.dive/nLev), v1=new THREE.Vector3();
  for(let k=0;k<nA;k++){ if(k>=nA-nLev) q.multiply(dq); p.addScaledVector(v1.set(0,0,1).applyQuaternion(q), L); }   // 近づく道のりを 作り手 (eventStep) と同じ回し方で 先に計算 → 着地の点 p と向き q (最後の nLev 点で 機首を起こして水平に)
  const f=new THREE.Vector3(0,0,1).applyQuaternion(q), up=new THREE.Vector3(0,1,0).applyQuaternion(q), r1=new THREE.Vector3().crossVectors(f, up), toC=new THREE.Vector3().addScaledVector(up, sd.u).addScaledVector(r1, sd.r);   // 環の面の上 = 着地した時の上 (滑り降りてきた向きは 面に対して dive だけ下向き)
  const delta=2*Math.asin(Math.min(1, L/(2*rr))), nF=Math.max(3, Math.round(ORBIT_MIN*vm/L));   /* 弧は 最低 ORBIT_MIN 秒。その後は 公転速度に届くまで 回し続ける (eventStep) */
  const center=p.clone().addScaledVector(toC, rr).addScaledVector(up, -RR.h), anchor=p.clone().addScaledVector(up, -RR.h);   // 土星の中心 = 走る円の中心の RR.h (500 m) 下 (環の面)。遠くの点の基準 = 着地点の真下の環
  const h=nF*delta/2, sunDir=new THREE.Vector3().addScaledVector(up, 0.8).addScaledVector(toC, -0.6*Math.cos(h)).addScaledVector(f, 0.6*Math.sin(h)).normalize();   // 太陽: 環の面の上から (環の北の面と 土星の こちら側が明るい)
  g.ev={def:P, idx:g.next, center, pArc:p, fwd:f, up, anchor, ringH:RR.h, R, sunDir, L, nA, nF, nD, nLev, dive:RR.dive, lift:RR.lift, midAtExit:true, kExit:0, ax:sd.ax, sg:sd.sg, delta, k:0, phase:'app', app:null, arc0:null, mid:null, arc1:null, end:null};
  g.next++; g.bendTo=0; g.bendRate=Math.max(Math.abs(g.bend)/(APP_SEC*0.5), 1e-6); return g.ev;
}
const CD={dive:25*Math.PI/180, lev:1.5, depth:8000, dep:4, lift:40*Math.PI/180, liftPart:0.25, margin:2500};   // 海王星の雲に突っ込む (10/4 社長): 降りる角度 / 水平に戻す秒 / 雲の中の深さ (m) / 離れる秒 / 飛び出す角度 / 角度を付ける割合 (離れる最初の 1/4) / 雲の上の余裕 (m、遅い時も 雲の上から入って 雲の上へ出るように)
const DAWN={dep:5, up:60*Math.PI/180, lift:2.0};   // 水星の夜明け (10/5 社長): 離れる秒 (特別カメラの間) / 太陽を 進む向きより上へ (10° では 特別カメラから 半周の軌跡が 真横から見えて つぶれた → 60° = ほぼ半円。ふだんの画面では 太陽は上の外、10/5 社長) / 抜いた後 太陽の方へ 機首を上げる秒 (外から内へ来たので 次は太陽へ、10/5 社長。遠くの絵でも 曲がるのが見えるよう 2 秒)
function startCloudDive(g, P, vm, L){   // 海王星: 大暗斑に向かって 斜めに雲へ突っ込み、雲の中を 惑星に沿って走り、上へ飛び出す
  const R=planetR(P), rho=R-CD.depth, sd=SIDES[P.from]||SIDES.below;
  const nLev0=Math.max(1, Math.round(CD.lev*vm/L)), nA=Math.max(3, Math.round(APP_SEC*vm/L), nLev0+Math.ceil((CD.depth+CD.margin)/(L*Math.sin(CD.dive)))), nLev=Math.min(nA-1, nLev0), nD=Math.max(4, Math.round(CD.dep*vm/L), Math.ceil((CD.depth+CD.margin)/(L*0.55))), nLift=Math.max(1, Math.round(nD*CD.liftPart));   /* 遅い時は 降りる道・上る道を 伸ばす (潜る深さ + 余裕 を 降り切れる長さ・上り切れる長さ、Codex 指摘 10/4) */
  const q=g.q.clone(), p=g.p.clone(), dq=new THREE.Quaternion(), v1=new THREE.Vector3(), path=[];
  for(let k=0;k<nA;k++){ if(k>=nA-nLev) q.multiply(dq.setFromAxisAngle(AXX, -CD.dive/nLev)); p.addScaledVector(v1.set(0,0,1).applyQuaternion(q), L); path.push(p.clone()); }   // 近づく道 (作り手と同じ回し方。最後の nLev 点で 起こして水平に)
  const f=new THREE.Vector3(0,0,1).applyQuaternion(q), up=new THREE.Vector3(0,1,0).applyQuaternion(q), r1=new THREE.Vector3().crossVectors(f, up), toC=new THREE.Vector3().addScaledVector(up, sd.u).addScaledVector(r1, sd.r);
  const center=p.clone().addScaledVector(toC, rho), delta=2*Math.asin(Math.min(1, L/(2*rho))), nF=Math.max(3, Math.round(ORBIT_MIN*vm/L));   /* 弧は 最低 ORBIT_MIN 秒。その後は 公転速度に届くまで 回し続ける (eventStep) */   // 弧 = 表面の 8 km 下 (雲の中) を 惑星に沿って
  let kIn=nA-2; for(let k=0;k<nA-1;k++) if(path[k].distanceTo(center)<R){ kIn=Math.max(1, k); break; }   // 雲に入る点 (近づく道が 表面より下になる最初の点)
  const spotN=path[kIn].clone().sub(center).normalize();   // 大暗斑を向ける所 (雲に入る点の真下)
  const h=nF*delta/2, sunDir=new THREE.Vector3().addScaledVector(r1, 0.8).addScaledVector(toC, -0.6*Math.cos(h)).addScaledVector(f, 0.6*Math.sin(h)).normalize();
  g.ev={def:P, idx:g.next, center, pArc:p, inP:path[kIn].clone(), fwd:f, R, sunDir, L, nA, nF, nD, nLev, dive:CD.dive, lift:CD.lift, nLift, kIn, pipe:true, inPipe:false, midAtExit:true, spotN, ax:sd.ax, sg:sd.sg, delta, k:0, phase:'app', app:null, arc0:null, mid:null, arc1:null, end:null};
  g.next++; g.bendTo=0; g.bendRate=Math.max(Math.abs(g.bend)/(APP_SEC*0.5), 1e-6); return g.ev;
}
function maybeStartEvent(g, ctx, L){   // 巡航中に 次の惑星のイベントを始めるか決め、始めるなら 形 (惑星の中心・半径・太陽の向き) を決める
  if(g.ev || g.next>=PLANETS2.length || ctx.hold) return null;   /* 前の惑星の 特別カメラ・ワープが 終わるまで 次を始めない (作り手は 少し先を作るので 始めると 近づく 9 秒が 見せる前に過ぎて 急に現れた、10/5 社長) */
  const P=PLANETS2[g.next], vm=Math.max(1, ctx.vm);
  if(g.s-g.lastEvEnd < GAP_SEC*vm) return null;
  const fast= ctx.v>=P.ms*FAST_START;   /* 惑星は 自分の速さで追いついた時だけ (10/5 社長: 腕前のレース。曲の予定に遅れても 連れていかない = 追い風なし) */
  if(!fast) return null;
  if(P.course==='ringrun') return startRingRun(g, P, vm, L);
  if(P.course==='dive') return startCloudDive(g, P, vm, L);
  const R=planetR(P), rho=R+HOVER2, delta=2*Math.asin(Math.min(1, L/(2*rho)));   // 弧 = 半径 rho の円に内接する多角形 (制御点が円の上に乗る)。半径は惑星の大きさで決まる (10/2)。角度は 公転速度に届くまで 回し続けるので 決めない (10/5)
  const nA=Math.max(3, Math.round(APP_SEC*vm/L)), nF=Math.max(3, Math.round(ORBIT_MIN*vm/L)), nD=Math.max(2, Math.round(DEP_SEC*vm/L)), sd=SIDES[P.from]||SIDES.below;   /* 弧は 最低 ORBIT_MIN 秒。その後は 公転速度に届くまで 回し続ける (eventStep、10/5 社長) */
  const f=new THREE.Vector3(0,0,1).applyQuaternion(g.q), u1=new THREE.Vector3(0,1,0).applyQuaternion(g.q), r1=new THREE.Vector3().crossVectors(f, u1), toC=new THREE.Vector3().addScaledVector(u1, sd.u).addScaledVector(r1, sd.r);   // toC = 弧の始まりから 惑星の中心への向き
  const pArc=g.p.clone().addScaledVector(f, nA*L), center=pArc.clone().addScaledVector(toC, rho);   // 近づく間は まっすぐ → 弧の始まり。惑星の中心は そこから toC へ rho
  let sunDir, dawn=null;
  if(P.course==='dawn'){ const axW=sd.ax.clone().applyQuaternion(g.q), th=sd.sg*nF*delta, fD=f.clone().applyAxisAngle(axW, th), uD=u1.clone().applyAxisAngle(axW, th), nE=toC.clone().negate().applyAxisAngle(axW, th);   /* 水星: 弧の出口 (回し終えた向き) の 進む向き・上・外向き。作り手と同じく 合計 nF·δ 回す */
    const tS=new THREE.Vector3().crossVectors(nE, fD).normalize(); if(tS.dot(uD)<0) tS.negate();   /* 持ち上げる向き = 地平線に沿った横向き (上・下の側では 上と外向きが重なるため、Codex 指摘 10/5。右・左では 上と同じ) */
    sunDir=fD.multiplyScalar(Math.cos(DAWN.up)).addScaledVector(tS, Math.sin(DAWN.up)).normalize(); dawn={nD:Math.max(2, Math.round(DAWN.dep*vm/L)), midAtExit:true, kExit:0, lift:DAWN.up, nLift:Math.max(1, Math.round(DAWN.lift*vm/L))};
    const q2=g.q.clone(), p2=pArc.clone(), dq=new THREE.Quaternion(), v1=new THREE.Vector3();   /* 機首を上げ終えた点 (= 太陽へ まっすぐ向かう線の上) を 作り手と同じ回し方で先に計算 → 特別カメラ「たいよう」は この線の真後ろに置く */
    for(let k=0;k<nF;k++){ q2.multiply(dq.setFromAxisAngle(sd.ax, sd.sg*(k===0 ? delta/2 : delta))); p2.addScaledVector(v1.set(0,0,1).applyQuaternion(q2), L); }
    for(let k=0;k<dawn.nLift;k++){ if(k===0) q2.multiply(dq.setFromAxisAngle(sd.ax, sd.sg*delta/2)); q2.multiply(dq.setFromAxisAngle(AXX, -DAWN.up/dawn.nLift)); p2.addScaledVector(v1.set(0,0,1).applyQuaternion(q2), L); }
    dawn.lineP=p2; }   // 太陽 = 出口で ちょうど地平線 (昼と夜の境目)、進む向きの 60° 上 → 弧は 夕日 → 夜 → 日の出。抜く所 = 出口 (離れる最初の点)。離れる最初の 2 秒で 機首を 60° 上げると ちょうど太陽へ (右・左の側。水星は左 = 10/7 社長: 右カーブ → 左カーブに)
  else { const h=nF*delta/2; sunDir=new THREE.Vector3().addScaledVector(sd.r ? u1 : r1, 0.8).addScaledVector(toC, -0.6*Math.cos(h)).addScaledVector(f, 0.6*Math.sin(h)).normalize(); }   // 太陽: 横の斜め上。弧の真ん中 (抜く所) の真上寄り → 弧のどこでも 足元が昼 (前方寄りだと 半周する水星の後半が夜になった、Codex 指摘 10/2)
  g.ev={def:P, idx:g.next, center, pArc, fwd:f.clone(), R, sunDir, L, nA, nF, nD, ax:sd.ax, sg:sd.sg, delta, k:0, phase:'app', app:null, arc0:null, mid:null, arc1:null, end:null, midAtExit:true, kExit:0, ...dawn};   /* 抜く所 = 離れる最初の点 (全惑星、10/5) */
  g.next++; g.bendTo=0; g.bendRate=Math.max(Math.abs(g.bend)/(APP_SEC*0.5), 1e-6); return g.ev;   // 近づく間の前半で 断面を平らに戻す
}
function eventStep(g, ctx){   // イベント中の 1 点ぶんの向きの変え方。返り値 = この点 (動いた後) に付ける印
  const e=g.ev; let mark=null;
  if(e.phase==='app'){ if(e.nLev && e.k>=e.nA-e.nLev) turn(g, AXX, -e.dive/e.nLev); if(e.k===0) mark='app'; else if(e.kIn!=null && e.k===e.kIn){ mark='in'; e.inPipe=true; } if(++e.k>=e.nA){ mark='arc0'; e.phase='fly'; e.k=0; } }   // 最後の近づく点 = 弧の始まり (土星は 最後の nLev 点で 機首を起こして 環の上に水平に)
  else if(e.phase==='fly'){ turn(g, e.ax, e.sg*(e.k===0 ? e.delta/2 : e.delta)); if(++e.k>=e.nF && ctx.v>=e.def.ms){ mark='arc1'; e.phase='dep'; e.nF=e.k; e.k=0; } }   // 弧: 最初は半分、あとは δ ずつ。最低 nF 点 回ったら 公転速度に届くまで 回し続ける (10/5 社長)。実際に回った点の数を 書き戻す (特別カメラが使う)
  else { if(e.k===0){ turn(g, e.ax, e.sg*e.delta/2); if(e.def.course==='dawn') dawnExit(g, e); }
    if(e.lift) turn(g, AXX, e.nLift ? (e.k<e.nLift ? -e.lift/e.nLift : 0) : -e.lift/e.nD);
    if(e.pipe){ if(!e.out && _f.set(0,0,1).applyQuaternion(g.q).multiplyScalar(e.L).add(g.p).distanceTo(e.center)>=e.R){ mark='mid'; e.inPipe=false; e.out=true; } }   /* 海王星: 雲の上に出る最初の点が 抜く所 (動いた後の位置を 先読み) */
    else if(e.midAtExit && e.k===e.kExit) mark='mid';   // ほか: 離れる最初の点が 抜く所
    if(++e.k>=e.nD){ mark='end'; g.ev=null; g.lastEvEnd=g.s+e.L; if(e.pipe){ g.bendTo=0; g.bendRate=1/BEND_SEC; } } }   /* パイプは 平らへ戻す */
  return mark;
}
function dawnExit(g, e){   // 水星: 抜く所で 太陽の向きを決め直す (その点が 夜明けの線、進む向きの 60° 上) と 機首を上げ終える点 lineP (特別カメラ「たいよう」が使う、10/5)
  const fD=new THREE.Vector3(0,0,1).applyQuaternion(g.q), uD=new THREE.Vector3(0,1,0).applyQuaternion(g.q), nE=g.p.clone().sub(e.center).normalize(), tS=new THREE.Vector3().crossVectors(nE, fD).normalize(); if(tS.dot(uD)<0) tS.negate();
  e.sunDir=fD.clone().multiplyScalar(Math.cos(DAWN.up)).addScaledVector(tS, Math.sin(DAWN.up)).normalize();
  const q2=g.q.clone(), p2=g.p.clone(), dq=new THREE.Quaternion(), v1=new THREE.Vector3(); for(let k=0;k<e.nLift;k++){ q2.multiply(dq.setFromAxisAngle(AXX, -e.lift/e.nLift)); p2.addScaledVector(v1.set(0,0,1).applyQuaternion(q2), e.L); } e.lineP=p2;
}
export function makeGen2(){ return {p:new THREE.Vector3(0,0.45,0), q:new THREE.Quaternion(), s:0, w:LANE_W2, wTo:LANE_W2, bend:0, bendTo:0, morphI:-1, morphT:10, yawR:0, pitchR:0, left:0, ev:null, next:0, lastEvEnd:0}; }   // 最初の 10 秒は平ら
export function nextCtrl2(g, ctx){   // 次の制御点。ctx = {v: 本物の速さ, vm: 画面の流れの速さ, songT, songLen, lead: 作り手がおばけより何秒先か}
  let L=g.ev ? g.ev.L : ctrlLen(ctx.vm), spawn=false, mark=null;   // イベント中は 間隔を固定 (弧が円からずれないように)
  if(!g.ev){ const ev=maybeStartEvent(g, ctx, L); if(ev){ spawn=true; L=ev.L; } }
  const dt=L/Math.max(1, ctx.vm);
  if(g.ev){ const ev=g.ev; mark=eventStep(g, ctx); const bt= ev.inPipe ? 1 : 0, rb=(ev.pipe ? 1/BEND_SEC : g.bendRate)*dt; g.bend+=Math.max(-rb, Math.min(rb, bt-g.bend));   /* 海王星の雲の中は パイプ (断面の曲がり 1) */   // イベント中は 平らへ戻す
    _f.set(0,0,1).applyQuaternion(g.q); g.p.addScaledVector(_f, L); g.s+=L;
    return {p:g.p.clone(), up:new THREE.Vector3(0,1,0).applyQuaternion(g.q), bend:g.bend, w:g.w, mark, ev, spawn}; }
  if(g.left<=0){ g.left=4+(Math.random()*6|0); g.yawR=(Math.random()*2-1)*CRUISE_TURN; g.pitchR=(Math.random()*2-1)*CRUISE_TURN*0.6; }
  const tk=Math.min(1, Math.max(0, (STRAIGHT_FROM-ctx.v)/STRAIGHT_FADE));   // 曲がりの効き (速いと 0 = まっすぐ)
  g.left--; turn(g, AXY, g.yawR*dt*tk); turn(g, AXX, g.pitchR*dt*tk);
  g.morphT-=dt; if(g.morphT<=0){ g.morphI=(g.morphI+1)%MORPHS.length; [g.bendTo, g.morphT]=MORPHS[g.morphI]; g.bendRate=Math.abs(g.bendTo-g.bend)/BEND_SEC; if(g.bendTo===0) g.wTo=W_MIN+Math.random()*(W_MAX-W_MIN); }   // 平らに戻る時だけ レール間隔を選び直す (パイプの太さが途中で変わらないように)。変わり目は 幅によらず BEND_SEC 秒 (Codex 指摘 10/1)
  const rb=(g.bendRate||0)*dt; g.bend+=Math.max(-rb, Math.min(rb, g.bendTo-g.bend)); const rw=W_RATE*dt; g.w+=Math.max(-rw, Math.min(rw, g.wTo-g.w));
  _f.set(0,0,1).applyQuaternion(g.q); g.p.addScaledVector(_f, L); g.s+=L;
  return {p:g.p.clone(), up:new THREE.Vector3(0,1,0).applyQuaternion(g.q), bend:g.bend, w:g.w, mark:null, ev:null, spawn:false};
}

/* 2 面の相手の表 (数字は本物の平均の速さ)。small = 小物 (あっさり抜く)、planet = 惑星イベント */
const SMALL2=[   // at = 実際に抜く速さ (km/h。準惑星は 詰まらないように 本物より手前で抜く、10/7 社長 A 案。並びも これで決める)
{name:'ハレー彗星', kmh:3300}, {name:'エリス', kmh:12300, at:10000, rkm:1163, tex:'2k_eris_fictional.jpg', color:['#e8e8ec','#c8ccd4','#a8aeb8']}, {name:'冥王星', kmh:17100, at:14000, rkm:1188, tex:'2k_pluto.jpg', color:['#d8ccc0','#b89880','#8a5a48']}, {name:'ボイジャー1号', kmh:61200}, {name:'ケレス', kmh:64400, at:56000, rkm:470, tex:'2k_ceres.jpg', color:['#9a9a98','#7c7c7a','#b4b4b0']}].map(o=>({...o, kind:'small'}));   // 冥王星・ケレス = 準惑星は 小物 (10/2 社長: 惑星イベントは 8 惑星だけ)
const MOONS_J=[   // 木星の 4 つの大きな衛星 (10/4 社長: 本物と同じ配置で 画面に ちらっと映るくらい)。orbit = 木星の中心からの本物の距離 (km)、ang = 並べる面の中の角度 (度、0 = 木星の向こう側 = 進む向き、+ = 右)。距離も大きさも 本物 ÷ 35。前から見ると 一列に並ぶ (ガリレオが見た並び)
  {name:'イオ',     rkm:1822, orbit:421700,  ang:35,  look:'io',       dot:'#f0d060'},
  {name:'エウロパ', rkm:1561, orbit:671000,  ang:-40, look:'europa',   dot:'#f4efe4'},
  {name:'ガニメデ', rkm:2634, orbit:1070400, ang:70,  look:'ganymede', dot:'#c8bba8'},
  {name:'カリスト', rkm:2410, orbit:1882700, ang:-60, look:'callisto', dot:'#a89684'},
];
const MOON_E=[{name:'月', rkm:1737, orbit:384400, ang:25, look:'moon', dot:'#e4e4e0', tex:'2k_moon.jpg'}];   // 地球の月 (10/4 社長: 木星と同じく 本物の位置に ちらっと)。ang 25° = 進む向きの少し左 → 走っている間 前の地平線の上に小さく見える。地図 = Solar System Scope
export function sysRadius(def){ return def.moons ? Math.max(...def.moons.map(m=>(m.orbit+m.rkm)*1000/SIZE_DIV)) : 0; }   // 衛星まで含めた 惑星のまわりの広さ (m、遠景の描画距離に使う)
export const PLANETS2=[   // 8 惑星 (10/2 社長: 各惑星の特徴をしっかり見たい)。due = 曲の予定の目安 (10/5 から 使っていない = 腕前のレース、惑星は速さで出る)。fly = 使っていない (10/5 から 弧は 公転速度に届くまで 回り続ける)。rkm = 本物の半径 (km、ゲームでは ÷35)。tex/clouds = 地図画像 (planets/、Solar System Scope CC BY 4.0)。ring/hex/face/halo = 環・六角形・見せたい所の向き・大気の光の色。from = 惑星の見える側 (下・上・左・右。続けて同じにならないよう散らした、10/2。各演出の便で決め直す)。dist = 太陽からの平均の距離 (km、「たいようまで あと ○おく km」)
  {name:'海王星', kana:'かいおうせい', kmh:19600, dist:45e8,  due:0.22, fly:10, rkm:24622, from:'below',  tex:'2k_neptune.jpg', halo:'#5a80f0', face:'darkspot', course:'dive', spot:{u:0.3, lat:-20}, color:['#3a5fd0','#5a80f0','#2a3f90']},
  {name:'天王星', kana:'てんのうせい', kmh:24500, dist:28.7e8, due:0.32, fly:14, rkm:25362, from:'above', tex:'2k_uranus.jpg', halo:'#b8f0f0', ring:'uranus', face:'side', color:['#9fe0e8','#b8f0f0','#80c8d8']},
  {name:'土星', kana:'どせい',       kmh:34800, dist:14.3e8, due:0.43, fly:16, rkm:58232, from:'left', tex:'2k_saturn.jpg', halo:'#f0e0b8', ring:'saturn', hex:true, face:'ring', course:'ringrun', color:['#e8d49a','#d0b070','#f0e0b8']},
  {name:'木星', kana:'もくせい',     kmh:47000, dist:7.78e8, due:0.54, fly:16, rkm:69911, from:'above', tex:'2k_jupiter.jpg', halo:'#f0dcc0', face:'redspot', moons:MOONS_J, color:['#d8a878','#f0dcc0','#b87850','#e8c8a0']},
  {name:'火星', kana:'かせい',       kmh:86700, dist:2.28e8, due:0.65, fly:8,  rkm:3390,  from:'right', tex:'2k_mars.jpg', color:['#c8603a','#e08050','#a04a2a']},
  {name:'地球', kana:'ちきゅう',     kmh:107200, dist:1.496e8, due:0.76, fly:12, rkm:6371, from:'below', tex:'2k_earth_daymap.jpg', clouds:'2k_earth_clouds.jpg', halo:'#6aa8ff', face:'japan', moons:MOON_E, color:['#2a6ad0','#3a9a50','#f4f4f4']},
  {name:'金星', kana:'きんせい',     kmh:126000, dist:1.082e8, due:0.86, fly:10, rkm:6052, from:'left', tex:'2k_venus_atmosphere.jpg', halo:'#f4e4b0', spin:-0.02, haze:-0.06, color:['#e8d090','#f4e4b0','#d0b070']},
  {name:'水星', kana:'すいせい',     kmh:170500, dist:0.579e8, due:0.95, fly:6,  rkm:2440, from:'left',  tex:'2k_mercury.jpg', course:'dawn', color:['#9a9490','#b8b0a8','#787068']},
].map(o=>({...o, kind:'planet'}));
export const LADDER2=[...SMALL2, ...PLANETS2].map(o=>({...o, ms:o.kmh/3.6})).sort((a,b)=>(a.at||a.kmh)-(b.at||b.kmh));   // 並び = 出会う順 (at = 実際に抜く速さ。表示の時速は 本物の kmh のまま、10/7 社長)
for(const p of PLANETS2) p.ms=p.kmh/3.6;
export const HUD_RUNGS2=LADDER2.findIndex(o=>o.name==='水星')+1;   // 左上の点と「つぎの あいて」は 水星まで (おまけの パーカー・ソーラー・プローブは 10/7 社長判断で削除)

/* 惑星の模様 (10/2 社長: 本物の写真を少しやさしく)。Solar System Scope の地図画像 (CC BY 4.0、planets/)。2 面の始まりに裏で読み、読めるまでは 色の帯で出して 読めたら差し替える */
const TEX_DIR='planets/', SOFT='saturate(0.85) contrast(0.9) brightness(1.05)', RED_SPOT_U=0.3677;   // RED_SPOT_U = 木星の地図での 大赤斑の横の位置 (0〜1、南緯 22° の帯で 赤みが最大の列を Blender で計測 10/2)
const texImgs=new Map();   // ファイル名 → 読めた画像 / null (失敗) / undefined (読み込み中)。画像は使い回し、片づけで解放するのは 画面の裏の模様だけ
export function preloadPlanetTex(){ for(const p of [...PLANETS2, ...SMALL2.filter(o=>o.tex)]) for(const f of [p.tex, p.clouds, p.ring==='saturn' ? '2k_saturn_ring_alpha.png' : null, ...(p.moons||[]).map(m=>m.tex)]) if(f && !texImgs.has(f)){ texImgs.set(f, undefined); const im=new Image(); im.onload=()=>texImgs.set(f, im); im.onerror=()=>{ console.warn('惑星の模様が読めない', f); texImgs.set(f, null); }; im.src=TEX_DIR+f; } }
function hazeTex(){ const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0, 0, 1024, 512); x.lineCap='round';   // 金星の上の雲の筋 (透明度に使う。白 = 雲): 横に流れる 細長い筋。赤道寄りに多く、左右の端は つなぎ目なし
  for(let i=0;i<700;i++){ const y=256+(Math.random()-0.5)*440*Math.random(), x0=Math.random()*1024, l=80+Math.random()*420, w=2+Math.random()*7, a=0.05+Math.random()*0.18, dy=(Math.random()-0.5)*30;
    for(const [ww, aa] of [[w*3, a*0.35], [w, a]]){ x.strokeStyle=`rgba(255,255,255,${aa})`; x.lineWidth=ww; for(const o of [-1024, 0, 1024]){ x.beginPath(); x.moveTo(x0+o, y); x.quadraticCurveTo(x0+o+l/2, y+dy, x0+o+l, y); x.stroke(); } } }   /* 太く薄い筋の上に 細く濃い筋 = ぼかしの代わり */
  const t=new THREE.CanvasTexture(c); t.wrapS=THREE.RepeatWrapping; return t; }   /* 左右の端を つないで補間 (つなぎ目の細い線を防ぐ、Codex 指摘 10/5) */
function softCanvas(im){ const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; const g=c.getContext('2d'); g.filter=SOFT; g.drawImage(im,0,0); g.filter='none'; return c; }
function canvasTex(c){ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
function hexPath(g, W, H){ g.beginPath(); for(let x=0;x<=W;x+=2){ const lon=x/W*Math.PI*2, a=(lon%(Math.PI/3))-Math.PI/6, y=(12/Math.cos(a))/180*H; if(x===0) g.moveTo(x,y); else g.lineTo(x,y); } }   // 北極から 12° (北緯 78°) を内接円とする六角形 (地図の上端 = 北極)
function drawHexagon(c){ const g=c.getContext('2d'), W=c.width, H=c.height;   // 土星の北極の六角形 (地図にはほとんど写っていないので 描き足す)
  hexPath(g, W, H); g.lineTo(W,0); g.lineTo(0,0); g.closePath(); g.fillStyle='rgba(110,140,170,0.35)'; g.fill();
  hexPath(g, W, H); g.strokeStyle='rgba(80,90,110,0.6)'; g.lineWidth=4; g.stroke(); }
function drawDarkSpot(c, sp){ const g=c.getContext('2d'), W=c.width, H=c.height, x=sp.u*W, y=(90-sp.lat)/180*H, rx=W*0.045, ry=H*0.043;   // 海王星の大暗斑 (地図にないので描き足す。本物 約 1.3 万 × 6,600 km): 暗い楕円 + 南側の白い雲
  g.save(); g.translate(x, y); g.scale(1, ry/rx); const gr=g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0,'rgba(10,20,60,0.85)'); gr.addColorStop(0.7,'rgba(20,35,90,0.6)'); gr.addColorStop(1,'rgba(30,50,120,0)'); g.fillStyle=gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI*2); g.fill(); g.restore();
  g.fillStyle='rgba(235,245,255,0.75)'; g.beginPath(); g.ellipse(x+rx*0.2, y+ry*1.05, rx*0.55, ry*0.22, 0, 0, Math.PI*2); g.fill(); }
function ringStrip(bands){ const c=document.createElement('canvas'); c.width=512; c.height=1; const g=c.getContext('2d'); for(const [a,b,col] of bands){ g.fillStyle=col; g.fillRect(a*512, 0, Math.max(1,(b-a)*512), 1); } return canvasTex(c); }   // 環の断面 (内側 → 外側) を 1 行の絵に
function makeRing(r0, r1, mat){ const geo=new THREE.RingGeometry(r0, r1, 256, 1), pos=geo.attributes.position, uv=geo.attributes.uv;   // 平らな輪 (赤道の面)。模様は 中心からの距離で引く
  for(let i=0;i<pos.count;i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i))-r0)/(r1-r0), 0.5);
  geo.rotateX(-Math.PI/2); return new THREE.Mesh(geo, mat); }
const SATURN_BANDS=[[0,0.1,'rgba(150,130,100,0.15)'],[0.1,0.33,'rgba(190,170,130,0.45)'],[0.34,0.68,'rgba(225,205,165,0.9)'],[0.72,0.92,'rgba(205,185,150,0.7)'],[0.95,0.97,'rgba(220,210,190,0.5)']];   // 読めるまでの 土星の環: C 環 → B 環 → (カッシーニの隙間) → A 環 → F 環
const URANUS_BANDS=[[0.09,0.1,'rgba(200,220,255,0.5)'],[0.16,0.17,'rgba(200,220,255,0.5)'],[0.27,0.285,'rgba(200,220,255,0.6)'],[0.36,0.375,'rgba(200,220,255,0.6)'],[0.47,0.48,'rgba(200,220,255,0.5)'],[0.53,0.545,'rgba(200,220,255,0.6)'],[0.67,0.69,'rgba(200,220,255,0.7)'],[0.87,0.92,'rgba(220,235,255,0.85)']];   // 天王星の細い環 (いちばん外の ε 環を太く明るく。本物は暗いので うっすら光らせる)
export function makePlanetMesh(def, R){
  const c=document.createElement('canvas'); c.width=512; c.height=256; const g=c.getContext('2d'), cols=def.color;   // 読めるまでの 色の帯
  for(let y=0;y<256;y+=4){ g.fillStyle=cols[((Math.floor(y/16+Math.sin(y*0.07)*1.5)%cols.length)+cols.length)%cols.length]; g.fillRect(0,y,512,4); }
  for(let i=0;i<400;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.08})`; g.beginPath(); g.ellipse(Math.random()*512, Math.random()*256, 4+Math.random()*30, 2+Math.random()*6, 0, 0, Math.PI*2); g.fill(); }
  const grp=new THREE.Group(), body=new THREE.Mesh(new THREE.SphereGeometry(R, PLANET_SEG, PLANET_SEG/2), new THREE.MeshStandardMaterial({map:canvasTex(c), roughness:1, metalness:0})); grp.add(body);
  const pending=[{file:def.tex, apply:im=>{ const sc=softCanvas(im); if(def.hex) drawHexagon(sc); if(def.spot) drawDarkSpot(sc, def.spot); body.material.map.dispose(); body.material.map=canvasTex(sc); body.material.needsUpdate=true; }}];
  if(def.halo){ const h=document.createElement('canvas'); h.width=h.height=128; const hg=h.getContext('2d'), rg=hg.createRadialGradient(64,64,40,64,64,64); rg.addColorStop(0,'rgba(255,255,255,0.5)'); rg.addColorStop(1,'rgba(255,255,255,0)'); hg.fillStyle=rg; hg.fillRect(0,0,128,128);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(h), color:new THREE.Color(def.halo), transparent:true, opacity:0.6, depthWrite:false, blending:THREE.AdditiveBlending, fog:false})); halo.scale.setScalar(R*2.6); grp.add(halo); }   // 大気の光は ガスの惑星と 地球・金星だけ (岩の星には付けない)
  if(def.clouds){ const cl=new THREE.Mesh(new THREE.SphereGeometry(R*1.01, PLANET_SEG, PLANET_SEG/2), new THREE.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:0, depthWrite:false, roughness:1, metalness:0})); cl.name='clouds'; body.add(cl);   // 地球の雲: 雲の画像を 透明度に使う
    pending.push({file:def.clouds, apply:im=>{ const t=new THREE.Texture(im); t.needsUpdate=true; cl.material.alphaMap=t; cl.material.opacity=0.9; cl.material.needsUpdate=true; }}); }
  if(def.haze){ const hz=new THREE.Mesh(new THREE.SphereGeometry(R*1.004, PLANET_SEG, PLANET_SEG/2), new THREE.MeshStandardMaterial({color:0xfff4dc, alphaMap:hazeTex(), transparent:true, opacity:0.6, depthWrite:false, roughness:1, metalness:0})); hz.name='clouds'; hz.userData.spin=def.haze; body.add(hz); }   // 金星の上の雲の筋 (10/5 社長: 雲の流れを見せる): 下の雲より速く 西へ流れる (スーパーローテーション。本物は 4 日で一周、ここでは見える速さに)
  if(def.ring==='saturn'){ const rm=makeRing(R*1.11, R*2.33, new THREE.MeshStandardMaterial({map:ringStrip(SATURN_BANDS), transparent:true, side:THREE.DoubleSide, depthWrite:false, roughness:1, metalness:0})); body.add(rm);   // 土星の環 (内側 1.11 倍 〜 外側 2.33 倍)。影は入れない
    pending.push({file:'2k_saturn_ring_alpha.png', apply:im=>{ const t=new THREE.Texture(im); t.colorSpace=THREE.SRGBColorSpace; t.needsUpdate=true; rm.material.map.dispose(); rm.material.map=t; rm.material.needsUpdate=true; }}); }
  if(def.ring==='uranus') body.add(makeRing(R*1.6, R*2.05, new THREE.MeshBasicMaterial({map:ringStrip(URANUS_BANDS), transparent:true, side:THREE.DoubleSide, depthWrite:false})));   // 天王星の環 (画像はないので 描く)
  const moons= def.moons ? def.moons.map(M=>{ const mg=makeMoonMesh(M, M.rkm*1000/SIZE_DIV); pending.push(...mg.userData.pending.splice(0)); grp.add(mg); return {def:M, mesh:mg, orbit:M.orbit*1000/SIZE_DIV, R:M.rkm*1000/SIZE_DIV}; }) : null;   // 木星の衛星 (10/4): 惑星の子にして 一緒に膨らむ (遠くの点の見せ方)。置く所は orientPlanet で
  grp.userData={def, pending, moons}; updatePlanetTex(grp); return grp;
}
export function updatePlanetTex(grp){ const pd=grp.userData.pending; for(let i=pd.length-1;i>=0;i--){ const im=texImgs.get(pd[i].file); if(im===undefined) continue; const it=pd.splice(i,1)[0]; if(im) it.apply(im); } }   // 毎コマ呼んでよい: 読めた部分だけ 1 回差し替える (失敗は 色の帯のまま)
export function disposePlanet(grp){ grp.userData.pending.length=0; grp.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); if(o.material.alphaMap) o.material.alphaMap.dispose(); o.material.dispose(); } }); }   // 片づけた後に 画像が届いても 差し替えない
export function makeMoonMesh(M, R){   // 衛星の見た目 (色を描いた模様。地図画像 M.tex があれば 読めた時に差し替え)
  const W=1024, H=512, c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'), rnd=(a,b)=>a+Math.random()*(b-a);
  const dot=(r,col)=>{ g.fillStyle=col; g.beginPath(); g.ellipse(rnd(0,W), rnd(0,H), r, r*0.8, 0, 0, Math.PI*2); g.fill(); };
  const curve=(n, lw0, lw1, col, reach)=>{ g.strokeStyle=col; for(let i=0;i<n;i++){ g.lineWidth=rnd(lw0, lw1); const x=rnd(0,W), y=rnd(0,H); g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+rnd(-reach,reach), y+rnd(-reach/2,reach/2), x+rnd(-reach*2,reach*2), y+rnd(-reach,reach)); g.stroke(); } };
  const base=col=>{ g.fillStyle=col; g.fillRect(0,0,W,H); };
  if(M.look==='callisto'){ base('#4a3d33'); for(let i=0;i<60;i++) dot(rnd(12,60), 'rgba(30,24,20,0.35)'); for(let i=0;i<900;i++) dot(rnd(1.5,6), `rgba(235,225,210,${rnd(0.4,0.9)})`); }   // 黒っぽい茶色 + 明るいクレーターの点
  else if(M.look==='ganymede'){ base('#8f8476'); for(let i=0;i<16;i++) dot(rnd(50,140), 'rgba(80,68,58,0.55)'); curve(60, 2, 5, 'rgba(205,196,182,0.35)', 120); for(let i=0;i<400;i++) dot(rnd(1.5,5), 'rgba(240,235,225,0.7)'); }   // 灰色と茶色のまだら + 明るい溝の筋
  else if(M.look==='europa'){ base('#e6dfd0'); for(let i=0;i<12;i++) dot(rnd(40,120), 'rgba(190,160,130,0.25)'); curve(90, 1.5, 4, 'rgba(140,90,60,0.6)', 160); }   // 白い氷 + 茶色のひび割れの筋
  else if(M.look==='moon'){ base('#9c9b97'); for(let i=0;i<14;i++) dot(rnd(40,120), 'rgba(70,70,72,0.45)'); for(let i=0;i<600;i++) dot(rnd(1.5,5), 'rgba(220,220,215,0.5)'); }   // 月: 灰色 + 暗い海 + 明るいクレーター (地図が読めるまで)
  else { base('#e6c64a'); for(let i=0;i<34;i++) dot(rnd(20,80), 'rgba(220,130,40,0.4)'); for(let i=0;i<14;i++) dot(rnd(10,28), 'rgba(250,245,230,0.5)'); for(let i=0;i<46;i++){ const x=rnd(0,W), y=rnd(0,H), r=rnd(4,12); g.fillStyle='rgba(190,60,30,0.35)'; g.beginPath(); g.arc(x, y, r*2.2, 0, Math.PI*2); g.fill(); g.fillStyle='#24160e'; g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill(); } }   // イオ: 黄色〜オレンジ + 黒い火山と 赤い輪
  const grp=new THREE.Group(), body=new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48), new THREE.MeshStandardMaterial({map:canvasTex(c), roughness:1, metalness:0})); body.rotation.set(Math.random()*0.5, Math.random()*6.28, 0); grp.add(body);
  if(M.dot){ const pg=new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3)); grp.userData.dot=new THREE.Points(pg, new THREE.PointsMaterial({color:new THREE.Color(M.dot), size:4, sizeAttenuation:false, transparent:true, opacity:0.95, depthWrite:false})); grp.add(grp.userData.dot); }   // 遠くても消えない 光の点 (画面で 4 画素。衛星の球が大きく見える時は 球の表面に隠れる)
  grp.userData={def:M, dot:grp.userData.dot, pending: M.tex ? [{file:M.tex, apply:im=>{ body.material.map.dispose(); body.material.map=canvasTex(softCanvas(im)); body.material.needsUpdate=true; }}] : []}; updatePlanetTex(grp); return grp;
}
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _c=new THREE.Vector3();
function texDir(u, latDeg, out){ const phi=u*Math.PI*2, th=(90-latDeg)*Math.PI/180; return out.set(-Math.cos(phi)*Math.sin(th), Math.cos(th), Math.sin(phi)*Math.sin(th)); }   // 地図の点 (横 u 0〜1、緯度) → 球の向き (three.js の球の貼り方。地図の上端 = 北極)
export function orientPlanet(grp, n, fwd, up, mid){   // 見せたい所を コースに向ける。n = 惑星の中心 → 頂上 (弧の始まり)、fwd = 近づく向き
  const body=grp.children[0], f=grp.userData.def.face;
  if(f==='redspot') body.quaternion.setFromUnitVectors(texDir(RED_SPOT_U, -22, _a), _b.copy(n).sub(fwd).normalize());   // 木星: 大赤斑を 頂上から手前へ 45° の所に固定 (回さない) → 近づく時に 円盤の中ほどに見える
  else if(f==='japan') body.quaternion.setFromUnitVectors(texDir((138+180)/360, 36, _a), mid||n);   // 地球: 日本 (東経 138°・北緯 36°) を 弧の真ん中 (「ぬいた！」の所) の真下へ → 特別カメラ うえ で 日本を見下ろす (10/4)
  else if(f==='darkspot') body.quaternion.setFromUnitVectors(texDir(grp.userData.def.spot.u, grp.userData.def.spot.lat, _a), mid||n);   // 海王星: 大暗斑を 雲に入る点の真下へ (突っ込む嵐)
  else if(f==='ring') body.quaternion.setFromUnitVectors(_a.set(0,1,0), up);   // 土星: 北極 (六角形) を 環の面の上 (走る時の上) へ → 環の面が コースの RR.h (500 m) 下に広がる
  else if(f==='side') body.quaternion.setFromUnitVectors(_a.set(0,1,0), _b.copy(fwd).negate().addScaledVector(_c.crossVectors(fwd, n).normalize(), 0.5).normalize());   // 天王星: 自転の軸を こちら向き + 少し横 → 環が 縦長の輪で立って見える (縦ループの向きは 天王星の便で決め直す)
  else body.rotation.set(Math.random()*0.4, Math.random()*6.28, 0);
  const ms=grp.userData.moons; if(ms){ const side=_c.crossVectors(n, fwd).normalize(); for(const m of ms){ const a=m.def.ang*Math.PI/180; m.mesh.position.copy(fwd).multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a)).multiplyScalar(m.orbit); } }   // 木星の衛星: 木星の中心を通る「進む向きと横向き」の面に 本物の距離で並べる (前から見ると 一列)
}
