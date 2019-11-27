(window.webpackJsonp=window.webpackJsonp||[]).push([[31],{H6Xt:function(t,e,n){"use strict";n.d(e,"a",(function(){return o}));n("r1bV"),n("Y9lz"),n("91GP");var i=n("y5cw"),r=n("BunF");var o=function(t){var e,n;function i(e){void 0===e&&(e={});var n=e.id,i=void 0===n?Object(r.c)("sphere-geometry"):n,o=function(t){var e=t.nlat,n=void 0===e?10:e,i=t.nlong,r=void 0===i?10:i,o=t.radius,a=void 0===o?1:o,u=Math.PI-0,s=2*Math.PI-0,c=(n+1)*(r+1);if("number"==typeof a){var h=a;a=function(t,e,n,i,r){return h}}for(var l=new Float32Array(3*c),v=new Float32Array(3*c),f=new Float32Array(2*c),g=new Uint16Array(n*r*6),y=0;y<=n;y++)for(var p=0;p<=r;p++){var d=p/r,m=y/n,b=p+y*(r+1),k=2*b,O=3*b,w=s*d,M=u*m,j=Math.sin(w),x=Math.cos(w),L=Math.sin(M),E=Math.cos(M),P=x*L,T=E,C=j*L,A=a(P,T,C,d,m);l[O+0]=A*P,l[O+1]=A*T,l[O+2]=A*C,v[O+0]=P,v[O+1]=T,v[O+2]=C,f[k+0]=d,f[k+1]=1-m}for(var S=n+1,F=0;F<n;F++)for(var _=0;_<r;_++){var z=6*(F*r+_);g[z+0]=_*S+F,g[z+1]=_*S+F+1,g[z+2]=(_+1)*S+F,g[z+3]=(_+1)*S+F,g[z+4]=_*S+F+1,g[z+5]=(_+1)*S+F+1}return{indices:{size:1,value:g},attributes:{POSITION:{size:3,value:l},NORMAL:{size:3,value:v},TEXCOORD_0:{size:2,value:f}}}}(e),a=o.indices,u=o.attributes;return t.call(this,Object.assign({},e,{id:i,indices:a,attributes:Object.assign({},u,{},e.attributes)}))||this}return n=t,(e=i).prototype=Object.create(n.prototype),e.prototype.constructor=e,e.__proto__=n,i}(i.a)},ILr5:function(t,e,n){"use strict";n.r(e);var i=n("q1tI"),r=n.n(i),o=n("z0FI"),a=n("73Rc"),u=n.n(a),s=n("5nIU"),c=n("jpcM"),h=n("H6Xt"),l=n("2urO"),v=n("l0Z1"),f=n("AbyB"),g=n("WUN0"),y=n("gmAo"),p=n("rhVh");var d="attribute vec3 positions;\nattribute vec3 normals;\nattribute vec2 texCoords;\n\nuniform mat4 uMMatrix;\nuniform mat4 uVMatrix;\nuniform mat4 uPMatrix;\n\nuniform vec3 uAmbientColor;\n\nuniform vec3 uPointLightingLocation;\nuniform vec3 uPointLightingColor;\n\nuniform bool uUseLighting;\n\nvarying vec2 vTextureCoord;\nvarying vec3 vLightWeighting;\n\nvoid main(void) {\n    vec4 mPosition = uMMatrix * vec4(positions, 1.0);\n    gl_Position = uPMatrix * uVMatrix * mPosition;\n    vTextureCoord = texCoords;\n\n    if (!uUseLighting) {\n        vLightWeighting = vec3(1.0, 1.0, 1.0);\n    } else {\n        vec3 lightDirection = normalize(uPointLightingLocation - mPosition.xyz);\n        vec4 transformedNormal = uMMatrix * vec4(normals, 0.0);\n        float pointLightWeighting = max(dot(transformedNormal.xyz, lightDirection), 0.0);\n        vLightWeighting = uAmbientColor + uPointLightingColor * pointLightWeighting;\n    }\n}\n",m="precision highp float;\n\nvarying vec2 vTextureCoord;\nvarying vec3 vLightWeighting;\n\nuniform sampler2D uSampler;\n\nvoid main(void) {\n  vec4 textureColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, 1.0 - vTextureCoord.t));\n  gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n}\n",b={moonRotationMatrix:(new g.a).rotateY(Object(y.e)(180)).translate([5,0,0]),cubeRotationMatrix:(new g.a).translate([5,0,0]),lastTime:0};var k=function(t){var e,n;function i(){return t.apply(this,arguments)||this}n=t,(e=i).prototype=Object.create(n.prototype),e.prototype.constructor=e,e.__proto__=n,i.getInfo=function(){return'\n<p>\n  <a href="http://learningwebgl.com/blog/?p=1359" target="_blank">\n  Point lighting\n  </a>\n<p>\n  The classic WebGL Lessons in luma.gl\n'};var r=i.prototype;return r.onInitialize=function(t){t.canvas;var e=t.gl;return Object(s.a)(e,{clearColor:[0,0,0,1],clearDepth:1,depthTest:!0}),{moon:new c.a(e,{geometry:new h.a({nlat:30,nlong:30,radius:2}),fs:m,vs:d,uniforms:{uSampler:new l.a(e,"moon.gif")}}),cube:new c.a(e,{geometry:new v.a,vs:d,fs:m,uniforms:{uSampler:new l.a(e,"crate.gif")}})}},r.onRender=function(t){var e=t.gl,n=(t.tick,t.aspect),i=t.moon,r=t.cube;e.clear(u.a.COLOR_BUFFER_BIT|u.a.DEPTH_BUFFER_BIT);var o=(new g.a).lookAt({eye:[0,0,20],center:[0,0,0],up:[0,1,0]});function a(t,e){var n=document.getElementById(t);return n?n.value:e}var s=document.getElementById("lighting"),c=!s||s.checked;if(i.setUniforms({uUseLighting:c}),r.setUniforms({uUseLighting:c}),c){var h=new p.a(parseFloat(a("ambientR",.2)),parseFloat(a("ambientG",.2)),parseFloat(a("ambientB",.2))),l=new p.a(parseFloat(a("lightPositionX",0)),parseFloat(a("lightPositionY",0)),parseFloat(a("lightPositionZ",0))),v=new p.a(parseFloat(a("pointR",.8)),parseFloat(a("pointG",.8)),parseFloat(a("pointB",.8)));i.setUniforms({uAmbientColor:h,uPointLightingLocation:l,uPointLightingColor:v}),r.setUniforms({uAmbientColor:h,uPointLightingLocation:l,uPointLightingColor:v})}i.setUniforms({uMMatrix:b.moonRotationMatrix,uVMatrix:o,uPMatrix:(new g.a).perspective({fov:45*Math.PI/180,aspect:n,near:.1,far:100})}).draw(),r.setUniforms({uMMatrix:b.cubeRotationMatrix,uVMatrix:o,uPMatrix:(new g.a).perspective({fov:45*Math.PI/180,aspect:n,near:.1,far:100})}).draw(),function(){var t=Date.now();if(0!==b.lastTime){var e=t-b.lastTime,n=(new g.a).rotateY(Object(y.e)(e/20));b.moonRotationMatrix.multiplyLeft(n),b.cubeRotationMatrix.multiplyLeft(n)}b.lastTime=t}()},i}(f.a);"undefined"==typeof window||window.website||(new k).start();n.d(e,"default",(function(){return O}));var O=function(t){var e,n;function i(){return t.apply(this,arguments)||this}return n=t,(e=i).prototype=Object.create(n.prototype),e.prototype.constructor=e,e.__proto__=n,i.prototype.render=function(){return r.a.createElement(o.a,{AnimationLoop:k,exampleConfig:this.props.pageContext.exampleConfig})},i}(r.a.Component)},l0Z1:function(t,e,n){"use strict";n.d(e,"a",(function(){return h}));n("91GP"),n("Y9lz"),n("r1bV");var i=n("y5cw"),r=n("BunF");var o=new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]),a=new Float32Array([-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1]),u=new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0]),s=new Float32Array([0,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1]),c={POSITION:{size:3,value:new Float32Array(a)},NORMAL:{size:3,value:new Float32Array(u)},TEXCOORD_0:{size:2,value:new Float32Array(s)}},h=function(t){var e,n;function i(e){void 0===e&&(e={});var n=e.id,i=void 0===n?Object(r.c)("cube-geometry"):n;return t.call(this,Object.assign({},e,{id:i,indices:{size:1,value:new Uint16Array(o)},attributes:Object.assign({},c,{},e.attributes)}))||this}return n=t,(e=i).prototype=Object.create(n.prototype),e.prototype.constructor=e,e.__proto__=n,i}(i.a)},rhVh:function(t,e,n){"use strict";var i=n("1OyB"),r=n("vuIU"),o=n("md7G"),a=n("foSv"),u=n("Ji7U"),s=n("zgn+"),c=n("+OWk"),h=n("5tna"),l=function(t){function e(){return Object(i.a)(this,e),Object(o.a)(this,Object(a.a)(e).apply(this,arguments))}return Object(u.a)(e,t),Object(r.a)(e,[{key:"len",value:function(){return Math.sqrt(this.lengthSquared())}},{key:"magnitude",value:function(){return this.len()}},{key:"lengthSquared",value:function(){for(var t=0,e=0;e<this.ELEMENTS;++e)t+=this[e]*this[e];return t}},{key:"magnitudeSquared",value:function(){return this.lengthSquared()}},{key:"distance",value:function(t){return Math.sqrt(this.distanceSquared(t))}},{key:"distanceSquared",value:function(t){for(var e=0,n=0;n<this.ELEMENTS;++n){var i=this[n]-t[n];e+=i*i}return Object(c.a)(e)}},{key:"dot",value:function(t){for(var e=0,n=0;n<this.ELEMENTS;++n)e+=this[n]*t[n];return Object(c.a)(e)}},{key:"normalize",value:function(){var t=this.magnitude();if(0!==t)for(var e=0;e<this.ELEMENTS;++e)this[e]/=t;return this.check()}},{key:"multiply",value:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];for(var i=0,r=e;i<r.length;i++)for(var o=r[i],a=0;a<this.ELEMENTS;++a)this[a]*=o[a];return this.check()}},{key:"divide",value:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];for(var i=0,r=e;i<r.length;i++)for(var o=r[i],a=0;a<this.ELEMENTS;++a)this[a]/=o[a];return this.check()}},{key:"lengthSq",value:function(){return this.lengthSquared()}},{key:"distanceTo",value:function(t){return this.distance(t)}},{key:"distanceToSquared",value:function(t){return this.distanceSquared(t)}},{key:"getComponent",value:function(t){return Object(h.a)(t>=0&&t<this.ELEMENTS,"index is out of range"),Object(c.a)(this[t])}},{key:"setComponent",value:function(t,e){return Object(h.a)(t>=0&&t<this.ELEMENTS,"index is out of range"),this[t]=e,this.check()}},{key:"addVectors",value:function(t,e){return this.copy(t).add(e)}},{key:"subVectors",value:function(t,e){return this.copy(t).subtract(e)}},{key:"multiplyVectors",value:function(t,e){return this.copy(t).multiply(e)}},{key:"addScaledVector",value:function(t,e){return this.add(new this.constructor(t).multiplyScalar(e))}},{key:"x",get:function(){return this[0]},set:function(t){return this[0]=Object(c.a)(t)}},{key:"y",get:function(){return this[1]},set:function(t){return this[1]=Object(c.a)(t)}}]),e}(s.a),v=n("gmAo"),f=n("MTwu"),g=n("y1Qd");n.d(e,"a",(function(){return p}));var y=[0,0,0],p=function(t){function e(){var t,n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,u=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;return Object(i.a)(this,e),t=Object(o.a)(this,Object(a.a)(e).call(this,-0,-0,-0)),1===arguments.length&&Object(v.d)(n)?t.copy(n):(v.a.debug&&(Object(c.a)(n),Object(c.a)(r),Object(c.a)(u)),t[0]=n,t[1]=r,t[2]=u),t}return Object(u.a)(e,t),Object(r.a)(e,[{key:"set",value:function(t,e,n){return this[0]=t,this[1]=e,this[2]=n,this.check()}},{key:"copy",value:function(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this.check()}},{key:"fromObject",value:function(t){return v.a.debug&&(Object(c.a)(t.x),Object(c.a)(t.y),Object(c.a)(t.z)),this[0]=t.x,this[1]=t.y,this[2]=t.z,this.check()}},{key:"toObject",value:function(t){return t.x=this[0],t.y=this[1],t.z=this[2],t}},{key:"angle",value:function(t){return f.a(this,t)}},{key:"cross",value:function(t){return f.c(this,this,t),this.check()}},{key:"rotateX",value:function(t){var e=t.radians,n=t.origin,i=void 0===n?y:n;return f.h(this,this,i,e),this.check()}},{key:"rotateY",value:function(t){var e=t.radians,n=t.origin,i=void 0===n?y:n;return f.i(this,this,i,e),this.check()}},{key:"rotateZ",value:function(t){var e=t.radians,n=t.origin,i=void 0===n?y:n;return f.j(this,this,i,e),this.check()}},{key:"transform",value:function(t){return this.transformAsPoint(t)}},{key:"transformAsPoint",value:function(t){return f.l(this,this,t),this.check()}},{key:"transformAsVector",value:function(t){return Object(g.c)(this,this,t),this.check()}},{key:"transformByMatrix3",value:function(t){return f.k(this,this,t),this.check()}},{key:"transformByMatrix2",value:function(t){return Object(g.b)(this,this,t),this.check()}},{key:"transformByQuaternion",value:function(t){return f.m(this,this,t),this.check()}},{key:"ELEMENTS",get:function(){return 3}},{key:"z",get:function(){return this[2]},set:function(t){return this[2]=Object(c.a)(t)}}]),e}(l)}}]);
//# sourceMappingURL=component---templates-lessons-example-12-jsx-6cc2073b56390c116869.js.map