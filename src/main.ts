import shader from "./shader/shaders.wgsl";
import { mat4, vec3 } from "gl-matrix";
import { setupRotationControl, getIsRotating } from "./buttons/rotate_button";
import { setupTextureUpload } from "./buttons/upload_button"; 
import { Camera } from "./objects/camera";
import { setupMouseControl } from "./mouse_control";
import { cubeVertexData, cubeVertexCount } from "./mesh/cube_data";

const Initialise = async () => {
    const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    // Check if WebGPU is supported
    if (!device) throw new Error("WebGPU not supported.");
    const { sampler, getTextureView } = setupTextureUpload(device, () => render()); // setup texture upload, passing the device and render function

    const context = canvas.getContext('webgpu')!;
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    });

    const fallbackTexture = device.createTexture({
        size: [1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    device.queue.writeTexture(
        { texture: fallbackTexture },
        new Uint8Array([255, 255, 255, 255]), // white pixel
        { bytesPerRow: 4 },
        [1, 1]
    );

    const shaderModule = device.createShaderModule({ code: shader });

    const verticesBuffer = device.createBuffer({
        size: cubeVertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,

    });

    // writing cube vertex data to the buffer

    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexData);
    verticesBuffer.unmap(); // this makes it available for use for the GPU

    // setting up the uniform buffer for model-view-projection matrix

    const uniformBufferSize = 4 * 16 * 3; // 3 matrices (model, view, projection)
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // light uniform buffer setup

    const lightingData = new Float32Array([
    0.0, 2.0, 3.0,           // position
    1.0, 1.0, 1.0,           // color
    1.0                     // intensity
    ]);

    const lightUniformBuffer = device.createBuffer({
    size: 32, // 8 floats * 4 bytes (to keep alignment to 16 bytes)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(lightUniformBuffer, 0, lightingData);


    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {},
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {},
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }, // for light data
            }
        ]
    });

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 12 * 4, // 12 floats per vertex (position, color, UV, normal)
                attributes: [
                    {
                        shaderLocation: 0, // position
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        shaderLocation: 1, // color
                        offset: 3 * 4, // 3 floats for position
                        format: 'float32x4',
                    },
                    {
                        shaderLocation: 2, // UV
                        offset: 7 * 4, // 3 floats for position + 4 floats for color
                        format: 'float32x2',
                    },
                    {
                        shaderLocation: 3, // normal
                        offset: 9 * 4, // 3 floats for position + 4 floats for color + 2 floats for UV
                        format: 'float32x3',
                    },
                ],
            },
        ],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{
                format,
            }],
        },
        primitive: {topology: 'triangle-list'},
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    let rotation = 0;

     // creating a Camera instance
    const camera = new Camera(vec3.fromValues(0, 0, 2)); // Initial camera position, adjusted to look at the cube


    const render = () => {
        if (getIsRotating()) {
            rotation += 0.01;
        }

        const aspect = canvas.width / canvas.height;
        camera.setPerspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
        camera.updateViewMatrix(); // ensuring camera's view matrix is up-to-date for rendering

        const modelMatrix = mat4.create();
        // translate the cube itself
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0, 0, 0)); // cube is at origin relative to camera
        mat4.rotateY(modelMatrix, modelMatrix, rotation); // Apply cube's rotation
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(2, 2, 2));

        // calculate the normal matrix for lighting calculations
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);


        // get the combined view-projection matrix from the camera
        const viewProjectionMatrix = camera.getViewProjectionMatrix();

        // combine the model matrix with the camera's view-projection matrix
        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, viewProjectionMatrix, modelMatrix);

        // writing the uniform data to the GPU

        const uniformData = new Float32Array(16 * 3); // 3 matrices (model, view, projection)

        uniformData.set(modelViewProjectionMatrix, 0);
        uniformData.set(modelMatrix, 16);
        uniformData.set(normalMatrix, 32);


        device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.211, g: 0.211, b: 0.211, a: 1.0 },
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });


        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, verticesBuffer);
        const textureView = getTextureView() ?? fallbackTexture.createView();
        const dynamicBindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
                { binding: 1, resource: sampler },
                { binding: 2, resource: textureView },
                { binding: 3, resource: { buffer: lightUniformBuffer } }, // light data
            ],
        });
        pass.setBindGroup(0, dynamicBindGroup);
        pass.draw(cubeVertexCount);
        pass.end();

        device.queue.submit([encoder.finish()]);
    };

    
    setupMouseControl(canvas, camera, render); // calling setupMouseControl, passing the canvas, camera instance, and the render function
    setupRotationControl(render); // calling setupRotationControl to initialize rotation control
    render(); // initial render call
};

Initialise();