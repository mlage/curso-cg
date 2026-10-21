export default /* wgsl */ `
struct Uniforms {
  model : mat4x4f,
  view : mat4x4f,
  projection : mat4x4f,
  normalMatrix : mat4x4f,
  lightPosition : vec4f,
  ambient : vec4f,
  diffuse : vec4f,
  specular : vec4f,
  lightParams : vec4f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@fragment
fn main(
  @location(0) color : vec4f,
  @location(1) viewPosition : vec3f,
  @location(2) viewNormal : vec3f,
) -> @location(0) vec4f {
  let normal = normalize(viewNormal);
  let viewLightPosition = uniforms.view * uniforms.lightPosition;
  let lightDir = normalize(viewLightPosition.xyz - viewPosition);
  let cameraDir = normalize(-viewPosition);

  let diffuseFactor = max(0.0, dot(lightDir, normal));
  let halfVector = normalize(lightDir + cameraDir);
  let specularFactor = pow(max(0.0, dot(halfVector, normal)), uniforms.lightParams.x);

  let ambientColor = uniforms.ambient.a * uniforms.ambient;
  let diffuseColor = diffuseFactor * uniforms.diffuse.a * uniforms.diffuse;
  let specularColor = specularFactor * uniforms.specular.a * uniforms.specular;
  let litColor = 0.25 * color + 0.75 * (ambientColor + diffuseColor + specularColor);

  return vec4f(litColor.rgb, 1.0);
}
`;
