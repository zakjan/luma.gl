# WebGPU vs WebGL

WebGPU is the next generation GPU API for the browser.

This section explains some of the notable differences between WebGPU and WebGL. This is essentially a set of author's notes, included for the curious.

## WebGPU Device vs WebGL Context

A WebGL context is associated with a specific canvas.

- The default drawing buffer is associated with the canvas
- Rendering to other canvases either requires separate WebGL contexts (with duplicated GPU resources) or going through hoops with framebuffer rendering and image copies.

- A WebGPU device enables the application to create separate swap chains for different canvases and reuse resources

## Parameters and State Management

In WebGL many parameters are set on the WebGL context using individual function calls.

- This does cause problems when trying to make different modules work together.
- But it does make it easier to change settings between draw calls.

## Programs

| WebGPU limitation                           | Alternatives                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| No GLSL support                             | 1) glslang project seems stale. 2) Use Naga (Rust) to build a WebAssembly transpiler. 3) write two sets of shaders. |
| No constant attributes                      | 1) Create dummy buffers 2) dynamically generate shaders with uniforms.                                              |
| Interleaving specified at Pipeline creation | New `PipelineProps.bufferMap` concept                                                                               |
| No transform feedback                       | Compute shaders (storage buffers)                                                                                   |
| No uniforms, only Uniform buffers           | Add strong uniform buffer support to API, WebGL1 fallback?                                                          |
