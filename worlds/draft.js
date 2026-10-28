// 仮の 世界 (10/27): 分かれ道の まだ できていない 世界の 代わり。確かめ用 ?draft=1 だけで 通る (公開版では 輪を 出さない)。
// 世界の 色 (def.color) の 浮かぶ 形を コースの まわりに 散らし、「どの 世界に 来たか」が 分かる だけの 簡単な 景色
import * as THREE from 'three';

export function buildDraft(scene, root, P, opts){
  const col = new THREE.Color(P.def.color || '#ffffff'), n = opts.mobile ? 160 : 320, L = Math.max(60, P.len + 60);
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color:col, wireframe:true, transparent:true, opacity:0.7 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // 毎回 同じ 並び
  for(let i = 0; i < n; i++){
    const side = rnd() < 0.5 ? -1 : 1;
    p.set(side * (8 + rnd() * 50), -6 + rnd() * 40, rnd() * L);   // レールの まわり 8 m は 空ける
    q.setFromEuler(e.set(rnd() * 6, rnd() * 6, 0)); s.setScalar(0.6 + rnd() * 3.5);
    mesh.setMatrixAt(i, m.compose(p, q, s));
  }
  root.add(mesh);
  const floor = new THREE.GridHelper(L * 2, Math.round(L / 6), col, col); floor.position.set(0, -2, L / 2); floor.material.transparent = true; floor.material.opacity = 0.25; root.add(floor);
  return [];
}
