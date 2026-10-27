// 会話の画面 (10/19): 神様とおばけの絵 + 文字の箱 + 自動送り + タップで早送り + 声。導入・2 面/3 面のはじめ・エンディングで 共通に使う
// 台本の 1 行 = { id, who:'obake'|'kami'|'mama', face, listen, text, cast, layout, cue }。cast・layout は 書かなければ 前の行のまま
// 文の中の {漢字|かな} は ふりがな付きの漢字になる

export const VOICE_PAD = 0.8;   // 声の終わりから 次の行まで (秒)
let outNode = null, outVol = 1;   // 全部の 音の 出口 = 音の 大きさの つまみ (オプション、10/27 社長)。曲・声・効果音は actx.destination でなく ここへ つなぐ
export function audioOut(actx){ if(!outNode){ outNode = actx.createGain(); outNode.gain.value = outVol; outNode.connect(actx.destination); } return outNode; }
export function setAudioVolume(actx, v){ outVol = v; if(outNode) outNode.gain.setTargetAtTime(v, actx.currentTime, 0.05); }
const TAP_GAP = 0.25, END_GAP = 0.4;   // 行が出てから この秒数は タップを受けない (連打で 2 行進まない) / 「タップで しゅっぱつ！」が出てから この秒数は受けない
const NAMES = { obake:'おばけ', kami:'かみさま', mama:'おかあさん' };

const CSS = `
.tk-root{position:fixed;inset:0;z-index:40;font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent}
.tk-ch{position:absolute;transition:left .5s ease,right .5s ease,top .5s ease,bottom .5s ease,width .5s ease,opacity .4s ease,filter .3s ease;pointer-events:none}
.tk-fr{position:relative;width:100%}
.tk-fr img{position:absolute;display:block}
.tk-obake .tk-fr{aspect-ratio:0.708}.tk-obake img{width:143.7%;left:-25.1%;top:-19.3%}
.tk-kami .tk-fr{aspect-ratio:0.642}.tk-kami img{width:107.8%;left:-1.08%;top:-7.8%}
.tk-kami{right:4vw;top:calc(6vh + env(safe-area-inset-top));width:min(46vw,260px)}
.tk-obake{left:4vw;bottom:calc(clamp(118px,22vh,176px) + env(safe-area-inset-bottom));width:min(40vw,220px)}
.tk-corner .tk-kami{right:2vw;top:34vh;width:min(25vw,143px)}
.tk-corner .tk-obake{left:2vw;width:min(22vw,121px)}
.tk-dim{filter:saturate(.75) brightness(.92);opacity:.85}
.tk-hide{opacity:0}
.tk-box{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom));width:min(720px,calc(100vw - 16px));box-sizing:border-box;min-height:calc(1.75em * 3 + 30px);background:rgba(255,255,255,.94);border:2px solid #f2c96b;border-radius:14px;padding:18px 14px 12px;font-size:clamp(15px,4.2vw,22px);line-height:1.75;color:#333;box-shadow:0 2px 8px rgba(0,0,0,.15);pointer-events:none}
.tk-box rt{font-size:.5em;color:#7a5a20}
.tk-nm{position:absolute;top:-14px;left:14px;background:#ffd66b;color:#5a3b00;border-radius:9px;padding:1px 12px;font-weight:bold;font-size:clamp(12px,3.4vw,16px)}
.tk-nm.tk-k{background:#fff3c4}
.tk-go{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-size:clamp(18px,5vw,28px);font-weight:bold;color:#fff;text-shadow:0 0 6px rgba(80,60,0,.8),0 0 2px #000;display:none;pointer-events:none;animation:tk-blink 1.2s ease-in-out infinite}
.tk-end .tk-go{display:block}
@keyframes tk-blink{50%{opacity:.35}}
.tk-skip{position:absolute;top:calc(10px + env(safe-area-inset-top));right:10px;border:0;border-radius:14px;padding:6px 14px;background:rgba(0,0,0,.35);color:#fff;font:inherit;font-size:14px;cursor:pointer}
.tk-enter .tk-obake{animation:tk-up .8s cubic-bezier(.2,1.4,.4,1)}
.tk-entering .tk-box{opacity:0}
@keyframes tk-up{from{transform:translateY(70vh)}}
.tk-leave .tk-box,.tk-leave .tk-kami,.tk-leave .tk-skip,.tk-leave .tk-go{opacity:0;transition:opacity .3s ease}
.tk-leave .tk-obake{transform:translateY(75vh) scale(.8);opacity:0;filter:none;transition:transform .8s ease-in,opacity .6s ease-in .2s}
`;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const RUBY = /\{([^|}]+)\|([^}]+)\}/g;

