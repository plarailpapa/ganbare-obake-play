// せっていの 板 (10/27 社長。11/9 社長: オプション → せってい、音量は スマホや パソコンで 変えられる ので やめて ことば・はやさの たんい・記録を 消すの 3 つに)。タイトルの メニューから 開く
import { LANGS, lang, setLang, tUi, getUnit, setUnit } from './i18n.js';

const CSS = `
.op-root{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(40,50,80,.35);font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;user-select:none;-webkit-user-select:none;animation:op-in .25s ease}
@keyframes op-in{from{opacity:0}}
.op-panel{width:min(560px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:18px 20px 16px;border-radius:22px;background:#fffaf2;color:#5a4030;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.op-panel h2{margin:0 0 4px;font-size:22px;color:#c0603a}
.op-panel h3{margin:14px 0 6px;font-size:15px;color:#8a6a50}
.op-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.op-panel button{font:inherit;font-weight:bold;font-size:15px;padding:.5em 1em;border:2px solid #f2c48a;border-radius:999px;background:#fff;color:#a0582e;cursor:pointer}
.op-panel button.op-on{background:#f29a1f;border-color:#f29a1f;color:#fff}
.op-panel button.op-warn{border-color:#ec9a9a;color:#c84040}
.op-ask h2{margin-bottom:14px}.op-ask .op-row button{font-size:20px;padding:.6em 1.4em}
.op-confirm{margin-top:10px;padding:10px;border-radius:14px;background:#fff0ec}
.op-confirm p{margin:0 0 8px;font-size:14px;line-height:1.5}
.op-panel .op-close{margin-top:16px;padding:.55em 2.2em;border-color:#f29a1f;background:#f29a1f;color:#fff}
`;
const UNIT_BTNS = () => [['km', tUi('キロメートル')], ['mi', tUi('マイル')]].map(([u, s]) => `<button data-u="${u}">${s}</button>`).join('');
function injectCss(){ if(document.getElementById('options-css')) return; const st = document.createElement('style'); st.id = 'options-css'; st.textContent = CSS; document.head.appendChild(st); }

export function createOptions({ onReset, onClose }){
  injectCss();
  const el = document.createElement('div'); el.className = 'op-root';
  el.innerHTML = '<div class="op-panel"><h2>' + tUi('せってい') + '</h2>'
    + '<h3>' + tUi('ことば') + '</h3><div class="op-row" data-nocheck>' + LANGS.map(l => `<button lang="${l.code}" data-l="${l.code}"${l.code === lang ? ' class="op-on"' : ''}>${l.label}</button>`).join('') + '</div>'
    + '<h3>' + tUi('はやさの たんい') + '</h3><div class="op-row">' + UNIT_BTNS() + '</div>'
    + '<h3>' + tUi('きろく') + '</h3><div class="op-row"><button class="op-warn" data-r="ask">' + tUi('きろくを けす') + '</button></div>'
    + '<div class="op-confirm" hidden><p>' + tUi('クリアと ハイスコアの きろくを けします。<br>ほんとうに けす？') + '</p><div class="op-row"><button class="op-warn" data-r="yes">' + tUi('けす') + '</button><button data-r="no">' + tUi('やめる') + '</button></div></div>'
    + '<button class="op-close">' + tUi('とじる') + '</button></div>';
  document.body.appendChild(el);
  const confirm = el.querySelector('.op-confirm'), askBtn = el.querySelector('[data-r="ask"]');
  const markUnit = () => el.querySelectorAll('[data-u]').forEach(b => b.classList.toggle('op-on', b.dataset.u === getUnit()));
  markUnit();
  let open = true;
  const close = () => { if(!open) return; open = false; el.remove(); onClose(); };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b || !open) return;
    if(b.dataset.l != null){ if(b.dataset.l !== lang) setLang(b.dataset.l); }
    else if(b.dataset.u != null){ setUnit(b.dataset.u); markUnit(); }
    else if(b.dataset.r === 'ask'){ confirm.hidden = false; askBtn.hidden = true; }
    else if(b.dataset.r === 'yes'){ onReset(); confirm.hidden = true; askBtn.hidden = false; askBtn.disabled = true; askBtn.textContent = tUi('けしました'); }
    else if(b.dataset.r === 'no'){ confirm.hidden = true; askBtn.hidden = false; }
    else if(b.classList.contains('op-close')) close();
  });
  el.addEventListener('pointerdown', e => e.stopPropagation());
  return { close };
}

export function createUnitAsk({ onPick }){   // はやさの 単位を 最初に 1 回 聞く 板 (日本語 以外、11/9 社長: 自動で 英語に なる 人は 🌐 を 押さないので ここで 聞く)。後から せっていで 変えられる
  injectCss();
  const el = document.createElement('div'); el.className = 'op-root op-ask';
  el.innerHTML = '<div class="op-panel"><h2>' + tUi('はやさの たんい') + '</h2><div class="op-row">' + UNIT_BTNS() + '</div></div>';
  document.body.appendChild(el);
  el.addEventListener('click', e => { const b = e.target.closest('[data-u]'); if(!b) return; setUnit(b.dataset.u); el.remove(); onPick(); });
  el.addEventListener('pointerdown', e => e.stopPropagation());
  return { close(){ el.remove(); } };
}
