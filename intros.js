// 2 面・3 面のはじめ (10/20): 天国の会話の台本と、天国の場面に足す 3D の説明 (公転・銀河)。設計書 docs/superpowers/specs/2026-10-20-ganbare-obake-stage-flow-design.md 5 章・付録 A
// 天国の場面は opening.js の createOpening({ extra: introExtra(n) }) で 共通に使う
import * as THREE from 'three';

export const S2_LINES = [   // 2 面のはじめ (おばけが 雲の下から ニョッキ と出た後)
  { id:'s2-01', who:'obake', face:'egao', cast:['obake'], text:'やったー！ これで {地球|ちきゅう}の {自転|じてん}に おいついたぞ！' },
  { id:'s2-02', who:'kami', face:'magao', listen:'egao', cast:['obake','kami'], cue:'kamiIn', text:'よろこんでいる ところ わるいけど… じつは そのままでは {地球|ちきゅう}に おいつけないの' },   /* 10/28 神様の 声 (おゆさん) の 言い方に 合わせた */
  { id:'s2-03', who:'obake', face:'eehatena', listen:'magao', text:'ええっ！？ どうして！？' },
  { id:'s2-04', who:'kami', face:'magao', listen:'hee', layout:'corner', cue:'orbitIn', text:'じつは {自転|じてん}とは べつに、{太陽|たいよう}の まわりも まわっているの' },   /* 10/28 神様の 声 (おゆさん) の 言い方に 合わせた */
  { id:'s2-05', who:'kami', face:'magao', listen:'hee', cue:'orbitLap', text:'これを 『{公転|こうてん}』 と いって、1 ねんで {太陽|たいよう}を ひとまわり するの' },   /* 10/28 神様の 声 (おゆさん) の 言い方に 合わせた */
  { id:'s2-06', who:'kami', face:'magao', listen:'hee', cue:'orbitSpeed', text:'その はやさは {時速|じそく} 107,000 km。{自転|じてん}の 80 ばい！' },
  { id:'s2-07', who:'kami', face:'magao', listen:'muhyojo', cue:'leftBehind', text:'{地球|ちきゅう}に ひっぱられない おばけは… {地球|ちきゅう}ごと おいていかれちゃう' },
  { id:'s2-08', who:'obake', face:'odoroki', listen:'magao', text:'じゃあ… {地球|ちきゅう}の {公転|こうてん}に おいつけば いいってこと…！？' },
  { id:'s2-09', who:'obake', face:'ganbaru', listen:'egao', layout:'stage', text:'よーし！ ぜったい 『ばあ！』って おどろかせて やるんだ！' },
  { id:'s2-10', who:'kami', face:'egao', listen:'ganbaru', text:'その いきよ！ さあ、いっておいで！' }   /* 10/28 神様の 声 (おゆさん) の 言い方に 合わせた */
];

export const S3_LINES = [   // 3 面のはじめ
  { id:'s3-01', who:'obake', face:'egao', cast:['obake'], text:'はあ、はあ… やったぞ！' },
  { id:'s3-02', who:'obake', face:'egao', listen:'egao', cast:['obake','kami'], cue:'kamiIn', text:'かみさま！ これで {地球|ちきゅう}に いけますよね！？' },
  { id:'s3-03', who:'kami', face:'magao', listen:'egao', text:'それが… じつは いいそびれた ことが あるの' },   /* 10/28 神様の 声 (おゆさん) の 言い方に 合わせた */
  { id:'s3-04', who:'kami', face:'magao', listen:'muhyojo', layout:'corner', cue:'galaxyIn', text:'{地球|ちきゅう}の いる {太陽系|たいようけい}は、{銀河系|ぎんがけい}の ちゅうしんを {公転|こうてん} しているんだ' },
  { id:'s3-05', who:'obake', face:'muhyojo', listen:'magao', text:'……？？？' },
  { id:'s3-06', who:'obake', face:'eehatena', listen:'magao', text:'ど、どういう ことですか！？ せつめい して ください！' },
  { id:'s3-07', who:'kami', face:'magao', listen:'hee', cue:'galaxySpiral', text:'みて ごらん。{太陽|たいよう}は {惑星|わくせい}たちを つれて、らせんを えがきながら {銀河系|ぎんがけい}の なかを すすんでいるの' },   /* 10/28 神様の 声 (おゆさん) の 言い方に 合わせた */
  { id:'s3-08', who:'kami', face:'magao', listen:'hee', cue:'galaxySpeed', text:'その はやさは {時速|じそく} 830,000 km。{公転|こうてん}の 8 ばい！' },
  { id:'s3-09', who:'obake', face:'shobon', listen:'magao', text:'そ、そんなに…' },
  { id:'s3-10', who:'obake', face:'ganbaru', listen:'magao', layout:'stage', text:'…でも、こんどこそ！ こんどこそ ぜったい いくんだ！' },
  { id:'s3-11', who:'kami', face:'egao', listen:'ganbaru', text:'…うん。きみなら だいじょうぶ。いっておいで！' }
];


