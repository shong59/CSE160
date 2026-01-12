var canvas;
var ctx;

function main() {
    canvas = document.getElementById("example");
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return false;
    }
    ctx = canvas.getContext("2d");
    clearCanvas();
}

function clearCanvas() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var scale = 20;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + v.elements[0] * scale, cy - v.elements[1] * scale);
    ctx.stroke();
}

function handleDrawEvent() {
    clearCanvas();

    var v1x = parseFloat(document.getElementById('v1x').value) || 0;
    var v1y = parseFloat(document.getElementById('v1y').value) || 0;
    var v1 = new Vector3([v1x, v1y, 0]);

    var v2x = parseFloat(document.getElementById('v2x').value) || 0;
    var v2y = parseFloat(document.getElementById('v2y').value) || 0;
    var v2 = new Vector3([v2x, v2y, 0]);

    drawVector(v1, 'red');
    drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
    clearCanvas();

    var v1x = parseFloat(document.getElementById('v1x').value) || 0;
    var v1y = parseFloat(document.getElementById('v1y').value) || 0;
    var v1 = new Vector3([v1x, v1y, 0]);

    var v2x = parseFloat(document.getElementById('v2x').value) || 0;
    var v2y = parseFloat(document.getElementById('v2y').value) || 0;
    var v2 = new Vector3([v2x, v2y, 0]);

    var scalar = parseFloat(document.getElementById('scalar').value) || 0;
    var operation = document.getElementById('operation').value;

    drawVector(v1, 'red');
    drawVector(v2, 'blue');

    switch (operation) {
        case 'add':
            var v3 = new Vector3([v1x, v1y, 0]);
            v3.add(v2);
            drawVector(v3, 'green');
            break;
        case 'sub':
            var v3 = new Vector3([v1x, v1y, 0]);
            v3.sub(v2);
            drawVector(v3, 'green');
            break;
        case 'mul':
            var v3 = new Vector3([v1x, v1y, 0]);
            v3.mul(scalar);
            drawVector(v3, 'green');
            var v4 = new Vector3([v2x, v2y, 0]);
            v4.mul(scalar);
            drawVector(v4, 'green');
            break;
        case 'div':
            var v3 = new Vector3([v1x, v1y, 0]);
            v3.div(scalar);
            drawVector(v3, 'green');
            var v4 = new Vector3([v2x, v2y, 0]);
            v4.div(scalar);
            drawVector(v4, 'green');
            break;
        case 'magnitude':
            console.log("Magnitude v1: " + v1.magnitude());
            console.log("Magnitude v2: " + v2.magnitude());
            break;
        case 'normalize':
            var v3 = new Vector3([v1x, v1y, 0]);
            v3.normalize();
            drawVector(v3, 'green');
            var v4 = new Vector3([v2x, v2y, 0]);
            v4.normalize();
            drawVector(v4, 'green');
            break;
        case 'angle':
            var angle = angleBetween(v1, v2);
            console.log("Angle: " + angle);
            break;
        case 'area':
            var area = areaTriangle(v1, v2);
            console.log("Area of the triangle: " + area);
            break;
    }
}

function angleBetween(v1, v2) {
    var d = Vector3.dot(v1, v2);
    var m1 = v1.magnitude();
    var m2 = v2.magnitude();
    
    if (m1 === 0 || m2 === 0) {
        return 0;
    }
    
    var cosAngle = d / (m1 * m2);
    cosAngle = Math.max(-1, Math.min(1, cosAngle));
    var angleRad = Math.acos(cosAngle);
    var angleDeg = angleRad * (180 / Math.PI);
    
    return angleDeg;
}

function areaTriangle(v1, v2) {
    var cross = Vector3.cross(v1, v2);
    var area = cross.magnitude() / 2;
    return area;
}