
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ═══════════════════════════════════════════════════════════════
//  D13-CAD  —  Main Application
// ═══════════════════════════════════════════════════════════════

const STATE = {
  scene: null, camera: null, renderer: null, controls: null,
  raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(),
  objects: [], selected: null, hovered: null,
  mode: 'select',   // select | move | rotate | scale | vertex
  snap: 1.0,
  isDragging: false, dragStart: null, dragOffset: null,
  isVertexDragging: false, draggedVertex: null,
  gridHelper: null, gridSize: 200, gridDivs: 200,
  undoStack: [], redoStack: [],
  nextId: 1,
};

const COLORS = {
  red: 0xe53e3e, orange: 0xdd6b20, yellow: 0xd69e2e, green: 0x38a169,
  teal: 0x319795, blue: 0x3182ce, indigo: 0x5a67d8, purple: 0x805ad5,
  pink: 0xd53f8c, gray: 0x718096, slate: 0x4a5568, white: 0xf7fafc,
  black: 0x1a202c, brown: 0x7b341e, gold: 0xb7791f, silver: 0xa0aec0,
};

const COLOR_SWATCHES = Object.values(COLORS);

// ═══════════════════════════════════════════════════════════════
//  SHAPE LIBRARY  —  Basic Shapes + Dummy 13 Pieces
// ═══════════════════════════════════════════════════════════════

const SHAPE_REGISTRY = {
  // ─── BASIC SHAPES ───
  box: {
    name: 'Box', category: 'basic', color: COLORS.red,
    make: () => new THREE.BoxGeometry(20, 20, 20),
    params: { w: 20, h: 20, d: 20 },
    thumb: 'box',
  },
  cylinder: {
    name: 'Cylinder', category: 'basic', color: COLORS.orange,
    make: () => new THREE.CylinderGeometry(10, 10, 20, 32),
    params: { r: 10, h: 20 },
    thumb: 'cylinder',
  },
  sphere: {
    name: 'Sphere', category: 'basic', color: COLORS.silver,
    make: () => new THREE.SphereGeometry(12, 32, 16),
    params: { r: 12 },
    thumb: 'sphere',
  },
  cone: {
    name: 'Cone', category: 'basic', color: COLORS.green,
    make: () => new THREE.ConeGeometry(10, 20, 32),
    params: { r: 10, h: 20 },
    thumb: 'cone',
  },
  torus: {
    name: 'Torus', category: 'basic', color: COLORS.blue,
    make: () => new THREE.TorusGeometry(10, 3, 16, 32),
    params: { r: 10, tube: 3 },
    thumb: 'torus',
  },
  pyramid: {
    name: 'Pyramid', category: 'basic', color: COLORS.yellow,
    make: () => new THREE.ConeGeometry(12, 20, 4),
    params: { r: 12, h: 20 },
    thumb: 'pyramid',
  },
  roof: {
    name: 'Roof', category: 'basic', color: COLORS.teal,
    make: () => new THREE.ConeGeometry(15, 12, 4),
    params: { r: 15, h: 12 },
    thumb: 'roof',
  },
  tube: {
    name: 'Tube', category: 'basic', color: COLORS.purple,
    make: () => new THREE.CylinderGeometry(6, 6, 20, 32, 1, true),
    params: { r: 6, h: 20 },
    thumb: 'tube',
  },
  halfsphere: {
    name: 'Half Sphere', category: 'basic', color: COLORS.pink,
    make: () => new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    params: { r: 12 },
    thumb: 'halfsphere',
  },
  paraboloid: {
    name: 'Paraboloid', category: 'basic', color: COLORS.indigo,
    make: () => new THREE.LatheGeometry(makeParabolaProfile(12, 20), 32),
    params: { r: 12, h: 20 },
    thumb: 'paraboloid',
  },
  star: {
    name: 'Star', category: 'basic', color: COLORS.gold,
    make: () => makeStarGeometry(5, 12, 6),
    params: { outer: 12, inner: 6 },
    thumb: 'star',
  },
  heart: {
    name: 'Heart', category: 'basic', color: COLORS.pink,
    make: () => makeHeartGeometry(12),
    params: { size: 12 },
    thumb: 'heart',
  },
  ring: {
    name: 'Ring', category: 'basic', color: COLORS.gold,
    make: () => new THREE.TorusGeometry(10, 2, 16, 32),
    params: { r: 10, tube: 2 },
    thumb: 'ring',
  },
  text3d: {
    name: '3D Text', category: 'basic', color: COLORS.slate,
    make: () => new THREE.BoxGeometry(20, 4, 2),
    params: { w: 20, h: 4, d: 2 },
    thumb: 'text',
  },

  // ─── DUMMY 13 ARMOUR PIECES ───
  d13_head: {
    name: 'D13 Head', category: 'dummy13', color: COLORS.white,
    make: makeD13Head, params: {}, thumb: 'd13_head',
  },
  d13_shin: {
    name: 'D13 Shin', category: 'dummy13', color: COLORS.silver,
    make: makeD13Shin, params: {}, thumb: 'd13_shin',
  },
  d13_ankle: {
    name: 'D13 Ankle', category: 'dummy13', color: COLORS.slate,
    make: makeD13Ankle, params: {}, thumb: 'd13_ankle',
  },
  d13_knee: {
    name: 'D13 Knee', category: 'dummy13', color: COLORS.gray,
    make: makeD13Knee, params: {}, thumb: 'd13_knee',
  },
  d13_thigh: {
    name: 'D13 Thigh', category: 'dummy13', color: COLORS.silver,
    make: makeD13Thigh, params: {}, thumb: 'd13_thigh',
  },
  d13_foot: {
    name: 'D13 Foot', category: 'dummy13', color: COLORS.black,
    make: makeD13Foot, params: {}, thumb: 'd13_foot',
  },
  d13_torso: {
    name: 'D13 Torso', category: 'dummy13', color: COLORS.red,
    make: makeD13Torso, params: {}, thumb: 'd13_torso',
  },
  d13_shoulder: {
    name: 'D13 Shoulder', category: 'dummy13', color: COLORS.blue,
    make: makeD13Shoulder, params: {}, thumb: 'd13_shoulder',
  },
  d13_upperarm: {
    name: 'D13 Upper Arm', category: 'dummy13', color: COLORS.silver,
    make: makeD13UpperArm, params: {}, thumb: 'd13_upperarm',
  },
  d13_forearm: {
    name: 'D13 Forearm', category: 'dummy13', color: COLORS.silver,
    make: makeD13Forearm, params: {}, thumb: 'd13_forearm',
  },
  d13_hand: {
    name: 'D13 Hand', category: 'dummy13', color: COLORS.white,
    make: makeD13Hand, params: {}, thumb: 'd13_hand',
  },
  d13_pelvis: {
    name: 'D13 Pelvis', category: 'dummy13', color: COLORS.black,
    make: makeD13Pelvis, params: {}, thumb: 'd13_pelvis',
  },
};

