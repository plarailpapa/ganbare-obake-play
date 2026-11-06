// 走り出す 前の 説明画面 (11/6 社長、設計書 2026-11-06-ganbare-obake-howto-screen-design.md):
// 止めた スタート画面の 上に 額縁・吹き出し・帯・ボタン。タップで ペロンと はがれて 出発。文字は 全部 HOWTO_TEXT (ことば表) から = 言語を 足す 時は 表を 足すだけ

export const HOWTO_TEXT = {
  ja: {
    rival: 'つぎの あいて', rivalSub: 'この <ruby>速<rt>はや</rt></ruby>さを こえると ぬける！', rivalHit: 'ぶつかっても すりぬけるから だいじょうぶ',   /* rivalHit = 1 面だけ (2 面・3 面の 相手は ぶつからない、11/7 社長) */
    time: 'のこり時間', timeSub: 'おばけが 時計に つくまでに <ruby>目標<rt>もくひょう</rt></ruby>を こえよう',
    goal: '<ruby>目標<rt>もくひょう</rt></ruby>の <ruby>速<rt>はや</rt></ruby>さ', goalSub: 'こえたら <ruby>合格<rt>ごうかく</rt></ruby>！',
    speed: '今の <ruby>速<rt>はや</rt></ruby>さ',
    boost1: '光る <ruby>板<rt>いた</rt></ruby>・<ruby>輪<rt>わ</rt></ruby>を ふむと <ruby>加速<rt>かそく</rt></ruby>！',
    boost2: '光る <ruby>輪<rt>わ</rt></ruby>を くぐると <ruby>加速<rt>かそく</rt></ruby>！',
    branch: '分かれ道は 3つの レーンの どれかを <ruby>選<rt>えら</rt></ruby>ぼう！',
    left: '◀ 左を タップ', right: '右を タップ ▶', keys: 'パソコンは ← → キーで 左右に <ruby>動<rt>うご</rt></ruby>く',
    banner: kmh => '<ruby>時速<rt>じそく</rt></ruby> ' + kmh + ' km を こえよう！',
    wait: 'じゅんびちゅう…', go: 'タップで しゅっぱつ！',
    num: n => n.toLocaleString('ja-JP'),
  },
};

