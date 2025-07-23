import {vec3} from 'gl-matrix';

/**
 * caculates face normals for a mesh that does not have normals defined.
 * asssumes that the mesh is made up of triangles.
 * @param positions - the vertex positions of the mesh
 * @param indices - the indices of the mesh
 * @return an array of normals, one for each vertex
 */

export function calculateNormals(positions: Float32Array, indices?: Uint32Array): Float32Array {
    const normals = new Float32Array(positions.length);
    const p1 = vec3.create();
    const p2 = vec3.create();
    const p3 = vec3.create();
    const v1 = vec3.create();
    const v2 = vec3.create();
    const faceNormals = vec3.create();

    const numberOfTriangles = indices ? indices.length / 3 : positions.length / 9;

    for (let i = 0; i < numberOfTriangles; ++i) {
        let i1,i2,i3;

        if (indices) {
            i1 = indices[i * 3 + 0];
            i2 = indices[i * 3 + 1];
            i3 = indices[i * 3 + 2];
        }else{
            i1 = i * 3 + 0;
            i2 = i * 3 + 1; 
            i3 = i * 3 + 2;
        }

        // obtaining the vertex positions
        vec3.set(p1, positions[i1 * 3 + 0], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
        vec3.set(p2, positions[i2 * 3 + 0], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
        vec3.set(p3, positions[i3 * 3 + 0], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

        // calculating the edge vectors
        vec3.sub(v1, p2, p1);
        vec3.sub(v2, p3, p1);

        // calculating the cross product to get the face normal
        vec3.cross(faceNormals, v1, v2);
        vec3.normalize(faceNormals, faceNormals); // normalising the face normal

        // assigning norrmals to the vertices of the triangle
        for (let j = 0; j < 3; ++j) {
            const vertexIndex = indices ? indices[i * 3 + j] : i * 3 + j;
            normals[vertexIndex * 3 + 0] += faceNormals[0];
            normals[vertexIndex * 3 + 1] += faceNormals[1];
            normals[vertexIndex * 3 + 2] += faceNormals[2];
        }
    }
    return normals;
}