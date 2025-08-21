import Objloader from "../mesh/mesh_upload";
import { MeshData } from "../types/types";

export const setupMeshUpload = (
  device: GPUDevice,
  render: () => void,
  onMeshLoaded: (mesh: any) => void,
  meshUploadTimeInfo: HTMLElement | null
) => {
  const meshInput = document.getElementById('mesh-upload') as HTMLInputElement;
  const objloader = new Objloader();

  if (!meshInput) {
    console.error("Mesh upload input element not received!");
    return;
  }

  meshInput.addEventListener('change', async (event) => {
    const startTime = performance.now(); // Start timing here
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      console.warn("No mesh file selected.");
      return;
    }

    try {
      const fileContent = await file.text();
      const rawMeshData = objloader.parse(fileContent);
      
      // ensuring mesh data is in the correct format
      const typedMeshData: MeshData = {
          positions: rawMeshData.positions instanceof Float32Array ? rawMeshData.positions : new Float32Array(rawMeshData.positions),
          uvs: rawMeshData.uvs instanceof Float32Array ? rawMeshData.uvs : new Float32Array(rawMeshData.uvs),
          normals: rawMeshData.normals instanceof Float32Array ? rawMeshData.normals : new Float32Array(rawMeshData.normals),
          indices: rawMeshData.indices instanceof Uint32Array ? rawMeshData.indices : new Uint32Array(rawMeshData.indices),
      };

      // validate mesh data before proceeding
      if (validateMeshData(typedMeshData)) {
        console.log("Loaded mesh data:");
        console.log("Vertices count:", typedMeshData.positions.length / 3);
        console.log("Normals count:", typedMeshData.normals.length / 3);
        onMeshLoaded(typedMeshData);
        console.log("Mesh uploaded and buffers updated.");
      } else {
        console.error("Mesh data validation failed. Check console warnings.");
      }

      render();
      const uploadTime = performance.now() - startTime;
      if (meshUploadTimeInfo) {
        meshUploadTimeInfo.innerHTML = `Model Upload Time: ${uploadTime.toFixed(2)} ms`;
      }
    } catch (error) {
      console.error("Error loading or parsing OBJ file", error);
    }
  });
};

// helper function to validate mesh data
function validateMeshData(meshData: MeshData): boolean {
  const vertexCount = meshData.positions.length / 3;

  const uvsValid = (meshData.uvs?.length || 0) / 2 === vertexCount;
  const normalsValid = (meshData.normals?.length || 0) / 3 === vertexCount;

  const indicesValid = meshData.indices ? meshData.indices.every(index => index < vertexCount) : true;

  if (!uvsValid) {
    console.warn(`UV count mismatch: Expected ${vertexCount * 2}, got ${meshData.uvs?.length || 0}`);
  }

  if (!normalsValid) {
    console.warn(`Normal count mismatch: Expected ${vertexCount * 3}, got ${meshData.normals?.length || 0}`);
  }

  if (!indicesValid) {
    console.warn(`Invalid index found: indices must be < ${vertexCount}`);
  }

  return uvsValid && normalsValid && indicesValid;
}
