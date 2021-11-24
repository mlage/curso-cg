export default 
`#version 300 es
precision highp float;

in vec4 position;
in vec4 color;

uniform float u_dp;
uniform float u_s;

out vec4 vColor;

void main()
{
    gl_Position.xy = position.xy * u_s + vec2(u_dp);
    gl_Position.w = 1.0f;

    gl_PointSize = 100.0f;

    vColor = color;
}`