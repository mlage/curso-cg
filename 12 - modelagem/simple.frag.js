export default /* wgsl */ `
@fragment
fn main(
  @location(0) color : vec4f,
  @location(1) stroke : vec4f,
) -> @location(0) vec4f {
  // Distance to a capsule: a line segment with rounded ends.
  let along = max(abs(stroke.x) - stroke.z, 0.0);
  let distance = length(vec2f(along, stroke.y)) - stroke.w;
  // Derivatives adapt the antialiasing fringe to the drawing-buffer resolution.
  let fringe = max(fwidth(distance), 0.0001);
  let coverage = 1.0 - smoothstep(-0.5 * fringe, 0.5 * fringe, distance);
  return vec4f(color.rgb, color.a * coverage);
}
`;
