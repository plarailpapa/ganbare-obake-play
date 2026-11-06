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
.tk-root{position:fixed;inset:0;z-index:40;font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent}
.tk-ch{position:absolute;transition:left .5s ease,right .5s ease,top .5s ease,bottom .5s ease,width .5s ease,opacity .4s ease,filter .3s ease;pointer-events:none}
.tk-fr{position:relative;width:100%}
.tk-fr img{position:absolute;display:block}
.tk-obake .tk-fr{aspect-ratio:0.708}.tk-obake img{width:143.7%;left:-25.1%;top:-19.3%}
.tk-kami .tk-fr{aspect-ratio:0.642}.tk-kami img{width:107.8%;left:-1.08%;top:-7.8%}
.tk-kami{right:4vw;top:calc(6vh + env(safe-area-inset-top));width:min(46vw,260px)}
.tk-obake{left:4vw;bottom:calc(10px + 5.4 * clamp(15px,4.2vw,22px) + 24px + env(safe-area-inset-bottom));width:min(40vw,220px)}
.tk-corner .tk-kami{right:2vw;top:34vh;width:min(25vw,143px)}
.tk-corner .tk-obake{left:2vw;width:min(22vw,121px)}
.tk-dim{filter:saturate(.75) brightness(.92);opacity:.85}
.tk-hide{opacity:0}
.tk-box{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom));width:min(720px,calc(100vw - 16px));box-sizing:border-box;min-height:calc(5.4em + 4px);background:rgba(255,255,255,.94);border:2px solid #f2c96b;border-radius:14px;padding:.55em 1.5em .5em;font-size:clamp(15px,4.2vw,22px);line-height:2;color:#333;box-shadow:0 2px 8px rgba(0,0,0,.15);pointer-events:none}   /* 11/4 社長「最大 2 行 なのに 4 行分」「左右の 余白」: 高さは 2 行分 (行の 間 2em に ふりがなの はみ出し 分 少し + 上下の 余白)・左右は 1.5 文字分。3 行に なる 長い セリフ だけ 箱が 伸びる */
.tk-box rt{font-size:.5em;line-height:1;color:#7a5a20}
.tk-tx .tc{opacity:0;transition:opacity .08s}
.tk-tx .tc.on{opacity:1}
.tk-nm{position:absolute;top:calc(4px - 1.5em - 2px);line-height:1.5;left:calc(1.5 * clamp(15px,4.2vw,22px) - 12px);background:#ffd66b;color:#5a3b00;border-radius:9px;padding:1px 12px;font-weight:bold;font-size:clamp(12px,3.4vw,16px)}   /* 名前の 札は 箱の ふちに 乗せる (下は 箱の 中へ 4px だけ): 行の 始めの ふりがな (日本・人・家) と 重なった、11/4 社長 */
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

function parts(src){   // 文を「ふつうの 文字」{ t } と「ふりがな付きの 漢字」{ b, r } に 分ける
  const out = []; let i = 0;
  for(const m of src.matchAll(RUBY)){ if(m.index > i) out.push({ t:src.slice(i, m.index) }); out.push({ b:m[1], r:m[2] }); i = m.index + m[0].length; }
  if(i < src.length) out.push({ t:src.slice(i) });
  return out;
}
const PUNCT = '、。！？!?…‥」』）)';
function chunks(src){   // 文節の かたまり [{ sp:空白 } | { ps:[部分] }]。台本は 文節ごとに 空白を 入れて ある + 「、」「。」「！」などの 後ろ (空白が 無くても) = 行は この 区切りでだけ 変わる (11/4 社長「文節が 変な 切り方に ならないように」)
  const out = []; let cur = null;
  const add = t => { if(!cur) out.push(cur = { ps:[] }); cur.ps.push({ t }); };
  for(const p of parts(src)){
    if(p.b){ if(!cur) out.push(cur = { ps:[] }); cur.ps.push(p); continue; }
    for(const s of p.t.split(/(\s+)/)){ if(!s) continue; if(/^\s+$/.test(s)){ out.push({ sp:s }); cur = null; continue; }
      let a = 0;
      for(let i = 0; i + 1 < s.length; i++){ if(!PUNCT.includes(s[i]) || PUNCT.includes(s[i + 1])) continue;
        const head = s.slice(a, i + 1); if(!cur && [...head].every(ch => PUNCT.includes(ch))) continue;   // 先頭の「…」だけでは 区切らない
        add(head); cur = null; a = i + 1; }
      if(a < s.length) add(s.slice(a));
      if(PUNCT.includes(s[s.length - 1]) && cur && cur.ps.some(q => q.b || [...q.t].some(ch => !PUNCT.includes(ch)))) cur = null; }   // 「。」の すぐ 後が ふりがな付きの 漢字 でも 区切る
  }
  return out;
}
const NW = '<span style="white-space:nowrap">';
export function rubyHtml(src){
  return chunks(src).map(c => c.sp || NW + c.ps.map(p => p.b ? '<ruby>' + esc(p.b) + '<rt>' + esc(p.r) + '</rt></ruby>' : esc(p.t)).join('') + '</span>').join('');
}

const SMALL = 'ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ', MARK = /[\s、。，．,.！？!?…‥・「」『』（）()]/;
const kanaW = s => [...s].reduce((a, ch) => a + (MARK.test(ch) ? 0 : SMALL.includes(ch) ? 0.4 : /[0-9０-９]/.test(ch) ? 2.5 : 1), 0);   // 読む 長さ (かな 1 文字 = 1、小さい ゃゅょ は 前の 字と 一緒、記号は 0、数字は 長い =「1,360」は せんさんびゃくろくじゅう)
function revealHtml(src){   // セリフを 1 文字ずつ 出す 形 (11/4 社長): 文字ごとに <span class="tc" data-u=番号>、ふりがなは 漢字の 1 文字目と 一緒に 出る。ws = 文字ごとの 読む 長さ (漢字は ふりがなの 長さを 割った 分)
  const ws = [], bounds = []; let sum = 0;   // bounds = 文節の 区切り { w:そこまでの 読む 長さ, p:…や ！で 終わる }
  const u = (ch, w) => { ws.push(w); sum += w; return `<span class="tc" data-u="${ws.length - 1}">${esc(ch)}</span>`; };
  const html = chunks(src).map(c => { if(c.sp) return c.sp;
    const h = NW + c.ps.map(p => {
      if(!p.b) return [...p.t].map(ch => u(ch, kanaW(ch))).join('');
      const bs = [...p.b], w = kanaW(p.r) / bs.length, first = ws.length;
      return '<ruby>' + bs.map(ch => u(ch, w)).join('') + `<rt><span class="tc" data-u="${first}">${esc(p.r)}</span></rt></ruby>`;
    }).join('') + '</span>';
    const lp = c.ps[c.ps.length - 1]; bounds.push({ w:sum, p:!lp.b && /[、。！？!?…‥」』）)]$/.test(lp.t) }); return h; }).join('');
  bounds.pop();   // 最後の 文節の 後ろは 区切りでない
  return { html, ws, bounds };
}
const envCache = new WeakMap();
function voiceEnv(buf){   // 声の「話して いる」時間の 累計 (20 ミリ秒 ごと)。黙って いる 間 (…や、の 間) は 増えない = 文字も 止まる
  let e = envCache.get(buf); if(e) return e;
  const d = buf.getChannelData(0), win = 0.02, n = Math.max(1, Math.floor(buf.duration / win)), step = Math.max(1, Math.floor(buf.sampleRate * win)), rms = new Float32Array(n); let peak = 0;
  for(let i = 0; i < n; i++){ let s = 0, c = 0; for(let j = i * step, J = Math.min(d.length, j + step); j < J; j += 4){ s += d[j] * d[j]; c++; } rms[i] = c ? Math.sqrt(s / c) : 0; if(rms[i] > peak) peak = rms[i]; }
  const th = Math.max(0.006, peak * 0.04), on = Array.from(rms, v => v > th);   // 小さな 声 (エンディングの「むにゃむにゃ…」) も 話して いる ことに (0.1 だと 黙って いる 扱いで、後ろが 1 文節ずつ ずれた、11/4 社長)
  for(let i = 0, last = -1; i < n; i++) if(on[i]){ if(last >= 0 && i - last > 1 && i - last <= 6) for(let k = last + 1; k < i; k++) on[k] = true; last = i; }   // 100 ミリ秒 までの すき間 (言葉の 途中) は 話して いる ことに
  const cum = new Float32Array(n + 1); for(let i = 0; i < n; i++) cum[i + 1] = cum[i] + (on[i] ? 1 : 0);
  const segs = []; for(let i = 0, s = -1; i <= n; i++){ const v = i < n && on[i]; if(v && s < 0) s = i; else if(!v && s >= 0){ segs.push([s, i]); s = -1; } }   // 話して いる 区間 [始め, 終わり)
  envCache.set(buf, e = { win, n, cum, segs }); return e;
}
function alignVoice(e, total, bounds){   // 声の 間 (黙って いる 所) を 文節の 区切りに 合わせる → [[話した 秒, 読む 長さ], ...] (点の 間は まっすぐ つなぐ)。話す 速さは 言葉ごとに 違う ので、割合だけ だと 間の 前に 次の 字が 出て しまう
  const V = e.cum[e.n] * e.win, gaps = [];   // 間の 位置が 割合で 一番 近い 区切り (声の 間は ほとんど「、」「。」「…」の 所 = そこは 強く 選ばれ やすい。神様は「いえも、」の ように 伸ばして 話す ので 割合だけ だと 1 つ 先を 選んだ) に 順番を 保って 割り当てる。合う 区切りが 無い 短い 間は 割り当てない
  for(let j = 0; j + 1 < e.segs.length; j++) gaps.push({ v:e.cum[e.segs[j][1]] * e.win, d:(e.segs[j + 1][0] - e.segs[j][1]) * e.win });
  const memo = new Map(), f = (j, i) => {
    if(j >= gaps.length) return { c:0, m:[] };
    const key = j * 1000 + i; if(memo.has(key)) return memo.get(key);
    const g = gaps[j], s = f(j + 1, i); let best = { c:s.c + Math.min(1, g.d / 0.6) * 0.5, m:s.m };
    for(let b = i; b < bounds.length; b++){ const r = f(j + 1, b + 1), c = r.c + Math.abs(g.v / V - bounds[b].w / total) * 3 - (bounds[b].p ? 0.6 : 0); if(c < best.c) best = { c, m:[[g.v, bounds[b].w], ...r.m] }; }
    memo.set(key, best); return best;
  };
  return [[0, 0], ...(V > 0 && total > 0 ? f(0, 0).m : []), [V, total]];
}
function voicedW(e, anc, tv){   // 声の 再生 位置 tv 秒 → 出す 文字の 読む 長さ
  const k = Math.max(0, Math.min(e.n, tv / e.win)), i = Math.floor(k), vt = (e.cum[i] + (i < e.n ? (e.cum[i + 1] - e.cum[i]) * (k - i) : 0)) * e.win;
  for(let a = 1; a < anc.length; a++){ const [v0, w0] = anc[a - 1], [v1, w1] = anc[a]; if(vt <= v1) return v1 > v0 ? w0 + (w1 - w0) * (vt - v0) / (v1 - v0) : w1; }
  return anc[anc.length - 1][1];
}
const VOICE_LEAD = 0.1;   // 文字は 声より 少しだけ 先に 出す (秒)

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

export function createTalk({ root, faces, actx, voiceDir, onCue, onEnd, log, endPrompt = 'タップで しゅっぱつ！', skip = true, autoEnd = null, canEnd = null }){   // autoEnd = 最後の セリフの 後 この 秒で ひとりでに 終わる (「タップで しゅっぱつ！」を 出さない、11/6 社長: 会話の 後は 自動で 映像へ → 説明画面)   // skip = false: 右上の「とばす」を 出さない (エンディング、11/4 社長)
  if(!document.getElementById('talk-css')){ const st = document.createElement('style'); st.id = 'talk-css'; st.textContent = CSS; document.head.appendChild(st); }
  root.className = 'tk-root';
  root.innerHTML = '<div class="tk-ch tk-kami tk-hide"><div class="tk-fr"><img alt=""></div></div><div class="tk-ch tk-obake tk-hide"><div class="tk-fr"><img alt=""></div></div>'
    + '<div class="tk-box"><span class="tk-nm"></span><div class="tk-tx"></div></div><div class="tk-go"></div><button class="tk-skip" type="button">とばす</button>';
  root.hidden = false;
  const el = { kami: root.querySelector('.tk-kami'), obake: root.querySelector('.tk-obake') };
  const img = { kami: el.kami.querySelector('img'), obake: el.obake.querySelector('img') };
  const nm = root.querySelector('.tk-nm'), tx = root.querySelector('.tk-tx'), skipBtn = root.querySelector('.tk-skip');
  root.querySelector('.tk-go').textContent = endPrompt; skipBtn.hidden = !skip;
  for(const who of ['obake', 'kami']) for(const url of Object.values(faces[who] || {})){ const im = new Image(); im.src = url; }   // 表情の差し替えで ちらつかないよう 先に読む

  const gain = actx ? actx.createGain() : null; if(gain){ gain.gain.value = 1; gain.connect(audioOut(actx)); }
  const voices = new Map(); let src = null;
  let lines = [], idx = -1, t = 0, wait = 0, cueSec = 0, phase = 'idle', endT = 0, cast = ['obake'], layout = 'stage', enterIdx = 0, rev = null, tapT = 0, vStart = 0, vEnv = null;   // rev = 今の 行の 文字の 出し具合 / tapT = 途中で 押して 全部 出した 時刻 / vStart・vEnv = 声を 鳴らし 始めた 時刻・声の 話して いる 区間
  const face = { obake: null, kami: null };

  const stopVoice = () => { if(src){ try{ src.stop(); }catch(e){} src.disconnect(); src = null; } vEnv = null; };
  const playVoice = buf => { src = actx.createBufferSource(); src.buffer = buf; src.connect(gain); src.start(); vStart = actx.currentTime; vEnv = voiceEnv(buf); };
  const onVoice = (id, buf) => {   // 声が届いた: 今の行の声で まだ鳴らしておらず、行が出てすぐなら 遅れて鳴らす
    if(!buf || phase === 'done') return;
    voices.set(id, buf);
    if(phase === 'line' && lines[idx] && lines[idx].id === id && !src && t < LATE_VOICE && actx.state === 'running'){
      playVoice(buf); wait = Math.max(t + buf.duration + VOICE_PAD, cueSec);
      if(log) log(id + ' late voice wait ' + wait.toFixed(2));
    }
  };
  const setFace = (who, f) => { if(f && f !== face[who] && faces[who] && faces[who][f]){ face[who] = f; img[who].src = faces[who][f]; } };
  function setReveal(ws, bounds){   // 文字ごとの 出る 境目 at (読む 長さの 累計)。字は 読み終わる 少し 前、記号は 前の 字を 読み終えたら 出る
    const units = ws.map(() => []); for(const e of tx.querySelectorAll('.tc')) units[+e.dataset.u].push(e);
    let c = 0; const at = ws.map(w => (c += w) - w * 0.6);
    for(let i = units.length - 2; i >= 0; i--) if(units[i][0] && '『「（('.includes(units[i][0].textContent)) at[i] = at[i + 1];   // かっこの 始まりは 次の 字と 一緒に (前の 字と 一緒だと『ばあ！』の『が 先に 出た)
    rev = { units, at, total:c, bounds, env:null, anc:null, w:0, shown:0, done:units.length === 0 };
  }
  function revealTo(w){ while(rev.shown < rev.units.length && rev.at[rev.shown] <= w + 1e-6){ for(const e of rev.units[rev.shown]) e.classList.add('on'); rev.shown++; } if(rev.shown >= rev.units.length) rev.done = true; }
  function revealAll(){ if(rev && !rev.done) revealTo(Infinity); }
  function stepReveal(){   // 声が ある 時は 声の 話して いる 所に 合わせて (間は 文節の 区切りに)、無い 時は 一定の 速さで
    if(!rev || rev.done) return;
    if(vEnv && rev.env !== vEnv){ rev.env = vEnv; rev.anc = alignVoice(vEnv, rev.total, rev.bounds); }   /* 声が 届いたら 1 回だけ 間と 区切りを 合わせる */
    rev.w = Math.max(rev.w, vEnv ? voicedW(vEnv, rev.anc, actx.currentTime - vStart + VOICE_LEAD) : rev.total * Math.min(1, t / Math.max(0.5, textWait(lines[idx].text) - 1.2)));   /* 声が 無い 時は 自動で 次へ 進む 1.2 秒 前に 出し 終わる */
    revealTo(rev.w);
  }

  function show(i){
    const L = lines[i]; idx = i; t = 0;
    if(L.cast) cast = L.cast; if(L.layout) layout = L.layout;
    root.classList.toggle('tk-corner', layout === 'corner');
    for(const who of ['obake', 'kami']){ el[who].classList.toggle('tk-hide', !cast.includes(who)); el[who].classList.toggle('tk-dim', who !== L.who); }
    setFace(L.who, L.face);
    const other = L.who === 'obake' ? 'kami' : L.who === 'kami' ? 'obake' : null;
    if(other) setFace(other, L.listen);
    nm.textContent = NAMES[L.who] || ''; nm.classList.toggle('tk-k', L.who !== 'obake');
    const r = revealHtml(L.text); tx.innerHTML = r.html; setReveal(r.ws, r.bounds); tapT = 0;
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
    else { revealAll(); phase = 'end'; endT = 0; if(autoEnd == null) root.classList.add('tk-end'); }   /* 「タップで しゅっぱつ！」は 画面の真ん中 (10/19 社長) */
  }
  function finish(){
    if(phase === 'done') return;
    phase = 'done'; stopVoice(); root.classList.remove('tk-end');
    if(log) log('end');
    onEnd();
  }

  function tap(){
    if(actx && actx.state === 'suspended') actx.resume().catch(() => {});
    if(phase === 'line'){ if(t < TAP_GAP) return; if(rev && !rev.done){ revealAll(); tapT = t; } else if(t - tapT >= TAP_GAP) next(); }   /* 文字が 出て いる 途中で 押したら 全部 出す (声は そのまま)、もう 一度 押したら 次の 行 (11/4) */
    else if(phase === 'end'){ if(endT >= END_GAP && (autoEnd == null || !canEnd || canEnd() || endT >= autoEnd + 12)) finish(); }   /* 自動で 終わる 会話の 最後の タップも 映像の 区切りまで 待つ (タップで 早送り しても 銀河を 引き切って から、Codex 指摘 11/7) */
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
      else if(phase === 'line'){ t += dt; stepReveal(); if(t >= wait) next(); }
      else if(phase === 'end'){ endT += dt; if(autoEnd != null && endT >= autoEnd && (!canEnd || canEnd() || endT >= autoEnd + 12)) finish(); }   /* canEnd = 映像の 区切りまで 待つ (最大 12 秒)。とばす は 待たない */
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
