import {mat4, vec3} from 'gl-matrix';

export class Camera {
    public position: vec3;
    public rotation: vec3;
    private viewMatrix: mat4;
    private projectionMatrix: mat4;
    private distance: number;

    constructor (
        initialPosition: vec3 = vec3.fromValues(0,0,5),
        initialRotation: vec3 = vec3.fromValues(0,0,0)
    ) {
        this.position = initialPosition;
        this.rotation = initialRotation;
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        this.distance = initialPosition[2]; // assuming initial position is in the Z direction
    }

        /**
        * Rotates the camera based on mouse delta.
        * @param delta - An object with x and y properties representing changes in mouse position.
        */

    rotate(delta: { x: number, y: number }) {
        const sens = 0.005; // can adjust camera movement sensitivity here

        this.rotation[0] += delta.y * sens;
        this.rotation[1] += delta.x * sens;

        const halfPI = Math.PI / 2;

        if (this.rotation[0] > halfPI - 0.01) {
            this.rotation[0] = halfPI - 0.01;
        }

        if (this.rotation[0] < -halfPI + 0.01) {
            this.rotation[0] = -halfPI + 0.01;
        }
    }

    zoom(deltar: number){
        const zoomSensitivity = 0.001; // can adjust zoom sensitivity here
        this.distance += deltar * zoomSensitivity;

        const minDistance = 2.0; // minimum distance to prevent camera from going too close
        const maxDistance = 100.0; // maximum distance to prevent camera from going too far
        if (this.distance < minDistance) {
            this.distance = minDistance;
        }
        if (this.distance > maxDistance) {
            this.distance = maxDistance;
        }
    } 

    updateViewMatrix() {
        
        const pitch = this.rotation[0]; // vertical angle
        const yaw = this.rotation[1];   // horizontal angle

        const bottom_left = vec3.fromValues(-0.5, -0.5, 0.5);
        const top_right = vec3.fromValues(0.5, 0.5, -0.5);

        const center = vec3.create();
        vec3.add(center, bottom_left, top_right);
        vec3.scale(center, center, 0.5); // center of the cube

        const target = center;

        // Calculate the camera's position based on distance and rotation angles
        const x = this.distance * Math.cos(this.rotation[0]) * Math.sin(this.rotation[1]);
        const y = this.distance * Math.sin(this.rotation[0]);
        const z = this.distance * Math.cos(this.rotation[0]) * Math.cos(this.rotation[1]);

        const eye = vec3.fromValues(x, y, z);
        vec3.add(eye, eye, target); // position is now treated as the orbit target

        // Use lookAt to set the view matrix
        // similar to the one used in my visualisation project!

        const up = vec3.fromValues(0, 1, 0);
        mat4.lookAt(this.viewMatrix, eye, target, up);

        // previous implementation, the problem with it is that it would not rotate around the object's center, but rather around the camera's position.

        // // reset the view matrix to identity
        // mat4.identity(this.viewMatrix);

        // // translate the camera away from the origin
        // mat4.translate(this.viewMatrix, this.viewMatrix, vec3.negate(vec3.create(), this.position));

        // // apply rotation and translation to the view matrix
        // mat4.rotateX(this.viewMatrix, this.viewMatrix, this.rotation[0]);
        // mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotation[1]);

        // // translate the view matrix to the camera's position
        // mat4.translate(this.viewMatrix, this.viewMatrix, vec3.negate(vec3.create(), this.position));
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