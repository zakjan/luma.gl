// shader module to perform texture filtering

const vs = `
uniform vec4 boundingBox; //[xMin, xMax, yMin, yMax]
uniform vec2 size; // [width, height]
uniform sampler2D filterTexture;
vec2 textureFilter_filter(vec2 position) {
  vec2 filterValueIndex;
  // [0, 0] -> [width, height]
  vec2 pos = position - boundingBox.xy;
  pos = pos / size;
  // pos = pos * 2.0 - vec2(1.0);
  filterValueIndex.y = float(gl_VertexID);
  if (pos.x < 0. || pos.x > 1. || pos.y < 0. || pos.y > 1.) {
    filterValueIndex.x = 0.;
  } else {
    float filterFlag = texture(filterTexture, pos.xy).r;
    filterValueIndex.x =  filterFlag > 0. ? 1. : 0.0; // 0.5;
  }
  return filterValueIndex;
}
`;

function getUniforms(opts = {}) {
  const uniforms = {};
  if (opts.boundingBox) {
    uniforms.boundingBox = opts.boundingBox;
  }
  if (opts.size) {
    uniforms.size = opts.size;
  }
  return uniforms;
}

export default {
  name: 'texture-filter',
  vs,
  getUniforms
};
