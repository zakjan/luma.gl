import '@loaders.gl/polyfills';
import {Texture2D, TextureCube} from '@luma.gl/core';
import {loadGLTFScenegraph, IBLEnvironment} from '@luma.gl/addons';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('loadGLTFScenegraph#load from url', async t => {
  const {gl} = fixture;

  const result = await loadGLTFScenegraph('test/data/box.glb', {gl})

  t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
  t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');

  t.end();
});

test('IBLEnvironment#constructor', t => {
  const {gl} = fixture;

  const environment = new IBLEnvironment(gl, {
    brdfLutUrl: 'test/data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });

  t.ok(environment.getBrdfTexture() instanceof Texture2D, 'BRDF lookup texture created');
  t.ok(
    environment.getDiffuseEnvSampler() instanceof TextureCube,
    'Diffuse environment map created'
  );
  t.ok(
    environment.getSpecularEnvSampler() instanceof TextureCube,
    'Specular environment map created'
  );

  t.end();
});