// ═══════════════════════════════════════════════════════════════
//  GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════

function makeParabolaProfile(r, h) {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const y = t * h;
    const x = r * Math.sqrt(1 - t);
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

function makeStarGeometry(points, outer, inner) {
  const shape = new THREE.Shape();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false });
}

function makeHeartGeometry(size) {
  const shape = new THREE.Shape();
  const s = size / 12;
  shape.moveTo(0, 3 * s);
  shape.bezierCurveTo(0, 2.5 * s, -5 * s, 0, -5 * s, -2 * s);
  shape.bezierCurveTo(-5 * s, -5 * s, 0, -6 * s, 0, -8 * s);
  shape.bezierCurveTo(0, -6 * s, 5 * s, -5 * s, 5 * s, -2 * s);
  shape.bezierCurveTo(5 * s, 0, 0, 2.5 * s, 0, 3 * s);
  return new THREE.ExtrudeGeometry(shape, { depth: 4 * s, bevelEnabled: true, bevelThickness: 0.5 * s, bevelSize: 0.5 * s });
}

// ═══════════════════════════════════════════════════════════════
//  DUMMY 13 PARAMETRIC PIECES
// ═══════════════════════════════════════════════════════════════

function makeD13Head() {
  // Smooth rounded head — like a simplified anime/mech helmet
  const g = new THREE.SphereGeometry(14, 32, 24);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Flatten bottom slightly for jaw
    let ny = y;
    if (y < -6) ny = -6 - (y + 6) * 0.3;
    // Taper toward chin
    let nx = x, nz = z;
    if (y < 0) {
      const taper = 1 - (Math.abs(y) / 14) * 0.25;
      nx *= taper; nz *= taper;
    }
    pos.setXYZ(i, nx, ny, nz);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Shin() {
  // Long shin bone — elongated cylinder with slight calf bulge
  const g = new THREE.CylinderGeometry(9, 7, 50, 24, 8);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Calf muscle bulge at back (negative Z), middle-lower
    let nz = z;
    if (z < 0 && y > -10 && y < 10) {
      const bulge = Math.cos((y / 20) * Math.PI) * 3;
      nz -= bulge;
    }
    // Slight taper at ankle
    let nx = x;
    if (y < -20) {
      const t = 1 + (y + 20) / 30 * 0.15;
      nx *= t;
    }
    pos.setXYZ(i, nx, y, nz);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Ankle() {
  // Cylindrical ankle joint with ring detail
  const g = new THREE.CylinderGeometry(8, 8, 10, 20);
  return g;
}

function makeD13Knee() {
  // Rounded knee cap — sphere-flattened
  const g = new THREE.SphereGeometry(10, 24, 16);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) pos.setY(i, y * 0.6);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Thigh() {
  // Thigh — thicker cylinder with muscle taper
  const g = new THREE.CylinderGeometry(12, 10, 45, 24, 6);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Thicker at top (hip), taper to knee
    let nx = x, nz = z;
    const t = 1 + (y / 45) * 0.2;
    nx *= t; nz *= t;
    pos.setXYZ(i, nx, y, nz);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Foot() {
  // Foot — boxy with toe area
  const g = new THREE.BoxGeometry(16, 8, 28);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Round toe area
    let nx = x, nz = z;
    if (z > 8) {
      nx *= 0.85;
      if (z > 12) nz = 12 + (z - 12) * 0.3;
    }
    // Heel curve
    if (z < -8) {
      nx *= 0.9;
    }
    pos.setXYZ(i, nx, y, nz);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Torso() {
  // Torso — wider at shoulders, taper to waist
  const g = new THREE.BoxGeometry(30, 40, 18);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let nx = x, nz = z;
    // Taper to waist at center
    const waist = Math.abs(y / 20);
    const factor = 1 - waist * 0.25;
    nx *= factor;
    // Slight chest bulge
    if (z > 0 && y > 0) nz += 2 * (1 - waist);
    pos.setXYZ(i, nx, y, nz);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Shoulder() {
  // Shoulder pauldron — half-sphere dome
  const g = new THREE.SphereGeometry(14, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  return g;
}

function makeD13UpperArm() {
  // Upper arm — cylinder with bicep bulge
  const g = new THREE.CylinderGeometry(9, 8, 35, 20, 4);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Bicep bulge at upper half
    let nx = x, nz = z;
    if (y > 5) {
      const bulge = 1 + Math.cos((y / 35) * Math.PI) * 0.2;
      nx *= bulge;
    }
    pos.setXYZ(i, nx, y, nz);
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Forearm() {
  // Forearm — slimmer, slightly tapering
  return new THREE.CylinderGeometry(7, 6, 30, 20);
}

function makeD13Hand() {
  // Hand — boxy shape with finger hints
  const g = new THREE.BoxGeometry(10, 12, 8);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Taper fingers
    if (y > 4) {
      const t = 1 - (y - 4) / 8 * 0.3;
      pos.setX(i, x * t);
    }
  }
  g.computeVertexNormals();
  return g;
}

function makeD13Pelvis() {
  // Pelvis/hip block
  const g = new THREE.BoxGeometry(26, 15, 16);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 5) pos.setY(i, 5 + (y - 5) * 0.5);
  }
  g.computeVertexNormals();
  return g;
}

// ═══════════════════════════════════════════════════════════════
//  THREE.JS SCENE SETUP
// ═══════════════════════════════════════════════════════════════

function initScene() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth, h = wrap.clientHeight;

  // Scene
  STATE.scene = new THREE.Scene();
  STATE.scene.background = new THREE.Color(0xf0f4f8);

  // Fog for depth
  STATE.scene.fog = new THREE.Fog(0xf0f4f8, 150, 500);

  // Camera
  STATE.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
  STATE.camera.position.set(120, 100, 120);

  // Renderer
  STATE.renderer = new THREE.WebGLRenderer({ antialias: true });
  STATE.renderer.setSize(w, h);
  STATE.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  STATE.renderer.shadowMap.enabled = true;
  STATE.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(STATE.renderer.domElement);

  // Controls
  STATE.controls = new OrbitControls(STATE.camera, STATE.renderer.domElement);
  STATE.controls.enableDamping = true;
  STATE.controls.dampingFactor = 0.08;
  STATE.controls.target.set(0, 0, 0);
  STATE.controls.maxPolarAngle = Math.PI / 2 + 0.1;
  STATE.controls.minDistance = 20;
  STATE.controls.maxDistance = 600;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  STATE.scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(50, 100, 50);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  STATE.scene.add(key);

  const fill = new THREE.DirectionalLight(0xddeeff, 0.4);
  fill.position.set(-50, 60, -50);
  STATE.scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffeedd, 0.3);
  rim.position.set(0, 40, -80);
  STATE.scene.add(rim);

  // Grid
  buildGrid();

  // Ground plane (invisible, for raycasting)
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.name = 'ground';
  STATE.scene.add(plane);

  // Start loop
  animate();

  // Resize handler
  window.addEventListener('resize', onResize);
}

function buildGrid() {
  if (STATE.gridHelper) STATE.scene.remove(STATE.gridHelper);
  STATE.gridHelper = new THREE.GridHelper(STATE.gridSize, STATE.gridDivs, 0xa0c4e8, 0xcddbee);
  STATE.gridHelper.position.y = -0.01;
  STATE.scene.add(STATE.gridHelper);
}

function onResize() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth, h = wrap.clientHeight;
  STATE.camera.aspect = w / h;
  STATE.camera.updateProjectionMatrix();
  STATE.renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  STATE.controls.update();
  STATE.renderer.render(STATE.scene, STATE.camera);
}

// ═══════════════════════════════════════════════════════════════
//  OBJECT CREATION & MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function createObject(shapeKey, position = new THREE.Vector3(0, 10, 0)) {
  const def = SHAPE_REGISTRY[shapeKey];
  if (!def) return null;

  const geo = def.make();
  const mat = new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: 0.4,
    metalness: 0.15,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    id: STATE.nextId++,
    shapeKey: shapeKey,
    shapeName: def.name,
    originalParams: { ...def.params },
    isDummy13: def.category === 'dummy13',
    vertices: [],   // will store editable vertex handles
  };

  STATE.scene.add(mesh);
  STATE.objects.push(mesh);

  // Add subtle drop animation
  mesh.position.y += 30;
  const targetY = position.y + getObjectBaseHeight(mesh) / 2;
  dropAnimation(mesh, targetY);

  pushUndo('create', { mesh });
  selectObject(mesh);
  return mesh;
}

