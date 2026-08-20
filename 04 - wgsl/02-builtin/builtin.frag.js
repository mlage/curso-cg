export default /* wgsl */ `
struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) centerPx : vec2f,
  @location(2) radiusPx : f32,
};

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  let dist = distance(input.position.xy, input.centerPx);

  if (dist > input.radiusPx) {
    discard;
  }

  return input.color;
}
`;
