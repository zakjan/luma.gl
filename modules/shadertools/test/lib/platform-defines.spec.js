// Copyright (c) 2015 - 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Special utility functions for df64 tests

import {Model} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test.only('shadertools#extension derivative', t => {
  const {gl} = fixture;

  // Avoid re-using program from ProgramManager
  const vs = 'void main() {gl_Position = vec4(0.0);}';
  const fs = `\
#if (__VERSION__ < 300)
#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable
#endif
void main() {
  gl_FragColor = vec4(0.0);
}`;

  const model = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  t.ok(model, 'Shaders with #extension derivative compiled fine');

  t.end();
});
