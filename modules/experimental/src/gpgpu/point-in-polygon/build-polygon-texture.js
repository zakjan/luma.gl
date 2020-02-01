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
    // translate from bbox to NDC
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

export default class BuildPolygonTexture {
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

    if (polygon) {
      this.update({polygon});
    }
  }

  build({polygon, size = 2, vertexCount, polygons} = {}) {
    const {textureSize} = this;

    let complexPolygon;
    let indices;
    if (polygons) {
      complexPolygon = [];
      indices = [];
      let count = 0;
      polygons.forEach(p => {
        const vertices = Polygon.normalize(p, size);
        complexPolygon.push(...vertices);
        const tIndices = Polygon.getSurfaceIndices(vertices, 2).map(x => x + count);
        count += vertices.length/2;
        indices.push(...tIndices);
      })
    } else {
      complexPolygon = Polygon.normalize(polygon, size);
      indices = Polygon.getSurfaceIndices(complexPolygon, 2);
    }

    vertexCount = vertexCount || Polygon.getVertexCount(complexPolygon, size);
    const boundingBox = getBoundingBox(complexPolygon, vertexCount);
    // console.log(`boundingBox: ${boundingBox}`);

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
    this.indexBuffer.setData(new Uint16Array(indices));

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

    const {polygonTexture, indexBuffer, positionBuffer} = this;
    return {
      boundingBox, bbSize, polygonTexture,
      // For debug purposes
      indexBuffer, positionBuffer, vertexCount, complexPolygon, indices
    };
  }
}
