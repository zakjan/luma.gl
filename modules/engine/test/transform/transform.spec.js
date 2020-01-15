import {Buffer, Texture2D} from '@luma.gl/webgl';
// import {Transform} from '@luma.gl/engine';
import {default as Transform} from '../../src/transform/buffer-transform';
import test from 'tape-catch';
import {fixture} from 'test/setup';
import GL from '@luma.gl/constants';
import {setParameters, getParameters} from '@luma.gl/gltools';

const VS = `\
#version 300 es
in float inValue;
out float outValue;

void main()
{
  outValue = 2.0 * inValue;
}
`;

const VS2 = `\
#version 300 es
in float inValue1;
in float inValue2;
out float doubleValue;
out float halfValue;

void main()
{
  doubleValue = 2.0 * inValue1;
  halfValue = 0.5 * inValue2;
}
`;

const VS_NO_SOURCE_BUFFER = `\
varying float outValue;
uniform float uValue;

void main()
{
  outValue = uValue * 2.;
}
`;

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

test('WebGL#Transform construction', t => {
  const gl = fixture.gl2;
  if (!gl) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const transform = new Transform(gl, {
    vs: VS,
    sourceBuffers: {
      inValue: new Buffer(gl, {id: 'inValue', data: new Float32Array([0, 2.7, -45])})
    },
    feedbackBuffers: {
      outValue: 'inValue'
    },
    elementCount: 3
  });

  t.ok(transform instanceof Transform, 'should construct Transform object');

  t.end();
});

test('WebGL#Transform constructor/delete', t => {
  const {gl, gl2} = fixture;

  t.throws(() => new Transform(), 'Transform throws on missing gl context');

  t.throws(() => new Transform(gl), 'Transform throws on missing gl context');

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  t.ok(transform instanceof Transform, 'Transform construction successful');

  transform.delete();
  t.ok(transform instanceof Transform, 'Transform delete successful');

  transform.delete();
  t.ok(transform instanceof Transform, 'Transform repeated delete successful');

  t.end();
});

test('WebGL#Transform feedbackBuffer with referece', t => {
  const gl = fixture.gl2;
  if (!gl) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const source = new Buffer(gl, {id: 'source', data: new Float32Array([0, 2.7, -45])});
  const bt = new Transform(gl, {
    sourceBuffers: {
      inValue: source
    },
    feedbackBuffers: {
      outValue: 'inValue'
    },
    vs: VS
  });
  t.ok(bt instanceof Transform, 'should construct manager with feedBackBuffers');
  const buffer = bt.getBuffer('outValue');
  t.ok(buffer instanceof Buffer, 'should auto create feedback buffer');

  t.end();
});

