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

export function createMarbleTexture(size = 512, seed = 1234) {
    const perlin = createPerlinNoise(seed);
    const data = new Uint8Array(size * size * 4);

    // The noise frequencies below are tuned for a 512x512 tile, and the
    // feature size stretches the whole pattern so the veins are large enough
    // to read on the cube faces.
    const scale = (size / 512) * 1.6;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const px = x / scale;
            const py = y / scale;

            // Domain warp: offsets the sample point with noise so the veins
            // swirl instead of repeating as straight stripes.
            const warpX = px + 140 * perlin.fbm(px * 0.0025, py * 0.0025, 3);
            const warpY = py + 140 * perlin.fbm(px * 0.0025 + 7.7, py * 0.0025 + 4.4, 3);
            const turbulence = perlin.fbm(warpX * 0.006, warpY * 0.006, 4, 2, 0.5);

            // Broad grey bands, like the cloudy layers of real marble.
            const broadPhase = warpX * 0.010 + warpY * 0.006 + turbulence * 4.0;
            const broad = 1 - smoothstep(0, 0.5, Math.abs(Math.sin(broadPhase)));

            // Thin dark veins, with a width that varies along the slab.
            const phase = warpX * 0.030 + warpY * 0.020 + turbulence * 9.0;
            const width = 0.04 + 0.10 * (0.5 + 0.5 * perlin.fbm(warpX * 0.004 + 21, warpY * 0.004 + 9, 3));
            const vein = 1 - smoothstep(0, width, Math.abs(Math.sin(phase)));

            const cloud = 0.03 * perlin.fbm(warpX * 0.02, warpY * 0.02, 4);
            const value = Math.min(1, Math.max(0, 0.975 - 0.14 * broad - 0.40 * vein + cloud));

            const offset = (y * size + x) * 4;
            data[offset] = Math.round(255 * Math.min(1, value * 1.015));
            data[offset + 1] = Math.round(255 * value);
            data[offset + 2] = Math.round(255 * value * 0.98);
            data[offset + 3] = 255;
        }
    }

    return data;
}
