export default
`#version 300 es
precision highp float;

in vec4 vColor;
out vec4 corFinal;

void main()
{
  corFinal = vColor;
}`