test('WebGL#Transform run', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (feedbackBuffer offset)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const outBuffer = new Buffer(gl2, 10 * 4); // 10 floats
  const offset = 3;
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackBuffers: {
      outValue: {buffer: outBuffer, byteOffset: 4 * offset}
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData({varyingName: 'outValue'}).slice(offset, offset + 5);

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (no source buffer)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const INPUT = 101;
  const outBuffer = new Buffer(gl2, 4);

  const transform = new Transform(gl2, {
    feedbackBuffers: {
      outValue: outBuffer
    },
    vs: VS_NO_SOURCE_BUFFER,
    varyings: ['outValue'],
    elementCount: 1
  });

  transform.run({uniforms: {uValue: INPUT}});

  const expectedData = [INPUT * 2];
  const outData = transform.getBuffer('outValue').getData();

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

/*
TODO Attribute class has been moved out
Either remove these tests or create a dummy Attribute with getValue method.
If deck.gl is refactoring then we should just remove.

test('WebGL#Transform run (Attribute)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Attribute(gl2, {value: sourceData});
  const feedbackBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackBuffers: {
      outValue: feedbackBuffer
    },
    vs: VS,
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

// TODO - enabling this test breaks histopyramid.spec.js in headless mode
test('WebGL#Transform run (constant Attribute)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const MULTIPLIER = 5;
  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Attribute(gl2, {value: sourceData});
  const multiplier = new Attribute(gl2, {value: [MULTIPLIER], constant: true});
  const feedbackBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer,
      multiplier
    },
    feedbackBuffers: {
      outValue: feedbackBuffer
    },
    vs: VS_CONSTANT_ATTRIBUTE,
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * MULTIPLIER);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
*/

test('WebGL#Transform swap', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  transform.swap();
  transform.run();

  const expectedData = sourceData.map(x => x * 4);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swap + update', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();
  transform.swap();

  // Increase the buffer size
  sourceData = new Float32Array([1, 2, 3, 4, 5, 6, 7]);
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    elementCount: 7
  });

  transform.run();

  let expectedData = sourceData.map(x => x * 2);
  let outData = transform.getData({varyingName: 'outValue'});

  transform.swap();
  transform.run();

  expectedData = sourceData.map(x => x * 4);
  outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swap without varyings', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData1 = new Float32Array([10, 20, 30]);
  const sourceBuffer1 = new Buffer(gl2, {data: sourceData1});
  const sourceData2 = new Float32Array([10, 20, 30]);
  const sourceBuffer2 = new Buffer(gl2, {data: sourceData2});

  // varyings array is dedueced from feedbackMap.
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue1: sourceBuffer1,
      inValue2: sourceBuffer2
    },
    vs: VS2,
    feedbackMap: {
      inValue2: 'halfValue',
      inValue1: 'doubleValue'
    },
    elementCount: 3
  });

  transform.run();

  transform.swap();
  transform.run();

  const expectedDoubleData = sourceData1.map(x => x * 4);
  const expectedHalfData = sourceData2.map(x => x * 0.25);

  const doubleData = transform.getData({varyingName: 'doubleValue'});
  const halfData = transform.getData({varyingName: 'halfValue'});

  t.deepEqual(doubleData, expectedDoubleData, 'Transform.getData: is successful');
  t.deepEqual(halfData, expectedHalfData, 'Transform.getData: is successful');

  t.end();
});

/* eslint-disable max-statements */
test('WebGL#Transform update', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(gl2, {data: sourceData});
  let expectedData;
  let outData;

  const transform = new Transform(gl2, {
    vs: VS,
    varyings: ['outValue']
  });

  t.ok(transform, 'should construct without buffers');

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackMap: {
      inValue: 'outValue'
    },
    elementCount: 5
  });

  transform.run();

  expectedData = sourceData.map(x => x * 2);
  outData = transform.getData({varyingName: 'outValue'});
  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  sourceData = new Float32Array([1, 2, 3, 0, -5]);
  sourceBuffer.delete();
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    }
  });
  t.is(transform.model.vertexCount, 5, 'Transform has correct element count');
  transform.run();

  expectedData = sourceData.map(x => x * 2);
  outData = transform.getData({varyingName: 'outValue'});
  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  sourceData = new Float32Array([3, 4, 5, 2, -3, 0]);
  sourceBuffer.delete();
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackBuffers: {
      outValue: new Buffer(gl2, {data: new Float32Array(6)})
    },
    elementCount: 6
  });
  t.is(transform.model.vertexCount, 6, 'Element count is updated');
  transform.run();

  expectedData = sourceData.map(x => x * 2);
  outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  transform.update({
    elementCount: 0
  });

  t.is(transform.model.vertexCount, 0, 'Element count is updated to 0');

  t.end();
});

test('WebGL#Transform run with shader injects', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const vs = `\
attribute float inValue;
varying float outValue;

float sum(float a, float b) {
  return a + b;
}

void main()
{
  outValue = 2.0 * inValue;
}
`;

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const inject = {
    'vs:#decl': `
attribute float injectedAttribute;
varying float injectedVarying;
`,
    'vs:#main-start': '  if (true) { injectedVarying = sum(1., injectedAttribute); } else {\n',
    'vs:#main-end': '  }\n'
  };

  const transform = new Transform(gl2, {
    sourceBuffers: {
      injectedAttribute: sourceBuffer
    },
    vs,
    inject,
    feedbackMap: {
      injectedAttribute: 'injectedVarying'
    },
    varyings: ['injectedVarying'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x + 1);
  const outData = transform.getData({varyingName: 'injectedVarying'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
