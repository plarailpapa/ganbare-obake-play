// ことばの 切り替え (11/9 社長「外国の 人にも 遊んで もらいたい」): 言語を 決めて、日本語 以外の 時だけ 表 (lang-<言語>.js) を 読む。日本語の 時は 表を 引かない = 今までと 同じ 文字
// 言語を 足す 時は lang-<言語>.js を 作って LANGS に 1 行 足す。label は その 言語の 文字で 書く
export const LANGS = [{ code:'ja', label:'日本語' }, { code:'en', label:'English' }];
const KEY = 'ganbare-obake-lang', known = c => LANGS.some(l => l.code === c);

function pick(){   // ?lang= (確かめ用) → 前に 選んだ 言語 → ブラウザの 言語 (日本語で なければ 英語)
  const q = new URLSearchParams(location.search).get('lang');
  if(known(q)) return q;
  try{ const s = localStorage.getItem(KEY); if(known(s)) return s; }catch(_){}
  return /^ja\b/i.test(navigator.language || 'ja') ? 'ja' : 'en';
}

let cur = pick(), table = null;
if(cur !== 'ja'){ try{ table = (await import('./lang-' + cur + '.js')).default; }catch(_){ cur = 'ja'; } }   // 表が 読めない 時は 日本語で 遊べるように
export const lang = cur;

const fill = (s, v) => v ? s.replace(/\{(\w+)\}/g, (m, k) => k in v ? v[k] : m) : s;   // {n} に 数や 名前を 差し込む (ふりがなの {漢字|かな} とは 形が 違う)
export const tUi = (ja, vars) => fill(table ? table.ui[ja] ?? ja : ja, vars);   // 画面の 文字
export const tName = name => table ? table.names[name] ?? name : name;   // ライバル・惑星・世界の 名前。name は 中の 目印を 兼ねる ので 画面に 出す 所で 通す
export const tLine = (id, ja) => table ? (table.lines[id] ?? ja).replace(/<<(\d+)>>/g, (m, n) => fmtSpeed(+n) + ' ' + unitLabel()) : ja;   // 会話の セリフ (id で 引く)

export function setLang(code){   // 選んだ 言語を 覚えて 開き直す。保存 できない (プライベート モード) 時は アドレスに 持たせる
  let kept = false;
  try{ localStorage.setItem(KEY, code); kept = localStorage.getItem(KEY) === code; }catch(_){}
  const u = new URL(location.href);
  if(kept) u.searchParams.delete('lang'); else u.searchParams.set('lang', code);
  location.replace(u.href);
}

// はやさの 単位 (11/9 社長): せっていで km/h か マイルか を 選ぶ。変えるのは 表示だけで、中の 計算と 記録は km/h のまま
const UNIT_KEY = 'ganbare-obake-unit';
let curUnit = 'km';
let unitPicked = false;
try{ const u = localStorage.getItem(UNIT_KEY); if(u === 'mi' || u === 'km'){ curUnit = u; unitPicked = new URLSearchParams(location.search).get('unitask') !== '1'; } }catch(_){}   // ?unitask=1 = 確かめ用 (もう 一度 聞く)
export const needUnitAsk = () => lang !== 'ja' && !unitPicked;   // 日本語 以外で まだ 単位を 選んで いない 人に 最初の 1 回だけ 聞く (11/9 社長)
export const getUnit = () => curUnit;
export function setUnit(u){ curUnit = u; unitPicked = true; try{ localStorage.setItem(UNIT_KEY, u); }catch(_){} }
export const fmtSpeed = kmh => Math.round(curUnit === 'mi' ? kmh * 0.621371 : kmh).toLocaleString('ja-JP');   // 時速 km の 数 → 今の 単位の 数字
export const unitLabel = () => table ? table.units[curUnit] : curUnit === 'mi' ? 'マイル' : 'km';   // 単位の 字 (日本語 km / マイル、英語 km/h / mph)
export const speedHtml = kmh => (table ? '' : '<ruby>時速<rt>じそく</rt></ruby> ') + fmtSpeed(kmh) + ' ' + unitLabel();   // 「時速 ○○ km」(日本語) / 「○○ km/h」(英語) の 表示

export function startJaCheck(send){   // 確かめ用 (?errlog=1&jacheck=1): 画面に 見えて いる 文字に 日本語が 残って いたら 記録へ 送る
  const JA = /[ぁ-んァ-ヶ一-龠]/, seen = new Set();
  setInterval(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n; (n = w.nextNode());){
      const s = n.nodeValue.trim(), p = n.parentElement;
      if(!s || seen.has(s) || !JA.test(s) || /^(SCRIPT|STYLE)$/.test(p.tagName) || p.closest('[data-nocheck]') || !p.getClientRects().length) continue;
      seen.add(s); send({ 'ja-left':s });
    }
  }, 2000);
}
