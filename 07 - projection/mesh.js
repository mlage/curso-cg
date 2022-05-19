import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';

import Shader from './shader.js';

export default class Mesh {
  constructor() {
    // model coordinates
    this.coords = [];
    this.colors = [];

    // Matriz de modelagem
    this.angle = 0;
    this.model = mat4.create();

    // Shader program
    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    // Data location
    this.vaoLoc = -1;
    this.uModelViewProjLoc = -1;

    // load mesh data
    this.loadMesh();
  }

  loadMesh() {
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
    this.coords = [
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

    this.colors = [
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
  }

  createShader(gl) {
    this.vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.program = Shader.createProgram(gl, this.vertShd, this.fragShd);

    gl.useProgram(this.program);
  }

  createUniforms(gl) {
    this.uModelViewProjLoc = gl.getUniformLocation(this.program, "u_modelViewProj");
  }

  createVAO(gl) {
    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.coords));

    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.colors));

    this.vaoLoc = Shader.createVAO(gl, coordsAttributeLocation, coordsBuffer, colorsAttributeLocation, colorsBuffer);
  }  

  init(gl) {
    this.createShader(gl);
    this.createUniforms(gl);
    this.createVAO(gl);
  }

  updateModelMatrix() {
    this.angle += 0.005;
    this.delta = 0.0;

    mat4.identity( this.model );
    mat4.translate(this.model, this.model, [this.delta, 0, 0]);
    // [1 0 0 delta, 0 1 0 0, 0 0 1 0, 0 0 0 1] * this.mat 

    mat4.rotateY(this.model, this.model, this.angle);
    // [ cos(this.angle) 0 -sin(this.angle) 0, 
    //         0         1        0         0, 
    //   sin(this.angle) 0  cos(this.angle) 0, 
    //         0         0        0         1]
    // * this.mat 

    mat4.translate(this.model, this.model, [-0.25, -0.25, -0.25]);
    // [1 0 0 -0.5, 0 1 0 -0.5, 0 0 1 -0.5, 0 0 0 1] * this.mat 

    mat4.scale(this.model, this.model, [5, 5, 5]);
    // [5 0 0 0, 0 5 0 0, 0 0 5 0, 0 0 0 1] * this.mat 
  }

  draw(gl, cam) {
    // faces orientadas no sentido anti-horário
    gl.frontFace(gl.CCW);

    // face culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.updateModelMatrix();

    const model = this.model;
    const view = cam.getView();
    const proj = cam.getProj();

    const mvp = mat4.create();
    mat4.mul(mvp, view, model);
    mat4.mul(mvp, proj, mvp);

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uModelViewProjLoc, false, mvp);
    gl.drawArrays(gl.TRIANGLES, 0, this.coords.length / 4);

    gl.disable(gl.CULL_FACE);
  }
}