// Winthrop Riverwalk — interactive 3D river-trail hero (Three.js, no build step)
import * as THREE from "three";

const mount = document.getElementById("hero3d");
const hero = document.querySelector(".hero");
if (mount) init();

function init() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    if (!renderer.getContext()) throw 0;
  } catch (e) {
    if (hero) hero.classList.add("no3d");
    return;
  }

  const W = () => mount.clientWidth || window.innerWidth;
  const H = () => mount.clientHeight || window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(W(), H());
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color("#e3ebe6");
  scene.fog = new THREE.Fog(fogColor, 26, 150);

  const camera = new THREE.PerspectiveCamera(56, W() / H(), 0.1, 400);

  scene.add(new THREE.HemisphereLight(0xfdf6e6, 0x59634a, 1.0));
  const sun = new THREE.DirectionalLight(0xffe9c6, 1.15);
  sun.position.set(-34, 42, 18);
  scene.add(sun);

  // ---- valley parameters ----
  const PERIOD = 70;            // length (z) of one repeating segment — used for the seamless loop
  const RIVER = 6.5;            // half-width of the river channel
  const BANK = 12;             // where the bank levels off
  const TRAILX = RIVER + 4.6;   // trail offset to one side of the river
  const TRAILW = 3.2;
  const Z0 = 20, Z1 = -220;     // terrain front/back
  const base = (2 * Math.PI) / PERIOD;

  // winding centerline (periodic in z so the loop is seamless)
  const centerX = (z) => 13 * Math.sin(z * base) + 5 * Math.sin(z * base * 2 + 1.2);

  function height(x, z) {
    const dx = x - centerX(z), a = Math.abs(dx);
    if (a < RIVER) return -2.4 + (a / RIVER) * 0.5;
    if (a < BANK) return -1.9 + ((a - RIVER) / (BANK - RIVER)) * 1.9;
    const t = a - BANK;
    let h = t * 0.14 + 1.3 * Math.sin(x * 0.11) + 1.0 * Math.sin(z * base * 3 + x * 0.05) + 0.8 * Math.cos(x * 0.05 + z * base);
    if (a > 40) h += (a - 40) * 0.55 + 3 * Math.sin(x * 0.05 + z * base * 2);
    return h;
  }

  const cTmp = new THREE.Color();
  function terrainColor(x, z, y) {
    if (y < -1.0) return cTmp.set("#c8b389");
    if (y < 0.7) return cTmp.set("#d6c198");                 // sandy bank
    if (y < 6) return cTmp.set((Math.sin(x * 0.3 + z * 0.2) > 0) ? "#74815a" : "#697154"); // hills
    if (y < 10.5) return cTmp.set("#8d897b");                // rock
    return cTmp.set("#edeee8");                              // snow
  }

  // ---- terrain heightfield ----
  const geo = new THREE.PlaneGeometry(150, Z0 - Z1, 96, 168);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const zShift = (Z0 + Z1) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i) + zShift;
    const y = height(x, z);
    pos.setY(i, y);
    pos.setZ(i, z);
    const c = terrainColor(x, z, y);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 })));

  // ---- ribbon helper (river + trail) ----
  function ribbon(offset, halfW, yFn, color, opacity, rough) {
    const N = 170, v = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const z = Z0 + (Z1 - Z0) * (i / N);
      const cx = centerX(z) + offset, y = yFn(z);
      v.push(cx - halfW, y, z, cx + halfW, y, z);
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, roughness: rough, metalness: 0.05, side: THREE.DoubleSide });
    return new THREE.Mesh(g, m);
  }

  const river = ribbon(0, RIVER - 0.4, () => -1.85, new THREE.Color("#5f97a8"), 0.92, 0.35);
  scene.add(river);
  // cache base coords for the ripple animation
  const rPos = river.geometry.attributes.position;
  const rN = rPos.count, rx = new Float32Array(rN), ry = new Float32Array(rN), rz = new Float32Array(rN);
  for (let i = 0; i < rN; i++) { rx[i] = rPos.getX(i); ry[i] = rPos.getY(i); rz[i] = rPos.getZ(i); }

  scene.add(ribbon(TRAILX, TRAILW / 2, (z) => height(centerX(z) + TRAILX, z) + 0.08, new THREE.Color("#d3bd92"), 1, 0.95));

  // ---- pine trees (instanced, periodic layout) ----
  const cone = new THREE.ConeGeometry(1, 3, 7); cone.translate(0, 1.5, 0);
  const treeMat = new THREE.MeshStandardMaterial({ color: "#586547", flatShading: true, roughness: 1 });
  const spots = [];
  for (let k = 0; k < 5; k++) {
    const zb = Z0 - k * PERIOD;
    for (let j = 0; j < 16; j++) {
      const z = zb - (j / 16) * PERIOD;
      const side = (j % 2) ? 1 : -1;
      const a = BANK + 3 + ((j * 53) % 26);
      const x = centerX(z) + side * a;
      if (Math.abs(x) > 72) continue;
      const y = height(x, z);
      if (y < 0.9 || y > 9.5) continue;
      spots.push([x, y, z, 0.7 + ((j * j) % 5) * 0.2]);
    }
  }
  const trees = new THREE.InstancedMesh(cone, treeMat, spots.length);
  const m4 = new THREE.Matrix4();
  spots.forEach((p, i) => { m4.makeScale(p[3], p[3] * 1.25, p[3]); m4.setPosition(p[0], p[1], p[2]); trees.setMatrixAt(i, m4); });
  trees.instanceMatrix.needsUpdate = true;
  scene.add(trees);

  // ---- camera fly + interaction ----
  const clock = new THREE.Clock();
  const SPEED = 5.0;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  mount.addEventListener("pointermove", (e) => {
    const r = mount.getBoundingClientRect();
    tmx = (e.clientX - r.left) / r.width - 0.5;
    tmy = (e.clientY - r.top) / r.height - 0.5;
  });
  mount.addEventListener("pointerleave", () => { tmx = 0; tmy = 0; });

  function setCamera(t) {
    const cz = -((t * SPEED) % PERIOD);            // forward fly; wraps every PERIOD (seamless — terrain is periodic)
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    const bob = Math.sin(t * 1.35) * 0.16;
    camera.position.set(centerX(cz) + TRAILX + mx * 7, 3.7 + bob - my * 2.2, cz);
    const tz = cz - 24;
    camera.lookAt(centerX(tz) + TRAILX * 0.6 + mx * 5, 1.3 - my * 3, tz);
  }

  function rippleWater(t) {
    for (let i = 0; i < rN; i++) rPos.setY(i, ry[i] + 0.13 * Math.sin(t * 1.6 + rz[i] * 0.25 + rx[i] * 0.4));
    rPos.needsUpdate = true;
    river.geometry.computeVertexNormals();
  }

  // first frame
  setCamera(0);
  renderer.render(scene, camera);

  // ---- loop (pause when off-screen) ----
  let rafId = null;
  function loop() {
    const t = clock.getElapsedTime();
    setCamera(t);
    rippleWater(t);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  }
  function start() { if (!rafId && !reduce) rafId = requestAnimationFrame(loop); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  if (!reduce) {
    new IntersectionObserver((es) => { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.01 }).observe(mount);
    start();
  }

  window.addEventListener("resize", () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    if (reduce) renderer.render(scene, camera);
  });
}
