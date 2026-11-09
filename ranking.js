// ランキングの 板 (10/27 社長): 夢の タイトルで「ステージ N」を 押すと、その面の ランキング (ライバル + 自分の 記録、5 位まで) と
import { tUi, tName, lang, fmtSpeed, unitLabel } from './i18n.js';   // ことばの 切り替え (11/9)
// はじめる ボタン (ストーリー あり / なし)・もどる。rows = [{ name, kana, kmh, you, t, date, fc }] (速い 順。ブースターの 回は 入らない)
// 11/4 社長: 5 位 → 1 位の 順に 横から 滑り込む (ス、ス、ス、シャキン、シャキーン)・1 位は 大きく 2 位は 少し 大きく 3〜5 位は 同じ・あなたは 日付と 時刻・フルコンボは 金の 王冠
import { rubyHtml, audioOut } from './talk.js';

const CSS = `
.rk-root{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(40,50,80,.35);font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;user-select:none;-webkit-user-select:none;animation:rk-in .25s ease}
@keyframes rk-in{from{opacity:0}}
.rk-panel{width:min(520px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:14px 16px 14px;border-radius:22px;background:#fffaf2;color:#5a4030;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.rk-panel h2{margin:0 0 8px;text-align:center;font-size:20px;color:#c0603a}
.rk-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}
.rk-list li{position:relative;overflow:hidden;display:flex;align-items:center;min-height:1.9em;padding:4px 8px;border-radius:10px;font-size:15px;line-height:1.3;background:rgba(242,196,138,.16)}
.rk-list li.rk-r1{font-size:22px;background:linear-gradient(90deg,rgba(255,214,80,.42),rgba(255,236,170,.3))}
.rk-list li.rk-r2{font-size:18px;background:linear-gradient(90deg,rgba(185,196,212,.42),rgba(225,230,238,.3))}
.rk-list li.rk-you.rk-go{background:rgba(242,154,31,.3);font-weight:bold}
.rk-row{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;column-gap:8px}
.rk-row .rk-sp{margin-left:auto}   /* 狭い 画面で 名前と 速さが 1 行に 入らない 時は 速さを 次の 行の 右へ (重ならない、Codex 指摘 11/4) */
.rk-wait .rk-row{opacity:0;transform:translateX(110%)}
.rk-go .rk-row{animation:rk-slide .22s cubic-bezier(.2,.8,.3,1) both}
.rk-r2.rk-go .rk-row{animation-duration:.16s}
@keyframes rk-slide{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:none}}
.rk-r1.rk-go::after,.rk-r2.rk-go::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.95) 50%,transparent 70%);transform:translateX(-100%);animation:rk-shine .35s .12s ease-out both}
.rk-r1.rk-go::after{background:linear-gradient(100deg,transparent 25%,rgba(255,250,210,.95) 45%,#fff 50%,rgba(255,250,210,.95) 55%,transparent 75%);animation:rk-shine .55s .2s ease-out both}
@keyframes rk-shine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.rk-r1.rk-go{animation:rk-pop .5s .18s ease-out}
@keyframes rk-pop{0%{transform:none;box-shadow:none}35%{transform:scale(1.06);box-shadow:0 0 18px 4px rgba(255,200,40,.75)}100%{transform:none;box-shadow:0 0 0 0 rgba(255,200,40,0)}}
.rk-now .rk-row,.rk-now li{animation:none !important}
.rk-now li::after{display:none}
.rk-no{flex:none;width:1.8em;text-align:center;font-weight:bold;color:#a08870}
.rk-r1 .rk-no{color:#d9a400}
.rk-r2 .rk-no{color:#8f99a6}
.rk-r3 .rk-no{color:#c07a40}
.rk-nm{flex:1;min-width:0}
.rk-nm small{margin-left:.15em;font-size:.75em;color:#a08870;font-weight:normal;white-space:nowrap}
.rk-nm rt{font-size:.5em}
.rk-sp{flex:none;font-variant-numeric:tabular-nums}
.rk-fc{display:inline-flex;align-items:center;gap:.15em;margin-left:.15em;padding:.05em .5em .05em .3em;border-radius:999px;font-size:.72em;font-weight:bold;color:#7a4a00;vertical-align:middle;white-space:nowrap;background:linear-gradient(110deg,#f5c93a 0%,#f5c93a 35%,#fff6c4 48%,#f5c93a 60%,#e2a40e 100%);background-size:260% 100%;box-shadow:inset 0 0 0 1.5px #d49a10,0 0 8px rgba(255,196,30,.65);animation:rk-gold 2.4s linear infinite}
.rk-fc svg{width:1.3em;height:1em;flex:none}
.rk-easy{display:inline-flex;align-items:center;margin-left:.15em;padding:.05em .55em;border-radius:999px;font-size:.72em;font-weight:bold;color:#fff;background:#5aa9e6}
@keyframes rk-gold{from{background-position:100% 0}to{background-position:-160% 0}}
.rk-side{opacity:0;pointer-events:none;transition:opacity .3s}
.rk-done .rk-side{opacity:1;pointer-events:auto}
.rk-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
.rk-panel button{font:inherit;font-weight:bold;font-size:15px;padding:.5em 1.1em;border:2px solid #f2c48a;border-radius:999px;background:#fff;color:#a0582e;cursor:pointer;touch-action:manipulation}
.rk-panel button.rk-big{border-color:#f29a1f;background:#f29a1f;color:#fff}
.rk-panel .rk-back{display:block;margin:10px auto 0;border-color:#d8cfc4;color:#8a7a6a}
@media (min-aspect-ratio:1/1) and (max-height:560px){
  .rk-panel{width:min(760px,100%);display:grid;grid-template-columns:1fr auto;column-gap:16px;align-items:center}
  .rk-panel h2{grid-column:1 / -1;margin-bottom:4px}
  .rk-list{gap:2px}
  .rk-list li{padding:2px 8px;font-size:13px}
  .rk-list li.rk-r1{font-size:18px}
  .rk-list li.rk-r2{font-size:15px}
  .rk-side{display:flex;flex-direction:column;gap:8px}
  .rk-btns{flex-direction:column;margin-top:0}
}   /* 横長の 低い 画面: 表は 左、ボタンは 右に 縦並び (1 画面に 収める) */
`;
function injectCss(){ if(document.getElementById('ranking-css')) return; const st = document.createElement('style'); st.id = 'ranking-css'; st.textContent = CSS; document.head.appendChild(st); }