const CSS = `
#hwDim{position:fixed;inset:0;z-index:1;pointer-events:none;background:rgba(14,9,34,.42);opacity:0;transition:opacity .35s ease}
#hwDim.on{opacity:1} #hwDim.out{opacity:0;transition:opacity .5s ease}
#hwTop{position:fixed;inset:0;z-index:30;pointer-events:none;font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;opacity:0;transition:opacity .35s ease}
#hwTop.on{opacity:1} #hwTop.out{animation:hwPeel .55s cubic-bezier(.5,0,.75,.2) forwards;transform-origin:0 0}
#hwTop::before{content:"";position:absolute;inset:0;opacity:0;transition:opacity 1s ease;background:radial-gradient(1.2px 1.2px at 12% 18%,#fff 60%,transparent 70%) 0 0/170px 150px,radial-gradient(1.6px 1.6px at 63% 41%,#fff 60%,transparent 70%) 0 0/230px 190px,radial-gradient(1px 1px at 38% 77%,#cfe0ff 60%,transparent 70%) 0 0/130px 120px,radial-gradient(ellipse at 50% 40%,#1b1446 0%,#07051a 75%)}   /* 仮の 星空 (3 面で 曲が まだ 届かない 間の 背景、11/7) */
#hwTop.ph::before{opacity:1} #hwTop.phz{z-index:50}   /* phz = 白い 幕より 前 (星空が 消え 終わるまで) */
#hwTop.ph svg.ln,#hwTop.ph .cb[data-k="rival"],#hwTop.ph .cb[data-k="time"],#hwTop.ph .cb[data-k="speed"]{visibility:hidden !important}   /* 星空の 間は 表示 (HUD) を 指す 吹き出しは 出さない (表示が まだ 見えない、Codex 指摘 11/7) */
@keyframes hwPeel{0%{transform:none;opacity:1}25%{transform:rotate(-2deg) translate(0,-1.5%) skewX(-2deg)}100%{transform:rotate(-14deg) translate(-18%,-115%) skewX(-6deg);opacity:0}}
#hwTop .fr{position:absolute;inset:calc(6px + env(safe-area-inset-top)) calc(6px + env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) calc(6px + env(safe-area-inset-left));border:4px solid #f6e7b8;border-radius:14px;box-shadow:0 0 0 2px #7a5a1e,inset 0 0 0 2px #7a5a1e,0 0 18px rgba(0,0,0,.45)}
#hwTop svg.ln{position:absolute;inset:0;width:100%;height:100%;overflow:visible} #hwTop .ic svg{display:block}
#hwTop .cb{position:absolute;width:max-content;max-width:min(46vw,300px);background:#fffdf5;color:#2b1d4a;border-radius:12px;padding:6px 10px;box-shadow:0 3px 0 rgba(0,0,0,.25);font-weight:800;font-size:clamp(13px,1.7vw,18px);line-height:1.35}
#hwTop .cb small{display:block;font-weight:500;font-size:.78em;color:#5a4a7a}
#hwTop .cb .ic{display:inline-flex;gap:6px;vertical-align:middle;margin-right:6px}
#hwTop .bn{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);white-space:nowrap;background:linear-gradient(#ffe48a,#ffbf3a);color:#5a2d00;font-weight:800;font-size:clamp(20px,4.2vw,46px);padding:.18em 1em;border-radius:2em;box-shadow:0 5px 0 #8a4d00}
#hwTop .tp{position:absolute;bottom:17%;width:21%;height:20%;border:3px dashed rgba(255,255,255,.75);border-radius:18px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:clamp(14px,2.2vw,24px);text-shadow:0 2px 4px #000;background:rgba(255,255,255,.08)}
#hwTop .tp.l{left:4%} #hwTop .tp.r{right:4%}
#hwTop .ky{position:absolute;left:50%;bottom:14%;transform:translateX(-50%);white-space:nowrap;color:#fff;font-weight:500;font-size:clamp(12px,1.5vw,17px);text-shadow:0 2px 4px #000}
#hwTop .go{position:absolute;left:50%;bottom:calc(5% + env(safe-area-inset-bottom));transform:translateX(-50%);white-space:nowrap;background:#fff;color:#2b1d4a;font-weight:800;font-size:clamp(17px,2.8vw,30px);padding:.3em 1.5em;border-radius:2em;box-shadow:0 0 0 4px #ffd66b}
#hwTop .go.wait{background:#d9d4e8;color:#6a6088;box-shadow:0 0 0 4px #9a90b8}
#hwTop .go.ready{animation:hwBlink 1.2s ease-in-out infinite}
@keyframes hwBlink{50%{opacity:.55}}
#hwTop rt{font-size:.45em;font-weight:500}
@media (max-aspect-ratio:999/1000){ #hwTop .tp{width:30%;height:12%;bottom:14%} #hwTop .bn{top:50%} #hwTop .cb{max-width:44vw} #hwTop .ky{bottom:12%} }
`;
const PLATE_SVG = '<svg width="34" height="22" viewBox="0 0 34 22"><rect x="1" y="5" width="32" height="15" rx="3" fill="#ffd54a" stroke="#7a5a1e" stroke-width="1.5"/><path d="M8 15 L17 8 L26 15" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
const RING_SVG = '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#4cd964" stroke-width="4"/></svg>';