export function rubyHtml(src){
  let out = '', i = 0;
  for(const m of src.matchAll(RUBY)){ out += esc(src.slice(i, m.index)) + '<ruby>' + esc(m[1]) + '<rt>' + esc(m[2]) + '</rt></ruby>'; i = m.index + m[0].length; }
  return out + esc(src.slice(i));
}

export function textWait(src){   // 文字だけの時の 待ち時間 (秒)。ふりがなと空白は数えない
  const n = [...src.replace(RUBY, '$1').replace(/\s/g, '')].length;
  return Math.max(2.5, n * 0.12 + 1.5);
}

const voiceCache = new Map();   // 声のファイル → 読み込み (AudioBuffer か null)。タイトル画面の間から 先読みしておく (最初の行に 間に合うように、Codex 指摘 10/19)
export function loadSound(actx, url){   // 声・効果音を 1 回だけ読む (読めない時は null)。エンディングの 歓声も 使う (片づけで ふわっと 消すため 自分で 鳴らす、10/27)
  if(!voiceCache.has(url)) voiceCache.set(url, fetch(url).then(r => r.ok ? r.arrayBuffer() : null)
    .then(ab => ab && new Promise(ok => actx.decodeAudioData(ab, ok, () => ok(null)))).catch(() => null));
  return voiceCache.get(url);
}
export function preloadVoices(actx, voiceDir, lines){
  if(!actx) return;
  for(const L of lines) loadSound(actx, voiceDir + L.id + '.mp3');
}
export function playSound(actx, url, vol = 1, valid = () => true){   // 1 回 鳴らす (結果発表の 神様の声・拍手 など)。無い・読めない・音が出せない・読めた時には もう要らない (valid が false) 時は 鳴らさない。鳴らした音 (止める時に使う) か null を返す (Promise)
  if(!actx) return Promise.resolve(null);
  return loadSound(actx, url).then(buf => {
    if(!buf || actx.state !== 'running' || !valid()) return null;
    const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = vol; s.buffer = buf; s.connect(g).connect(audioOut(actx)); s.onended = () => g.disconnect(); s.start();
    return s;
  });
}
const LATE_VOICE = 1.0;   // 行が出てから この秒数までに 声が届けば 遅れて鳴らす (それより遅いと 文字の時間のまま)

