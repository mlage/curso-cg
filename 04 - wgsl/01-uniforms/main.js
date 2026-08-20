import vertShaderSrc from './uniforms.vert.js';
import fragShaderSrc from './uniforms.frag.js';
import WebGPU from '../../lib/webgpu.js';

class Scene {
    constructor(gpu) {
        this.translate = 0;
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc);

        this.shape = gpu.createShape([
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
