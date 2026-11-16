/*
 * Marching Squares cases: + means field >= 0, - means field < 0.
 * The o marks an interpolated edge crossing; lines connect the crossings.
 * Crossings are drawn at edge midpoints for illustration only.
 *
 *      0              1              2              3
 *    -   -          -   -          -   -          -   -
 *
 *                   o                  o          o---o
 *                    \                /
 *    -   -          + o -          - o +          +   +
 *
 *      4              5*             6              7
 *    - o +          - o +          - o +          - o +
 *       \            /               |             /
 *        o          o   o            |            o
 *                      /             |
 *    -   -          + o -          - o +          +   +
 *
 *      8              9             10*            11
 *    + o -          + o -          + o -          + o -
 *     /               |             /                \
 *    o                |            o   o              o
 *                     |               /
 *    -   -          + o -          - o +          +   +
 *
 *     12             13             14             15
 *    +   +          +   +          +   +          +   +
 *
 *    o---o              o          o
 *                      /            \
 *    -   -          + o -          - o +          +   +
 *
 * Corner bits and edge indices:
 *
 *       bit 3            bit 2
 *         +---- edge 2 ----+
 *         |               |
 *       edge 3          edge 1
 *         |               |
 *         +---- edge 0 ----+
 *       bit 0            bit 1
 *
 * case = b0 + 2*b1 + 4*b2 + 8*b3
 *
 * Cases 5 and 10 are ambiguous. With corner values f0, f1, f2, f3,
 * the asymptotic decider uses D = f0*f2 - f1*f3:
 *
 *       D >= 0            D < 0
 *
 *          o                 o
 *         /                   \
 *        o   o             o   o
 *           /               \
 *          o                 o
 *
 * D >= 0 pairs bottom/right and top/left (as shown in the case table).
 * D < 0 pairs bottom/left and top/right. Ties follow D >= 0.
 */
const cases = [
    [], 
    [[3, 0]], 
    [[0, 1]], 
    [[3, 1]],
    [[1, 2]], 
    null, // ambiguous cases
    [[0, 2]], 
    [[3, 2]],
    [[2, 3]], 
    [[0, 2]], 
    null, // ambiguous cases
    [[1, 2]],
    [[1, 3]], 
    [[0, 1]],
    [[3, 0]], 
    [],
];
const edges = [[0, 1], [1, 2], [3, 2], [0, 3]];

/**
 * Sample field(x, y) = 0 and return independent line segments as packed x, y pairs.
 * Resolution is a cell count, either one integer or [columns, rows].
 * Each grid vertex is sampled once. Nonfinite field values are rejected.
 * Ambiguous cells use the bilinear asymptotic decider; ties use bottom-right
 * and top-left edge pairs. Features smaller than a cell may be missed.
 */
export function marchingSquares(field, bounds = {}, resolution = 128) {
    const { minX = -2, maxX = 2, minY = -2, maxY = 2 } = bounds;
    const [columns, rows] = Array.isArray(resolution) ? resolution : [resolution, resolution];
    if (typeof field !== 'function') {
        throw new TypeError('The implicit field must be a function.');
    }
    if (![minX, maxX, minY, maxY, maxX - minX, maxY - minY].every(Number.isFinite)
        || minX >= maxX || minY >= maxY) {
        throw new RangeError('Bounds must be finite and strictly increasing.');
    }
    if (![columns, rows].every((value) => Number.isSafeInteger(value) && value > 0)) {
        throw new RangeError('Grid resolution must contain positive integers.');
    }

    const dx = (maxX - minX) / columns;
    const dy = (maxY - minY) / rows;
    const stride = columns + 1;
    const samples = new Float64Array(stride * (rows + 1));
    for (let i = 0; i <= rows; i++) {
        for (let j = 0; j <= columns; j++) {
            const value = field(minX + j * dx, minY + i * dy);
            if (!Number.isFinite(value)) {
                throw new RangeError('The implicit field must return finite numbers at every grid vertex.');
            }
            samples[i * stride + j] = value;
        }
    }

    const positions = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const index = i * stride + j;
            const values = [samples[index], samples[index + 1],
                samples[index + stride + 1], samples[index + stride]];
            // Each nonnegative corner contributes its weight to the case number.
            // Exact zeros count as nonnegative too.
            const cornerWeights = [1, 2, 4, 8];
            let mask = 0;
            for (let corner = 0; corner < 4; corner++) {
                if (values[corner] >= 0) {
                    mask += cornerWeights[corner];
                }
            }
            let pairs = cases[mask];
            if (pairs === null) {
                const scale = Math.max(...values.map(Math.abs));
                const v = values.map((value) => value / scale);
                const determinant = v[0] * v[2] - v[1] * v[3];
                pairs = determinant >= 0 ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]];
            }
            if (pairs.length === 0) {
                continue;
            }

            const x = minX + j * dx;
            const y = minY + i * dy;
            const corners = [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]];
            const intersections = edges.map(([a, b]) => {
                if ((values[a] >= 0) === (values[b] >= 0)) {
                    return null;
                }
                // Scale before subtraction to avoid overflow for large field values.
                const scale = Math.max(Math.abs(values[a]), Math.abs(values[b]));
                const va = values[a] / scale;
                const vb = values[b] / scale;
                const t = va / (va - vb);
                return [corners[a][0] + t * (corners[b][0] - corners[a][0]),
                    corners[a][1] + t * (corners[b][1] - corners[a][1])];
            });
            for (const [a, b] of pairs) {
                const start = intersections[a];
                const end = intersections[b];
                if (start[0] !== end[0] || start[1] !== end[1]) {
                    positions.push(...start, ...end);
                }
            }
        }
    }
    return new Float32Array(positions);
}
