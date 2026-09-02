import vertShaderSrc from './transform.vert.js';
import fragShaderSrc from './transform.frag.js';
import WebGPU from '../lib/webgpu.js';
import {
    createIdentityMat4,
    createRotationYMat4,
    createRotationZMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

class Scene {
    constructor(gpu) {
        this.angleY = 0;
        this.angleZ = 0;

        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            cullMode: 'back',
        });

        this.shape = gpu.createShape(this.createCube(), 36);
        this.uniform = gpu.createUniform(this.program, createIdentityMat4());
    }

    createCube() {
        const vertices = [
            [0.0, 0.0, 0.0, 1.0],
            [0.1, 0.0, 0.0, 1.0],
            [0.1, 0.0, 0.1, 1.0],
            [0.0, 0.0, 0.1, 1.0],
            [0.0, 0.1, 0.0, 1.0],
            [0.1, 0.1, 0.0, 1.0],
            [0.1, 0.1, 0.1, 1.0],
            [0.0, 0.1, 0.1, 1.0],
        ];

        const faceColors = [
            [1.0, 0.0, 0.0, 1.0],
            [0.0, 0.0, 1.0, 1.0],
            [0.0, 1.0, 0.0, 1.0],
            [0.7, 0.7, 1.0, 1.0],
            [1.0, 0.7, 0.7, 1.0],
            [0.7, 1.0, 0.7, 1.0],
        ];

        const positions = [
            ...vertices[0], ...vertices[3], ...vertices[7],
            ...vertices[0], ...vertices[7], ...vertices[4],

            ...vertices[5], ...vertices[1], ...vertices[0],
            ...vertices[5], ...vertices[0], ...vertices[4],

            ...vertices[1], ...vertices[2], ...vertices[3],
            ...vertices[1], ...vertices[3], ...vertices[0],

            ...vertices[2], ...vertices[6], ...vertices[7],
            ...vertices[2], ...vertices[7], ...vertices[3],

            ...vertices[5], ...vertices[6], ...vertices[2],
            ...vertices[5], ...vertices[2], ...vertices[1],

            ...vertices[4], ...vertices[7], ...vertices[6],
            ...vertices[4], ...vertices[6], ...vertices[5],
        ];

        const colors = faceColors.flatMap((faceColor) => Array.from({ length: 6 }, () => faceColor).flat());

        return [positions, colors];
    }

    updateTransform() {
        this.angleZ += 0.01;
        this.angleY += 0.01;

        const rotateY = createRotationYMat4(this.angleY);
        const rotateZ = createRotationZMat4(this.angleZ);
        const center = createTranslationMat4(-0.05, -0.05, -0.05);
        const scale = createScaleMat4(5, 5, 5);
        const translate = createTranslationMat4(0, 0, 0.5);

        let model = createIdentityMat4();
        model = multiplyMat4(center, model);
        model = multiplyMat4(rotateY, model);
        model = multiplyMat4(rotateZ, model);
        model = multiplyMat4(scale, model);
        model = multiplyMat4(translate, model);

        this.uniform.data.set(model);
    }

    draw(gpu) {
        this.updateTransform();
        gpu.writeBuffer(this.uniform.buffer, this.uniform.data);
        gpu.draw(this.program, this.shape, [this.uniform.bindGroup]);
    }
}

class Main {
    async init() {
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768);
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
