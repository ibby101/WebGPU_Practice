
// adding a vertex input structure for handling data from vertex buffers.

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) normal: vec3<f32>, // using this for lighting calculations
}

// defining data to be passed from vertex shader to fragment shader.

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) Color: vec4<f32>,
    @location(1) UV: vec2<f32>,
    @location(2) Normal: vec3<f32>, 
    @location(3) WorldPosition: vec4<f32>, // using world space position for lighting calculations
};
struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
    modelMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>, // for transforming normals
}
 
 // defining a structure for light data to be used in the fragment shader.

struct Light {
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
}

// bindings for uniforms, samplers, and textures.

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1) var mySampler: sampler;

@group(0) @binding(2) var myTexture: texture_2d<f32>;

// another binding for light data.

@group(0) @binding(3) var<uniform> light: Light;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;

    // calculatin the world position of the vertex

    out.WorldPosition = uniforms.modelMatrix * vec4<f32>(in.position, 1.0);

    // calculating the clip space position of the vertex
    // this is what the camera will see

    out.Position = uniforms.modelViewProjectionMatrix * vec4<f32>(in.position, 1.0);

    // passing the original colour and UV to fragment shader

    out.Color = in.color;
    out.UV = in.uv;

    // transforming the normal vector to world space

    out.Normal = (uniforms.normalMatrix * vec4<f32>(in.normal, 0.0)).xyz;

    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {

    // sample the texture using the UV coordinates

    let texColor = textureSample(myTexture, mySampler, in.UV);

    // phong lighting model

    let ambientStrength = 0.5; // controls strength of ambient light
    let ambient = ambientStrength * light.color;
    
    // light diffusion calculation

    let lightDir = normalize(light.position - in.WorldPosition.xyz);
    let normal =  normalize(in.Normal); // ensure the normal is normalised 

    // calculating the dot product between the light direction and the normal vector

    let diff = max(dot(normal, lightDir), 0.0);
    let diffuse = diff * light.color * light.intensity;

    // combining ambient and diffuse lighting

    let finalLighting = ambient + diffuse;
    let finalColour = vec4<f32>(texColor.rgb * finalLighting, texColor.a);


    return finalColour;
}