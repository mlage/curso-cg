import vertShaderSrc from './phong.vert.js';
import fragShaderSrc from './phong.frag.js';

import Shader from './shader.js';

import { HalfEdgeDS } from './half-edge.js';

export default class Mesh {
  constructor(delta) {
    // model data structure
    this.heds = new HalfEdgeDS();

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
    this.indicesLoc = -1;

    this.uModelLoc = -1;
    this.uViewLoc = -1;
    this.uProjectionLoc = -1;

    // load mesh data
    this.loadMeshV3();
  }

  loadMeshV3() {
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
      ...[0.0, 0.0, 0.0, 1.0], // v0 
      ...[0.1, 0.0, 0.0, 1.0], // v1
      ...[0.1, 0.0, 0.1, 1.0], // v2
      ...[0.0, 0.0, 0.1, 1.0], // v3

      ...[0.0, 0.1, 0.0, 1.0], // v4
      ...[0.1, 0.1, 0.0, 1.0], // v5
      ...[0.1, 0.1, 0.1, 1.0], // v6
      ...[0.0, 0.1, 0.1, 1.0], // v7
    ];

    // orientação: sentido anti-horário
    const indices = [
      0, 3, 7,
      0, 7, 4,
      5, 1, 0,
      5, 0, 4,
      1, 2, 3,
      1, 3, 0,
      2, 6, 7,
      2, 7, 3,
      5, 6, 2,
      5, 2, 1,
      4, 7, 6,
      4, 6, 5,
    ];

