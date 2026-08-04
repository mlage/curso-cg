import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';

class Scene {
  constructor(device, format) {
    this.device = device;
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

    this.positionBuffer = this.createVertexBuffer(this.positions);
    this.colorBuffer = this.createVertexBuffer(this.colors);
    this.pipeline = this.createPipeline(format);
  }

  createVertexBuffer(data) {
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  createPipeline(format) {
    const vertexModule = this.device.createShaderModule({ code: vertShaderSrc });
    const fragmentModule = this.device.createShaderModule({ code: fragShaderSrc });

    return this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 4 * 4,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }],
          },
          {
            arrayStride: 4 * 4,
            attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x4' }],
          },
        ],
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  draw(pass) {
    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.positionBuffer);
    pass.setVertexBuffer(1, this.colorBuffer);
    pass.draw(this.vertexCount);
  }
}

class Main {
  constructor() {
    this.canvas = document.querySelector('#glcanvas');
    this.device = null;
    this.context = null;
    this.scene = null;
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error('WebGPU não é suportado neste navegador.');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Não foi possível obter um adaptador WebGPU.');
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.resize();

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });

    this.scene = new Scene(this.device, this.format);
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = 1024 * devicePixelRatio;
    this.canvas.height = 768 * devicePixelRatio;
  }

  draw() {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    this.scene.draw(pass);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
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
