import vertShaderSrc from './projection.vert.js';
import fragShaderSrc from './projection.frag.js';
import WebGPU from '../lib/webgpu.js';
import {
    createIdentityMat4,
    createLookAtMat4,
    createOrthographicMat4,
    createPerspectiveMat4,
    createRotationXMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

class Scene {
    constructor(gpu) {
        this.angleX = 0;
        this.cameraAngleY = 0;
        this.usePerspective = true;

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
            [1.0, 0.7, 0.7, 1.0], // X- (esquerda): vermelho claro
            [0.0, 0.0, 1.0, 1.0], // Z- (frente): azul escuro
            [0.7, 1.0, 0.7, 1.0], // Y- (base): verde claro
            [0.7, 0.7, 1.0, 1.0], // Z+ (fundo): azul claro
            [1.0, 0.0, 0.0, 1.0], // X+ (direita): vermelho escuro
            [0.0, 1.0, 0.0, 1.0], // Y+ (topo): verde escuro
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
        this.angleX += 0.01;

        const center = createTranslationMat4(-0.05, -0.05, -0.05);
        const rotateX = createRotationXMat4(this.angleX);
        const scale = createScaleMat4(5, 5, 5);
        const translate = createTranslationMat4(0, 0, 0.5);

        let model = createIdentityMat4();
        model = multiplyMat4(center, model);
        model = multiplyMat4(rotateX, model);
        model = multiplyMat4(scale, model);
        return multiplyMat4(translate, model);
    }

    createViewMatrix() {
        this.cameraAngleY += 0.01;

        const radius = 2.5;
        const eye = [
            Math.cos(this.cameraAngleY) * radius,
            0,
            0.5 + Math.sin(this.cameraAngleY) * radius,
        ];
        const at = [0, 0, 0.5];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up);
    }

    createProjectionMatrix() {
        const aspect = 1024 / 768;

        if (this.usePerspective) {
            return createPerspectiveMat4(Math.PI / 3, aspect, 0.1, 10);
        }

        return createOrthographicMat4(-1.5 * aspect, 1.5 * aspect, -1.5, 1.5, 0.1, 10);
    }

    draw(gpu) {
        const model = this.createModelMatrix();
        const view = this.createViewMatrix();
        const projection = this.createProjectionMatrix();

        // O objeto passa por model, depois view e, por fim, projection.
        const modelView = multiplyMat4(view, model);
        this.uniform.data.set(multiplyMat4(projection, modelView));
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
