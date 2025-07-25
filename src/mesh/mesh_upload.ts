import { MeshData } from "../types/types";
import { processMeshData } from "./de_duplicator"

type ObjPosition = number[]
type ObjUV = number[]
type ObjNormal = number[]
type ObjFile = string

type toBeFloat = number


export default class Objloader{

    constructor() {}

    // this function loads the OBJ file from the given file path
    // and returns the file content as a string

    parse(fileContent: ObjFile): MeshData {
        const lines = fileContent.split('\n');

        // creating arrays to hold the data
        const rawPositions: ObjPosition = [];
        const rawUvs: ObjUV = [];
        const rawNormals: ObjNormal = [];

        // storing tuples of vertex indices, UV indices, and normal indices
        const triangles: Array<Array<[number, number, number]>> = [];

        // helper function to parse a line

        const parseVertexString = (
            vertexStr: string,
            numPositions: number,
            numUvs: number,
            numNormals: number
        ): [toBeFloat, toBeFloat, toBeFloat] => {
            const components = vertexStr.split('/')

            // parsing position index
            let vIdx = parseInt(components[0]);

            vIdx = vIdx > 0 ? vIdx - 1 : numPositions + vIdx;

            // pasrsing UV index
            let vtIdx = components.length > 1 && components[1] !== '' ? parseInt(components[1]) : 0;

            // converting to zero-based index
            vtIdx = vtIdx > 0 ? vtIdx - 1 : numUvs + vtIdx;


            // parsing normal index
            let vnIdx = components.length > 2 && components[2] !== '' ? parseInt(components[2]) : 0;

            // converting to zero-based index
            vnIdx = vnIdx > 0 ? vnIdx - 1 : numNormals + vnIdx;

            return [vIdx, vtIdx, vnIdx];
        };

        // iterating through each line of the file content

        for (const line of lines) {
            // ignoring empty lines and comments
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
                continue;
            }

            const parts = trimmedLine.split(' ');
            const type = parts[0];

            switch (type) {
                case 'v': // vertex position
                    rawPositions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                    break;
                case 'vt': // texture coordinate
                    rawUvs.push(parseFloat(parts[1]), parseFloat(parts[2]));
                    break;
                case 'vn': // vertex normal
                    rawNormals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                    break;
                case 'f': // face
                    const faceVertexStrings = parts.slice(1);

                    if (faceVertexStrings.length < 3) {
                        console.warn("Face definition has less than 3 vertices, skipping:", trimmedLine);
                        continue;
                    }

                    const firstVertexTuple = parseVertexString(
                        faceVertexStrings[0],
                        rawPositions.length / 3,
                        rawUvs.length / 2,
                        rawNormals.length / 3
                    );

                    for (let i = 1; i < faceVertexStrings.length - 1; i++) {
                        const secondVTuple = parseVertexString(
                            faceVertexStrings[i],
                            rawPositions.length / 3,
                            rawUvs.length / 2,
                            rawNormals.length / 3
                        );

                        const thirdVTuple = parseVertexString(
                            faceVertexStrings[i + 1],
                            rawPositions.length / 3,
                            rawUvs.length / 2,
                            rawNormals.length / 3
                        );
                        triangles.push([firstVertexTuple, secondVTuple, thirdVTuple]);
                    }
                    break;
                }
            }
            return processMeshData(rawPositions, rawUvs, rawNormals, triangles);
        }
    }
