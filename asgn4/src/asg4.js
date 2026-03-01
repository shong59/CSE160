// ============================================================
// Shaders
// ============================================================
var VERTEX_SHADER = `
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;

    varying vec2  v_UV;
    varying vec3  v_Normal;
    varying vec3  v_Position;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform mat4 u_NormalMatrix;

    void main() {
        vec4 worldPos   = u_ModelMatrix * a_Position;
        gl_Position     = u_ProjectionMatrix * u_ViewMatrix * worldPos;
        v_Position      = vec3(worldPos);
        v_UV            = a_UV;
        v_Normal        = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    }
`;

var FRAGMENT_SHADER = `
    precision mediump float;

    varying vec2  v_UV;
    varying vec3  v_Normal;
    varying vec3  v_Position;

    uniform vec4      u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform int       u_whichTexture;

    uniform int  u_LightingOn;
    uniform int  u_NormalViz;
    uniform vec3 u_CameraPos;

    // Point light
    uniform int  u_PointLightOn;
    uniform vec3 u_LightPos;
    uniform vec3 u_LightColor;

    // Spot light
    uniform int   u_SpotLightOn;
    uniform vec3  u_SpotPos;
    uniform vec3  u_SpotDir;
    uniform float u_SpotCutoff;

    void main() {
        // --- Base color ---
        vec4 baseColor;
        if      (u_whichTexture == -2) { baseColor = u_FragColor; }
        else if (u_whichTexture == -1) { baseColor = vec4(v_UV, 1.0, 1.0); }
        else if (u_whichTexture ==  0) { baseColor = texture2D(u_Sampler0, v_UV); }
        else if (u_whichTexture ==  1) { baseColor = texture2D(u_Sampler1, v_UV); }
        else if (u_whichTexture ==  2) { baseColor = texture2D(u_Sampler2, v_UV); }
        else if (u_whichTexture ==  3) { baseColor = texture2D(u_Sampler3, v_UV); }
        else                           { baseColor = vec4(1.0, 0.2, 0.2, 1.0); }

        // --- Normal visualization ---
        if (u_NormalViz == 1) {
            gl_FragColor = vec4((v_Normal + 1.0) * 0.5, 1.0);
            return;
        }

        // --- No lighting ---
        if (u_LightingOn == 0) {
            gl_FragColor = baseColor;
            return;
        }

        vec3 N = normalize(v_Normal);
        vec3 V = normalize(u_CameraPos - v_Position);

        // Ambient
        vec3 totalLight = vec3(0.15);

        // Point light contribution
        if (u_PointLightOn == 1) {
            vec3  L    = normalize(u_LightPos - v_Position);
            float diff = max(dot(N, L), 0.0);
            vec3  R    = reflect(-L, N);
            float spec = pow(max(dot(V, R), 0.0), 32.0);
            totalLight += diff * u_LightColor + 0.5 * spec * u_LightColor;
        }

        // Spot light contribution
        if (u_SpotLightOn == 1) {
            vec3  sL    = normalize(u_SpotPos - v_Position);
            float angle = dot(sL, normalize(-u_SpotDir));
            if (angle > u_SpotCutoff) {
                float t    = (angle - u_SpotCutoff) / (1.0 - u_SpotCutoff);
                float diff = max(dot(N, sL), 0.0);
                vec3  R    = reflect(-sL, N);
                float spec = pow(max(dot(V, R), 0.0), 32.0);
                vec3 spotCol = vec3(1.0, 0.95, 0.7);
                totalLight  += t * (diff * spotCol + 0.4 * spec * spotCol);
            }
        }

        vec3 result = totalLight * baseColor.rgb;
        gl_FragColor = vec4(result, baseColor.a);
    }
`;

// ============================================================
// Globals
// ============================================================
var canvas;
var gl;

// Attributes
var a_Position;
var a_UV;
var a_Normal;

// Uniforms (geometry)
var u_FragColor;
var u_ModelMatrix;
var u_ViewMatrix;
var u_ProjectionMatrix;
var u_NormalMatrix;
var u_whichTexture;
var u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;

// Uniforms (lighting)
var u_LightingOn;
var u_NormalViz;
var u_CameraPos;
var u_PointLightOn;
var u_LightPos;
var u_LightColor;
var u_SpotLightOn;
var u_SpotPos;
var u_SpotDir;
var u_SpotCutoff;

// Camera
var camera;

// Timing
var g_startTime = performance.now() / 1000.0;
var g_seconds   = 0;
var g_frameCount = 0;
var g_lastFPSUpdate = performance.now();

// World map (from asgn3)
var g_map = [];

