// エンディング (10/27): 子ども部屋で 真っ白に なった後、赤ちゃんの目から 見た景色。目を閉じて むにゃむにゃ → 瞬きしながら 目が開く → 白い世界に ぼんやり 人影 → タップで ばあ！ (赤ちゃんの 絵の 顔に 寄った所から 上半身まで 引く) → 歓声・おしまい → タップで 結果発表
// 設計書 docs/superpowers/specs/2026-10-27-ganbare-obake-ending-design.md 2・3 章
import { createTalk, preloadVoices, loadSound, audioOut } from './talk.js';

const LINES = [   // 声の台本 (10/26 版。声優さんの連絡で「人を」「いくぞ！」)。おばけの 顔の絵は 出さない (cast なし = 赤ちゃんの目から 見た 景色)
  { id:'e-04', who:'obake', cast:[], text:'むにゃむにゃ… どうやら {地球|ちきゅう}に {追|お}いついたみたい…' },
  { id:'e-05', who:'obake', text:'よし… {人|ひと}を おどろかせてやるんだ…' },
  { id:'e-06', who:'obake', text:'…ぼんやり {人影|ひとかげ}が {見|み}える…', cue:'shadow' },
  { id:'e-07', who:'obake', text:'いくぞ！' }
];

const CSS = `
.ed-root{position:fixed;inset:0;z-index:30;pointer-events:none;overflow:hidden;background:#fff}
.ed-shadows{position:absolute;inset:0;--s:max(56vmin,38vw);transition:opacity .5s ease}
.ed-hide .ed-shadows{opacity:0}
.ed-sh{position:absolute;width:calc(var(--s)*var(--k));height:calc(var(--s)*var(--k)*2);transform-origin:50% 18%;opacity:0;transition:transform 3.2s cubic-bezier(.25,.6,.3,1),opacity 2.6s ease}
.ed-shadow-on .ed-sh{opacity:1}
.ed-sh:nth-child(1){--k:1;--c:#8a8682;left:calc(var(--s)*-.14);top:15%;transform:translateX(-30%) rotate(17deg)}
.ed-sh:nth-child(2){--k:.74;--c:#84868b;right:calc(var(--s)*-.05);top:1%;transform:translateX(30%) rotate(-7deg);transition-delay:.9s}
.ed-shadow-on .ed-sh:nth-child(1){transform:translateX(0) rotate(17deg)}
.ed-shadow-on .ed-sh:nth-child(2){transform:translateX(0) rotate(-7deg)}
.ed-sh i{position:absolute;inset:0;opacity:.58;filter:blur(calc(var(--s)*var(--k)*.06));animation:ed-haze 3.7s ease-in-out infinite}
.ed-sh:nth-child(2) i{opacity:.42;animation-duration:3.1s;animation-delay:-1.3s}
.ed-sh i::before{content:"";position:absolute;left:17%;top:0;width:66%;height:41%;border-radius:48% 48% 44% 44%/50% 50% 50% 50%;background:var(--c);animation:ed-sway 2.3s ease-in-out infinite}
.ed-sh:nth-child(2) i::before{left:21%;width:58%;height:36%;border-radius:50%;animation-duration:2.9s}
.ed-sh i::after{content:"";position:absolute;left:-25%;width:150%;top:33%;height:75%;border-radius:45% 45% 0 0/30% 30% 0 0;background:var(--c)}
.ed-sh:nth-child(2) i::after{left:-32%;width:164%;top:30%}
@keyframes ed-haze{0%,100%{transform:skewX(0) scaleY(1)}30%{transform:skewX(2.5deg) scaleY(1.015)}65%{transform:skewX(-2deg) scaleY(.99)}}
@keyframes ed-sway{0%,100%{transform:translateX(0)}50%{transform:translateX(4%)}}
.ed-lid{position:absolute;inset:0;display:none}
.ed-baa{position:absolute;inset:0;overflow:hidden;opacity:0;pointer-events:none;background:#fdf1df}
.ed-baa-on .ed-baa{opacity:1;pointer-events:auto;transition:opacity .12s ease}
.ed-bg{position:absolute;inset:-2%;background:url(assets/ending/haikei.jpg) center/cover}
.ed-baby{position:absolute;left:0;top:0;width:1143px;height:1600px;max-width:none;transform-origin:0 0;will-change:transform;user-select:none;-webkit-user-select:none}
.ed-owari{position:absolute;right:max(20px,4vw);bottom:calc(max(20px,5vh) + env(safe-area-inset-bottom));font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;font-weight:bold;font-size:clamp(30px,8vmin,64px);letter-spacing:.08em;color:#c0603a;text-shadow:0 0 6px #fff,0 0 3px #fff,0 2px 0 #fff;opacity:0;transform:translateY(12px);transition:opacity .9s ease,transform .9s cubic-bezier(.25,.6,.3,1)}
.ed-owari-on .ed-owari{opacity:1;transform:none}
.tk-root.ed-talk .tk-box{box-shadow:0 2px 16px rgba(170,130,50,.28)}
.tk-root.ed-talk .tk-go{top:70%;color:#f29a1f;text-shadow:0 0 8px #fff,0 0 2px #fff}
`;
function injectCss(){ if(document.getElementById('ed-css')) return; const st = document.createElement('style'); st.id = 'ed-css'; st.textContent = CSS; document.head.appendChild(st); }

