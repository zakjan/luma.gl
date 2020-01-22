
import GL from '@luma.gl/constants';
import {Buffer, readPixelsToArray, Framebuffer, clear, Texture2D, assert} from '@luma.gl/webgl';
import {AnimationLoop, Model, Transform} from '@luma.gl/engine';
const TEXTURE_SIZE = 64;
import * as Polygon from './polygon';

import {getRandom} from '../../utils';

const random = getRandom();

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

    // HACK
    // gl_Position = vec4(0., 0., 0., 1.);
}
`;

const POLY_TEX_FS = `\
void main()
{
    gl_FragColor = vec4(255., 1., 100., 1.0);
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
void main()
{
    gl_FragColor = vec4(vec3(1.0, 1., 0.) * ALPHA, ALPHA);
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

export class PolygonFilter {
  constructor(gl, {triangles = TRIANGLES} = {}) {
    this.triangles = triangles.slice();
    this.gl = gl;
    this.update();
  }

  update(tock = 0, offsetX, offsetY) {
    const {gl, triangles} = this;
    const triangleVertices = [];
    const triangleWireFrameVertices = [];
    const triangleCount = triangles.length;
    const polygons = [];
    for (let i=0; i< triangleCount; i++) {
      let xOffset = 0;
      let yOffset = 0;
      if (tock%3===0) {
        xOffset = offsetX || random() * 0.03 * (random() > 0.5 ? 1 : -1);
        yOffset = offsetY || random() * 0.01 * (random() > 0.5 ? 1 : -1);
      }
      const triangle = triangles[i]; //.slice();
      for (let j=0; j<3; j++) {
        triangle[j*2] += xOffset;
        triangle[j*2+1] += yOffset;
      }
      // console.log(`xOffset: ${xOffset} yOffset: ${yOffset}`);
      // console.log(`Triangel#${i+1}: ${triangle}`);
      triangleVertices.push(...triangle);
      triangleWireFrameVertices.push(
        triangle[0], triangle[1], triangle[2], triangle[3],
        triangle[2], triangle[3], triangle[4], triangle[5],
        triangle[4], triangle[5], triangle[0], triangle[1]
      );
      polygons.push([
        [triangle[0], triangle[1]], [triangle[2], triangle[3]], [triangle[4], triangle[5]]
      ]);
    }

    if (this.triangleBuffer) {
      this.triangleBuffer.delete();
    }
    this.triangleBuffer = new Buffer(gl, new Float32Array(triangleVertices));
    this.triangleWFBuffer = new Buffer(gl, new Float32Array(triangleWireFrameVertices));
    const boundingBox = getBoundingBox(triangleVertices, triangleCount * 3);
    const size = [boundingBox[2] - boundingBox[0], boundingBox[3] - boundingBox[1]];
    this.boundingBox = boundingBox;
    this.size = size;
    // console.log(`boundingBox: ${boundingBox}`);
    // console.log(`size: ${size}`);

    const whRatio = size[0] / size[1];

    let texWidth = TEXTURE_SIZE;
    let texHeight = TEXTURE_SIZE;

    if (whRatio > 1) {
      texHeight = TEXTURE_SIZE;
      texWidth = texHeight * whRatio;
    } else {
      texWidth = TEXTURE_SIZE;
      texHeight = texWidth / whRatio;
    }
    // const textureData = new Float32Array(texWidth * texHeight * 4);
    if (this.polygonTexture) {
      this.polygonTexture.delete();
    }
    this.polygonTexture = new Texture2D(gl, {
      // data: textureData,

      // format: GL.RGBA32F, // GL.RGBA, // verify support for GL.R
      // type: GL.FLOAT, // GL.UNSIGNED_BYTE,
      // dataFormat: GL.RGBA,

      format: GL.RGB,
      type: GL.UNSIGNED_BYTE,
      dataFormat: GL.RGB,

      border: 0,
      mipmaps: false,

      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
      },

      width: texWidth,
      height: texHeight
    });

    if (!this.polyTextureTransform) {
      this.polyTextureTransform = new Transform(gl, {
        id: `polygon-texture-creation-transform`,
        elementCount: triangleCount * 3,
        _targetTexture: this.polygonTexture,
        vs: POLY_TEX_VS,
        fs: POLY_TEX_FS,
        sourceBuffers: {
          a_position: this.triangleBuffer
        },
        drawMode: GL.TRIANGLES,
        debug: true
      });
    } else {
      this.polyTextureTransform.update({
        elementCount: triangleCount * 3,
        _targetTexture: this.polygonTexture,
        sourceBuffers: {
          a_position: this.triangleBuffer
        },
      });
    }
    this.polyTextureTransform.run({
      clearRenderTarget: true,
      parameters: {
        depthTest: false
      },
      uniforms: {
        boundingBox,
        size
      },
    });
    const polyData = this.polyTextureTransform.getData();

    return {
      polyPosBuffer: this.triangleBuffer,
      polyWireFrameBuffer: this.triangleWFBuffer,
      texture: this.polygonTexture,
      data: polyData,
      transform: this.polyTextureTransform,
      boundingBox: this.boundingBox,
      size: this.size,
      polygons
    };
  }
}

export function getPolygonTexture(gl) {

  const triangles =  new Float32Array([
    -0.5, -0.5,  0, 0, -0.5, 0.5,
    0.5, -0.5,  0, 0,  0.5, 0.5
  ]);
  const triangles_wireframe_buffer = new Buffer(gl, new Float32Array([
    -0.5, -0.5,  0, 0,
    0, 0, -0.5, 0.5,
    -0.5, 0.5, -0.5, -0.5,

    0.5, -0.5,  0, 0,
    0, 0,  0.5, 0.5,
    0.5, 0.5, 0.5, -0.5
  ]));

  const triangleBuffer = new Buffer(gl, triangles);

  const boundingBox = getBoundingBox(triangles, 6);
  const size = [boundingBox[2] - boundingBox[0], boundingBox[3] - boundingBox[1]];
  const whRatio = size[0] / size[1];

  let texWidth = TEXTURE_SIZE;
  let texHeight = TEXTURE_SIZE;

  if (whRatio > 1) {
    texHeight = TEXTURE_SIZE;
    texWidth = texHeight * whRatio;
  } else {
    texWidth = TEXTURE_SIZE;
    texHeight = texWidth / whRatio;
  }
  console.log(`getPolygonTexture: size: ${TEXTURE_SIZE} Tex: w: ${texWidth} h: ${texHeight} whRatio: ${whRatio}`);

  console.log(`Polygon texture w: ${texWidth} h: ${texHeight}`);

  const textureData = new Float32Array(texWidth * texHeight * 4);
  textureData[0] = 10.0;
  textureData[texWidth * texHeight * 2 + 1] = 100.0;
  const polygonTexture = new Texture2D(gl, {
    data: textureData,
    // format: GL.RGBA32F, // GL.RGBA, // verify support for GL.R
    // type: GL.FLOAT, // GL.UNSIGNED_BYTE,
    // dataFormat: GL.RGBA,
    format: GL.RGB,
    type: GL.UNSIGNED_BYTE,
    dataFormat: GL.RGB,

    border: 0,
    mipmaps: false,
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
    },
    // pixelStore: {
    //   [GL.UNPACK_FLIP_Y_WEBGL]: false
    // },
    width: texWidth,
    height: texHeight
  })

  const polyTextureTransform = new Transform(gl, {
    id: `polygon-texture-creation-transform`,
    elementCount: 6,
    _targetTexture: polygonTexture,
    vs: POLY_TEX_VS,
    fs: POLY_TEX_FS,
    sourceBuffers: {
      a_position: triangleBuffer
    },
    uniforms: {
      boundingBox,
      size
    },
    drawMode: GL.TRIANGLES,
    debug: true
  });

  polyTextureTransform.run({
    clearRenderTarget: true,
    parameters: {
      depthTest: false
    }
  });

  const polyData = polyTextureTransform.getData();

  // console.log(`Logging polygon texture data: totalCount: ${polyData.length/4}`);
  // let nonZeroCount = 0;
  // for (let i=0; i< polyData.length; i+=4) {
  //   if (polyData[i] || polyData[i + 1] || polyData[i + 2]) {
  //     nonZeroCount++;
  //     console.log(polyData[i], polyData[i+1], polyData[i+2]);
  //   }
  // }
  // console.log(`Non zero count: ${nonZeroCount}`);


  return {
    polyPosBuffer: triangleBuffer,
    polyWireFrameBuffer: triangles_wireframe_buffer,
    texture: polygonTexture,
    data: polyData,
    transform: polyTextureTransform,
    boundingBox,
    size
  };
}

