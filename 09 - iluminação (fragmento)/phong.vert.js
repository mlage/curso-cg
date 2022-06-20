export default 
`#version 300 es
precision highp float;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

in vec4 position;
in vec4 color;
in vec4 normal;

out vec4 fPosition;
out vec4 fColor;
out vec4 fNormal;

void main() {
  mat4 modelView = u_view * u_model;

  // posição final do vertice
  gl_Position  = u_projection * modelView * position;
  gl_Position /= gl_Position.w;

  fPosition = position;
  fColor = color;
  fNormal = normal;
}`