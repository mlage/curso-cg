export default class Camera {
  constructor(gl) {
    // Posição da camera
    this.eye = vec3.fromValues(0.0, 6.0, 6.0);
    this.at  = vec3.fromValues(-1.0, 0.0, 0.0);
    this.up  = vec3.fromValues(0.0, 1.0, 0.0);

    // Parâmetros da projeção
    this.fovy = Math.PI / 6;
    this.aspect = gl.canvas.width / gl.canvas.height;

    this.near = -4;
    this.far = 4;

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
    mat4.perspective(this.proj, this.fovy, this.aspect, this.near, this.far);
  }

  updateCam() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }
}