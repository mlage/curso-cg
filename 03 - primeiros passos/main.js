
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

    this.init(gl);
  }

  init(gl) {
    this.createShaderProgram(gl);
    this.createVAO(gl);
  }

  createShaderProgram(gl) {
    this.vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.program = Shader.createProgram(gl, this.vertShd, this.fragShd);
  }

  createVAO(gl) {
    this.coords = [
      0.0, 0.0, 0.0, 1.0,
      -1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0
    ];

    this.colors = [
      0.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0
    ];

    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.coords));

    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.colors));

    this.vaoLoc = Shader.createVAO(gl, coordsAttributeLocation, coordsBuffer, colorsAttributeLocation, colorsBuffer);
  }

  draw(gl) {
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoLoc);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
    this.gl.canvas.width = 1024 * devicePixelRatio
    this.gl.canvas.height = 768 * devicePixelRatio

    this.gl.clearColor(0.0, 0.0, 0.0, 1);
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