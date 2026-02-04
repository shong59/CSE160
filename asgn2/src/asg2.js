var VERTEX_SHADER = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }
`;

var FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }
`;

var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_ModelMatrix;
var u_GlobalRotateMatrix;

var g_globalAngle = 0;
var g_globalAngleX = 0;
var g_globalAngleY = 0;

var g_animationOn = false;
var g_pokeAnimation = false;
var g_pokeTimer = 0;

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

var g_legAngle1 = 0;
var g_kneeAngle1 = 0;
var g_hoofAngle1 = 0;

var g_legAngle2 = 0;
var g_kneeAngle2 = 0;
var g_hoofAngle2 = 0;

var g_legAngle3 = 0;
var g_kneeAngle3 = 0;
var g_hoofAngle3 = 0;

var g_legAngle4 = 0;
var g_kneeAngle4 = 0;
var g_hoofAngle4 = 0;

var g_tailAngle = 0;

var g_frameCount = 0;
var g_lastFPSUpdate = performance.now();

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get WebGL context');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
        console.log('Failed to initialize shaders');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get a_Position');
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get u_GlobalRotateMatrix');
        return;
    }
}

function addActionsForHtmlUI() {
    document.getElementById('angleSlider').addEventListener('input', function() {
        g_globalAngle = parseFloat(this.value);
        document.getElementById('angleValue').textContent = Math.floor(g_globalAngle);
        renderScene();
    });

    document.getElementById('leg1Slider').addEventListener('input', function() {
        g_legAngle1 = parseFloat(this.value);
        document.getElementById('leg1Value').textContent = Math.floor(g_legAngle1);
        if (!g_animationOn) renderScene();
    });

    document.getElementById('knee1Slider').addEventListener('input', function() {
        g_kneeAngle1 = parseFloat(this.value);
        document.getElementById('knee1Value').textContent = Math.floor(g_kneeAngle1);
        if (!g_animationOn) renderScene();
    });

    document.getElementById('leg2Slider').addEventListener('input', function() {
        g_legAngle2 = parseFloat(this.value);
        document.getElementById('leg2Value').textContent = Math.floor(g_legAngle2);
        if (!g_animationOn) renderScene();
    });

    document.getElementById('knee2Slider').addEventListener('input', function() {
        g_kneeAngle2 = parseFloat(this.value);
        document.getElementById('knee2Value').textContent = Math.floor(g_kneeAngle2);
        if (!g_animationOn) renderScene();
    });

    document.getElementById('animationOnButton').onclick = function() {
        g_animationOn = true;
    };
    
    document.getElementById('animationOffButton').onclick = function() {
        g_animationOn = false;
    };

    canvas.onmousedown = function(ev) {
        if (ev.shiftKey) {
            g_pokeAnimation = true;
            g_pokeTimer = g_seconds;
        }
    };

    canvas.onmousemove = function(ev) {
        if (ev.buttons == 1) {
            var rect = ev.target.getBoundingClientRect();
            var x = ((ev.clientX - rect.left) / canvas.width) * 360;
            var y = ((ev.clientY - rect.top) / canvas.height) * 360;
    
    g_tailAngle = 15 * Math.sin(g_seconds * 3);
    
    if (g_pokeAnimation && g_seconds - g_pokeTimer < 2.0) {
        var t = g_seconds - g_pokeTimer;
        g_legAngle1 = -30 + 10 * Math.sin(t * 10);
        g_legAngle2 = -30 + 10 * Math.sin(t * 10);
        g_legAngle3 = -30 + 10 * Math.sin(t * 10);
        g_legAngle4 = -30 + 10 * Math.sin(t * 10);
        g_tailAngle = 45 * Math.sin(t * 8);
    } else {
        g_pokeAnimation = false;
    }
            g_globalAngleX = y - 180;
            g_globalAngleY = x - 180;
            renderScene();
        }
    };
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    renderScene();
    
    requestAnimationFrame(tick);
}

function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    
    updateFPS();
    
    if (g_animationOn) {
        updateAnimationAngles();
    }
    
    renderScene();
    
    requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    g_legAngle1 = 30 * Math.sin(g_seconds * 2);
    g_kneeAngle1 = -15 * Math.sin(g_seconds * 2 + 0.5);
    
    g_legAngle2 = 30 * Math.sin(g_seconds * 2 + Math.PI);
    g_kneeAngle2 = -15 * Math.sin(g_seconds * 2 + Math.PI + 0.5);
    
    g_legAngle3 = 30 * Math.sin(g_seconds * 2);
    g_kneeAngle3 = -15 * Math.sin(g_seconds * 2 + 0.5);
    
    g_legAngle4 = 30 * Math.sin(g_seconds * 2 + Math.PI);
    g_kneeAngle4 = -15 * Math.sin(g_seconds * 2 + Math.PI + 0.5);
    
    g_tailAngle = 15 * Math.sin(g_seconds * 3);
    
    if (g_pokeAnimation && (g_seconds - g_pokeTimer) < 2.0) {
        var t = g_seconds - g_pokeTimer;
        g_legAngle1 = -30 + 10 * Math.sin(t * 10);
        g_legAngle2 = -30 + 10 * Math.sin(t * 10);
        g_legAngle3 = -30 + 10 * Math.sin(t * 10);
        g_legAngle4 = -30 + 10 * Math.sin(t * 10);
        g_tailAngle = 45 * Math.sin(t * 8);
    } else {
        g_pokeAnimation = false;
    }
}

