Vector3.prototype.add = function(other) {
  var a = this.elements, b = other.elements;
  a[0] += b[0]; a[1] += b[1]; a[2] += b[2];
  return this;
};
Vector3.prototype.sub = function(other) {
  var a = this.elements, b = other.elements;
  a[0] -= b[0]; a[1] -= b[1]; a[2] -= b[2];
  return this;
};
Vector3.prototype.mul = function(scalar) {
  var v = this.elements;
  v[0] *= scalar; v[1] *= scalar; v[2] *= scalar;
  return this;
};
Vector3.cross = function(a, b) {
  var ae = a.elements, be = b.elements;
  return new Vector3([
    ae[1]*be[2] - ae[2]*be[1],
    ae[2]*be[0] - ae[0]*be[2],
    ae[0]*be[1] - ae[1]*be[0]
  ]);
};

class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([0, 0.5, 3]);
    this.at  = new Vector3([0, 0.5, -1]);
    this.up  = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
    this.updateView();
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  moveForward(speed) {
    if (speed === undefined) speed = 0.2;
    var f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  moveBackwards(speed) {
    if (speed === undefined) speed = 0.2;
    var b = new Vector3(this.eye.elements);
    b.sub(this.at);
    b.normalize();
    b.mul(speed);
    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  moveLeft(speed) {
    if (speed === undefined) speed = 0.2;
    var f = new Vector3(this.at.elements);
    f.sub(this.eye);
    var s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed) {
    if (speed === undefined) speed = 0.2;
    var f = new Vector3(this.at.elements);
    f.sub(this.eye);
    var s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  panLeft(alpha) {
    if (alpha === undefined) alpha = 5;
    var f = new Vector3(this.at.elements);
    f.sub(this.eye);
    var rot = new Matrix4();
    rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    var f2 = rot.multiplyVector3(f);
    this.at = new Vector3([
      this.eye.elements[0] + f2.elements[0],
      this.eye.elements[1] + f2.elements[1],
      this.eye.elements[2] + f2.elements[2]
    ]);
    this.updateView();
  }

  panRight(alpha) {
    if (alpha === undefined) alpha = 5;
    this.panLeft(-alpha);
  }

  panVertical(alpha) {
    if (alpha === undefined) alpha = 2;
    var f = new Vector3(this.at.elements);
    f.sub(this.eye);
    var right = Vector3.cross(f, this.up);
    right.normalize();
    var rot = new Matrix4();
    rot.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);
    var f2 = rot.multiplyVector3(f);
    this.at = new Vector3([
      this.eye.elements[0] + f2.elements[0],
      this.eye.elements[1] + f2.elements[1],
      this.eye.elements[2] + f2.elements[2]
    ]);
    this.updateView();
  }
}
