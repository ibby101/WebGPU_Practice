import Objloader from "../mesh/mesh_upload";
import type { MeshData } from "../types/types";

export const setupMeshUpload = (device: GPUDevice, render: () => void, onMeshLoaded: (mesh: any) => void) => {

    const meshInput = document.getElementById('mesh-upload') as HTMLInputElement;

    const objloader = new Objloader();

    if (!meshInput)  {
        console.error("Mesh upload input element not received!");
        return;
    }

    meshInput.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            console.warn("No mesh file selected.");
            return;
        }

        try {
            const fileContent = await file.text();

            // parsing the OBJ file contents with the Objloader instance

            const meshData = objloader.parse(fileContent);

            const plainMeshData = {
                positions: Array.from(meshData.positions),
                uvs: Array.from(meshData.uvs),
                normals: Array.from(meshData.normals),
                indices: Array.from(meshData.indices),
            };



                // ✅ Validate before updating GPU buffers
            if (validateMeshData(plainMeshData)) {
                    console.log("Loaded mesh data:");
                    console.log("Vertices count:", meshData.positions.length / 3);
                    console.log("Normals count:", meshData.normals.length / 3);
                    onMeshLoaded(meshData)
                    console.log("Mesh uploaded and buffers updated.");
                } else {
                    console.error("Mesh data validation failed. Check console warnings.");
        }

            console.log("Mesh has been uploaded successfully!", meshData);

            // calling this callback function so that it updates main.ts buffers with new mesh data

            render();
        } catch (error) {
            console.error("Error loading or parsing OBJ file", error);
        }
    });
}

function validateMeshData(meshData: {
  positions: number[],
  uvs: number[],
  normals: number[],
  indices: number[]
}): boolean {
  const vertexCount = meshData.positions.length / 3;

  const uvsValid = meshData.uvs.length / 2 === vertexCount;
  const normalsValid = meshData.normals.length / 3 === vertexCount;
  const indicesValid = meshData.indices.every(i => i < vertexCount);

  if (!uvsValid) {
    console.warn(`UV count mismatch: Expected ${vertexCount * 2}, got ${meshData.uvs.length}`);
  }

  if (!normalsValid) {
    console.warn(`Normal count mismatch: Expected ${vertexCount * 3}, got ${meshData.normals.length}`);
  }

  if (!indicesValid) {
    console.warn(`Invalid index found: indices must be < ${vertexCount}`);
  }

  return uvsValid && normalsValid && indicesValid;
}