import { MeshData } from "../types/types";

type OBJPosition = number[]
type OBJUV = number[]
type OBJNormal = number[]
type OBJFace = string[] // e.g., ['1/1/1', '2/2/2', '3/3/3', '4/4/4']

type ObjFile = string
type FilePath = string

type toBeFloat = number
type toBeUInt32 = number

export default class Objloader{

    constructor() {}

    // this function loads the OBJ file from the given file path
    // and returns the file content as a string

    async load(filePath: FilePath): Promise<ObjFile> {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load OBJ file: ${response.statusText}`);
        }

        const file = await response.text();

        if (file.length === 0) {
            throw new Error("OBJ file is empty.");
        }
        
        return file;
    }


    // Parses the OBJ file content and returns a Mesh object

    parse(file: ObjFile): MeshData {
        const lines = file?.split("\n")

        // storing the data in cache arrays, to avoid creating new arrays every time

        const cachedPositions: OBJPosition[] = []
        const cachedFaces: OBJFace[] = []
        const cachedNormals: OBJNormal[] = []
        const cachedUVs: OBJUV[] = []

        
        // reading the file line by line, and storing the data in the cache arrays

        {
        for (const untrimmedLine of lines) {
            const line = untrimmedLine.trim(); // removes whitespace from both ends
            const [startingChar, ...data] = line.split(" ");
            switch (startingChar) {
                case 'v': // vertex position
                    cachedPositions.push(data.map(parseFloat))
                    break
                case 'vt': // texture coordinate
                    cachedUVs.push(data.map(parseFloat))
                    break
                case 'vn': // vertex normal
                    cachedNormals.push(data.map(parseFloat))
                    break
                case 'f': // face - store components as strings (e.g., ['1/1/1', '2/2/2', '3/3/3', '4/4/4'])
                    // Filter out empty strings that might result from multiple spaces or trailing spaces
                    const faceComp = data.filter(s => s !== '');
                    if (faceComp.length > 0) { // Ensure there are actual components
                        cachedFaces.push(faceComp);
                    }
                    break;
                }
            }
        }

        // converting the cache arrays to the final arrays, and removing duplicates

        const finalPositions: toBeFloat[] = []
        const finalUVs: toBeFloat[] = []
        const finalNormals: toBeFloat[] = []
        const finalIndices: toBeUInt32[] = []  

        {
            const cache: Record<string, number> = {}
            let i = 0
            
            for (const faces of cachedFaces){
                for (const faceString of faces) {
                    if (cache[faceString]) {
                        finalIndices.push(cache[faceString])
                        continue
                }

                cache[faceString] = i
                finalIndices.push(i)


                const [v, uv, n] = faceString.toString().split('/').map(s => parseInt(s) || 0);

                // converting to 0-based indices

                const vertexIndex = v - 1;
                const uvIndex = uv - 1;
                const normalIndex = n - 1;

                
                // using the indices to get the positions, UVs, and normals from the cache arrays

                // Safety checks
                if (vertexIndex >= 0 && cachedPositions[vertexIndex]) {
                    finalPositions.push(...cachedPositions[vertexIndex]);
                }
                if (uvIndex >= 0 && cachedUVs[uvIndex]) {
                    finalUVs.push(...cachedUVs[uvIndex]);
                }
                if (normalIndex >= 0 && cachedNormals[normalIndex]) {
                    finalNormals.push(...cachedNormals[normalIndex]);
                }

                i++
                }
            }
        }

        return {
            positions: new Float32Array(finalPositions),
            uvs: new Float32Array(finalUVs),
            normals: new Float32Array(finalNormals),
            indices: new Uint32Array(finalIndices),
        }
    }
}