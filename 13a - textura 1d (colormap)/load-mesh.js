// Original lesson format: vertex/triangle counts, xyzw positions, zero-based indices.
export function parseMesh(text) {
    const data = text.trim().split(/\s+/).map(Number);
    const [nv, nt] = data;

    if (!Number.isInteger(nv) || !Number.isInteger(nt) || nv <= 0 || nt <= 0
        || data.length !== 2 + 4 * nv + 3 * nt || !data.every(Number.isFinite)) {
        throw new Error('Invalid mesh counts or coordinates.');
    }

    const coords = data.slice(2, 2 + 4 * nv);
    const indices = data.slice(2 + 4 * nv);
    if (!indices.every((index) => Number.isInteger(index) && index >= 0 && index < nv)) {
        throw new Error('Invalid mesh triangle index.');
    }

    return { coords, indices };
}

export async function loadMesh(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load mesh: HTTP ${response.status}.`);
    }
    return parseMesh(await response.text());
}
