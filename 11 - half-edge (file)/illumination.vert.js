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

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) viewPosition : vec3f,
  @location(2) viewNormal : vec3f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) color : vec4f,
  @location(2) normal : vec4f,
) -> VertexOutput {
  let modelView = uniforms.view * uniforms.model;
  let viewPosition = modelView * position;

  var output : VertexOutput;
  output.position = uniforms.projection * viewPosition;
  output.color = color;
  output.viewPosition = viewPosition.xyz;
  output.viewNormal = (uniforms.normalMatrix * normal).xyz;
  return output;
}
`;
