// Defining the Fragment struct first, as it's used as a return type and input
// Without this, the shader will not compile
struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>
};

// Defining a uniform buffer to hold the transformation matrix
struct Uniforms {
    modelMatrix : mat4x4<f32>,
    projectionMatrix : mat4x4<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms : Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) i_id : u32) -> Fragment {
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5)
    );

    var colors = array<vec3<f32>, 3>(
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0)
    );

    var output : Fragment;

    // Apply projection AND model matrices
    output.Position = uniforms.projectionMatrix * uniforms.modelMatrix * vec4<f32>(positions[i_id], 0.0, 1.0);
    output.Color = vec4<f32>(colors[i_id], 1.0);

    return output;
}

@fragment
fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}