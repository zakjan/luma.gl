/* global window */
import GL from '@luma.gl/constants';
import {Buffer, readPixelsToArray, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {picking} from '@luma.gl/shadertools';
import {AnimationLoop, Model, Transform} from '@luma.gl/engine';
import {cssToDevicePixels, isWebGL2} from '@luma.gl/gltools';
import {Log} from 'probe.gl';
import {getRandom} from '../../utils';
import {getPolygonTexture, dumpNonZeroValues, PolygonFilter} from './utils';
import {GPUPolygonClip, getRandomPolygon} from './utils';

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
    color = a_filterValueIndex.x > 0. ? vec4(0, 1., 0, 1.) : vec4(1., 0, 0, 1.);

    // hack
    // color = vec4(a_filterValueIndex.xy, 0.0, 1.0);

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
void main()
{
    gl_FragColor = vec4(vec3(1.0, 1., 0.) * ALPHA, ALPHA);
}
`;

const FILTER_VS = `\
#version 300 es
uniform vec4 boundingBox; //[xMin, xMax, yMin, yMax]
uniform vec2 size; // [width, height]
uniform sampler2D filterTexture;
in vec2 a_position;
out vec2 filterValueIndex; //[x: 0 (outside polygon)/1 (inside), y: position index]
void main()
{
    // [0, 0] -> [width, height]
    vec2 pos = a_position - boundingBox.xy;
    pos = pos / size;
    // pos = pos * 2.0 - vec2(1.0);
    filterValueIndex.y = float(gl_VertexID);
    if (pos.x < 0. || pos.x > 1. || pos.y < 0. || pos.y > 1.) {
      filterValueIndex.x = 0.;

      // HACK
      filterValueIndex.xy = vec2(0.);
    } else {
      // vec2 texCord = (pos.xy + vec2 (1.)) / 2.;  // TODO: fixed order of operations
      float filterFlag = texture(filterTexture, pos.xy).r;

      filterValueIndex.x =  filterFlag > 0. ? 1. : 0.;

      // HACK
      filterValueIndex.xy = pos;
    }


}
`;

const random = getRandom();

const NUM_INSTANCES = 10000; // 6; // 1000;  // TODO less than 6 doesn't render polygon
const log = new Log({id: 'transform'}).enable();

function getPositionData() {
  const positions = new Float32Array(NUM_INSTANCES * 2);
  for (let i = 0; i < NUM_INSTANCES; ++i) {
    positions[i * 2] = random() * 2.0 - 1.0;
    positions[i * 2 + 1] = random() * 2.0 - 1.0;
  }
  return positions;
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

    const polygonModel = new Model(gl, {
      id: 'RenderTriangles',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: gl.TRIANGLES,
      vertexCount: 6,
      debug: true
    });

    const polygonWireFrameModel = new Model(gl, {
      id: 'RenderTriangles',
      vs: POLY_VS,
      fs: POLY_FS,
      drawMode: gl.LINES,
      vertexCount: 12,
      debug: true
    });


    const filterTransform = new Transform(gl, {
      id: 'filter transform',
      vs: FILTER_VS,
      elementCount: NUM_INSTANCES,
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

    const pickingFramebuffer = new Framebuffer(gl, {width, height});

    return {
      positionBuffer,
      filterValueIndexBuffer,
      pointsModel,
      polygonModel,
      polygonWireFrameModel,
      pickingFramebuffer,
      filterTransform,
      // polygonFilter: new PolygonFilter(gl),
      gpuPolygonClip: new GPUPolygonClip(gl, {textureSize: 512}),
    };
  }
  /* eslint-enable max-statements */

  onRender({
    gl,
    width,
    height,
    pointsModel,
    polygonModel,
    polygonWireFrameModel,
    positionBuffer,
    filterValueIndexBuffer,
    // transform,
    useDevicePixels,
    time,
    pickingFramebuffer,
    filterTransform,
    polygonFilter,
    gpuPolygonClip
  }) {
    if (this.demoNotSupported) {
      return;
    }
    clear(gl, {color: [0.25, 0.25, 0.25, 1]});

    // const {polyPosBuffer, texture, boundingBox, size, polyWireFrameBuffer} = getPolygonTexture(gl);
    const useOffsets = false;
    const offsetX = useOffsets ? -0.25 : 0;
    const offsetY = useOffsets ? -0.25 : 0;
    // const {polyPosBuffer, texture, boundingBox, size, polyWireFrameBuffer} = polygonFilter.update(offsetX, offsetY);


    const POLYGON = [
      [-0.5, -0.5],  [0, -0.5], [0, 0.5], [-0.5, 0.5] // shows some precession issue
      // [-0.5, 0],  [0, -0.5], [0.3, 0], [0, 0.5], [-0.5, 0.5] // shows some points outside
      // [-0.5, 0],  [0, -0.5], [0, 0.5], [-0.5, 0.5] // shows some points outside
    ];

    // const {polyPosBuffer, texture, boundingBox, size, polyWireFrameBuffer, polygons} = polygonFilter.update(0, 0.00001, 0.00001);
    //
    // filterTransform.run({
    //   uniforms: {
    //     filterTexture: texture,
    //     boundingBox,
    //     size
    //   },
    // });


    // const polygon = POLYGON;
    const polygon = getRandomPolygon();


    gpuPolygonClip.update({polygon});
    gpuPolygonClip.run({positionBuffer, filterValueIndexBuffer, pointCount: NUM_INSTANCES});

    // const data = filterTransform.getData({varyingName: 'filterValueIndex'});
    // dumpNonZeroValues(data, 2, 'Filtered Data');


    pointsModel.draw();

    // polygonWireFrameModel.draw({
    //   attributes: {
    //     a_position: polyWireFrameBuffer
    //   }
    // });

    // gpuPolygonClip.polygonModel.draw();

    gpuPolygonClip.polygonWireFrameModel.draw();
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

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start({debug: true});
}
