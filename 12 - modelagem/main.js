import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';
import WebGPU from '../lib/webgpu.js';

import { curves } from './curves.js';
import { createCurveStroke } from './curve-stroke.js';
import { marchingSquares } from './marching-squares.js';
import { sampleParametricCurve } from './parametric-curve.js';

class Scene {
    constructor(gpu) {
        this.bounds = { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 };
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            topology: 'triangle-list',
            depth: false,
            blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
            buffers: [0, 1, 2].map((shaderLocation) => ({
                arrayStride: 4 * 4,
                attributes: [{ shaderLocation, offset: 0, format: 'float32x4' }],
            })),
        });
        this.shapes = [];
        this.layers = [];
        this.lineWidth = 3;
    }

    update(gpu, layers, lineWidth = this.lineWidth) {
        this.layers = layers;
        this.lineWidth = lineWidth;
        for (const shape of this.shapes) {
            shape.buffers.forEach((buffer) => buffer.destroy());
        }
        this.shapes = [];

        const { width, height } = gpu.canvas.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
            return;
        }
        for (const { segments, color } of layers) {
            const { positions, strokes } = createCurveStroke(segments, this.bounds, width, height, lineWidth);
            if (positions.length === 0) {
                continue;
            }
            const colors = [];
            for (let i = 0; i < positions.length; i += 4) {
                colors.push(...color);
            }
            this.shapes.push(gpu.createShape([positions, colors, strokes], positions.length / 4));
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
        const lineWidth = document.querySelector('#line-width');

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
            this.scene.update(this.gpu, layers, Number(lineWidth.value));
            document.querySelector('#line-width-value').textContent = `${lineWidth.value} px`;
            document.querySelector('#status').textContent = status.join(' · ') || 'Both versions hidden.';
            this.draw();
        };
        for (const control of [curve, resolution, segmentCount, showImplicit, showParametric]) {
            control.addEventListener('change', update);
        }
        lineWidth.addEventListener('input', () => {
            this.scene.update(this.gpu, this.scene.layers, Number(lineWidth.value));
            document.querySelector('#line-width-value').textContent = `${lineWidth.value} px`;
            this.draw();
        });
        update();

        // Match the drawing buffer to the displayed size and keep width in CSS pixels.
        this.resizeObserver = new ResizeObserver(() => {
            const { width, height } = this.gpu.canvas.getBoundingClientRect();
            if (width > 0 && height > 0) {
                this.gpu.resize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
                this.scene.update(this.gpu, this.scene.layers);
                this.draw();
            }
        });
        this.resizeObserver.observe(this.gpu.canvas);
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
