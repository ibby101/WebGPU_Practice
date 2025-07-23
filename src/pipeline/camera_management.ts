import {mat4, vec3} from 'gl-matrix';
import { Camera } from '../objects/camera';


/// CameraManagement class to handle camera updates and uniform buffer management

export class CameraManagement {
    private device: GPUDevice;
    private uniformBuffer: GPUBuffer;
    private uniformBufferSize: number;

    constructor(device: GPUDevice) {
        this.device = device;
        this.uniformBufferSize = 16 * 4 * 3; // 16 floats for each of the 3 matrices (model, view, projection)
        
        this.uniformBuffer = this.device.createBuffer({
            size: this.uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        console.log("CameraManagement: Uniform buffer created.");
    }

    /**
     * Updates the camera's uniform buffers.
     * @param camera The camera to update.
     * @param rotation The rotation angle.
     * @param canvas The canvas element.
     */
    public updateCameraUniforms(camera: Camera, rotation: number, canvas: HTMLCanvasElement) {
        const aspect = canvas.width / canvas.height;
        camera.setPerspective((2 * Math.PI) / 5, aspect, 0.1, 100);
        camera.updateViewMatrix();

        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0, 0, 0));
        mat4.rotateY(modelMatrix, modelMatrix, rotation);
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(2, 2, 2));

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        const viewProjectionMatrix = camera.getViewProjectionMatrix();
        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, viewProjectionMatrix, modelMatrix);

        const uniformData = new Float32Array(this.uniformBufferSize / 4); 
        uniformData.set(modelViewProjectionMatrix, 0);
        uniformData.set(modelMatrix, 16);
        uniformData.set(normalMatrix, 32);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    public getUniformBuffer(): GPUBuffer {
        return this.uniformBuffer;
    }
}