
import GL from '@luma.gl/constants';
import {Buffer, Framebuffer, Texture2D, assert} from '@luma.gl/webgl';
import {Model, Transform} from '@luma.gl/engine';
import {default as textureFilterModule} from './texture-filter';
import {default as BuildPolygonTexture} from './build-polygon-texture';
const TEXTURE_SIZE = 512;
import * as Polygon from './polygon';

const FILTER_VS = `\
#version 300 es
in vec2 a_position;
out vec2 filterValueIndex; //[x: 0 (outside polygon)/1 (inside), y: position index]
void main()
{
  filterValueIndex = textureFilter_filter(a_position);
}
`;

export default class GPUPolygonClip {
  constructor(gl, {textureSize = TEXTURE_SIZE, polygon} = {}) {
    this.gl = gl;

    this.filterTransform = new Transform(gl, {
      id: 'filter transform',
      vs: FILTER_VS,
      modules: [textureFilterModule],
      varyings: ['filterValueIndex'],
      debug: true
    });

    this.buidPolygonTexture = new BuildPolygonTexture(gl, {textureSize});


    // clamp to system max texure-size
    if (polygon) {
      this.update({polygon});
    }
  }

  update({polygon, size = 2, vertexCount, polygons} = {}) {

    this.buidPolygonTexture.build({polygon, vertexCount, polygons});

  }

  run({positionBuffer, filterValueIndexBuffer, pointCount}) {
    this.filterTransform.update({
      sourceBuffers: {
        a_position: positionBuffer
      },
      feedbackBuffers: {
        filterValueIndex: filterValueIndexBuffer
      },
      elementCount: pointCount
    });
    const {polygonTexture, boundingBox, bbSize} = this.buidPolygonTexture;
    const [xMin, yMin, xMax, yMax] = boundingBox;

    this.filterTransform.run({
      // uniforms: {
      //   textureFilter_texture: polygonTexture,
      //   textureFilter_bbOriginSize: [xMin, yMin, xMax - xMin, yMax - yMin]
      // }
      moduleSettings: {boundingBox, texture: polygonTexture}
    });
  }
}
