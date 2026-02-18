class Cube {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
    drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

    drawTriangle3DUV([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
    drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

    drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);
    drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0]);

    drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);
    drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);

    drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1]);
    drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0]);

    drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 1,0, 1,1]);
    drawTriangle3DUV([0,0,0, 0,1,1, 0,1,0], [0,0, 1,1, 0,1]);
  }

  renderFast() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var allverts = [];
    allverts = allverts.concat([0,0,0, 0,0,  1,1,0, 1,1,  1,0,0, 1,0]);
    allverts = allverts.concat([0,0,0, 0,0,  0,1,0, 0,1,  1,1,0, 1,1]);
    allverts = allverts.concat([0,0,1, 0,0,  1,0,1, 1,0,  1,1,1, 1,1]);
    allverts = allverts.concat([0,0,1, 0,0,  1,1,1, 1,1,  0,1,1, 0,1]);
    allverts = allverts.concat([0,1,0, 0,0,  0,1,1, 0,1,  1,1,1, 1,1]);
    allverts = allverts.concat([0,1,0, 0,0,  1,1,1, 1,1,  1,1,0, 1,0]);
    allverts = allverts.concat([0,0,0, 0,0,  1,0,0, 1,0,  1,0,1, 1,1]);
    allverts = allverts.concat([0,0,0, 0,0,  1,0,1, 1,1,  0,0,1, 0,1]);
    allverts = allverts.concat([1,0,0, 0,0,  1,1,0, 0,1,  1,1,1, 1,1]);
    allverts = allverts.concat([1,0,0, 0,0,  1,1,1, 1,1,  1,0,1, 1,0]);
    allverts = allverts.concat([0,0,0, 0,0,  0,0,1, 1,0,  0,1,1, 1,1]);
    allverts = allverts.concat([0,0,0, 0,0,  0,1,1, 1,1,  0,1,0, 0,1]);

    var vertexData = new Float32Array(allverts);

    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create buffer');
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);

    var FSIZE = vertexData.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}

function drawTriangle3DUV(vertices, uv) {
  var n = 3;

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create vertex buffer');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  var uvBuffer = gl.createBuffer();
  if (!uvBuffer) {
    console.log('Failed to create UV buffer');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
