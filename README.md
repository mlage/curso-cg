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

Run the topology and file-loading tests with `node --test tests/half-edge.test.mjs` (Node.js 22 or newer).

## Aulas
Segundas e Quartas de 11 às 13h.

## Instruções
Para rodar os códigos contidos neste repositório, recomendo a utilização da IDE [Visual Studio Code](https://code.visualstudio.com/) com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) instalada.
