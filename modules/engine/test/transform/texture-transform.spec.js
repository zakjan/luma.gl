import {Buffer, Texture2D} from '@luma.gl/webgl';
// import {Transform} from '@luma.gl/engine';
import {default as Transform} from '../../src/transform/texture-transform';
import test from 'tape-catch';
import {fixture} from 'test/setup';
import GL from '@luma.gl/constants';
import {setParameters, getParameters} from '@luma.gl/gltools';


const VSTexInput = `\
#version 300 es
in float inBuffer;
in float inTexture;
out float outValue;

void main()
{
  outValue = inBuffer + inTexture;
}
`;

/*

test('WebGL#TextureTransform run (source texture + feedback buffer)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([20, -31, 0, 23.45]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const sourceTexture = new Texture2D(gl2, {
    data: sourceData,
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    mipmaps: false,
    width: 2,
    height: 2,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  });
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inBuffer: sourceBuffer
    },
    _sourceTextures: {
      inTexture: sourceTexture
    },
    vs: VSTexInput,
    feedbackMap: {
      inBuffer: 'outValue'
    },
    elementCount: sourceData.length
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
*/

function getResourceCounts() {
  /* global luma */
  const resourceStats = luma.stats.get('Resource Counts');
  return {
    Texture2D: resourceStats.get('Texture2Ds Active').count,
    Buffer: resourceStats.get('Buffers Active').count
  };
}

function validateResourceCounts(t, startCounts, endCounts) {
  for (const resourceName in endCounts) {
    const leakCount = endCounts[resourceName] - startCounts[resourceName];
    t.ok(leakCount === 0, `should delete all ${resourceName}, remaining ${leakCount}`);
  }
}

const TEXTURE_BUFFER_TEST_CASES = [
  // NOTE: elementCount is equal to width * height
  // TODO: determine width and height based on elementCount and padding if needed
  {
    name: 'RED-FLOAT',
    sourceData: new Float32Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: `\
#version 300 es
in float inBuffer;
in float inTexture;
out float outBuffer;
out float outTexture;

void main()
{
  outBuffer = inTexture + inBuffer;
  outTexture = inTexture + inBuffer;
}
`
  },
  {
    name: 'RGBA-UNSIGNED_BYTE',
    sourceData: new Uint8Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    vs: `\
#version 300 es
in float inBuffer;
in vec4 inTexture;
out float outBuffer;
out vec4 outTexture;

void main()
{
  outBuffer = 2. * inBuffer;
  outTexture = 2. *  inTexture;
}
`
  }
];
/*
test('WebGL#TextureTransform run (source&destination texture + feedback buffer)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  TEXTURE_BUFFER_TEST_CASES.forEach(testCase => {
    const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
    const sourceBuffer = new Buffer(gl2, {data: new Float32Array(sourceData)});
    const sourceTexture = new Texture2D(gl2, {
      data: sourceData,
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });
    const transform = new Transform(gl2, {
      sourceBuffers: {
        inBuffer: sourceBuffer
      },
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTextureVarying: 'outTexture',
      _targetTexture: 'inTexture',
      vs,
      feedbackMap: {
        inBuffer: 'outBuffer'
      },
      elementCount: sourceData.length
    });

    transform.run();

    const expectedData = sourceData.map(x => x * 2);
    const outData = transform.getData({varyingName: 'outBuffer'});
    t.deepEqual(outData, expectedData, `${name} Transform should write correct data into Buffer`);

    // By default getData reads data from current Framebuffer.
    const outTexData = transform.getData({varyingName: 'outTexture', packed: true});

    // t.deepEqual(outData, expectedData, 'Transform should write correct data into Buffer');
    t.deepEqual(
      outTexData,
      expectedData,
      `${name} Transform should write correct data into Texture`
    );
  });

  t.end();
});
*/
const TEXTURE_TEST_CASES = [
  // NOTE: elementCount is equal to width * height
  // TODO: determine width and height based on elementCount and padding if needed
  {
    name: 'RGBA-FLOAT',
    sourceData: new Float32Array([
      0,
      0,
      0,
      0,
      -1,
      -2,
      -3,
      -4,
      2,
      3,
      4,
      5,
      10,
      20,
      30,
      40,
      5,
      6,
      7,
      8,
      51,
      61,
      71,
      81,
      -15,
      -16,
      70,
      81,
      50,
      100,
      -2,
      -5,
      9,
      10,
      11,
      12,
      0,
      -20,
      52,
      78,
      -3,
      -4,
      2,
      3,
      8,
      51,
      61,
      71,
      3,
      14,
      15,
      16,
      -4,
      2,
      3,
      4,
      11,
      12,
      0,
      -20,
      0,
      0,
      -1,
      -2
    ]),
    format: GL.RGBA32F,
    dataFormat: GL.RGBA,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
  },
  {
    name: 'RED-FLOAT',
    sourceData: new Float32Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: `\
#version 300 es
in float inTexture;
out float outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
  },
  {
    name: 'RGBA-UNSIGNED_BYTE',
    sourceData: new Uint8Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    vs: `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
  }
];

