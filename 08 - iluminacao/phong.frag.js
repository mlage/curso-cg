export default
`#version 300 es
precision highp float;

in vec4 vPosition;
in vec4 vColor;
in vec4 vNormal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec4 minhaColor;

void main()
{
  // parametros da luz
  vec4 lightPos = vec4(0.0, 3.0, 0.0, 1.0); 

  vec4 ambientColor = vec4(1.0, 1.0, 1.0, 1.0); 
  vec4 diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 speclarColor = vec4(1.0, 1.0, 1.0, 1.0);
  float kA = 0.1, kD = 0.5, kS = 0.75, sN = 2.0;

  mat4 modelview = u_view * u_model;

  vec4 viewPos = modelview * vPosition;
  vec4 viewNrm = transpose(inverse(modelview)) * vNormal;
  viewNrm = normalize(viewNrm);

  // componente difusa
  vec4 lightViewPos = u_view * lightPos;
  vec4 lightDir = normalize(lightViewPos - viewPos);
  float iD = max(0.0, dot(lightDir, viewNrm));

  // componente especular
  vec4 cameraDir = normalize(vec4(0.0, 0.0, 0.0, 1.0) - viewPos);
  vec4 halfVec   = normalize(lightDir + cameraDir);
  float iS = pow(max(0.0, dot(viewNrm, halfVec)), sN);

  minhaColor = (kA * ambientColor + kD * iD * diffuseColor + kS * iS * speclarColor) * vColor;

  // minhaColor = abs(viewNrm);
}`


