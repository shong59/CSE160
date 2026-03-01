// Cube with normals for Phong shading
// Vertex layout (interleaved): [x, y, z, u, v, nx, ny, nz] = 8 floats
// Face normals:
//   back  (z=0): (0, 0,-1)
//   front (z=1): (0, 0, 1)
//   top   (y=1): (0, 1, 0)
//   bot   (y=0): (0,-1, 0)
//   right (x=1): (1, 0, 0)
//   left  (x=0): (-1,0, 0)

class Cube {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  renderFast() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Normal matrix = transpose of inverse of model matrix
    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Each row: x y z  u v  nx ny nz
    var v = [];

    // --- Back face (z=0, normal 0,0,-1) ---
    v = v.concat([0,0,0, 0,0,  0,0,-1]);
    v = v.concat([1,1,0, 1,1,  0,0,-1]);
    v = v.concat([1,0,0, 1,0,  0,0,-1]);
    v = v.concat([0,0,0, 0,0,  0,0,-1]);
    v = v.concat([0,1,0, 0,1,  0,0,-1]);
    v = v.concat([1,1,0, 1,1,  0,0,-1]);

    // --- Front face (z=1, normal 0,0,1) ---
    v = v.concat([0,0,1, 0,0,  0,0,1]);
    v = v.concat([1,0,1, 1,0,  0,0,1]);
    v = v.concat([1,1,1, 1,1,  0,0,1]);
    v = v.concat([0,0,1, 0,0,  0,0,1]);
    v = v.concat([1,1,1, 1,1,  0,0,1]);
    v = v.concat([0,1,1, 0,1,  0,0,1]);

    // --- Top face (y=1, normal 0,1,0) ---
    v = v.concat([0,1,0, 0,0,  0,1,0]);
    v = v.concat([0,1,1, 0,1,  0,1,0]);
    v = v.concat([1,1,1, 1,1,  0,1,0]);
    v = v.concat([0,1,0, 0,0,  0,1,0]);
    v = v.concat([1,1,1, 1,1,  0,1,0]);
    v = v.concat([1,1,0, 1,0,  0,1,0]);

    // --- Bottom face (y=0, normal 0,-1,0) ---
    v = v.concat([0,0,0, 0,0,  0,-1,0]);
    v = v.concat([1,0,0, 1,0,  0,-1,0]);
    v = v.concat([1,0,1, 1,1,  0,-1,0]);
    v = v.concat([0,0,0, 0,0,  0,-1,0]);
    v = v.concat([1,0,1, 1,1,  0,-1,0]);
    v = v.concat([0,0,1, 0,1,  0,-1,0]);

    // --- Right face (x=1, normal 1,0,0) ---
    v = v.concat([1,0,0, 0,0,  1,0,0]);
    v = v.concat([1,1,0, 0,1,  1,0,0]);
    v = v.concat([1,1,1, 1,1,  1,0,0]);
    v = v.concat([1,0,0, 0,0,  1,0,0]);
    v = v.concat([1,1,1, 1,1,  1,0,0]);
    v = v.concat([1,0,1, 1,0,  1,0,0]);

    // --- Left face (x=0, normal -1,0,0) ---
    v = v.concat([0,0,0, 0,0, -1,0,0]);
    v = v.concat([0,0,1, 1,0, -1,0,0]);
    v = v.concat([0,1,1, 1,1, -1,0,0]);
    v = v.concat([0,0,0, 0,0, -1,0,0]);
    v = v.concat([0,1,1, 1,1, -1,0,0]);
    v = v.concat([0,1,0, 0,1, -1,0,0]);

    var vertexData = new Float32Array(v);
    var buffer = gl.createBuffer();
    if (!buffer) { console.log('Failed to create buffer'); return; }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);

    var FSIZE = vertexData.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
