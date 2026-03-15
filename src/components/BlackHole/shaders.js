

// bg ko lensing shader
export const lensingVertexShader = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vDirection;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vDirection = normalize(worldPos.xyz - cameraPosition);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const lensingFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uBlackHolePos;
uniform float uRs;
uniform float uSpin;
uniform samplerCube uStarfield;
uniform float uDiskInner;
uniform float uDiskOuter;

varying vec3 vWorldPosition;
varying vec3 vDirection;

#define PI 3.14159265359
#define MAX_STEPS 128
#define STEP_SIZE 0.12

vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0/7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0/7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0/7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0/7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

vec3 blackbody(float temp) {
  float t = clamp(temp, 1.0, 40.0);
  vec3 color;
  if (t <= 6.6) {
    color.r = 1.0;
  } else {
    color.r = 1.292936 * pow(t - 6.0, -0.1332047592);
  }
  if (t <= 6.6) {
    color.g = 0.39008 * log(t) - 0.63184;
  } else {
    color.g = 1.129890 * pow(t - 6.0, -0.0755148492);
  }
  if (t >= 6.6) {
    color.b = 1.0;
  } else if (t <= 1.9) {
    color.b = 0.0;
  } else {
    color.b = 0.54320 * log(t - 1.0) - 1.19625;
  }
  color = clamp(color, 0.0, 1.0);
  color *= vec3(1.0, 0.85, 0.55);
  return color;
}

float fbm(vec3 p) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    val += amp * cnoise(p * freq);
    freq *= 2.1;
    amp *= 0.45;
  }
  return val;
}

vec3 diskColor(vec3 pos, float r) {
  float diskFraction = (r - uDiskInner) / (uDiskOuter - uDiskInner);
  diskFraction = clamp(diskFraction, 0.0, 1.0);
  float tempK = mix(18.0, 3.0, pow(diskFraction, 0.4));
  float vOrb = sqrt(1.0 / r);
  float angle = atan(pos.z, pos.x);
  float cosAngle = cos(angle - PI * 0.5);
  float beta = vOrb * 0.6;
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  float doppler = 1.0 / (gamma * (1.0 - beta * cosAngle));
  float gravRedshift = sqrt(max(1.0 - uRs / r, 0.01));
  float totalShift = doppler * gravRedshift;
  float shiftedTemp = tempK * totalShift;
  vec3 baseColor = blackbody(shiftedTemp);
  float brightness = pow(clamp(totalShift, 0.1, 5.0), 3.5);
  float rNorm = r / uDiskInner;
  float radialBrightness = 1.0 / pow(rNorm, 2.5);
  float ringPattern = 1.0 + 0.3 * sin(r * 25.0) + 0.15 * sin(r * 60.0 + 1.0);
  float rotSpeed = vOrb * 0.3;
  float rotAngle = angle + uTime * rotSpeed;
  float spiral = rotAngle - 2.0 * log(r + 0.1);
  vec3 noisePos = vec3(cos(spiral) * r * 0.8, sin(spiral) * r * 0.8, r * 0.3);
  float turbulence = fbm(noisePos + vec3(0.0, 0.0, uTime * 0.015)) * 0.35 + 0.75;
  float fineNoise = cnoise(vec3(cos(rotAngle) * r * 12.0, sin(rotAngle) * r * 12.0, uTime * 0.03)) * 0.1 + 0.9;
  turbulence *= fineNoise * ringPattern;
  float innerFade = smoothstep(0.0, 0.12, diskFraction);
  float outerFade = smoothstep(0.0, 0.35, 1.0 - diskFraction);
  float edgeFade = innerFade * outerFade;
  float diskThick = 0.02 + 0.015 * (1.0 - diskFraction);
  float yFade = exp(-abs(pos.y) / diskThick);
  return baseColor * brightness * radialBrightness * turbulence * edgeFade * yFade * 12.0;
}

void main() {
  vec3 rayOrigin = cameraPosition;
  vec3 rayDir = normalize(vDirection);
  vec3 col = vec3(0.0);
  float totalAlpha = 0.0;
  vec3 pos = rayOrigin;
  vec3 vel = rayDir;
  bool hitHorizon = false;
  vec3 diskAccum = vec3(0.0);
  float diskAlpha = 0.0;
  float prevY = pos.y;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 toCenter = uBlackHolePos - pos;
    float r = length(toCenter);
    if (r < uRs * 0.5) {
      hitHorizon = true;
      break;
    }
    float forceMag = 1.5 * uRs * uRs / (r * r * r);
    vec3 spinAxis = vec3(0.0, 1.0, 0.0);
    vec3 frameDrag = cross(spinAxis, toCenter) * uSpin * uRs * uRs / (r * r * r * r) * 0.5;
    vec3 accel = normalize(toCenter) * forceMag + frameDrag;
    vel += accel * STEP_SIZE;
    vel = normalize(vel);
    float adaptiveStep = STEP_SIZE * clamp(r * 0.5, 0.05, 1.0);
    pos += vel * adaptiveStep;
    float currY = pos.y - uBlackHolePos.y;
    float pY = prevY;
    prevY = currY;
    if (pY * currY < 0.0 && r > uDiskInner && r < uDiskOuter) {
      vec3 diskPos = pos;
      diskPos.y = 0.0;
      float diskR = length(diskPos.xz - uBlackHolePos.xz);
      if (diskR > uDiskInner && diskR < uDiskOuter) {
        vec3 dCol = diskColor(diskPos, diskR);
        float dAlpha = clamp(length(dCol) * 0.8, 0.0, 1.0);
        diskAccum += dCol * (1.0 - diskAlpha);
        diskAlpha = clamp(diskAlpha + dAlpha * (1.0 - diskAlpha), 0.0, 1.0);
      }
    }
    if (abs(r - 1.5 * uRs) < 0.1) {
      float photonGlow = exp(-abs(r - 1.5 * uRs) / 0.03) * 0.15;
      diskAccum += vec3(0.7, 0.8, 1.0) * photonGlow * (1.0 - diskAlpha);
    }
    if (r > 50.0) {
      break;
    }
  }

  vec3 bgColor = vec3(0.0);
  if (!hitHorizon) {
    bgColor = textureCube(uStarfield, vel).rgb;
  }
  col = bgColor * (1.0 - diskAlpha) + diskAccum;
  gl_FragColor = vec4(col, 1.0);
}
`;

//Event-horizon shader
export const horizonVertexShader = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const horizonFragmentShader = /* glsl */ `
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

//Accretion-disk shader
export const diskVertexShader = /* glsl */ `
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
