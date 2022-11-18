export class Vertex {
  constructor(vid, x, y, z, color = [0.5, 0.2, 0.4, 1.0]) {
    this.vid = vid;

    this.position = [x, y, z, 1];
    this.normal = [0.0, 0.0, 0.0, 0.0];

    this.color = color;

    this.he = null;
  }
}

export class HalfEdge {
  constructor(vertex) {
    this.vertex = vertex;

    this.next = null;
    this.face = null;

    this.opposite = null;
  }
}

export class Face {
  constructor(baseHe) {
    this.baseHe = baseHe;
  }
}

export class HalfEdgeDS {
  constructor() {
    this.vertices = [];
    this.halfEdges = [];
    this.faces = [];
  }

  build(coords, trigs) {
    // construção dos vértices
    for (let vid = 0; vid < coords.length; vid+=4) {
      const x = coords[vid];
      const y = coords[vid + 1];
      const z = coords[vid + 2];

      const v = new Vertex(vid / 4, x, y, z);
      this.vertices.push(v);
    }

    // construção das faces & half-edges
    for (let tid = 0; tid < trigs.length; tid+=3) {
      const v0  = this.vertices[ trigs[tid + 0] ];
      const v1  = this.vertices[ trigs[tid + 1] ];
      const v2  = this.vertices[ trigs[tid + 2] ];

      const he0 = new HalfEdge(v0);
      const he1 = new HalfEdge(v1);
      const he2 = new HalfEdge(v2);

      const face = new Face(he0);
      this.faces.push(face);

      // atribuição das faces das half-edges
      he0.face = face;
      he1.face = face;
      he2.face = face;

      // atribuição das next
      he0.next = he1;
      he1.next = he2;
      he2.next = he0;

      this.halfEdges.push(he0, he1, he2);
    }

    this.computeOpposites();
    this.computeVertexHe();

    this.computeNormals();

    console.log(this);
  }

  computeOpposites() {
    const visited = {};

    for (let hid = 0; hid < this.halfEdges.length; hid ++) {
      const a = this.halfEdges[hid].vertex.vid;
      const b = this.halfEdges[hid].next.vertex.vid;

      const k = `k${Math.min(a,b)},${Math.max(a,b)}`;

      if (visited[k] !== undefined) {
        const op = visited[k];
        op.opposite = this.halfEdges[hid];
        this.halfEdges[hid].opposite = op;

        delete visited[k];
      }
      else {
        visited[k] = this.halfEdges[hid];
      }
    }
  }

  computeVertexHe() {
    for (let hid = 0; hid < this.halfEdges.length; hid ++) {
      const v = this.halfEdges[hid].vertex;

      if (v.he === null) {
        v.he = this.halfEdges[hid];
      }
      else if(this.halfEdges[hid].opposite === null) {
        v.he = this.halfEdges[hid];
      }
    }
  }

  computeNormals() {
    for (let fId = 0; fId < this.faces.length; fId ++) {
      const he0 = this.faces[fId].baseHe;
      const he1 = this.faces[fId].baseHe.next;
      const he2 = this.faces[fId].baseHe.next.next;

      const v0 = he0.vertex.position;
      const v1 = he1.vertex.position;
      const v2 = he2.vertex.position;

      const vec1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]]; // v1-v0
      const vec2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]]; // v2-v0

      const n = [
        vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0]
      ];

      for (let cid = 0; cid < 3; cid++) {
        he0.vertex.normal[cid] += n[cid];
        he1.vertex.normal[cid] += n[cid];
        he2.vertex.normal[cid] += n[cid];
      }
    }
  }

  getVBOs() {
    const coords  = [];
    const colors  = [];
    const normals = [];
    const indices = [];

    for (let vId = 0; vId < this.vertices.length; vId++) {
      const v = this.vertices[vId];

      coords.push(...v.position);
      colors.push(...v.color);
      normals.push(...v.normal);
    }

    for (let hid = 0; hid < this.halfEdges.length; hid++) {
      indices.push(this.halfEdges[hid].vertex.vid);
    }

    return [coords, colors, normals, indices];
  }

  estrela(v) {

  }
}