// 遊びの 記録 (10/27 エンディングの 設計書): クリアしたか・面ごとの 速さの 上位 10 件 (日付つき)・音の 大きさ。
// 端末に 保存 (localStorage の 鍵 1 つ)。使えない・壊れている 時は 空の 記録で 続ける (保存できなくても 遊べる)
const KEY = 'ganbare-obake-records-v1', TOP = 10;
let mem = null;
function load(){
  if(mem) return mem;
  try{ const o = JSON.parse(localStorage.getItem(KEY) || '{}'); mem = o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }catch(_){ mem = {}; }
  const sc = mem.scores && typeof mem.scores === 'object' && !Array.isArray(mem.scores) ? mem.scores : {}; mem.scores = {};
  for(const k of ['1', '2', '3']) if(Array.isArray(sc[k])) mem.scores[k] = sc[k].filter(s => s && typeof s === 'object' && Number.isFinite(s.kmh) && !s.booster);   // 形の おかしい 記録は 捨てる (JSON としては 正しくても 壊れている 時、Codex 指摘 10/27)。ブースターの 回も 外す (入れていた 版の 分)
  return mem;
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(_){} }

export function isCleared(){ return !!load().cleared; }
export function markCleared(){ load().cleared = true; save(); }
export function resetRecords(){ const v = load().volume; mem = { scores:{} }; if(v != null) mem.volume = v; save(); }   // 記録を 消す (オプション)。音の 大きさは 記録でなく 設定なので 残す
export function addScore(stage, kmh, booster, rivals = []){   // 自分の 記録の 上位 10 件に 入れる。戻り値 { best: 自分の 1 位を 更新した (初めての 1 回目は 比べる 自分の 記録が 無いので false) = 「しんきろく！」, rank: ライバル (rivals = [{name, kmh}]) と 自分の 記録を 合わせた 順位 1〜10 (圏外 0) = 「ランキング ◯い！」}
  if(booster) return { best:false, rank:0 };   // ブースターを 使った 回は 記録・ランキングに 入れない (10/27 社長)
  const r = load(), list = Array.isArray(r.scores[stage]) ? r.scores[stage] : [], best = list.length ? list[0].kmh : -1, d = new Date();
  const e = { kmh, booster:!!booster, date:`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` };
  list.push(e); list.sort((a, b) => b.kmh - a.kmh); r.scores[stage] = list.slice(0, TOP); save();
  const table = [...rivals, ...list].sort((a, b) => b.kmh - a.kmh || (a === e ? -1 : b === e ? 1 : 0)).slice(0, TOP);   // 同じ 速さなら 今回が 上
  return { best: best >= 0 && kmh > best, rank: table.indexOf(e) + 1 };
}
export function topScores(stage){ const l = load().scores[stage]; return Array.isArray(l) ? l.slice() : []; }
export function ranking(stage, rivals = []){ return [...rivals, ...topScores(stage).map(s => ({ ...s, you:true }))].sort((a, b) => b.kmh - a.kmh || (a.you ? -1 : b.you ? 1 : 0)).slice(0, TOP); }   // ランキングの 板: ライバルと 自分の 記録を 合わせた 10 位まで (同じ 速さなら 自分が 上)
export function getVolume(){ const v = load().volume; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 3; }   // 音の 大きさの 段: 3 = ふつう (今までの 大きさ) / 2 = ちいさい / 1 = とても ちいさい / 0 = なし
export function setVolume(n){ load().volume = n; save(); }