const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
const pop = k => k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);   // 小さい → 大きく (少し 行き過ぎて戻る)
function coronaTex(){   // コロナ: 太陽のふちから 外へ伸びる 細い光の筋 (長さ・明るさ ふぞろい) + やわらかい光。真ん中 (太陽の円盤) は 透明
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), C = N / 2, R0 = N * 0.18;   // R0 = 太陽のふち (Sprite の大きさ 5.6R の中で 1R ≒ 0.18)
  const rg = g.createRadialGradient(C, C, R0, C, C, C); rg.addColorStop(0, 'rgba(255,240,200,0.55)'); rg.addColorStop(0.25, 'rgba(255,210,140,0.18)'); rg.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = rg; g.fillRect(0, 0, N, N);
  g.lineCap = 'round';
  for(let i = 0; i < 180; i++){
    const a = Math.random() * Math.PI * 2, L = R0 + (C - R0) * (0.15 + Math.pow(Math.random(), 1.6) * 0.8), w = 1 + Math.random() * 3.5, x0 = C + Math.cos(a) * R0, y0 = C + Math.sin(a) * R0, x1 = C + Math.cos(a) * L, y1 = C + Math.sin(a) * L;
    const lg = g.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, `rgba(255,236,190,${0.25 + Math.random() * 0.35})`); lg.addColorStop(1, 'rgba(255,200,140,0)');
    g.strokeStyle = lg; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(C + Math.cos(a + 0.08) * (R0 + L) / 2, C + Math.sin(a + 0.08) * (R0 + L) / 2, x1, y1); g.stroke();
  }
  return new THREE.CanvasTexture(c);
}
function loadSun(loader, sunMat, own, isDead){   // 太陽の表面の画像。読み始めた時点で 片づけの対象に入れ、片づいた後に 届いても 材質を触らない (Codex 指摘 10/20)
  const tx = loader.load('planets/2k_sun.jpg', () => { if(isDead()) return; sunMat.map = tx; sunMat.color.set(0xffffff); sunMat.needsUpdate = true; }, undefined, () => {});
  tx.colorSpace = THREE.SRGBColorSpace; own.push(tx);
}
function radialMask(){ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rg = g.createRadialGradient(128, 128, 96, 128, 128, 128); rg.addColorStop(0, '#fff'); rg.addColorStop(1, '#000'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); }   // 丸い ふち消し (白 = 見える)
function speedHtml(n){ return '<ruby>時速<rt>じそく</rt></ruby> ' + Math.round(n).toLocaleString('en-US') + ' km'; }

// 2 面のはじめ: 公転の説明 (設計書 5 章 3)。雲の海の上に 太陽・地球の通り道 (光の輪)・地球 (背景は 宇宙へ)。見て分かる速さに 縮めてある (本物の 1 年 1 周ではない)
const SUN_C = new THREE.Vector3(0, 80, -640), SUN_R = 26, ORB_R = 150, ORB_TILT = 0.42, EARTH_R = 13, MINI_H = 22, KMH2 = 107000;
const W_IDLE = 0.22, W_BEHIND = 0.32;   // 地球が 通り道を進む速さ (ラジアン/秒): ふだん / 取り残す場面
const BEHIND_SEC = 4.2, NEAR_SEC = 1.6, PULL_SEC = 3.4, DEPART2_SEC = 5.6;   // 取り残す場面 (おばけへ寄る 0.9 → 地球と一緒に引く 2.1 → 元へ 1.2) / 出発 = 太陽へ近づく 1.6 → 後ろへ引く 3.4 (最後の 0.6 秒で 白く)
const NEAR_D = 75, FAR_D = 920, EL0 = 0.02, EL1 = 0.025, HAZE_FROM = 360;   // 出発のカメラ: 太陽から 75 → 920 (前の 8 割。720 だと 海王星が 靄で見えなかった、10/20 社長)。土星 (380) の手前から 白い靄。通り道の面と ほぼ水平 (惑星の すぐ脇を すれちがう、10/20 社長)
const OTHERS2 = [   // 出発の時に出す ほかの惑星と 通り道 (半径は 見やすく縮めた並び。模様は 2 面と同じ planets/ の画像)
  { r:70, s:4, tex:'2k_mercury.jpg', w:1.4 }, { r:105, s:7, tex:'2k_venus_atmosphere.jpg', w:0.9 }, { r:195, s:6, tex:'2k_mars.jpg', w:0.5 }, { r:290, s:17, tex:'2k_jupiter.jpg', w:0.26 },
  { r:380, s:14, tex:'2k_saturn.jpg', w:0.19, ring:true }, { r:460, s:9, tex:'2k_uranus.jpg', w:0.13 }, { r:530, s:9, tex:'2k_neptune.jpg', w:0.1 } ];
