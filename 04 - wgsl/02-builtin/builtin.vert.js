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
  @location(0) center : vec2f,
  @location(1) corner : vec2f,
  @location(2) color : vec4f,
) -> VertexOutput {
  var output : VertexOutput;
  let dp = uniforms.transform.x;
  let scale = uniforms.transform.y;
  let radiusPx = uniforms.canvas.z;
  let radiusClip = vec2f(
    (radiusPx / uniforms.canvas.x) * 2.0,
    (radiusPx / uniforms.canvas.y) * 2.0,
  );

  let clipCenter = center * scale + vec2f(dp, dp);
  let clipPosition = clipCenter + corner * radiusClip;

  output.position = vec4f(clipPosition, 0.0, 1.0);
  output.color = color;
  output.centerPx = clipToPixel(clipCenter, uniforms.canvas.xy);
  output.radiusPx = radiusPx;

  return output;
}
`;
