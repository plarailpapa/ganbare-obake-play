// 一時停止 (11/9 社長): 画面の 下の 真ん中の ボタン・止めた 時の 板 (つづける / やりなおす / タイトルへ)。ブラウザや アプリが 裏に 回った 時も 自動で 開く。文字は PAUSE_TEXT (ことば表)
import { tUi } from './i18n.js';   // ことばの 切り替え (11/9)
export const PAUSE_TEXT = { ja:{ title:tUi('いちじ ていし'), resume:tUi('つづける'), retry:tUi('やりなおす'), toTitle:tUi('タイトルへ もどる') } };

const CSS = `
#pzBtn{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:20;width:44px;height:44px;padding:0;border:2px solid rgba(255,255,255,.75);border-radius:50%;background:rgba(30,22,60,.45);cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#pzBtn i{display:block;width:5px;height:16px;margin:0 2.5px;border-radius:2px;background:#fff}
#pzRoot{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(14,9,34,.55);font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif}
#pzRoot .pn{width:min(340px,100%);box-sizing:border-box;padding:18px 20px;border-radius:22px;background:#fffaf2;color:#5a4030;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:10px}
#pzRoot h2{margin:0 0 4px;font-size:20px;color:#c0603a}
#pzRoot button{font:inherit;font-weight:bold;font-size:17px;padding:.55em 1em;border:2px solid #f2c48a;border-radius:999px;background:#fff;color:#a0582e;cursor:pointer;touch-action:manipulation}
#pzRoot button.go{background:#f29a1f;border-color:#f29a1f;color:#fff;font-size:19px}
`;

export function createPause({ onPause, onResume, onRetry, onTitle }){
  const T = PAUSE_TEXT.ja;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'pzBtn'; btn.type = 'button'; btn.setAttribute('aria-label', T.title); btn.innerHTML = '<i></i><i></i>'; document.body.appendChild(btn);
  btn.style.display = 'none';
  const root = document.createElement('div'); root.id = 'pzRoot'; root.style.display = 'none';
  root.innerHTML = '<div class="pn"><h2>' + T.title + '</h2><button class="go" data-a="resume">' + T.resume + '</button><button data-a="retry">' + T.retry + '</button><button data-a="title">' + T.toTitle + '</button></div>';
  document.body.appendChild(root);
  let shown = false, open = false;
  btn.addEventListener('click', e => { e.preventDefault(); onPause(); });
  root.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; const a = b.dataset.a; if(a === 'resume') onResume(); else if(a === 'retry') onRetry(); else if(a === 'title') onTitle(); });
  return {
    showButton(v){ if(v === shown) return; shown = v; btn.style.display = v ? 'flex' : 'none'; },
    open(){ open = true; root.style.display = 'flex'; },
    close(){ open = false; root.style.display = 'none'; },
    isOpen: () => open,
  };
}
