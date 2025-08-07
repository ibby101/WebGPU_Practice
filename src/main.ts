import shader from './shader/shaders.wgsl';

import { LightManagement } from './pipeline/light_management';
import { BufferManagement } from './pipeline/buffer_management';
import { CameraManagement } from './pipeline/camera_management';
import { PipelineManagement } from './pipeline/pipeline_management';
import { setupRotationControl, getIsRotating } from './buttons/rotate_button';
import { setupTextureUpload } from './buttons/texture_upload';
import { setupMouseControl } from './buttons/mouse_control';
import { resetMeshTexture } from './buttons/reset_button';
import { setupMeshUpload } from './buttons/mesh_button';
import { cubeVertexData } from './mesh/cube_data';
import { cubeIndices } from './mesh/cube_data';
import { Camera } from './objects/camera';


const Initialise = async () => {
    const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
        throw new Error('WebGPU is not supported in this browser.');
    }

    console.log('WebGPU adapter and device initialised:', adapter?.info, device);

    const context = canvas.getContext('webgpu')!;
    console.log('Canvas context obtained:', context);
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    });

    console.log('Canvas context configured.');


    const fallBackTexture = device.createTexture({
        size: [1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    console.log('Fallback texture created:', fallBackTexture);

    // uploading the texture data to the fallback texture

    device.queue.writeTexture(
        { texture: fallBackTexture },
        new Uint8Array([255, 255, 255, 255]), // white color
        {bytesPerRow: 4},
        [1, 1]
    );

    let currentTexture: GPUTexture = fallBackTexture;
    let currentSampler: GPUSampler;

    currentSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    console.log("Shader content type:", typeof shader); // should be 'string'
    const shaderModule = device.createShaderModule({code: shader});
    console.log('Shader module created:', shaderModule);

    // --------------- Mesh and Buffer Management ---------------

    const currentMesh = new BufferManagement(device);
    currentMesh.initialiseCube(new Float32Array(cubeVertexData), cubeIndices);

    const matrixManager = new CameraManagement(device);
    const lightManager = new LightManagement(device);

    // --------------- Pipeline Management ---------------

    const pipelineManager = new PipelineManagement(device, shaderModule, format);
    console.log("Pipeline Manager created. Pipeline:", pipelineManager.pipeline, "Layout:", pipelineManager.bindGroupLayout);

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    console.log("Depth texture created:", depthTexture);

    let rotation = 0;

    const camera = new Camera([0, 0, 2]); // inital position of the camera

    const render = () => {
        if (getIsRotating()) {
            rotation += 0.01;
        }

        matrixManager.updateCameraUniforms(camera, rotation, canvas);

        const encoder = device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.211, g: 0.211, b: 0.211, a: 1.0},
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthClearValue: 1.0,
            },
        });

        // using the external pipeline manager class
        pass.setPipeline(pipelineManager.pipeline!);

        // creating bind group for the uniform buffer
        const textureView = currentTexture.createView();

        const dynamicBindGroup = device.createBindGroup({
            layout: pipelineManager.bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: matrixManager.getUniformBuffer() } },
                { binding: 1, resource: currentSampler },
                { binding: 2, resource: textureView },
                { binding: 3, resource: { buffer: lightManager.getLightUniformBuffer() } },
            ],
        });
        pass.setBindGroup(0, dynamicBindGroup);

        // drawing the mesh using the current mesh data
        currentMesh.draw(pass);

        pass.end();
        device.queue.submit([encoder.finish()]);
    };

    // --------------- Event Listeners ---------------

    setupMouseControl(canvas, camera, render);
    setupRotationControl(render);
    
    // updating mesh buffers with the new mesh data
    setupMeshUpload(device, render, (MeshData) => currentMesh.updateMeshBuffers(MeshData));

    setupTextureUpload(device, render, (newTexture, newSampler) => {
        currentTexture = newTexture;
        currentSampler = newSampler;
    });

    const onTextureReset = () => {
        currentTexture = fallBackTexture;
    };

    resetMeshTexture(onTextureReset, render);

    render();
}

Initialise();
