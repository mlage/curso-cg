import assert from 'node:assert/strict';
import { test } from 'node:test';
import { marchingSquares } from '../12 - marching squares/marching-squares.js';

const unit = { minX: 0, maxX: 1, minY: 0, maxY: 1 };

function cell(values) {
    return (x, y) => values[y === 0 ? (x === 0 ? 0 : 1) : (x === 0 ? 3 : 2)];
}

test('all 16 cases produce the expected number of segments and edge crossings', () => {
    const counts = [0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0];
    const edgeMidpoints = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
    for (let mask = 0; mask < 16; mask++) {
        const values = Array.from({ length: 4 }, (_, i) => mask & (1 << i) ? 1 : -1);
        const result = marchingSquares(cell(values), unit, 1);
        assert.ok(result instanceof Float32Array);
        assert.equal(result.length, counts[mask] * 4, `case ${mask}`);
        const actual = [];
        for (let i = 0; i < result.length; i += 2) {
            actual.push([result[i], result[i + 1]].join(','));
        }
        const expected = edges.flatMap(([a, b], edge) => values[a] !== values[b]
            ? [edgeMidpoints[edge].join(',')] : []);
        assert.deepEqual(actual.sort(), expected.sort(), `case ${mask}`);
    }
});

test('linear interpolation locates a straight contour exactly', () => {
    const result = marchingSquares((x) => x - 0.25, unit, [2, 3]);
    assert.equal(result.length, 12);
    for (let i = 0; i < result.length; i += 2) {
        assert.equal(result[i], 0.25);
        assert.ok(result[i + 1] >= 0 && result[i + 1] <= 1);
    }
    const ys = Array.from(result).filter((_, index) => index % 2 === 1);
    assert.equal(Math.min(...ys), 0);
    assert.equal(Math.max(...ys), 1);
});

test('samples each grid vertex once and accepts rectangular resolution', () => {
    let calls = 0;
    const points = new Set();
    const result = marchingSquares((x, y) => {
        calls++;
        points.add(`${x},${y}`);
        return 1;
    }, unit, [4, 2]);
    assert.equal(calls, 15);
    assert.equal(points.size, 15);
    assert.equal(result.length, 0);
});

test('asymptotic decider switches ambiguous connectivity for both sign patterns', () => {
    for (const sign of [1, -1]) {
        const positive = marchingSquares(cell([2, -1, 2, -1].map((v) => v * sign)), unit, 1);
        assert.equal(positive[1], 0); // bottom to right
        assert.equal(positive[2], 1);
        const negative = marchingSquares(cell([1, -2, 1, -2].map((v) => v * sign)), unit, 1);
        assert.equal(negative[1], 0); // bottom to left
        assert.equal(negative[2], 0);
    }
    assert.deepEqual(Array.from(marchingSquares(cell([1, -1, 1, -1]), unit, 1)),
        [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5]);
});

test('exact grid zeros stay finite and do not emit zero-length segments', () => {
    for (const field of [(x) => x, (x, y) => x + y, () => 0]) {
        const result = marchingSquares(field, {}, 8);
        assert.ok(result.every(Number.isFinite));
        for (let i = 0; i < result.length; i += 4) {
            assert.ok(result[i] !== result[i + 2] || result[i + 1] !== result[i + 3]);
        }
    }
    const result = marchingSquares((x) => x, {}, 8);
    assert.ok(result.length > 0);
    for (let i = 0; i < result.length; i += 2) {
        assert.equal(result[i], 0);
    }
});

test('circle approximation improves with resolution and remains inside bounds', () => {
    const field = (x, y) => x * x + y * y - 1;
    const errors = [16, 64].map((resolution) => {
        const points = marchingSquares(field, {}, resolution);
        let error = 0;
        assert.ok(points.length > 0);
        for (let i = 0; i < points.length; i += 2) {
            assert.ok(Math.abs(points[i]) <= 1 && Math.abs(points[i + 1]) <= 1);
            error = Math.max(error, Math.abs(field(points[i], points[i + 1])));
        }
        return error;
    });
    assert.ok(errors[1] < errors[0] / 4);
});

test('heart and disconnected curves produce finite contours', () => {
    const heart = (x, y) => (x * x + y * y - 1) ** 3 - x * x * y ** 3;
    const ovals = (x, y) => ((x - 0.9) ** 2 + y * y) * ((x + 0.9) ** 2 + y * y) - 0.5;
    for (const field of [heart, ovals]) {
        const result = marchingSquares(field);
        assert.ok(result.length > 0);
        assert.ok(result.every(Number.isFinite));
    }
});

test('large finite field values do not overflow interpolation', () => {
    const result = marchingSquares((x) => x === 0 ? -1e308 : 1e308, unit, 1);
    assert.deepEqual(Array.from(result), [0.5, 0, 0.5, 1]);
});

test('invalid fields, bounds, and resolutions fail explicitly', () => {
    assert.throws(() => marchingSquares(null), TypeError);
    for (const resolution of [0, -1, 1.5, NaN, Infinity, [2], [2, 0]]) {
        assert.throws(() => marchingSquares(() => 1, unit, resolution), RangeError);
    }
    for (const bounds of [{ minX: 2, maxX: 1 }, { minY: 0, maxY: 0 }, { maxX: Infinity }]) {
        assert.throws(() => marchingSquares(() => 1, bounds), RangeError);
    }
    for (const value of [NaN, Infinity, undefined, '1']) {
        assert.throws(() => marchingSquares(() => value, unit, 1), /finite numbers/);
    }
});
