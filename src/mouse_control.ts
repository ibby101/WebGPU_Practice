import { Pointer } from './objects/pointer';
import { Camera } from './objects/camera';

export const setupMouseControl = (canvas: HTMLCanvasElement, camera: Camera, render: () => void) => {
    const pointer = new Pointer();
    let isDragging = false;

    canvas.addEventListener('pointerdown', (event) => {
        isDragging = true;
        pointer.setInitialPosition(event); // Capture initial position on pointerdown
    });

    canvas.addEventListener('pointerup', () => {
        isDragging = false;
    });

    canvas.addEventListener('pointerleave', () => {
        isDragging = false;
    });

    canvas.addEventListener('pointermove', (event) => {
        if (!isDragging) return; // ignore if not dragging

        pointer.update(event);

        if (pointer.delta.x !== 0 || pointer.delta.y !== 0) {
            camera.rotate({
                x: pointer.delta.x,
                y: pointer.delta.y,
            });
            camera.updateViewMatrix();
            render(); // only render while dragging
        }
    });

    canvas.addEventListener('wheel', (event) => {
        event.preventDefault(); // prevent default scroll behavior

        camera.zoom(event.deltaY);
        camera.updateViewMatrix();
        render();
    });

    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // still prevent right-click
    });

    return {
        pointer,
    };
};