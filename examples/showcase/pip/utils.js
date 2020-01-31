
import GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';
import {getRandom} from '../../utils';
import * as Polygon from './polygon';


const random = getRandom();
const TEXTURE_SIZE = 64;
const TRIANGLES = [
  [-0.5, -0.5,  0, 0, -0.5, 0.5],
 [0.5, -0.5,  0, 0,  0.5, 0.5]
];
const POLYGON = [
  [-0.5, -0.5],  [0, 0], [-0.5, 0.5], [-0.75, 0]
]

export function getRandomPoints(count, boundingBox = [-1, -1, 1, 1]) {

  const xScale = boundingBox[2] - boundingBox[0];
  const yScale = boundingBox[3] - boundingBox[1];
  const xOrigin = boundingBox[0];
  const yOrigin = boundingBox[1];

  const flatArray = new Float32Array(count * 2);
  const pointsArray = new Array(count);
  for (let i = 0; i < count; ++i) {
    flatArray[i * 2] = random() * xScale + xOrigin;
    flatArray[i * 2 + 1] = random() * yScale + yOrigin;
    pointsArray[i] = [flatArray[i * 2], flatArray[i * 2 + 1]];
  }
  return {flatArray, pointsArray};
}

let random_polygon;
let random_polygon_counter = 0;

export function getRandomPolygon(size = null, boundingBox = [-1, -1, 1, 1], bboxOffsetScale = 0.25) {

  const bbSize = Math.min(boundingBox[2] - boundingBox[0], boundingBox[3] - boundingBox[1]);
  const radiusStep = bbSize * (1 - bboxOffsetScale) / 2;
  const originXOffset = boundingBox[0] + radiusStep;
  const originYOffset = boundingBox[1] + radiusStep;


  random_polygon_counter++;
  if (random_polygon && random_polygon_counter % 100 !== 0) {
      return random_polygon;
  }

  size = size || 3 + Math.floor(random() * 50);
  size = Math.max(size, 3);
  const angleStep = 360 / size ;
  let angle = 0;
  let radius = 0;
  const polygon = [];
  const xOffset = (random() - 0.5)/4;
  const yOffset = (random() - 0.5)/4;
  let pXMin = 10000;
  let pYMin = 10000;
  let pXMax = -10000;
  let pYMax = -10000;
  for (let i=0; i<size; i++) {
    radius = radiusStep*random(); // random value between 0.25 to 0.5
    angle = (angleStep * i) + angleStep*random();
    const cos =  Math.cos(angle * Math.PI / 180);
    const sin =  Math.sin(angle * Math.PI / 180);
    const pX = radius * sin;
    const pY = radius * cos;
    pXMin = Math.min(pXMin, pX);
    pYMin = Math.min(pYMin, pY);
    pXMax = Math.max(pXMax, pX);
    pYMax = Math.max(pYMax, pY);
    polygon.push([pX + originXOffset, pY + originYOffset]);
  }
  random_polygon = polygon;
  console.log(`boundingBox: ${boundingBox} radiusStep: ${radiusStep} originXOffset: ${originXOffset} originYOffset: ${originXOffset}, polyBox: ${pXMin} ${pYMin} ${pXMax} ${pYMax}`);
  return polygon;
}

const POLY_VS = `\
precision highp float;
precision highp int;
attribute vec2 a_position;
uniform vec2 bbOrgin;
uniform vec2 bbSize;
void main()
{
  // [L, B] : [W, H] =>  [0 , 0] -> [W, H]
  vec2 pos = a_position - bbOrgin;
  // [0 , 0] -> [1, 1]
  pos = pos / bbSize;
  // [0 , 0] -> [2, 2]
  pos = pos * vec2(2.);
  // [-1 , -1] -> [1, 1]
  pos = pos - vec2(1.);

  gl_Position = vec4(pos, 0.0, 1.0);
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

export class PolygonModel {
  constructor(gl, opts) {
    this.gl = gl;

    this.positionBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});
    this.indexBuffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER, accessor: {type: GL.UNSIGNED_SHORT}});
    this.wireframeBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});


    this.polygonModel = new Model(gl, {
      id: 'RenderPolygonSolid',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.TRIANGLES,
      vertexCount: 12,
      isIndexed: true,
      uniforms: opts.uniforms,
      debug: true
    });

     this.polygonWireFrameModel = new Model(gl, {
      id: 'RenderPolygonWireFrame',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.LINE_LOOP,
      uniforms: opts.uniforms,
      debug: true
    });

    // clamp to system max texure-size
    if (opts.polygon) {
      this.update(opts);
    }
  }

  update({polygon, vertexCount, size = 2, bobx} = {}) {

    const complexPolygon = Polygon.normalize(polygon, size);
    vertexCount = vertexCount || Polygon.getVertexCount(complexPolygon, size);
    const indices = Polygon.getSurfaceIndices(complexPolygon, 2);

    this.positionBuffer.setData(new Float32Array(complexPolygon));
    this.indexBuffer.setData(new Uint16Array(indices));
    this.wireframeBuffer.setData(new Float32Array(complexPolygon));



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

    return this;
  }
}
