import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 60, 200);

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 18, 50);
camera.lookAt(0, 0, 0);

let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

// lights
let hemi = new THREE.HemisphereLight(0x87ceeb, 0x4a7c59, 1.0);
scene.add(hemi);

let sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
sun.position.set(40, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 300;
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
scene.add(sun);

let lamp = new THREE.PointLight(0xff9944, 80, 30);
lamp.position.set(-12, 6, 5);
lamp.castShadow = true;
scene.add(lamp);

let spot = new THREE.SpotLight(0x4488ff, 120, 60, Math.PI / 6, 0.3);
spot.position.set(20, 20, 0);
spot.castShadow = true;
scene.add(spot);
scene.add(spot.target);

let sunGlow = new THREE.PointLight(0xffdd44, 200, 250);
scene.add(sunGlow);

// textures
let loader = new THREE.TextureLoader();
let crateTex = loader.load('https://threejs.org/examples/textures/crate.gif');
let grassTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(20, 20);

// skybox
let skyTex = new THREE.CubeTextureLoader().load([
  'https://threejs.org/examples/textures/cube/Bridge2/posx.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/negx.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/posy.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/negy.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/posz.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/negz.jpg'
]);
scene.background = skyTex;

// ground
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ map: grassTex })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// buildings
let heights = [8, 12, 6, 10, 14, 7];
let positions = [[-20,-10], [-10,-15], [10,-12], [20,-8], [-15,10], [15,8]];
let woodMat = new THREE.MeshLambertMaterial({ map: crateTex });

for (let i = 0; i < heights.length; i++) {
  let h = heights[i];
  let b = new THREE.Mesh(new THREE.BoxGeometry(4, h, 4), woodMat);
  b.position.set(positions[i][0], h/2, positions[i][1]);
  b.castShadow = true;
  b.receiveShadow = true;
  scene.add(b);
}

// trees
let bark = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
let foliage = new THREE.MeshLambertMaterial({ color: 0x228B22 });
let trees = [[-6, 6], [6, 6], [-6, -6], [6, -6], [0, 14]];

for (let t of trees) {
  let trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), bark);
  trunk.position.set(t[0], 1.5, t[1]);
  trunk.castShadow = true;
  scene.add(trunk);

  let top = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), foliage);
  top.position.set(t[0], 4, t[1]);
  top.castShadow = true;
  scene.add(top);
}

// lamp glow indicator
let lampBulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xff9944, emissive: 0xff9944, emissiveIntensity: 1.5 })
);
lampBulb.position.copy(lamp.position);
scene.add(lampBulb);

// bouncing sphere with rings
let bounceSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0xff4466, shininess: 80 })
);
bounceSphere.position.set(0, 4, 0);
bounceSphere.castShadow = true;
scene.add(bounceSphere);

let innerRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.2, 0.18, 16, 64),
  new THREE.MeshPhongMaterial({ color: 0x44ddff, shininess: 100 })
);
innerRing.position.set(0, 4, 0);
scene.add(innerRing);

let outerRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.8, 0.14, 16, 64),
  new THREE.MeshPhongMaterial({ color: 0xffdd44, shininess: 100 })
);
outerRing.position.set(0, 4, 0);
scene.add(outerRing);

// other shapes
let icosa = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1, 0),
  new THREE.MeshPhongMaterial({ color: 0x88ff44, flatShading: true })
);
icosa.position.set(-5, 3, 0);
icosa.castShadow = true;
scene.add(icosa);

let dodeca = new THREE.Mesh(
  new THREE.DodecahedronGeometry(0.9, 0),
  new THREE.MeshPhongMaterial({ color: 0xff44cc, flatShading: true })
);
dodeca.position.set(5, 3, 0);
dodeca.castShadow = true;
scene.add(dodeca);

let orangeCone = new THREE.Mesh(
  new THREE.ConeGeometry(1, 3, 16),
  new THREE.MeshPhongMaterial({ color: 0xffaa22 })
);
orangeCone.position.set(-8, 1.5, 0);
orangeCone.castShadow = true;
scene.add(orangeCone);

let blueCone = new THREE.Mesh(
  new THREE.ConeGeometry(0.7, 2, 16),
  new THREE.MeshPhongMaterial({ color: 0x22aaff })
);
blueCone.position.set(8, 1, 0);
blueCone.castShadow = true;
scene.add(blueCone);

// sun sphere (for day/night wow feature)
let sunBall = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xffee44, emissive: 0xffdd00, emissiveIntensity: 1.5 })
);
scene.add(sunBall);

// comet shower system
// all comets fall in the same direction (diagonal from upper-left to lower-right)
// spawn position is offset so the rightmost landing = rightmost spawn
let cometMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 2 });
let trailMat = new THREE.PointsMaterial({
  color: 0xff8833, size: 1.5,
  transparent: true, opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
});
let comets = [];
let maxComets = 6;
let trailLen = 40;
let nextSpawnTime = 1;

