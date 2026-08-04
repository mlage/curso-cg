import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';
import WebGPU from './webgpu.js';

class Scene {
    constructor(gpu) {
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc);

        this.triangle = gpu.createTriangle(
            [
                0.0, 0.0, 0.0, 1.0,
                -1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
            ],
            [
                0.0, 0.0, 1.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
            ],
        );
    }

    draw(gpu) {
        gpu.draw(this.program, this.triangle);
    }
}

class Main {
    async init() {
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768);
        this.scene = new Scene(this.gpu);
    }

    draw() {
        this.gpu.clear(0.8, 0.8, 0.8, 1.0);
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
