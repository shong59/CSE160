var VERTEX_SHADER = `
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }
`;

var FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform int u_whichTexture;
    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        } else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        } else if (u_whichTexture == 3) {
            gl_FragColor = texture2D(u_Sampler3, v_UV);
        } else {
            gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
        }
    }
`;

var canvas;
var gl;
var a_Position;
var a_UV;
var u_FragColor;
var u_ModelMatrix;
var u_ViewMatrix;
var u_ProjectionMatrix;
var u_Sampler0;
var u_Sampler1;
var u_Sampler2;
var u_Sampler3;
var u_whichTexture;

var camera;

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;
var g_frameCount = 0;
var g_lastFPSUpdate = performance.now();

var g_map = [];

function initMap() {
  for (var i = 0; i < 32; i++) {
    g_map.push([]);
    for (var j = 0; j < 32; j++) {
      g_map[i].push(0);
    }
  }

  for (var i = 0; i < 32; i++) {
    g_map[0][i] = 4;
    g_map[31][i] = 4;
    g_map[i][0] = 4;
    g_map[i][31] = 4;
  }

  for (var i = 3; i <= 7; i++) {
    g_map[3][i] = 3;
    g_map[7][i] = 3;
    g_map[i][3] = 3;
    g_map[i][7] = 3;
  }
  g_map[5][3] = 0;

  for (var i = 19; i <= 21; i++) {
    for (var j = 4; j <= 6; j++) {
      g_map[i][j] = 4;
    }
  }
  g_map[20][4] = 0;

  for (var i = 10; i <= 25; i++) {
    g_map[i][15] = 2;
  }
  g_map[15][15] = 0;
  g_map[20][15] = 0;

  for (var i = 5; i <= 12; i++) {
    g_map[i][20] = 3;
  }
  for (var j = 20; j <= 27; j++) {
    g_map[12][j] = 3;
  }

  g_map[15][8] = 4;
  g_map[15][10] = 4;
  g_map[15][12] = 4;

  for (var i = 22; i <= 28; i++) {
    g_map[i][22] = 2;
    g_map[i][28] = 2;
  }
  for (var j = 22; j <= 28; j++) {
    g_map[22][j] = 2;
    g_map[28][j] = 2;
  }
  g_map[25][22] = 0;

  g_map[8][10] = 1;
  g_map[8][11] = 2;
  g_map[8][12] = 3;
  g_map[8][13] = 4;
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
    console.log('Failed to initialize shaders');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
  var image0 = new Image();
  image0.onload = function() { sendTextureToGL(image0, 0); };
  image0.src = 'textures/sky.jpg';

  var image1 = new Image();
  image1.onload = function() { sendTextureToGL(image1, 1); };
  image1.src = 'textures/grass.jpg';

  var image2 = new Image();
  image2.onload = function() { sendTextureToGL(image2, 2); };
  image2.src = 'textures/dirt.jpg';

  var image3 = new Image();
  image3.onload = function() { sendTextureToGL(image3, 3); };
  image3.src = 'textures/stone.jpg';
}

function sendTextureToGL(image, texUnit) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  switch (texUnit) {
    case 0: gl.activeTexture(gl.TEXTURE0); break;
    case 1: gl.activeTexture(gl.TEXTURE1); break;
    case 2: gl.activeTexture(gl.TEXTURE2); break;
    case 3: gl.activeTexture(gl.TEXTURE3); break;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  switch (texUnit) {
    case 0: gl.uniform1i(u_Sampler0, 0); break;
    case 1: gl.uniform1i(u_Sampler1, 1); break;
    case 2: gl.uniform1i(u_Sampler2, 2); break;
    case 3: gl.uniform1i(u_Sampler3, 3); break;
  }

  console.log('Loaded texture ' + texUnit);
}

function keydown(ev) {
  switch (ev.key) {
    case 'w': camera.moveForward();   break;
    case 's': camera.moveBackwards(); break;
    case 'a': camera.moveLeft();      break;
    case 'd': camera.moveRight();     break;
    case 'q': camera.panLeft();       break;
    case 'e': camera.panRight();      break;
    case 'f': addBlock();             break;
    case 'r': deleteBlock();          break;
  }
  renderScene();
}

function getBlockInFront() {
  var f = new Vector3(camera.at.elements);
  f.sub(camera.eye);
  f.normalize();
  f.mul(3);
  var worldX = camera.eye.elements[0] + f.elements[0];
  var worldZ = camera.eye.elements[2] + f.elements[2];
  var mx = Math.floor(worldX + 16);
  var mz = Math.floor(worldZ + 16);
  return { x: mx, z: mz };
}

function addBlock() {
  var pos = getBlockInFront();
  if (pos.x >= 0 && pos.x < 32 && pos.z >= 0 && pos.z < 32 && g_map[pos.x][pos.z] < 4) {
    g_map[pos.x][pos.z]++;
  }
}

function deleteBlock() {
  var pos = getBlockInFront();
  if (pos.x >= 0 && pos.x < 32 && pos.z >= 0 && pos.z < 32 && g_map[pos.x][pos.z] > 0) {
    g_map[pos.x][pos.z]--;
  }
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initTextures();
  initMap();

  camera = new Camera();

  document.onkeydown = keydown;

  canvas.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      camera.panLeft(-ev.movementX * 0.3);
      camera.panVertical(-ev.movementY * 0.3);
      renderScene();
    }
  };

  requestAnimationFrame(tick);
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateFPS();
  renderScene();
  requestAnimationFrame(tick);
}

function updateFPS() {
  g_frameCount++;
  var currentTime = performance.now();
  if (currentTime - g_lastFPSUpdate >= 1000) {
    document.getElementById('fps').textContent = g_frameCount;
    g_frameCount = 0;
    g_lastFPSUpdate = currentTime;
  }
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  var sky = new Cube();
  sky.color = [0.5, 0.7, 1.0, 1.0];
  sky.textureNum = 0;
  sky.matrix.scale(-50, -50, -50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.renderFast();

  var ground = new Cube();
  ground.color = [0.3, 0.6, 0.2, 1.0];
  ground.textureNum = 1;
  ground.matrix.translate(0, -0.01, 0);
  ground.matrix.scale(32, 0, 32);
  ground.matrix.translate(-0.5, 0, -0.5);
  ground.renderFast();

  drawMap();
  drawAnimal();
}

function drawMap() {
  for (var x = 0; x < 32; x++) {
    for (var z = 0; z < 32; z++) {
      var h = g_map[x][z];
      if (h === 0) continue;
      for (var y = 0; y < h; y++) {
        var wall = new Cube();
        if (y === h - 1 && h < 4) {
          wall.textureNum = 2;
        } else {
          wall.textureNum = 3;
        }
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
    [-1.4, 0, -2.8],
    [-0.8, 0, -2.8],
    [-1.4, 0, -1.6],
    [-0.8, 0, -1.6]
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