function getObjectBaseHeight(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  return box.max.y - box.min.y;
}

function dropAnimation(mesh, targetY) {
  const start = mesh.position.y;
  const startTime = performance.now();
  const duration = 350;
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    mesh.position.y = start + (targetY - start) * ease;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ═══════════════════════════════════════════════════════════════
//  SELECTION & HIGHLIGHTING
// ═══════════════════════════════════════════════════════════════

const SELECT_BOX = new THREE.Box3Helper(new THREE.Box3(), 0x4fd1c5);
SELECT_BOX.visible = false;
const SELECT_MAT = new THREE.MeshBasicMaterial({
  color: 0x4fd1c5, wireframe: true, transparent: true, opacity: 0.35
});

function selectObject(mesh) {
  deselectAll();
  if (!mesh) return;
  STATE.selected = mesh;

  // Selection wireframe overlay
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  const wfGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const wfMesh = new THREE.Mesh(wfGeo, SELECT_MAT.clone());
  wfMesh.position.copy(box.getCenter(new THREE.Vector3()));
  wfMesh.userData.isSelection = true;
  mesh.add(wfMesh);

  // Transform gizmo (simple arrow helpers)
  addTransformGizmo(mesh);

  // Vertex handles for D13 pieces
  if (mesh.userData.isDummy13 || true) {
    addVertexHandles(mesh);
  }

  updatePropertiesPanel();
}

function deselectAll() {
  if (STATE.selected) {
    // Remove all children that are UI overlays
    const toRemove = [];
    STATE.selected.traverse(c => {
      if (c.userData.isSelection || c.userData.isGizmo || c.userData.isVertex)
        toRemove.push(c);
    });
    toRemove.forEach(c => c.parent.remove(c));
  }
  STATE.selected = null;
  document.getElementById('props-panel').style.display = 'none';
}

function addTransformGizmo(mesh) {
  const s = 20;
  const colors = [0xff4444, 0x44ff44, 0x4444ff]; // X, Y, Z
  const dirs = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];

  dirs.forEach((dir, i) => {
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), s, colors[i], s*0.2, s*0.15);
    arrow.userData.isGizmo = true;
    arrow.userData.axis = ['x','y','z'][i];
    mesh.add(arrow);
  });
}

