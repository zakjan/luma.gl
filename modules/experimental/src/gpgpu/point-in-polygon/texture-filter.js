// shader module to perform texture filtering

const vs = `
uniform vec4 boundingBox;
uniform vec2 size;
vec2 textureFilter_filter(vec2 position) {
  vec2 filterValueIndex;
  // [0, 0] -> [width, height]
  vec2 pos = a_position - boundingBox.xy;
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

function getUniforms(opts) {
  const {boundingBox, size} = opts;
  return {boundingBox, size};
}

export default {
  name: 'texture-filter',
  vs,
  getUniforms
};
