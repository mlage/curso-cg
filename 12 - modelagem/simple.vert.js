export default /* wgsl */ `
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) stroke : vec4f,
};

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) color : vec4f,
  @location(2) stroke : vec4f,
) -> VertexOutput {
  var output : VertexOutput;
  output.position = position;
  output.color = color;
  output.stroke = stroke;
  return output;
}
`;
