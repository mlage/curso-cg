import vertShaderSrc from './simple.vert.js';
import fragShaderSrc from './simple.frag.js';
import WebGPU from '../lib/webgpu.js';
import { marchingSquares } from './marching-squares.js';

// Add any continuous implicit field here. The contour is field(x, y) = 0.
const curves = {
    heart: (x, y) => (x * x + y * y - 1) ** 3 - x * x * y ** 3,
    circle: (x, y) => x * x + y * y - 1,
    lemniscate: (x, y) => (x * x + y * y) ** 2 - 2 * (x * x - y * y),
    clover: (x, y) => (x * x + y * y) ** 3 - 4 * x * x * y * y,
    cassini: (x, y) => ((x - 0.9) ** 2 + y * y) * ((x + 0.9) ** 2 + y * y) - 0.5,
    waves: (x, y) => Math.sin(3 * x) * Math.cos(3 * y) - 0.2,
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

    update(gpu, field, resolution) {
        const segments = marchingSquares(field, this.bounds, resolution);
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
        document.querySelector('#status').textContent = `${resolution} × ${resolution} cells · ${segments.length / 4} segments`;
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
            this.scene.update(this.gpu, curves[curve.value], Number(resolution.value));
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
