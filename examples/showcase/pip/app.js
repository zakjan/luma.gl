/* global window */
import GL from '@luma.gl/constants';
import {Buffer, readPixelsToArray, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {picking} from '@luma.gl/shadertools';
import {AnimationLoop, Model, Transform} from '@luma.gl/engine';
import {cssToDevicePixels, isWebGL2} from '@luma.gl/gltools';
import {Log} from 'probe.gl';
import {getRandom} from '../../utils';
import {getPolygonTexture, dumpNonZeroValues} from './utils';

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
attribute vec2 a_filterValueIndex;
varying vec4 color;
void main()
{

    gl_Position = vec4(a_position, 0.0, 1.0);
    // color = a_filterValueIndex.x > 0. ? vec4(0, 1., 0, 1.) : vec4(1., 0, 0, 1.);
    if (a_filterValueIndex.x == 0.) {
      color = vec4(1., 0, 0, 1.);
    } else if (a_filterValueIndex.x == 0.5){
      color = vec4(1., 1., 0, 1.);
    } else if (a_filterValueIndex.x == 1.){
      color = vec4(0., 1., 0, 1.);
    } else {
      color = vec4(1., 1., 1., 1.);
    }

    gl_PointSize = 25.;
}
`;

const DRAW_FS = `\
#define ALPHA 0.9
precision highp float;
precision highp int;
varying vec4 color;
void main()
{
    // gl_FragColor = vec4(vec3(1.0, 0., 1.) * ALPHA, ALPHA);
    gl_FragColor = color;
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
#define ALPHA 0.9
precision highp float;
precision highp int;
void main()
{
    gl_FragColor = vec4(vec3(1.0, 0., 1.) * ALPHA, ALPHA);
}
`;

const FILTER_VS = `\
#version 300 es
uniform vec4 boundingBox; //[xMin, xMax, yMin, yMax]
uniform vec2 size; // [width, height]
uniform sampler2D filterTexture;
in vec2 a_position;
out vec2 filterValueIndex; //[x: 0 (outside polygon)/1 (inside), y: index]
void main()
{
    // [0, 0] -> [width, height]
    vec2 pos = a_position - boundingBox.xy;
    pos = pos / size;
    pos = pos * 2.0 - vec2(1.0);
    filterValueIndex.y = float(gl_VertexID); // transform_elementID;
    if (pos.x < -1. || pos.x > 1. || pos.y < -1. || pos.y > 1.) {
      filterValueIndex.x = 0.;
    } else {
      vec2 texCord = (pos.xy + vec2 (1.)) / 2.;  // TODO: fixed order of operations
      // texCord = texCord + vec2 (0.0009765625); // 1 /(2 * texSize)
      // texCord.y = 1.0 - texCord.y;
      float filterFlag = texture(filterTexture, texCord.xy).r;

      filterValueIndex.x =  filterFlag > 0. ? 1. : 0.5;
      // filterValueIndex.x =  filterFlag == 255. ? 1. : 0.5;
      // HACK
      filterValueIndex.y = filterFlag;
    }

    // verify postion values
    // filterValueIndex = a_position;  => all good

    // filterValueIndex = size;  => (1, 1) good

    // filterValueIndex = boundingBox.xy;  => -0.5, -0.5 => good

    // filterValueIndex = a_position - boundingBox.xy; => in 0 to 1 range good

    // filterValueIndex = a_position - boundingBox.xy;
    // filterValueIndex =  filterValueIndex / size; => 0 to 1 range good

    // filterValueIndex = a_position - boundingBox.xy;
    // filterValueIndex =  filterValueIndex / size;
    // filterValueIndex = filterValueIndex * 2.0 - vec2(1.0);


    // HACK
    // gl_Position = vec4(0., 0., 0., 1.);
}
`;

const random = getRandom();

const NUM_INSTANCES = 1000; // 6; // 1000;  // TODO less than 6 doesn't render polygon
const log = new Log({id: 'transform'}).enable();

// TODO PIKCING TEMPORARILY DISABLED
let pickPosition = [0, 0];

function mousemove(e) {
  pickPosition = [e.offsetX, e.offsetY];
}

function mouseleave(e) {
  pickPosition = null;
}

function getPositionData() {
  const positions = new Float32Array(NUM_INSTANCES * 2);
  for (let i = 0; i < NUM_INSTANCES; ++i) {
    positions[i * 2] = random() * 2.0 - 1.0;
    positions[i * 2 + 1] = random() * 2.0 - 1.0;
  }
  return positions;

  // return new Float32Array([
  //   // origin bottom left
  //   0, 0,
  //   -0.45, -0.15, // left
  //   -0.25, 0.5, // left top
  //
  //   0.15, -0.22, // mid bottom
  //
  //   0.4, 0.24, // right top
  //   0.4, -0.14, // right bottom
  // ]);
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
    const positions = getPositionData();

    const positionBuffer = new Buffer(gl, positions);

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

    const {polyPosBuffer, texture, boundingBox, size} = getPolygonTexture(gl);


    const polygonModel = new Model(gl, {
      id: 'RenderTriangles',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: GL.LINE_STRIP, // GL.LINE_LOOP, // gl.TRIANGLES,
      vertexCount: 6,
      attributes: {
        a_position: polyPosBuffer
      },
      debug: true
    });


    const filterTransform = new Transform(gl, {
      id: 'filter transform',
      vs: FILTER_VS,
      elementCount: NUM_INSTANCES,
      uniforms: {
        filterTexture: texture,
        boundingBox,
        size
      },
      sourceBuffers: {
        a_position: positionBuffer
      },
      feedbackBuffers: {
        filterValueIndex: filterValueIndexBuffer
      },
      varyings: ['filterValueIndex'],
      debug: true
      // TODO provide feedback buffer and varyings instead of feedbackMap
    });

    filterTransform.run();
    const data = filterTransform.getData({varyingName: 'filterValueIndex'});
    dumpNonZeroValues(data, 2, 'Filtered Data');

    const pickingFramebuffer = new Framebuffer(gl, {width, height});

    return {
      positionBuffer,
      pointsModel,
      polygonModel,
      pickingFramebuffer,
      filterTransform
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