function addVertexHandles(mesh) {
  const geo = mesh.geometry;
  const posAttr = geo.attributes.position;
  const worldPos = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(mesh);

  // Sample vertices (every Nth to avoid clutter)
  const step = Math.max(1, Math.floor(posAttr.count / 32));

  for (let i = 0; i < posAttr.count; i += step) {
    const vx = posAttr.getX(i), vy = posAttr.getY(i), vz = posAttr.getZ(i);
    worldPos.set(vx, vy, vz).applyMatrix4(mesh.matrixWorld);

    // Convert back to local for the handle
    const localPos = worldPos.clone();
    mesh.worldToLocal(localPos);

    const dotGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(localPos);
    dot.userData.isVertex = true;
    dot.userData.vertexIndex = i;
    mesh.add(dot);

    mesh.userData.vertices.push({ index: i, mesh: dot });
  }
}

// ═══════════════════════════════════════════════════════════════
//  MOUSE / RAYCASTING
// ═══════════════════════════════════════════════════════════════

function getIntersects(e) {
  const wrap = document.getElementById('canvas-wrap');
  const rect = wrap.getBoundingClientRect();
  STATE.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  STATE.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  STATE.raycaster.setFromCamera(STATE.mouse, STATE.camera);

  const all = [...STATE.objects];
  // Also check vertex handles of selected object
  if (STATE.selected) {
    STATE.selected.traverse(c => {
      if (c.userData.isVertex) all.push(c);
    });
  }

  return STATE.raycaster.intersectObjects(all, false);
}