export function createHowto({ anchors, lang = 'ja' }){   // anchors() = { rival, time, goal, speed } (HUD の 要素)
  const T = HOWTO_TEXT[lang] || HOWTO_TEXT.ja;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const dim = document.createElement('div'); dim.id = 'hwDim'; dim.hidden = true;
  const top = document.createElement('div'); top.id = 'hwTop'; top.hidden = true;
  const hud = document.getElementById('hud'); hud.parentNode.insertBefore(dim, hud); document.body.appendChild(top);   // 暗い 幕は HUD の 下 (HUD の 字は 暗く しない)、説明は HUD の 上
  let open = false, ready = false, stageNo = 1, peelT = 0, phT = 0;
  const cb = (k, html) => '<div class="cb" data-k="' + k + '">' + html + '</div>';

  function build(o){
    const boost = stageNo === 1 ? '<span class="ic">' + PLATE_SVG + RING_SVG + '</span>' + T.boost1 : '<span class="ic">' + RING_SVG + '</span>' + T.boost2;
    top.innerHTML = '<div class="fr"></div><svg class="ln"></svg>'
      + cb('rival', T.rival + '<small>' + T.rivalSub + (stageNo === 1 ? '<br>' + T.rivalHit : '') + '</small>') + cb('time', T.time + '<small>' + T.timeSub + '</small>')
      + cb('speed', T.speed) + cb('boost', boost)   /* 目標の 速さは 真ん中の 帯で 言うので 吹き出しは なし (11/7 社長) */
      + (stageNo === 3 ? cb('branch', T.branch) : '')
      + '<div class="bn">' + T.banner(T.num(o.goalKmh)) + '</div>'
      + '<div class="tp l">' + T.left + '</div><div class="tp r">' + T.right + '</div>' + (o.touch ? '' : '<div class="ky">' + T.keys + '</div>')
      + '<div class="go wait">' + T.wait + '</div>';
  }

  function relayout(){
    if(!open) return;
    const W = innerWidth, H = innerHeight, A = anchors(), svg = top.querySelector('svg.ln'), M = 10, boxes = [];
    let lines = '';
    const rectOf = el => { let o = null; for(const e of [].concat(el || [])){ const r = e && e.getBoundingClientRect(); if(!r || !(r.width > 0)) continue; o = o ? { left:Math.min(o.left, r.left), top:Math.min(o.top, r.top), right:Math.max(o.right, r.right), bottom:Math.max(o.bottom, r.bottom) } : { left:r.left, top:r.top, right:r.right, bottom:r.bottom }; } if(o){ o.width = o.right - o.left; o.height = o.bottom - o.top; } return o; };   /* 要素 1 つ か 並び (並びは 全部を 囲む) */
    const place = (k, r, side, yMin, xr) => {   /* xr = [左の 限り, 右の 限り] (縦長の のこり時間 = つぎの あいてと 時速の 間) */   // 吹き出し k を 要素 r の 下 (yMin が あれば その 高さ 以下) に 置く (side = 'l' 左そろえ / 'r' 右そろえ / 'c' 真ん中)、重なったら 下へ ずらす
      const el = top.querySelector('.cb[data-k="' + k + '"]'); if(!el) return; el.style.visibility = r ? '' : 'hidden'; if(!r) return;
      const w = el.offsetWidth, h = el.offsetHeight;
      let x = side === 'l' ? r.left : side === 'r' ? r.right - w : r.left + r.width / 2 - w / 2, y = Math.max(r.bottom + 16, yMin || 0);
      x = Math.max(M + 6, Math.min(W - M - 6 - w, x)); if(xr) x = Math.max(xr[0], Math.min(xr[1] - w, x));
      for(let guard = 0; guard < 8; guard++){ const hit = boxes.find(b => x < b.x + b.w + 6 && x + w + 6 > b.x && y < b.y + b.h + 6 && y + h + 6 > b.y); if(!hit) break; y = hit.y + hit.h + 8; }
      el.style.left = x + 'px'; el.style.top = y + 'px'; boxes.push({ x, y, w, h });
      const ax = Math.max(r.left + 8, Math.min(r.right - 8, x + w / 2)), cx = Math.max(x + 14, Math.min(x + w - 14, ax));
      lines += '<rect x="' + (r.left - 5) + '" y="' + (r.top - 5) + '" width="' + (r.width + 10) + '" height="' + (r.height + 10) + '" rx="10" fill="none" stroke="#ffd66b" stroke-width="3"/>'
        + '<line x1="' + ax + '" y1="' + (r.bottom + 5) + '" x2="' + cx + '" y2="' + y + '" stroke="#ffd66b" stroke-width="3"/>';
    };
    const portrait = H >= W, rv = rectOf(A.rival), tm = rectOf(A.time), gl = rectOf(A.goal), sp = rectOf(A.speed), rn = rectOf(A.rivalName);
    if(tm && gl && tm.left < gl.right + 12 && tm.right > gl.left - 12 && tm.top < gl.bottom + 12 && tm.bottom > gl.top - 12){ const mid = (gl.bottom + tm.top) / 2; gl.bottom = mid - 7; tm.top = mid + 7; gl.height = gl.bottom - gl.top; tm.height = tm.bottom - tm.top; }   /* のこり時間 (おばけ〜時計) の 枠と 目標の 字の 枠が ぶつかる 時は 境目で 両方を 少しずつ 詰める (11/6 社長) */
    const tel = top.querySelector('.cb[data-k="time"]'); if(tel) tel.style.maxWidth = tel.style.fontSize = '';
    if(portrait){   /* 縦長 (11/7 社長): 今の 速さ → のこり時間 = つぎの あいての 名前の 行の 右 (同じ 高さに ある 物だけ よける。3 面は 時速の 字が 広いが 名前の 行より 上で 終わる) → つぎの あいて */
      place('speed', sp, 'r');
      const gl0 = rv ? rv.right + 14 : M + 6, yT = rn ? rn.top - 2 : (tm ? tm.bottom + 16 : 0), sb = boxes[boxes.length - 1], gb = rectOf(A.gain);
      let gr0 = W - M - 6; for(const o of [sp, gb, sb && { left:sb.x, top:sb.y, bottom:sb.y + sb.h }]) if(o && o.bottom > yT - 4 && o.top < yT + 90) gr0 = Math.min(gr0, o.left - 18);
      if(tel && tm && gr0 - gl0 >= 110){ tel.style.maxWidth = Math.round((gr0 - gl0) * 0.85) + 'px';   /* 横長の まま 少し 縮める */
        const hMax = rv && rn ? Math.max(64, rv.bottom - rn.top + 24) : 1e9; let fs = parseFloat(getComputedStyle(tel).fontSize); while(tel.offsetHeight > hMax && fs > 10){ fs -= 0.5; tel.style.fontSize = fs + 'px'; }   /* 言葉が 長い (ほかの 言語) 時は 行を 増やし、それでも 収まらなければ 文字を 小さく */
        place('time', tm, 'c', yT, [gl0, gr0]); }
      else place('time', tm, 'c', Math.max(...[rv, tm, sp].map(r => r ? r.bottom : 0)) + 16);   /* 間が 狭すぎる 時だけ 表示の 下へ */
      place('rival', rv, 'l'); }
    else { place('rival', rv, 'l'); place('time', tm, 'c'); place('speed', sp, 'r'); }   /* 横長: のこり時間は ゲージの 真下・今の 速さは 表示の 真下 (11/7 社長) */
    const free = (k, x, y) => { const el = top.querySelector('.cb[data-k="' + k + '"]'); if(!el) return; const w = el.offsetWidth, h = el.offsetHeight; el.style.left = Math.max(M + 6, Math.min(W - M - 6 - w, x(w))) + 'px'; el.style.top = Math.max(M + 6, Math.min(H - M - 6 - h, y(h))) + 'px'; };
    const low = boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0);
    const bnEl = top.querySelector('.bn'); bnEl.style.top = Math.max(H * (portrait ? 0.5 : 0.4), low + 14 + bnEl.offsetHeight / 2) + 'px';   /* 帯は 吹き出しより 下 (小さい スマホで 重ならない) */
    const tl = top.querySelector('.tp.l').getBoundingClientRect(), bn = bnEl.getBoundingClientRect();
    const bY = portrait ? Math.max(low + 12, bn.bottom + 14) : Math.max(tl.top + 6, bn.bottom + 14);   /* 横長 = 「左を タップ」と「右を タップ」の 間 (11/6 社長)、縦長 = 帯の 下 */
    const brh = (top.querySelector('.cb[data-k="branch"]') || {}).offsetHeight || 0; free('branch', w => W / 2 - w / 2, h => bY);   /* 3 面の 分かれ道は 加速の 上 (11/6 社長) */
    free('boost', w => W / 2 - w / 2, h => bY + (brh ? brh + 10 : 0));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = lines;
  }

  return {
    open(stage, o){ stageNo = stage; build(o); dim.hidden = top.hidden = false; dim.className = top.className = ''; if(o.placeholder) top.classList.add('ph', 'phz'); open = true; ready = false; void top.offsetWidth; dim.classList.add('on'); top.classList.add('on'); relayout(); setTimeout(relayout, 120); setTimeout(relayout, 600); },   // o.placeholder = 景色の 代わりに 仮の 星空 (reveal で 本物の 景色へ)
    reveal(){ if(!top.classList.contains('ph')) return; top.classList.remove('ph'); clearTimeout(phT); phT = setTimeout(() => top.classList.remove('phz'), 1100); relayout(); setTimeout(relayout, 300); setTimeout(relayout, 1200); },   // 仮の 星空が ふわっと 消えて 本物の 景色 (白い 幕も 同じ 間に 晴れる)
    setReady(v){ if(!open || v === ready) return; ready = v; const g = top.querySelector('.go'); g.className = 'go ' + (v ? 'ready' : 'wait'); g.innerHTML = v ? T.go : T.wait; },
    peel(){ if(!open) return; open = false; ready = false; top.className = 'out'; dim.className = 'out'; clearTimeout(peelT); peelT = setTimeout(() => { top.hidden = dim.hidden = true; top.innerHTML = ''; }, 600); },   // ペロンと はがれる (約 0.55 秒)、呼び側は 同時に 出発
    close(){ open = false; ready = false; clearTimeout(peelT); top.hidden = dim.hidden = true; top.className = dim.className = ''; top.innerHTML = ''; },   // その場で 消す (やり直し・タイトルへ)
    relayout, isOpen: () => open,
  };
}
