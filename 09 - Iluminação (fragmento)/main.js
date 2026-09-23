import vertShaderSrc from './illumination.vert.js';
import fragShaderSrc from './illumination.frag.js';
import WebGPU from '../lib/webgpu.js';
import {
    calculateTriangleNormal,
    createIdentityMat4,
    createLookAtMat4,
    createNormalMat4,
    createPerspectiveMat4,
    createRotationYMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

class Mesh {
    constructor(gpu, program, delta) {
        this.angle = 0;
        this.delta = delta;
        this.program = program;
        this.shape = gpu.createShape(this.createCube());
        this.uniform = gpu.createUniform(program, new Float32Array(84));
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

        const indices = [
            0, 3, 7, 0, 7, 4,
            5, 1, 0, 5, 0, 4,
            1, 2, 3, 1, 3, 0,
            2, 6, 7, 2, 7, 3,
            5, 6, 2, 5, 2, 1,
            4, 7, 6, 4, 6, 5,
        ];

        const colors = [
            [1.0, 0.0, 0.0, 1.0],
            [1.0, 0.5, 0.5, 1.0],
            [1.0, 0.5, 0.5, 1.0],
            [1.0, 0.5, 0.5, 1.0],
            [1.0, 0.5, 0.5, 1.0],
            [1.0, 0.5, 0.5, 1.0],
            [1.0, 0.5, 0.5, 1.0],
            [1.0, 0.5, 0.5, 1.0],
        ];

        return {
            buffers: [
                vertices.flat(),
                colors.flat(),
                this.calculateNormals(vertices, indices).flat(),
            ],
            indices,
            indexFormat: 'uint16',
            vertexCount: vertices.length,
        };
    }

    calculateNormals(vertices, indices) {
        const normals = vertices.map(() => [0, 0, 0, 0]);

        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i];
            const b = indices[i + 1];
            const c = indices[i + 2];
            const normal = calculateTriangleNormal(vertices[a], vertices[b], vertices[c]);

            for (const index of [a, b, c]) {
                normals[index][0] += normal[0];
                normals[index][1] += normal[1];
                normals[index][2] += normal[2];
            }
        }

        return normals.map((normal) => {
            const length = Math.hypot(normal[0], normal[1], normal[2]);
            return length === 0
                ? [0, 0, 0, 0]
                : [normal[0] / length, normal[1] / length, normal[2] / length, 0];
        });
    }

    createModelMatrix() {
        this.angle += 0.005;

        const scale = createScaleMat4(5, 5, 5);
        const center = createTranslationMat4(-0.25, -0.25, -0.25);
        const rotate = createRotationYMat4(this.angle);
        const translate = createTranslationMat4(this.delta, 0, 0);

        let model = createIdentityMat4();
        model = multiplyMat4(scale, model);
        model = multiplyMat4(center, model);
        model = multiplyMat4(rotate, model);
        return multiplyMat4(translate, model);
    }

    updateUniform(model, view, projection, light) {
        const modelView = multiplyMat4(view, model);
        const normalMatrix = createNormalMat4(modelView);

        this.uniform.data.set(model, 0);
        this.uniform.data.set(view, 16);
        this.uniform.data.set(projection, 32);
        this.uniform.data.set(normalMatrix, 48);
        this.uniform.data.set(light.position, 64);
        this.uniform.data.set(light.ambient, 68);
        this.uniform.data.set(light.diffuse, 72);
        this.uniform.data.set(light.specular, 76);
        this.uniform.data.set(light.params, 80);
    }

    draw(gpu, view, projection, light) {
        const model = this.createModelMatrix();

        this.updateUniform(model, view, projection, light);
        gpu.writeBuffer(this.uniform.buffer, this.uniform.data);
        gpu.draw(this.program, this.shape, [this.uniform.bindGroup]);
    }
}

class Scene {
    constructor(gpu) {
        this.light = {
            position: [-20, 20, -20, 1],
            ambient: [1, 1, 1, 0.2],
            diffuse: [1, 1, 1, 0.5],
            specular: [1, 1, 1, 0.4],
            params: [5, 0, 0, 0],
        };

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

        this.meshes = [
            new Mesh(gpu, this.program, 1),
            new Mesh(gpu, this.program, -1),
        ];
    }

    createViewMatrix() {
        const eye = [1, 1, 1];
        const at = [0, 0, 0];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up, true);
    }

    createProjectionMatrix() {
        const aspect = 1024 / 768;
        return createPerspectiveMat4(Math.PI / 2, aspect, 0.1, 10);
    }

    draw(gpu) {
        const view = this.createViewMatrix();
        const projection = this.createProjectionMatrix();

        for (const mesh of this.meshes) {
            mesh.draw(gpu, view, projection, this.light);
        }
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
