class GPUCanvas {
    constructor(canvas, device, context, format) {
        this.canvas = canvas;
        this.device = device;
        this.context = context;
        this.format = format;
        this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
    }

    resize(width, height) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = height * devicePixelRatio;
    }

    createProgram(vertexShaderSource, fragmentShaderSource) {
        const vertexModule = this.device.createShaderModule({ code: vertexShaderSource });
        const fragmentModule = this.device.createShaderModule({ code: fragmentShaderSource });

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
                targets: [{ format: this.format }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });
    }

    createTriangle(positions, colors) {
        return {
            positionBuffer: this.createVertexBuffer(new Float32Array(positions)),
            colorBuffer: this.createVertexBuffer(new Float32Array(colors)),
            vertexCount: 3,
        };
    }

    createVertexBuffer(data) {
        const buffer = this.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });

        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();

        return buffer;
    }

    clear(r, g, b, a) {
        this.clearColor = { r, g, b, a };
    }

    draw(program, shape) {
        if (!this.encoder) {
            this.encoder = this.device.createCommandEncoder();
            this.pass = this.encoder.beginRenderPass({
                colorAttachments: [{
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: this.clearColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });
        }

        this.pass.setPipeline(program);
        this.pass.setVertexBuffer(0, shape.positionBuffer);
        this.pass.setVertexBuffer(1, shape.colorBuffer);
        this.pass.draw(shape.vertexCount);
    }

    finish() {
        this.pass.end();
        this.device.queue.submit([this.encoder.finish()]);
        this.encoder = null;
        this.pass = null;
    }
}

export default class WebGPU {
    static async createCanvas(selector, width, height) {
        const canvas = document.querySelector(selector);

        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported in this browser.');
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('Could not get a WebGPU adapter.');
        }

        const device = await adapter.requestDevice();
        const context = canvas.getContext('webgpu');
        const format = navigator.gpu.getPreferredCanvasFormat();

        const gpu = new GPUCanvas(canvas, device, context, format);
        gpu.resize(width, height);

        context.configure({
            device,
            format,
            alphaMode: 'opaque',
        });

        return gpu;
    }
}
