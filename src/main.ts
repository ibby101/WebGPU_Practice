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

    // --- Performance Tracking Variables ---
    const performanceInfo = document.getElementById('performance-info');

    const meshUploadTimeInfo = document.getElementById('mesh-upload-time');

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

    // --------------- Recording Performance Data ---------------

    let lastFrameTime = performance.now();

    const performanceData: { fps: number, renderTime: number }[] = [];
    const MAX_DATA_POINTS = 10;

    const tick = () => {
        const currentTime = performance.now();
        const frameTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        let fps = 0;
        if (frameTime > 0) {
            fps = 1000 / frameTime;
        } else {
            fps = 1000;
        }

        if (performanceInfo) {
            performanceInfo.innerHTML = `FPS: ${fps.toFixed(2)}<br>Render Time: ${frameTime.toFixed(2)} ms`;
        }

        // adding new data to the array
        performanceData.push({
            fps: parseFloat(fps.toFixed(2)),
            renderTime: parseFloat(frameTime.toFixed(2))
        });
        
        // trimming the array to the maximum number of data points
        if (performanceData.length > MAX_DATA_POINTS) {
            performanceData.shift();
        }

        requestAnimationFrame(tick);
    };

    // New function to export data to CSV
    const exportToCsv = () => {
        if (performanceData.length === 0) {
            alert('No performance data to export.');
            return;
        }

        // Create the CSV header and rows
        const header = "FPS,RenderTime(ms)\n";
        const csvRows = performanceData.map(d => `${d.fps},${d.renderTime}`).join("\n");
        const csvContent = header + csvRows;

        // Create a downloadable Blob and a link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'performance_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --------------- Event Listeners ---------------

    setupMouseControl(canvas, camera, render);
    setupRotationControl(render)
    
    // updating mesh buffers with the new mesh data
    setupMeshUpload(device, render, (MeshData) => currentMesh.updateMeshBuffers(MeshData), meshUploadTimeInfo);

    setupTextureUpload(device, render, (newTexture, newSampler) => {
        currentTexture = newTexture;
        currentSampler = newSampler;
    });

    const onTextureReset = () => {
        currentTexture = fallBackTexture;
    };

    resetMeshTexture(onTextureReset, render);

    const downloadButton = document.getElementById('download-fps-data');
    if (downloadButton) {
        downloadButton.addEventListener('click', exportToCsv);
    }

    render();
    tick(); // Start the new, separate tick loop
}

Initialise();
