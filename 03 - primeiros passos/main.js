
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
  }

  createShaderProgram(gl) {
    this.vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.program = Shader.createProgram(gl, this.vertShd, this.fragShd);
  }

  createVAO(gl) {
    this.coords = [
      0.0, 0.0, 0.0, 1.0,
      -2.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0
    ];

    this.colors = [
      0.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0
    ];

    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.coords));
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.colors));

    var coordsAttributeLocation = gl.getAttribLocation(this.program, "position");
    var colorsAttributeLocation = gl.getAttribLocation(this.program, "color");

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
    
    var devicePixelRatio = window.devicePixelRatio || 1;
    this.gl.canvas.width = 1024 * devicePixelRatio;
    this.gl.canvas.height = 768 * devicePixelRatio;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    
    this.scene = new Scene(this.gl);
  }

  draw() {
    this.gl.clearColor(0.8, 0.8, 0.8, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.scene.draw(this.gl);

    requestAnimationFrame(this.draw.bind(this));
  }

}

const app = new Main();
app.draw();