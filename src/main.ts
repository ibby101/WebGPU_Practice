import shader from "./shaders.wgsl";
import { mat4, vec3 } from "gl-matrix";
import { setupRotationControl, getIsRotating } from "./rotate_button";

const Initialise = async () => {
    const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) throw new Error("WebGPU not supported.");

    const context = canvas.getContext('webgpu')!;
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    });

    const shaderModule = device.createShaderModule({ code: shader });

    const uniformBufferSize = 4 * 16; // 64 bytes for a 4x4 matrix
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' },
        }]
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

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer },
        }],
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
        pass.setBindGroup(0, bindGroup);
        // No vertex buffers are set, as we are not using any geometry buffers
        pass.draw(36); // using draw() without vertex buffers
        pass.end();

        device.queue.submit([encoder.finish()]);
    };

    setupRotationControl(render);
};

Initialise();