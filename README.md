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

`11 - half-edge (file)/dragon.mesh` contains the Stanford Dragon: 437,645 vertices and 871,414 triangles, converted from `dragon_vrip.ply` in the official [reconstruction archive](https://graphics.stanford.edu/pub/3Dscanrep/dragon/dragon_recon.tar.gz). It uses the same numeric format, bounding-box centering, and uniform scaling as `spot.mesh`, preserving the source triangle indices. To view it, replace `./spot.mesh` with `./dragon.mesh` in that example's `main.js`; the default remains Spot. The Dragon is much larger and requires more memory to load and build its half-edge structure.

Dragon source and credit: Stanford University Computer Graphics Laboratory, [Stanford 3D Scanning Repository](https://graphics.stanford.edu/data/3Dscanrep/). Stanford permits research use and free redistribution with attribution; commercial use requires permission. See the repository's full usage conditions, including its guidance on culturally respectful use of the Dragon.

## Modelagem: planar implicit and parametric curves

Open `12 - modelagem/main.html` using the same HTTP server and a WebGPU-enabled browser. This independent example keeps the existing `10 - half-edge` folder unchanged and reuses `lib/webgpu.js`, with its own local shaders (`simple.vert.js` and `simple.frag.js`) and no dependencies on other example folders. No half-edges, 3D models, lighting, or depth testing are needed.

The responsive explorer groups curve selection, visibility, and sampling controls in a side panel, with a color legend and sampling statistics around the viewport. On smaller screens, the controls move above the canvas. Select a curve, then independently show or hide its **implicit** (pink) and **parametric** (cyan) versions using the two checkboxes. Both start visible; hiding both clears the canvas. The two forms share the same coordinates and renderer. Adjust the implicit grid resolution and parametric segment count independently to compare their approximations. The parametric version is drawn last and may cover the implicit version where they coincide.

All definitions live in `12 - modelagem/curves.js`. Every entry provides a `label`, an `implicit(x, y)` field, and a `parametric` array of pieces, each with `curve(t) = [x, y]`, `minT`, and `maxT`. The selector is generated from this file. Examples include a heart, circle, ellipse, lemniscate, four-leaf clover, Cassini ovals, Lissajous curve, trigonometric waves, and Boolean combinations. Separate parametric pieces avoid connecting disconnected components or unrelated branches.

The heart now uses the matching pair `x = sin(t)`, `y = 0.8*(cos(t) + |sin(t)|^(2/3)) - 0.4` and `x² + ((y + 0.4)/0.8 - |x|^(2/3))² - 1 = 0`, rather than two different heart shapes. The open spiral is omitted because it has no straightforward continuous, sign-changing implicit counterpart for this Marching Squares example.

The selector also includes Boolean combinations of two overlapping unit circles, centered at `(-0.5, 0)` and `(0.5, 0)`. With negative values representing the interior of each shape, union is `Math.min(f, g)`, intersection is `Math.max(f, g)`, and difference (A minus B) is `Math.max(f, -g)`. These produce an outer outline, a lens, and a crescent, respectively. Combine field values rather than JavaScript booleans so edge interpolation still has a continuous scalar field.

The algorithm is isolated in `12 - modelagem/marching-squares.js`:

```js
const segments = marchingSquares(
    (x, y) => x * x + ((y + 0.4) / 0.8 - Math.abs(x) ** (2 / 3)) ** 2 - 1,
    { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 },
    128, // Cell count per axis; [columns, rows] also works.
);
```

The function extracts the zero contour and returns a `Float32Array` containing independent segments as `[x1, y1, x2, y2, ...]` in domain coordinates. It samples each grid vertex once, interpolates edge crossings linearly, and resolves ambiguous cells using the bilinear asymptotic decider (determinant ties consistently pair bottom/right and top/left). Exact zeros count as nonnegative; zero-length segments are omitted. An identically zero field has no unique curve and returns no segments. Use continuous, finite-valued fields; features smaller than a cell can be missed. Rendering preserves the domain's aspect ratio and redraws only when controls change.

### Parametric sampling

Each selected curve can display its parametric form alongside its implicit form. The segment count applies to each parametric piece: for example, Cassini ovals have two pieces, so a count of 128 produces 256 segments in total. Boolean boundaries use the appropriate arcs of the original circles. The trigonometric-wave pieces cover the displayed domain; extend their branch ranges if you enlarge the view.

`12 - modelagem/parametric-curve.js` handles sampling separately from rendering:

```js
const segments = sampleParametricCurve(
    (t) => [1.5 * Math.cos(t), 0.75 * Math.sin(t)],
    0, 2 * Math.PI, // Parameter interval, including both endpoints.
    128, // Number of line segments; evaluates the curve 129 times.
);
```

It returns the same packed `Float32Array` format as Marching Squares, so both samplers share the existing line renderer and local shaders. Sampling uses uniform steps in the parameter, not uniform arc length. Open curves are not closed automatically; for a closed curve, choose an interval whose endpoints coincide. Functions must be continuous and return two finite coordinates. The displayed domain remains `[-2, 2] × [-1.5, 1.5]`; change `Scene.bounds` to accommodate other examples.

## Aulas
Segundas e Quartas de 11 às 13h.

## Instruções
Para rodar os códigos contidos neste repositório, recomendo a utilização da IDE [Visual Studio Code](https://code.visualstudio.com/) com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) instalada.
