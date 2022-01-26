export class Vertex {
  constructor() {
    this.coords = [];
    this.normal = [];

    this.he = null; // he partido do vertice
    this.id = -1;
  }
}

export class Hedge {
  constructor() {
    this.twin = null; // he oposta
    this.next = null; // próxima he no ciclo da face
    this.face = null; // face que contem a he
    this.vert = null; // vertice de partida da he
  }
}

export class Face {
  constructor() {
    this.he = null; // uma das he da face
  }
}

export default class Mesh {
  constructor() {
    this.vertices = []; // lista com os vértices da malha
    this.hedges = []; // lista com as he da malha
    this.faces = []; // lista com as faces da malha
  }

  build(coords, normais, ids) {
    // vertices
    // assumindo que coords e normais tem mesmo tamanho
    for (let vId = 0; vId < coords.length; vId++) {
      const v = new Vertex();
      v.coords = coords[vId];
      v.normal = normais[vId];
      v.id = vId;

      this.vertices.push(v);
    }

    // half-edges e Faces
    for (let tId = 0; tId < ids.length; tId++) {
      // crio uma face nova
      const face = new Face();

      // crio a primeira he
      const vA = ids[tId][0];
      const vertexA = this.vertices[vA];
      const heA = new Hedge();

      // atribuo he do vertice
      vertexA.he = heA;
      // atribuo vert e face da he
      heA.vert = vertexA;
      heA.face = face;

      const vB = ids[tId][1];
      const vertexB = this.vertices[vB];
      const heB = new Hedge();

      vertexB.he = heB;
      heB.vert = vertexB;
      heB.face = face;

      const vC = ids[tId][2];
      const vertexC = this.vertices[vC];
      const heC = new Hedge();

      vertexC.he = heC;
      heC.vert = vertexC;
      heC.face = face;

      // atribuo os next
      heA.next = heB;
      heB.next = heC;
      heC.next = heA;

      this.hedges.push(heA);
      this.hedges.push(heB);
      this.hedges.push(heC);

      // atribuo o he da face
      face.he = heA;
      this.faces.push(face);
    }

    this.matchTwins();
  }

  matchTwins() {
    const found = [];

    for (let hId = 0; hId < this.hedges.length; hId++) {
      const vA = this.hedges[hId].vert;
      const vB = this.hedges[hId].next.vert;

      const edge = [vA, vB, hId];

      const id = found.findIndex(e => {
        return (e[0] === edge[1] && e[1] === edge[0]);
      });

      if (id < 0) {
        found.push(edge);
      }
      else {
        const oposite = this.hedges[found[id][2]];

        oposite.twin = this.hedges[hId];
        this.hedges[hId].twin = oposite 

        found.splice(id, 1);
      }
    }
  }

  facesIncidentes(vId) {
    const vert = this.vertices[vId];

    let he = vert.he;
    let fhe = he.face;

    const faces = []
    while(!faces.includes(fhe)) {
      faces.push(fhe);

      he = he.twin.next;
      fhe = he.face;
    }

    return faces;
  }

  getVBOs() {
    const vboCoords = []
    const vboNorms = []

    for (let vId = 0; vId < this.vertices.length; vId++) {
      const v = this.vertices[vId];
      
      vboCoords.push(...v.coords);
      vboNorms.push(...v.normal);
    }

    return [vboCoords, vboNorms];
  }

  getIds() {
    const ids = [];

    for (let fId = 0; fId < this.faces.length; fId++) {
      const f = this.faces[fId];

      const v0 = f.he.vert.id;
      const v1 = f.he.next.vert.id;
      const v2 = f.he.next.next.vert.id;

      ids.push(v0, v1, v2);
    }

    return ids;
  }
  
}
