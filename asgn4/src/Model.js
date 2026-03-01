// OBJ model loader. Supports v, vn, vt, and f with indices v/vt/vn or v//vn.
// Vertex layout: [x, y, z, u, v, nx, ny, nz] = 8 floats (same as Cube/Sphere).

class Model {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
    this._verts = null;
    this._numVerts = 0;
    this._loaded = false;
  }

  // Async load an OBJ file from the given URL path.
  loadOBJ(url) {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        self._parseOBJ(xhr.responseText);
        self._loaded = true;
      } else {
        console.log('Failed to load OBJ: ' + url);
      }
    };
    xhr.send();
  }

  _parseOBJ(text) {
    var positions = [];  // [x, y, z, ...]
    var normals   = [];  // [nx, ny, nz, ...]
    var uvs       = [];  // [u, v, ...]
    var verts     = [];  // final interleaved data

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith('v ')) {
        var p = line.split(/\s+/);
        positions.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]));
      } else if (line.startsWith('vn ')) {
        var n = line.split(/\s+/);
        normals.push(parseFloat(n[1]), parseFloat(n[2]), parseFloat(n[3]));
      } else if (line.startsWith('vt ')) {
        var t = line.split(/\s+/);
        uvs.push(parseFloat(t[1]), parseFloat(t[2]));
      } else if (line.startsWith('f ')) {
        var tokens = line.split(/\s+/).slice(1);
        // Triangulate: fan from tokens[0]
        for (var k = 1; k < tokens.length - 1; k++) {
          this._addVertex(verts, tokens[0],   positions, uvs, normals);
          this._addVertex(verts, tokens[k],   positions, uvs, normals);
          this._addVertex(verts, tokens[k+1], positions, uvs, normals);
        }
      }
    }

    this._verts = new Float32Array(verts);
    this._numVerts = verts.length / 8;
  }

  // token is like "1/2/3" or "1//3" or "1"
  _addVertex(verts, token, positions, uvs, normals) {
    var parts = token.split('/');
    var vi = (parseInt(parts[0]) - 1) * 3;
    var x = positions[vi] || 0;
    var y = positions[vi+1] || 0;
    var z = positions[vi+2] || 0;

    var u = 0, v = 0;
    if (parts[1] && parts[1] !== '') {
      var ti = (parseInt(parts[1]) - 1) * 2;
      u = uvs[ti]   || 0;
      v = uvs[ti+1] || 0;
    }

    var nx = 0, ny = 1, nz = 0;
    if (parts[2] && parts[2] !== '') {
      var ni = (parseInt(parts[2]) - 1) * 3;
      nx = normals[ni]   || 0;
      ny = normals[ni+1] || 0;
      nz = normals[ni+2] || 0;
    }

    verts.push(x, y, z, u, v, nx, ny, nz);
  }

  render() {
    if (!this._loaded || !this._verts) return;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    var buffer = gl.createBuffer();
    if (!buffer) { console.log('Failed to create model buffer'); return; }
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
