import Objloader from "../mesh_upload";

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

            console.log("Mesh has been uploaded successfully!", meshData);

            // calling this callback function so that it updates main.ts buffers with new mesh data

            onMeshLoaded(meshData);

            render();
        } catch (error) {
            console.error("Error loading or parsing OBJ file", error);
        }
    });
}