export function createTalk({ root, faces, actx, voiceDir, onCue, onEnd, log, endPrompt = 'タップで しゅっぱつ！' }){
  if(!document.getElementById('talk-css')){ const st = document.createElement('style'); st.id = 'talk-css'; st.textContent = CSS; document.head.appendChild(st); }
  root.className = 'tk-root';
  root.innerHTML = '<div class="tk-ch tk-kami tk-hide"><div class="tk-fr"><img alt=""></div></div><div class="tk-ch tk-obake tk-hide"><div class="tk-fr"><img alt=""></div></div>'
    + '<div class="tk-box"><span class="tk-nm"></span><div class="tk-tx"></div></div><div class="tk-go"></div><button class="tk-skip" type="button">とばす</button>';
  root.hidden = false;
  const el = { kami: root.querySelector('.tk-kami'), obake: root.querySelector('.tk-obake') };
  const img = { kami: el.kami.querySelector('img'), obake: el.obake.querySelector('img') };
  const nm = root.querySelector('.tk-nm'), tx = root.querySelector('.tk-tx'), skipBtn = root.querySelector('.tk-skip');
  root.querySelector('.tk-go').textContent = endPrompt;
  for(const who of ['obake', 'kami']) for(const url of Object.values(faces[who] || {})){ const im = new Image(); im.src = url; }   // 表情の差し替えで ちらつかないよう 先に読む

  const gain = actx ? actx.createGain() : null; if(gain){ gain.gain.value = 1; gain.connect(audioOut(actx)); }
  const voices = new Map(); let src = null;
  let lines = [], idx = -1, t = 0, wait = 0, cueSec = 0, phase = 'idle', endT = 0, cast = ['obake'], layout = 'stage', enterIdx = 0;
  const face = { obake: null, kami: null };

  const stopVoice = () => { if(src){ try{ src.stop(); }catch(e){} src.disconnect(); src = null; } };
  const playVoice = buf => { src = actx.createBufferSource(); src.buffer = buf; src.connect(gain); src.start(); };
  const onVoice = (id, buf) => {   // 声が届いた: 今の行の声で まだ鳴らしておらず、行が出てすぐなら 遅れて鳴らす
    if(!buf || phase === 'done') return;
    voices.set(id, buf);
    if(phase === 'line' && lines[idx] && lines[idx].id === id && !src && t < LATE_VOICE && actx.state === 'running'){
      playVoice(buf); wait = Math.max(t + buf.duration + VOICE_PAD, cueSec);
      if(log) log(id + ' late voice wait ' + wait.toFixed(2));
    }
  };
  const setFace = (who, f) => { if(f && f !== face[who] && faces[who] && faces[who][f]){ face[who] = f; img[who].src = faces[who][f]; } };

  function show(i){
    const L = lines[i]; idx = i; t = 0;
    if(L.cast) cast = L.cast; if(L.layout) layout = L.layout;
    root.classList.toggle('tk-corner', layout === 'corner');
    for(const who of ['obake', 'kami']){ el[who].classList.toggle('tk-hide', !cast.includes(who)); el[who].classList.toggle('tk-dim', who !== L.who); }
    setFace(L.who, L.face);
    const other = L.who === 'obake' ? 'kami' : L.who === 'kami' ? 'obake' : null;
    if(other) setFace(other, L.listen);
    nm.textContent = NAMES[L.who] || ''; nm.classList.toggle('tk-k', L.who !== 'obake');
    tx.innerHTML = rubyHtml(L.text);
    cueSec = L.cue ? (onCue(L.cue, L) || 0) : 0;
    stopVoice();
    const buf = voices.get(L.id);
    if(buf && actx.state === 'running'){ playVoice(buf); wait = Math.max(buf.duration + VOICE_PAD, cueSec); }
    else wait = Math.max(textWait(L.text), cueSec);
    if(log) log(L.id + ' wait ' + wait.toFixed(2) + (buf ? ' voice' : ''));
  }
  function next(){
    stopVoice();
    if(idx + 1 < lines.length) show(idx + 1);
    else { phase = 'end'; endT = 0; root.classList.add('tk-end'); }   /* 「タップで しゅっぱつ！」は 画面の真ん中 (10/19 社長) */
  }
  function finish(){
    if(phase === 'done') return;
    phase = 'done'; stopVoice(); root.classList.remove('tk-end');
    if(log) log('end');
    onEnd();
  }

  function tap(){
    if(actx && actx.state === 'suspended') actx.resume().catch(() => {});
    if(phase === 'line'){ if(t >= TAP_GAP) next(); }
    else if(phase === 'end'){ if(endT >= END_GAP) finish(); }
  }
  const onDown = e => { e.preventDefault(); tap(); };
  const onSkip = e => { e.preventDefault(); e.stopPropagation(); finish(); };
  root.addEventListener('pointerdown', onDown);
  skipBtn.addEventListener('pointerdown', onSkip);

  return {
    start(list, from = 0, { enter } = {}){   // enter = 'up': おばけの絵が 画面の下から ニョッキと せり上がり、最初の行は その分 遅れて進む (2 面・3 面のはじめ、10/20)
      lines = list; phase = 'line';
      for(let i = 0; i < from && i < list.length; i++){ if(list[i].cast) cast = list[i].cast; if(list[i].layout) layout = list[i].layout; }   // 途中から始めても 並びは その行までの続きに
      if(actx){ preloadVoices(actx, voiceDir, list); for(const L of list) voiceCache.get(voiceDir + L.id + '.mp3').then(buf => onVoice(L.id, buf)); }
      const first = Math.min(from, list.length - 1);
      if(enter === 'up'){   // せり上がる 0.8 秒の間は 何も話さない (文字の箱も 出さない)。終わってから 最初の行 (文字・声・自動送り・タップの時計) を始める (Codex 指摘 10/20)
        phase = 'enter'; enterIdx = first; t = 0; root.classList.add('tk-enter', 'tk-entering');
        el.obake.classList.remove('tk-hide'); setFace('obake', list[first].face);
      } else show(first);
    },
    update(dt){
      if(phase === 'enter'){ t += dt; if(t >= 0.8){ phase = 'line'; root.classList.remove('tk-entering'); show(enterIdx); } }
      else if(phase === 'line'){ t += dt; if(t >= wait) next(); }
      else if(phase === 'end') endT += dt;
    },
    tap,
    skip: finish,
    leave(){   // 終わりの演出: 文字の箱と神様は消え、おばけは 下へ すっと落ちていく (雲へ 飛び込む)
      el.obake.classList.remove('tk-hide', 'tk-dim'); root.classList.add('tk-leave');
    },
    dispose(){
      stopVoice(); if(gain) gain.disconnect();
      root.removeEventListener('pointerdown', onDown); skipBtn.removeEventListener('pointerdown', onSkip);
      root.innerHTML = ''; root.className = ''; root.hidden = true; phase = 'done';
    }
  };
}
