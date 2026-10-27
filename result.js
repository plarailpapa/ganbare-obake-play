// 結果発表の画面 (10/20): 面の終わりの お祝い。速さ・「○○より はやい！」・合格/あと何 km・おばけの絵・紙吹雪・ボタン・足りない時の 神様の励まし
// 設計書 docs/superpowers/specs/2026-10-20-ganbare-obake-stage-flow-design.md 3〜4 章 (見本 result-layout.html)
import { rubyHtml, playSound } from './talk.js';

export const FAIL_LINES = [   // 足りなかった時の 神様の言葉 (声の台本 ファイル 6 の 1〜4)
  { id:'fail-01', text:'おしい！ もういちど いってみよう' },
  { id:'fail-02', text:'みんなを おどろかせるんでしょ？ ほら、もういっかい！' },
  { id:'fail-03', text:'だいじょうぶ。おばけは なんども ちょうせん できるんだから' },
  { id:'fail-04', text:'つぎこそ いけそうな きが する！' }
];
export function failLine(n){ return n <= 4 ? FAIL_LINES[Math.max(1, n) - 1] : FAIL_LINES[1 + (n - 5) % 3]; }   // n = その面で 足りなかった回数 (5 回目から 2・3・4 を くり返す)

export function praiseFor(list, kmh, exclude){   // 「○○より はやい！」の相手: 最後の速さより 遅い中で いちばん速いもの (合格の相手は 除く)
  let best = null;
  for(const o of list) if(o.kmh != null && o.kmh < kmh && o.name !== exclude && (!best || o.kmh > best.kmh)) best = o;
  return best ? { name:best.name, kana:best.kana } : null;
}

export const COSMIC3 = [   // 3 面の 宇宙の速さの段 (最初の案。プレビューで 直す)
  { name:'水星', kana:'すいせい', kmh:170500 },
  { name:'パーカー・ソーラー・プローブ', kmh:692000 },
  { name:'太陽系の 公転', kana:'たいようけいの こうてん', kmh:830000 }
];

