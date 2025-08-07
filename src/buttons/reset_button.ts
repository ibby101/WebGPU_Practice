export const resetMeshTexture = (
    onTextureReset: () => void, 
    render: () => void
) => {
    // reference to button
    const resetButton = document.getElementById('reset-texture-button') as HTMLButtonElement;
    

    resetButton.addEventListener('click', () => {
        onTextureReset();
        console.log("Texture reset successfully!");
        render(); // re-render to apply the new texture
    });
    
}


