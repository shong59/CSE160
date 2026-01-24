var VERTEX_SHADER = `
    precision mediump float;
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = u_Size;
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
var u_Size;

var g_selectedColor = [1.0, 0.0, 0.0, 1.0];
var g_selectedSize = 10;
var g_selectedType = 'point';
var g_selectedSegments = 10;
var g_shapesList = [];
var g_eyeTrackingMode = false;
var g_mouseX = 0.0;
var g_mouseY = 0.0;

function setupWebGL() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("Failed to get WebGL context.");
        return;
    }
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
        console.log("Failed to initialize shaders.");
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log("Failed to get a_Position");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log("Failed to get u_FragColor");
        return;
    }

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log("Failed to get u_Size");
        return;
    }
}

function addActionsForHtmlUI() {
    document.getElementById('clearButton').onclick = function() {
        g_shapesList = [];
        g_eyeTrackingMode = false;
        document.getElementById('sketchImage').style.display = 'none';
        renderAllShapes();
    };

    document.getElementById('catFaceButton').onclick = function() {
        drawCatFace();
        document.getElementById('sketchImage').style.display = 'block';
    };

    document.getElementById('eyeTrackingButton').onclick = function() {
        g_eyeTrackingMode = true;
    };

    document.getElementById('pointButton').onclick = function() {
        g_selectedType = 'point';
    };
    document.getElementById('triangleButton').onclick = function() {
        g_selectedType = 'triangle';
    };
    document.getElementById('circleButton').onclick = function() {
        g_selectedType = 'circle';
    };

    document.getElementById('redS').addEventListener('mouseup', function() {
        g_selectedColor[0] = this.value / 100;
    });
    document.getElementById('greenS').addEventListener('mouseup', function() {
        g_selectedColor[1] = this.value / 100;
    });
    document.getElementById('blueS').addEventListener('mouseup', function() {
        g_selectedColor[2] = this.value / 100;
    });

    document.getElementById('sizeS').addEventListener('mouseup', function() {
        g_selectedSize = this.value;
    });

    document.getElementById('segmentsS').addEventListener('mouseup', function() {
        g_selectedSegments = this.value;
    });

    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) {
        if (ev.buttons == 1) {
            click(ev);
        }
        if (g_eyeTrackingMode) {
            var xy = convertCoordinatesEventToGL(ev);
            g_mouseX = xy[0];
            g_mouseY = xy[1];
            renderAllShapes();
            drawCatFace();
        }
    };
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
    var xy = convertCoordinatesEventToGL(ev);
    var x = xy[0];
    var y = xy[1];

    var shape;
    if (g_selectedType == 'point') {
        shape = new Point();
        shape.position = [x, y];
        shape.color = g_selectedColor.slice();
        shape.size = g_selectedSize;
    } else if (g_selectedType == 'triangle') {
        shape = new Triangle();
        shape.position = [x, y];
        shape.color = g_selectedColor.slice();
        shape.size = g_selectedSize;
    } else if (g_selectedType == 'circle') {
        shape = new Circle();
        shape.position = [x, y];
        shape.color = g_selectedColor.slice();
        shape.size = g_selectedSize;
        shape.segments = g_selectedSegments;
    }
    
    g_shapesList.push(shape);
    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for (var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }
}

function drawCatFace() {
    var orangeColor = [1.0, 0.5, 0.0, 1.0];
    
    gl.uniform4f(u_FragColor, orangeColor[0], orangeColor[1], orangeColor[2], orangeColor[3]);
    drawTriangle([0.0, 0.6, -0.5, 0.0, 0.5, 0.0]); 
    drawTriangle([0.0, -0.6, -0.5, -0.0, 0.5, -0.0]);
    drawTriangle([-0.30, 0.6, -0.45, 0.4, -0.15, 0.4]); 
    drawTriangle([0.30, 0.6, 0.45, 0.4, 0.15, 0.4]);
    
    var whiteColor = [1.0, 1.0, 1.0, 1.0];
    gl.uniform4f(u_FragColor, whiteColor[0], whiteColor[1], whiteColor[2], whiteColor[3]);
    drawTriangle([-0.2, 0.1, -0.35, -0.1, -0.05, -0.1]);
    drawTriangle([0.2, 0.1, 0.35, -0.1, 0.05, -0.1]);
    
    var blackColor = [0.0, 0.0, 0.0, 1.0];
    gl.uniform4f(u_FragColor, blackColor[0], blackColor[1], blackColor[2], blackColor[3]);
    
    var leftEyeCenterX = -0.2;
    var leftEyeCenterY = 0.0;
    var rightEyeCenterX = 0.2;
    var rightEyeCenterY = 0.0;
    
    var leftPupilX = leftEyeCenterX;
    var leftPupilY = leftEyeCenterY;
    var rightPupilX = rightEyeCenterX;
    var rightPupilY = rightEyeCenterY;
    
    if (g_eyeTrackingMode) {
        var maxOffset = 0.04;
        
        var leftDx = g_mouseX - leftEyeCenterX;
        var leftDy = g_mouseY - leftEyeCenterY;
        var leftDistance = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
        if (leftDistance > 0) {
            var leftOffsetX = (leftDx / leftDistance) * Math.min(maxOffset, leftDistance);
            var leftOffsetY = (leftDy / leftDistance) * Math.min(maxOffset, leftDistance);
            leftPupilX += leftOffsetX;
            leftPupilY += leftOffsetY;
        }
        
        var rightDx = g_mouseX - rightEyeCenterX;
        var rightDy = g_mouseY - rightEyeCenterY;
        var rightDistance = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
        if (rightDistance > 0) {
            var rightOffsetX = (rightDx / rightDistance) * Math.min(maxOffset, rightDistance);
            var rightOffsetY = (rightDy / rightDistance) * Math.min(maxOffset, rightDistance);
            rightPupilX += rightOffsetX;
            rightPupilY += rightOffsetY;
        }
    }
    
    drawTriangle([leftPupilX, leftPupilY + 0.05, leftPupilX - 0.1, leftPupilY - 0.05, leftPupilX + 0.1, leftPupilY - 0.05]);
    drawTriangle([rightPupilX, rightPupilY + 0.05, rightPupilX - 0.1, rightPupilY - 0.05, rightPupilX + 0.1, rightPupilY - 0.05]);
    drawTriangle([0.0, -0.1, -0.1, -0.2, 0.1, -0.2]);
    
    var redColor = [1.0, 0.0, 0.0, 1.0];
    gl.uniform4f(u_FragColor, redColor[0], redColor[1], redColor[2], redColor[3]);
    drawTriangle([0.0, -0.5, -0.15, -0.4, 0.15, -0.4]);
}

class Point {
    constructor() {
        this.type = 'point';
        this.position = [0.0, 0.0];
        this.color = [1.0, 0.0, 0.0, 1.0];
        this.size = 5.0;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        gl.disableVertexAttribArray(a_Position);
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_Size, size);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}

class Triangle {
    constructor() {
        this.type = 'triangle';
        this.position = [0.0, 0.0];
        this.color = [1.0, 0.0, 0.0, 1.0];
        this.size = 5.0;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size / 200.0;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        var d = size;
        drawTriangle([xy[0], xy[1] + d, xy[0] - d, xy[1] - d, xy[0] + d, xy[1] - d]);
    }
}

class Circle {
    constructor() {
        this.type = 'circle';
        this.position = [0.0, 0.0];
        this.color = [1.0, 0.0, 0.0, 1.0];
        this.size = 5.0;
        this.segments = 10;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size / 200.0;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        var d = size;
        var angleStep = 360 / this.segments;
        for (var angle = 0; angle < 360; angle += angleStep) {
            var angle1 = angle;
            var angle2 = angle + angleStep;
            var vec1 = [Math.cos(angle1 * Math.PI / 180) * d, Math.sin(angle1 * Math.PI / 180) * d];
            var vec2 = [Math.cos(angle2 * Math.PI / 180) * d, Math.sin(angle2 * Math.PI / 180) * d];

            drawTriangle([xy[0], xy[1], xy[0] + vec1[0], xy[1] + vec1[1], xy[0] + vec2[0], xy[1] + vec2[1]]);
        }
    }
}

function drawTriangle(vertices) {
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log("Failed to create buffer");
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}