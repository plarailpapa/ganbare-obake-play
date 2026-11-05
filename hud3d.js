// 画面の 表示の 中の 小さな 3D (11/5 社長: がんばる表示の 右端で 回る ミニ地球)。ゲームと 同じ renderer で、毎コマの 最後に 画面の 小さな 四角に だけ 描く
import * as THREE from 'three';

export function createHud3d(renderer){
  const views=[], size=new THREE.Vector2(), vp=new THREE.Vector4(), sc=new THREE.Vector4();

  function relayout(){ for(const v of views) v.rect=v.el.getBoundingClientRect(); }   // 四角は 読み込み時・画面の 大きさが 変わった 時だけ 測る (毎コマ 測ると 表示の 書き換えと 重なって 重い)

  function earth(el, map){   // 地図 (map) は 1 面の ミニ地球と 共有・軸を 23.4 度 傾けて 8 秒で 1 回 自転。大気の 光は 要素の CSS (box-shadow)
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(30, 1, 0.1, 20); camera.position.set(0, 0, 3.9);   /* 半径 1 の 球が 四角に ちょうど 入る 距離 (1 / sin 15°) */
    const tilt=new THREE.Group(); tilt.rotation.z=23.4*Math.PI/180; scene.add(tilt);
    const mat=new THREE.MeshLambertMaterial({ map, emissive:0xffffff, emissiveMap:map, emissiveIntensity:0.35, transparent:true });
    const ball=new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), mat); tilt.add(ball);
    const sun=new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-2, 1.5, 3); scene.add(sun, new THREE.AmbientLight(0xffffff, 0.3));   /* 左上の 前から 照らす (右下が 夜) */
    views.push({ el, scene, camera, rect:null, mats:[mat], tick:dt=>{ ball.rotation.y+=dt*Math.PI/4; } });
    relayout();
  }

  function render(dt, alpha){   // alpha = 表示の 濃さ (0 なら 描かない。表示が ふわっと 消える 時に 合わせて 薄く する)
    if(!(alpha>0) || !views.length) return;
    renderer.getSize(size); renderer.getViewport(vp); renderer.getScissor(sc); const st=renderer.getScissorTest();
    for(const v of views){ v.tick(dt); const r=v.rect; if(!r || r.width<1 || r.height<1) continue;
      for(const m of v.mats) m.opacity=alpha;
      const x=r.left, y=size.y-r.bottom;   /* setViewport は CSS の 画素で 下から 数える (画素の 倍率は three が 掛ける) */
      renderer.setViewport(x, y, r.width, r.height); renderer.setScissor(x, y, r.width, r.height); renderer.setScissorTest(true);
      renderer.clearDepth(); renderer.render(v.scene, v.camera); }
    renderer.setScissorTest(st); renderer.setViewport(vp); renderer.setScissor(sc); }

  return { earth, render, relayout };
}
