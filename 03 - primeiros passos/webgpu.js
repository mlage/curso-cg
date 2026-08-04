export default class WebGPU {
  static async createContext(canvas) {
    if (!navigator.gpu) {
      throw new Error('WebGPU não é suportado neste navegador.');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Não foi possível obter um adaptador WebGPU.');
    }

    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();

    return { device, context, format };
  }

  static resizeCanvas(canvas, width, height) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
  }

  static configureCanvas(context, device, format) {
    context.configure({
      device,
      format,
      alphaMode: 'opaque',
    });
  }

  static createVertexBuffer(device, data) {
    const buffer = device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  static createPipeline(device, format, vertexShaderSource, fragmentShaderSource) {
    const vertexModule = device.createShaderModule({ code: vertexShaderSource });
    const fragmentModule = device.createShaderModule({ code: fragmentShaderSource });

    return device.createRenderPipeline({
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

  static render(device, context, clearValue, draw) {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue,
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    draw(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  static draw(pass, pipeline, vertexBuffers, vertexCount) {
    pass.setPipeline(pipeline);

    for (const [index, buffer] of vertexBuffers.entries()) {
      pass.setVertexBuffer(index, buffer);
    }

    pass.draw(vertexCount);
  }

}
