import vertShaderSrc from './texture.vert.js';
import fragShaderSrc from './texture.frag.js';
import WebGPU from '../lib/webgpu.js';
import { createMarbleTexture } from './perlin-noise.js';
import {
    createIdentityMat4,
    createLookAtMat4,
    createNormalMat4,
    createPerspectiveMat4,
    createRotationYMat4,
    createScaleMat4,
    multiplyMat4,
} from '../lib/utils.js';

/**
 * Builds the texture coordinates (uv) manually, per face.
 * Corners are listed counter-clockwise starting at the bottom-left one.
 * The same coordinates used in example 13b are sampled here from a
 * marble texture generated with Perlin Noise.
 */
function createCubeGeometry() {
    const half = 0.5;

    const faces = [
        {
            normal: [0, 0, 1],
            corners: [
                [-half, -half, half],
                [half, -half, half],
                [half, half, half],
                [-half, half, half],
            ],
        },
        {
            normal: [0, 0, -1],
            corners: [
                [half, -half, -half],
                [-half, -half, -half],
                [-half, half, -half],
                [half, half, -half],
            ],
        },
        {
            normal: [1, 0, 0],
            corners: [
                [half, -half, half],
                [half, -half, -half],
                [half, half, -half],
                [half, half, half],
            ],
        },
        {
            normal: [-1, 0, 0],
            corners: [
                [-half, -half, -half],
                [-half, -half, half],
                [-half, half, half],
                [-half, half, -half],
            ],
        },
        {
            normal: [0, 1, 0],
            corners: [
                [-half, half, half],
                [half, half, half],
                [half, half, -half],
                [-half, half, -half],
            ],
        },
        {
            normal: [0, -1, 0],
            corners: [
                [-half, -half, -half],
                [half, -half, -half],
                [half, -half, half],
                [-half, -half, half],
            ],
        },
    ];

    const uvs = [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
    ];

    const positions = [];
    const texCoords = [];
    const normals = [];
    const indices = [];

    for (const face of faces) {
        const base = positions.length / 4;

        for (const corner of face.corners) {
            positions.push(...corner, 1);
        }

        for (const uv of uvs) {
            texCoords.push(...uv);
        }

        for (let i = 0; i < 4; i++) {
            normals.push(...face.normal, 0);
        }

        indices.push(
            base, base + 1, base + 2,
            base, base + 2, base + 3,
        );
    }

    return {
        positions,
        uvs: texCoords,
        normals,
        indices,
        vertexCount: positions.length / 4,
    };
}

class Mesh {
    constructor(gpu, program, geometry, texture) {
        this.angle = 0;
        this.program = program;
        this.shape = gpu.createShape({
            buffers: [geometry.positions, geometry.uvs, geometry.normals],
            indices: geometry.indices,
            indexFormat: 'uint32',
            vertexCount: geometry.vertexCount,
        });

        this.uniform = {
            data: new Float32Array(84),
            buffer: gpu.createUniformBuffer(new Float32Array(84)),
        };
        this.sampler = gpu.createSampler({
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            magFilter: 'linear',
            minFilter: 'linear',
        });
        this.bindGroup = gpu.createBindGroup(program, [
            { binding: 0, resource: { buffer: this.uniform.buffer } },
            { binding: 1, resource: this.sampler },
            { binding: 2, resource: texture.createView() },
        ]);
    }

    createModelMatrix() {
        this.angle += 0.005;

        const scale = createScaleMat4(1.4, 1.4, 1.4);
        const rotate = createRotationYMat4(this.angle);

        let model = createIdentityMat4();
        model = multiplyMat4(scale, model);
        return multiplyMat4(rotate, model);
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
    constructor(gpu) {
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

        const texture = gpu.createTextureFromData(createMarbleTexture(), {
            size: [256, 256],
        });

        this.meshes = [
            new Mesh(gpu, this.program, createCubeGeometry(), texture),
        ];
    }

    createViewMatrix() {
        const eye = [0, 0.8, 2.5];
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
