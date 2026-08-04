import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';
import WebGPU from './webgpu.js';

class Scene {
  constructor(device, format) {
    this.vertexCount = 3;

    this.positions = new Float32Array([
      0.0, 0.0, 0.0, 1.0,
      -2.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
    ]);

    this.colors = new Float32Array([
      0.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
    ]);

    this.positionBuffer = WebGPU.createVertexBuffer(device, this.positions);
    this.colorBuffer = WebGPU.createVertexBuffer(device, this.colors);
    this.pipeline = WebGPU.createPipeline(device, format, vertShaderSrc, fragShaderSrc);
  }

  draw(pass) {
    WebGPU.draw(pass, this.pipeline, [this.positionBuffer, this.colorBuffer], this.vertexCount);
  }
}

class Main {
  constructor() {
    this.canvas = document.querySelector('#glcanvas');
    this.scene = null;
  }

  async init() {
    const gpu = await WebGPU.createContext(this.canvas);

    this.device = gpu.device;
    this.context = gpu.context;
    this.format = gpu.format;

    WebGPU.resizeCanvas(this.canvas, 1024, 768);
    WebGPU.configureCanvas(this.context, this.device, this.format);

    this.scene = new Scene(this.device, this.format);
    window.addEventListener('resize', () => WebGPU.resizeCanvas(this.canvas, 1024, 768));
  }

  draw() {
    const frame = WebGPU.beginRenderPass(this.device, this.context, {
      r: 0.8,
      g: 0.8,
      b: 0.8,
      a: 1.0,
    });

    this.scene.draw(frame.pass);
    WebGPU.endRenderPass(this.device, frame.encoder, frame.pass);

    requestAnimationFrame(this.draw.bind(this));
  }
}

try {
  const app = new Main();
  await app.init();
  app.draw();
} catch (error) {
  console.error(error);
  document.body.insertAdjacentHTML('beforeend', `<p>${error.message}</p>`);
}
