
import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';

import Shader from './shader.js';

class Scene {
  constructor(gl, width, height) {
    this.coords = [];
    this.colors = [];

    // model matrix
    this.angle = 0;
    this.model = mat4.create();

    // view matrix
    this.eye = vec3.fromValues(0.0, 1.0, 0.0);
    this.at  = vec3.fromValues(0.0, 0.0, 0.0);
    this.up  = vec3.fromValues(0.0, 0.0, 1.0);
    this.view = mat4.create();

    // projection matrix
    this.frustum = {
        left: -5, right: 5, bottom: -5, top: 5, 
        near: -1, far: 1,
        fovy: Math.PI / 3, aspect: width / height
    }
    this.proj = mat4.create();

    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    this.vaoLoc = -1;
    this.uniformLoc = -1;

    this.init(gl);
  }

  init(gl) {
    this.createShaderProgram(gl);
    this.createVAO(gl);
    this.createUniforms(gl);
  }

  createShaderProgram(gl) {
    this.vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.program = Shader.createProgram(gl, this.vertShd, this.fragShd);

    gl.useProgram(this.program);
  }

  createUniforms(gl) {
    this.uniformLoc = gl.getUniformLocation(this.program, "u_mat");
  }

  createCube() {
    const verts = [
      [0.0,0.0,0.0,1.0], // v0
      [0.1,0.0,0.0,1.0], // v1
      [0.1,0.0,0.1,1.0], // v2
      [0.0,0.0,0.1,1.0], // v3
      [0.0,0.1,0.1,1.0], // v4
      [0.1,0.1,0.1,1.0], // v5
      [0.1,0.1,0.0,1.0], // v6
      [0.0,0.1,0.0,1.0]  // v7
    ];

    const color = [
      [0.0,0.0,1.0,1.0], // v0
      [0.0,0.0,1.0,1.0], // v1
      [0.0,0.0,1.0,1.0], // v2
      [0.0,0.0,1.0,1.0], // v3
      [0.0,1.0,0.0,1.0], // v4
      [0.0,1.0,0.0,1.0], // v5
      [0.0,1.0,0.0,1.0], // v6
      [0.0,1.0,0.0,1.0]  // v7
    ];

    const vertsVBO = [
      ...verts[0], ...verts[1], ...verts[3],
      ...verts[1], ...verts[2], ...verts[3],
      ...verts[4], ...verts[5], ...verts[7],
      ...verts[5], ...verts[6], ...verts[7],
      ...verts[4], ...verts[7], ...verts[3],
      ...verts[0], ...verts[3], ...verts[7],
      ...verts[7], ...verts[6], ...verts[0],
      ...verts[0], ...verts[6], ...verts[1],
      ...verts[6], ...verts[5], ...verts[1],
      ...verts[1], ...verts[5], ...verts[2],
      ...verts[2], ...verts[5], ...verts[4],
      ...verts[2], ...verts[4], ...verts[3],
    ];

    const colorVBO =  [
      ...color[0], ...color[1], ...color[3],
      ...color[1], ...color[2], ...color[3],
      ...color[4], ...color[5], ...color[7],
      ...color[5], ...color[6], ...color[7],
      ...color[4], ...color[7], ...color[3],
      ...color[0], ...color[3], ...color[7],
      ...color[7], ...color[6], ...color[0],
      ...color[0], ...color[6], ...color[1],
      ...color[6], ...color[5], ...color[1],
      ...color[1], ...color[5], ...color[2],
      ...color[2], ...color[5], ...color[4],
      ...color[2], ...color[4], ...color[3],
    ];

    return [vertsVBO, colorVBO];
  }

  modelMatrix() {
    this.angle += 0.001;
    mat4.identity( this.model );

    mat4.rotateY(this.model, this.model, this.angle);
    // this.mat * [sin(this.angle) -cos(this.angle) 0 0, cor(this.angle) sin(this.angle) 0 0, 0 0 1 0, 0 0 0 1]

    mat4.translate(this.model, this.model, [-0.5, -0.5, -0.5]);
    // this.mat * [1 0 0 -0.5, 0 1 0 -0.5, 0 0 1 -0.5, 0 0 0 1]

    mat4.scale(this.model, this.model, [10, 10, 10]);
    // this.mat * [10 0 0 0, 0 10 0 0, 0 0 10 0, 0 0 0 1]
  }

  viewMatrix() {
    mat4.identity( this.view );
    mat4.lookAt(this.view, this.eye, this.at, this.up);
    // TODO: Tentar implementar as contas diretamente
  }

  projectionMatrix(type) {
    mat4.identity( this.proj );

    if (type === "ortho") {
      mat4.ortho(this.proj, 
        this.frustum.left, this.frustum.right, 
        this.frustum.bottom, this.frustum.top, 
        this.frustum.near, this.frustum.far);
    } else {
      mat4.perspective(this.proj, 
        this.frustum.fovy, this.frustum.aspect, 
        this.frustum.near, this.frustum.far);
    }
    // TODO: Tentar implementar as contas diretamente
  }

  createVAO(gl) {
    const model = this.createCube();

    this.coords = model[0];
    this.colors = model[1];

    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.coords));

    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.colors));

    this.vaoLoc = Shader.createVAO(gl, coordsAttributeLocation, coordsBuffer, colorsAttributeLocation, colorsBuffer);
  }

  draw(gl) {
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoLoc);

    this.modelMatrix();
    this.viewMatrix();
    this.projectionMatrix();

    const modelView = mat4.create();
    mat4.mul(modelView, this.view, this.model);
    const modelViewProj = mat4.create();
    mat4.mul(modelViewProj, this.proj, modelView);

    gl.uniformMatrix4fv(this.uniformLoc, false, modelViewProj);

    gl.drawArrays(gl.TRIANGLES, 0, this.coords.length / 4);
  }
}

class Main {
  constructor() {
    const canvas = document.querySelector("#glcanvas");

    this.gl = canvas.getContext("webgl2");
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.gl.canvas.width = 1024 * devicePixelRatio;
    this.gl.canvas.height = 768 * devicePixelRatio;

    this.scene = new Scene(this.gl, this.gl.canvas.width, this.gl.canvas.height);
  }

  draw() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.gl.canvas.width = 1024 * devicePixelRatio;
    this.gl.canvas.height = 768 * devicePixelRatio;

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
 
    this.scene.draw(this.gl);

    requestAnimationFrame(this.draw.bind(this));
  }

}

window.onload = () => {
  const app = new Main();
  app.draw();
}