// はじめ (10/27 社長): 映画の 終わりのように 画面全体が じわーっと 灰色へ → 十分 灰色に なったら むにゃむにゃ → 瞬きしながら 目が開く (「瞬きしたみたいに 楕円形に 見える範囲が 広がっていく」)
const FADE = 2.5, TALK_AT = 3.0;   // 灰色に なりきる 秒 / 会話を 始める 秒 (e-04 は 6.2 秒)
const LID_KEYS = [[0, 0], [2.0, 0], [2.6, .16], [3.2, .16], [3.4, 0], [3.6, 0], [4.4, .42], [5.4, .42], [5.55, .04], [5.7, .04], [7.2, 1]];   // 会話の 始まりからの [秒, 目の開き 0〜1]: 「むにゃむにゃ…」の間は 閉じたまま → 細く開く → 瞬き → 半分 → 瞬き → 全開 (e-05 の 少し前)
const LID_RGB = '132,133,138', LID = `rgb(${LID_RGB})`;   // まぶたの裏の色 = 人影と 同じ 灰色 (10/27 社長「背景は 白、人影は グレー」= 白と 灰色だけの 世界)
// ばあ！ (10/27 社長「赤ちゃんの まん中に カメラが 寄っている 状態から 後ろに 下がっていく。上半身くらいが 見える 所で ストップ、歓声が 聞こえて 右下に おしまい」)
const BABY = { face:[590, 560], box:[140, 150, 1020, 1130] };   // 絵 (assets/ending/baa.png、1143 × 1600) の 中の 位置: 寄り始めの 顔の まん中 / 止まる 上半身の 枠 (頭の 上 〜 おなかの ボタン、両手も 入る)
const ZOOM = 2.6, CHEER_AT = 2.7, OWARI_AT = 3.1, OWARI_TAP = 0.6;   // 引く 秒 / 歓声 (効果音ラボ「歓声と拍手 1」約 4 秒) / おしまい / おしまいから タップを 受けるまで (秒、ばあ！ から)
function lidOpen(t){
  if(t <= 0) return 0;
  for(let i = 1; i < LID_KEYS.length; i++){
    const [t1, o1] = LID_KEYS[i];
    if(t < t1){ const [t0, o0] = LID_KEYS[i - 1], k = (t - t0) / (t1 - t0); return o0 + (o1 - o0) * k * k * (3 - 2 * k); }
  }
  return 1;
}
function drawLid(el, o){
  if(o >= 1){ el.style.display = 'none'; return; }
  el.style.display = 'block';
  if(o <= 0){ el.style.background = LID; return; }
  const rx = innerWidth * (0.7 + 0.8 * o), ry = Math.max(2, innerHeight * 1.45 * o);   // 開くほど 横にも 広がる。全開の 手前で 四隅まで 透明
  el.style.background = `radial-gradient(${rx.toFixed(0)}px ${ry.toFixed(0)}px at 50% 46%, rgba(${LID_RGB},0) 52%, ${LID} 100%)`;
}

