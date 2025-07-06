import { Pointer } from './objects/pointer';
import { Camera } from './objects/camera';


export const setupMouseControl = (canvas: HTMLCanvasElement, camera: Camera, render: () => void) => {
    const pointer = new Pointer();

    canvas.addEventListener('pointermove', (event) => {
        pointer.update(event);
        camera.rotate(pointer.delta);

        camera.updateViewMatrix();

        render(); // Trigger a re-render after updating the camera
    });

    return {
        pointer,
    };
};