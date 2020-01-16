import GL from '@luma.gl/constants';
import {
  assert,
  cloneTextureFrom,
  readPixelsToArray,
  getShaderVersion,
  Buffer,
  Texture2D,
  Framebuffer
} from '@luma.gl/webgl';
import {
  _transform as transformModule,
  getPassthroughFS,
  typeToChannelCount,
  combineInjects
} from '@luma.gl/shadertools';
import {updateForTextures, getSizeUniforms} from './transform-shader-utils';
import Model from '../lib/model';

// TODO: move these constants to transform-shader-utils
// Texture parameters needed so sample can precisely pick pixel for given element id.
const SRC_TEX_PARAMETER_OVERRIDES = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
};
const FS_OUTPUT_VARIABLE = 'transform_output';

export default class TextureTransform {
  constructor(gl, props = {}) {
    this.gl = gl;
    this.currentIndex = 0;
    this._swapTexture = null;
    this.targetTextureVarying = null;
    this.targetTextureType = null;
    this.samplerTextureMap = null;
    this.bindings = []; // each element is an object : {sourceTextures, targetTexture, framebuffer}

    this.resources = {}; // resources to be deleted
    this.elementIDBuffer = null; // for Texture only

    this._initialize(props);
    Object.seal(this);
  }

  // updateModelProps(props = {}) {
  //   const updatedModelProps = this._processVertexShader(props);
  //   return Object.assign({}, props, updatedModelProps);
  // }

  run(opts = {}) {
    const {clearRenderTarget = true} = opts;
    const {sourceTextures, framebuffer, targetTexture, sourceBuffers} = this.bindings[
      this.currentIndex
    ];

    const attributes = Object.assign({}, sourceBuffers, opts.attributes);
    const uniforms = Object.assign({}, opts.uniforms);
    const parameters = Object.assign({}, opts.parameters);
    let discard = opts.discard;

    if (this.hasSourceTextures || this.hasTargetTexture) {
      attributes.transform_elementID = this.elementIDBuffer;

      for (const sampler in this.samplerTextureMap) {
        const textureName = this.samplerTextureMap[sampler];
        uniforms[sampler] = sourceTextures[textureName];
      }
      this._setSourceTextureParameters();
      // get texture size uniforms
      const sizeUniforms = getSizeUniforms({
        sourceTextureMap: sourceTextures,
        targetTextureVarying: this.targetTextureVarying,
        targetTexture
      });
      Object.assign(uniforms, sizeUniforms);
    }

    if (this.hasTargetTexture) {
      discard = false;
      parameters.viewport = [0, 0, framebuffer.width, framebuffer.height];
    }

    const updatedOpts = Object.assign({}, opts, {
      attributes,
      framebuffer,
      uniforms,
      discard,
      parameters
    });

    if (clearRenderTarget && updatedOpts.framebuffer) {
      updatedOpts.framebuffer.clear({color: true});
    }

    this.model.transform(updatedOpts);
  }

  swap() {
    if (this._swapTexture) {
      this.currentIndex = this._getNextIndex();
      return true;
    }
    return false;
  }

  // update source and/or target texture(s)
  update(opts = {}) {
    this._setupTextures(opts);
  }

  // returns current target texture
  getTargetTexture() {
    const {targetTexture} = this.bindings[this.currentIndex];
    return targetTexture;
  }