export function dumpNonZeroValues(array, size = 4, title = 'Logging array content') {
  console.log(`Logging polygon texture data: totalCount: ${array.length/size}`);
  let nonZeroCount = 0;
  for (let i=0; i< array.length; i+=size) {
    if (array[i] || (size < 2 ? true: array[i + 1]) || (size < 3 ? true: array[i + 2])) {
      nonZeroCount++;
      console.log(array[i], array[i+1]);
    }
  }
  console.log(`Non zero count: ${nonZeroCount}`);

}

export class GPUPolygonClip {
  constructor(gl, {textureSize = TEXTURE_SIZE, polygons} = {}) {
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
      isIndexed: true,

      debug: true
    });
    this.positionBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});
    this.indexBuffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER, accessor: {type: GL.UNSIGNED_SHORT}});

    this.polygonModel = new Model(gl, {
      id: 'RenderPolygonWireframe',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.LINE_LOOP,
      vertexCount: 12,
      isIndexed: true,
      debug: true
    });


    // clamp to system max texure-size
    if (polygons) {
      this.update({polygons});
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
    console.log(`boundingBox: ${boundingBox}`);
    console.log(`size: ${size}`);

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
    console.log(`GPUPolygonClip: size: ${textureSize} Tex: w: ${texWidth} h: ${texHeight} whRatio: ${whRatio}`);


    this.polygonTexture.resize({width: texWidth, height: texHeight, mipmaps: false});

    this.positionBuffer.setData(new Float32Array(complexPolygon));
    // Should be enough to index into polygon vertex buffer (max vertex count will be 64K)
    const indices = new Uint16Array(Polygon.getSurfaceIndices(complexPolygon, 2));
    this.indexBuffer.setData(indices);

    // const ArrayType = hasFeature(gl, FEATURES.ELEMENT_INDEX_UINT32) ? GL.UNSIGNED_INT : GL.UNSIGNED_SHORT;

    // assert(vertexCount === indices.length, `vertexCount: ${vertexCount} is not same as index count: ${indices.length}`);

    this.polyTextureTransform.update({
      elementCount: vertexCount,
      _targetTexture: this.polygonTexture,
      sourceBuffers: {
        a_position: this.positionBuffer,
        indices: this.indexBuffer // key doesn't matter
      },
    });

    this.polygonModel.setProps({
      attributes: {
        a_position: this.positionBuffer,
        indices: this.indexBuffer // key doesn't matter
      }
    });
    this.polygonModel.setVertexCount(vertexCount-1);
  }

}