function onMouseDown(e) {
  if (e.button !== 0) return;
  const hits = getIntersects(e);

  // Check vertex handle first
  const vHit = hits.find(h => h.object.userData.isVertex);
  if (vHit) {
    STATE.isVertexDragging = true;
    STATE.draggedVertex = vHit.object;
    STATE.dragStart = STATE.mouse.clone();
    STATE.controls.enabled = false;
    showSnapHint(e.clientX, e.clientY, 'Drag vertex');
    return;
  }

  // Check object
  const objHit = hits.find(h => STATE.objects.includes(h.object));
  if (objHit) {
    selectObject(objHit.object);
    STATE.isDragging = true;
    STATE.dragOffset = objHit.point.clone().sub(objHit.object.position);
    STATE.controls.enabled = false;
  } else {
    deselectAll();
  }
}

function onMouseMove(e) {
  const wrap = document.getElementById('canvas-wrap');
  const rect = wrap.getBoundingClientRect();
  STATE.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  STATE.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  // Vertex drag — the KEY FEATURE
  if (STATE.isVertexDragging && STATE.draggedVertex) {
    const parent = STATE.draggedVertex.parent;
    STATE.raycaster.setFromCamera(STATE.mouse, STATE.camera);
    const ground = STATE.scene.getObjectByName('ground');
    const hit = STATE.raycaster.intersectObject(ground)[0];
    if (hit) {
      const worldTarget = hit.point.clone();
      // Convert to local space
      const localTarget = worldTarget.clone();
      parent.worldToLocal(localTarget);

      // Snap to grid
      const snap = parseFloat(document.getElementById('snap-grid').value);
      localTarget.x = Math.round(localTarget.x / snap) * snap;
      localTarget.y = Math.round(localTarget.y / snap) * snap;
      localTarget.z = Math.round(localTarget.z / snap) * snap;

      // Move the vertex handle
      STATE.draggedVertex.position.copy(localTarget);

      // Deform the actual geometry!
      deformMeshAtVertex(parent, STATE.draggedVertex.userData.vertexIndex, localTarget);

      // Update selection box
      updateSelectionBox(parent);
      updateSnapHint(e.clientX, e.clientY, `Δ ${localTarget.x.toFixed(1)}, ${localTarget.y.toFixed(1)}, ${localTarget.z.toFixed(1)} mm`);
    }
    return;
  }

  // Object drag
  if (STATE.isDragging && STATE.selected) {
    STATE.raycaster.setFromCamera(STATE.mouse, STATE.camera);
    const ground = STATE.scene.getObjectByName('ground');
    const hit = STATE.raycaster.intersectObject(ground)[0];
    if (hit) {
      const snap = parseFloat(document.getElementById('snap-grid').value);
      let nx = hit.point.x - STATE.dragOffset.x;
      let nz = hit.point.z - STATE.dragOffset.z;
      nx = Math.round(nx / snap) * snap;
      nz = Math.round(nz / snap) * snap;
      STATE.selected.position.x = nx;
      STATE.selected.position.z = nz;
      updatePropertiesPanel();
    }
    return;
  }

  // Hover
  const hits = getIntersects(e);
  const objHit = hits.find(h => STATE.objects.includes(h.object));
  if (objHit && objHit.object !== STATE.selected) {
    wrap.style.cursor = 'pointer';
  } else if (hits.find(h => h.object.userData.isVertex)) {
    wrap.style.cursor = 'crosshair';
  } else {
    wrap.style.cursor = '';
  }
}

function onMouseUp(e) {
  if (STATE.isVertexDragging) {
    STATE.isVertexDragging = false;
    STATE.draggedVertex = null;
    STATE.controls.enabled = true;
    hideSnapHint();
    pushUndo('deform', { mesh: STATE.selected });
  }
  if (STATE.isDragging) {
    STATE.isDragging = false;
    STATE.controls.enabled = true;
    pushUndo('move', { mesh: STATE.selected, pos: STATE.selected.position.clone() });
  }
}

