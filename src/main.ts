import shader from "./shaders.wgsl"

const Initialise = async () => {
    const canvas : HTMLCanvasElement = document.getElementById('gpu-canvas') as HTMLCanvasElement;
    const adapter : GPUAdapter | null = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error("WebGPU adapter not found.");
    }
    const device : GPUDevice = await adapter.requestDevice();

    const context : GPUCanvasContext = canvas.getContext('webgpu') as GPUCanvasContext;
    const format : GPUTextureFormat = 'bgra8unorm';

    context.configure({
        device: device,
        format: format
    });
    

    // Pipeline setup

    const pipeline : GPURenderPipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: shader
        }),
        entryPoint: 'vs_main'
      },

      fragment: {
        module: device.createShaderModule({
          code: shader
        }),
        entryPoint: 'fs_main',
        targets: [{
          format: format
        }]
      },

      primitive: {
        topology: 'triangle-list'
      },
      layout: "auto"
    });

    const commandEncoder : GPUCommandEncoder = device.createCommandEncoder();
    const textureView : GPUTextureView = context.getCurrentTexture().createView();

    const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0.5, g: 0, b: 0.25, a: 1.0 }
      }]
    });
    renderpass.setPipeline(pipeline);
    renderpass.draw(3, 1, 0, 0);
    renderpass.end();

    device.queue.submit([commandEncoder.finish()]);
}

Initialise();