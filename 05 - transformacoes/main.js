
import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';

import Shader from './shader.js';

class Scene {
  constructor(gl) {
    this.coords = [];
    this.colors = [];

    this.angle = 0;
    this.mat = mat4.create();
    this.uniformLoc = -1;

    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    this.vaoLoc = -1;

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

  objectTransformation() {
    this.angle += 0.005;
    mat4.identity( this.mat );

    mat4.rotateY(this.mat, this.mat, this.angle);
    // [ cos(this.angle) 0 -sin(this.angle) 0, 
    //         0         1        0         0, 
    //   sin(this.angle) 0  cos(this.angle) 0, 
    //         0         0        0         1]
    // * this.mat 

    mat4.translate(this.mat, this.mat, [-0.5, -0.5, -0.5]);
    // [1 0 0 -0.5, 0 1 0 -0.5, 0 0 1 -0.5, 0 0 0 1] * this.mat 

    mat4.scale(this.mat, this.mat, [10, 10, 10]);
    // [10 0 0 0, 0 10 0 0, 0 0 10 0, 0 0 0 1] * this.mat 
  }


  draw(gl) {  
    // faces orientadas no sentido anti-horário
    gl.frontFace(gl.CCW);

    // face culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoLoc);

    this.objectTransformation();
    gl.uniformMatrix4fv(this.uniformLoc, false, this.mat);

    gl.drawArrays(gl.TRIANGLES, 0, this.coords.length / 4);

    gl.disable(gl.CULL_FACE);
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

    this.scene.draw(this.gl);

    requestAnimationFrame(this.draw.bind(this));
  }
}

window.onload = () => {
  const app = new Main();
  app.draw();
}