export function createEnding({ root, talkRoot, actx, faces, onDone, log }){   // root = エンディングの層 (白い幕の上・会話の下)、talkRoot = 会話の画面の 置き場。onDone = おしまいの 後の タップ (→ 結果発表)
  injectCss();
  root.className = 'ed-root'; root.hidden = false;
  root.innerHTML = '<div class="ed-shadows"><div class="ed-sh"><i></i></div><div class="ed-sh"><i></i></div></div><div class="ed-lid"></div><div class="ed-baa"><div class="ed-bg"></div><img class="ed-baby" src="assets/ending/baa.png" width="1143" height="1600" alt="" draggable="false"><div class="ed-owari">おしまい</div></div>';   // ばあ！の 絵は 先に 読んでおく。人影 2 つ (お父さんと お母さんが 左右から すぐ近くで のぞき込む。左右対称だと 怖いので 左 = 近く 大きく 低め、右 = 奥で 小さく 高め・少し 遅れて 出る。赤ちゃんの 目なので 大きく ぼかす。灰色で 陽炎のように ゆらゆら、目鼻は なし = 怖く しない)
  const lid = root.querySelector('.ed-lid'), baa = root.querySelector('.ed-baa'), bg = root.querySelector('.ed-bg'), baby = root.querySelector('.ed-baby'), VOICE_DIR = 'assets/voice/';
  let talk = null, done = false, t = 0, baaT = -1, cheered = false; const snd = [];   // snd = 鳴らした 音 (片づけで ふわっと 消す。歓声は 約 4 秒 = おしまいの 後の タップでは まだ 鳴っている、Codex 指摘 10/27)
  const play = (url, vol) => { if(actx) loadSound(actx, url).then(buf => { if(!buf || done || actx.state !== 'running') return; const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = vol; s.buffer = buf; s.connect(g).connect(audioOut(actx)); s.onended = () => g.disconnect(); s.start(); snd.push({ s, g }); }); };
  const startBaa = () => {   // タップで ばあ！ (とばす も 同じ): 会話を 片づけ、声と 一緒に 背景と 赤ちゃんの 絵を ぱっと 出す
    if(baaT >= 0 || done) return; baaT = 0;
    if(talk){ talk.dispose(); talk = null; }
    root.classList.add('ed-hide', 'ed-baa-on'); placeBaby(0);
    play(VOICE_DIR + 'e-08.mp3', 1);
    if(log) log('baa');
  };
  const placeBaby = k => {   // k = 引く 割合 0〜1。顔の まん中に 大きく 寄った所 → 上半身の 枠が 収まる所 (縦持ち・横長 どちらでも 毎コマ 画面の 形で 計算)
    const W = innerWidth, H = innerHeight, [x0, y0, x1, y1] = BABY.box, s1 = Math.min(W / (x1 - x0), H / (y1 - y0)) * 0.92, s0 = Math.max(W, H) / 560;
    const e = 1 - Math.pow(1 - k, 3), s = s0 * Math.pow(s1 / s0, e);   // 初めは 速く 引き、ゆっくり 止まる。大きさは 割合で 縮める (引く 速さが 一定に 見える)
    const fx = BABY.face[0] + ((x0 + x1) / 2 - BABY.face[0]) * e, fy = BABY.face[1] + ((y0 + y1) / 2 - BABY.face[1]) * e;
    baby.style.transform = `translate(${(W / 2 - fx * s).toFixed(1)}px, ${(H * (0.5 - 0.03 * e) - fy * s).toFixed(1)}px) scale(${s.toFixed(4)})`;
    bg.style.transform = `scale(${(1 + 0.25 * (1 - e)).toFixed(3)})`;
  };
  const end = () => { if(done) return; done = true; onDone(); };   // おしまいの 後の タップ → 結果発表
  baa.addEventListener('pointerdown', e => { e.preventDefault(); if(baaT >= OWARI_AT + OWARI_TAP) end(); });
  return {
    start(){ if(actx){ preloadVoices(actx, VOICE_DIR, [...LINES, { id:'e-08' }]); preloadVoices(actx, 'assets/ending/', [{ id:'cheer' }]); } },   // 灰色に なる 間に 声と 歓声を 読み込んでおく
    update(dt){
      t += dt;
      if(baaT >= 0){
        baaT += dt; placeBaby(Math.min(1, baaT / ZOOM));
        if(!cheered && baaT >= CHEER_AT){ cheered = true; play('assets/ending/cheer.mp3', 0.8); }
        if(baaT >= OWARI_AT) root.classList.add('ed-owari-on');
        return;
      }
      if(t < FADE){ const k = t / FADE; lid.style.display = 'block'; lid.style.background = LID; lid.style.opacity = (k * k * (3 - 2 * k)).toFixed(3); }
      else { lid.style.opacity = 1; drawLid(lid, lidOpen(t - TALK_AT)); }
      if(!talk && t >= TALK_AT){
        talk = createTalk({ root:talkRoot, faces, actx, voiceDir:VOICE_DIR, endPrompt:'タップで ばあ！', onCue:n => { if(n === 'shadow') root.classList.add('ed-shadow-on'); return 0; }, onEnd:startBaa, log });
        talkRoot.classList.add('ed-talk'); talk.start(LINES);
      }
      if(talk) talk.update(dt);
    },
    dispose(){
      if(talk){ talk.dispose(); talk = null; } done = true; root.innerHTML = ''; root.className = ''; root.hidden = true;
      const t0 = actx ? actx.currentTime : 0;
      for(const { s, g } of snd.splice(0)){ g.gain.setValueAtTime(g.gain.value, t0); g.gain.linearRampToValueAtTime(0, t0 + 0.5); try{ s.stop(t0 + 0.55); }catch(_){} }   // 鳴っている 声・歓声を 0.5 秒で 消す (結果発表・タイトルへ 持ち越さない)
    }
  };
}
