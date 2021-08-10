//-------------------------------------------------------------
// Plain old retro wirecube in GLSL with a distance field twist
// 
// v1.0  2021-03-28  Initial version by Reine Larsson
// Thanks to mrange for improving distance fields
//-------------------------------------------------------------

#ifdef GL_ES
precision highp float;
#endif

#define speed 1.2
#define scale 0.3
#define color vec3(0,0,1)

varying vec2 v_texcoord;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;

mat4 model = mat4(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);

vec2 Project(vec3 p0) {
  vec3 viewport = vec3(0.0,-2.0,0.0);
  p0 -= viewport;
  return length(viewport) * p0.xz / p0.y;
}

mat4 Scale(vec3 v) {
  return mat4(vec4(v.x,0,0,0), vec4(0,v.y,0,0), vec4(0,0,v.z,0), vec4(0,0,0,1));
}

mat4 Rotate(vec3 u, float a) {
  float c = cos(a);
  float s = sin(a);
  vec3 c0 = vec3(c + (u.x*u.x) * (1.0-c), (u.y*u.x) * (1.0-c) + (u.z*s), (u.z*u.x) * (1.0-c) - (u.y*s));    
  vec3 c1 = vec3((u.x*u.y) * (1.0-c) - (u.z*s), c + (u.y*u.y) * (1.0-c), (u.z*u.y) * (1.0-c) + (u.x*s)); 
  vec3 c2 = vec3((u.x*u.z) * (1.0-c) + (u.y*s), (u.y*u.z) * (1.0-c) - (u.x*s), c + (u.z*u.z) * (1.0-c));
  return mat4(mat3(c0,c1,c2));
}
 
mat4 Translate(vec3 v) {
  return mat4(vec4(1.0,0,0,v.x), vec4(0,1.0,0,v.y), vec4(0,0,1.0,v.z), vec4(0,0,0,1.0));
}

float DistanceToLine(vec3 p0,vec3 p1,vec2 uv) {
  p0 = (vec4(p0,1.0) * model).xyz;
  p1 = (vec4(p1,1.0) * model).xyz;
    
  p0.xy = Project(p0);
  p1.xy = Project(p1);
    
  vec2 d = normalize(p1.xy - p0.xy);    
  uv = (uv - p0.xy) * mat2(d.x, d.y, -d.y, d.x);  
  float dist = distance(uv, clamp(uv, vec2(0.0), vec2(distance(p0.xy, p1.xy), 0.0)));
  return dist;
}

float pmin(float a, float b, float k) {
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 res = iResolution.xy / iResolution.y;
  vec2 uv = (fragCoord.xy / iResolution.y) - (res / 2.0);
  uv *= 3;
  float time = iTime;
    
  model *= Scale(vec3(scale));
  model *= Rotate(vec3(1.0, 0, 0.0), speed*time);
  model *= Rotate(vec3(0, 1.0, 0.0), speed*time);
  model *= Rotate(vec3(0.0, 0, 1.0), speed*time);
  model *= Translate(vec3(0.6*sin(time), 0.2*cos(time)-0.73, 0.18*cos(time)+0.1));
    
  vec3 cube[8];
  cube[0] = vec3(-1,-1,-1);
  cube[1] = vec3( 1,-1,-1);
  cube[2] = vec3(-1, 1,-1);
  cube[3] = vec3( 1, 1,-1);
  cube[4] = vec3(-1,-1, 1);
  cube[5] = vec3( 1,-1, 1);
  cube[6] = vec3(-1, 1, 1);
  cube[7] = vec3( 1, 1, 1);
    
  float dist = 1E6;
  const float sm = 0.3;
  dist = pmin(dist, DistanceToLine(cube[0],cube[1], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[1],cube[3], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[3],cube[2], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[2],cube[0], uv), sm);

  dist = pmin(dist, DistanceToLine(cube[4],cube[5], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[5],cube[7], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[7],cube[6], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[6],cube[4], uv), sm);

  dist = pmin(dist, DistanceToLine(cube[0],cube[4], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[5],cube[1], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[2],cube[6], uv), sm);
  dist = pmin(dist, DistanceToLine(cube[7],cube[3], uv), sm);

  vec3 linecube = vec3(0);   
  linecube = mix(linecube, color, smoothstep(5.0/iResolution.y, 0.0, dist)); 
  linecube += sin(0.5*dist*vec3(250.0, .0, 3.0));
  fragColor = vec4(linecube,0.0);
}

void main(void) { 
  mainImage(gl_FragColor,v_texcoord * iResolution.xy); 
}


