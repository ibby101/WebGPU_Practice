Defining a mesh made up of triangles:

$$\mathcal{M} = (V, F)$$
Where $\mathcal{M}$ denotes the triangular mesh, $V$ denotes the set of vertices and $F$ denotes the set of triangular faces.

The set of vertices $\mathcal{V}$ is contained within the 3D Euclidean Space $\mathbb{R}^3$ , or: 
$$V \subseteq \mathbb{R}^3$$
The set of triangular faces $F$ is contained within the set of Vertex Indexes as follows:
$$F \subseteq \{1,...,|V|\}^3$$

The set being raised to the power of 3 means that it contains the set of all possible triplets (x, y, z). 

A set of Vertex Indexes can also be represented as $f$ , where instead of having $v_{f_1}, v_{f_2}, v_{f_3}$ etc.. we can use 
$$f = (f_1, f_2, f_3)$$
