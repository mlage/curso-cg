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
        this.uniform = gpu.createUniform(this.program, new Float32Array(84));
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

    createNormalMatrix(modelView) {
        const m00 = modelView[0], m01 = modelView[1], m02 = modelView[2], m03 = modelView[3];
        const m10 = modelView[4], m11 = modelView[5], m12 = modelView[6], m13 = modelView[7];
        const m20 = modelView[8], m21 = modelView[9], m22 = modelView[10], m23 = modelView[11];
        const m30 = modelView[12], m31 = modelView[13], m32 = modelView[14], m33 = modelView[15];

        const b00 = m00 * m11 - m01 * m10;
        const b01 = m00 * m12 - m02 * m10;
        const b02 = m00 * m13 - m03 * m10;
        const b03 = m01 * m12 - m02 * m11;
        const b04 = m01 * m13 - m03 * m11;
        const b05 = m02 * m13 - m03 * m12;
        const b06 = m20 * m31 - m21 * m30;
        const b07 = m20 * m32 - m22 * m30;
        const b08 = m20 * m33 - m23 * m30;
        const b09 = m21 * m32 - m22 * m31;
        const b10 = m21 * m33 - m23 * m31;
        const b11 = m22 * m33 - m23 * m32;

        const determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (determinant === 0) {
            throw new Error('Model-view matrix must be invertible to transform normals.');
        }

        const invDet = 1 / determinant;

        const inverse = new Float32Array([
            (m11 * b11 - m12 * b10 + m13 * b09) * invDet,
            (m12 * b08 - m10 * b11 - m13 * b07) * invDet,
            (m10 * b10 - m11 * b08 + m13 * b06) * invDet,
            (m11 * b07 - m10 * b09 - m12 * b06) * invDet,
            (m02 * b10 - m01 * b11 - m03 * b09) * invDet,
            (m00 * b11 - m02 * b08 + m03 * b07) * invDet,
            (m01 * b08 - m00 * b10 - m03 * b06) * invDet,
            (m00 * b09 - m01 * b07 + m02 * b06) * invDet,
            (m31 * b05 - m32 * b04 + m33 * b03) * invDet,
            (m32 * b02 - m30 * b05 - m33 * b01) * invDet,
            (m30 * b04 - m31 * b02 + m33 * b00) * invDet,
            (m31 * b01 - m30 * b03 - m32 * b00) * invDet,
            (m22 * b04 - m21 * b05 - m23 * b03) * invDet,
            (m20 * b05 - m22 * b02 + m23 * b01) * invDet,
            (m21 * b02 - m20 * b04 - m23 * b00) * invDet,
            (m20 * b03 - m21 * b01 + m22 * b00) * invDet,
        ]);

        // Matriz normal: transpose(inverse(modelView)).
        return new Float32Array([
            inverse[0], inverse[4], inverse[8], inverse[12],
            inverse[1], inverse[5], inverse[9], inverse[13],
            inverse[2], inverse[6], inverse[10], inverse[14],
            inverse[3], inverse[7], inverse[11], inverse[15],
        ]);
    }

    updateUniform(model, view, projection) {
        const modelView = multiplyMat4(view, model);
        const normalMatrix = this.createNormalMatrix(modelView);

        this.uniform.data.set(model, 0);
        this.uniform.data.set(view, 16);
        this.uniform.data.set(projection, 32);
        this.uniform.data.set(normalMatrix, 48);
        this.uniform.data.set(this.lightPosition, 64);
        this.uniform.data.set(this.ambient, 68);
        this.uniform.data.set(this.diffuse, 72);
        this.uniform.data.set(this.specular, 76);
        this.uniform.data.set(this.lightParams, 80);
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
