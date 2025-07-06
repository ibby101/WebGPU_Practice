import {mat4, vec3} from 'gl-matrix';

export class Camera {
    public position: vec3;
    public rotation: vec3;
    private viewMatrix: mat4;
    private projectionMatrix: mat4;

    constructor (
        initialPosition: vec3 = vec3.fromValues(0,0,5),
        initialRotation: vec3 = vec3.fromValues(0,0,0)
    ) {
        this.position = initialPosition;
        this.rotation = initialRotation;
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
    }

        /**
        * Rotates the camera based on mouse delta.
        * @param delta - An object with x and y properties representing changes in mouse position.
        */

    rotate(delta: { x: number, y: number }) {
        const sens = 0.005; // can adjust camera movement sensitivity here

        this.rotation[0] += delta.y * sens;
        this.rotation[1] += delta.x * sens;

        if (this.rotation[0] > Math.PI / 2 - 0.01) {
            this.rotation[0] = Math.PI / 2 - 0.01;
        }

        if (this.rotation[0] < -Math.PI / 2 + 0.01) {
            this.rotation[0] = -Math.PI / 2 + 0.01;
        }
    }

    updateViewMatrix() {

        // Reset the view matrix to identity
        mat4.identity(this.viewMatrix);

        // Apply rotation and translation to the view matrix
        mat4.rotateX(this.viewMatrix, this.viewMatrix, this.rotation[0]);
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotation[1]);

        // Translate the view matrix to the camera's position
        mat4.translate(this.viewMatrix, this.viewMatrix, vec3.negate(vec3.create(), this.position));
    }
    
    /**
     * Sets the perspective projection matrix.
     * @param fov - The field of view in radians.
     * @param aspect - The aspect ratio (width / height).
     * @param near - The near clipping plane distance.
     * @param far - The far clipping plane distance.
     */

    setPerspective(fov: number, aspect: number, near: number, far: number) {
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    }


    /**
     * Returns the combined view-projection matrix.
     * @returns The view-projection matrix as a mat4.
     */
    
    getViewProjectionMatrix(): mat4 {
        const viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
        return viewProjectionMatrix;  
    }
}