// Light state
var g_lightAngle    = 0;           // auto-rotation angle (radians)
var g_lightX        = 0;           // slider-controlled X offset
var g_lightY        = 3;           // slider-controlled Y
var g_lightZ        = 0;           // slider-controlled Z offset
var g_lightR        = 1.0;
var g_lightG        = 1.0;
var g_lightB        = 1.0;
var g_lightingOn    = true;
var g_pointLightOn  = true;
var g_spotLightOn   = false;
var g_normalViz     = false;
var g_autoRotate    = true;        // animate light around world

// OBJ model
var g_model;

// ============================================================
// Map (from asgn3)
// ============================================================
function initMap() {
  for (var i = 0; i < 32; i++) {
    g_map.push([]);
    for (var j = 0; j < 32; j++) { g_map[i].push(0); }
  }
  for (var i = 0; i < 32; i++) {
    g_map[0][i] = 4; g_map[31][i] = 4;
    g_map[i][0] = 4; g_map[i][31] = 4;
  }
  for (var i = 3; i <= 7; i++) {
    g_map[3][i] = 3; g_map[7][i] = 3;
    g_map[i][3] = 3; g_map[i][7] = 3;
  }
  g_map[5][3] = 0;
  for (var i = 19; i <= 21; i++)
    for (var j = 4; j <= 6; j++) g_map[i][j] = 4;
  g_map[20][4] = 0;
  for (var i = 10; i <= 25; i++) g_map[i][15] = 2;
  g_map[15][15] = 0; g_map[20][15] = 0;
  for (var i = 5; i <= 12; i++) g_map[i][20] = 3;
  for (var j = 20; j <= 27; j++) g_map[12][j] = 3;
  g_map[15][8] = 4; g_map[15][10] = 4; g_map[15][12] = 4;
  for (var i = 22; i <= 28; i++) { g_map[i][22] = 2; g_map[i][28] = 2; }
  for (var j = 22; j <= 28; j++) { g_map[22][j] = 2; g_map[28][j] = 2; }
  g_map[25][22] = 0;
  g_map[8][10] = 1; g_map[8][11] = 2; g_map[8][12] = 3; g_map[8][13] = 4;
}

// ============================================================
// WebGL setup
// ============================================================
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
    console.log('Failed to initialize shaders'); return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV       = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal   = gl.getAttribLocation(gl.program, 'a_Normal');

  u_FragColor       = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix     = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix      = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix= gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_NormalMatrix    = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_whichTexture    = gl.getUniformLocation(gl.program, 'u_whichTexture');
  u_Sampler0        = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1        = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2        = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3        = gl.getUniformLocation(gl.program, 'u_Sampler3');

  u_LightingOn   = gl.getUniformLocation(gl.program, 'u_LightingOn');
  u_NormalViz    = gl.getUniformLocation(gl.program, 'u_NormalViz');
  u_CameraPos    = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_PointLightOn = gl.getUniformLocation(gl.program, 'u_PointLightOn');
  u_LightPos     = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor   = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_SpotLightOn  = gl.getUniformLocation(gl.program, 'u_SpotLightOn');
  u_SpotPos      = gl.getUniformLocation(gl.program, 'u_SpotPos');
  u_SpotDir      = gl.getUniformLocation(gl.program, 'u_SpotDir');
  u_SpotCutoff   = gl.getUniformLocation(gl.program, 'u_SpotCutoff');

  gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
}

// ============================================================
// Textures
// ============================================================
function initTextures() {
  var srcs = ['textures/sky.jpg', 'textures/grass.jpg', 'textures/dirt.jpg', 'textures/stone.jpg'];
  srcs.forEach(function(src, i) {
    var img = new Image();
    img.onload = function() { sendTextureToGL(img, i); };
    img.src = src;
  });
}

function sendTextureToGL(image, texUnit) {
  var texture = gl.createTexture();
  if (!texture) { console.log('Failed to create texture'); return; }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  var units = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3];
  gl.activeTexture(units[texUnit]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  var samplers = [u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3];
  gl.uniform1i(samplers[texUnit], texUnit);
}

// ============================================================
// Input
// ============================================================
function keydown(ev) {
  switch (ev.key) {
    case 'w': case 'W': camera.moveForward();   break;
    case 's': case 'S': camera.moveBackwards(); break;
    case 'a': case 'A': camera.moveLeft();      break;
    case 'd': case 'D': camera.moveRight();     break;
    case 'q': case 'Q': camera.panLeft();       break;
    case 'e': case 'E': camera.panRight();      break;
  }
}

