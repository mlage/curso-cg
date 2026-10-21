import vertShaderSrc from './illumination.vert.js';
import fragShaderSrc from './illumination.frag.js';
import WebGPU from '../lib/webgpu.js';
import { HalfEdgeDS } from '../lib/half-edge.js';
import {
    createLookAtMat4,
    createNormalMat4,
    createPerspectiveMat4,
    createRotationYMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

class Mesh {
    constructor(gpu, program, position, coords, indices) {
        this.angle = 0;
        this.position = position;
        this.program = program;
        this.heds = new HalfEdgeDS();
        this.heds.build(coords, indices);
        const [positions, colors, normals, triangles] = this.heds.getVBOs();
        this.shape = gpu.createShape({
            buffers: [positions, colors, normals],
            indices: triangles,
            indexFormat: 'uint32',
            vertexCount: this.heds.vertices.length,
        });
        this.uniform = gpu.createUniform(program, new Float32Array(84));
    }

    createModelMatrix() {
        this.angle += 0.005;
        const rotate = createRotationYMat4(this.angle);
        const translate = createTranslationMat4(...this.position);
        return multiplyMat4(translate, rotate);
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
            position: [-2, 3, 4, 1],
            ambient: [1, 1, 1, 0.15],
            diffuse: [1, 1, 1, 0.65],
            specular: [1, 1, 1, 0.35],
            params: [24, 0, 0, 0],
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

        const coords = [
            -0.3, -0.3, -0.3, 1,   0.3, -0.3, -0.3, 1,
             0.3, -0.3,  0.3, 1,  -0.3, -0.3,  0.3, 1,
            -0.3,  0.3, -0.3, 1,   0.3,  0.3, -0.3, 1,
             0.3,  0.3,  0.3, 1,  -0.3,  0.3,  0.3, 1,
        ];
        // Counter-clockwise triangles, as in the original half-edge example.
        const indices = [
            0, 3, 7, 0, 7, 4, 5, 1, 0, 5, 0, 4,
            1, 2, 3, 1, 3, 0, 2, 6, 7, 2, 7, 3,
            5, 6, 2, 5, 2, 1, 4, 7, 6, 4, 6, 5,
        ];
        this.meshes = [
            new Mesh(gpu, this.program, [-0.65, 0, 0], coords, indices),
            new Mesh(gpu, this.program, [0.65, 0, 0], coords, indices),
        ];
    }

    createViewMatrix() {
        const eye = [0, 1.2, 4];
        const at = [0, 0, 0];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up, true);
    }

    createProjectionMatrix() {
        const aspect = 1024 / 768;
        return createPerspectiveMat4(Math.PI / 4, aspect, 0.1, 20);
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
