/* global window */
import GL from '@luma.gl/constants';
import {Buffer, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {AnimationLoop, Model} from '@luma.gl/engine';
import {isWebGL2} from '@luma.gl/gltools';
import {Log} from 'probe.gl';
import {getRandomPoints, getRandomPolygon, PolygonModel, getRandomPolygons} from './utils';
import {CPUPointInPolygon} from '@luma.gl/experimental';
import {GPUPointInPolygon} from '@luma.gl/experimental';

/* eslint-disable max-len */
const INFO_HTML = `
<p>
  GPU Accelertaed Polygon Clipping
`;
/* eslint-enable max-len */

// Text to be displayed on environments when this demos is not supported.
const ALT_TEXT = "THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN'T SUPPORT IT";
const USE_GPU = false;
const DRAW_VS = `\
attribute vec2 a_position;
attribute vec2 a_filterValueIndex;
uniform vec2 bbOrgin;
uniform vec2 bbSize;
varying vec4 color;
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
  color = a_filterValueIndex.x > 0. ? vec4(0, 1., 0, 1.) : vec4(1., 0, 0, 1.);

  gl_PointSize = 10.;
}
`;

const DRAW_FS = `\
varying vec4 color;
void main()
{
    gl_FragColor = color;
}
`;

const ORIGIN = [-10, -100]; // [-1, -1]; //[10, 100];
const SIZE = [50, 50]; // [2, 2]; // [50, 50];
const bbox = [ORIGIN[0], ORIGIN[1], ORIGIN[0] + SIZE[0], ORIGIN[1] + SIZE[1]];

const NUM_INSTANCES = 1000;
const log = new Log({id: 'transform'}).enable();

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  /* eslint-disable max-statements */
  onInitialize({canvas, gl, width, height}) {
    this.demoNotSupported = !isWebGL2(gl);
    if (this.demoNotSupported) {
      log.error(ALT_TEXT)();
      return {};
    }

    // -- Initialize data
    const {flatArray, pointsArray} = getRandomPoints(NUM_INSTANCES, bbox);

    const positionBuffer = new Buffer(gl, flatArray);

    // buffer to hold filtered data
    const filterValueIndexBuffer = new Buffer(gl, NUM_INSTANCES * 2 * 4); //vec2 buffer

    const pointsModel = new Model(gl, {
      id: 'RenderPoints',
      vs: DRAW_VS,
      fs: DRAW_FS,
      drawMode: gl.POINTS,
      vertexCount: NUM_INSTANCES,
      attributes: {
        a_position: positionBuffer,
        a_filterValueIndex: filterValueIndexBuffer
      },
      uniforms: {
        bbOrgin: ORIGIN,
        bbSize: SIZE
      },
      debug: true
    });

    return {
      pointsArray,
      positionBuffer,
      filterValueIndexBuffer,
      pointsModel,
      gpuPolygonClip: new GPUPointInPolygon(gl, {textureSize: 512}),
      cpuPointInPolygon: new CPUPointInPolygon(),
      polygonModel: new PolygonModel(gl, {uniforms: {bbOrgin: ORIGIN, bbSize: SIZE}})
    };
  }
  /* eslint-enable max-statements */

  onRender({
    gl,
    width,
    height,
    pointsModel,
    pointsArray,
    positionBuffer,
    filterValueIndexBuffer,
    gpuPolygonClip,
    cpuPointInPolygon,
    polygonModel,
    tick
  }) {
    if (this.demoNotSupported) {
      return;
    }
    clear(gl, {color: [0.25, 0.25, 0.25, 1]});

    let polygon; // = getRandomPolygon(null, bbox);
    let polygons = getRandomPolygons(null, bbox);

    polygonModel.update({polygon, polygons});

    let color;
    if (tick % 50 < 25) {
      gpuPolygonClip.update({polygon, polygons});
      gpuPolygonClip.run({positionBuffer, filterValueIndexBuffer, pointCount: NUM_INSTANCES});
      color = [1, 1, 0, 1];
      console.log('GPU');
    } else {
      cpuPointInPolygon.update({polygon, polygons});
      const {filterValueIndexArray} = cpuPointInPolygon.run({points: pointsArray});
      filterValueIndexBuffer.setData(filterValueIndexArray);
      color = [0, 1, 1, 1];
      console.log('CPU');
    }

    pointsModel.draw();

    polygonModel.polygonWireFrameModel.draw({
      uniforms: {color}
    });
  }

  onFinalize({pointsModel}) {
    if (pointsModel) {
      pointsModel.delete();
    }
  }

  getAltText() {
    return ALT_TEXT;
  }
}

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start({debug: true});
}
