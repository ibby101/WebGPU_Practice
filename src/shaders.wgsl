struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) Color: vec4<f32>,
    @location(1) UV: vec2<f32>,
};
struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1) var mySampler: sampler;

@group(0) @binding(2) var myTexture: texture_2d<f32>;

@vertex
fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> VertexOutput {
    // Array of 8 unique vertex positions for the cube
    let positions = array<vec3<f32>, 8>(
        vec3<f32>(-0.5, -0.5,  0.5), // 0
        vec3<f32>( 0.5, -0.5,  0.5), // 1
        vec3<f32>( 0.5,  0.5,  0.5), // 2
        vec3<f32>(-0.5,  0.5,  0.5), // 3
        vec3<f32>(-0.5, -0.5, -0.5), // 4
        vec3<f32>(-0.5,  0.5, -0.5), // 5
        vec3<f32>( 0.5,  0.5, -0.5), // 6
        vec3<f32>( 0.5, -0.5, -0.5), // 7
    );

    // Index map to define the 12 triangles for cube faces
    let indices = array<u32, 36>(
        0, 1, 2,  0, 2, 3,  // Front
        4, 5, 6,  4, 6, 7,  // Back
        3, 2, 6,  3, 6, 5,  // Top
        0, 1, 7,  0, 7, 4,  // Bottom
        1, 7, 6,  1, 6, 2,  // Right
        0, 4, 5,  0, 5, 3   // Left
    );

    let vertex_index = indices[in_vertex_index];
    let pos = positions[vertex_index];

    var output: VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * vec4<f32>(pos, 1.0);

    // directly assigning the desired color here
    output.Color = vec4<f32>(0.0, 1.0, 0.0, 1.0); // light blue color

    output.UV = pos.xy + vec2<f32>(0.5); // remap from [-0.5, 0.5] → [0.0, 1.0]

    output.UV = vec2<f32>(pos.x + 0.5, 1.0 - (pos.y + 0.5));

    return output;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let texColor = textureSample(myTexture, mySampler, in.UV);
    return texColor * in.Color;
}