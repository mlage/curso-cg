export default 
`#version 300 es
precision highp float;

in vec4 position;
in vec4 normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec4 vPosition;
out vec4 vNormal;

void main()
{
  vPosition = position;
  vNormal = normal;

  gl_Position = u_projection * u_view * u_model * position;
}`