// fixed fall direction: offset from spawn to landing
// all comets travel this same vector downward
let fallOffset = new THREE.Vector3(15, -55, 10);

// shared flash for impacts
let flash = new THREE.PointLight(0xffffff, 0, 60);
scene.add(flash);
let flashFade = 0;

function spawnComet() {
  let head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), cometMat);
  scene.add(head);

  let light = new THREE.PointLight(0xff6600, 100, 35);
  scene.add(light);

  let positions = new Float32Array(trailLen * 3);
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  let trail = new THREE.Points(geo, trailMat);
  scene.add(trail);

  // random landing point spread across the ground
  let landX = (Math.random() - 0.5) * 100;
  let landZ = (Math.random() - 0.5) * 100;
  let end = new THREE.Vector3(landX, 0, landZ);

  // spawn point is landing minus the fall offset (so they all come from same direction)
  let start = end.clone().sub(fallOffset);

  // fill trail with start pos
  for (let i = 0; i < trailLen; i++) {
    positions[i * 3] = start.x;
    positions[i * 3 + 1] = start.y;
    positions[i * 3 + 2] = start.z;
  }

  comets.push({
    head, light, trail, geo, positions,
    start, end,
    timer: 0,
    duration: 1.5 + Math.random() * 0.5
  });
}

function updateComets(dt, currentTime) {
  // spawn a new comet roughly every second
  if (currentTime > nextSpawnTime && comets.length < maxComets) {
    spawnComet();
    nextSpawnTime = currentTime + 0.8 + Math.random() * 0.4;
  }

  for (let i = comets.length - 1; i >= 0; i--) {
    let c = comets[i];
    c.timer += dt;
    let p = c.timer / c.duration;

    if (p >= 1) {
      // impact flash
      flash.position.copy(c.end);
      flash.intensity = 400;
      flashFade = 0.3;

      // cleanup
      scene.remove(c.head);
      scene.remove(c.light);
      scene.remove(c.trail);
      c.geo.dispose();
      comets.splice(i, 1);
    } else {
      // straight line from start to end (same angle for all comets)
      let pos = new THREE.Vector3().lerpVectors(c.start, c.end, p);

      c.head.position.copy(pos);
      c.light.position.copy(pos);
      c.light.intensity = 100;

      // shift trail forward
      for (let j = trailLen - 1; j > 0; j--) {
        c.positions[j * 3]     = c.positions[(j - 1) * 3];
        c.positions[j * 3 + 1] = c.positions[(j - 1) * 3 + 1];
        c.positions[j * 3 + 2] = c.positions[(j - 1) * 3 + 2];
      }
      c.positions[0] = pos.x;
      c.positions[1] = pos.y;
      c.positions[2] = pos.z;
      c.geo.attributes.position.needsUpdate = true;
    }
  }

  // fade flash
  if (flashFade > 0) {
    flashFade -= dt;
    flash.intensity = Math.max(0, flashFade / 0.3) * 400;
  }
}

// duck model
new GLTFLoader().load('models/Duck.glb', function(gltf) {
  let duck = gltf.scene;
  duck.scale.setScalar(2.5);
  duck.position.set(5, 0, -8);
  duck.traverse(function(child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(duck);
}, undefined, function(err) {
  console.error('Failed to load duck model:', err);
});

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let clock = new THREE.Clock();
let totalTime = 0;

function animate() {
  requestAnimationFrame(animate);
  let dt = clock.getDelta();
  totalTime += dt;
  let t = totalTime;

  // bounce the sphere + rings follow it
  bounceSphere.position.y = 4 + Math.sin(t * 2.5) * 1.5;
  innerRing.position.y = bounceSphere.position.y;
  outerRing.position.y = bounceSphere.position.y;
  innerRing.rotation.y = t * 1.2;
  outerRing.rotation.x = t * -1.0;

  icosa.rotation.y = t * 1.5;
  dodeca.rotation.y = -t * 1.1;
  orangeCone.rotation.y = t * 0.8;
  blueCone.rotation.y = t * 1.3;

  // day/night: sun orbits and lighting follows
  let angle = t * 0.15;
  let sx = Math.cos(angle) * 70;
  let sy = Math.sin(angle) * 55;
  sunBall.position.set(sx, sy, -10);
  sunGlow.position.copy(sunBall.position);
  sun.position.set(sx * 0.5, Math.max(sy, 5), -5);

  let day = Math.max(0, Math.sin(angle));
  sun.intensity = 0.5 + day * 1.5;
  hemi.intensity = 0.6 + day * 0.4;
  sunGlow.intensity = 80 + day * 120;

  // update all active comets
  updateComets(dt, t);

  orbitControls.update();
  renderer.render(scene, camera);
}

animate();
