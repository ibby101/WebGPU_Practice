interface Mesh {
    positions: Float32Array;
    uvs: Float32Array;
    normals: Float32Array;
    indices: Uint16Array;
}

type ObjFile = string
type FilePath = string

type CachePosition = number
type CacheFace = number
type CacheNormal = number
type CacheUV = number
type CacheArray<T> = T[][]

type toBeFloat = number

type toBeUInt16 = number

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

    parse(file: ObjFile): Mesh {
        const lines = file?.split("\n")

        // storing the data in cache arrays, to avoid creating new arrays every time

        const cachedPositions: CacheArray<CachePosition> = []
        const cachedFaces: CacheArray<CacheFace> = []
        const cachedNormals: CacheArray<CacheNormal> = []
        const cachedUVs: CacheArray<CacheUV> = []

        
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
                    case 'f': // face
                        cachedFaces.push(data.map(parseFloat))
                        break
                }
            }
        }

        // converting the cache arrays to the final arrays, and removing duplicates

        const finalPositions: toBeFloat[] = []
        const finalUVs: toBeFloat[] = []
        const finalNormals: toBeFloat[] = []
        const finalIndices: toBeUInt16[] = []  

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


                const [vertexIndex, uvIndex, normalIndex] = faceString.toString().split('/').map(Number);

                
                // using the indices to get the positions, UVs, and normals from the cache arrays

                vertexIndex > -1 && finalPositions.push(...cachedPositions[vertexIndex]);
                uvIndex > -1 && finalUVs.push(...cachedUVs[uvIndex]);
                normalIndex > -1 && finalNormals.push(...cachedNormals[normalIndex]);

                i++
                }
            }
        }

        return {
            positions: new Float32Array(finalPositions),
            uvs: new Float32Array(finalUVs),
            normals: new Float32Array(finalNormals),
            indices: new Uint16Array(finalIndices),
        }
    }
}