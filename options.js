// オプションの 板 (10/27 社長): 音の 大きさ・記録を 消す (画面の 向き たて / よこ は 10/27 社長「とりあえず のけて おく」)。タイトルの メニューから 開く
export const VOLUMES = [0, 0.2, 0.5, 1];   // 音の 大きさの 段 (records の getVolume と 同じ 並び) → 音の 出口の 倍率。3 = ふつう = 今までの 大きさ
const VOL_LABELS = ['なし', 'とても ちいさい', 'ちいさい', 'ふつう'];

const CSS = `
.op-root{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(40,50,80,.35);font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;user-select:none;-webkit-user-select:none;animation:op-in .25s ease}
@keyframes op-in{from{opacity:0}}
.op-panel{width:min(560px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:18px 20px 16px;border-radius:22px;background:#fffaf2;color:#5a4030;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.op-panel h2{margin:0 0 4px;font-size:22px;color:#c0603a}
.op-panel h3{margin:14px 0 6px;font-size:15px;color:#8a6a50}
.op-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.op-panel button{font:inherit;font-weight:bold;font-size:15px;padding:.5em 1em;border:2px solid #f2c48a;border-radius:999px;background:#fff;color:#a0582e;cursor:pointer}
.op-panel button.op-on{background:#f29a1f;border-color:#f29a1f;color:#fff}
.op-panel button.op-warn{border-color:#ec9a9a;color:#c84040}
.op-confirm{margin-top:10px;padding:10px;border-radius:14px;background:#fff0ec}
.op-confirm p{margin:0 0 8px;font-size:14px;line-height:1.5}
.op-panel .op-close{margin-top:16px;padding:.55em 2.2em;border-color:#f29a1f;background:#f29a1f;color:#fff}
`;
function injectCss(){ if(document.getElementById('options-css')) return; const st = document.createElement('style'); st.id = 'options-css'; st.textContent = CSS; document.head.appendChild(st); }

export function createOptions({ volume, onVolume, onReset, onClose }){
  injectCss();
  const el = document.createElement('div'); el.className = 'op-root';
  el.innerHTML = '<div class="op-panel"><h2>オプション</h2>'
    + '<h3>おとの おおきさ</h3><div class="op-row">' + [3, 2, 1, 0].map(n => `<button data-v="${n}">${VOL_LABELS[n]}</button>`).join('') + '</div>'
    + '<h3>きろく</h3><div class="op-row"><button class="op-warn" data-r="ask">きろくを けす</button></div>'
    + '<div class="op-confirm" hidden><p>クリアと ハイスコアの きろくを けします。<br>ほんとうに けす？</p><div class="op-row"><button class="op-warn" data-r="yes">けす</button><button data-r="no">やめる</button></div></div>'
    + '<button class="op-close">とじる</button></div>';
  document.body.appendChild(el);
  const confirm = el.querySelector('.op-confirm'), askBtn = el.querySelector('[data-r="ask"]');
  const markVol = v => el.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('op-on', +b.dataset.v === v));
  markVol(volume);
  let open = true;
  const close = () => { if(!open) return; open = false; el.remove(); onClose(); };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b || !open) return;
    if(b.dataset.v != null){ const v = +b.dataset.v; markVol(v); onVolume(v); }
    else if(b.dataset.r === 'ask'){ confirm.hidden = false; askBtn.hidden = true; }
    else if(b.dataset.r === 'yes'){ onReset(); confirm.hidden = true; askBtn.hidden = false; askBtn.disabled = true; askBtn.textContent = 'けしました'; }
    else if(b.dataset.r === 'no'){ confirm.hidden = true; askBtn.hidden = false; }
    else if(b.classList.contains('op-close')) close();
  });
  el.addEventListener('pointerdown', e => e.stopPropagation());
  return { close };
}
