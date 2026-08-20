export default /* wgsl */ `
struct Uniforms {
  transform : vec4f,
  ambient : vec4f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@fragment
fn main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color + uniforms.ambient;
}
`;
