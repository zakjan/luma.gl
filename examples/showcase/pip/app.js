/* global window */
import GL from '@luma.gl/constants';
import {Buffer, readPixelsToArray, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {picking} from '@luma.gl/shadertools';
import {AnimationLoop, Model, Transform} from '@luma.gl/engine';
import {cssToDevicePixels, isWebGL2} from '@luma.gl/gltools';
import {Log} from 'probe.gl';
import {getRandom} from '../../utils';
import {getPolygonTexture} from './utils';

const RED = new Uint8Array([255, 0, 0, 255]);

/* eslint-disable max-len */
const INFO_HTML = `
<p>
  GPU Accelertaed Polygon Clipping
`;
/* eslint-enable max-len */

// Text to be displayed on environments when this demos is not supported.
const ALT_TEXT = "THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN'T SUPPORT IT";

const DRAW_VS = `\
precision highp float;
precision highp int;
attribute vec2 a_position;
void main()
{

    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 5.;
}
`;

const DRAW_FS = `\
#define ALPHA 0.9
precision highp float;
precision highp int;
void main()
{
    gl_FragColor = vec4(vec3(1.0, 0., 1.) * ALPHA, ALPHA);
}
`;

const random = getRandom();

const NUM_INSTANCES = 1000;
const log = new Log({id: 'transform'}).enable();

// TODO PIKCING TEMPORARILY DISABLED
let pickPosition = [0, 0];

function mousemove(e) {
  pickPosition = [e.offsetX, e.offsetY];
}

function mouseleave(e) {
  pickPosition = null;
}

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
    gl.canvas.addEventListener('mousemove', mousemove);
    gl.canvas.addEventListener('mouseleave', mouseleave);

    // -- Initialize data
    const positions = new Float32Array(NUM_INSTANCES * 2);

    for (let i = 0; i < NUM_INSTANCES; ++i) {
      positions[i * 2] = random() * 2.0 - 1.0;
      positions[i * 2 + 1] = random() * 2.0 - 1.0;
    }

    const positionBuffer = new Buffer(gl, positions);

    const pointsModel = new Model(gl, {
      id: 'RenderPoints',
      vs: DRAW_VS,
      fs: DRAW_FS,
      drawMode: gl.POINTS,
      vertexCount: NUM_INSTANCES,
      attributes: {
        a_position: positionBuffer
      },
      debug: true
    });

    const {polyPosBuffer} = getPolygonTexture(gl);


    const polygonModel = new Model(gl, {
      id: 'RenderTriangles',
      vs: DRAW_VS,
      fs: DRAW_FS,
      drawMode: gl.TRIANGLES,
      vertexCount: 6,
      attributes: {
        a_position: polyPosBuffer
      },
      debug: true
    });


    // const transform = new Transform(gl, {
    //   vs: EMIT_VS,
    //   elementCount: NUM_INSTANCES,
    //   sourceBuffers: {
    //     a_offset: offsetBuffer,
    //     a_rotation: rotationBuffer
    //   },
    //   feedbackMap: {
    //     a_offset: 'v_offset',
    //     a_rotation: 'v_rotation'
    //   }
    // });

    const pickingFramebuffer = new Framebuffer(gl, {width, height});

    return {
      positionBuffer,
      pointsModel,
      polygonModel,
      pickingFramebuffer
    };
  }
  /* eslint-enable max-statements */

  onRender({
    gl,
    width,
    height,
    pointsModel,
    polygonModel,
    positionBuffer,
    // transform,
    useDevicePixels,
    time,
    pickingFramebuffer
  }) {
    if (this.demoNotSupported) {
      return;
    }
    clear(gl, {color: [0, 0, 0, 1]});
    // pointsModel.clear({color: [0.0, 0.0, 0.0, 1.0], depth: true});
    pointsModel.draw();
    // polygonModel.clear({color: [0.0, 0.0, 0.0, 1.0], depth: true});
    polygonModel.draw();

    // offsetBuffer.setAccessor({divisor: 0});
    // rotationBuffer.setAccessor({divisor: 0});

    // if (pickPosition) {
    //   // use the center pixel location in device pixel range
    //   const devicePixels = cssToDevicePixels(gl, pickPosition);
    //   const deviceX = devicePixels.x + Math.floor(devicePixels.width / 2);
    //   const deviceY = devicePixels.y + Math.floor(devicePixels.height / 2);
    //
    //   pickingFramebuffer.resize({width, height});
    //
    //   pickInstance(gl, deviceX, deviceY, renderModel, pickingFramebuffer);
    // }
  }

  onFinalize({pointsModel, transform, polygonModel}) {
    if (pointsModel) {
      pointsModel.delete();
    }
    if (polygonModel) {
      polygonModel.delete();
    }
    if (transform) {
      transform.delete();
    }
  }

  getAltText() {
    return ALT_TEXT;
  }
}

function pickInstance(gl, pickX, pickY, model, framebuffer) {
  framebuffer.clear({color: true, depth: true});
  // Render picking colors
  /* eslint-disable camelcase */
  model.setUniforms({picking_uActive: 1});
  model.draw({framebuffer});
  model.setUniforms({picking_uActive: 0});

  const color = readPixelsToArray(framebuffer, {
    sourceX: pickX,
    sourceY: pickY,
    sourceWidth: 1,
    sourceHeight: 1,
    sourceFormat: gl.RGBA,
    sourceType: gl.UNSIGNED_BYTE
  });

  if (color[0] + color[1] + color[2] > 0) {
    model.updateModuleSettings({
      pickingSelectedColor: color,
      pickingHighlightColor: RED
    });
  } else {
    model.updateModuleSettings({
      pickingSelectedColor: null
    });
  }
}

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
