
import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';

import Shader from './shader.js';

class Scene {
  constructor(gl) {
    this.coords = [];
    this.colors = [];

    this.angle = 0;
    this.model = mat4.create();

    this.eye = vec3.fromValues(0.1, 0.1, 0.1);
    this.at  = vec3.fromValues(0.0, 0.0, 0.0);
    this.up  = vec3.fromValues(.0, 1.0, 0.0);
    this.view = mat4.create();

    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    this.vaoLoc = -1;
    this.uModelViewLoc = -1;

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
    this.uModelViewLoc = gl.getUniformLocation(this.program, "u_modelView");
  }

  createCube() {
    //   V4--------V5
    //   /|       /|
    //  / |      / |
    //V7-------V6  |
    // | V0-----|--V1
    // | /      | /
    // |/       |/
    //V3--------V2

    //        V4-----V5
    //        |  F1  |
    //        |      |
    // V4-----V0-----V1-----V5-----V4
    // |  F0  |  F2  |  F4  |  F5  |
    // |      |      |      |      |
    // V7-----V3-----V2-----V6-----V7
    //        |  F3  |
    //        |      |
    //        V7-----V6

    const verts = [
      [0.0, 0.0, 0.0, 1.0], // v0 
      [0.1, 0.0, 0.0, 1.0], // v1
      [0.1, 0.0, 0.1, 1.0], // v2
      [0.0, 0.0, 0.1, 1.0], // v3

      [0.0, 0.1, 0.0, 1.0], // v4
      [0.1, 0.1, 0.0, 1.0], // v5
      [0.1, 0.1, 0.1, 1.0], // v6
      [0.0, 0.1, 0.1, 1.0], // v7
    ];

    const color = [
      [1.0, 0.0, 0.0, 1.0], // vermelho
      [0.0, 1.0, 0.0, 1.0], // verde
      [0.0, 0.0, 1.0, 1.0], // azul
      [1.0, 0.7, 0.7, 1.0], // vermelho claro
      [0.7, 1.0, 0.7, 1.0], // verde claro
      [0.7, 0.7, 1.0, 1.0]  // azul claro
    ];

    // orientação: sentido anti-horário
    const vertsVBO = [
      ...verts[0], ...verts[3], ...verts[7],
      ...verts[0], ...verts[7], ...verts[4],

      ...verts[5], ...verts[1], ...verts[0],
      ...verts[5], ...verts[0], ...verts[4],

      ...verts[1], ...verts[2], ...verts[3],
      ...verts[1], ...verts[3], ...verts[0],

      ...verts[2], ...verts[6], ...verts[7],
      ...verts[2], ...verts[7], ...verts[3],

      ...verts[5], ...verts[6], ...verts[2],
      ...verts[5], ...verts[2], ...verts[1],

      ...verts[4], ...verts[7], ...verts[6],
      ...verts[4], ...verts[6], ...verts[5],
    ];

    const colorVBO = [
      // F0 - X- (vermelho)
      ...color[0], ...color[0], ...color[0],
      ...color[0], ...color[0], ...color[0],

      // F1 - Z- (azul)
      ...color[2], ...color[2], ...color[2],
      ...color[2], ...color[2], ...color[2],

      // F2 - Y- (verde)
      ...color[1], ...color[1], ...color[1],
      ...color[1], ...color[1], ...color[1],

      // F3 - Z+(azul claro)
      ...color[5], ...color[5], ...color[5],
      ...color[5], ...color[5], ...color[5],

      // F4 - X+(vermelho claro)
      ...color[3], ...color[3], ...color[3],
      ...color[3], ...color[3], ...color[3],

      // F5 - Y+(verde claro)
      ...color[4], ...color[4], ...color[4],
      ...color[4], ...color[4], ...color[4],
    ];

    return [vertsVBO, colorVBO];
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

  modelMatrix() {
    this.angle += 0.005;
    mat4.identity( this.model );

    mat4.rotateY(this.model, this.model, this.angle);
    // [ cos(this.angle) 0 -sin(this.angle) 0, 
    //         0         1        0         0, 
    //   sin(this.angle) 0  cos(this.angle) 0, 
    //         0         0        0         1]
    // * this.mat 

    mat4.translate(this.model, this.model, [-0.25, -0.25, -0.25]);
    // [1 0 0 -0.5, 0 1 0 -0.5, 0 0 1 -0.5, 0 0 0 1] * this.mat 

    mat4.scale(this.model, this.model, [5, 5, 5]);
    // [10 0 0 0, 0 10 0 0, 0 0 10 0, 0 0 0 1] * this.mat 
  }

  viewMatrix() {
    mat4.identity( this.view );
    mat4.lookAt(this.view, this.eye, this.at, this.up);
    // TODO: Tentar implementar as contas diretamente
  }

  draw(gl) {  
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoLoc);

    this.modelMatrix();
    this.viewMatrix();

    const modelView = mat4.create();
    mat4.mul(modelView, this.view, this.model);

    gl.uniformMatrix4fv(this.uModelViewLoc, false, modelView);

    gl.drawArrays(gl.TRIANGLES, 0, this.coords.length / 4);
  }
}

class Main {
  constructor() {
    const canvas = document.querySelector("#glcanvas");

    this.gl = canvas.getContext("webgl2");
    this.scene = new Scene(this.gl);
  }

  draw() {
    var devicePixelRatio = window.devicePixelRatio || 1;
    this.gl.canvas.width = 1024 * devicePixelRatio;
    this.gl.canvas.height = 768 * devicePixelRatio;

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // faces orientadas no sentido horário
    this.gl.frontFace(this.gl.CCW);

    // face culling
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    this.scene.draw(this.gl);

    this.gl.disable(this.gl.CULL_FACE);

    requestAnimationFrame(this.draw.bind(this));
  }
}

window.onload = () => {
  const app = new Main();
  app.draw();
}


