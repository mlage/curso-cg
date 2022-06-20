import vertShaderSrc from './phong.vert.js';
import fragShaderSrc from './phong.frag.js';

import Shader from './shader.js';

export default class Mesh {
  constructor(delta) {
    // model coordinates
    this.coords = [];
    this.colors = [];
    this.normals = [];

    // Matriz de modelagem
    this.angle = 0;
    this.delta = delta;
    this.model = mat4.create();

    // Shader program
    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    // Data location
    this.vaoLoc = -1;
    this.uModelLoc = -1;
    this.uViewLoc = -1;
    this.uProjectionLoc = -1;

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

    const coords = [
      [0.0, 0.0, 0.0, 1.0], // v0 
      [0.1, 0.0, 0.0, 1.0], // v1
      [0.1, 0.0, 0.1, 1.0], // v2
      [0.0, 0.0, 0.1, 1.0], // v3

      [0.0, 0.1, 0.0, 1.0], // v4
      [0.1, 0.1, 0.0, 1.0], // v5
      [0.1, 0.1, 0.1, 1.0], // v6
      [0.0, 0.1, 0.1, 1.0], // v7
    ];

    const normals = [
      [ 1.0, 0.0, 0.0, 0.0],
      [-1.0, 0.0, 0.0, 0.0],
      [ 0.0, 1.0, 0.0, 0.0],
      [ 0.0,-1.0, 0.0, 0.0],
      [ 0.0, 0.0, 1.0, 0.0],
      [ 0.0, 0.0,-1.0, 0.0],
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
      ...coords[0], ...coords[3], ...coords[7],
      ...coords[0], ...coords[7], ...coords[4],

      ...coords[5], ...coords[1], ...coords[0],
      ...coords[5], ...coords[0], ...coords[4],

      ...coords[1], ...coords[2], ...coords[3],
      ...coords[1], ...coords[3], ...coords[0],

      ...coords[2], ...coords[6], ...coords[7],
      ...coords[2], ...coords[7], ...coords[3],

      ...coords[5], ...coords[6], ...coords[2],
      ...coords[5], ...coords[2], ...coords[1],

      ...coords[4], ...coords[7], ...coords[6],
      ...coords[4], ...coords[6], ...coords[5],
    ];

    this.normals = [
      ...normals[1], ...normals[1], ...normals[1],
      ...normals[1], ...normals[1], ...normals[1],

      ...normals[3], ...normals[3], ...normals[3],
      ...normals[3], ...normals[3], ...normals[3],

      ...normals[5], ...normals[5], ...normals[5],
      ...normals[5], ...normals[5], ...normals[5],

      ...normals[4], ...normals[4], ...normals[4],
      ...normals[4], ...normals[4], ...normals[4],

      ...normals[0], ...normals[0], ...normals[0],
      ...normals[0], ...normals[0], ...normals[0],

      ...normals[2], ...normals[2], ...normals[2],
      ...normals[2], ...normals[2], ...normals[2],
    ]

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
    this.uModelLoc = gl.getUniformLocation(this.program, "u_model");
    this.uViewLoc = gl.getUniformLocation(this.program, "u_view");
    this.uProjectionLoc = gl.getUniformLocation(this.program, "u_projection");
  }

  createVAO(gl) {
    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.coords));

    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.colors));

    var normalsAttributeLocation = gl.getAttribLocation(this.program, "normal");
    const normalsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.normals));

    this.vaoLoc = Shader.createVAO(gl,
      coordsAttributeLocation, coordsBuffer, 
      colorsAttributeLocation, colorsBuffer, 
      normalsAttributeLocation, normalsBuffer);
  }  

  init(gl, light) {
    this.createShader(gl);
    this.createUniforms(gl);
    this.createVAO(gl);

    light.createUniforms(gl, this.program);
  }

  updateModelMatrix() {
    this.angle += 0.005;

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

  draw(gl, cam, light) {
    // faces orientadas no sentido anti-horário
    gl.frontFace(gl.CCW);

    // face culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // updates the model transformations
    this.updateModelMatrix();

    const model = this.model;
    const view = cam.getView();
    const proj = cam.getProj();

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uModelLoc, false, model);
    gl.uniformMatrix4fv(this.uViewLoc, false, view);
    gl.uniformMatrix4fv(this.uProjectionLoc, false, proj);

    gl.drawArrays(gl.TRIANGLES, 0, this.coords.length / 4);

    gl.disable(gl.CULL_FACE);
  }
}