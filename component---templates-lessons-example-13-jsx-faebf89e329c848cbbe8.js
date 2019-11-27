(window.webpackJsonp=window.webpackJsonp||[]).push([[32],{H6Xt:function(t,n,e){"use strict";e.d(n,"a",(function(){return i}));e("r1bV"),e("Y9lz"),e("91GP");var r=e("y5cw"),o=e("BunF");var i=function(t){var n,e;function r(n){void 0===n&&(n={});var e=n.id,r=void 0===e?Object(o.c)("sphere-geometry"):e,i=function(t){var n=t.nlat,e=void 0===n?10:n,r=t.nlong,o=void 0===r?10:r,i=t.radius,a=void 0===i?1:i,u=Math.PI-0,s=2*Math.PI-0,c=(e+1)*(o+1);if("number"==typeof a){var l=a;a=function(t,n,e,r,o){return l}}for(var v=new Float32Array(3*c),g=new Float32Array(3*c),p=new Float32Array(2*c),f=new Uint16Array(e*o*6),m=0;m<=e;m++)for(var h=0;h<=o;h++){var d=h/o,y=m/e,b=h+m*(o+1),w=2*b,x=3*b,M=s*d,C=u*y,P=Math.sin(M),O=Math.cos(M),T=Math.sin(C),L=Math.cos(C),_=O*T,A=L,U=P*T,F=a(_,A,U,d,y);v[x+0]=F*_,v[x+1]=F*A,v[x+2]=F*U,g[x+0]=_,g[x+1]=A,g[x+2]=U,p[w+0]=d,p[w+1]=1-y}for(var j=e+1,z=0;z<e;z++)for(var I=0;I<o;I++){var R=6*(z*o+I);f[R+0]=I*j+z,f[R+1]=I*j+z+1,f[R+2]=(I+1)*j+z,f[R+3]=(I+1)*j+z,f[R+4]=I*j+z+1,f[R+5]=(I+1)*j+z+1}return{indices:{size:1,value:f},attributes:{POSITION:{size:3,value:v},NORMAL:{size:3,value:g},TEXCOORD_0:{size:2,value:p}}}}(n),a=i.indices,u=i.attributes;return t.call(this,Object.assign({},n,{id:r,indices:a,attributes:Object.assign({},u,{},n.attributes)}))||this}return e=t,(n=r).prototype=Object.create(e.prototype),n.prototype.constructor=n,n.__proto__=e,r}(r.a)},X7Gk:function(t,n,e){"use strict";e.r(n);var r=e("q1tI"),o=e.n(r),i=e("z0FI"),a=e("73Rc"),u=e.n(a),s=e("5nIU"),c=e("2urO"),l=e("jpcM"),v=e("H6Xt"),g=e("l0Z1"),p=e("AbyB"),f=e("WUN0"),m=e("gmAo");var h="precision highp float;\nattribute vec3 positions;\nattribute vec3 normals;\nattribute vec2 texCoords;\n\nuniform mat4 uMMatrix;\nuniform mat4 uVMatrix;\nuniform mat4 uPMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vTransformedNormal;\nvarying vec4 vPosition;\n\nvoid main(void) {\n  vPosition = uMMatrix * vec4(positions, 1.0);\n  gl_Position = uPMatrix * uVMatrix * vPosition;\n  vTextureCoord = texCoords;\n  vTransformedNormal = uMMatrix * vec4(normals, 0.0);\n}\n",d="precision highp float;\n\nuniform vec3 uAmbientColor;\n\nuniform vec3 uPointLightingLocation;\nuniform vec3 uPointLightingColor;\n\nuniform bool uUseLighting;\nuniform bool uUseTextures;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vTransformedNormal;\nvarying vec4 vPosition;\n\nuniform sampler2D uSampler;\n\nvoid main(void) {\n  vec3 lightWeighting;\n\n  if (!uUseLighting) {\n    lightWeighting = vec3(1.0, 1.0, 1.0);\n  } else {\n    vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);\n    float pointLightWeighting = max(dot(vTransformedNormal.xyz, lightDirection), 0.0);\n    lightWeighting = uAmbientColor + uPointLightingColor * pointLightWeighting;\n  }\n\n  vec4 fragmentColor;\n  if (uUseTextures) {\n    fragmentColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, 1.0 - vTextureCoord.t));\n  } else {\n    fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);\n  }\n  gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);\n}\n",y={moonRotationMatrix:(new f.a).rotateY(Object(m.e)(180)).translate([2,0,0]),cubeRotationMatrix:(new f.a).translate([1.25,0,0]),lastTime:0},b=function(t){var n,e;function r(){return t.apply(this,arguments)||this}e=t,(n=r).prototype=Object.create(e.prototype),n.prototype.constructor=n,n.__proto__=e,r.getInfo=function(){return'\n<p>\n  <a href="http://learningwebgl.com/blog/?p=1523" target="_blank">\n  Per-fragment lighting and multiple programs\n  </a>\n<p>\n  The classic WebGL Lessons in luma.gl\n'};var o=r.prototype;return o.onInitialize=function(t){t.canvas;var n=t.gl;Object(s.a)(n,{clearColor:[0,0,0,1],clearDepth:1,depthTest:!0});var e=new c.a(n,"moon.gif"),r=new c.a(n,"crate.gif");return{moon:new l.a(n,{fs:d,vs:h,geometry:new v.a({nlat:30,nlong:30,radius:2}),uniforms:{uSampler:e}}),cube:new l.a(n,{fs:d,vs:h,geometry:new g.a,uniforms:{uSampler:r}})}},o.onRender=function(t){var n=t.gl,e=(t.tick,t.aspect),r=t.moon,o=t.cube;n.clear(u.a.COLOR_BUFFER_BIT|u.a.DEPTH_BUFFER_BIT);var i=(new f.a).rotateX(Object(m.e)(-30)).transform([0,0,10]),a=(new f.a).lookAt({eye:i,center:[0,0,0],up:[0,1,0]}),s=[.1,.1,.1],c=[4,4,4],l=[1,.8,.8];r.setUniforms({uUseLighting:!0,uUseTextures:!0}),o.setUniforms({uUseLighting:!0,uUseTextures:!0}),r.setUniforms({uAmbientColor:s,uPointLightingLocation:c,uPointLightingColor:l}),o.setUniforms({uAmbientColor:s,uPointLightingLocation:c,uPointLightingColor:l}),r.setUniforms({uMMatrix:y.moonRotationMatrix,uVMatrix:a,uPMatrix:(new f.a).perspective({fov:45*Math.PI/180,aspect:e,near:.1,far:100})}).draw(),o.setUniforms({uMMatrix:y.cubeRotationMatrix,uVMatrix:a,uPMatrix:(new f.a).perspective({fov:45*Math.PI/180,aspect:e,near:.1,far:100})}).draw(),function(t){var n=(new Date).getTime();if(0!==t.lastTime){var e=n-t.lastTime,r=(new f.a).rotateY(Object(m.e)(e/20));t.moonRotationMatrix.multiplyLeft(r),t.cubeRotationMatrix.multiplyLeft(r)}t.lastTime=n}(y)},r}(p.a);"undefined"==typeof window||window.website||(new b).start();e.d(n,"default",(function(){return w}));var w=function(t){var n,e;function r(){return t.apply(this,arguments)||this}return e=t,(n=r).prototype=Object.create(e.prototype),n.prototype.constructor=n,n.__proto__=e,r.prototype.render=function(){return o.a.createElement(i.a,{AnimationLoop:b,exampleConfig:this.props.pageContext.exampleConfig})},r}(o.a.Component)},l0Z1:function(t,n,e){"use strict";e.d(n,"a",(function(){return l}));e("91GP"),e("Y9lz"),e("r1bV");var r=e("y5cw"),o=e("BunF");var i=new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]),a=new Float32Array([-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1]),u=new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0]),s=new Float32Array([0,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1]),c={POSITION:{size:3,value:new Float32Array(a)},NORMAL:{size:3,value:new Float32Array(u)},TEXCOORD_0:{size:2,value:new Float32Array(s)}},l=function(t){var n,e;function r(n){void 0===n&&(n={});var e=n.id,r=void 0===e?Object(o.c)("cube-geometry"):e;return t.call(this,Object.assign({},n,{id:r,indices:{size:1,value:new Uint16Array(i)},attributes:Object.assign({},c,{},n.attributes)}))||this}return e=t,(n=r).prototype=Object.create(e.prototype),n.prototype.constructor=n,n.__proto__=e,r}(r.a)}}]);
//# sourceMappingURL=component---templates-lessons-example-13-jsx-faebf89e329c848cbbe8.js.map