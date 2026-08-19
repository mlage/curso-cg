import { toTypedArray } from './utils.js';

class GPUCanvas {
    /**
     * Inicializa o wrapper com o canvas e os recursos principais do WebGPU.
     */
    constructor(canvas, device, context, format, options = {}) {
        this.canvas = canvas;
        this.device = device;
        this.context = context;
        this.format = format;
        this.clearColor = options.clearColor ?? { r: 0, g: 0, b: 0, a: 1 };
        this.clearDepthValue = options.clearDepthValue ?? 1.0;
        this.depthEnabled = options.depth ?? true;
        this.depthFormat = options.depthFormat ?? 'depth24plus';
        this.depthTexture = null;
    }

    /**
     * Ajusta o tamanho interno do canvas considerando o device pixel ratio.
     */
    resize(width, height) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = height * devicePixelRatio;
        this.updateDepthTexture();
    }

    /**
     * Recria a textura de profundidade quando o canvas muda de tamanho.
     */
    updateDepthTexture() {
        if (!this.depthEnabled) {
            return;
        }

        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: this.depthFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    /**
     * Cria um pipeline de renderização a partir dos shaders e opções fornecidas.
     */
    createProgram(vertexShaderSource, fragmentShaderSource, options = {}) {
        const {
            topology = 'triangle-list',
            cullMode = 'none',
            frontFace = 'ccw',
            depth = this.depthEnabled,
            depthWriteEnabled = depth,
            depthCompare = 'less',
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
                cullMode,
                frontFace,
            },
            depthStencil: depth ? {
                format: this.depthFormat,
                depthWriteEnabled,
                depthCompare,
            } : undefined,
        });
    }

    /**
     * Normaliza a definição de uma geometria e cria seus buffers.
     */
    createShape(shape, vertexCount) {
        const config = Array.isArray(shape)
            ? { buffers: shape, vertexCount }
            : shape;

        return {
            buffers: config.buffers.map((data) => this.createVertexBuffer(data)),
            vertexCount: config.vertexCount,
            indexBuffer: config.indices ? this.createIndexBuffer(config.indices, config.indexFormat ?? 'uint32') : null,
            indexCount: config.indices ? config.indices.length : 0,
            indexFormat: config.indexFormat ?? 'uint32',
        };
    }

    /**
     * Cria um buffer de GPU e copia os dados iniciais para ele.
     */
    createBuffer(data, usage, size = null, ArrayType = Float32Array) {
        const source = toTypedArray(data, ArrayType);
        const buffer = this.device.createBuffer({
            size: size ?? source.byteLength,
            usage,
            mappedAtCreation: true,
        });

        new source.constructor(buffer.getMappedRange()).set(source);
        buffer.unmap();

        return buffer;
    }

    /**
     * Cria um vertex buffer com os dados informados.
     */
    createVertexBuffer(data) {
        return this.createBuffer(data, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    }

    /**
     * Cria um index buffer usando o formato de índice especificado.
     */
    createIndexBuffer(data, indexFormat = 'uint32') {
        const ArrayType = indexFormat === 'uint16' ? Uint16Array : Uint32Array;
        return this.createBuffer(data, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, null, ArrayType);
    }

    /**
     * Cria um uniform buffer alinhado aos requisitos do WebGPU.
     */
    createUniformBuffer(data) {
        const source = toTypedArray(data);
        const size = Math.ceil(source.byteLength / 16) * 16;
        const buffer = this.device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.writeBuffer(buffer, source);

        return buffer;
    }

    /**
     * Atualiza o conteúdo de um buffer existente a partir de um offset.
     */
    writeBuffer(buffer, data, offset = 0) {
        const source = toTypedArray(data);
        this.device.queue.writeBuffer(buffer, offset, source);
    }

    /**
     * Cria um bind group usando o layout esperado pelo pipeline.
     */
    createBindGroup(program, entries, groupIndex = 0) {
        return this.device.createBindGroup({
            layout: program.getBindGroupLayout(groupIndex),
            entries,
        });
    }

    /**
     * Cria um bind group simples para expor um uniform buffer ao shader.
     */
    createUniformBindGroup(program, buffer, binding = 0, groupIndex = 0) {
        return this.createBindGroup(program, [{
            binding,
            resource: { buffer },
        }], groupIndex);
    }

    /**
     * Cria um sampler com as opções de amostragem informadas.
     */
    createSampler(options = {}) {
        return this.device.createSampler(options);
    }

    /**
     * Carrega uma imagem por URL e a converte em textura.
     */
    async createTextureFromImage(url, options = {}) {
        const response = await fetch(url);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        return this.createTextureFromSource(image, options);
    }

    /**
     * Cria uma textura a partir de uma fonte de imagem já carregada.
     */
    createTextureFromSource(source, options = {}) {
        const {
            format = 'rgba8unorm',
            usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        } = options;

        const texture = this.device.createTexture({
            size: [source.width, source.height, 1],
            format,
            usage,
        });

        this.device.queue.copyExternalImageToTexture(
            { source },
            { texture },
            [source.width, source.height],
        );

        return texture;
    }

    start() {
        if (!this.encoder) {
            this.encoder = this.device.createCommandEncoder();
            this.pass = this.encoder.beginRenderPass({
                colorAttachments: [{
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: this.clearColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
                depthStencilAttachment: this.depthEnabled ? {
                    view: this.depthTexture.createView(),
                    depthClearValue: this.clearDepthValue,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                } : undefined,
            });
        }
    }

    /**
     * Agenda o desenho de uma geometria no render pass atual.
     */
    draw(program, shape, bindGroups = []) {
         if (!this.pass) {
            return;
         }

        this.pass.setPipeline(program);

        shape.buffers.forEach((buffer, index) => {
            this.pass.setVertexBuffer(index, buffer);
        });

        bindGroups.forEach((bindGroup, index) => {
            this.pass.setBindGroup(index, bindGroup);
        });

        if (shape.indexBuffer) {
            this.pass.setIndexBuffer(shape.indexBuffer, shape.indexFormat);
            this.pass.drawIndexed(shape.indexCount);
            return;
        }

        this.pass.draw(shape.vertexCount);
        this.pass.end();
    }

    /**
     * Finaliza o pass atual e envia os comandos para a GPU.
     */
    finish() {
        if (!this.encoder) {
            return;
        }

        this.device.queue.submit([this.encoder.finish()]);
        this.encoder = null;
        this.pass = null;
    }
}

export default class WebGPU {
    /**
     * Cria, configura e retorna um canvas pronto para uso com WebGPU.
     */
    static async createCanvas(selector, width, height, options = {}) {
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

        const gpu = new GPUCanvas(canvas, device, context, format, options);
        gpu.resize(width, height);

        context.configure({
            device,
            format,
            alphaMode: 'opaque',
        });

        return gpu;
    }
}
