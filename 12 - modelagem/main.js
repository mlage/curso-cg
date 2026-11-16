import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';
import WebGPU from '../lib/webgpu.js';

import { curves } from './curves.js';
import { marchingSquares } from './marching-squares.js';
import { sampleParametricCurve } from './parametric-curve.js';

class Scene {
    constructor(gpu) {
        this.bounds = { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 };
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            topology: 'line-list',
            depth: false,
        });
        this.shapes = [];
    }

    update(gpu, layers) {
        for (const shape of this.shapes) {
            shape.buffers.forEach((buffer) => buffer.destroy());
        }
        this.shapes = [];

        const { minX, maxX, minY, maxY } = this.bounds;
        for (const { segments, color } of layers) {
            if (segments.length === 0) {
                continue;
            }
            const positions = [];
            const colors = [];
            for (let i = 0; i < segments.length; i += 2) {
                positions.push(2 * (segments[i] - minX) / (maxX - minX) - 1,
                    2 * (segments[i + 1] - minY) / (maxY - minY) - 1, 0, 1);
                colors.push(...color);
            }
            this.shapes.push(gpu.createShape([positions, colors], segments.length / 2));
        }
    }

    draw(gpu) {
        for (const shape of this.shapes) {
            gpu.draw(this.program, shape);
        }
    }
}

class Main {
    async init() {
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768, { depth: false });
        this.scene = new Scene(this.gpu);
        const curve = document.querySelector('#curve');
        const resolution = document.querySelector('#resolution');
        const segmentCount = document.querySelector('#segment-count');
        const showImplicit = document.querySelector('#show-implicit');
        const showParametric = document.querySelector('#show-parametric');

        // Populate the selector from the definitions so every option has both forms.
        for (const [key, definition] of Object.entries(curves)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = definition.label;
            curve.append(option);
        }

        const update = () => {
            const definition = curves[curve.value];
            const layers = [];
            const status = [];
            resolution.disabled = !showImplicit.checked;
            segmentCount.disabled = !showParametric.checked;

            if (showImplicit.checked) {
                const count = Number(resolution.value);
                const segments = marchingSquares(definition.implicit, this.scene.bounds, count);
                layers.push({ segments, color: [0.95, 0.3, 0.45, 1] });
                status.push(`Implicit: ${count} × ${count} cells, ${segments.length / 4} segments`);
            }
            if (showParametric.checked) {
                const count = Number(segmentCount.value);
                let totalSegments = 0;
                for (const piece of definition.parametric) {
                    const segments = sampleParametricCurve(piece.curve, piece.minT, piece.maxT, count);
                    layers.push({ segments, color: [0.15, 0.8, 0.95, 1] });
                    totalSegments += segments.length / 4;
                }
                status.push(`Parametric: ${definition.parametric.length} pieces, ${totalSegments} segments`);
            }
            this.scene.update(this.gpu, layers);
            document.querySelector('#status').textContent = status.join(' · ') || 'Both versions hidden.';
            this.draw();
        };
        for (const control of [curve, resolution, segmentCount, showImplicit, showParametric]) {
            control.addEventListener('change', update);
        }
        update();
    }

    draw() {
        this.gpu.start();
        this.scene.draw(this.gpu);
        this.gpu.finish();
    }
}

try {
    const app = new Main();
    await app.init();
} catch (error) {
    console.error(error);
    document.querySelector('#status').textContent = error.message;
}
