/**
 * Sample a continuous planar curve(t) = [x, y] uniformly in parameter space.
 * Return independent segments as [x1, y1, x2, y2, ...], like Marching Squares.
 * segmentCount segments use segmentCount + 1 samples, including both endpoints.
 * Closed curves must provide an interval whose endpoints coincide; open curves
 * are not closed automatically. Uniform t steps need not give equal lengths.
 */
export function sampleParametricCurve(curve, minT = 0, maxT = 2 * Math.PI, segmentCount = 128) {
    if (typeof curve !== 'function') {
        throw new TypeError('The parametric curve must be a function.');
    }
    if (![minT, maxT, maxT - minT].every(Number.isFinite) || minT >= maxT) {
        throw new RangeError('The parameter interval must be finite and strictly increasing.');
    }
    if (!Number.isSafeInteger(segmentCount) || segmentCount <= 0) {
        throw new RangeError('The segment count must be a positive integer.');
    }

    const positions = new Float32Array(segmentCount * 4);
    let previousX;
    let previousY;
    for (let i = 0; i <= segmentCount; i++) {
        // Use maxT directly at the last sample to include the exact endpoint.
        const t = i === segmentCount ? maxT : minT + (maxT - minT) * (i / segmentCount);
        const point = curve(t);
        if (point?.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
            throw new RangeError('The curve must return two finite coordinates [x, y] at every sample.');
        }
        const [x, y] = point;
        if (i > 0) {
            const offset = (i - 1) * 4;
            positions[offset] = previousX;
            positions[offset + 1] = previousY;
            positions[offset + 2] = x;
            positions[offset + 3] = y;
        }
        previousX = x;
        previousY = y;
    }
    return positions;
}
