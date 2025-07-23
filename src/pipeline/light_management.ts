import {vec3} from 'gl-matrix';

export class LightManagement {
    private device: GPUDevice;
    private lightUniformBuffer: GPUBuffer;

    private lightPosition: vec3 = vec3.fromValues(0.0, 2.0, 3.0);
    private lightColor: vec3 = vec3.fromValues(1.0, 1.0, 1.0); // white light
    private lightIntensity: number = 0.5;

    constructor(device: GPUDevice) {
        this.device = device;
        
        const lightUniformBufferSize = 32; // 3 vec3 for position, color, and intensity

        this.lightUniformBuffer = this.device.createBuffer({
            size: lightUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        console.log('LightManagement: Light uniform buffer created.');

        this.updateLightUniforms(); // updating initial light uniforms 

    }

    private updateLightUniforms() {
        const lightData = new Float32Array([
            this.lightPosition[0], this.lightPosition[1], this.lightPosition[2], 0.0, // position
            this.lightColor[0], this.lightColor[1], this.lightColor[2], // color
            this.lightIntensity // intensity
        ]);

        this.device.queue.writeBuffer(this.lightUniformBuffer, 0, lightData);
        
        console.log('LightManagement: Light uniforms updated:', lightData);
    }

    public getLightUniformBuffer(): GPUBuffer {
        return this.lightUniformBuffer;
    }
}

