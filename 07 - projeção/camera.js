export default class Camera {
  constructor(gl) {
    // Posição da camera
    this.eye = vec3.fromValues(-10.0, -10.0, -10.0);
    this.at  = vec3.fromValues(0.0, 0.0, 0.0);
    this.up  = vec3.fromValues(0.0, 1.0, 0.0);

    // Parâmetros da projeção
    this.fovy = Math.PI / 2;
    this.aspect = gl.canvas.width / gl.canvas.height;

    this.left = -2.5;
    this.right = 2.5;
    this.top = 2.5;
    this.bottom = -2.5;

    this.near = 0;
    this.far = 5;

    this.delta = 0.0;

    // Matrizes View e Projection
    this.view = mat4.create();
    this.proj = mat4.create();
  }

  getView() {
    return this.view;
  }

  getProj() {
    return this.proj;
  }

  updateViewMatrix() {
    mat4.identity( this.view );

    this.delta += 0.001;
    // this.delta  = this.delta >= 1 ? 1 : this.delta; 
    this.eye = vec3.fromValues(this.delta, this.delta, this.delta);    
    mat4.lookAt(this.view, this.eye, this.at, this.up);
    // TODO: Tentar implementar as contas diretamente
  }

  updateProjectionMatrix(type = '') {
    mat4.identity( this.proj );

    if (type === 'ortho') {
      const aspect = 1024/768;
      mat4.ortho(this.proj, this.left * aspect, this.right * aspect, this.bottom , this.top, this.near, this.far);
    } else {
      mat4.perspective(this.proj, this.fovy, this.aspect, this.near, this.far);
    }
  }

  updateCam() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }
}