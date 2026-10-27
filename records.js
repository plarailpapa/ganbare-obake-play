// 遊びの 記録 (10/27 エンディングの 設計書): クリアしたか・面ごとの 速さの 上位 10 件 (日付つき)・音の 大きさ。
// 端末に 保存 (localStorage の 鍵 1 つ)。使えない・壊れている 時は 空の 記録で 続ける (保存できなくても 遊べる)
const KEY = 'ganbare-obake-records-v1', TOP = 10;
let mem = null;
function load(){
  if(mem) return mem;
  try{ const o = JSON.parse(localStorage.getItem(KEY) || '{}'); mem = o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }catch(_){ mem = {}; }
  const sc = mem.scores && typeof mem.scores === 'object' && !Array.isArray(mem.scores) ? mem.scores : {}; mem.scores = {};
  for(const k of ['1', '2', '3']) if(Array.isArray(sc[k])) mem.scores[k] = sc[k].filter(s => s && typeof s === 'object' && Number.isFinite(s.kmh) && !s.booster)
    .map(s => ({ kmh:s.kmh, t:Number.isFinite(s.t) ? s.t : 0, ...(typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? { date:s.date } : {}) }));   // 形の おかしい 記録は 捨てる・おかしい 日付は 外す (JSON としては 正しくても 壊れている 時、Codex 指摘 10/27)。ブースターの 回も 外す (入れていた 版の 分)
  return mem;
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(_){} }
const byRank = (a, b) => b.kmh - a.kmh || (b.t || 0) - (a.t || 0);   // 順位の 並べ方 (保存・結果の 順位・ランキングの 板で 共通): 速い 順、同じ 速さなら 新しい 記録が 上 (ライバルは いちばん 古い 扱い)

export function isCleared(){ return !!load().cleared; }
export function markCleared(){ load().cleared = true; save(); }
export function resetRecords(){ const v = load().volume; mem = { scores:{} }; if(v != null) mem.volume = v; save(); }   // 記録を 消す (オプション)。音の 大きさは 記録でなく 設定なので 残す
export function addScore(stage, kmh, booster, rivals = []){   // 自分の 記録の 上位 10 件に 入れる。戻り値 { best: 自分の 1 位を 更新した (初めての 1 回目は 比べる 自分の 記録が 無いので false) = 「しんきろく！」, rank: ライバル (rivals = [{name, kmh}]) と 自分の 記録を 合わせた 順位 1〜10 (圏外 0) = 「ランキング ◯い！」}
  if(booster) return { best:false, rank:0 };   // ブースターを 使った 回は 記録・ランキングに 入れない (10/27 社長)
  const r = load(), list = Array.isArray(r.scores[stage]) ? r.scores[stage] : [], best = list.length ? list[0].kmh : -1, d = new Date();
  const e = { kmh, t:d.getTime(), date:`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` };
  list.push(e); list.sort(byRank); r.scores[stage] = list.slice(0, TOP); save();
  const table = [...rivals, ...r.scores[stage]].sort(byRank).slice(0, TOP);   // 順位は 保存した 記録から (保存から 外れた 回に 札が 出ない、Codex 指摘 10/27)
  return { best: best >= 0 && kmh > best, rank: table.indexOf(e) + 1 };
}
export function topScores(stage){ const l = load().scores[stage]; return Array.isArray(l) ? l.slice() : []; }
export function ranking(stage, rivals = []){ return [...rivals, ...topScores(stage).map(s => ({ ...s, you:true }))].sort(byRank).slice(0, TOP); }   // ランキングの 板: ライバルと 自分の 記録を 合わせた 10 位まで
export function getVolume(){ const v = load().volume; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 3; }   // 音の 大きさの 段: 3 = ふつう (今までの 大きさ) / 2 = ちいさい / 1 = とても ちいさい / 0 = なし
export function setVolume(n){ load().volume = n; save(); }
