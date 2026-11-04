// ステージ中の 効果音 (11/4 社長): レールを 移る「ひゅっ」(効果音ラボ「剣の素振り2」)・加速 (板も 輪も 同じ)「キーン」= 鉄琴の 音 (ゲームの 中で 作る)
// 加速は 鉄琴 (金属の 棒の 響き) + 薄い 風 + こだま。高い ザラつきは 入れない = 曲と ぶつからない (Pixabay の 通知音 10 個の ランダムは 音程が はっきりして 曲と 合わず 不採用、11/4)
// 鉄琴の 高さは 無限音階 (シェパード音): 連続 1 つごとに ドレミファソラシ… と 上がって 聞こえるが、1 オクターブずつ 離した 音を 山形の 大きさで 重ねて いる ので
// 7 つで 元の 高さに 戻っても 気づかない = 70 連続でも 高く なりすぎない (社長「無限音階風に」)。連続が 切れたら ド から
import { audioOut, loadSound } from './talk.js';

const SCALE = [0, 2, 4, 5, 7, 9, 11];   // ドレミファソラシ (半音の 数)
let noiseBuf = null;
const noise = actx => {   // 2 秒の ザーッ (使い回す。途中 0〜0.5 秒から 鳴らしても 1 秒の 風が 途中で 切れない)
  if(!noiseBuf){ const r = actx.sampleRate, n = r * 2, b = actx.createBuffer(1, n, r), d = b.getChannelData(0); for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noiseBuf = b; }
  return noiseBuf;
};
const live = [];   // 鳴って いる 加速の 音 (こだまが 消える まで 数える。速く 続けて 踏んでも 4 つ まで、古い 順に すっと 消す)

function swish(actx, out, t0, dur, f0, f1, q, vol, type = 'bandpass', atk = 0.2, hold = atk){   // 風を 切る 音 (ザーッを 絞って 高さを 動かす)。atk = 一番 大きく なる まで・hold = そのまま 続ける まで (長さの 割合)
  const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noise(actx); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * atk); g.gain.setValueAtTime(vol, t0 + dur * hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(out); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  return s;
}

const LANE_FILE = 'assets/sfx/lane.mp3';   // 効果音ラボ「剣の素振り2」(無料・表記不要)。社長が 3 つを 聞き比べて 選んだ (11/4「BGM や おばけの 声を 邪魔 しない」)
export function preloadSfx(actx){ if(actx) loadSound(actx, LANE_FILE); }

export function sfxLane(actx, dir){   // レールを 移る: 短い「ひゅっ」(動いた 側から 聞こえる)
  if(!actx || actx.state !== 'running') return;
  let out = audioOut(actx);
  if(actx.createStereoPanner){ const p = actx.createStereoPanner(); p.pan.value = Math.sign(dir) * 0.45; p.connect(out); out = p; }
  const tq = actx.currentTime;
  loadSound(actx, LANE_FILE).then(buf => { if(!buf || actx.state !== 'running' || actx.currentTime - tq > 0.15) return;   // 読み込みが 遅れた 時は 鳴らさない (タイトルや 次の 回で 遅れて 鳴らない、Codex 指摘 11/4)
    const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = 0.8;   // 8 割の 大きさ (11/4 社長「耳に 残る」→ 4 割 + 後ろを 切ったら「全く 聞こえない」→ 切らずに 8 割)
    s.buffer = buf; s.connect(g).connect(out); s.start(); });
}

function trim(){ while(live.length > 4){ const o = live.shift(), t = o.ctx.currentTime; o.g.gain.cancelScheduledValues(t); o.g.gain.setTargetAtTime(0, t, 0.02); for(const s of o.srcs){ try{ s.stop(t + 0.1); }catch(_){} } setTimeout(o.end, 150); } }   // 古い 順に すっと 消して 片づける

const GLOCK = [[1, 1, 1.0], [2.756, 0.32, 0.4], [5.404, 0.12, 0.18]];   // 鉄琴の 棒の 響き [高さの 倍率, 大きさ, 消える 秒]: 金属の 棒は 倍音が 整数倍で なく この 比で 重なる (高い 響きほど 早く 消える)

export function sfxBoost(actx, combo){   // 加速の 板・輪: 鉄琴の「キーン」+ 薄い 風 (combo = 何連続目か、1〜)。約 1 秒 (11/4 社長「透明感」→「この 路線で リッチに」→「ベルっぽく・鉄琴っぽく」)
  if(!actx || actx.state !== 'running') return;
  const t0 = actx.currentTime, n = Math.max(0, combo - 1), out = audioOut(actx), bus = actx.createGain(); bus.connect(out);
  const srcs = [swish(actx, bus, t0, 1.0, 600, 4000, 0.7, 0.1, 'lowpass', 0.08, 0.3)];   // 薄い 風 (加速の 感じ。高すぎる 所を 落とした ザーッ)
  srcs.push(swish(actx, bus, t0, 0.02, 3000, 3000, 1, 0.08, 'bandpass', 0.1));   // たたいた 瞬間の 小さな「コッ」(鉄琴の 硬い 立ち上がり)
  const shim = actx.createGain(), dl = actx.createDelay(0.5), fb = actx.createGain(), lp = actx.createBiquadFilter();   // 響き + こだま (0.12 秒ごとに 4 割ずつ、少し こもらせて 余韻に)
  dl.delayTime.value = 0.12; fb.gain.value = 0.4; lp.type = 'lowpass'; lp.frequency.value = 5000;
  shim.connect(bus); shim.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(bus);
  const pan = (node, x) => { if(!actx.createStereoPanner) return node; const p = actx.createStereoPanner(); p.pan.value = x; node.connect(p); return p; };
  const shift = SCALE[n % 7] / 12, CENTER = Math.log2(1568);   // 鉄琴の 音域 (ソ 1568 Hz の 山) で オクターブ違いを 重ねる (無限音階)
  for(let k = 0; k < 7; k++){
    const f = 110 * Math.pow(2, k + shift), w = Math.exp(-Math.pow(Math.log2(f) - CENTER, 2) / 1.4);
    if(w < 0.03) continue;
    for(const cents of [-4, 4]){   // 少しだけ ずらした 2 本を 左右に 分けて 重ね、広がりを
      for(const [r, a, d] of GLOCK){
        const fr = f * r; if(fr > 12000) continue;
        const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = fr; o.detune.value = cents;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.03 * w * a, t0 + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); pan(g, cents < 0 ? -0.4 : 0.4).connect(shim); o.start(t0); o.stop(t0 + d + 0.02); srcs.push(o);
      }
    }
  }
  const o = { ctx:actx, g:bus, srcs, done:false };
  o.end = () => { if(o.done) return; o.done = true; const i = live.indexOf(o); if(i >= 0) live.splice(i, 1);   // 片づけ: こだまの 輪と 途中の つなぎを 全部 外す (残ると 何百回も 踏んだ 時に 溜まる、Codex 指摘 11/4)
    fb.gain.value = 0; for(const nd of [shim, dl, lp, fb, bus]){ try{ nd.disconnect(); }catch(_){} } };
  live.push(o); trim(); setTimeout(o.end, 2000);   // こだまが 消える まで (約 2 秒) は「鳴って いる」に 数える (4 つ まで の 数え方を 正しく)
}
