// Each curve has an implicit field f(x, y) = 0 and one or more parametric
// pieces p(t) = [x, y]. Separate pieces must not be joined by line segments.
const circleA = (x, y) => (x + 0.5) ** 2 + y * y - 1;
const circleB = (x, y) => (x - 0.5) ** 2 + y * y - 1;

// The two unit circles meet at angles +/- pi/3 on A and +/- 2*pi/3 on B.
const outerA = {
    curve: (t) => [-0.5 + Math.cos(t), Math.sin(t)],
    minT: Math.PI / 3, maxT: 5 * Math.PI / 3,
};
const innerA = {
    curve: (t) => [-0.5 + Math.cos(t), Math.sin(t)],
    minT: -Math.PI / 3, maxT: Math.PI / 3,
};
const outerB = {
    curve: (t) => [0.5 + Math.cos(t), Math.sin(t)],
    minT: -2 * Math.PI / 3, maxT: 2 * Math.PI / 3,
};
const innerB = {
    curve: (t) => [0.5 + Math.cos(t), Math.sin(t)],
    minT: 2 * Math.PI / 3, maxT: 4 * Math.PI / 3,
};

export const curves = {
    heart: {
        label: 'Heart',
        // Start with a circle and shift y by |x|^(2/3), then scale and center it.
        implicit: (x, y) => x * x + ((y + 0.4) / 0.8 - Math.abs(x) ** (2 / 3)) ** 2 - 1,
        parametric: [{
            curve: (t) => [Math.sin(t), 0.8 * (Math.cos(t) + Math.abs(Math.sin(t)) ** (2 / 3)) - 0.4],
            minT: 0, maxT: 2 * Math.PI,
        }],
    },
    circle: {
        label: 'Circle',
        implicit: (x, y) => x * x + y * y - 1,
        parametric: [{
            curve: (t) => [Math.cos(t), Math.sin(t)],
            minT: 0, maxT: 2 * Math.PI,
        }],
    },
    ellipse: {
        label: 'Ellipse',
        implicit: (x, y) => (x / 1.5) ** 2 + (y / 0.75) ** 2 - 1,
        parametric: [{
            curve: (t) => [1.5 * Math.cos(t), 0.75 * Math.sin(t)],
            minT: 0, maxT: 2 * Math.PI,
        }],
    },
    lemniscate: {
        label: 'Lemniscate',
        implicit: (x, y) => (x * x + y * y) ** 2 - 2 * (x * x - y * y),
        parametric: [{
            curve: (t) => {
                const denominator = 1 + Math.sin(t) ** 2;
                return [Math.SQRT2 * Math.cos(t) / denominator,
                    Math.SQRT2 * Math.sin(t) * Math.cos(t) / denominator];
            },
            minT: 0, maxT: 2 * Math.PI,
        }],
    },
    clover: {
        label: 'Four-leaf clover',
        implicit: (x, y) => (x * x + y * y) ** 3 - 4 * x * x * y * y,
        parametric: [{
            // Polar form: r = sin(2*t).
            curve: (t) => [Math.sin(2 * t) * Math.cos(t), Math.sin(2 * t) * Math.sin(t)],
            minT: 0, maxT: 2 * Math.PI,
        }],
    },
    cassini: {
        label: 'Cassini ovals',
        implicit: (x, y) => ((x - 0.9) ** 2 + y * y) * ((x + 0.9) ** 2 + y * y) - 0.5,
        // In complex coordinates, z^2 = 0.81 + sqrt(0.5)*exp(i*t).
        // Its positive and negative square roots trace the disconnected ovals.
        parametric: [-1, 1].map((sign) => ({
            curve: (t) => {
                const real = 0.81 + Math.sqrt(0.5) * Math.cos(t);
                const imaginary = Math.sqrt(0.5) * Math.sin(t);
                const x = Math.sqrt((Math.hypot(real, imaginary) + real) / 2);
                const y = imaginary / (2 * x);
                return [sign * x, sign * y];
            },
            minT: 0, maxT: 2 * Math.PI,
        })),
    },
    lissajous: {
        label: 'Lissajous',
        // Eliminating t from x = 1.5*sin(3*t), y = sin(2*t) gives this polynomial.
        implicit: (x, y) => (1 - 2 * (x / 1.5) ** 2) ** 2 - (1 - y * y) * (1 - 4 * y * y) ** 2,
        parametric: [{
            curve: (t) => [1.5 * Math.sin(3 * t), Math.sin(2 * t)],
            minT: 0, maxT: 2 * Math.PI,
        }],
    },
    waves: {
        label: 'Trigonometric waves',
        implicit: (x, y) => Math.sin(3 * x) * Math.cos(3 * y) - 0.2,
        // Solve for y on each continuous branch of cos(3*y) = 0.2/sin(3*x).
        // These branches cover the displayed domain; the renderer clips them.
        parametric: [-2, -1, 0, 1].flatMap((k) =>
            [-1, 0, 1].flatMap((period) =>
                [-1, 1].map((sign) => ({
                    curve: (t) => {
                        // Clamp roundoff at the branch endpoints before acos.
                        const ratio = Math.max(-1, Math.min(1, 0.2 / Math.sin(3 * t)));
                        return [t, (sign * Math.acos(ratio) + 2 * Math.PI * period) / 3];
                    },
                    minT: (k * Math.PI + Math.asin(0.2)) / 3,
                    maxT: ((k + 1) * Math.PI - Math.asin(0.2)) / 3,
                })))),
    },
    union: {
        label: 'Two circles: union (A or B)',
        // Negative values are inside: union uses min(f, g).
        implicit: (x, y) => Math.min(circleA(x, y), circleB(x, y)),
        parametric: [outerA, outerB],
    },
    intersection: {
        label: 'Two circles: intersection (A and B)',
        implicit: (x, y) => Math.max(circleA(x, y), circleB(x, y)),
        parametric: [innerA, innerB],
    },
    difference: {
        label: 'Two circles: difference (A minus B)',
        implicit: (x, y) => Math.max(circleA(x, y), -circleB(x, y)),
        parametric: [outerA, innerB],
    },
};
