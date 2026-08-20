export default /* wgsl */ `
struct Uniforms {
  transform : vec4f,
  ambient : vec4f,
  canvas : vec4f,
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
  let dp = uniforms.transform.x;
  let scale = uniforms.transform.y;

  output.position = vec4f(position.xy * scale + vec2f(dp, dp), 0.0, 1.0);
  output.color = color;

  return output;
}
`;
