## Bundlers

Webpack - Most supported, slowest

Vite - Fastest, slowly gaining more support

Rollup - Newest, more aggressive code cleanup, Least supported

Will decide between Webpack and Vite, as they both offer important aspects for 3D rendering on the web, e.g. extensive library support, or much faster bundles in the case of Vite.

##  Typescript vs JavaScript

3 years ago, Typescript was the main supported language for WebGPU, and JS was not used to developed WebGPU applications. Now however, JS functionality has been implemented for WebGPU, but many developers still recommend Typescript due to its type safety, and readability.

Will stick to Typescript, as it will allow me to learn a new language, and that it is a relatively safer and strict language to code in.

## Hardcoded vs. Vertex Buffers

When writing the code to draw a cube mesh, there a couple of different ways, but the primary way that i went about it was hardcoding the data for drawing the mesh into the WGSL file. This works quite well for basic shapes, but many say that performance falls of when trying to render more complex shapes. This is because it lacks the flexibility that vertex buffers provide, as the geometry cannot be updated without recompiling the shader, which does not allow for new meshes to be uploaded onto the application, and will thus reduce the interactivity of the project.


