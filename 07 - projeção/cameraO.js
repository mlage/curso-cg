export default class Camera {
  constructor(gl) {
    // Posição da camera
    this.eye = vec3.fromValues(0.0, 1.0, 1.0);
    this.at  = vec3.fromValues(-1.0, 0.0, 0.0);
    this.up  = vec3.fromValues(0.0, 1.0, 0.0);

    // Parâmetros da projeção
    this.left = -2.5;
    this.right = 2.5;
    this.top = 2.5;
    this.bottom = -2.5;
    this.near = -5;
    this.far = 5;

    this.aspect = gl.canvas.width / gl.canvas.height;

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
    mat4.lookAt(this.view, this.eye, this.at, this.up);
    // TODO: Tentar implementar as contas diretamente
  }

  updateProjectionMatrix() {
    mat4.identity( this.proj );

    const aspect = this.aspect;
    mat4.ortho(this.proj, this.left * aspect, this.right * aspect, this.bottom , this.top, this.near, this.far);
  }

  updateCam() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }
}