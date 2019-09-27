import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {assert} from '@luma.gl/core';
import GLTFInstantiator from './helpers/gltf-instantiator';

export default async function loadGLTFScenegraph(urlOrData, options) {
  assert(options.gl);

  // If loading from a URL, provide as base URI
  const uri = typeof urlOrData === 'string' ? urlOrData : '';

  const gltf = await load(urlOrData, GLTFLoader, {
    ...options,
    uri, // If loading from a URL, provide as base URI
    gltf: {
      // By default, parser version 2 loads all linked assets,
      // including images, as part of the load promise
      parserVersion: 2
    }
  });

  const instantiator = new GLTFInstantiator(options.gl, options);

  const scenes = instantiator.instantiate(gltf);
  const animator = instantiator.createAnimator();

  return {scenes, animator};
}
