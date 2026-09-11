export default /* wgsl */ `
struct Uniforms {
  modelView : mat4x4f,
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
) -> VertexOutput {
  var output : VertexOutput;
  output.position = uniforms.modelView * position;
  output.color = color;
  return output;
}
`;