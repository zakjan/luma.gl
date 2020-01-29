/* global window */
import GL from '@luma.gl/constants';
import {Buffer, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {AnimationLoop, Model} from '@luma.gl/engine';
import {isWebGL2} from '@luma.gl/gltools';
import {Log} from 'probe.gl';
import {getRandomPoints, getRandomPolygon} from './utils';
import {CPUPointInPolygon} from '@luma.gl/experimental';
import {GPUPointInPolygonNew as GPUPointInPolygon} from '@luma.gl/experimental';

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
precision highp float;
precision highp int;
attribute vec2 a_position;
attribute vec2 a_filterValueIndex;
varying vec4 color;
void main()
{

    gl_Position = vec4(a_position, 0.0, 1.0);
    color = a_filterValueIndex.x > 0. ? vec4(0, 1., 0, 1.) : vec4(1., 0, 0, 1.);

    gl_PointSize = 10.;
}
`;

const DRAW_FS = `\
#define ALPHA 0.9
precision highp float;
precision highp int;
varying vec4 color;
void main()
{
    gl_FragColor = color;
}
`;

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
    const {flatArray, pointsArray} = getRandomPoints(NUM_INSTANCES);

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
      debug: true
    });

    return {
      pointsArray,
      positionBuffer,
      filterValueIndexBuffer,
      pointsModel,
      gpuPolygonClip: new GPUPointInPolygon(gl, {textureSize: 512}),
      cpuPointInPolygon: new CPUPointInPolygon()
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
    tick
  }) {
    if (this.demoNotSupported) {
      return;
    }
    clear(gl, {color: [0.25, 0.25, 0.25, 1]});

    const polygon = getRandomPolygon();

    let color;
    if (tick % 20 < 5) {
      gpuPolygonClip.update({polygon});
      gpuPolygonClip.run({positionBuffer, filterValueIndexBuffer, pointCount: NUM_INSTANCES});
      color = [1, 1, 0, 1];
    } else {
      cpuPointInPolygon.update({polygon});
      const {filterValueIndexArray} = cpuPointInPolygon.run({points: pointsArray});
      filterValueIndexBuffer.setData(filterValueIndexArray);
      color = [0, 1, 1, 1];
    }

    pointsModel.draw();

    gpuPolygonClip.polygonWireFrameModel.draw({
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
