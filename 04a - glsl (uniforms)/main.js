
import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';

import Shader from './shader.js';

class Scene {
  constructor(gl) {
    this.coords = [];
    this.colors = [];

    this.vertShd = null;
    this.fragShd = null;
    this.program = null;

    this.vaoLoc = -1;

    this.createShaderProgram(gl);
    this.createVAO(gl);

    this.translate = 0;

    this.uniformDpLoc = -1;
    this.uniformSLoc = -1;
    this.uniformAmbLoc = -1;

    this.createUniforms(gl);
  }

  createShaderProgram(gl) {
    this.vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.program = Shader.createProgram(gl, this.vertShd, this.fragShd);
  }

  createUniforms(gl) {
    this.uniformDpLoc = gl.getUniformLocation(this.program, "u_dp");
    gl.uniform1f(this.uniformDpLoc, 0.5);

    this.uniformSLoc = gl.getUniformLocation(this.program, "u_s");
    gl.uniform1f(this.uniformSLoc, 0.5);

    this.uniformAmbLoc = gl.getUniformLocation(this.program, "u_amb");
    gl.uniform4fv(this.uniformAmbLoc, [0, 0, 1, 1]);
  }

  createVAO(gl) {
    this.coords = [
      0.0, 0.0, 0.0, 1.0,
     -1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,

      0.0, 1.0, 0.0, 1.0,
      0.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,

      0.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      0.0,-1.0, 0.0, 1.0
    ];

    this.colors = [
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,

      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0
    ];

    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");

    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.coords));
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.colors));

    this.vaoLoc = Shader.createVAO(gl, coordsAttributeLocation, coordsBuffer, colorsAttributeLocation, colorsBuffer);
  }

  draw(gl) {
    this.translate += (this.translate < 0.5) ? 0.001 : -0.5;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoLoc);

    gl.uniform1f(this.uniformDpLoc, this.translate);
    gl.uniform1f(this.uniformSLoc, 0.5);
    gl.uniform4fv(this.uniformAmbLoc, [0.5, 0.5, 0.5, 1.0]);

    gl.drawArrays(gl.TRIANGLES, 0, 9);
  }
}

class Main {
  constructor() {
    const canvas = document.querySelector("#glcanvas");

    this.gl = canvas.getContext("webgl2");
    this.scene = new Scene(this.gl);

    var devicePixelRatio = window.devicePixelRatio || 1;
    this.gl.canvas.width = 1024 * devicePixelRatio;
    this.gl.canvas.height = 768 * devicePixelRatio;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  draw() {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.scene.draw(this.gl);

    requestAnimationFrame(this.draw.bind(this));
  }

}

const app = new Main();
app.draw();
