// Holds the ID returned by requestAnimationFrame, used to cancel the animation loop
let animationFrameId: number;

// Tracks whether rotation is currently enabled or paused
let isRotating: boolean = true;

// Callback function for rendering; assigned from outside this module
let animationCallback: (() => void) | null = null;

/**
 * Initializes rotation control button and animation loop.
 * @param renderLoopFunction - The render function to call each frame.
 */
export const setupRotationControl = (renderLoopFunction: () => void) => {
    animationCallback = renderLoopFunction;

    const toggleButton = document.getElementById('toggle-rotation-button') as HTMLButtonElement;

    if (!toggleButton) {
        console.error("Toggle rotation button not found!");
        return;
    }

    toggleButton.addEventListener('click', () => {
        isRotating = !isRotating; // Flip rotation state

        if (isRotating) {
            toggleButton.textContent = "Stop Rotation";

            // If no animation is running, start it
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(animate);
            }
        } else {
            toggleButton.textContent = "Start Rotation";

            // Stop ongoing animation and reset ID
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }
    });

    // Start the animation loop immediately
    animationFrameId = requestAnimationFrame(animate);
};

/**
 * Internal animation loop triggered by requestAnimationFrame.
 * Calls the external render function if rotation is enabled.
 */
function animate() {
    if (isRotating && animationCallback) {
        animationCallback(); // Render one frame
        animationFrameId = requestAnimationFrame(animate); // Queue next frame
    } else {
        // Rotation stopped — clear animation ID
        animationFrameId = 0;
    }
}

/**
 * Returns whether rotation is currently active.
 */
export const getIsRotating = (): boolean => {
    return isRotating;
};