// ============================================================
// Lighting uniforms
// ============================================================
function sendLightUniforms() {
  // Point light position: auto-rotate + slider offset
  var lx = Math.cos(g_lightAngle) * 4 + g_lightX;
  var ly = g_lightY;
  var lz = Math.sin(g_lightAngle) * 4 + g_lightZ;
  gl.uniform3f(u_LightPos, lx, ly, lz);
  gl.uniform3f(u_LightColor, g_lightR, g_lightG, g_lightB);
  gl.uniform1i(u_LightingOn,   g_lightingOn   ? 1 : 0);
  gl.uniform1i(u_NormalViz,    g_normalViz     ? 1 : 0);
  gl.uniform1i(u_PointLightOn, g_pointLightOn  ? 1 : 0);
  gl.uniform1i(u_SpotLightOn,  g_spotLightOn   ? 1 : 0);

  // Camera position for specular
  var eye = camera.eye.elements;
  gl.uniform3f(u_CameraPos, eye[0], eye[1], eye[2]);

  // Spotlight: fixed above, pointing down and slightly inward
  gl.uniform3f(u_SpotPos, 0, 8, 0);
  gl.uniform3f(u_SpotDir, 0, -1, 0);
  gl.uniform1f(u_SpotCutoff, Math.cos(Math.PI / 8)); // 22.5 deg half-angle

  return { lx: lx, ly: ly, lz: lz };
}

// ============================================================
// Main
// ============================================================
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initTextures();
  initMap();

  camera = new Camera();

  // Load OBJ model
  g_model = new Model();
  g_model.loadOBJ('models/torus.obj');

  // Keyboard
  document.onkeydown = keydown;

  // Mouse look
  canvas.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      camera.panLeft(-ev.movementX * 0.3);
      camera.panVertical(-ev.movementY * 0.3);
    }
  };

  // --- UI wiring ---

  // Buttons
  document.getElementById('btn-lighting').onclick = function() {
    g_lightingOn = !g_lightingOn;
    this.textContent = 'Lighting: ' + (g_lightingOn ? 'ON' : 'OFF');
  };
  document.getElementById('btn-normal').onclick = function() {
    g_normalViz = !g_normalViz;
    this.textContent = 'Normals: ' + (g_normalViz ? 'ON' : 'OFF');
  };
  document.getElementById('btn-point').onclick = function() {
    g_pointLightOn = !g_pointLightOn;
    this.textContent = 'Point Light: ' + (g_pointLightOn ? 'ON' : 'OFF');
  };
  document.getElementById('btn-spot').onclick = function() {
    g_spotLightOn = !g_spotLightOn;
    this.textContent = 'Spot Light: ' + (g_spotLightOn ? 'ON' : 'OFF');
  };
  document.getElementById('btn-rotate').onclick = function() {
    g_autoRotate = !g_autoRotate;
    this.textContent = 'Auto-Rotate: ' + (g_autoRotate ? 'ON' : 'OFF');
  };

  // Light position sliders
  document.getElementById('sl-lx').oninput = function() {
    g_lightX = parseFloat(this.value);
    document.getElementById('lbl-lx').textContent = g_lightX.toFixed(1);
  };
  document.getElementById('sl-ly').oninput = function() {
    g_lightY = parseFloat(this.value);
    document.getElementById('lbl-ly').textContent = g_lightY.toFixed(1);
  };
  document.getElementById('sl-lz').oninput = function() {
    g_lightZ = parseFloat(this.value);
    document.getElementById('lbl-lz').textContent = g_lightZ.toFixed(1);
  };

  // Light color sliders
  document.getElementById('sl-lr').oninput = function() {
    g_lightR = parseInt(this.value) / 255;
    document.getElementById('lbl-lr').textContent = this.value;
    updateLightColorSwatch();
  };
  document.getElementById('sl-lg').oninput = function() {
    g_lightG = parseInt(this.value) / 255;
    document.getElementById('lbl-lg').textContent = this.value;
    updateLightColorSwatch();
  };
  document.getElementById('sl-lb').oninput = function() {
    g_lightB = parseInt(this.value) / 255;
    document.getElementById('lbl-lb').textContent = this.value;
    updateLightColorSwatch();
  };

  requestAnimationFrame(tick);
}

function updateLightColorSwatch() {
  var r = Math.round(g_lightR * 255);
  var g = Math.round(g_lightG * 255);
  var b = Math.round(g_lightB * 255);
  document.getElementById('light-swatch').style.background =
    'rgb(' + r + ',' + g + ',' + b + ')';
}

// ============================================================
// Animation loop
// ============================================================
function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  // Animate light
  if (g_autoRotate) g_lightAngle += 0.01;

  updateFPS();
  renderScene();
  requestAnimationFrame(tick);
}