// ═══════════════════════════════════════════════════════════════
//  VERTEX DEFORMATION  —  THE KEY FEATURE
// ═══════════════════════════════════════════════════════════════

function deformMeshAtVertex(mesh, vertexIndex, newLocalPos) {
  const geo = mesh.geometry;
  const posAttr = geo.attributes.position;

  // Direct move — shift the vertex
  posAttr.setXYZ(vertexIndex, newLocalPos.x, newLocalPos.y, newLocalPos.z);

  // Affect neighbours for smooth organic deformation (for D13 pieces)
  const origPos = geo.userData.originalPositions;
  if (origPos) {
    const ox = origPos[vertexIndex * 3];
    const oy = origPos[vertexIndex * 3 + 1];
    const oz = origPos[vertexIndex * 3 + 2];
    const dx = newLocalPos.x - ox;
    const dy = newLocalPos.y - oy;
    const dz = newLocalPos.z - oz;

    const radius = 12; // influence radius in mm
    for (let i = 0; i < posAttr.count; i++) {
      if (i === vertexIndex) continue;
      const ix = origPos[i * 3], iy = origPos[i * 3 + 1], iz = origPos[i * 3 + 2];
      const dist = Math.sqrt((ix-ox)**2 + (iy-oy)**2 + (iz-oz)**2);
      if (dist < radius) {
        const falloff = (1 - dist/radius) ** 2;
        posAttr.setXYZ(i, ix + dx*falloff, iy + dy*falloff, iz + dz*falloff);
      }
    }
  }

  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
}

function updateSelectionBox(mesh) {
  const toRemove = [];
  mesh.traverse(c => { if (c.userData.isSelection) toRemove.push(c); });
  toRemove.forEach(c => c.parent.remove(c));

  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  const wfGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const wfMesh = new THREE.Mesh(wfGeo, SELECT_MAT.clone());
  wfMesh.position.copy(box.getCenter(new THREE.Vector3()));
  wfMesh.userData.isSelection = true;
  mesh.add(wfMesh);
}

// ═══════════════════════════════════════════════════════════════
//  UI: PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════

function updatePropertiesPanel() {
  const panel = document.getElementById('props-panel');
  if (!STATE.selected) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  const m = STATE.selected;
  const box = new THREE.Box3().setFromObject(m);
  const size = new THREE.Vector3();
  box.getSize(size);

  document.getElementById('pp-title').textContent = m.userData.shapeName;
  document.getElementById('pp-len').value = size.x.toFixed(1);
  document.getElementById('pp-wid').value = size.z.toFixed(1);
  document.getElementById('pp-hei').value = size.y.toFixed(1);
  document.getElementById('pp-x').value = m.position.x.toFixed(1);
  document.getElementById('pp-y').value = m.position.y.toFixed(1);
  document.getElementById('pp-z').value = m.position.z.toFixed(1);
}

function buildColorPresets() {
  const el = document.getElementById('color-presets');
  el.innerHTML = '';
  Object.entries(COLORS).forEach(([name, hex]) => {
    const dot = document.createElement('div');
    dot.className = 'color-dot';
    dot.style.background = '#' + hex.toString(16).padStart(6, '0');
    dot.title = name;
    dot.addEventListener('click', () => {
      if (STATE.selected) {
        STATE.selected.material.color.setHex(hex);
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      }
    });
    el.appendChild(dot);
  });
}

// ═══════════════════════════════════════════════════════════════
//  UI: SHAPE PALETTE
// ═══════════════════════════════════════════════════════════════

function buildShapePalette(tab = 'basic') {
  const grid = document.getElementById('shape-grid');
  grid.innerHTML = '';

  Object.entries(SHAPE_REGISTRY).forEach(([key, def]) => {
    if (def.category !== tab) return;

    const cell = document.createElement('div');
    cell.className = 'shape-cell';
    cell.draggable = true;
    cell.dataset.shape = key;

    // Generate a tiny canvas thumbnail
    const thumb = document.createElement('canvas');
    thumb.className = 'shape-thumb';
    thumb.width = 48; thumb.height = 48;
    drawShapeThumb(thumb.getContext('2d'), def.thumb, def.color);
    cell.appendChild(thumb);

    const lbl = document.createElement('span');
    lbl.className = 'shape-label';
    lbl.textContent = def.name;
    cell.appendChild(lbl);

    // Drag events
    cell.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('shape', key);
    });
    // Click to add
    cell.addEventListener('click', () => {
      const pos = STATE.selected ? STATE.selected.position.clone().add(new THREE.Vector3(25,0,0)) : new THREE.Vector3(0, 10, 0);
      createObject(key, pos);
    });

    grid.appendChild(cell);
  });
}

