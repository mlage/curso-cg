export default class Shader {
  static createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var info = gl.getShaderInfoLog(shader);
      console.log('Could not compile WebGL program:' + info);
    }

    return shader;
  }

  static createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var info = gl.getProgramInfoLog(program);
      console.log('Could not compile WebGL program:' + info);
    }

    return program;
  }

  static isArrayBuffer(value) {
    return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
  }

  static createBuffer(gl, type, data) {
    if (data.length == 0)
      return null;

    if (!Shader.isArrayBuffer(data)) {
      console.warn('Data is not an instance of ArrayBuffer');
      return null;
    }

    var buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);

    return buffer;
  }

  static createVAO(gl, posAttribLoc, posBuffer, colorAttribLoc = null, colorBuffer = null, normAttribLoc = null, normBuffer = null) {
    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);

    if (posAttribLoc != null && posAttribLoc != undefined) {
      gl.enableVertexAttribArray(posAttribLoc);
      var size = 4;
      var type = gl.FLOAT;
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.vertexAttribPointer(posAttribLoc, size, type, false, 0, 0);
    }

    if (colorAttribLoc != null && colorAttribLoc != undefined) {
      gl.enableVertexAttribArray(colorAttribLoc);
      size = 4;
      type = gl.FLOAT;
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.vertexAttribPointer(colorAttribLoc, size, type, false, 0, 0);
    }

    if (normAttribLoc != null && normAttribLoc != undefined) {
      gl.enableVertexAttribArray(normAttribLoc);
      size = 4;
      type = gl.FLOAT;
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
      gl.vertexAttribPointer(normAttribLoc, size, type, false, 0, 0);
    }

    return vao;
  }
}