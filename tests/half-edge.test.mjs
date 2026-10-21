import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { HalfEdgeDS } from '../lib/half-edge.js';
import { parseMesh, loadMesh } from '../11 - half-edge (file)/load-mesh.js';

test('triangle cycles, boundary edges and area-weighted normals', () => {
    const mesh = new HalfEdgeDS();
    mesh.build([0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1], [0, 1, 2]);
    const he = mesh.faces[0].baseHe;
    assert.equal(he.next.next.next, he);
    for (const v of mesh.vertices) {
        assert.equal(v.he.vertex, v);
        assert.deepEqual(v.normal, [0, 0, 1, 0]);
    }
    assert.ok(mesh.halfEdges.every((edge) => edge.opposite === null));
    assert.deepEqual(mesh.getVBOs()[3], [0, 1, 2]);
});

test('Spot is a closed, consistently oriented mesh with valid GPU buffers', async () => {
    const text = await readFile(new URL('../11 - half-edge (file)/spot.mesh', import.meta.url), 'utf8');
    const { coords, indices } = parseMesh(text);
    const mesh = new HalfEdgeDS();
    mesh.build(coords, indices);
    assert.equal(mesh.vertices.length, 2930);
    assert.equal(mesh.faces.length, 5856);
    assert.equal(mesh.halfEdges.length, 17568);
    for (const he of mesh.halfEdges) {
        assert.equal(he.opposite.opposite, he);
        assert.equal(he.opposite.vertex, he.next.vertex);
        assert.equal(he.opposite.next.vertex, he.vertex);
        assert.equal(he.next.next.next, he);
    }
    const buffers = mesh.getVBOs();
    assert.ok(buffers.slice(0, 3).every((buffer) => buffer.length === coords.length));
    assert.deepEqual(buffers[3], indices);
    assert.ok(buffers.flat().every(Number.isFinite));
    assert.ok(mesh.vertices.every((v) => Math.hypot(...v.normal) > 0));
});

test('file parsing accepts trailing whitespace and rejects malformed data', () => {
    const text = '3 1\n0 0 0 1\n1 0 0 1\n0 1 0 1\n0 1 2\n';
    assert.deepEqual(parseMesh(text).indices, [0, 1, 2]);
    for (const invalid of ['', '3 1', text + '0', text.replace('0 1 2', '0 1 3'),
        text.replace('0 1 2', '0 1 1.5'), text.replace('0 1 2', '0 1 NaN')]) {
        assert.throws(() => parseMesh(invalid));
    }
});

test('HTTP failures stop model initialization', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 404 }));
    await assert.rejects(loadMesh('missing.mesh'), /HTTP 404/);
});
