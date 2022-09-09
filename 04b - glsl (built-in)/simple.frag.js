export default
`#version 300 es
precision highp float;

in vec4 vColor;
out vec4 minhaColor;

void main()
{
  float dist  = length(gl_PointCoord.xy - vec2(.5, .5));
  float alpha = (dist < 0.5) ? 1.0 : 0.0;

  minhaColor = vec4(vColor.rgb, vColor.a * alpha);
}`


