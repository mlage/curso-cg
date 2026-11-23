// Loads a simple OBJ with positions (v), texture coordinates (vt), and
// normals (vn). Faces are expanded into non-indexed triangles to preserve
// the uv seams of the original model.
function parseFaceVertex(token) {
    const [v, vt, vn] = token.split('/');
    return {
        v: parseInt(v, 10) - 1,
        vt: vt ? parseInt(vt, 10) - 1 : 0,
        vn: vn ? parseInt(vn, 10) - 1 : 0,
    };
}

export function parseObj(text) {
    const objPositions = [];
    const objUvs = [];
    const objNormals = [];

    const positions = [];
    const uvs = [];
    const normals = [];

    for (const rawLine of text.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }

        const parts = line.split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            objPositions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
        } else if (type === 'vt') {
            objUvs.push([Number(parts[1]), Number(parts[2])]);
        } else if (type === 'vn') {
            objNormals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
        } else if (type === 'f') {
            const face = parts.slice(1).map(parseFaceVertex);

            for (let i = 1; i < face.length - 1; i++) {
                const triangle = [face[0], face[i], face[i + 1]];

                for (const index of triangle) {
                    const position = objPositions[index.v];
                    positions.push(position[0], position[1], position[2], 1);

                    if (objUvs.length > 0) {
                        const uv = objUvs[index.vt];
                        // OBJ uses the bottom-left origin; WebGPU uses the top-left one.
                        uvs.push(uv[0], 1 - uv[1]);
                    } else {
                        uvs.push(0, 0);
                    }

                    if (objNormals.length > 0) {
                        const normal = objNormals[index.vn];
                        normals.push(normal[0], normal[1], normal[2], 0);
                    } else {
                        normals.push(0, 0, 1, 0);
                    }
                }
            }
        }
    }

    return {
        positions,
        uvs,
        normals,
        vertexCount: positions.length / 4,
    };
}

export async function loadObj(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load OBJ: HTTP ${response.status}.`);
    }
    return parseObj(await response.text());
}
