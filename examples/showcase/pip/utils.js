
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

export function getRandomPoints(count) {
  const flatArray = new Float32Array(count * 2);
  const pointsArray = new Array(count);
  for (let i = 0; i < count; ++i) {
    flatArray[i * 2] = random() * 2.0 - 1.0;
    flatArray[i * 2 + 1] = random() * 2.0 - 1.0;
    pointsArray[i] = [flatArray[i * 2], flatArray[i * 2 + 1]];
  }
  return {flatArray, pointsArray};
}

let random_polygon;
let random_polygon_counter = 0;

export function getRandomPolygon(size) {

  random_polygon_counter++;
  if (random_polygon && random_polygon_counter % 100 !== 0) {
      return random_polygon;
  }

  size = size || 3 + Math.floor(random() * 50);
  size = Math.max(size, 3);
  const angleStep = 360 / size ;
  let angle = 0;
  const radiusStep = 0.25;
  let radius = 0;
  const polygon = [];
  const xOffset = (random() - 0.5)/4;
  const yOffset = (random() - 0.5)/4;
  for (let i=0; i<size; i++) {
    radius = 0.25 + radiusStep*random(); // random value between 0.25 to 0.5
    angle = (angleStep * i) + angleStep*random();
    const cos =  Math.cos(angle * Math.PI / 180);
    const sin =  Math.sin(angle * Math.PI / 180);
    polygon.push([
      radius * sin + xOffset,
      radius * cos + yOffset
    ]);
  }
  random_polygon = polygon;
  return polygon;
}

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

export class PolygonModel {
  constructor(gl, opts) {
    this.gl = gl;

    this.positionBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});
    this.indexBuffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER, accessor: {type: GL.UNSIGNED_SHORT}});
    this.wireframeBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});


    this.polygonModel = new Model(gl, {
      id: 'RenderPolygonWireframe',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.TRIANGLES,
      vertexCount: 12,
      isIndexed: true,
      debug: true
    });

     this.polygonWireFrameModel = new Model(gl, {
      id: 'RenderTriangles',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.LINE_LOOP,
      debug: true
    });

    // clamp to system max texure-size
    if (opts) {
      this.update(opts);
    }
  }

  update({polygon, vertexCount, size = 2} = {}) {

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