test('WebGL#TextureTransform run (source&destination texture)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  TEXTURE_TEST_CASES.forEach(testCase => {
    const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
    const sourceTexture = new Texture2D(gl2, {
      data: sourceData,
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });
    const transform = new Transform(gl2, {
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTexture: 'inTexture',
      _targetTextureVarying: 'outTexture',
      _swapTexture: 'inTexture',
      vs,
      elementCount: sourceData.length
    });

    transform.run();

    let expectedData = sourceData.map(x => x * 2);
    // By default getData reads data from current Framebuffer.
    let outTexData = transform.getData({packed: true});
    t.deepEqual(
      outTexData,
      expectedData,
      `${name} Transform should write correct data into Texture`
    );

    transform.swap();
    transform.run();
    expectedData = sourceData.map(x => x * 4);

    // By default getData reads data from current Framebuffer.
    outTexData = transform.getData({packed: true});

    t.deepEqual(outTexData, expectedData, `${name} Transform swap Textures`);
  });

  t.end();
});

/*
test.only('WebGL#TextureTransform update (source&destination texture)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const {sourceData, format, dataFormat, type, width, height, name, vs} = TEXTURE_TEST_CASES[0];
  const sourceTexture = new Texture2D(gl2, {
    data: sourceData,
    format,
    dataFormat,
    type,
    mipmaps: false,
    width,
    height,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  });
  const transform = new Transform(gl2, {
    _targetTextureVarying: 'outTexture',
    _swapTexture: 'inTexture',
    vs
  });

  transform.update({
    _sourceTextures: {
      inTexture: sourceTexture
    },
    _targetTexture: 'inTexture',
    elementCount: sourceData.length
  })

  transform.run();

  let expectedData = sourceData.map(x => x * 2);
  // By default getData reads data from current Framebuffer.
  let outTexData = transform.getData({packed: true});
  t.deepEqual(
    outTexData,
    expectedData,
    `${name} Transform should write correct data into Texture`
  );

  transform.swap();
  transform.run();
  expectedData = sourceData.map(x => x * 4);

  // By default getData reads data from current Framebuffer.
  outTexData = transform.getData({packed: true});

  t.deepEqual(outTexData, expectedData, `${name} Transform swap Textures`);

  t.end();
});
*/

test('WebGL#TextureTransform run (source&destination texture update)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  TEXTURE_TEST_CASES.forEach(testCase => {
    const startCounts = getResourceCounts();

    const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
    // const sourceBuffer = new Buffer(gl2, {data: new Float32Array(sourceData)});
    const sourceTexture = new Texture2D(gl2, {
      data: sourceData,
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });
    const transform = new Transform(gl2, {
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTexture: 'inTexture',
      _targetTextureVarying: 'outTexture',
      _swapTexture: 'inTexture',
      vs,
      elementCount: sourceData.length
    });

    transform.run();

    const updateData = sourceData.map(x => x + 3);
    const updateTexture = new Texture2D(gl2, {
      data: updateData,
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });

    transform.update({_sourceTextures: {inTexture: updateTexture}});
    transform.run();

    const expectedData = updateData.map(x => x * 2);
    // By default getData reads data from current Framebuffer.
    const outTexData = transform.getData({packed: true});
    t.deepEqual(
      outTexData,
      expectedData,
      `${name} Transform should write correct data into Texture`
    );
    sourceTexture.delete();
    updateTexture.delete();
    transform.delete();
    const endCounts = getResourceCounts();
    validateResourceCounts(t, startCounts, endCounts);
  });

  t.end();
});

const OFFLINE_RENDERING_TEST_CASES = [
  {
    name: 'RED-FLOAT',
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    expected: 123,
    position: new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
    vs: `\
#version 300 es
in vec2 position;
out float outTexture;

void main()
{
  outTexture = 123.;
  gl_Position = vec4(position, 0., 1.);
}
`
  },
  {
    name: 'RGBA-UNSIGNED_BYTE',
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    expected: 255,
    position: new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
    vs: `\
#version 300 es
in vec2 position;
out vec4 outTexture;

void main()
{
  outTexture = vec4(1.);
  gl_Position = vec4(position, 0., 1.);
}
`
  }
];

test('WebGL#TextureTransform run (offline rendering)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  OFFLINE_RENDERING_TEST_CASES.forEach(testCase => {
    const {position, format, dataFormat, type, width, height, name, vs, expected} = testCase;
    const _targetTexture = new Texture2D(gl2, {
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });
    const transform = new Transform(gl2, {
      sourceBuffers: {
        position: new Buffer(gl2, position)
      },
      _targetTexture,
      _targetTextureVarying: 'outTexture',
      vs,
      drawMode: GL.TRIANGLE_STRIP,
      elementCount: position.length / 2
    });

    transform.run();

    const outTexData = transform.getData({packed: true});
    const testPassed = outTexData.every(item => {
      return item === expected;
    });
    t.ok(testPassed, `${name} Transform should write correct data into Texture`);

    transform.delete();
  });

  t.end();
});

