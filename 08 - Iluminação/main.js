import vertShaderSrc from './illumination.vert.js';
import fragShaderSrc from './illumination.frag.js';
import WebGPU from '../lib/webgpu.js';
import {
    createIdentityMat4,
    createLookAtMat4,
    createPerspectiveMat4,
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

        this.lightPosition = [0, 0, -0.5, 1];
        this.ambient = [1, 1, 1, 0.1];
        this.diffuse = [1, 1, 1, 0.7];
        this.specular = [1, 1, 1, 0.3];
        this.lightParams = [8, 0, 0, 0];

        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            cullMode: 'back',
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
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }],
                },
            ],
        });

        this.shape = gpu.createShape(this.createCube(), 36);
        this.uniform = gpu.createUniform(this.program, new Float32Array(68));
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

        const faceNormals = [
            [1.0, 0.0, 0.0, 0.0],
            [-1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, -1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, -1.0, 0.0],
        ];

        const faceColors = [
            [1.0, 0.0, 0.0, 1.0],
            [0.0, 1.0, 0.0, 1.0],
            [0.0, 0.0, 1.0, 1.0],
            [1.0, 0.7, 0.7, 1.0],
            [0.7, 1.0, 0.7, 1.0],
            [0.7, 0.7, 1.0, 1.0],
        ];

        const faces = [
            { vertices: [0, 3, 7, 0, 7, 4], normal: 1, color: 0 },
            { vertices: [5, 1, 0, 5, 0, 4], normal: 3, color: 2 },
            { vertices: [1, 2, 3, 1, 3, 0], normal: 5, color: 1 },
            { vertices: [2, 6, 7, 2, 7, 3], normal: 4, color: 5 },
            { vertices: [5, 6, 2, 5, 2, 1], normal: 0, color: 3 },
            { vertices: [4, 7, 6, 4, 6, 5], normal: 2, color: 4 },
        ];

        const positions = [];
        const colors = [];
        const normals = [];

        for (const face of faces) {
            for (const vertex of face.vertices) {
                positions.push(...vertices[vertex]);
                colors.push(...faceColors[face.color]);
                normals.push(...faceNormals[face.normal]);
            }
        }

        return [positions, colors, normals];
    }

    createModelMatrix() {
        this.angleX += 0.01;
        this.angleY += 0.005;
        this.angleZ += 0.0;

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
        const eye = [1, 1, -1];
        const at = [0, 0, 0.5];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up, true);
    }

    createProjectionMatrix() {
        const aspect = 1024 / 768;
        return createPerspectiveMat4(Math.PI / 3, aspect, 0.1, 10);
    }

    updateUniform(model, view, projection) {
        this.uniform.data.set(model, 0);
        this.uniform.data.set(view, 16);
        this.uniform.data.set(projection, 32);
        this.uniform.data.set(this.lightPosition, 48);
        this.uniform.data.set(this.ambient, 52);
        this.uniform.data.set(this.diffuse, 56);
        this.uniform.data.set(this.specular, 60);
        this.uniform.data.set(this.lightParams, 64);
    }

    draw(gpu) {
        const model = this.createModelMatrix();
        const view = this.createViewMatrix();
        const projection = this.createProjectionMatrix();

        this.updateUniform(model, view, projection);
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
