export default `\
#if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))

struct AmbientLight {
 vec3 color;
};

struct PointLight {
 vec3 color;
 vec3 position;

 // Constant-Linear-Exponential
 vec3 attenuation;
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

uniform Lights {
  AmbientLight lighting_uAmbientLight;
  PointLight lighting_uPointLight[MAX_LIGHTS];
  DirectionalLight lighting_uDirectionalLight[MAX_LIGHTS];
  int lighting_uPointLightCount;
  int lighting_uDirectionalLightCount;
  bool lighting_uEnabled;
};

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

#endif
`;
