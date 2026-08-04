export default /* wgsl */ `
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) color : vec4f,
) -> VertexOutput {
  var output : VertexOutput;
  output.position = position;
  output.color = color;
  return output;
}
`;
