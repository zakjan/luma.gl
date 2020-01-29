/* global window */
import GL from '@luma.gl/constants';
import {Buffer, Framebuffer, clear, Texture2D} from '@luma.gl/webgl';
import {AnimationLoop, Model} from '@luma.gl/engine';
import {isWebGL2} from '@luma.gl/gltools';
import {Log} from 'probe.gl';
import {getRandomPolygon} from './utils';
import {GPUPointInPolygon, CPUPointInPolygon} from '@luma.gl/experimental';
import {BuildPolygonTexture} from '@luma.gl/experimental';

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
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main()
{
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const DRAW_FS = `\
#define ALPHA 0.9
precision highp float;
precision highp int;
varying vec2 v_texCoord;
uniform sampler2D polygonTexture;

void main()
{
    gl_FragColor = texture2D(polygonTexture, v_texCoord);
    gl_FragColor.a = 1.0;
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
    const textureBuilder = new BuildPolygonTexture(gl);
    const polygonModel = new Model(gl, {
      id: 'RenderPolygon',
      vs: DRAW_VS,
      fs: DRAW_FS,
      drawMode: gl.TRIANGLES,
      vertexCount: 6,
      attributes: {
        a_position: new Buffer(gl, new Float32Array([-1, -1,  1, -1,  1, 1,  1, 1,   -1, 1,  -1, -1])),
        a_texCoord: new Buffer(gl, new Float32Array([0, 0,    1, 0,   1, 1,  1, 1,    0, 1,   0, 0]))
      },
      debug: true
    });

    return {
      textureBuilder,
      polygonModel
    };
  }
  /* eslint-enable max-statements */

  onRender({
    gl,
    textureBuilder,
    polygonModel
  }) {
    clear(gl, {color: [0.25, 0.25, 0.25, 1]});
    const polygon = getRandomPolygon();


    const {polygonTexture} = textureBuilder.build({polygon});

    polygonModel.draw({
      uniforms: {polygonTexture}
    });
  }

  onFinalize({pointsModel}) {
    if (polygonModel) {
      polygonModel.delete();
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
