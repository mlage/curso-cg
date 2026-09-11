import vertShaderSrc from './camera.vert.js';
import fragShaderSrc from './camera.frag.js';
import WebGPU from '../lib/webgpu.js';
import {
    createIdentityMat4,
    createLookAtMat4,
    createRotationXMat4,
    createRotationYMat4,
    createRotationZMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

class Scene {
    constructor(gpu) {
        this.angleX = 0;
        this.angleY = 0;
        this.angleZ = 0;
        this.cameraPos = 0;

        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            cullMode: 'back',
        });

        this.shape = gpu.createShape(this.createCube(), 36);
        this.uniform = gpu.createUniform(this.program, createIdentityMat4());
    }

    createCube() {
        const vertices = [
            [0.0, 0.0, 0.0, 1.0], [0.1, 0.0, 0.0, 1.0],
            [0.1, 0.0, 0.1, 1.0], [0.0, 0.0, 0.1, 1.0],
            [0.0, 0.1, 0.0, 1.0], [0.1, 0.1, 0.0, 1.0],
            [0.1, 0.1, 0.1, 1.0], [0.0, 0.1, 0.1, 1.0],
        ];

        const faceColors = [
            [1.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0],
            [0.0, 0.0, 1.0, 1.0], [1.0, 0.7, 0.7, 1.0],
            [0.7, 1.0, 0.7, 1.0], [0.7, 0.7, 1.0, 1.0],
        ];

        const positions = [
            ...vertices[0], ...vertices[3], ...vertices[7], ...vertices[0], ...vertices[7], ...vertices[4],
            ...vertices[5], ...vertices[1], ...vertices[0], ...vertices[5], ...vertices[0], ...vertices[4],
            ...vertices[1], ...vertices[2], ...vertices[3], ...vertices[1], ...vertices[3], ...vertices[0],
            ...vertices[2], ...vertices[6], ...vertices[7], ...vertices[2], ...vertices[7], ...vertices[3],
            ...vertices[5], ...vertices[6], ...vertices[2], ...vertices[5], ...vertices[2], ...vertices[1],
            ...vertices[4], ...vertices[7], ...vertices[6], ...vertices[4], ...vertices[6], ...vertices[5],
        ];

        const colors = faceColors.flatMap((color) => Array(6).fill(color).flat());
        return [positions, colors];
    }

    createModelMatrix() {
        this.angleX += 0.02;
        this.angleY += 0.01;
        this.angleZ += 0.01;

        const center = createTranslationMat4(-0.05, -0.05, -0.05);
        const rotateX = createRotationXMat4(this.angleX);
        const rotateY = createRotationYMat4(this.angleY);
        const rotateZ = createRotationZMat4(this.angleZ);
        const scale = createScaleMat4(5, 5, 5);
        const translate = createTranslationMat4(0, 0, 0.5);

        let model = createIdentityMat4();
        model = multiplyMat4(center, model);
        model = multiplyMat4(rotateX, model);
        model = multiplyMat4(rotateY, model);
        model = multiplyMat4(rotateZ, model);
        model = multiplyMat4(scale, model);
        return multiplyMat4(translate, model);
    }

    createViewMatrix() {
        this.cameraPos += 0.01;
        this.cameraPos = this.cameraPos > 1 ? -1 : this.cameraPos;

        // A câmera se move de -1 até 1 no eixo Y, sempre apontando para frente.
        const eye = [0, this.cameraPos, 0.0];
        const at = [0, this.cameraPos, 0.5];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up);
    }

    draw(gpu) {
        const model = this.createModelMatrix();
        const view = this.createViewMatrix();

        // A câmera transforma o objeto já posicionado no mundo: view * model.
        this.uniform.data.set(multiplyMat4(view, model));
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
