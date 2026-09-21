export default /* wgsl */ `
struct Uniforms {
  model : mat4x4f,
  view : mat4x4f,
  projection : mat4x4f,
  lightPosition : vec4f,
  ambient : vec4f,
  diffuse : vec4f,
  specular : vec4f,
  lightParams : vec4f,
};

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) color : vec4f,
  @location(2) normal : vec4f,
) -> VertexOutput {
  let modelView = uniforms.view * uniforms.model;

  // Posição do vértice no sistema da câmera.
  let viewPosition = modelView * position;

  // Normal do vértice no sistema da câmera. Como o exemplo usa escala uniforme,
  // modelView * normal preserva a direção após a normalização.
  let viewNormal = normalize((modelView * normal).xyz);

  // Posição da luz no sistema da câmera.
  let viewLightPosition = uniforms.view * uniforms.lightPosition;

  // Direção da luz e direção da câmera, que está na origem do sistema da câmera.
  let lightDir = normalize(viewLightPosition.xyz - viewPosition.xyz);
  let cameraDir = normalize(-viewPosition.xyz);

  // Componente difusa de Phong.
  let diffuseFactor = max(0.0, dot(lightDir, viewNormal));

  // Componente especular usando o half vector.
  let halfVector = normalize(lightDir + cameraDir);
  let specularFactor = pow(max(0.0, dot(halfVector, viewNormal)), uniforms.lightParams.x);

  let ambientColor = uniforms.ambient.a * uniforms.ambient;
  let diffuseColor = diffuseFactor * uniforms.diffuse.a * uniforms.diffuse;
  let specularColor = specularFactor * uniforms.specular.a * uniforms.specular;

  let litColor = 0.4 * color + 0.6 * (ambientColor + diffuseColor + specularColor);

  var output : VertexOutput;
  output.position = uniforms.projection * viewPosition;
  output.color = vec4f(litColor.rgb, 1.0);
  return output;
}
`;