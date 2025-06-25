export const setupTextureUpload = (device: GPUDevice) => {
    let uploadedTexture: GPUTexture | null = null;

    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    const fileInput = document.getElementById('texture-upload') as HTMLInputElement;

    
    fileInput.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        fileInput.textContent = "Upload Texture";

        const bitmap = await createImageBitmap(file);

        uploadedTexture = device.createTexture({
            size: [bitmap.width, bitmap.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                   GPUTextureUsage.COPY_DST |
                   GPUTextureUsage.RENDER_ATTACHMENT,
        });

        device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: uploadedTexture },
            [bitmap.width, bitmap.height]
        );

        console.log("✅ Texture uploaded successfully!");
    });

    return {
        getTextureView: () => uploadedTexture?.createView() ?? null,
        sampler,
    };
};