  getData({packed = false} = {}) {
    const {framebuffer} = this.bindings[this.currentIndex];
    const pixels = readPixelsToArray(framebuffer);

    if (!packed) {
      return pixels;
    }

    // readPixels returns 4 elements for each pixel, pack the elements when requested
    const ArrayType = pixels.constructor;
    const channelCount = typeToChannelCount(this.targetTextureType);
    const packedPixels = new ArrayType((pixels.length * channelCount) / 4);
    let packCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      for (let j = 0; j < channelCount; j++) {
        packedPixels[packCount++] = pixels[i + j];
      }
    }
    return packedPixels;
  }

  // returns current framebuffer object that is being used.
  getFramebuffer() {
    const currentResources = this.bindings[this.currentIndex];
    return currentResources.framebuffer;
  }

  // Delete owned resources.
  delete() {
    const {model, ownTexture, elementIDBuffer} = this;
    if (model) {
      model.delete();
    }
    if (ownTexture) {
      ownTexture.delete();
    }
    if (elementIDBuffer) {
      elementIDBuffer.delete();
    }
  }

  // Private

  _initialize(props = {}) {
    const {_targetTextureVarying, _swapTexture, _targetTexture} = props;

    // must be writting to a a target texture
    assert(_targetTextureVarying && _targetTexture);

    this._swapTexture = _swapTexture;
    this.targetTextureVarying = _targetTextureVarying;
    // TODO remove 'hasTargetTexture' make it implict
    this.hasTargetTexture = _targetTextureVarying;
    this._setupTextures(props);

    const updatedModelProps = this._processVertexShader(props);
    Object.assign(props, updatedModelProps);

    this.model = new Model(
      this.gl,
      Object.assign({}, props, {
        fs: props.fs || getPassthroughFS({version: getShaderVersion(props.vs)}),
        id: props.id || 'transform-model',
        drawMode: props.drawMode || GL.POINTS,
        vertexCount: props.elementCount
      })
    );
  }

  // auto create target texture if requested
  _createTargetTexture(props) {
    const {sourceTextures, textureOrReference} = props;
    if (textureOrReference instanceof Texture2D) {
      return textureOrReference;
    }
    // 'targetTexture' is a reference souce texture.
    const refTexture = sourceTextures[textureOrReference];
    if (!refTexture) {
      return null;
    }

    // save reference texture name, when corresponding source texture is updated
    // we also update target texture.
    this._targetRefTexName = textureOrReference;

    return this._createNewTexture(refTexture);
  }

  _setupTextures(props = {}) {
    const {_sourceTextures = {}, _targetTexture, sourceBuffers} = props;
    const targetTexture = this._createTargetTexture({
      sourceTextures: _sourceTextures,
      textureOrReference: _targetTexture
    });
    this.hasSourceTextures =
      this.hasSourceTextures || (_sourceTextures && Object.keys(_sourceTextures).length > 0);
    this._updateBindings({sourceTextures: _sourceTextures, targetTexture, sourceBuffers});
    if ('elementCount' in props) {
      this._updateElementIDBuffer(props.elementCount);
    }
  }

  _updateElementIDBuffer(elementCount) {
    if (typeof elementCount !== 'number' || this.elementCount >= elementCount) {
      return;
    }
    // NOTE: using float so this will work with GLSL 1.0 shaders.
    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });
    if (!this.elementIDBuffer) {
      this.elementIDBuffer = new Buffer(this.gl, {
        data: elementIds,
        accessor: {size: 1}
      });
    } else {
      this.elementIDBuffer.setData({data: elementIds});
    }
    this.elementCount = elementCount;
  }

  _updateBindings(opts) {
    this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], opts);
    if (this._swapTexture) {
      const textures = this._swapTextures(this.bindings[this.currentIndex]);
      const nextIndex = this._getNextIndex();
      this.bindings[nextIndex] = this._updateBinding(this.bindings[nextIndex], textures);
    }
  }

  _updateBinding(binding, opts) {
    const {sourceTextures, targetTexture, sourceBuffers} = opts;
    if (!binding) {
      binding = {
        sourceTextures: {},
        sourceBuffers: {},
        targetTexture: null
      };
    }
    Object.assign(binding.sourceTextures, sourceTextures);
    Object.assign(binding.sourceBuffers, sourceBuffers);
    if (targetTexture) {
      binding.targetTexture = targetTexture;

      const {width, height} = targetTexture;
      const {framebuffer} = binding;
      if (framebuffer) {
        // First update texture without re-sizing attachments
        framebuffer.update({
          attachments: {[GL.COLOR_ATTACHMENT0]: targetTexture},
          resizeAttachments: false
        });
        // Resize to new taget texture size
        framebuffer.resize({width, height});
      } else {
        binding.framebuffer = new Framebuffer(this.gl, {
          id: `${this.id || 'transform'}-framebuffer`,
          width,
          height,
          attachments: {
            [GL.COLOR_ATTACHMENT0]: targetTexture
          }
        });
      }
    }
    return binding;
  }

  // set texture filtering parameters on source textures.
  _setSourceTextureParameters() {
    const index = this.currentIndex;
    const {sourceTextures} = this.bindings[index];
    for (const name in sourceTextures) {
      sourceTextures[name].setParameters(SRC_TEX_PARAMETER_OVERRIDES);
    }
  }

  _swapTextures(opts) {
    if (!this._swapTexture) {
      return null;
    }
    const sourceTextures = Object.assign({}, opts.sourceTextures);
    sourceTextures[this._swapTexture] = opts.targetTexture;

    const targetTexture = opts.sourceTextures[this._swapTexture];

    return {sourceTextures, targetTexture, sourceBuffers: opts.sourceBuffers};
  }

  // Create a buffer and add to list of buffers to be deleted.
  _createNewTexture(refTexture) {
    const texture = cloneTextureFrom(refTexture, {
      parameters: {
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
      },
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });

    // thre can only be one target texture
    if (this.ownTexture) {
      this.ownTexture.delete();
    }
    this.ownTexture = texture;

    return texture;
  }

  _getNextIndex() {
    return (this.currentIndex + 1) % 2;
  }

  // build and return shader releated parameters
  _processVertexShader(props = {}) {
    const {sourceTextures, targetTexture} = this.bindings[this.currentIndex];
    const {vs, uniforms, targetTextureType, inject, samplerTextureMap} = updateForTextures({
      vs: props.vs,
      sourceTextureMap: sourceTextures,
      targetTextureVarying: this.targetTextureVarying,
      targetTexture
    });
    const combinedInject = combineInjects([props.inject || {}, inject]);
    this.targetTextureType = targetTextureType;
    this.samplerTextureMap = samplerTextureMap;
    const fs =
      props._fs ||
      getPassthroughFS({
        version: getShaderVersion(vs),
        input: this.targetTextureVarying,
        inputType: targetTextureType,
        output: FS_OUTPUT_VARIABLE
      });
    const modules =
      this.hasSourceTextures || this.targetTextureVarying
        ? [transformModule].concat(props.modules || [])
        : props.modules;
    return {vs, fs, modules, uniforms, inject: combinedInject};
  }
}
