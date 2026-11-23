import vertShaderSrc from './texture.vert.js';
import fragShaderSrc from './texture.frag.js';
import WebGPU from '../lib/webgpu.js';
import { loadObj } from './load-obj.js';
import {
    createLookAtMat4,
    createNormalMat4,
    createPerspectiveMat4,
    createRotationYMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

class Mesh {
    constructor(gpu, program, geometry, texture) {
        this.angle = 0;
        this.position = [0, 0, 0];
        this.program = program;

        const bounds = this.computeBounds(geometry.positions);
        this.center = bounds.center;
        this.scale = 2 / bounds.maxSize;

        this.shape = gpu.createShape({
            buffers: [geometry.positions, geometry.uvs, geometry.normals],
            vertexCount: geometry.vertexCount,
        });

        this.uniform = {
            data: new Float32Array(84),
            buffer: gpu.createUniformBuffer(new Float32Array(84)),
        };
        this.sampler = gpu.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
        });
        this.bindGroup = gpu.createBindGroup(program, [
            { binding: 0, resource: { buffer: this.uniform.buffer } },
            { binding: 1, resource: this.sampler },
            { binding: 2, resource: texture.createView() },
        ]);
    }

    computeBounds(positions) {
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];

        for (let i = 0; i < positions.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                min[c] = Math.min(min[c], positions[i + c]);
                max[c] = Math.max(max[c], positions[i + c]);
            }
        }

        const center = min.map((value, c) => (value + max[c]) / 2);
        const maxSize = Math.max(
            max[0] - min[0],
            max[1] - min[1],
            max[2] - min[2],
        ) || 1;

        return { center, maxSize };
    }

    createModelMatrix() {
        this.angle += 0.005;

        const center = createTranslationMat4(-this.center[0], -this.center[1], -this.center[2]);
        const scale = createScaleMat4(this.scale, this.scale, this.scale);
        const rotate = createRotationYMat4(this.angle);
        const translate = createTranslationMat4(...this.position);

        let model = center;
        model = multiplyMat4(scale, model);
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
        gpu.draw(this.program, this.shape, [this.bindGroup]);
    }
}

class Scene {
    constructor(gpu, geometry, texture) {
        this.light = {
            position: [-2, 3, 4, 1],
            ambient: [1, 1, 1, 0.25],
            diffuse: [1, 1, 1, 0.75],
            specular: [1, 1, 1, 0.2],
            params: [48, 0, 0, 0],
        };

        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            cullMode: 'back',
            buffers: [
                {
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }],
                },
                {
                    arrayStride: 2 * 4,
                    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }],
                },
                {
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }],
                },
            ],
        });

        this.meshes = [
            new Mesh(gpu, this.program, geometry, texture),
        ];
    }

    createViewMatrix() {
        const eye = [0, 0.55, 4.1];
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

        const [geometry, texture] = await Promise.all([
            loadObj(new URL('./planet.obj', import.meta.url)),
            this.gpu.createTextureFromImage(new URL('./mars.png', import.meta.url)),
        ]);

        this.scene = new Scene(this.gpu, geometry, texture);
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
