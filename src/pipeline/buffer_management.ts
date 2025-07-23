 // importing from types.ts

 import { MeshData } from "../types/types";

 
function paddingTo4Bytes(value: number): number {
    return (value + 3) & ~3;
}

 export class BufferManagement {

    private device: GPUDevice;
    private currentVertexBuffer: GPUBuffer | null = null;
    private currentIndexBuffer: GPUBuffer | null = null;
    private currentVertexCount: number = 0;

    private readonly floatsPerVertex: number = 3 + 4 + 2 + 3; // position, color, UV, normal
    public readonly arrayStride: number = this.floatsPerVertex * Float32Array.BYTES_PER_ELEMENT; // bytes per vertex

    constructor(device: GPUDevice) {
        this.device = device;
    }

    updateMeshBuffers(meshData: MeshData){
        if (this.currentVertexBuffer){
            this.currentVertexBuffer.destroy();
            this.currentVertexBuffer = null;
        }
        if (this.currentIndexBuffer){
            this.currentIndexBuffer.destroy();
            this.currentIndexBuffer = null;
        }

        // validate meshData
        if (!meshData.uvs || !meshData.positions || !meshData.normals || !meshData.indices) {
            console.error("MeshData is missing required properties.");
            return;
        }

        const vertexCount = meshData.positions.length / 3; // assuming positions are in Float32Array format
        const interleavedData = new Float32Array(vertexCount * this.floatsPerVertex);

        let offset = 0;

        for (let i = 0; i < vertexCount; i++) {
            // position data
            interleavedData.set(meshData.positions.slice(i * 3, (i + 1) * 3), offset);
            offset += 3;

            // color data (assuming white color for simplicity)
            interleavedData.set([1.0, 1.0, 1.0, 1.0], offset); // RGBA white color
            offset += 4;

            // UV data
            interleavedData.set(meshData.uvs.slice(i * 2, (i + 1) * 2), offset);
            offset += 2;

            // normal data
            interleavedData.set(meshData.normals.slice(i * 3, (i +  1) * 3), offset);
            offset += 3;
        }

        // creating and uploading the vertex buffer

        const paddedBufferSize = paddingTo4Bytes(interleavedData.byteLength);

        this.currentVertexBuffer = this.device.createBuffer({
            size: paddedBufferSize,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Float32Array(this.currentVertexBuffer.getMappedRange()).set(interleavedData);
        this.currentVertexBuffer.unmap();

        // creating and uploading the index buffer

        const IndexBufferSize = meshData.indices.length * Uint32Array.BYTES_PER_ELEMENT;
        const paddedIndexBufferSize = paddingTo4Bytes(IndexBufferSize);

        this.currentIndexBuffer = this.device.createBuffer({
            size: paddedIndexBufferSize,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        
        
        new Uint32Array(this.currentIndexBuffer.getMappedRange()).set(meshData.indices);
        this.currentIndexBuffer.unmap();

        this.currentVertexCount = meshData.indices.length;
    }


    /**
     * Initialising the buffers for the default cube mesh.
     * Uses the cube mesh data from the cube_data.ts file.
     * @returns {MeshData} The mesh data for the default cube.
     */

    initialiseCube(cubeVertexData: Float32Array, cubeIndexData: Uint32Array) {

        // removing any existing buffers
        if (this.currentVertexBuffer) {
            this.currentVertexBuffer.destroy();
            this.currentVertexBuffer = null;
        }
        if (this.currentIndexBuffer) {
            this.currentIndexBuffer.destroy();
            this.currentIndexBuffer = null;
        }

        this.currentVertexBuffer = this.device.createBuffer({ 
            size: paddingTo4Bytes(cubeVertexData.byteLength),
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Float32Array(this.currentVertexBuffer.getMappedRange()).set(cubeVertexData);
        this.currentVertexBuffer.unmap();

        // mapping the index buffer

        this.currentIndexBuffer = this.device.createBuffer({
            size: paddingTo4Bytes(cubeIndexData.byteLength),
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Uint32Array(this.currentIndexBuffer.getMappedRange()).set(cubeIndexData);
        this.currentIndexBuffer.unmap();

        this.currentVertexCount = cubeIndexData.length; // setting the vertex count to the number of indices
    }

    /**
     * setting the vertex and index buffers for the render pass.
     * @param {GPURenderPassEncoder} pass - the current render pass encoder.
     */

    draw(pass: GPURenderPassEncoder) {
        if (!this.currentVertexBuffer || !this.currentIndexBuffer) {
            console.error("Vertex or index buffer is not initialised.");
            return;
        }

        pass.setVertexBuffer(0, this.currentVertexBuffer);
        pass.setIndexBuffer(this.currentIndexBuffer, 'uint32');
        pass.drawIndexed(this.currentVertexCount); // draw the mesh using indexed drawing
    }

    // destroying the buffers when they are no longer needed

    destroyBuffers() {
        if (this.currentVertexBuffer) {
            this.currentVertexBuffer.destroy();
            this.currentVertexBuffer = null;
        }
        if (this.currentIndexBuffer) {
            this.currentIndexBuffer.destroy();
            this.currentIndexBuffer = null;
        }
    }
}
 