const CROWN = '<svg viewBox="0 0 26 20" aria-hidden="true"><path d="M3 17 L5 6 L10 11 L13 3 L16 11 L21 6 L23 17 Z" fill="#ffd23f" stroke="#a86a00" stroke-width="1.6" stroke-linejoin="round"/><rect x="3" y="16.2" width="20" height="2.6" rx="1" fill="#e9a908" stroke="#a86a00" stroke-width="1.2"/><circle cx="5" cy="5.5" r="1.7" fill="#ff5a7a"/><circle cx="13" cy="2.6" r="1.9" fill="#4fc3ff"/><circle cx="21" cy="5.5" r="1.7" fill="#ff5a7a"/></svg>';
const when = r => {   // あなたの 記録の 日付と 時刻 (11/4 社長)。時刻の 無い 古い 形は 日付だけ
  if(Number.isFinite(r.t) && r.t > 0){ const d = new Date(r.t); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; }
  return typeof r.date === 'string' && r.date.length === 10 ? `${+r.date.slice(5, 7)}/${+r.date.slice(8, 10)}` : '';
};
const nameHtml = r => r.you ? tUi('あなた') + (when(r) ? ` <small>${when(r)}</small>` : '') + (r.fc ? ` <span class="rk-fc">${CROWN}${tUi('フルコンボ')}</span>` : '') + (r.easy ? ` <span class="rk-easy">${tUi('ゆっくり')}</span>` : '') : lang !== 'ja' ? tName(r.name) : r.kana ? rubyHtml(`{${r.name}|${r.kana}}`) : r.name;

