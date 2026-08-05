export default /* wgsl */ `
struct Uniforms {
  transform : vec4f,
  canvas : vec4f,
};

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) centerPx : vec2f,
  @location(2) radiusPx : f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

fn clipToPixel(clip : vec2f, canvas : vec2f) -> vec2f {
  return vec2f(
    (clip.x * 0.5 + 0.5) * canvas.x,
    (1.0 - (clip.y * 0.5 + 0.5)) * canvas.y,
  );
}

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) color : vec4f,
  @location(2) center : vec2f,
) -> VertexOutput {
  var output : VertexOutput;
  let dp = uniforms.transform.x;
  let scale = uniforms.transform.y;
  let offset = vec2f(dp, 0.0);

  let clipPosition = position.xy * scale + offset;
  let clipCenter = center * scale + offset;

  output.position = vec4f(clipPosition, 0.0, 1.0);
  output.color = color;
  output.centerPx = clipToPixel(clipCenter, uniforms.canvas.xy);
  output.radiusPx = uniforms.canvas.z * scale;

  return output;
}
`;
