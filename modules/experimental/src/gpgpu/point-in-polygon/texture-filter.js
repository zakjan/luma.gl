// shader module to perform texture filtering

const vs = `
uniform vec4 textureFilter_bbOriginSize; //[xMin, yMin, xSize, ySize]
uniform sampler2D textureFilter_texture;
vec2 textureFilter_filter(vec2 position) {
  vec2 filterValueIndex;
  // [0, 0] -> [width, height]
  vec2 pos = position - textureFilter_bbOriginSize.xy;
  pos = pos / textureFilter_bbOriginSize.zw;
  // pos = pos * 2.0 - vec2(1.0);
  filterValueIndex.y = float(gl_VertexID);
  if (pos.x < 0. || pos.x > 1. || pos.y < 0. || pos.y > 1.) {
    filterValueIndex.x = 0.;
  } else {
    float filterFlag = texture(textureFilter_texture, pos.xy).r;
    filterValueIndex.x =  filterFlag > 0. ? 1. : 0.0; // 0.5;
  }
  return filterValueIndex;
}
`;

function getUniforms(opts = {}) {
  const uniforms = {};
  if (opts.boundingBox) {
    const [xMin, yMin, xMax, yMax] = opts.boundingBox;
    uniforms.textureFilter_bbOriginSize = [xMin, yMin, xMax - xMin, yMax - yMin];
  }
  if (opts.texture) {
    uniforms.textureFilter_texture = texture;
  }
  return uniforms;
}

export default {
  name: 'texture-filter',
  vs,
  getUniforms
};
