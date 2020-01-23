import test from 'tape-catch';
import {fixture} from 'test/setup';
import {equals} from 'math.gl';
import GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {GPUPointInPolygon, CPUPointInPolygon} from '@luma.gl/experimental';

const {gl2} = fixture;
const TEST_CASES = [
  {
    name: 'all - in',
    polygon: [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5]
    ],
    points: [
      [0, 0],
      [-0.25, -0.25],
      [0.25, -0.25],
      [0.25, 0.25],
      [-0.25, 0.25],
      [-0.45, 0.45]
    ]
  },
  {
    name: 'all - out',
    polygon: [
      [-0.35, -0.35],
      [0.35, -0.35],
      [0.35, 0.35],
      [-0.35, 0.35]
    ],
    points: [
      [-0.45, -0.25],
      [0.25, -0.5],
      [0.45, 0.25],
      [-0.25, 0.45],
      [-0.45, 0.45],
      [10, 0]
    ]
  },
  {
    name: 'mix',
    polygon: [
      [-0.35, -0.35],
      [0.45, -0.35],
      [0.35, 0.45],
      [-0.5, 0.35]
    ],
    points: [
      [-0.35, -0.35],
      [0.25, -0.45],
      [0.25, -0.25],
      [0.45, 0.25],
      [0.34, 0.43],
      // [-0.25, 0.45], // on polygon edge, gives different results for CPU and GPU
      [-0.25, 0.5],
      [-0.45, 0.45],
      [0.33, 0.44],
      [10, 5],
      [0, 0],
      [-0.35, -0.35]
    ]
  }
];

test.only('gpgpu#point-in-polygon CPU vs GPU', t => {
  const gpuPointInPolygon = new GPUPointInPolygon(gl2, {textureSize: 128});
  const cpuPointInPolygon = new CPUPointInPolygon();

  TEST_CASES.forEach(tc => {
    const {polygon, points, name} = tc;
    const pointCount = points.length;
    const flatArray = new Float32Array(pointCount * 2);
    for(let i=0; i<pointCount; i++) {
      flatArray[i*2] = points[i][0];
      flatArray[i*2+1] = points[i][1];
    }

    // gpu
    const positionBuffer = new Buffer(gl2, flatArray);
    const filterValueIndexBuffer = new Buffer(gl2, pointCount * 2 * 4);
    gpuPointInPolygon.update({polygon});
    gpuPointInPolygon.run({positionBuffer, filterValueIndexBuffer, pointCount});

    // cpu
    cpuPointInPolygon.update({polygon});
    const {filterValues: cpuResults} = cpuPointInPolygon.run({points});
    const filterValueIndexArray = filterValueIndexBuffer.getData();
    const gpuResults = new Array(pointCount);

    for (let i=0; i<pointCount; i++) {
      const index = filterValueIndexArray[i*2 + 1];
      gpuResults[index] = filterValueIndexArray[i*2];
    }

    positionBuffer.delete();
    filterValueIndexBuffer.delete();

    t.ok(equals(gpuResults, cpuResults), `${name}: CPU GPU results should match`);

    console.log(`cpu: ${cpuResults} gpu: ${gpuResults}`);

  });
  t.end();
});
