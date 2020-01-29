
import GL from '@luma.gl/constants';
import {Buffer, Framebuffer, Texture2D, assert} from '@luma.gl/webgl';
import {Model, Transform} from '@luma.gl/engine';
const TEXTURE_SIZE = 512;
import * as Polygon from './polygon';

const POLY_TEX_VS = `\
uniform vec4 boundingBox; //[xMin, xMax, yMin, yMax]
uniform vec2 size; // [width, height]
attribute vec2 a_position;
void main()
{
    // [0, 0] -> [width, height]
    vec2 pos = a_position - boundingBox.xy;
    pos = pos / size;
    pos = pos * 2.0 - vec2(1.0);
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const POLY_TEX_FS = `\
void main()
{
    gl_FragColor = vec4(1.0);
}
`;

const POLY_VS = `\
precision highp float;
precision highp int;
attribute vec2 a_position;
void main()
{
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 5.;
}
`;

const POLY_FS = `\
#define ALPHA 1.0
precision highp float;
precision highp int;
uniform vec4 color;
void main()
{
    // gl_FragColor = vec4(vec3(1.0, 1., 0.) * ALPHA, ALPHA);
    gl_FragColor = color;
}
`;

const FILTER_VS = `\
#version 300 es
uniform vec4 boundingBox; //[xMin, xMax, yMin, yMax]
uniform vec2 size; // [width, height]
uniform sampler2D filterTexture;
in vec2 a_position;
out vec2 filterValueIndex; //[x: 0 (outside polygon)/1 (inside), y: position index]
void main()
{
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
}
`;

function getBoundingBox(positions, vertexCount) {

  let yMin = Infinity;
  let yMax = -Infinity;
  let xMin = Infinity;
  let xMax = -Infinity;
  let y;
  let x;

  for (let i = 0; i < vertexCount; i++) {
    x = positions[i * 2];
    y = positions[i * 2 + 1];
    yMin = y < yMin ? y : yMin;
    yMax = y > yMax ? y : yMax;
    xMin = x < xMin ? x : xMin;
    xMax = x > xMax ? x : xMax;
  }

  return [xMin, yMin, xMax, yMax];
}

const TRIANGLES = [
  [-0.5, -0.5,  0, 0, -0.5, 0.5],
 [0.5, -0.5,  0, 0,  0.5, 0.5]
];

const POLYGON = [
  [-0.5, -0.5],  [0, 0], [-0.5, 0.5], [-0.75, 0]
];

export default class GPUPolygonClip {
  constructor(gl, {textureSize = TEXTURE_SIZE, polygon} = {}) {
    this.gl = gl;
    this.textureSize = textureSize;
    this.polygonTexture = new Texture2D(gl, {
      format: GL.RGB,
      type: GL.UNSIGNED_BYTE,
      dataFormat: GL.RGB,
      border: 0,
      mipmaps: false,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
      }
    });
    this.polyTextureTransform = new Transform(gl, {
      id: `polygon-texture-creation-transform`,
      elementCount: 0,
      _targetTexture: this.polygonTexture,
      vs: POLY_TEX_VS,
      fs: POLY_TEX_FS,
      drawMode: GL.TRIANGLES,
      isIndexed: true
      // debug: true
    });
    this.positionBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});
    this.indexBuffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER, accessor: {type: GL.UNSIGNED_SHORT}});

    this.polygonModel = new Model(gl, {
      id: 'RenderPolygonWireframe',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.TRIANGLES,
      vertexCount: 12,
      isIndexed: true
      // debug: true
    });

     this.polygonWireFrameModel = new Model(gl, {
      id: 'RenderTriangles',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.LINE_LOOP
      // debug: true
    });
    this.wireframeBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});

    this.filterTransform = new Transform(gl, {
      id: 'filter transform',
      vs: FILTER_VS,
      varyings: ['filterValueIndex']
      // debug: true
    });


    // clamp to system max texure-size
    if (polygon) {
      this.update({polygon});
    }
  }

  update({polygon, size = 2, vertexCount} = {}) {
    const {textureSize} = this;

    const complexPolygon = Polygon.normalize(polygon, size);
    vertexCount = vertexCount || Polygon.getVertexCount(complexPolygon, size);
    const boundingBox = getBoundingBox(complexPolygon, vertexCount);

    const bbSize = [boundingBox[2] - boundingBox[0], boundingBox[3] - boundingBox[1]];
    this.boundingBox = boundingBox;
    this.bbSize = bbSize;
    // console.log(`boundingBox: ${boundingBox}`);
    // console.log(`size: ${size}`);

    const whRatio = bbSize[0] / bbSize[1];

    let texWidth = textureSize;
    let texHeight = textureSize;

    if (whRatio > 1) {
      texHeight = textureSize;
      texWidth = texHeight * whRatio;
    } else {
      texWidth = textureSize;
      texHeight = texWidth / whRatio;
    }
    // TODO: clamp to max texture size
    // console.log(`GPUPolygonClip: size: ${textureSize} Tex: w: ${texWidth} h: ${texHeight} whRatio: ${whRatio}`);


    this.polygonTexture.resize({width: texWidth, height: texHeight, mipmaps: false});

    this.positionBuffer.setData(new Float32Array(complexPolygon));
    // Should be enough to index into polygon vertex buffer (max vertex count will be 64K)
    const indices = new Uint16Array(Polygon.getSurfaceIndices(complexPolygon, 2));
    this.indexBuffer.setData(indices);

    this.wireframeBuffer.setData(new Float32Array(complexPolygon));

    // const ArrayType = hasFeature(gl, FEATURES.ELEMENT_INDEX_UINT32) ? GL.UNSIGNED_INT : GL.UNSIGNED_SHORT;

    // assert(vertexCount === indices.length, `vertexCount: ${vertexCount} is not same as index count: ${indices.length}`);

    this.polyTextureTransform.update({
      elementCount: indices.length,
      _targetTexture: this.polygonTexture,
      sourceBuffers: {
        a_position: this.positionBuffer,
        indices: this.indexBuffer // key doesn't matter
      },
    });
    this.polyTextureTransform.run({
      uniforms: {
        boundingBox,
        size: bbSize
      }
    });

    this.polygonModel.setProps({
      attributes: {
        a_position: this.positionBuffer,
        indices: this.indexBuffer // key doesn't matter
      }
    });
    this.polygonModel.setVertexCount(indices.length); // (vertexCount-1);

    this.polygonWireFrameModel.setProps({
      attributes: {
        a_position: this.wireframeBuffer
      }
    });
    this.polygonWireFrameModel.setVertexCount(complexPolygon.length/2);
  }

  run({positionBuffer, filterValueIndexBuffer, pointCount}) {
    this.filterTransform.update({
      sourceBuffers: {
        a_position: positionBuffer
      },
      feedbackBuffers: {
        filterValueIndex: filterValueIndexBuffer
      },
      elementCount: pointCount
    });
    const {polygonTexture, boundingBox, bbSize} = this;
    // console.log(`gpuPolygonClip#run: boundingBox: ${boundingBox} bbSize: ${bbSize}`);
    this.filterTransform.run({
      uniforms: {
        filterTexture: polygonTexture,
        boundingBox,
        size: bbSize
      }
    });
  }
}