function sfx(actx, kind){   // ス (風を 切る) / シャキン (金属の きらっ) / シャキーン (長く 響く)。音が 出せない 時は 鳴らさない
  if(!actx || actx.state !== 'running') return;
  const out = audioOut(actx), t0 = actx.currentTime;
  const swish = (dur, f0, f1, vol) => { const n = Math.ceil(actx.sampleRate * dur), b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0); for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(); s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(out); s.start(t0); s.stop(t0 + dur); };
  const ring = (fr, at, dur, vol) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = fr;
    g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
    o.connect(g).connect(out); o.start(t0 + at); o.stop(t0 + at + dur + 0.02); };
  if(kind === 'su') swish(0.14, 2800, 900, 0.22);
  else if(kind === 'shakin'){ swish(0.1, 4200, 1600, 0.28); for(const [f, v] of [[2480, 0.09], [3720, 0.07], [5350, 0.04]]) ring(f, 0.05, 0.4, v); }
  else { swish(0.16, 4800, 1500, 0.32); for(const [f, v] of [[2090, 0.08], [3140, 0.08], [4700, 0.05], [6270, 0.03]]) ring(f, 0.07, 1.2, v); for(const [f, at] of [[2637, 0.25], [3136, 0.33], [4186, 0.41]]) ring(f, at, 0.5, 0.035); }
}

export function createRanking({ stage, rows, onPick, actx }){
  injectCss();
  const el = document.createElement('div'); el.className = 'rk-root';
  el.innerHTML = `<div class="rk-panel"><h2>${tUi('ステージ {n} の ランキング', {n:stage})}</h2><ol class="rk-list">`
    + rows.map((r, i) => `<li class="rk-wait rk-r${i + 1}${r.you ? ' rk-you' : ''}"><div class="rk-row"><span class="rk-no">${i + 1}</span><span class="rk-nm">${nameHtml(r)}</span><span class="rk-sp">${fmtSpeed(r.kmh)} ${unitLabel()}</span></div></li>`).join('')
    + '</ol><div class="rk-side"><div class="rk-btns"><button class="rk-big" data-id="story">' + tUi('ストーリー ありで はじめる') + '</button><button data-id="nostory">' + tUi('ストーリー なしで はじめる') + '</button></div>'
    + '<button class="rk-back" data-id="back">' + tUi('もどる') + '</button></div></div>';
  document.body.appendChild(el);
  const lis = [...el.querySelectorAll('.rk-list li')], timers = [];
  let open = true, done = false;
  const show = li => { li.classList.remove('rk-wait'); li.classList.add('rk-go'); };
  const finish = () => { if(done) return; done = true; timers.forEach(clearTimeout); timers.length = 0; if(open){ el.classList.add('rk-done'); lis.forEach(show); } };
  const finishNow = () => { el.classList.add('rk-now'); finish(); };   // 途中で 押したら すぐ 全部 そろえる (何度も 見る人を 待たせない)
  let t = 0.45, last = 0;   // 板が 開いて から 5 位が 来るまで (秒)。3〜5 位は 0.3 秒 おき (ス、ス、ス)・2 位は 一呼吸 おいて (シャキン)・1 位は もう少し ためて (シャキーン)
  for(let i = lis.length - 1; i >= 0; i--){ const li = lis[i], kind = i === 0 ? 'shakiin' : i === 1 ? 'shakin' : 'su';
    timers.push(setTimeout(() => { show(li); sfx(actx, kind); }, t * 1000)); last = t; t += i === 2 ? 0.55 : i === 1 ? 0.8 : 0.3; }
  timers.push(setTimeout(finish, (lis.length ? last + 0.7 : 0) * 1000));   // ボタンは 1 位が 光り 終わって から
  el.addEventListener('click', e => { if(!open) return; if(!done){ finishNow(); return; } const b = e.target.closest('button'); if(!b) return; open = false; el.remove(); onPick(b.dataset.id); });
  el.addEventListener('pointerdown', e => e.stopPropagation());
  return { close(){ if(open){ open = false; timers.forEach(clearTimeout); el.remove(); } } };
}
export function warmFont(extra = ''){   // 板を 開いた 瞬間に 細い 文字から 丸文字へ 切り替わら ない よう、使う 文字を 先に 読んで おく (丸文字は 必要な 文字の 分だけ 届く)
  try{ if(!document.fonts) return; const s = 'ステージ の ランキング あなた フルコンボ ゆっくり ストーリー ありで なしで はじめる もどる 0123456789,/: km' + extra;
    for(const w of ['400', '700']) document.fonts.load(`${w} 20px "M PLUS Rounded 1c"`, s).catch(() => {}); }catch(_){}
}
