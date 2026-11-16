## Curso de Computação Gráfica

Códigos utilizados no curso de Computação Gráfica oferecido pelo prof. Marcos Lage para o curso de Ciência da Computação do Instituto de Computação da UFF.

## Prof. Marcos Lage
website: www.ic.uff.br/~mlage
e-mail: mlage@ic.uff.br

## WebGPU half-edge examples

- `10 - half-edge/main.html`: indexed cubes built through the original half-edge data structure, with smooth vertex normals.
- `11 - half-edge (file)/main.html`: asynchronous file loading and the Spot model (2,930 vertices and 5,856 triangles).

Both examples retain example 09's WebGPU wrapper, WGSL fragment lighting, depth testing, back-face culling, and rotating meshes. The cubes use teal and copper materials, and Spot uses teal; ambient and diffuse lighting are tinted by the material color, with restrained white specular highlights. `lib/half-edge.js` preserves the legacy topology API and area-weighted normal accumulation; vertex normals are normalized in the fragment shader. The unfinished `estrela` exercise is unchanged.

Serve the repository over HTTP (for example, `python3 -m http.server 8000`), then open either page on localhost in a WebGPU-enabled browser. No dependencies or build step are required.

`spot.mesh` uses the original lesson's numeric format, not Wavefront OBJ: vertex and triangle counts, four coordinates (`x y z w`) per vertex, then zero-based triangle indices. Spot's positions were centered at the bounding-box midpoint and uniformly scaled so the longest dimension is 2. Normals are recomputed by the half-edge implementation.

Spot is by [Keenan Crane](https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository/#spot), available under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The triangle mesh was obtained from the [common-3d-test-models mirror](https://github.com/alecjacobson/common-3d-test-models/blob/master/data/spot.obj). Geometry is included locally; the examples do not need external downloads at runtime.

Run the topology and file-loading tests with `node --test tests/half-edge.test.mjs` (Node.js 22 or newer).

## Marching Squares: planar implicit curves

Open `12 - marching squares/main.html` using the same HTTP server and a WebGPU-enabled browser. This independent example keeps the existing `10 - half-edge` folder unchanged and reuses `lib/webgpu.js`, with its own local shaders (`simple.vert.js` and `simple.frag.js`) and no dependencies on other example folders. No half-edges, 3D models, lighting, or depth testing are needed.

Choose a heart, circle, lemniscate, four-leaf clover, Cassini ovals, or trigonometric waves, and change the grid resolution to compare sampling quality. Add custom functions to `curves` in `12 - marching squares/main.js`.

The selector also includes Boolean combinations of two overlapping unit circles, centered at `(-0.5, 0)` and `(0.5, 0)`. With negative values representing the interior of each shape, union is `Math.min(f, g)`, intersection is `Math.max(f, g)`, and difference (A minus B) is `Math.max(f, -g)`. These produce an outer outline, a lens, and a crescent, respectively. Combine field values rather than JavaScript booleans so edge interpolation still has a continuous scalar field.

The algorithm is isolated in `12 - marching squares/marching-squares.js`:

```js
const segments = marchingSquares(
    (x, y) => (x * x + y * y - 1) ** 3 - x * x * y ** 3,
    { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 },
    128, // Cell count per axis; [columns, rows] also works.
);
```

The function extracts the zero contour and returns a `Float32Array` containing independent segments as `[x1, y1, x2, y2, ...]` in domain coordinates. It samples each grid vertex once, interpolates edge crossings linearly, and resolves ambiguous cells using the bilinear asymptotic decider (determinant ties consistently pair bottom/right and top/left). Exact zeros count as nonnegative; zero-length segments are omitted. An identically zero field has no unique curve and returns no segments. Use continuous, finite-valued fields; features smaller than a cell can be missed. Rendering preserves the domain's aspect ratio and redraws only when controls change.

Run all tests with `node --test tests/*.test.mjs` (Node.js 22 or newer).

## Aulas
Segundas e Quartas de 11 às 13h.

## Instruções
Para rodar os códigos contidos neste repositório, recomendo a utilização da IDE [Visual Studio Code](https://code.visualstudio.com/) com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) instalada.