function updateFPS() {
  g_frameCount++;
  var now = performance.now();
  if (now - g_lastFPSUpdate >= 1000) {
    document.getElementById('fps').textContent = g_frameCount;
    g_frameCount = 0;
    g_lastFPSUpdate = now;
  }
}

// ============================================================
// Rendering
// ============================================================
function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix,       false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  var light = sendLightUniforms();

  // --- Sky ---
  var sky = new Cube();
  sky.textureNum = 0;
  sky.matrix.scale(-50, -50, -50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.renderFast();

  // --- Ground ---
  var ground = new Cube();
  ground.color = [0.3, 0.6, 0.2, 1.0];
  ground.textureNum = 1;
  ground.matrix.translate(0, -0.01, 0);
  ground.matrix.scale(32, 0.01, 32);
  ground.matrix.translate(-0.5, 0, -0.5);
  ground.renderFast();

  // --- Map blocks ---
  drawMap();

  // --- Animal ---
  drawAnimal();

  // --- Spheres ---
  drawSpheres();

  // --- OBJ Model (torus) ---
  if (g_model) {
    g_model.color = [0.7, 0.3, 0.9, 1.0];
    g_model.textureNum = -2;
    g_model.matrix = new Matrix4();
    g_model.matrix.translate(3, 1.5, -3);
    g_model.matrix.rotate(g_seconds * 30, 0, 1, 0);
    g_model.matrix.scale(0.8, 0.8, 0.8);
    g_model.render();
  }

  // --- Light marker (small cube at light location) ---
  var marker = new Cube();
  marker.color = [g_lightR, g_lightG, g_lightB, 1.0];
  marker.textureNum = -2;
  marker.matrix.translate(light.lx - 0.1, light.ly - 0.1, light.lz - 0.1);
  marker.matrix.scale(0.2, 0.2, 0.2);
  // Render marker without lighting (always bright)
  gl.uniform1i(u_LightingOn, 0);
  marker.renderFast();
  gl.uniform1i(u_LightingOn, g_lightingOn ? 1 : 0);

  // --- Spot light marker ---
  if (g_spotLightOn) {
    var sMarker = new Cube();
    sMarker.color = [1.0, 0.95, 0.5, 1.0];
    sMarker.textureNum = -2;
    sMarker.matrix.translate(-0.1, 7.9, -0.1);
    sMarker.matrix.scale(0.2, 0.2, 0.2);
    gl.uniform1i(u_LightingOn, 0);
    sMarker.renderFast();
    gl.uniform1i(u_LightingOn, g_lightingOn ? 1 : 0);
  }
}

function drawMap() {
  for (var x = 0; x < 32; x++) {
    for (var z = 0; z < 32; z++) {
      var h = g_map[x][z];
      if (h === 0) continue;
      for (var y = 0; y < h; y++) {
        var wall = new Cube();
        wall.textureNum = (y === h - 1 && h < 4) ? 2 : 3;
        wall.matrix.translate(x - 16, y, z - 16);
        wall.renderFast();
      }
    }
  }
}

function drawAnimal() {
  var body = new Cube();
  body.color = [0.6, 0.4, 0.2, 1.0];
  body.textureNum = -2;
  body.matrix.translate(-1.5, 0, -3);
  body.matrix.scale(1.0, 0.6, 1.6);
  body.renderFast();

  var head = new Cube();
  head.color = [0.65, 0.45, 0.25, 1.0];
  head.textureNum = -2;
  head.matrix.translate(-1.3, 0.2, -1.5);
  head.matrix.scale(0.6, 0.6, 0.6);
  head.renderFast();

  var legColor = [0.5, 0.3, 0.15, 1.0];
  var legPositions = [
    [-1.4, 0, -2.8], [-0.8, 0, -2.8],
    [-1.4, 0, -1.6], [-0.8, 0, -1.6]
  ];
  for (var i = 0; i < 4; i++) {
    var leg = new Cube();
    leg.color = legColor;
    leg.textureNum = -2;
    leg.matrix.translate(legPositions[i][0], legPositions[i][1], legPositions[i][2]);
    leg.matrix.scale(0.2, 0.4, 0.2);
    leg.matrix.translate(0, -1, 0);
    leg.renderFast();
  }
}

function drawSpheres() {
  // White sphere
  var s1 = new Sphere();
  s1.color = [1.0, 1.0, 1.0, 1.0];
  s1.textureNum = -2;
  s1.matrix.translate(-2, 1, -2);
  s1.render();

  // Red sphere
  var s2 = new Sphere();
  s2.color = [0.9, 0.2, 0.2, 1.0];
  s2.textureNum = -2;
  s2.matrix.translate(2, 1, -2);
  s2.render();
}
