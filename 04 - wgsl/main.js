import uniformsVertShaderSrc from './uniforms.vert.js';
import uniformsFragShaderSrc from './uniforms.frag.js';
import builtinVertShaderSrc from './builtin.vert.js';
import builtinFragShaderSrc from './builtin.frag.js';
import WebGPU from './webgpu.js';

class Scene {
    constructor(gpu) {
        this.translate = 0;

        this.uniformProgram = gpu.createProgram(
            uniformsVertShaderSrc,
            uniformsFragShaderSrc,
        );

        this.uniformShape = gpu.createShape([
            [
                0.0, 0.0, 0.0, 1.0,
                -1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,

                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,

                0.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                0.0, -1.0, 0.0, 1.0,
            ],
            [
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,

                0.0, 1.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,

                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
            ],
        ], 9);

        this.uniformData = new Float32Array([
            0.0, 0.5, 0.0, 0.0,
            0.5, 0.5, 0.5, 1.0,
        ]);
        this.uniformBuffer = gpu.createUniformBuffer(this.uniformData);
        this.uniformBindGroup = gpu.createUniformBindGroup(this.uniformProgram, this.uniformBuffer);

        this.builtinProgram = gpu.createProgram(
            builtinVertShaderSrc,
            builtinFragShaderSrc,
            {
                buffers: [
                    {
                        arrayStride: 4 * 4,
                        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }],
                    },
                    {
                        arrayStride: 4 * 4,
                        attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x4' }],
                    },
                    {
                        arrayStride: 2 * 4,
                        attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }],
                    },
                ],
            },
        );

        const halfSize = 0.18;
        const circles = [
            { center: [0.0, 0.0], color: [0.0, 0.0, 1.0, 1.0] },
            { center: [-1.0, 0.0], color: [1.0, 0.0, 0.0, 1.0] },
            { center: [0.0, 1.0], color: [0.0, 1.0, 0.0, 1.0] },
        ];

        const positions = [];
        const colors = [];
        const centers = [];

        circles.forEach(({ center: [cx, cy], color }) => {
            const quad = [
                [cx - halfSize, cy - halfSize],
                [cx + halfSize, cy - halfSize],
                [cx - halfSize, cy + halfSize],
                [cx - halfSize, cy + halfSize],
                [cx + halfSize, cy - halfSize],
                [cx + halfSize, cy + halfSize],
            ];

            quad.forEach(([x, y]) => {
                positions.push(x, y, 0.0, 1.0);
                colors.push(...color);
                centers.push(cx, cy);
            });
        });

        this.builtinShape = gpu.createShape([positions, colors, centers], positions.length / 4);
        this.builtinData = new Float32Array([
            0.0, 0.5, 0.0, 0.0,
            gpu.canvas.width, gpu.canvas.height, 48.0, 0.0,
        ]);
        this.builtinBuffer = gpu.createUniformBuffer(this.builtinData);
        this.builtinBindGroup = gpu.createUniformBindGroup(this.builtinProgram, this.builtinBuffer);
    }

    draw(gpu) {
        this.translate += (this.translate < 0.5) ? 0.001 : -0.5;

        this.uniformData[0] = this.translate;
        gpu.writeBuffer(this.uniformBuffer, this.uniformData);
        gpu.draw(this.uniformProgram, this.uniformShape, [this.uniformBindGroup]);

        this.builtinData[0] = this.translate;
        gpu.writeBuffer(this.builtinBuffer, this.builtinData);
        gpu.draw(this.builtinProgram, this.builtinShape, [this.builtinBindGroup]);
    }
}

class Main {
    async init() {
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768);
        this.scene = new Scene(this.gpu);
    }

    draw() {
        this.gpu.clear(1.0, 1.0, 1.0, 1.0);
        this.scene.draw(this.gpu);
        this.gpu.finish();

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
