
import GL from '@luma.gl/constants';
import {Buffer, readPixelsToArray, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {AnimationLoop, Model, Transform} from '@luma.gl/engine';
const TEXTURE_WIDTH = 512;
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

export function getPolygonTexture(gl) {

  const triangles =  new Float32Array([
    -0.5, -0.5,  0, 0, -0.5, 0.5,
    0.5, -0.5,  0, 0,  0.5, 0.5
  ]);
  const triangleBuffer = new Buffer(gl, triangles);
  const boundingBox = getBoundingBox(triangles, 6);
  const size = [boundingBox[2] - boundingBox[0], boundingBox[3] - boundingBox[1]];
  const whRatio = size[0] / size[1];

  let texWidth = TEXTURE_WIDTH;
  let texHeight = TEXTURE_WIDTH;

  if (whRatio > 1) {
    texHeight = TEXTURE_WIDTH;
    texWidth = texHeight * whRatio;
  } else {
    texWidth = TEXTURE_WIDTH;
    texHeight = texWidth / whRatio;
  }

  console.log(`Polygon texture w: ${texWidth} h: ${texHeight}`);

  const textureData = new Float32Array(texWidth * texHeight * 4);
  textureData[0] = 10.0;
  textureData[texWidth * texHeight * 2 + 1] = 100.0;
  const polygonTexture = new Texture2D(gl, {
    data: textureData,
    format: GL.RGBA32F, // GL.RGBA, // verify support for GL.R
    type: GL.FLOAT, // GL.UNSIGNED_BYTE,
    border: 0,
    mipmaps: false,
    // [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
    // [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
    // [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
    // [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
    },
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    },
    dataFormat: GL.RGBA,
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
      console.log(array[i], array[i+1], array[i+2]);
    }
  }
  console.log(`Non zero count: ${nonZeroCount}`);

}