function updateFPS() {
    g_frameCount++;
    var currentTime = performance.now();
    if (currentTime - g_lastFPSUpdate >= 1000) {
        var fps = g_frameCount;
        document.getElementById('fps').textContent = fps;
        g_frameCount = 0;
        g_lastFPSUpdate = currentTime;
    }
}

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngle + g_globalAngleY, 0, 1, 0);
    globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    var body = new Matrix4();
    body.setTranslate(0, 0, 0);
    body.scale(0.5, 0.3, 0.8);
    drawCube(body, [0.6, 0.4, 0.2, 1.0]);
    
    var head = new Matrix4();
    head.setTranslate(0, 0.1, 0.5);
    head.scale(0.35, 0.35, 0.35);
    drawCube(head, [0.6, 0.4, 0.2, 1.0]);
    
    var hornLeft = new Matrix4();
    hornLeft.setTranslate(-0.1, 0.3, 0.6);
    hornLeft.scale(0.08, 0.2, 0.08);
    drawCube(hornLeft, [0.9, 0.9, 0.9, 1.0]);
    
    var hornRight = new Matrix4();
    hornRight.setTranslate(0.1, 0.3, 0.6);
    hornRight.scale(0.08, 0.2, 0.08);
    drawCube(hornRight, [0.9, 0.9, 0.9, 1.0]);
    
    var tail = new Matrix4();
    tail.setTranslate(0, 0.05, -0.5);
    tail.rotate(g_tailAngle, 0, 1, 0);
    drawCylinderLeft = new Matrix4();
    hornLeft.setTranslate(-0.1, 0.3, 0.6);
    hornLeft.scale(0.08, 0.2, 0.08);
    drawCube(hornLeft, [0.9, 0.9, 0.9, 1.0]);
    
    var hornRight = new Matrix4();
    hornRight.setTranslate(0.1, 0.3, 0.6);
    hornRight.scale(0.08, 0.2, 0.08);
    drawCube(hornRight, [0.9, 0.9, 0.9, 1.0]);
    
    var tail = new Matrix4();
    tail.setTranslate(0, 0.05, -0.5);
    tail.scale(0.08, 0.08, 0.3);
    drawCube(tail, [0.5, 0.3, 0.1, 1.0]);
    
    var upperLeg1 = new Matrix4();
    upperLeg1.setTranslate(0.2, -0.15, 0.3);
    upperLeg1.rotate(g_legAngle1, 1, 0, 0);
    upperLeg1.scale(0.12, 0.2, 0.12);
    drawCube(upperLeg1, [0.5, 0.3, 0.1, 1.0]);
    
    var lowerLeg1 = new Matrix4();
    lowerLeg1.setTranslate(0.2, -0.15, 0.3);
    lowerLeg1.rotate(g_legAngle1, 1, 0, 0);
    lowerLeg1.translate(0, -0.2, 0);
    lowerLeg1.rotate(g_kneeAngle1, 1, 0, 0);
    lowerLeg1.scale(0.11, 0.2, 0.11);
    drawCube(lowerLeg1, [0.4, 0.25, 0.1, 1.0]);
    
    var hoof1 = new Matrix4();
    hoof1.setTranslate(0.2, -0.15, 0.3);
    hoof1.rotate(g_legAngle1, 1, 0, 0);
    hoof1.translate(0, -0.2, 0);
    hoof1.rotate(g_kneeAngle1, 1, 0, 0);
    hoof1.translate(0, -0.15, 0);
    hoof1.rotate(g_hoofAngle1, 1, 0, 0);
    hoof1.scale(0.13, 0.1, 0.13);
    drawCube(hoof1, [0.3, 0.2, 0.1, 1.0]);
    
    var upperLeg2 = new Matrix4();
    upperLeg2.setTranslate(-0.2, -0.15, 0.3);
    upperLeg2.rotate(g_legAngle2, 1, 0, 0);
    upperLeg2.scale(0.12, 0.2, 0.12);
    drawCube(upperLeg2, [0.5, 0.3, 0.1, 1.0]);
    
    var lowerLeg2 = new Matrix4();
    lowerLeg2.setTranslate(-0.2, -0.15, 0.3);
    lowerLeg2.rotate(g_legAngle2, 1, 0, 0);
    lowerLeg2.translate(0, -0.2, 0);
    lowerLeg2.rotate(g_kneeAngle2, 1, 0, 0);
    lowerLeg2.scale(0.11, 0.2, 0.11);
    drawCube(lowerLeg2, [0.4, 0.25, 0.1, 1.0]);
    
    var hoof2 = new Matrix4();
    hoof2.setTranslate(-0.2, -0.15, 0.3);
    hoof2.rotate(g_legAngle2, 1, 0, 0);
    hoof2.translate(0, -0.2, 0);
    hoof2.rotate(g_kneeAngle2, 1, 0, 0);
    hoof2.translate(0, -0.15, 0);
    hoof2.rotate(g_hoofAngle2, 1, 0, 0);
    hoof2.scale(0.13, 0.1, 0.13);
    drawCube(hoof2, [0.3, 0.2, 0.1, 1.0]);
    
    var upperLeg3 = new Matrix4();
    upperLeg3.setTranslate(0.2, -0.15, -0.3);
    upperLeg3.rotate(g_legAngle3, 1, 0, 0);
    upperLeg3.scale(0.12, 0.2, 0.12);
    drawCube(upperLeg3, [0.5, 0.3, 0.1, 1.0]);
    
    var lowerLeg3 = new Matrix4();
    lowerLeg3.setTranslate(0.2, -0.15, -0.3);
    lowerLeg3.rotate(g_legAngle3, 1, 0, 0);
    lowerLeg3.translate(0, -0.2, 0);
    lowerLeg3.rotate(g_kneeAngle3, 1, 0, 0);
    lowerLeg3.scale(0.11, 0.2, 0.11);
    drawCube(lowerLeg3, [0.4, 0.25, 0.1, 1.0]);
    
    var hoof3 = new Matrix4();
    hoof3.setTranslate(0.2, -0.15, -0.3);
    hoof3.rotate(g_legAngle3, 1, 0, 0);
    hoof3.translate(0, -0.2, 0);
    hoof3.rotate(g_kneeAngle3, 1, 0, 0);
    hoof3.translate(0, -0.15, 0);
    hoof3.rotate(g_hoofAngle3, 1, 0, 0);
    hoof3.scale(0.13, 0.1, 0.13);
    drawCube(hoof3, [0.3, 0.2, 0.1, 1.0]);
    
    var upperLeg4 = new Matrix4();
    upperLeg4.setTranslate(-0.2, -0.15, -0.3);
    upperLeg4.rotate(g_legAngle4, 1, 0, 0);
    upperLeg4.scale(0.12, 0.2, 0.12);
    drawCube(upperLeg4, [0.5, 0.3, 0.1, 1.0]);
    
    var lowerLeg4 = new Matrix4();
    lowerLeg4.setTranslate(-0.2, -0.15, -0.3);
    lowerLeg4.rotate(g_legAngle4, 1, 0, 0);
    lowerLeg4.translate(0, -0.2, 0);
    lowerLeg4.rotate(g_kneeAngle4, 1, 0, 0);
    lowerLeg4.scale(0.11, 0.2, 0.11);
    drawCube(lowerLeg4, [0.4, 0.25, 0.1, 1.0]);
    
    var hoof4 = new Matrix4();
    hoof4.setTranslate(-0.2, -0.15, -0.3);
    hoof4.rotate(g_legAngle4, 1, 0, 0);
    hoof4.translate(0, -0.2, 0);
    hoof4.rotate(g_kneeAngle4, 1, 0, 0);
    hoof4.translate(0, -0.15, 0);
    hoof4.rotate(g_hoofAngle4, 1, 0, 0);
    hoof4.scale(0.13, 0.1, 0.13);
    drawCube(hoof4, [0.3, 0.2, 0.1, 1.0]);
}

function drawCube(modelMatrix, color) {
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    
    var vertices = new Float32Array([
        -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
        
        -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
        
        -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
        
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
        
         0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
        
        -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
    ]);
function drawCylinder(modelMatrix, color) {
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    
    var segments = 16;
    var vertices = [];
    var radius = 0.05;
    var height = 0.3;
    
    for (var i = 0; i < segments; i++) {
        var angle1 = (i / segments) * Math.PI * 2;
        var angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        var x1 = Math.cos(angle1) * radius;
        var z1 = Math.sin(angle1) * radius;
        var x2 = Math.cos(angle2) * radius;
        var z2 = Math.sin(angle2) * radius;
        
        vertices.push(x1, 0, z1, x2, 0, z2, x2, height, z2);
        vertices.push(x1, 0, z1, x2, height, z2, x1, height, z1);
        
        vertices.push(0, 0, 0, x2, 0, z2, x1, 0, z1);
        
        vertices.push(0, height, 0, x1, height, z1, x2, height, z2);
    }
    
    var verticesArray = new Float32Array(vertices);
    var n = vertices.length / 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create buffer');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}


    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create buffer');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

main();
