(window.webpackJsonp=window.webpackJsonp||[]).push([[18],{IjVt:function(o,n,t){"use strict";t.r(n);var e=t("q1tI"),r=t.n(e),i=t("z0FI"),a=(t("Y9lz"),t("3dIF")),s=t("nZ9s"),c=t("3LCa"),p=t("jpcM"),l=t("AbyB");var u="THIS DEMO REQUIRES WEBLG2, BUT YOUR BROWSER DOESN'T SUPPORT IT",v=Float32Array.BYTES_PER_ELEMENT,d=["gl_Position","v_color"],f=[-1,-1,0,1,1,-1,0,1,1,1,0,1,1,1,0,1,-1,1,0,1,-1,-1,0,1],_=function(o){var n,t;function e(n){var t;return void 0===n&&(n={}),(t=o.call(this,n)||this).isDemoSupported=!0,t}t=o,(n=e).prototype=Object.create(t.prototype),n.prototype.constructor=n,n.__proto__=t,e.getInfo=function(){return"\n<p>\nGradient calculated on the GPU using <code>Transform Feedback</code>.\n</p>\n"};var r=e.prototype;return r.onInitialize=function(o){o.canvas;var n,t,e=o.gl;if(this.isDemoSupported=Object(a.d)(e),!this.isDemoSupported)return s.a.error(u)(),{};var r=f.length*v,i={vertex:new c.a(e,{data:new Float32Array(f)}),position:new c.a(e,{byteLength:r,usage:e.STATIC_COPY,accessor:{type:e.FLOAT}}),color:new c.a(e,{byteLength:r,usage:e.STATIC_COPY,accessor:{type:e.FLOAT}})};return{transformModel:new p.a(e,{vs:"#version 300 es\nlayout(location = 0) in vec4 position;\n\nout vec4 v_color;\n\nvoid main() {\n  gl_Position = position;\n  v_color = vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0);\n}\n",fs:"#version 300 es\nprecision highp float;\nvoid main() {}\n",varyings:d,drawMode:e.TRIANGLES,vertexCount:6,attributes:(n={},n[0]=i.vertex,n),_feedbackBuffers:{gl_Position:i.position,v_color:i.color}}),renderModel:new p.a(e,{vs:"#version 300 es\nlayout(location = 0) in vec4 position;\nlayout(location = 1) in vec4 color;\n\nout vec4 v_color;\n\nvoid main() {\n  gl_Position = position;\n  v_color = color;\n}\n",fs:"#version 300 es\nprecision highp float;\n\nin vec4 v_color;\nout vec4 fragColor;\n\nvoid main() {\n  fragColor = v_color;\n}\n",drawMode:e.TRIANGLES,vertexCount:6,attributes:(t={},t[0]=i.position,t[1]=i.color,t)})}},r.onRender=function(o){o.gl,o.time;var n=o.renderModel,t=o.transformModel;this.isDemoSupported&&(t.transform({unbindModels:[n]}),n.clear({color:[0,0,0,1]}),n.draw())},r.isSupported=function(){return this.isDemoSupported},r.getAltText=function(){return u},e}(l.a);"undefined"==typeof window||window.website||(new _).start();t.d(n,"default",(function(){return g}));var g=function(o){var n,t;function e(){return o.apply(this,arguments)||this}return t=o,(n=e).prototype=Object.create(t.prototype),n.prototype.constructor=n,n.__proto__=t,e.prototype.render=function(){return r.a.createElement(i.a,{AnimationLoop:_,exampleConfig:this.props.pageContext.exampleConfig})},e}(r.a.Component)}}]);
//# sourceMappingURL=component---templates-core-example-transform-feedback-jsx-0b9eccf581c03bba3d14.js.map