function drawShapeThumb(ctx, type, color) {
  const c = '#' + color.toString(16).padStart(6, '0');
  ctx.clearRect(0,0,48,48);
  ctx.fillStyle = c;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;

  const cx=24, cy=24;
  switch(type) {
    case 'box': ctx.fillRect(10,10,28,28); ctx.strokeRect(10,10,28,28); break;
    case 'cylinder': case 'tube': ctx.beginPath(); ctx.ellipse(cx,cy,12,16,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); break;
    case 'sphere': case 'halfsphere': case 'd13_head': case 'd13_knee': case 'd13_shoulder':
      ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2); ctx.fill(); ctx.stroke(); break;
    case 'cone': case 'pyramid': case 'roof':
      ctx.beginPath(); ctx.moveTo(cx,6); ctx.lineTo(38,38); ctx.lineTo(10,38); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'torus': case 'ring':
      ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.lineWidth=4; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill(); break;
    default: ctx.beginPath(); ctx.arc(cx,cy,10,0,Math.PI*2); ctx.fill(); ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════════════
//  UNDO / REDO
// ═══════════════════════════════════════════════════════════════

function pushUndo(action, data) {
  STATE.undoStack.push({ action, data, time: Date.now() });
  if (STATE.undoStack.length > 50) STATE.undoStack.shift();
  STATE.redoStack = [];
}

function undo() {
  const entry = STATE.undoStack.pop();
  if (!entry) return;
  STATE.redoStack.push(entry);

  switch(entry.action) {
    case 'move':
      if (entry.data.mesh) entry.data.mesh.position.copy(entry.data.pos);
      break;
    case 'create':
      if (entry.data.mesh) {
        STATE.scene.remove(entry.data.mesh);
        STATE.objects = STATE.objects.filter(o => o !== entry.data.mesh);
      }
      break;
  }
  selectObject(null);
}

function redo() {
  const entry = STATE.redoStack.pop();
  if (!entry) return;
  STATE.undoStack.push(entry);

  switch(entry.action) {
    case 'create':
      if (entry.data.mesh) {
        STATE.scene.add(entry.data.mesh);
        STATE.objects.push(entry.data.mesh);
        selectObject(entry.data.mesh);
      }
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
//  VIEW CONTROLS
// ═══════════════════════════════════════════════════════════════

function setView(name) {
  const cam = STATE.camera;
  const duration = 400;
  const startPos = cam.position.clone();
  let endPos;
  switch(name) {
    case 'top':    endPos = new THREE.Vector3(0, 180, 0.01); break;
    case 'front':  endPos = new THREE.Vector3(0, 0, 180); break;
    case 'side':   endPos = new THREE.Vector3(180, 0, 0); break;
    case 'iso':    endPos = new THREE.Vector3(120, 120, 120); break;
    case 'home':   endPos = new THREE.Vector3(120, 100, 120); break;
    default: return;
  }

  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    cam.position.lerpVectors(startPos, endPos, ease);
    cam.lookAt(STATE.controls.target);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT STL
// ═══════════════════════════════════════════════════════════════

function exportSTL() {
  let stl = 'solid d13-export\n';
  STATE.objects.forEach(mesh => {
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    for (let i = 0; i < pos.count; i += 3) {
      const p1 = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld);
      const p2 = new THREE.Vector3(pos.getX(i+1), pos.getY(i+1), pos.getZ(i+1)).applyMatrix4(mesh.matrixWorld);
      const p3 = new THREE.Vector3(pos.getX(i+2), pos.getY(i+2), pos.getZ(i+2)).applyMatrix4(mesh.matrixWorld);
      const n = new THREE.Vector3(norm.getX(i), norm.getY(i), norm.getZ(i)).transformDirection(mesh.matrixWorld).normalize();

      stl += `  facet normal ${fmt(n.x)} ${fmt(n.y)} ${fmt(n.z)}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${fmt(p1.x)} ${fmt(p1.y)} ${fmt(p1.z)}\n`;
      stl += `      vertex ${fmt(p2.x)} ${fmt(p2.y)} ${fmt(p2.z)}\n`;
      stl += `      vertex ${fmt(p3.x)} ${fmt(p3.y)} ${fmt(p3.z)}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }
  });
  stl += 'endsolid d13-export\n';

  const blob = new Blob([stl], { type: 'application/sla' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'd13-cad-export.stl';
  a.click();
}
function fmt(v) { return v.toFixed(6); }

// ═══════════════════════════════════════════════════════════════
//  EVENT WIRING
// ═══════════════════════════════════════════════════════════════

function initEvents() {
  const wrap = document.getElementById('canvas-wrap');
  wrap.addEventListener('mousedown', onMouseDown);
  wrap.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Drag & drop from palette to canvas
  wrap.addEventListener('dragover', e => e.preventDefault());
  wrap.addEventListener('drop', e => {
    e.preventDefault();
    const shapeKey = e.dataTransfer.getData('shape');
    if (!shapeKey) return;
    STATE.mouse.x = ((e.clientX - wrap.getBoundingClientRect().left) / wrap.clientWidth) * 2 - 1;
    STATE.mouse.y = -((e.clientY - wrap.getBoundingClientRect().top) / wrap.clientHeight) * 2 + 1;
    STATE.raycaster.setFromCamera(STATE.mouse, STATE.camera);
    const ground = STATE.scene.getObjectByName('ground');
    const hit = STATE.raycaster.intersectObject(ground)[0];
    const pos = hit ? hit.point.clone().add(new THREE.Vector3(0, 10, 0)) : new THREE.Vector3(0, 10, 0);
    createObject(shapeKey, pos);
  });

  // Toolbar
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-select').addEventListener('click', () => setMode('select'));
  document.getElementById('btn-move').addEventListener('click', () => setMode('move'));
  document.getElementById('btn-rotate').addEventListener('click', () => setMode('rotate'));
  document.getElementById('btn-scale').addEventListener('click', () => setMode('scale'));
  document.getElementById('btn-export').addEventListener('click', exportSTL);

  // View cube
  document.querySelectorAll('.vc-face').forEach(el => {
    el.addEventListener('click', () => setView(el.dataset.view));
  });

  // Left tools
  document.getElementById('btn-home').addEventListener('click', () => setView('home'));
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    const c = STATE.camera;
    const dir = c.position.clone().sub(STATE.controls.target).normalize().multiplyScalar(20);
    c.position.sub(dir);
  });
  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    const c = STATE.camera;
    const dir = c.position.clone().sub(STATE.controls.target).normalize().multiplyScalar(20);
    c.position.add(dir);
  });

  // Panel tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector('.panel-title').textContent = btn.dataset.tab === 'basic' ? 'Basic Shapes' : 'Dummy 13 Armour';
      buildShapePalette(btn.dataset.tab);
    });
  });

  // Properties
  document.getElementById('pp-close').addEventListener('click', () => deselectAll());
  document.getElementById('pp-delete').addEventListener('click', () => {
    if (STATE.selected) {
      STATE.scene.remove(STATE.selected);
      STATE.objects = STATE.objects.filter(o => o !== STATE.selected);
      pushUndo('delete', { mesh: STATE.selected });
      deselectAll();
    }
  });
  document.getElementById('pp-duplicate').addEventListener('click', () => {
    if (!STATE.selected) return;
    const s = STATE.selected;
    const def = SHAPE_REGISTRY[s.userData.shapeKey];
    const dup = createObject(s.userData.shapeKey, s.position.clone().add(new THREE.Vector3(25,0,0)));
    if (dup) dup.material.color.copy(s.material.color);
  });

  // Keyboard
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); undo(); }
      if (e.key === 'y') { e.preventDefault(); redo(); }
    }
    if (e.key === 'Delete') {
      if (STATE.selected) document.getElementById('pp-delete').click();
    }
  });
}

function setMode(mode) {
  STATE.mode = mode;
  document.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('active'));
  const map = { select:'btn-select', move:'btn-move', rotate:'btn-rotate', scale:'btn-scale' };
  const id = map[mode];
  if (id) document.getElementById(id).classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
//  SNAP HINT OVERLAY
// ═══════════════════════════════════════════════════════════════

function showSnapHint(x, y, text) {
  const el = document.getElementById('snap-hint');
  el.style.display = 'block';
  el.style.left = (x + 12) + 'px';
  el.style.top = (y - 24) + 'px';
  el.textContent = text;
}
function updateSnapHint(x, y, text) {
  const el = document.getElementById('snap-hint');
  el.style.left = (x + 12) + 'px';
  el.style.top = (y - 24) + 'px';
  el.textContent = text;
}
function hideSnapHint() {
  document.getElementById('snap-hint').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

function init() {
  initScene();
  initEvents();
  buildShapePalette('basic');
  buildColorPresets();

  // Store original positions for deformation reference
  setTimeout(() => {
    STATE.objects.forEach(o => {
      const pos = o.geometry.attributes.position;
      o.geometry.userData.originalPositions = new Float32Array(pos.array);
    });
  }, 500);

  // Hide loading
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 800);

  console.log('D13-CAD loaded. Try dragging a shape or vertex!');
}

init();
