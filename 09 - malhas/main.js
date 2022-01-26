
import vertShaderSrc from './phong.vert.js';
import fragShaderSrc from './phong.frag.js';

import Shader from './shader.js';
import Mesh from './mesh.js';
 
class Scene {
  constructor(gl, width, height) {
    // model matrix
    this.angle = 0;
    this.model = mat4.create();

    // view matrix
    this.eye = vec3.fromValues(2.0, 2.0, 2.0);
    this.at  = vec3.fromValues(0.0, 0.0, 0.0);
    this.up  = vec3.fromValues(0.0, 1.0, 0.0);
    this.view = mat4.create();

    // projection matrix
    this.frustum = {
        left: -5 * width / height, right: 5 * width / height, bottom: -5, top: 5, 
        near: -5, far: 5,
        fovy: Math.PI / 3, aspect: width / height
    }
    this.proj = mat4.create();

    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    this.vaoLoc = -1;
    this.idsLoc = -1;

    this.modelviewLoc = -1;
    this.projectionLoc = -1;

    // Half-edge
    this.mesh = null;
    this.createCube();

    // openGL initialization
    this.init(gl);
  }

  init(gl) {
    this.createShaderProgram(gl);
    this.createBuffers(gl);
    this.createUniforms(gl);
  }

  createShaderProgram(gl) {
    this.vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.program = Shader.createProgram(gl, this.vertShd, this.fragShd);

    gl.useProgram(this.program);
  }

  createUniforms(gl) {
    this.modelLoc = gl.getUniformLocation(this.program, "u_model");
    this.viewLoc = gl.getUniformLocation(this.program, "u_view");
    this.projectionLoc = gl.getUniformLocation(this.program, "u_projection");
  }

  createCube() {
    const coords = [
      [0.0,0.0,0.0,1.0], // v0
      [0.1,0.0,0.0,1.0], // v1
      [0.1,0.0,0.1,1.0], // v2
      [0.0,0.0,0.1,1.0], // v3
      [0.0,0.1,0.1,1.0], // v4
      [0.1,0.1,0.1,1.0], // v5
      [0.1,0.1,0.0,1.0], // v6
      [0.0,0.1,0.0,1.0]  // v7
    ];

    const normls = [
      [-1.0, -1.0, -1.0, 0.0], // n0
      [ 1.0, -1.0, -1.0, 0.0], // n1
      [ 1.0, -1.0,  1.0, 0.0], // n2
      [-1.0, -1.0,  1.0, 0.0], // n3
      [-1.0,  1.0,  1.0, 0.0], // n4
      [ 1.0,  1.0,  1.0, 0.0], // n5
      [ 1.0,  1.0, -1.0, 0.0], // n6
      [-1.0,  1.0, -1.0, 0.0], // n7
    ];

    const ids = [
      [0, 1, 3], [1, 2, 3],
      [4, 5, 7], [5, 6, 7],
      [3, 4, 7], [0, 3, 7],
      [7, 6, 0], [6, 1, 0],
      [1, 6, 5], [1, 5, 2],
      [5, 4, 2], [2, 4, 3]
    ]

    this.mesh = new Mesh();
    this.mesh.build(coords, normls, ids);
  }

  modelMatrix() {
    this.angle += 0.01;
    mat4.identity( this.model );

    mat4.rotateY(this.model, this.model, this.angle);
    // this.mat * [sin(this.angle) -cos(this.angle) 0 0, cor(this.angle) sin(this.angle) 0 0, 0 0 1 0, 0 0 0 1]

    mat4.scale(this.model, this.model, [2.5, 2.5, 2.5]);

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

  createBuffers(gl) {
    const vbos = this.mesh.getVBOs();

    const coords = vbos[0];
    const normls = vbos[1];

    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(coords));

    var normlsAttributeLocation = gl.getAttribLocation(this.program, "normal");
    const normlsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(normls));

    this.vaoLoc = Shader.createVAO(gl, coordsAttributeLocation, coordsBuffer, null, undefined, normlsAttributeLocation, normlsBuffer);

    const ids = this.mesh.getIds();
    this.idsLoc = Shader.createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ids));
  }

  draw(gl) {
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoLoc);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.modelMatrix();
    this.viewMatrix();
    this.projectionMatrix("ortho");

    gl.uniformMatrix4fv(this.modelLoc, false, this.model);
    gl.uniformMatrix4fv(this.viewLoc, false, this.view);
    gl.uniformMatrix4fv(this.projectionLoc, false, this.proj);

    gl.drawElements(gl.TRIANGLES, 3 * this.mesh.faces.length, gl.UNSIGNED_SHORT, 0);
 
    gl.disable(gl.CULL_FACE);
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
