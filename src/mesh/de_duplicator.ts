import { MeshData } from "../types/types";

/**
 * Processing triangulated mesh data to ensure it is in the correct format.
 * @param rawPositions - Array of vertex positions.
 * @param rawUvs - Array of UV coordinates. 
 * @param rawNormals - Array of normals.
 * @param triangles - Array of triangles, each triangle is an array of vertex indices.
 * @returns {MeshData} - Processed mesh data with positions, uvs, normals, and indices.
 */

export function processMeshData(
    rawPositions: number[],
    rawUvs: number[],
    rawNormals: number[],
    triangles: Array<Array<[number, number, number]>>
): MeshData {
    // using a map to cache vertex data to avoid duplicates
    const vertexCache = new Map<string, number>();

    let nextProcessedIndex = 0;

    const finalPositions: number[] = [];
    const finalUvs: number[] = [];
    const finalNormals: number[] = [];
    const finalIndices: number[] = [];

    // iterating through each triangle
    for (const triangle of triangles) {
        for (const vertexTuple of triangle) {
            const [vIdx, vtIdx, vnIdx] = vertexTuple;

            const uniqueKey = `${vIdx}/${vtIdx}/${vnIdx}`;

            let processedIndex: number;

            if (vertexCache.has(uniqueKey)) {
                processedIndex = vertexCache.get(uniqueKey)!; // ! ensures that key obtained is not null
            }else{
                processedIndex = nextProcessedIndex++;

                vertexCache.set(uniqueKey, processedIndex);

                finalPositions.push(rawPositions[vIdx * 3 + 0]);
                finalPositions.push(rawPositions[vIdx * 3 + 1]);
                finalPositions.push(rawPositions[vIdx * 3 + 2]);

                if (rawUvs.length > 0 && vtIdx * 2 + 1 < rawUvs.length) {
                    finalUvs.push(rawUvs[vtIdx * 2 + 0]);
                    finalUvs.push(rawUvs[vtIdx * 2 + 1]);
                }else{
                    finalUvs.push(0.0, 0.0);
                }

                if (rawNormals.length > 0 && vnIdx * 3 + 2 < rawNormals.length) {
                    finalNormals.push(rawNormals[vnIdx * 3 + 0]);
                    finalNormals.push(rawNormals[vnIdx * 3 + 1]);
                    finalNormals.push(rawNormals[vnIdx * 3 + 2]);
                }else{
                    finalNormals.push(0.0, 0.0, 0.0); // default normal
                }
            }
            finalIndices.push(processedIndex);
        }
    }
    return {
        positions: new Float32Array(finalPositions),
        uvs: new Float32Array(finalUvs),
        normals: new Float32Array(finalNormals),
        indices: new Uint32Array(finalIndices)
    };
}
