export default 
`#version 300 es
precision highp float;

in vec4 position;
in vec4 color;

uniform mat4 u_modelView;

out vec4 vColor;

void main()
{
    gl_Position  = u_modelView * position;
    gl_Position /= gl_Position.w;

    vColor = color;
}`