const PASS_GAP = (s) => s * 2.2 + 6;   // 引いていく カメラの通り道から 惑星までの 横の間 (惑星の大きさの 2.2 倍 + 6。すれすれ)
const KUIPER_R0 = 590, KUIPER_R1 = 670;   // エッジワース・カイパーベルト (2 面の スタート地点の あたり)
function orbitExtra(ctx){
  const { scene, camera, glow, ghostTex, speedEl, sparkle, loader, earthFit, space, credit } = ctx;
  const own = [], grp = new THREE.Group(); grp.position.copy(SUN_C); grp.visible = false; scene.add(grp);
  const mk = (geo, mat) => { own.push(geo, mat); return new THREE.Mesh(geo, mat); };
  const sunMat = new THREE.MeshBasicMaterial({ color:0xffc84a, fog:false });
  const sun = mk(new THREE.SphereGeometry(SUN_R, 48, 24), sunMat); grp.add(sun);
  let dead = false; loadSun(loader, sunMat, own, () => dead);   // 太陽の表面 (Solar System Scope、CC BY 4.0。惑星と同じ所)。無ければ 黄色のまま
  const sunGlowM = new THREE.SpriteMaterial({ map:glow, color:0xffd27a, transparent:true, opacity:0.55, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }); own.push(sunGlowM);
  const sunGlow = new THREE.Sprite(sunGlowM); sunGlow.scale.setScalar(SUN_R * 5); grp.add(sunGlow);
  const corTex = coronaTex(); own.push(corTex);   // コロナ: 光の筋の絵を 2 枚 重ねて 逆向きに ゆっくり回し、ゆらいで見せる
  const corM = [0.75, 0.5].map(o => { const m = new THREE.SpriteMaterial({ map:corTex, color:0xffe2a0, transparent:true, opacity:o, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }); own.push(m); return m; });
  const cor = corM.map((m, i) => { const s = new THREE.Sprite(m); s.scale.setScalar(SUN_R * (i ? 4.4 : 5.6)); m.rotation = i * 0.7; grp.add(s); return s; });
  const light = new THREE.PointLight(0xfff2d0, 2.5, 0, 0); grp.add(light);   // 地球の 昼と夜は 太陽から
  const plane = new THREE.Group(); plane.rotation.x = ORB_TILT; grp.add(plane);   // 通り道の面を こちらへ少し傾けて 楕円に見せる
  const ringMat = new THREE.MeshBasicMaterial({ color:0xfff4c0, transparent:true, opacity:0.5, fog:false });
  const ring = mk(new THREE.TorusGeometry(ORB_R, 0.9, 8, 128), ringMat); ring.rotation.x = Math.PI / 2; plane.add(ring);
  const day = loader.load('planets/2k_earth_daymap.jpg'); day.colorSpace = THREE.SRGBColorSpace; own.push(day);
  const earth = mk(new THREE.SphereGeometry(EARTH_R, 32, 16), new THREE.MeshStandardMaterial({ map:day, roughness:1, metalness:0, fog:false })); plane.add(earth);
  const miniM = new THREE.SpriteMaterial({ map:ghostTex.hee[0], transparent:true, alphaTest:0.04, depthWrite:false, fog:false }); own.push(miniM);
  const mini = new THREE.Sprite(miniM); mini.scale.set(MINI_H * 0.75, MINI_H, 1); mini.visible = false; mini.renderOrder = 11; scene.add(mini);
  const others = OTHERS2.map(p => {   // ほかの惑星 (出発まで 隠す)
    const ringM = new THREE.MeshBasicMaterial({ color:0xcfd8ff, transparent:true, opacity:0, fog:false, depthWrite:false });
    const orb = mk(new THREE.TorusGeometry(p.r, 0.7, 6, 160), ringM); orb.rotation.x = Math.PI / 2; plane.add(orb);
    const tx = loader.load('planets/' + p.tex); tx.colorSpace = THREE.SRGBColorSpace; own.push(tx);
    const body = mk(new THREE.SphereGeometry(p.s, 32, 16), new THREE.MeshStandardMaterial({ map:tx, roughness:1, metalness:0, transparent:true, opacity:0, fog:false })); plane.add(body);
    if(p.ring){   // 土星の環: 環の画像 (色と すき間) を 半径の向きに 貼る (RingGeometry の uv は平面なので 半径で 付け直す)
      const rg = new THREE.RingGeometry(p.s * 1.11, p.s * 2.33, 96, 1), pos = rg.attributes.position, uv = rg.attributes.uv;
      for(let i = 0; i < pos.count; i++){ const r = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (r - p.s * 1.11) / (p.s * 1.22), 0.5); }
      const rt = loader.load('planets/2k_saturn_ring_alpha.png'); rt.colorSpace = THREE.SRGBColorSpace; own.push(rt);
      const rr = mk(rg, new THREE.MeshBasicMaterial({ map:rt, transparent:true, opacity:0, side:THREE.DoubleSide, fog:false, depthWrite:false })); rr.rotation.x = Math.PI / 2 - 0.4; body.add(rr); }
    return { p, orb, body, a:Math.random() * Math.PI * 2 };
  });
  const kp = new Float32Array(900 * 3);
  for(let i = 0; i < 900; i++){ const a = Math.random() * Math.PI * 2, r = KUIPER_R0 + Math.random() * (KUIPER_R1 - KUIPER_R0); kp.set([Math.cos(a) * r, (Math.random() - 0.5) * 12, Math.sin(a) * r], i * 3); }
  const kGeo = new THREE.BufferGeometry(); kGeo.setAttribute('position', new THREE.BufferAttribute(kp, 3));
  const kMat = new THREE.PointsMaterial({ color:0xcfd8ff, size:2.4, transparent:true, opacity:0, depthWrite:false, fog:false }); own.push(kGeo, kMat);
  const kuiper = new THREE.Points(kGeo, kMat); plane.add(kuiper);
  const op = new Float32Array(700 * 3);   // オールトの雲: 太陽系を 包む うっすらとした 星くずの殻 (カイパーベルトの さらに外)
  for(let i = 0; i < 700; i++){ const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 780 + Math.random() * 160, q = Math.sqrt(1 - u * u); op.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3); }
  const oGeo = new THREE.BufferGeometry(); oGeo.setAttribute('position', new THREE.BufferAttribute(op, 3));
  const oMat = new THREE.PointsMaterial({ color:0xdfe6ff, size:2.0, transparent:true, opacity:0, depthWrite:false, fog:false }); own.push(oGeo, oMat);
  plane.add(new THREE.Points(oGeo, oMat));
  const hazeM = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, depthTest:false, depthWrite:false, fog:false }); own.push(hazeM);
  const haze = mk(new THREE.PlaneGeometry(8, 8), hazeM); haze.renderOrder = 999; haze.visible = false; scene.add(haze);   // 白い靄: カメラの すぐ前に 置く白い板 (出発で 土星のあたりから 濃くなる)
  const st = { u:new THREE.Vector3(1, 0, 0), upN:new THREE.Vector3(0, 1, 0), appear:-1, th:Math.PI * 0.55, lap:null, w:W_IDLE, count:-1, behind:-1, depart:-1, from:new THREE.Vector3(), fromLook:new THREE.Vector3(), reveal:0 };   // th = 地球の 通り道の上の角度 (手前 = π/2 あたり)
  const q1 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), base = new THREE.Vector3(), baseLook = new THREE.Vector3(), pA = new THREE.Vector3(), lA = new THREE.Vector3(), pB = new THREE.Vector3(), lB = new THREE.Vector3(), sunW = new THREE.Vector3();
  const earthPos = (th, out) => out.set(Math.cos(th) * ORB_R, 0, Math.sin(th) * ORB_R);
  function show(instant){ if(grp.visible) return; grp.visible = true; st.appear = instant ? 99 : 0; credit('太陽・惑星の画像: Solar System Scope (CC BY 4.0)'); }   // クレジットは 画像を出す 所で (とばして 出発しても 出る、Codex 指摘 10/21)
  function closeShot(pos, look){ const fit = earthFit(); look.copy(mini.position); pos.copy(base).sub(look).normalize().multiplyScalar(55 * fit).add(look); }   // おばけへ ズームイン
  function wideShot(pos, look){   // おばけと 離れていく地球が 両方入る所まで 引く
    earth.getWorldPosition(v1); look.copy(mini.position).add(v1).multiplyScalar(0.5);
    const d = Math.max(90 * earthFit(), mini.position.distanceTo(v1) * 1.5 + 40); pos.copy(base).sub(look).normalize().multiplyScalar(d).add(look);
  }
  return {
    cue(name){
      if(name === 'orbitIn'){ show(false); sparkle(); space(true); return 2.0; }   // 背景は 宇宙へ (10/20 社長: 明るい天国だと 通り道や おばけが見にくい)
      if(name === 'orbitLap'){ show(true); st.lap = { t:0, from:st.th }; return 3.0; }   // 通り道を 1 周 (3 秒)
      if(name === 'orbitSpeed'){ show(true); st.count = 0; speedEl.classList.add('on'); return 2.0; }
      if(name === 'leftBehind'){   // 通り道の上の 地球のそばに 小さなおばけ → おばけへ ズームイン → 地球が離れていくのに合わせて 引く → 元へ (10/20 社長)
        show(true); if(st.lap){ st.th = st.lap.from + Math.PI * 2; st.lap = null; }
        st.count = -1; speedEl.classList.remove('on'); st.behind = 0; st.w = W_BEHIND;
        grp.updateMatrixWorld(true); earth.getWorldPosition(v1);
        mini.position.copy(v1).add(v2.set(0, EARTH_R * 1.5 * earthFit(), 0)); mini.visible = true;
        return BEHIND_SEC;
      }
      return undefined;
    },
    update(dt){
      if(!grp.visible) return;
      const fit = earthFit();
      if(st.appear >= 0 && st.appear < 99){ st.appear += dt; if(st.appear >= 1.8) st.appear = 99; }
      grp.scale.setScalar(Math.max(0.001, (st.appear >= 99 ? 1 : pop((st.appear - 0.4) / 1.4)) * fit));
      if(st.lap){ st.lap.t += dt; const k = ease(st.lap.t / 3.0); st.th = st.lap.from + Math.PI * 2 * k; if(st.lap.t >= 3.0) st.lap = null; }
      else if(st.depart < 0) st.th += st.w * dt;   // 出発の間は 並べた位置で 止める (すれちがいが 崩れない、Codex 指摘 10/20)
      earthPos(st.th, earth.position); earth.rotation.y += dt * 2.2;
      for(const o of others){ if(st.depart < 0) o.a += o.p.w * dt * 0.5; o.body.rotation.y += dt * 0.4; o.body.position.set(Math.cos(o.a) * o.p.r, 0, Math.sin(o.a) * o.p.r); }
      ringMat.opacity = st.lap ? 0.85 : 0.5;   // 1 周する間は 通り道を 明るく
      const now = performance.now() / 1000;
      sunGlowM.opacity = 0.5 + 0.08 * Math.sin(now * 3); sun.rotation.y += dt * 0.05;
      corM[0].rotation += dt * 0.03; corM[1].rotation -= dt * 0.045; corM[0].opacity = 0.7 + 0.08 * Math.sin(now * 1.7); corM[1].opacity = 0.45 + 0.08 * Math.sin(now * 2.3 + 1);
      cor[1].scale.setScalar(SUN_R * (4.4 + 0.15 * Math.sin(now * 1.3)));
      if(st.count >= 0){ st.count += dt; speedEl.innerHTML = speedHtml(KMH2 * ease(st.count / 2)); }
      grp.updateMatrixWorld(true);
      base.copy(camera.position); camera.getWorldDirection(baseLook).multiplyScalar(400).add(base);   // 天国のカメラ (ふだんの位置) を 基準に
      if(st.behind >= 0 && st.behind < BEHIND_SEC){
        st.behind += dt; const t = st.behind;
        closeShot(pA, lA); wideShot(pB, lB);
        if(t < 0.9){ const k = ease(t / 0.9); camera.position.lerpVectors(base, pA, k); v1.lerpVectors(baseLook, lA, k); }
        else if(t < 3.0){ const k = ease((t - 0.9) / 2.1); camera.position.lerpVectors(pA, pB, k); v1.lerpVectors(lA, lB, k); }
        else { const k = ease((t - 3.0) / 1.2); camera.position.lerpVectors(pB, base, k); v1.lerpVectors(lB, baseLook, k); }
        camera.lookAt(v1);
      }
      if(st.depart >= 0){   // 出発 (10/20 社長): ほかの惑星の通り道と カイパーベルトが現れる → 横に近い角度で 太陽へ近づく → 後ろへ ぐわーっと引き、水星 〜 海王星が 順に脇を流れる → 白
        st.depart += dt; const t = st.depart;
        st.reveal = Math.min(1, t / 1.0);
        for(const o of others){ o.orb.material.opacity = 0.42 * st.reveal; o.body.material.opacity = st.reveal; for(const c of o.body.children) c.material.opacity = 0.8 * st.reveal; }
        kMat.opacity = 0.85 * st.reveal; oMat.opacity = 0.5 * st.reveal; mini.material.opacity = 1 - st.reveal;
        grp.getWorldPosition(sunW);
        let D, el;   // 太陽からの 距離 (通り道の面の中の 単位) と 見下ろす角度
        if(t < NEAR_SEC){ D = NEAR_D; el = EL0; }
        else { const k = Math.min(1, (t - NEAR_SEC) / PULL_SEC); D = NEAR_D + (FAR_D - NEAR_D) * Math.pow(k, 2.2); el = EL0 + (EL1 - EL0) * k; }   // だんだん速く 引く
        plane.localToWorld(pB.set(st.u.x * D, D * Math.tan(el), st.u.z * D));
        if(t < NEAR_SEC){ const k = ease(t / NEAR_SEC); camera.position.lerpVectors(st.from, pB, k); v1.lerpVectors(st.fromLook, sunW, k); }
        else { camera.position.copy(pB); v1.copy(sunW); }
        camera.up.copy(st.upN); camera.lookAt(v1);   // 通り道の面を 水平に見せる。ずっと 太陽を見る
        const hz = Math.max(0, Math.min(1, (D - HAZE_FROM) / (FAR_D - HAZE_FROM)));   // 白い靄: 土星の手前から 濃くなり、天王星・海王星は 靄ごしに、カイパーベルト・オールトの雲の頃に ほぼ真っ白 (10/20 社長)
        hazeM.opacity = 0.92 * Math.pow(hz, 1.3); haze.visible = hz > 0;
        camera.getWorldDirection(v2); haze.position.copy(camera.position).addScaledVector(v2, 2); haze.quaternion.copy(camera.quaternion);
      }
    },
    depart(){
      if(st.depart < 0){
        show(true); st.appear = 99; space(true); grp.scale.setScalar(earthFit());   // 説明の前に とばしても 太陽系と 宇宙の背景を 出してから 出発 (Codex 指摘 10/20)
        st.depart = 0; st.behind = BEHIND_SEC; st.w = 0.05; st.from.copy(camera.position); camera.getWorldDirection(st.fromLook).multiplyScalar(400).add(camera.position); speedEl.classList.remove('on');
        grp.updateMatrixWorld(true); plane.worldToLocal(v1.copy(camera.position)); const az = Math.atan2(v1.z, v1.x); st.u.set(Math.cos(az), 0, Math.sin(az));   // いまの カメラの側から 近づいて、同じ向きへ 引く
        plane.getWorldQuaternion(q1); st.upN.set(0, 1, 0).applyQuaternion(q1);
        const line = [...others.map(o => ({ r:o.p.r, s:o.p.s, set:a => { o.a = a; } })), { r:ORB_R, s:EARTH_R, set:a => { st.th = a; } }].sort((x, y) => x.r - y.r);   // 水星 〜 海王星 (地球も) を 内から順に
        line.forEach((q, i) => q.set(az + (i % 2 ? -1 : 1) * PASS_GAP(q.s) / q.r));   // カメラが引いていく 通り道の すぐ脇に 左右交互に並べる (順に すれちがう)
        st.lap = null;
      }
      return DEPART2_SEC;
    },
    dispose(){ dead = true; scene.remove(grp); scene.remove(mini); scene.remove(haze); for(const r of new Set(own)) r.dispose(); }
  };
}