const CSS = `
.rs-root{position:fixed;inset:0;z-index:44;font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","Yu Gothic",sans-serif;pointer-events:none;animation:rs-in .5s ease}
@keyframes rs-in{from{opacity:0}}
.rs-conf{position:absolute;inset:0;width:100%;height:100%}
.rs-speed{position:absolute;left:0;right:0;top:calc(7vh + env(safe-area-inset-top));text-align:center;color:#fff;font-weight:900;font-size:clamp(34px,9vw,72px);-webkit-text-stroke:.16em #3a7ad8;paint-order:stroke fill}
.rs-speed rt{font-size:.3em;-webkit-text-stroke:.1em #3a7ad8}
.rs-speed small{font-size:.5em}
.rs-tag{display:block;margin:4px auto 0;width:max-content;font-size:clamp(12px,3.2vw,16px);font-weight:bold;color:#fff;-webkit-text-stroke:0;border-radius:10px;padding:2px 12px;background:rgba(255,120,40,.85)}
.rs-tag.rec{background:rgba(230,40,90,.9);animation:rs-pop .6s ease}
.rs-tag.rank{background:rgba(60,120,220,.9)}
@keyframes rs-pop{40%{transform:scale(1.25)}}
.rs-praise{position:absolute;left:8px;right:8px;top:calc(7vh + clamp(52px,13vw,106px) + env(safe-area-inset-top));text-align:center;color:#fff;font-weight:900;font-size:clamp(20px,5.6vw,42px);-webkit-text-stroke:.14em #ff9a2e;paint-order:stroke fill}
.rs-praise rt{font-size:.38em;-webkit-text-stroke:.1em #ff9a2e}
.rs-line{position:absolute;left:8px;right:8px;top:calc(7vh + clamp(90px,22vw,170px) + env(safe-area-inset-top));text-align:center;color:#fff3c4;font-weight:bold;font-size:clamp(15px,4.2vw,26px);line-height:1.9;text-shadow:0 0 6px rgba(0,0,0,.7)}
.rs-line rt{font-size:.5em}
.rs-ch{position:absolute;top:calc(7vh + clamp(132px,31vw,240px) + env(safe-area-inset-top))}
.rs-fr{position:relative;width:100%}
.rs-fr img{position:absolute;display:block}
.rs-obake{left:50%;transform:translateX(-50%);width:min(30vw,170px)}
.rs-obake .rs-fr{aspect-ratio:0.708}.rs-obake img{width:143.7%;left:-25.1%;top:-19.3%}
.rs-god .rs-obake{left:34%}
.rs-kami{right:6vw;width:min(24vw,140px)}
.rs-kami .rs-fr{aspect-ratio:0.642}.rs-kami img{width:107.8%;left:-1.08%;top:-7.8%}
.rs-box{position:absolute;left:50%;transform:translateX(-50%);width:min(640px,calc(100vw - 16px));box-sizing:border-box;bottom:calc(3.5vh + env(safe-area-inset-bottom) + var(--rs-bh) + 16px);display:none;background:rgba(255,255,255,.94);border:2px solid #f2c96b;border-radius:14px;padding:18px 14px 12px;font-size:clamp(15px,4.2vw,22px);line-height:1.75;color:#333;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.rs-box .rs-nm{position:absolute;top:-14px;left:14px;background:#fff3c4;color:#5a3b00;border-radius:9px;padding:1px 12px;font-weight:bold;font-size:clamp(12px,3.4vw,16px)}
.rs-textgod .rs-box{display:block}
.rs-btns{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(3.5vh + env(safe-area-inset-bottom));width:min(420px,84vw);display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:auto}
.rs-btn{display:block;width:100%;border:0;border-radius:18px;font:inherit;font-weight:bold;cursor:pointer;-webkit-tap-highlight-color:transparent}
.rs-big{padding:16px 0;font-size:clamp(18px,5vw,26px);background:#ffd66b;color:#5a3b00;box-shadow:0 4px 0 #c9962a}
.rs-small{width:80%;padding:10px 0;font-size:clamp(15px,4vw,20px);background:rgba(255,255,255,.92);color:#3a4a7a;box-shadow:0 3px 0 #9aa4c0}
.rs-off .rs-btn{opacity:.6;pointer-events:none}
`;

function startConfetti(cv){   // 紙吹雪 (2D)。3.2 秒 降らせて 止める
  const g = cv.getContext('2d'), cols = ['#ffd66b', '#7fd3ff', '#ff8fb1', '#9ff09a', '#ffffff', '#c7a0ff'], t0 = performance.now(), ps = [];
  for(let i = 0; i < 140; i++) ps.push({ x:Math.random(), y:-Math.random() * 0.6, vy:0.18 + Math.random() * 0.22, vx:(Math.random() - 0.5) * 0.08, r:Math.random() * 6.28, vr:(Math.random() - 0.5) * 8, w:6 + Math.random() * 6, c:cols[i % cols.length], ph:Math.random() * 6.28 });
  let last = t0, alive = true;
  const step = now => {
    if(!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000), el = (now - t0) / 1000; last = now;
    const w = cv.width = window.innerWidth, h = cv.height = window.innerHeight;
    for(const p of ps){ p.y += p.vy * dt; p.x += (p.vx + Math.sin(el * 3 + p.ph) * 0.03) * dt; p.r += p.vr * dt;
      g.save(); g.translate(p.x * w, p.y * h); g.rotate(p.r); g.globalAlpha = el > 2.6 ? Math.max(0, 1 - (el - 2.6) / 0.6) : 1; g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.w * 0.3, p.w, p.w * 0.6); g.restore(); }
    if(el < 3.2) requestAnimationFrame(step); else g.clearRect(0, 0, w, h);
  };
  requestAnimationFrame(step);
  return () => { alive = false; };
}

