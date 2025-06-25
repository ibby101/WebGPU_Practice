import shader from "./shaders.wgsl";
import { mat4, vec3 } from "gl-matrix";
import { setupRotationControl, getIsRotating } from "./rotate_button";
import { setupTextureUpload } from "./upload_button"; 

const Initialise = async () => {
    const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    // Check if WebGPU is supported
    if (!device) throw new Error("WebGPU not supported.");
    const { sampler, getTextureView } = setupTextureUpload(device);

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

    const uniformBufferSize = 4 * 16; // 64 bytes for a 4x4 matrix
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
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
            }
        ]
    });

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [], 
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{ format }]
        },
        primitive: { topology: 'triangle-list' },
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

    const render = () => {
        if (getIsRotating()) {
            rotation += 0.01;
        }

        const aspect = canvas.width / canvas.height;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 100.0);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(0, 0, -4));
        
        mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation);

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrix);

        mat4.scale(modelViewProjectionMatrix, modelViewProjectionMatrix, vec3.fromValues(2, 2, 2));

        device.queue.writeBuffer(uniformBuffer, 0, modelViewProjectionMatrix as Float32Array);

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 },
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        pass.setPipeline(pipeline);
        const textureView = getTextureView() ?? fallbackTexture.createView();
        const dynamicBindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
                { binding: 1, resource: sampler },
                { binding: 2, resource: textureView },
            ],
        });
        pass.setBindGroup(0, dynamicBindGroup);
        // No vertex buffers are set, as we are not using any geometry buffers
        pass.draw(36); // using draw() without vertex buffers
        pass.end();

        device.queue.submit([encoder.finish()]);
    };

    setupRotationControl(render);
};

Initialise();