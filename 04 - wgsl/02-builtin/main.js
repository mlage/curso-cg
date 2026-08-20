import vertShaderSrc from './builtin.vert.js';
import fragShaderSrc from './builtin.frag.js';
import WebGPU from '../../lib/webgpu.js';

class Scene {
    constructor(gpu) {
        this.translate = 0;
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            buffers: [
                {
                    arrayStride: 2 * 4,
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
                },
                {
                    arrayStride: 2 * 4,
                    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }],
                },
                {
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }],
                },
            ],
        });

        const points = [
            { center: [0.0, 0.0], color: [0.0, 0.0, 1.0, 1.0] },
            { center: [-1.0, 0.0], color: [1.0, 0.0, 0.0, 1.0] },
            { center: [0.0, 1.0], color: [0.0, 1.0, 0.0, 1.0] },
        ];
        const corners = [
            [-1.0, -1.0],
            [1.0, -1.0],
            [-1.0, 1.0],
            [-1.0, 1.0],
            [1.0, -1.0],
            [1.0, 1.0],
        ];

        const centers = [];
        const quadCorners = [];
        const colors = [];

        points.forEach(({ center: [cx, cy], color }) => {
            corners.forEach(([ox, oy]) => {
                centers.push(cx, cy);
                quadCorners.push(ox, oy);
                colors.push(...color);
            });
        });

        this.shape = gpu.createShape([centers, quadCorners, colors], points.length * 6);

        this.uniformData = new Float32Array([
            0.0, 0.5, 0.0, 0.0,
            gpu.canvas.width, gpu.canvas.height, 48.0, 0.0,
        ]);
        this.uniformBuffer = gpu.createUniformBuffer(this.uniformData);
        this.uniformBindGroup = gpu.createUniformBindGroup(this.program, this.uniformBuffer);
    }

    draw(gpu) {
        this.translate += (this.translate < 0.5) ? 0.001 : -0.5;
        this.uniformData[0] = this.translate;
        gpu.writeBuffer(this.uniformBuffer, this.uniformData);
        gpu.draw(this.program, this.shape, [this.uniformBindGroup]);
    }
}

class Main {
    async init() {
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768, {
            clearColor: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        });
        this.scene = new Scene(this.gpu);
    }

    draw() {
        this.gpu.start();
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
