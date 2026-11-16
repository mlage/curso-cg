import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';
import WebGPU from '../lib/webgpu.js';

import { marchingSquares } from './marching-squares.js';
import { sampleParametricCurve } from './parametric-curve.js';

// Two overlapping unit circles. Negative values are inside each circle.
const circleA = (x, y) => (x + 0.5) ** 2 + y * y - 1;
const circleB = (x, y) => (x - 0.5) ** 2 + y * y - 1;

// Add any continuous implicit field here. The contour is field(x, y) = 0.
const curves = {
    heart: (x, y) => (x * x + y * y - 1) ** 3 - x * x * y ** 3,
    circle: (x, y) => x * x + y * y - 1,
    lemniscate: (x, y) => (x * x + y * y) ** 2 - 2 * (x * x - y * y),
    clover: (x, y) => (x * x + y * y) ** 3 - 4 * x * x * y * y,
    cassini: (x, y) => ((x - 0.9) ** 2 + y * y) * ((x + 0.9) ** 2 + y * y) - 0.5,
    waves: (x, y) => Math.sin(3 * x) * Math.cos(3 * y) - 0.2,
    // Boolean operations preserve the negative-inside convention.
    union: (x, y) => Math.min(circleA(x, y), circleB(x, y)),
    intersection: (x, y) => Math.max(circleA(x, y), circleB(x, y)),
    difference: (x, y) => Math.max(circleA(x, y), -circleB(x, y)),
};

// Each parametric example defines p(t) = [x, y] and its parameter interval.
const parametricCurves = {
    parametricCircle: {
        curve: (t) => [Math.cos(t), Math.sin(t)],
        minT: 0, maxT: 2 * Math.PI,
    },
    ellipse: {
        curve: (t) => [1.5 * Math.cos(t), 0.75 * Math.sin(t)],
        minT: 0, maxT: 2 * Math.PI,
    },
    spiral: {
        curve: (t) => [1.2 * t / (6 * Math.PI) * Math.cos(t), 1.2 * t / (6 * Math.PI) * Math.sin(t)],
        minT: 0, maxT: 6 * Math.PI,
    },
    lissajous: {
        curve: (t) => [1.5 * Math.sin(3 * t), Math.sin(2 * t)],
        minT: 0, maxT: 2 * Math.PI,
    },
    parametricHeart: {
        curve: (t) => [16 * Math.sin(t) ** 3 / 12,
            (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 12],
        minT: 0, maxT: 2 * Math.PI,
    },
};

class Scene {
    constructor(gpu) {
        this.bounds = { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 };
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            topology: 'line-list',
            depth: false,
        });
        this.shape = null;
    }

    update(gpu, segments) {
        const { minX, maxX, minY, maxY } = this.bounds;
        const positions = [];
        const colors = [];
        for (let i = 0; i < segments.length; i += 2) {
            positions.push(2 * (segments[i] - minX) / (maxX - minX) - 1,
                2 * (segments[i + 1] - minY) / (maxY - minY) - 1, 0, 1);
            colors.push(0.95, 0.3, 0.45, 1);
        }
        this.shape?.buffers.forEach((buffer) => buffer.destroy());
        this.shape = segments.length ? gpu.createShape([positions, colors], segments.length / 2) : null;
    }

    draw(gpu) {
        if (this.shape) {
            gpu.draw(this.program, this.shape);
        }
    }
}

class Main {
    async init() {
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768, { depth: false });
        this.scene = new Scene(this.gpu);
        const curve = document.querySelector('#curve');
        const resolution = document.querySelector('#resolution');
        const update = () => {
            const count = Number(resolution.value);
            const parametric = parametricCurves[curve.value];
            let segments;
            if (parametric) {
                segments = sampleParametricCurve(parametric.curve, parametric.minT, parametric.maxT, count);
                document.querySelector('#sampling-label').textContent = 'Segment count';
                document.querySelector('#status').textContent = `${count} segments · ${count + 1} samples`;
            } else {
                segments = marchingSquares(curves[curve.value], this.scene.bounds, count);
                document.querySelector('#sampling-label').textContent = 'Grid resolution';
                document.querySelector('#status').textContent = `${count} × ${count} cells · ${segments.length / 4} segments`;
            }
            this.scene.update(this.gpu, segments);
            this.draw();
        };
        curve.addEventListener('change', update);
        resolution.addEventListener('change', update);
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
