import Camera from './cameraP.js';
import Mesh from './mesh.js';

class Scene {
  constructor(gl) {
    // Camera virtual
    this.cam = new Camera(gl);

    // Mesh
    this.mesh = new Mesh(1.0);
    this.copy = new Mesh(-1.0);

    // Initialization
    this.init(gl);
  }

  init(gl) {
    this.mesh.init(gl);
    this.copy.init(gl);
  }

  draw(gl) {  
    this.cam.updateCam();

    this.mesh.draw(gl, this.cam);
    this.copy.draw(gl, this.cam);
  }
}

class Main {
  constructor() {
    const canvas = document.querySelector("#glcanvas");
    this.gl = canvas.getContext("webgl2");
    
    var devicePixelRatio = window.devicePixelRatio || 1;
    this.gl.canvas.width = 1024 * devicePixelRatio;
    this.gl.canvas.height = 768 * devicePixelRatio;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.scene = new Scene(this.gl);
  }

  draw() {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.scene.draw(this.gl);

    requestAnimationFrame(this.draw.bind(this));
  }
}

window.onload = () => {
  const app = new Main();
  app.draw();
}


