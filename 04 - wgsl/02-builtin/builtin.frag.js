export default /* wgsl */ `
struct Uniforms {
  transform : vec4f,
  ambient : vec4f,
  canvas : vec4f,
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  let uv = input.position.xy / uniforms.canvas.xy;
  let builtinColor = vec4f(uv.x, uv.y, 0.0, 0.0);

  return input.color + uniforms.ambient + builtinColor;
}
`;
