// 遊びの 記録 (10/27 エンディングの 設計書): クリアしたか・面ごとの 速さの 上位 10 件 (日付つき)・音の 大きさ。
// 端末に 保存 (localStorage の 鍵 1 つ)。使えない・壊れている 時は 空の 記録で 続ける (保存できなくても 遊べる)
const KEY = 'ganbare-obake-records-v1', TOP = 10;
let mem = null;
function load(){
  if(mem) return mem;
  try{ const o = JSON.parse(localStorage.getItem(KEY) || '{}'); mem = o && typeof o === 'object' ? o : {}; }catch(_){ mem = {}; }
  if(!mem.scores || typeof mem.scores !== 'object') mem.scores = {};
  return mem;
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(_){} }

export function isCleared(){ return !!load().cleared; }
export function markCleared(){ load().cleared = true; save(); }
export function resetRecords(){ const v = load().volume; mem = { scores:{} }; if(v != null) mem.volume = v; save(); }   // 記録を 消す (オプション)。音の 大きさは 記録でなく 設定なので 残す
export function addScore(stage, kmh, booster){   // 上位 10 件に 入れる。その面の 1 位を 更新したら true (「しんきろく！」)
  const r = load(), list = Array.isArray(r.scores[stage]) ? r.scores[stage] : [], best = list.length ? list[0].kmh : -1, d = new Date();
  list.push({ kmh, booster:!!booster, date:`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` });
  list.sort((a, b) => b.kmh - a.kmh); r.scores[stage] = list.slice(0, TOP); save();
  return kmh > best;
}
export function topScores(stage){ const l = load().scores[stage]; return Array.isArray(l) ? l.slice() : []; }
export function getVolume(){ const v = load().volume; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 3; }   // 音の 大きさの 段: 3 = ふつう (今までの 大きさ) / 2 = ちいさい / 1 = とても ちいさい / 0 = なし
export function setVolume(n){ load().volume = n; save(); }