const fmt = n => Math.round(n).toLocaleString('en-US');
const nameHtml = p => rubyHtml(p.kana ? '{' + p.name + '|' + p.kana + '}' : p.name);

export function createResult(root, { actx, faces }){
  if(!document.getElementById('rs-css')){ const st = document.createElement('style'); st.id = 'rs-css'; st.textContent = CSS; document.head.appendChild(st); }
  let stopConf = null, gen = 0, voice = null;   // gen = 表示の番号 (閉じた後に 遅れて届いた声を 鳴らさない・次の画面を 変えない、Codex 指摘 10/20)
  function clear(){ gen++; if(voice){ try{ voice.stop(); }catch(e){} voice = null; } if(stopConf){ stopConf(); stopConf = null; } root.innerHTML = ''; root.className = ''; root.hidden = true; }
  return {
    show(d){
      clear(); root.hidden = false; root.className = 'rs-root' + (d.god ? ' rs-god' : '');
      const tags = (d.booster ? '<span class="rs-tag">ブースターつき</span>' : '') + (d.rank ? `<span class="rs-tag rank">ランキング ${d.rank}い！</span>` : '') + (d.record ? '<span class="rs-tag rec">しんきろく！</span>' : '');   /* rank = ライバルと 自分の 記録を 合わせた 順位 (10 位まで、10/27 社長) */
      let h = '<canvas class="rs-conf"></canvas>'
        + `<div class="rs-speed"><ruby>時速<rt>じそく</rt></ruby> ${fmt(d.kmh)} <small>km</small>${tags}</div>`
        + (d.praise ? `<div class="rs-praise">${nameHtml(d.praise)}より はやい！</div>` : '')
        + `<div class="rs-line">${rubyHtml(d.ok ? d.okLine : (d.remainLine || ''))}</div>`
        + `<div class="rs-ch rs-obake"><div class="rs-fr"><img alt="" src="${d.ok ? faces.obake.egao : faces.obake.eehatena}"></div></div>`;   /* 足りない時は 口開け (えー！？) の顔 (10/20 社長) */
      if(d.god) h += `<div class="rs-ch rs-kami"><div class="rs-fr"><img alt="" src="${faces.kami.egao}"></div></div><div class="rs-box"><span class="rs-nm">かみさま</span>${rubyHtml(d.god.line.text)}</div>`;
      h += '<div class="rs-btns">' + d.buttons.map(b => `<button type="button" class="rs-btn ${b.big ? 'rs-big' : 'rs-small'}" data-id="${b.id}">${b.label}</button>`).join('') + '</div>';
      root.innerHTML = h;
      const btns = root.querySelector('.rs-btns');
      root.style.setProperty('--rs-bh', btns.getBoundingClientRect().height + 'px');   // 神様の言葉の箱は ボタンの上に
      let done = false;
      const press = e => {   // 1 回押したら 全部のボタンを 効かなくする (連打・2 本指で 2 回始まらない)。指・マウスは pointerdown、キーボード (Tab → Enter・Space) は click (Codex 指摘 10/20)
        const b = e.target.closest('.rs-btn'); if(!b || done) return;
        e.preventDefault(); done = true; root.classList.add('rs-off'); d.onButton(b.dataset.id);
      };
      btns.addEventListener('pointerdown', press); btns.addEventListener('click', press);
      if(d.confetti) stopConf = startConfetti(root.querySelector('.rs-conf'));
      if(d.god){ const my = gen;   // 神様は 声だけ (10/20 社長)。声のファイルが無い間だけ 文字の窓を ボタンの上に出す
        playSound(actx, 'assets/voice/' + d.god.line.id + '.mp3', 1, () => my === gen).then(s => { if(my !== gen){ if(s) s.stop(); return; } if(s) voice = s; else root.classList.add('rs-textgod'); }); }
    },
    hide: clear,
    dispose: clear
  };
}
