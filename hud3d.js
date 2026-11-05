// 画面の 表示の 中の 小さな 3D (11/5 社長: がんばる表示の 右端で 回る ミニ地球)。ゲームと 同じ renderer で、毎コマの 最後に 画面の 小さな 四角に だけ 描く
import * as THREE from 'three';

export function createHud3d(renderer){
  const views=[], size=new THREE.Vector2(), vp=new THREE.Vector4(), sc=new THREE.Vector4();

  function relayout(){ for(const v of views) v.rect=v.el.getBoundingClientRect(); if(slotEl) slotRect=slotEl.getBoundingClientRect(); }   // 四角は 読み込み時・画面の 大きさが 変わった 時だけ 測る (毎コマ 測ると 表示の 書き換えと 重なって 重い)

  function earth(el, map){   // 地図 (map) は 1 面の ミニ地球と 共有・軸を 23.4 度 傾けて 8 秒で 1 回 自転。大気の 光は 要素の CSS (box-shadow)
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(30, 1, 0.1, 20); camera.position.set(0, 0, 3.9);   /* 半径 1 の 球が 四角に ちょうど 入る 距離 (1 / sin 15°) */
    const tilt=new THREE.Group(); tilt.rotation.z=23.4*Math.PI/180; scene.add(tilt);
    const mat=new THREE.MeshLambertMaterial({ map, emissive:0xffffff, emissiveMap:map, emissiveIntensity:0.35, transparent:true });
    const ball=new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), mat); tilt.add(ball);
    const sun=new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-2, 1.5, 3); scene.add(sun, new THREE.AmbientLight(0xffffff, 0.3));   /* 左上の 前から 照らす (右下が 夜) */
    views.push({ el, scene, camera, rect:null, mats:[mat], tick:dt=>{ ball.rotation.y+=dt*Math.PI/4; } });
    relayout();
  }

  // 次の 相手の 模型 (11/5 社長): ゆっくり 回る。抜くと 左上へ ぴゅーん、次は 弾倉に 弾を 込める ように 下から 弧を 描いて 入って カチッ (弾倉の 中心 = 画面の 左ふち、弾倉は 見せない)
  const FIT=1.3, ENTER=0.65, WAIT=0.26, FLY=0.42, FLASH_AT=0.48;   // FIT = 模型を 描く 四角は 枠の 1.3 倍 (回る 時の はみ出し分)
  const EA=[150, 123, 84, 90], ES=[0.75, 0.9, 1.08, 1], EO=[0, 0.35, 0.8, 1];   // 入る 弧: 角度 (12 時から 時計回り) と 大きさ (見本 その 14 と 同じ)
  let slotEl=null, flashEl=null, slotRect=null, mScene=null, mCam=null, cur=null; const leaving=[];
  function slot(el, flash){ slotEl=el; flashEl=flash; mScene=new THREE.Scene(); mCam=new THREE.PerspectiveCamera(30, 1, 0.1, 50); mCam.position.set(0, 0, 3.9*FIT);
    const d=new THREE.DirectionalLight(0xffffff, 2.0); d.position.set(3, 4, 5); mScene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 2.2), d); relayout(); }
  function wrap(model){   // 大きさを そろえて 真ん中へ (いちばん 長い 辺 = 2)。少し 上から 見下ろし、横向きから 回り 始める
    model.position.set(0, 0, 0); model.quaternion.identity(); model.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(model), c=b.getCenter(new THREE.Vector3()), z=b.getSize(new THREE.Vector3()), r=Math.max(z.x, z.y, z.z)/2;
    model.position.sub(c); const spin=new THREE.Group(); spin.add(model); spin.scale.setScalar(r>0 ? 1/r : 1); spin.rotation.y=Math.PI/2;
    const root=new THREE.Group(); root.rotation.x=0.3; root.add(spin); root.visible=false; mScene.add(root); return { root, spin, model, t:0 }; }
  function drop(w){ mScene.remove(w.root); const sk=new Set(); w.root.traverse(o=>{ if(o.material) for(const m of [].concat(o.material)) m.dispose(); if(o.isSkinnedMesh && o.skeleton) sk.add(o.skeleton); }); for(const s of sk) s.dispose(); if(w.model.userData.dispose) w.model.userData.dispose(); }   // 材質・骨組みは 複製なので 捨てる (形・絵は ゲームと 共有。自前の 物は userData.dispose、Codex 指摘 11/5)
  function setNext(model, { animate=false }={}){
    if(cur){ if(animate && cur.t>=0){ cur.from={ ox:cur.ox||0, oy:cur.oy||0, k:cur.k||1 }; cur.t=0; leaving.push(cur); } else drop(cur); }   /* 入る 途中で 替わっても 今 いる 所から 飛ぶ (Codex 指摘 11/5) */
    if(!animate){ for(const w of leaving) drop(w); leaving.length=0; }
    cur= model ? wrap(model) : null; if(cur) cur.t= animate ? -WAIT : ENTER; }
  const bez=(x1, y1, x2, y2)=>p=>{ if(p<=0) return 0; if(p>=1) return 1; let lo=0, hi=1, t=p;   // CSS の cubic-bezier と 同じ 動きの 速さ
    for(let i=0;i<20;i++){ t=(lo+hi)/2; const x=3*(1-t)*(1-t)*t*x1+3*(1-t)*t*t*x2+t*t*t; if(x<p) lo=t; else hi=t; } return 3*(1-t)*(1-t)*t*y1+3*(1-t)*t*t*y2+t*t*t; };
  const easeIn=bez(0.3, 0.7, 0.4, 1), easeFly=bez(0.5, 0, 0.9, 0.4);
  function drawModel(w, ox, oy, k, roll){ const r=slotRect, cx=r.left+r.width/2+ox, cy=r.top+r.height/2+oy, s=r.width*FIT*k;
    if(s<1) return; mCam.rotation.z=roll; w.root.visible=true;
    const x=cx-s/2, y=size.y-(cy+s/2); renderer.setViewport(x, y, s, s); renderer.setScissor(x, y, s, s); renderer.setScissorTest(true);
    renderer.clearDepth(); renderer.render(mScene, mCam); w.root.visible=false; }
  function renderModels(dt){ if(!mScene || !slotRect || slotRect.width<1) return; const r=slotRect, S=r.width/56, R=r.left+r.width/2;   /* S = 表示の 拡大率・R = 弾倉の 半径 (画面の 左ふち → 枠の 真ん中) */
    for(let i=leaving.length-1;i>=0;i--){ const w=leaving[i]; w.t+=dt; w.spin.rotation.y+=dt*Math.PI*2/5; if(w.t>=FLY){ drop(w); leaving.splice(i, 1); continue; }
      const e=easeFly(w.t/FLY), f=w.from; drawModel(w, f.ox-70*S*e, f.oy-150*S*e, f.k*(1-0.7*e)*Math.min(1, (1-e)*4), -50*Math.PI/180*e); }   /* 左上へ 飛んで 縮んで 消える */
    if(!cur) return; const t0=cur.t; cur.t+=dt; cur.spin.rotation.y+=dt*Math.PI*2/5; if(cur.t<0) return;
    if(flashEl && t0<FLASH_AT && cur.t>=FLASH_AT){ flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on'); }   /* カチッ (ピカッ) */
    const p=easeIn(Math.min(1, cur.t/ENTER)); let j=0; while(j<EO.length-2 && p>EO[j+1]) j++; const u=(p-EO[j])/(EO[j+1]-EO[j]), a=(EA[j]+(EA[j+1]-EA[j])*u)*Math.PI/180, k=ES[j]+(ES[j+1]-ES[j])*u;
    cur.ox=R*(Math.sin(a)-1); cur.oy=-R*Math.cos(a); cur.k=k; drawModel(cur, cur.ox, cur.oy, k, 0); }

  function render(dt, alpha){   // alpha = 表示の 濃さ (0 なら 描かない。表示が ふわっと 消える 時に 合わせて 薄く する)
    if(!(alpha>0) || (!views.length && !mScene)) return;
    renderer.getSize(size); renderer.getViewport(vp); renderer.getScissor(sc); const st=renderer.getScissorTest();
    for(const v of views){ v.tick(dt); const r=v.rect; if(!r || r.width<1 || r.height<1) continue;
      for(const m of v.mats) m.opacity=alpha;
      const x=r.left, y=size.y-r.bottom;   /* setViewport は CSS の 画素で 下から 数える (画素の 倍率は three が 掛ける) */
      renderer.setViewport(x, y, r.width, r.height); renderer.setScissor(x, y, r.width, r.height); renderer.setScissorTest(true);
      renderer.clearDepth(); renderer.render(v.scene, v.camera); }
    if(alpha>0.5) renderModels(dt);   /* 模型は 透明に できない 材質が あるので、表示が 半分 消えた 所で 消す */
    renderer.setScissorTest(st); renderer.setViewport(vp); renderer.setScissor(sc); }

  return { earth, slot, setNext, render, relayout };
}
