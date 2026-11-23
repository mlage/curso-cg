/**
 * 2D Perlin Noise and procedural generation of a marble texture.
 * The noise is generated once in JavaScript and uploaded as a 2D texture.
 */

function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
}

function smoothstep(edge0, edge1, x) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

function createPerlinNoise(seed = 0) {
    const perm = new Uint8Array(256);
    for (let i = 0; i < perm.length; i++) {
        perm[i] = i;
    }

    const random = mulberry32(seed);
    for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    const p = new Uint8Array(512);
    for (let i = 0; i < p.length; i++) {
        p[i] = perm[i & 255];
    }

    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);

    function gradient(hash, x, y) {
        switch (hash & 7) {
            case 0: return x + y;
            case 1: return -x + y;
            case 2: return x - y;
            case 3: return -x - y;
            case 4: return x;
            case 5: return -x;
            case 6: return y;
            default: return -y;
        }
    }

    function noise(x, y) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const xf = x - x0;
        const yf = y - y0;

        const xi = x0 & 255;
        const yi = y0 & 255;

        const u = fade(xf);
        const v = fade(yf);

        const aa = p[p[xi] + yi];
        const ab = p[p[xi] + yi + 1];
        const ba = p[p[xi + 1] + yi];
        const bb = p[p[xi + 1] + yi + 1];

        const x1 = lerp(gradient(aa, xf, yf), gradient(ba, xf - 1, yf), u);
        const x2 = lerp(gradient(ab, xf, yf - 1), gradient(bb, xf - 1, yf - 1), u);

        return lerp(x1, x2, v);
    }

    function fbm(x, y, octaves = 6, lacunarity = 2, gain = 0.5) {
        let amplitude = 1;
        let frequency = 1;
        let sum = 0;
        let normalization = 0;

        for (let i = 0; i < octaves; i++) {
            sum += amplitude * noise(x * frequency, y * frequency);
            normalization += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }

        return sum / normalization;
    }

    return { noise, fbm };
}

export function createMarbleTexture(size = 256, seed = 1234) {
    const perlin = createPerlinNoise(seed);
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Turbulence bends the stripes into veins: the sine defines the
            // stripes and the noise displaces their phase.
            const turbulence = perlin.fbm(x * 0.012, y * 0.012, 5);
            const phase = x * 0.16 + y * 0.01 + turbulence * 14.0;

            // Veins are the dark bands around the zeros of the sine; smoothstep
            // gives them soft edges instead of a hard threshold.
            const distance = Math.abs(Math.sin(phase));
            const vein = 1 - smoothstep(0, 0.3, distance);
            const cloud = 0.05 * perlin.fbm(x * 0.05, y * 0.05, 3);
            const value = Math.min(1, Math.max(0, 0.93 - 0.55 * vein + cloud));

            const offset = (y * size + x) * 4;
            data[offset] = Math.round(255 * Math.min(1, value * 1.02));
            data[offset + 1] = Math.round(255 * value);
            data[offset + 2] = Math.round(255 * value * 0.97);
            data[offset + 3] = 255;
        }
    }

    return data;
}
