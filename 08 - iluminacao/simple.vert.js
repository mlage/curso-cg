export default 
`#version 300 es
precision highp float;

in vec4 position;
in vec4 color;
in vec4 normal;

uniform mat4 u_modelview;
uniform mat4 u_projection;

out vec4 vColor;

void main()
{
    // parametros da luz
    // obs: sistema de coordenada da camera
    vec4 lightPos = vec4(0.0, 0.0, 0.0, 1.0); 

    vec4 ambientColor = vec4(1.0, 1.0, 1.0, 1.0); 
    vec4 diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 speclarColor = vec4(1.0, 1.0, 1.0, 1.0);
    float kA =  0.1, kD = 1.0, kS = 1.0, sN = 4.0;

    vec4 viewPos = u_modelview * position;
    vec4 viewNrm = transpose(inverse(u_modelview)) * normal;
    viewNrm = normalize(viewNrm);

    // componente difusa
    vec4 lightDir = normalize(lightPos - viewPos);
    float iD = max(0.0, dot(lightDir, viewNrm));

    // componente especular
    vec4 cameraDir = normalize(vec4(0.0,0.0,0.0,1.0) - viewPos);
    vec4 halfVec   = normalize(lightDir + cameraDir);
    float iS =  pow(max(0.0, dot(viewNrm, halfVec)), sN);

    gl_Position = u_projection * viewPos;
    vColor = (kA * ambientColor + kD * iD * diffuseColor + kS * iS * speclarColor) * color;
}`