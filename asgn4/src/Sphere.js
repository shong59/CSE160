// UV sphere. Vertex layout: [x, y, z, u, v, nx, ny, nz] = 8 floats.
// For a unit sphere centered at origin: normal = position.

class Sphere {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
    this._verts = null;
    this._numVerts = 0;
    this._buildMesh();
  }

  _buildMesh() {
    var N_LAT = 16;
    var N_LON = 24;
    var v = [];

    for (var i = 0; i < N_LAT; i++) {
      for (var j = 0; j < N_LON; j++) {
        var lat0 = Math.PI * (-0.5 + i / N_LAT);
        var lat1 = Math.PI * (-0.5 + (i + 1) / N_LAT);
        var lon0 = 2 * Math.PI * j / N_LON;
        var lon1 = 2 * Math.PI * (j + 1) / N_LON;

        // Corner positions (on unit sphere, position == normal)
        var p00 = [Math.cos(lat0)*Math.cos(lon0), Math.sin(lat0), Math.cos(lat0)*Math.sin(lon0)];
        var p01 = [Math.cos(lat0)*Math.cos(lon1), Math.sin(lat0), Math.cos(lat0)*Math.sin(lon1)];
        var p10 = [Math.cos(lat1)*Math.cos(lon0), Math.sin(lat1), Math.cos(lat1)*Math.sin(lon0)];
        var p11 = [Math.cos(lat1)*Math.cos(lon1), Math.sin(lat1), Math.cos(lat1)*Math.sin(lon1)];

        var u0 = j / N_LON,     u1 = (j + 1) / N_LON;
        var v0 = i / N_LAT,     v1 = (i + 1) / N_LAT;

        // Triangle 1: p00, p10, p11
        v = v.concat([...p00, u0, v0, ...p00]);
        v = v.concat([...p10, u0, v1, ...p10]);
        v = v.concat([...p11, u1, v1, ...p11]);

        // Triangle 2: p00, p11, p01
        v = v.concat([...p00, u0, v0, ...p00]);
        v = v.concat([...p11, u1, v1, ...p11]);
        v = v.concat([...p01, u1, v0, ...p01]);
      }
    }

    this._verts = new Float32Array(v);
    this._numVerts = v.length / 8;
  }

  render() {
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    var buffer = gl.createBuffer();
    if (!buffer) { console.log('Failed to create sphere buffer'); return; }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._verts, gl.DYNAMIC_DRAW);

    var FSIZE = this._verts.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, this._numVerts);
  }
}
