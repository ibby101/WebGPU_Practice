export class PipelineManagement {

    public readonly pipeline: GPURenderPipeline ;
    public readonly bindGroupLayout: GPUBindGroupLayout;

    constructor(device: GPUDevice, shaderModule: GPUShaderModule, format: GPUTextureFormat) {
           this.bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {},
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {},
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }, // for light data
            }
        ]
    });

    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] });

    this.pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 12 * 4, // 12 floats per vertex (position, color, UV, normal)
                attributes: [
                    {
                        shaderLocation: 0, // position
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        shaderLocation: 1, // color
                        offset: 3 * 4, // 3 floats for position
                        format: 'float32x4',
                    },
                    {
                        shaderLocation: 2, // UV
                        offset: 7 * 4, // 3 floats for position + 4 floats for color
                        format: 'float32x2',
                    },
                    {
                        shaderLocation: 3, // normal
                        offset: 9 * 4, // 3 floats for position + 4 floats for color + 2 floats for UV
                        format: 'float32x3',
                    },
                ],
            },
        ],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{
                format,
            }],
        },
        primitive: {topology: 'triangle-list', cullMode: 'none'},
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
            },
        });
    }
} 
   