// 3 面のはじめ: 銀河の説明 (10/21 社長の流れ。s3-07 の 1 行の間に 続けて): 太陽系 (太陽を中心に 同心円を回る 惑星) → 小さなおばけが 地球に追いつき 一緒に回る (アップ)
//   → 太陽系が 銀河の中を進み始め 惑星の動きが らせんに (おばけは 取り残される) → 引いて 銀河の全体 (太陽系の場所は 光の印)
//   見る向きは 2 面の 公転の説明と同じ 水平 (惑星の回る面を こちらへ ORB_TILT 傾ける)。太陽系は 画面の上へ進み、銀河は 画面と平行な面 = 引くと 正面から 全体が見える (10/21 社長)
const KMH3 = 830000, GAL_R = 1300, SUN_IMG_Y = 0.69;   // 銀河の半径・想像図の中の 太陽の位置 (上から 69% = 中心の真下の オリオン腕。ESO の書き込み版 eso1339e で確認、10/21)
const MW_CREDIT = '天の川銀河の想像図: NASA/JPL-Caltech/ESO/R. Hurt (CC BY 4.0) ／ 太陽・地球の画像: Solar System Scope (CC BY 4.0)';
const SYS0 = new THREE.Vector3(0, 0.5, -9);   // 説明の始まりの 太陽系の場所 (天国のカメラの 正面。舞台が 1/20 なので 近くに置き、寄る動きを 前と同じ ゆるさに)
const T1 = 1.2, T2 = 2.6, T3 = 4.6, T4 = 7.6, T4H = 12.6, T5 = 18.1, GAL_IN_SEC = 18.3, GAL_DEPART_SEC = 4.0;   // 太陽系が出る → おばけが 地球へ → 一緒に回る (アップ) → らせんへ (取り残される) → らせんを 横から じっくり → 銀河の全体 (10/21 社長: らせんは 時間をかけて、全体は「こんどこそ」の頃まで。引き終わるまで s3-08 を 待たせ、s3-09 は 銀河の全体の上で)
const LOCAL3 = [ { r:8, s:0.6, col:0xb9b2a8, w:2.6 }, { r:12, s:0.9, col:0xe9cf96, w:1.9 }, { r:17, s:1.1, col:0x5aa0ff, w:1.4, earth:true }, { r:23, s:0.8, col:0xff6a4a, w:1.0 } ];   // 水星・金星・地球・火星 (同心円の半径・大きさ・光の筋の色・回る速さ)
const SUN3_R = 3.2, SUN3_SPEED = 14, TRAIL_N = 480, GHOST3_H = 3.6;   // 太陽の大きさ / 太陽系が進む 見かけの速さ / 光の筋の長さ (点の数) / 小さなおばけの高さ
const ORBIT_SLOW3 = 0.6;   // 同心円を回る間の 公転の速さ (10/21 社長「もう少し ゆっくり」)。らせんの場面では 1 秒で 元の速さへ戻す (らせんの形を 保つ)
const LOC_K = 1 / 20;   // 太陽系・おばけの 舞台の縮尺 (上の大きさ・速さは 舞台の中の数。銀河の全体を見ると 1 ドットほどの点になる、10/21 社長)
function galaxyExtra(ctx){
  const { scene, camera, glow, ghostTex, speedEl, sparkle, loader, space, credit } = ctx;
  const own = [], mk = (geo, mat) => { own.push(geo, mat); return new THREE.Mesh(geo, mat); };
  let dead = false;
  const gal = new THREE.Group(); gal.rotation.z = -Math.PI / 2; scene.add(gal);   // 銀河: 画面と平行に 立て、想像図を 右へ 90° 回す (太陽系の 進む向き = 画面の上)。腕の上の 太陽系の場所が SYS0 に来るように 置く
  const galTex = loader.load('planets/milkyway_eso1339g_2k.jpg'); galTex.colorSpace = THREE.SRGBColorSpace; const galMask = radialMask(); own.push(galTex, galMask);   // 天の川銀河の想像図 (ESO eso1339g、10/21 社長「出典に合わせたい」)。ふちは 丸く 消す (加算でも 四角い ふちが出ない)
  const galMat = new THREE.MeshBasicMaterial({ map:galTex, alphaMap:galMask, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false });
  gal.add(mk(new THREE.PlaneGeometry(GAL_R * 2, GAL_R * 2), galMat));
  const armW = new THREE.Vector3(0, (0.5 - SUN_IMG_Y) * GAL_R * 2, 0).applyQuaternion(gal.quaternion);   // 太陽の場所 = 想像図の 中心の真下 (絵の y は下向き → 面では 上向き)
  gal.position.copy(SYS0).sub(armW); gal.updateMatrixWorld(true);
  const dir = new THREE.Vector3(-1, 0, 0).applyQuaternion(gal.quaternion);   // 太陽系が 進む向き = 銀経 90° (想像図の 左向き = 回した後は 画面の上。銀河は 北から見て 時計回り)
  const VZ = new THREE.Vector3(0, 0, 1);   // カメラは いつも この向き (手前) から 水平に見る
  const nOrb = new THREE.Vector3(0, Math.cos(ORB_TILT), Math.sin(ORB_TILT));   // 惑星の回る面: 2 面と同じく 水平の面を こちらへ 少し傾けて 楕円に見せる
  const e1 = new THREE.Vector3(1, 0, 0), e2 = new THREE.Vector3(0, -Math.sin(ORB_TILT), Math.cos(ORB_TILT));   // 手前を 左へ 回る (2 面と同じ向き)
  const loc = new THREE.Group(); loc.position.copy(SYS0); loc.scale.setScalar(LOC_K); scene.add(loc);   // 太陽系・おばけの 小さな舞台 (中の座標は SYS0 が 原点)
  const toW = (v, out) => out.copy(v).multiplyScalar(LOC_K).add(SYS0);   // 舞台の中の座標 → 外 (カメラ・印・銀河の座標)
  const sysPos = new THREE.Vector3(), sysW = SYS0.clone(); let sysV = 0, sysS = 0;   // 太陽系の中心 (舞台の中 / 外)。らせんの場面から dir へ 進む
  const sunMat = new THREE.MeshBasicMaterial({ color:0xffc84a, fog:false }); loadSun(loader, sunMat, own, () => dead);
  const sun = mk(new THREE.SphereGeometry(SUN3_R, 32, 16), sunMat); loc.add(sun);
  const sgM = new THREE.SpriteMaterial({ map:glow, color:0xffd27a, transparent:true, opacity:0.8, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }); own.push(sgM);
  const sg = new THREE.Sprite(sgM); sg.scale.setScalar(SUN3_R * 6); loc.add(sg);
  const day = loader.load('planets/2k_earth_daymap.jpg'); day.colorSpace = THREE.SRGBColorSpace; own.push(day);
  const pls = LOCAL3.map(p => {
    const body = mk(new THREE.SphereGeometry(p.s, 20, 10), new THREE.MeshBasicMaterial(p.earth ? { map:day, fog:false } : { color:p.col, fog:false })); loc.add(body);
    const ringM = new THREE.MeshBasicMaterial({ color:0xcfd8ff, transparent:true, opacity:0, depthWrite:false, fog:false });
    const ring = mk(new THREE.TorusGeometry(p.r, 0.12, 6, 96), ringM); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nOrb); loc.add(ring);   // 同心円の 通り道 (輪の面の 法線 z を nOrb へ)
    const pos = new Float32Array(TRAIL_N * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color:p.col, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, fog:false })); own.push(geo, line.material); line.frustumCulled = false; loc.add(line);
    return { p, body, ring, ringM, line, pos, n:0, a:Math.random() * Math.PI * 2 };
  });
  const earthP = pls.find(q => q.p.earth);
  const ghM = new THREE.SpriteMaterial({ map:ghostTex.ganbaru[0], transparent:true, alphaTest:0.04, depthWrite:false, fog:false }); own.push(ghM);
  const gh = new THREE.Sprite(ghM); gh.scale.set(GHOST3_H * 0.75, GHOST3_H, 1); gh.renderOrder = 11; loc.add(gh);   // 小さなおばけ
  const markM = new THREE.SpriteMaterial({ map:glow, color:0xfff07a, transparent:true, opacity:0, depthWrite:false, fog:false, blending:THREE.AdditiveBlending }); own.push(markM);
  const mark = new THREE.Sprite(markM); scene.add(mark);   // 銀河の全体を見た時の 太陽系の場所の 光の印
  const hazeM = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, depthTest:false, depthWrite:false, fog:false }); own.push(hazeM);
  const haze = mk(new THREE.PlaneGeometry(8, 8), hazeM); haze.renderOrder = 999; scene.add(haze);
  const all = [gal, sun, sg, gh, mark, haze, ...pls.flatMap(q => [q.body, q.ring, q.line])];
  for(const o of all) o.visible = false;
  all.push(loc);
  const st = { t:-1, count:-1, depart:-1, left:false, from:new THREE.Vector3(), fromLook:new THREE.Vector3() };
  const ghFrom = new THREE.Vector3(), ghPos = new THREE.Vector3(), ghLeft = new THREE.Vector3(), rideP = new THREE.Vector3();
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), base = new THREE.Vector3(), baseLook = new THREE.Vector3(), up0 = new THREE.Vector3(0, 1, 0);
  const K = [0, 1, 2, 3, 4].map(() => ({ p:new THREE.Vector3(), l:new THREE.Vector3() }));   // カメラの 決め所 (0 ふだん / 1 太陽系 / 2 おばけのアップ / 3 取り残された所を横から / 4 銀河の全体)
  function show(instant){
    if(st.t >= 0) return;
    st.t = instant ? GAL_IN_SEC : 0; credit(MW_CREDIT);   // クレジットは 画像を出す 所で (とばして 出発しても 出る、Codex 指摘 10/21)
    for(const o of [sun, sg, gal, ...pls.flatMap(q => [q.body, q.ring])]) o.visible = true;
    ghFrom.set(4, 42, 4);   // おばけは 上から 飛んでくる (10/21 社長)
    camera.near = 0.02; camera.updateProjectionMatrix();   // 小さな舞台に 寄っても 切れない
    if(instant){ sysS = 80; sysV = SUN3_SPEED; st.left = true; ghLeft.set(0, 0, 0); ghPos.set(0, 0, 0); gh.visible = true; }   // 途中から (とばす・早送り) は 取り残された後の形で
  }
  const TAN = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const fitD = (hw, hh) => Math.max(hh / TAN, hw / (TAN * camera.aspect));   // 横 hw・縦 hh (中心からの 半分の幅) が 画面に入る 遠さ (スマホの縦長でも はみ出ない)
  function keys(t){
    K[0].p.copy(base); K[0].l.copy(baseLook);
    K[1].l.copy(SYS0); K[1].p.copy(SYS0).addScaledVector(VZ, fitD(46, 30) * LOC_K);   // 太陽系を 2 面と同じ 水平の向きから (同心円が 画面の横 半分ほど)
    toW(ghPos, K[2].l); K[2].p.copy(K[2].l).addScaledVector(VZ, fitD(6, 7) * LOC_K);   // おばけと 地球の アップ
    const gy = ghLeft.y, sy = sysPos.y + 14, d = Math.max(45, fitD(32, (sy - gy) / 0.85)), cy = gy + 0.1 * d * TAN;   // 取り残された おばけ (画面の 下から 45% = セリフの窓の上) と 上へ進む 太陽系 (上の端の 手前) が 両方入る (舞台の中の数)
    toW(v2.set(sysPos.x, cy, sysPos.z), K[3].l); K[3].p.copy(K[3].l).addScaledVector(VZ, d * LOC_K);
    const D = Math.max(GAL_R * 0.95 / (TAN * camera.aspect), GAL_R * 0.95 / (TAN - 0.1)); K[4].l.copy(gal.position); K[4].l.y -= D * 0.1; K[4].p.copy(K[4].l).addScaledVector(VZ, D);   // 銀河の全体を 正面から (中心は 画面の 少し上、10/21 社長。上へ ずらした分も 含めて 縦長・横長とも 画面に入る遠さ、Codex 指摘 10/21)。おばけや 惑星は 豆粒より小さくなる
  }
  const blend = (a, b, k) => { camera.position.lerpVectors(K[a].p, K[b].p, k); v1.lerpVectors(K[a].l, K[b].l, k); };
  return {
    cue(name){
      if(name === 'galaxyIn'){ show(false); sparkle(); space(true); st.hold = true; return T3; }   // s3-04 から (10/21 社長): 太陽系 → おばけが 地球に追いつき 一緒に回る。次の合図まで 回り続ける
      if(name === 'galaxySpiral'){ show(false); space(true); st.hold = false; if(st.t < T3){ st.t = T3; st.snap = true; } return T4H - T3; }   // s3-07: らせんへ → 取り残される → 横から じっくり (引くのは s3-08・s3-09 の間) (早送りで 追いつく前なら おばけを 地球の所へ)
      if(name === 'galaxySpeed'){ show(true); space(true); st.count = 0; speedEl.classList.add('on'); return Math.max(2.0, T5 - st.t + 0.6); }   // 銀河の全体まで 引き終わるまで この行で 待つ (10/21 社長「引けてない」: 前は 引き切る前に s3-10 の 大きな絵に 隠れた)
      return undefined;
    },
    update(dt){
      if(st.t < 0) return;
      const now = performance.now() / 1000;
      st.t += dt; if(st.hold && st.t > T3 - 0.001) st.t = T3 - 0.001; const t = st.t;   /* 一緒に回る所で 次の合図を待つ */
      if(t >= T3){ sysV = Math.min(SUN3_SPEED, sysV + SUN3_SPEED * dt); sysS += sysV * dt; }   // らせんの場面から 太陽系が 進み始める (1 秒で 速さに乗る)
      sysPos.copy(dir).multiplyScalar(sysS); toW(sysPos, sysW);
      const ap = t < T1 ? pop(t / T1) : 1;
      sun.position.copy(sysPos); sun.scale.setScalar(Math.max(0.001, ap)); sg.position.copy(sysPos); sun.rotation.y += dt * 0.1; sgM.opacity = 0.75 + 0.1 * Math.sin(now * 3);
      const wk = t < T3 ? ORBIT_SLOW3 : Math.min(1, ORBIT_SLOW3 + (1 - ORBIT_SLOW3) * (t - T3));
      for(const q of pls){
        q.a += q.p.w * wk * dt;
        q.body.position.copy(sysPos).addScaledVector(e1, Math.cos(q.a) * q.p.r * ap).addScaledVector(e2, Math.sin(q.a) * q.p.r * ap);
        q.ring.position.copy(sysPos); q.ring.scale.setScalar(Math.max(0.001, ap));
        q.ringM.opacity = 0.45 * (t < T3 ? 1 : Math.max(0, 1 - (t - T3) / 1.0)); q.ring.visible = q.ringM.opacity > 0.01;   // らせんに変わると 同心円の通り道は 消える
        if(t >= T3){ q.line.visible = true; if(q.n < TRAIL_N) q.n++; q.pos.copyWithin(3, 0, (TRAIL_N - 1) * 3); q.pos[0] = q.body.position.x; q.pos[1] = q.body.position.y; q.pos[2] = q.body.position.z; q.line.geometry.attributes.position.needsUpdate = true; q.line.geometry.setDrawRange(0, q.n); }
      }
      rideP.copy(earthP.body.position).sub(sysPos).setLength(earthP.p.r * ap + 2.4).add(sysPos);   // 地球の すぐ外側 (一緒に回る所)
      if(st.snap){ ghPos.copy(rideP); st.snap = false; }
      if(!st.left){
        if(t < T1){ gh.visible = false; ghPos.copy(ghFrom); }
        else if(t < T2){ gh.visible = true; ghPos.lerpVectors(ghFrom, rideP, ease((t - T1) / (T2 - T1))); ghM.map = ghostTex.ganbaru[0]; }   // 地球へ 飛んで 追いつく
        else if(t < T3){ ghPos.copy(rideP); ghM.map = ghostTex.egao[0]; }   // 地球と 一緒に 同心円を回る
        else { st.left = true; ghLeft.copy(ghPos); }
      }
      if(st.left){ gh.visible = true; ghPos.copy(ghLeft); ghM.map = ghostTex.odoroki[0]; }   // 太陽系が 進み始めると その場に 取り残される (早送りで 出る前に ここへ来ても 映す、Codex 指摘 10/21)
      gh.position.copy(ghPos);
      if(st.count >= 0){ st.count += dt; speedEl.innerHTML = speedHtml(KMH3 * ease(st.count / 2)); if(st.count > 3.5){ speedEl.classList.remove('on'); st.count = -1; } }
      base.copy(camera.position); camera.getWorldDirection(baseLook).multiplyScalar(400).add(base);   // 天国のカメラ (ふだんの位置) を 基準に
      keys(t);
      if(st.depart < 0){
        if(t < T1) blend(0, 1, ease(t / T1));
        else if(t < T2) blend(1, 2, ease((t - T1) / (T2 - T1)));
        else if(t < T3) blend(2, 2, 0);
        else if(t < T4) blend(2, 3, ease((t - T3) / (T4 - T3)));
        else if(t < T4H) blend(3, 3, 0);   // らせんと 取り残された おばけを 横から じっくり
        else if(t < T5){ const R = Math.max(2, K[4].p.distanceTo(K[4].l) / K[3].p.distanceTo(K[3].l)); blend(3, 4, (Math.pow(R, ease((t - T4H) / (T5 - T4H))) - 1) / (R - 1)); }   // ゆっくり 引いて 銀河の全体へ (遠ざかり方が いつも同じ割合に 見える 引き方。酔いにくい)
        else blend(4, 4, 0);
        camera.up.copy(up0); camera.lookAt(v1);
      } else {   // 出発: 銀河の中の 太陽系の印へ 飛び込み、白い靄で 真っ白に (① 天の川の世界へ)
        st.depart += dt; const k = Math.min(1, st.depart / GAL_DEPART_SEC), e = Math.pow(k, 2.2);
        camera.position.lerpVectors(st.from, v1.copy(sysW).addScaledVector(VZ, 20 * LOC_K), e); camera.up.copy(up0); camera.lookAt(sysW);
        hazeM.opacity = 0.95 * Math.pow(Math.max(0, (k - 0.4) / 0.6), 1.3); haze.visible = hazeM.opacity > 0;
        camera.getWorldDirection(v1); haze.position.copy(camera.position).addScaledVector(v1, 2); haze.quaternion.copy(camera.quaternion);
      }
      galMat.opacity = t < T3 ? 0 : Math.min(1, Math.max(0, (camera.position.z - SYS0.z - 200) / 900)); gal.visible = galMat.opacity > 0.01;   // 銀河は 引くにつれて 浮かび上がる (近くでは 絵が ぼやけるので 出さない)。カメラを 動かした後に 測る (前は 動かす前の 天国の位置で 測っていて 出なかった、10/21)
      const camD = camera.position.distanceTo(sysW);
      mark.position.copy(sysW); mark.scale.setScalar(camD * 0.015); markM.opacity = t >= T4H ? Math.min(1, (t - T4H)) * (0.75 + 0.25 * Math.sin(now * 6)) : 0; mark.visible = markM.opacity > 0.01;   // 太陽系の場所の 小さな光の印 (画面の上で いつも同じ大きさ。太陽系そのものは 1 ドットほど)
    },
    depart(){ if(st.depart < 0){ show(true); space(true); st.depart = 0; st.from.copy(camera.position); speedEl.classList.remove('on'); st.count = -1; } return GAL_DEPART_SEC; },
    dispose(){ dead = true; for(const o of all) scene.remove(o); for(const r of new Set(own)) r.dispose(); }
  };
}

export function introExtra(n){   // 天国の場面に足す 3D の説明。ctx = { scene, camera, glow, ghostTex, speedEl, sparkle, loader, earthFit, space, credit }
  return n === 2 ? orbitExtra : galaxyExtra;
}
