export const setupTextureUpload = (
    device: GPUDevice,
    render: () => void, 
    onTextureUpdate: (newTexture: GPUTexture, newSampler: GPUSampler) => void
) => {
    const fileInput = document.getElementById('texture-upload') as HTMLInputElement;

    
    fileInput.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const bitmap = await createImageBitmap(file);

        const uploadedTexture = device.createTexture({
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

        const newSampler = device.createSampler({magFilter: 'linear', minFilter: 'linear' });

        onTextureUpdate(uploadedTexture, newSampler);

        fileInput.value = ''
        // debugging output
        console.log("Texture uploaded successfully!");
        render(); // re-render to apply the new texture
    });
};