    this.heds.build(coords, indices);
  }

  // loadMeshV2() {
  //   //   V4--------V5
  //   //   /|       /|
  //   //  / |      / |
  //   //V7-------V6  |
  //   // | V0-----|--V1
  //   // | /      | /
  //   // |/       |/
  //   //V3--------V2

  //   //        V4-----V5
  //   //        |  F1  |
  //   //        |      |
  //   // V4-----V0-----V1-----V5-----V4
  //   // |  F0  |  F2  |  F4  |  F5  |
  //   // |      |      |      |      |
  //   // V7-----V3-----V2-----V6-----V7
  //   //        |  F3  |
  //   //        |      |
  //   //        V7-----V6

  //   this.coords = [
  //     ...[0.0, 0.0, 0.0, 1.0], // v0 
  //     ...[0.1, 0.0, 0.0, 1.0], // v1
  //     ...[0.1, 0.0, 0.1, 1.0], // v2
  //     ...[0.0, 0.0, 0.1, 1.0], // v3

  //     ...[0.0, 0.1, 0.0, 1.0], // v4
  //     ...[0.1, 0.1, 0.0, 1.0], // v5
  //     ...[0.1, 0.1, 0.1, 1.0], // v6
  //     ...[0.0, 0.1, 0.1, 1.0], // v7
  //   ];

  //   // orientação: sentido anti-horário
  //   this.indices = [
  //     0, 3, 7,
  //     0, 7, 4,
  //     5, 1, 0,
  //     5, 0, 4,
  //     1, 2, 3,
  //     1, 3, 0,
  //     2, 6, 7,
  //     2, 7, 3,
  //     5, 6, 2,
  //     5, 2, 1,
  //     4, 7, 6,
  //     4, 6, 5,
  //   ];

  //   this.colors = [
  //     0.5, 0.5, 0.5, 1.0,
  //     0.5, 0.5, 0.5, 1.0,
  //     0.5, 0.5, 0.5, 1.0,
  //     0.5, 0.5, 0.5, 1.0,

  //     0.5, 0.5, 0.5, 1.0,
  //     0.5, 0.5, 0.5, 1.0,
  //     0.5, 0.5, 0.5, 1.0,
  //     0.5, 0.5, 0.5, 1.0,
  //   ];

  //   this.normals = new Array(this.coords.length).fill(0);

  //   for (let fId = 0; fId < this.indices.length; fId += 3) {
  //     const v0Id = this.indices[fId + 0];
  //     const v1Id = this.indices[fId + 1];
  //     const v2Id = this.indices[fId + 2];

  //     const v0 = this.coords.slice(4 * v0Id, 4 * v0Id + 4);
  //     const v1 = this.coords.slice(4 * v1Id, 4 * v1Id + 4);
  //     const v2 = this.coords.slice(4 * v2Id, 4 * v2Id + 4);

  //     const vec1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]]; // v1-v0
  //     const vec2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]]; // v2-v0

  //     const n = [
  //       vec1[1] * vec2[2] - vec1[2] * vec2[1],
  //       vec1[2] * vec2[0] - vec1[0] * vec2[2],
  //       vec1[0] * vec2[1] - vec1[1] * vec2[0]
  //     ];

  //     this.normals[4 * v0Id + 0] += n[0];
  //     this.normals[4 * v0Id + 1] += n[1];
  //     this.normals[4 * v0Id + 2] += n[2];

  //     this.normals[4 * v1Id + 0] += n[0];
  //     this.normals[4 * v1Id + 1] += n[1];
  //     this.normals[4 * v1Id + 2] += n[2];

  //     this.normals[4 * v2Id + 0] += n[0];
  //     this.normals[4 * v2Id + 1] += n[1];
  //     this.normals[4 * v2Id + 2] += n[2];
  //   }
  // }

  // loadMesh() {
  //   //   V4--------V5
  //   //   /|       /|
  //   //  / |      / |
  //   //V7-------V6  |
  //   // | V0-----|--V1
  //   // | /      | /
  //   // |/       |/
  //   //V3--------V2

  //   //        V4-----V5
  //   //        |  F1  |
  //   //        |      |
  //   // V4-----V0-----V1-----V5-----V4
  //   // |  F0  |  F2  |  F4  |  F5  |
  //   // |      |      |      |      |
  //   // V7-----V3-----V2-----V6-----V7
  //   //        |  F3  |
  //   //        |      |
  //   //        V7-----V6

  //   const coords = [
  //     [0.0, 0.0, 0.0, 1.0], // v0 
  //     [0.1, 0.0, 0.0, 1.0], // v1
  //     [0.1, 0.0, 0.1, 1.0], // v2
  //     [0.0, 0.0, 0.1, 1.0], // v3

  //     [0.0, 0.1, 0.0, 1.0], // v4
  //     [0.1, 0.1, 0.0, 1.0], // v5
  //     [0.1, 0.1, 0.1, 1.0], // v6
  //     [0.0, 0.1, 0.1, 1.0], // v7
  //   ];

  //   const normals = [
  //     [ 1.0, 0.0, 0.0, 0.0], // f0
  //     [-1.0, 0.0, 0.0, 0.0], // f1
  //     [ 0.0, 1.0, 0.0, 0.0], // f2
  //     [ 0.0,-1.0, 0.0, 0.0], // f3
  //     [ 0.0, 0.0, 1.0, 0.0], // f4
  //     [ 0.0, 0.0,-1.0, 0.0], // f5
  //   ];

  //   const color = [
  //     [1.0, 0.0, 0.0, 1.0], // vermelho
  //     [0.0, 1.0, 0.0, 1.0], // verde
  //     [0.0, 0.0, 1.0, 1.0], // azul
  //     [1.0, 0.7, 0.7, 1.0], // vermelho claro
  //     [0.7, 1.0, 0.7, 1.0], // verde claro
  //     [0.7, 0.7, 1.0, 1.0]  // azul claro
  //   ];

  //   // orientação: sentido anti-horário
  //   this.coords = [
  //     ...coords[0], ...coords[3], ...coords[7],
  //     ...coords[0], ...coords[7], ...coords[4],

  //     ...coords[5], ...coords[1], ...coords[0],
  //     ...coords[5], ...coords[0], ...coords[4],

  //     ...coords[1], ...coords[2], ...coords[3],
  //     ...coords[1], ...coords[3], ...coords[0],

  //     ...coords[2], ...coords[6], ...coords[7],
  //     ...coords[2], ...coords[7], ...coords[3],

  //     ...coords[5], ...coords[6], ...coords[2],
  //     ...coords[5], ...coords[2], ...coords[1],

  //     ...coords[4], ...coords[7], ...coords[6],
  //     ...coords[4], ...coords[6], ...coords[5],
  //   ];

  //   this.normals = [
  //     ...normals[1], ...normals[1], ...normals[1],
  //     ...normals[1], ...normals[1], ...normals[1],

  //     ...normals[3], ...normals[3], ...normals[3],
  //     ...normals[3], ...normals[3], ...normals[3],

  //     ...normals[5], ...normals[5], ...normals[5],
  //     ...normals[5], ...normals[5], ...normals[5],

  //     ...normals[4], ...normals[4], ...normals[4],
  //     ...normals[4], ...normals[4], ...normals[4],

  //     ...normals[0], ...normals[0], ...normals[0],
  //     ...normals[0], ...normals[0], ...normals[0],

  //     ...normals[2], ...normals[2], ...normals[2],
  //     ...normals[2], ...normals[2], ...normals[2],
  //   ]

  //   this.colors = [
  //     // F0 - X- (vermelho)
  //     ...color[0], ...color[0], ...color[0],
  //     ...color[0], ...color[0], ...color[0],

  //     // F1 - Z- (azul)
  //     ...color[2], ...color[2], ...color[2],
  //     ...color[2], ...color[2], ...color[2],

  //     // F2 - Y- (verde)
  //     ...color[1], ...color[1], ...color[1],
  //     ...color[1], ...color[1], ...color[1],

  //     // F3 - Z+(azul claro)
  //     ...color[5], ...color[5], ...color[5],
  //     ...color[5], ...color[5], ...color[5],

  //     // F4 - X+(vermelho claro)
  //     ...color[3], ...color[3], ...color[3],
  //     ...color[3], ...color[3], ...color[3],

  //     // F5 - Y+(verde claro)
  //     ...color[4], ...color[4], ...color[4],
  //     ...color[4], ...color[4], ...color[4],
  //   ];
  // }

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
    const vbos = this.heds.getVBOs();
    console.log(vbos);

    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbos[0]));

    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbos[1]));

    var normalsAttributeLocation = gl.getAttribLocation(this.program, "normal");
    const normalsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbos[2]));

    this.vaoLoc = Shader.createVAO(gl,
      coordsAttributeLocation, coordsBuffer, 
      colorsAttributeLocation, colorsBuffer, 
      normalsAttributeLocation, normalsBuffer);

    this.indicesLoc = Shader.createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(vbos[3]));
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

    gl.drawElements(gl.TRIANGLES, this.heds.faces.length * 3, gl.UNSIGNED_INT, 0);

    gl.disable(gl.CULL_FACE);
  }
}