test('WebGL#TextureTransform run (source&destination with custom FS)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const startCounts = getResourceCounts();

  const name = 'RGBA-FLOAT';
  const sourceData = new Float32Array([
    0,
    0,
    0,
    0,
    -1,
    -2,
    -3,
    -4,
    2,
    3,
    4,
    5,
    10,
    20,
    30,
    40,
    5,
    6,
    7,
    8,
    51,
    61,
    71,
    81,
    -15,
    -16,
    70,
    81,
    50,
    100,
    -2,
    -5,
    9,
    10,
    11,
    12,
    0,
    -20,
    52,
    78,
    -3,
    -4,
    2,
    3,
    8,
    51,
    61,
    71,
    3,
    14,
    15,
    16,
    -4,
    2,
    3,
    4,
    11,
    12,
    0,
    -20,
    0,
    0,
    -1,
    -2
  ]);
  const format = GL.RGBA32F;
  const dataFormat = GL.RGBA;
  const type = GL.FLOAT;
  const width = 4;
  const height = 4;
  const vs = `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
outTexture = inTexture;
}
`;
  const fs = `\
#version 300 es
in vec4 outTexture;
out vec4 transform_output;
void main()
{
  transform_output = 2. * outTexture;
}
`;

  // const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
  const sourceTexture = new Texture2D(gl2, {
    data: sourceData,
    format,
    dataFormat,
    type,
    mipmaps: false,
    width,
    height,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  });
  const transform = new Transform(gl2, {
    _sourceTextures: {
      inTexture: sourceTexture
    },
    _targetTexture: 'inTexture',
    _targetTextureVarying: 'outTexture',
    _swapTexture: 'inTexture',
    vs,
    _fs: fs,
    elementCount: sourceData.length
  });

  transform.run();

  let expectedData = sourceData.map(x => x * 2);
  // By default getData reads data from current Framebuffer.
  let outTexData = transform.getData({packed: true});
  t.deepEqual(outTexData, expectedData, `${name} Transform should write correct data into Texture`);

  transform.swap();
  transform.run();
  expectedData = sourceData.map(x => x * 4);

  // By default getData reads data from current Framebuffer.
  outTexData = transform.getData({packed: true});

  t.deepEqual(outTexData, expectedData, `${name} Transform swap Textures`);

  sourceTexture.delete();
  transform.delete();
  const endCounts = getResourceCounts();
  validateResourceCounts(t, startCounts, endCounts);
  t.end();
});

test('WebGL#TextureTransform run (custom parameters)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const {sourceData, format, dataFormat, type, width, height, name, vs} = TEXTURE_TEST_CASES[0];
  const sourceTexture = new Texture2D(gl2, {
    data: sourceData,
    format,
    dataFormat,
    type,
    mipmaps: false,
    width,
    height,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  });

  // enable blending
  setParameters(gl2, {blend: true, blendEquation: GL.MIN});

  const transform = new Transform(gl2, {
    _sourceTextures: {
      inTexture: sourceTexture
    },
    _targetTexture: 'inTexture',
    _targetTextureVarying: 'outTexture',
    _swapTexture: 'inTexture',
    vs,
    elementCount: sourceData.length
  });

  // disable blending through parameters
  transform.run({parameters: {blend: false}});

  const expectedData = sourceData.map(x => x * 2);
  const outTexData = transform.getData({packed: true});
  t.deepEqual(outTexData, expectedData, `${name} Transform should write correct data into Texture`);

  t.ok(getParameters(gl2, [GL.BLEND])[GL.BLEND] === true, 'Parameters are properly set');

  setParameters(gl2, {blend: false});

  t.end();
});

test('WebGL#TextureTransform (Buffer to Texture)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const vs = `\
#define EPSILON 0.00001
attribute vec4 aCur;
attribute vec4 aNext;
varying float equal;

void main()
{
equal = length(aCur - aNext) > EPSILON ? 0. : 1.;
gl_Position = vec4(0, 0, 0, 1.);
}
`;

  const fs = `\
varying float equal;
void main()
{
  if (equal == 1.) {
    discard;
  }
gl_FragColor = vec4(1.);
}
`;

  const data1 = new Float32Array([10, 20, 31, 0, -57, 28, 100, 53]);
  const data2 = new Float32Array([10, 20, 31, 0, 7, 10, -10, 43]);
  const aCur = new Buffer(gl2, {data: data1});
  const aNext = new Buffer(gl2, {data: data2}); // buffers contain different data
  const texture = new Texture2D(gl2, {
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    mipmaps: false
  });

  const transform = new Transform(gl2, {
    sourceBuffers: {
      aCur,
      aNext
    },
    vs,
    _fs: fs,
    _targetTexture: texture,
    _targetTextureVarying: 'outTexture', // dummy varying to enable FB creation
    elementCount: 2,
    debug: true
  });

  transform.run({clearRenderTarget: true});

  let expectedData = [255, 255, 255, 255];
  let outData = transform.getData({varyingName: 'outTexture'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  // update aNext to contain same data as aCur
  aNext.subData(data1);

  // re-run the tranform
  transform.run({clearRenderTarget: true});

  expectedData = [0, 0, 0, 0];
  outData = transform.getData({varyingName: 'outTexture'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
