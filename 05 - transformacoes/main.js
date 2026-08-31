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
        // Evolução do exemplo anterior: em vez de deslocar um triângulo com um vec4,
        // agora enviamos uma matriz 4x4 para transformar um cubo 3D.
        this.angle = 0;
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
        this.angle += 0.01;

        const rotateY = createRotationYMat4(this.angle);
        const rotateZ = createRotationZMat4(this.angle);
        const translate = createTranslationMat4(-0.5, -0.5, -0.5);
        const scale = createScaleMat4(10, 10, 10);

        // A ordem segue a ideia apresentada em CG:
        // primeiro escalamos o cubo unitário, depois centralizamos,
        // e por fim aplicamos as rotações.
        let model = multiplyMat4(rotateY, rotateZ);
        model = multiplyMat4(model, translate);
        model = multiplyMat4(model, scale);

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
