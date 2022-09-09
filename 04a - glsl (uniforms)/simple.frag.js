export default
`#version 300 es
precision highp float;

in vec4 vColor;
uniform vec4 u_amb;

out vec4 minhaColor;

void main()
{
  minhaColor = vColor + u_amb;
}`


