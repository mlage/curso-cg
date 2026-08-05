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

    createProgram(vertexShaderSource, fragmentShaderSource, options = {}) {
        const {
            topology = 'triangle-list',
            buffers = [
                {
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }],
                },
                {
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x4' }],
                },
            ],
        } = options;

        const vertexModule = this.device.createShaderModule({ code: vertexShaderSource });
        const fragmentModule = this.device.createShaderModule({ code: fragmentShaderSource });

        return this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: vertexModule,
                entryPoint: 'main',
                buffers,
            },
            fragment: {
                module: fragmentModule,
                entryPoint: 'main',
                targets: [{ format: this.format }],
            },
            primitive: {
                topology,
            },
        });
    }

    createShape(buffers, vertexCount) {
        return {
            buffers: buffers.map((data) => this.createVertexBuffer(new Float32Array(data))),
            vertexCount,
        };
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

    createUniformBuffer(data) {
        const buffer = this.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.writeBuffer(buffer, data);

        return buffer;
    }

    writeBuffer(buffer, data) {
        this.device.queue.writeBuffer(buffer, 0, data);
    }

    createUniformBindGroup(program, buffer, binding = 0) {
        return this.device.createBindGroup({
            layout: program.getBindGroupLayout(0),
            entries: [{
                binding,
                resource: { buffer },
            }],
        });
    }

    clear(r, g, b, a) {
        this.clearColor = { r, g, b, a };
    }

    draw(program, shape, bindGroups = []) {
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

        shape.buffers.forEach((buffer, index) => {
            this.pass.setVertexBuffer(index, buffer);
        });

        bindGroups.forEach((bindGroup, index) => {
            this.pass.setBindGroup(index, bindGroup);
        });

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
