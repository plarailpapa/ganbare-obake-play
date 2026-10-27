// ランキングの 板 (10/27 社長): 夢の タイトルで「ステージ N」を 押すと、その面の ランキング (ライバル + 自分の 記録、10 位まで) と
// はじめる ボタン (ストーリー あり / なし)・もどる。rows = [{ name, kana, kmh, you, date }] (速い 順。ブースターの 回は 入らない)
import { rubyHtml } from './talk.js';

const CSS = `
.rk-root{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(40,50,80,.35);font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;user-select:none;-webkit-user-select:none;animation:rk-in .25s ease}
@keyframes rk-in{from{opacity:0}}
.rk-panel{width:min(520px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:14px 16px 14px;border-radius:22px;background:#fffaf2;color:#5a4030;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.rk-panel h2{margin:0 0 8px;text-align:center;font-size:20px;color:#c0603a}
.rk-list{margin:0;padding:0;list-style:none}
.rk-list li{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:10px;font-size:15px;line-height:1.3}
.rk-list li:nth-child(odd){background:rgba(242,196,138,.18)}
.rk-list li.rk-you{background:rgba(242,154,31,.28);font-weight:bold}
.rk-no{flex:none;width:1.8em;text-align:center;font-weight:bold;color:#a08870}
.rk-list li:nth-child(1) .rk-no{color:#d9a400}
.rk-list li:nth-child(2) .rk-no{color:#9aa4b0}
.rk-list li:nth-child(3) .rk-no{color:#c07a40}
.rk-nm{flex:1;min-width:0}
.rk-nm small{margin-left:.4em;font-size:.75em;color:#a08870;font-weight:normal}
.rk-nm rt{font-size:.5em}
.rk-sp{flex:none;font-variant-numeric:tabular-nums}
.rk-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
.rk-panel button{font:inherit;font-weight:bold;font-size:15px;padding:.5em 1.1em;border:2px solid #f2c48a;border-radius:999px;background:#fff;color:#a0582e;cursor:pointer;touch-action:manipulation}
.rk-panel button.rk-big{border-color:#f29a1f;background:#f29a1f;color:#fff}
.rk-panel .rk-back{display:block;margin:10px auto 0;border-color:#d8cfc4;color:#8a7a6a}
@media (min-aspect-ratio:1/1) and (max-height:560px){
  .rk-panel{width:min(760px,100%);display:grid;grid-template-columns:1fr auto;column-gap:16px;align-items:center}
  .rk-panel h2{grid-column:1 / -1;margin-bottom:4px}
  .rk-list li{padding:2px 8px;font-size:13px}
  .rk-side{display:flex;flex-direction:column;gap:8px}
  .rk-btns{flex-direction:column;margin-top:0}
}   /* 横長の 低い 画面: 表は 左、ボタンは 右に 縦並び (1 画面に 収める) */
`;
function injectCss(){ if(document.getElementById('ranking-css')) return; const st = document.createElement('style'); st.id = 'ranking-css'; st.textContent = CSS; document.head.appendChild(st); }

const nameHtml = r => r.you ? 'あなた' + (r.date ? `<small>${+r.date.slice(5, 7)}/${+r.date.slice(8, 10)}</small>` : '') : r.kana ? rubyHtml(`{${r.name}|${r.kana}}`) : r.name;

export function createRanking({ stage, rows, onPick }){
  injectCss();
  const el = document.createElement('div'); el.className = 'rk-root';
  el.innerHTML = `<div class="rk-panel"><h2>ステージ ${stage} の ランキング</h2><ol class="rk-list">`
    + rows.map((r, i) => `<li class="${r.you ? 'rk-you' : ''}"><span class="rk-no">${i + 1}</span><span class="rk-nm">${nameHtml(r)}</span><span class="rk-sp">${Math.round(r.kmh).toLocaleString('en-US')} km</span></li>`).join('')
    + '</ol><div class="rk-side"><div class="rk-btns"><button class="rk-big" data-id="story">ストーリー ありで はじめる</button><button data-id="nostory">ストーリー なしで はじめる</button></div>'
    + '<button class="rk-back" data-id="back">もどる</button></div></div>';
  document.body.appendChild(el);
  let open = true;
  el.addEventListener('click', e => { const b = e.target.closest('button'); if(!b || !open) return; open = false; el.remove(); onPick(b.dataset.id); });
  el.addEventListener('pointerdown', e => e.stopPropagation());
  return { close(){ if(open){ open = false; el.remove(); } } };
}
