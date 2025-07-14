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