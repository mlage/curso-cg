export default
`#version 300 es
precision highp float;

in vec4 vColor;
out vec4 minhaColor;

uniform vec4 u_amb;

void main()
{
  minhaColor = vColor + u_amb;
}`


