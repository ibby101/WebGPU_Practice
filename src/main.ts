import shader from "./shaders.wgsl";
import { mat4, vec3 } from "gl-matrix";

// Importing the rotation controller
// This will handle the rotation logic and animation frame requests.
import { setupRotationControl, getIsRotating } from "./rotate_button";

const Initialise = async () => {
    const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) throw new Error("WebGPU not supported.");



    const context = canvas.getContext('webgpu')!;
    const format = navigator.gpu.getPreferredCanvasFormat(); // Use preferred format

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied', // Use premultiplied alpha for better blending
    });

    const shaderModule = device.createShaderModule({ code: shader });

    // Creating a uniform buffer to hold the model and projection matrices
    // The size is 4 * 16 bytes for the model matrix and 4 * 16 bytes for the projection matrix
    // 4 * 16 bytes = 64 bytes for each matrix, total 128 bytes
    const uniformBufferSize = 4 * 16 * 2;
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
            buffers: []
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{ format }]
        },
        primitive: { topology: 'triangle-list' },
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer },
        }],
    });

    // Triangle's local center calculation
    const triangleCenterX = 0.0;
    const triangleCenterY = -0.5 / 3.0;

    let rotation = 0;

    // Creating the projection matrix
    // This matrix is used to project 3D coordinates into 2D screen space
    const aspect = canvas.width / canvas.height;
    const fieldOfView = (2 * Math.PI) / 5; // 36 degrees in radians
    const zNear = 0.1; // Objects closer than this are clipped
    const zFar = 100.0; // Objects further than this are clipped
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Writing the projection matrix to the uniform buffer
    // This is done once, as the projection matrix does not change during the animation
    device.queue.writeBuffer(uniformBuffer, 4 * 16, projectionMatrix as Float32Array);


    const render = () => {
        // Only rotate if the button is toggled
        // This function is called every frame to update the rotation and render the triangle
        if (getIsRotating()) {
            rotation += 0.01;
        }

        const modelMatrix = mat4.create();

        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0, 0, -2.0)); // World position of the triangle's geometric center

        // Translating the local center of triangle to the origin (0,0,0)
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(-triangleCenterX, -triangleCenterY, 0));

    
        // Rotating happens around its own center.
        mat4.rotateY(modelMatrix, modelMatrix, rotation);

        // Translating the object's local center back from the origin.
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(triangleCenterX, triangleCenterY, 0));

        // 5. Applying scaling for visibility
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(1.5, 1.5, 1.5));


        // Write the updated model matrix to the uniform buffer
        device.queue.writeBuffer(uniformBuffer, 0, modelMatrix as Float32Array);
        
        const encoder = device.createCommandEncoder(); // 
        const pass = encoder.beginRenderPass({
            colorAttachments: [{ // 
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.5, g: 0, b: 0.25, a: 1 },
            }]
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(3);
        pass.end();

        device.queue.submit([encoder.finish()]);
    };

    setupRotationControl(render);
};

Initialise();