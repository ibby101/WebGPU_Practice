# WebGPU - High Poly Mesh Visualiser

This repository contains an experimental project developed using **WebGPU**, the next-generation web graphics API.  
It focuses on rendering high polygon meshes efficiently in the browser. The goal is to explore WebGPU's performance when handling **user-uploaded meshes**.

---

## Features
- Renders high-poly **3D meshes** using WebGPU  
- Demonstrates efficient **pipeline setup** and **rendering loop**  
- Highlights WebGPU concepts such as **adapters, devices, pipelines, and bind groups**  

---

## Getting Started

### 1. Prerequisites
- A browser that supports **WebGPU** (latest Chrome, Edge, or Safari).  
- **Node.js** and **npm** installed.  

---

### 2. Clone repository
```bash
git clone https://github.com/ibby101/WebGPU_Practice.git
```

---

### 3. Install Dependencies
```bash
npm install
```

---

### 4. Run the Project
```bash
npm start
```

This will:
1. Install missing dependencies  
2. Build the project using Webpack  
3. Serve it locally with `http-server`  

By default, the app will be available at:
```
http://localhost:8080
```

### 5. Using the Visualiser

The application only accepts `.obj` files for local mesh uploads. You can drag and drop your .obj file onto the browser window or use the file selector to load your mesh.

Please note that some `.obj` files may not be centered at the origin (0,0,0) and might appear off-screen. If you don't see your mesh immediately, it has likely been rendered successfully but is just not visible in the current view.
