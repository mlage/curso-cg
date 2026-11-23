import vertShaderSrc from './colormap.vert.js';
import fragShaderSrc from './colormap.frag.js';
import WebGPU from '../lib/webgpu.js';
import { HalfEdgeDS } from '../lib/half-edge.js';
import { loadMesh } from './load-mesh.js';
import {
    createLookAtMat4,
    createNormalMat4,
    createPerspectiveMat4,
    createRotationYMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from '../lib/utils.js';

/**
 * Creates a diverging blue -> white -> red colormap.
 * The 1D texture is sampled with the scalar coordinate in [0, 1].
 */
function createDivergingColormap(size = 256) {
    const data = new Uint8Array(size * 4);

    for (let i = 0; i < size; i++) {
        const t = i / (size - 1);

        let r;
        let g;
        let b;

        if (t < 0.5) {
            const s = t / 0.5;
            r = Math.round(255 * s);
            g = Math.round(255 * s);
            b = 255;
        } else {
            const s = (t - 0.5) / 0.5;
            r = 255;
            g = Math.round(255 * (1 - s));
            b = Math.round(255 * (1 - s));
        }

        data.set([r, g, b, 255], i * 4);
    }

    return data;
}

function angleBetween(a, b, c) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const dot = ab[0] * ac[0] + ab[1] * ac[1] + ab[2] * ac[2];
    const lenAb = Math.hypot(ab[0], ab[1], ab[2]);
    const lenAc = Math.hypot(ac[0], ac[1], ac[2]);
    const cosine = Math.min(1, Math.max(-1, dot / (lenAb * lenAc)));

    return Math.acos(cosine);
}

/**
 * Approximates Gaussian curvature with the angle defect at each vertex.
 * The defect is smoothed over the 1-ring and mapped to [0, 1] with a robust
 * scale, so flat regions stay white and high curvature saturates the colormap.
 */
function computeCurvatureScalars(heds) {
    const defects = new Float32Array(heds.vertices.length);
    const maxSteps = heds.halfEdges.length * 2;

    for (const vertex of heds.vertices) {
        const start = vertex.he;
        if (!start) {
            continue;
        }

        let he = start;
        let angleSum = 0;
        let steps = 0;
        let closed = false;

        while (steps < maxSteps) {
            const a = vertex.position;
            const b = he.next.vertex.position;
            const c = he.next.next.vertex.position;
            angleSum += angleBetween(a, b, c);

            he = he.next.next.opposite;
            steps++;

            if (he === start) {
                closed = true;
                break;
            }

            if (!he) {
                break;
            }
        }

        if (closed) {
            defects[vertex.vid] = 2 * Math.PI - angleSum;
        }
    }

    let maxAbs = 0;
    for (const defect of defects) {
        maxAbs = Math.max(maxAbs, Math.abs(defect));
    }

    // Angle defects are noisy on irregular triangulations, so the field is
    // smoothed over the 1-ring before it becomes a color.
    const neighbors = Array.from({ length: heds.vertices.length }, () => []);
    for (const halfEdge of heds.halfEdges) {
        neighbors[halfEdge.vertex.vid].push(halfEdge.next.vertex.vid);
    }

    let smoothed = defects;
    for (let iteration = 0; iteration < 10; iteration++) {
        const next = new Float32Array(smoothed.length);
        for (let i = 0; i < smoothed.length; i++) {
            const ring = neighbors[i];
            if (ring.length === 0) {
                next[i] = smoothed[i];
                continue;
            }
            let sum = 0;
            for (const j of ring) {
                sum += smoothed[j];
            }
            next[i] = 0.5 * smoothed[i] + 0.5 * (sum / ring.length);
        }
        smoothed = next;
    }

    // The maximum defect is dominated by a handful of vertices. A high
    // percentile keeps most of the surface in the middle of the colormap
    // instead of washing everything out to white.
    const magnitudes = Array.from(smoothed, Math.abs).sort((a, b) => a - b);
    const scale = magnitudes[Math.floor(0.85 * (magnitudes.length - 1))] || maxAbs || 1;

    const scalars = new Float32Array(smoothed.length);
    for (let i = 0; i < smoothed.length; i++) {
        scalars[i] = 0.5 + 0.5 * Math.tanh(smoothed[i] / scale);
    }

    return scalars;
}

class Mesh {
    constructor(gpu, program, position, coords, indices, colormap) {
        this.angle = 0;
        this.position = position;
        this.program = program;
        this.heds = new HalfEdgeDS();
        this.heds.build(coords, indices);

        const bounds = this.computeBounds(coords);
        this.center = bounds.center;
        this.scale = 2 / bounds.maxSize;

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
        this.texture = gpu.createTextureFromData(colormap, {
            size: [256],
            dimension: '1d',
        });
        this.bindGroup = gpu.createBindGroup(program, [
            { binding: 0, resource: { buffer: this.uniform.buffer } },
            { binding: 1, resource: this.sampler },
            { binding: 2, resource: this.texture.createView() },
        ]);

        const scalars = computeCurvatureScalars(this.heds);
        const positions = [];
        const normals = [];
        for (const vertex of this.heds.vertices) {
            positions.push(...vertex.position);
            normals.push(...vertex.normal);
        }

        const indicesArray = [];
        for (const halfEdge of this.heds.halfEdges) {
            indicesArray.push(halfEdge.vertex.vid);
        }

        this.shape = gpu.createShape({
            buffers: [positions, scalars, normals],
            indices: indicesArray,
            indexFormat: 'uint32',
            vertexCount: this.heds.vertices.length,
        });
    }

    computeBounds(coords) {
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];

        for (let i = 0; i < coords.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                min[c] = Math.min(min[c], coords[i + c]);
                max[c] = Math.max(max[c], coords[i + c]);
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
    constructor(gpu, coords, indices) {
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
                    arrayStride: 1 * 4,
                    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32' }],
                },
                {
                    arrayStride: 4 * 4,
                    attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }],
                },
            ],
        });

        this.meshes = [
            new Mesh(gpu, this.program, [0, 0, 0], coords, indices, createDivergingColormap()),
        ];
    }

    createViewMatrix() {
        const eye = [0, 0.6, 3.5];
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
        const { coords, indices } = await loadMesh(new URL('./bunny.mesh', import.meta.url));
        this.scene = new Scene(this.gpu, coords, indices);
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
