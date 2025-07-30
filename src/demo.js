import "./style.css"
import { gsap } from "gsap"

import { Rendering } from "./rendering"

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import GUI from 'lil-gui'; 

const gui = new GUI();
let debugObject = {}

// setting up
let rendering = new Rendering(document.querySelector("#canvas"), false)
rendering.camera.position.z = 40
rendering.camera.position.y = 40
rendering.camera.position.x = 40
rendering.camera.lookAt(new THREE.Vector3(0,0,0))

let controls = new OrbitControls(rendering.camera, rendering.canvas)

debugObject.depthColor = '#336671'
debugObject.surfaceColor = '#ffad8a'

let uTime = { value: 0 };

// Light Setup
rendering.scene.add(new THREE.HemisphereLight(0x9f9f9f, 0xffffff, 1))
rendering.scene.add(new THREE.AmbientLight(0xffffff, 1))
let d2 = new THREE.DirectionalLight(0x909090, 1)
rendering.scene.add(d2)
d2.position.set( -1, 0.5,  1)
d2.position.multiplyScalar(10)

let d1 = new THREE.DirectionalLight(0xffffff, 1)
rendering.scene.add(d1)
d1.position.set( 1, 0.5,  1)
d1.position.multiplyScalar(10)

// Init
let size = 1.5
let grid = 20
let gridSize = grid * size
let geometry = new THREE.BoxGeometry(1, 10, 1);
let material = new THREE.MeshPhysicalMaterial({color: 0x06085D});
let mesh = new THREE.InstancedMesh(geometry, material, grid * grid);

let dummy = new THREE.Object3D()
let i = 0
for(let y = 0; y < grid; y++)
for(let x = 0; x < grid; x++){
    dummy.position.set(
        x * size - gridSize/2 + size/2,
        0,
        y * size - gridSize/2 + size/2
    )
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    i++
}
mesh.instanceMatrix.needsUpdate = true
mesh.computeBoundingSphere()

rendering.scene.add(mesh)

let vertexHead = `

  uniform float uTime;
  uniform float uBigWaveElevation;
  uniform vec2 uBigWaveFrequency;
  uniform float uWaveSpeed;
  uniform float uSmallWaveElevation;
  uniform float uSmallWaveFrequency;
  uniform float uSmallWaveSpeed;
  uniform float uSmallIteration;

  varying float vElevation;
  varying float vLocalY;

//	Classic Perlin 3D Noise 
//	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
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

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

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

vec3 getInstancePosition(mat4 m) {
  return vec3(m[3].x, m[3].y, m[3].z);
}

  void main() {
`

let projectVertex = `

        vec3 iPos = getInstancePosition(instanceMatrix);

        // Wave calculation using XZ distance and time
        float wave = sin(iPos.x * uBigWaveFrequency.x + uTime * uWaveSpeed) 
                     * cos(iPos.z * uBigWaveFrequency.y + uTime * uWaveSpeed) * uBigWaveElevation;

        for(float i = 1.0; i<=uSmallIteration; i++){
           wave -= abs(cnoise(vec3(iPos.xz * uSmallWaveFrequency * i, uTime * uSmallWaveSpeed)) * uSmallWaveElevation / i);
        }
        
        
        
        // // Amplify the wave effect for more dramatic movement
        // wave *= 3.0; // Increase this multiplier for more dramatic effect
        
        if(transformed.y > 0.0) {
            transformed.y += wave;
        }

        vElevation = wave;
        vLocalY = transformed.y;

        vec4 mvPosition = vec4( transformed, 1.0 );

        #ifdef USE_INSTANCING

          mvPosition = instanceMatrix * mvPosition;

        #endif

        mvPosition = modelViewMatrix * mvPosition;

        gl_Position = projectionMatrix * mvPosition;
`

//Fragment shader 
let fragmenHead = `
uniform float uTime;
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
varying float vLocalY;

void main(){
`
let ditheringFragment = `

    float strength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, strength); 
   
    
    gl_FragColor = vec4(color, 1.0);

    #include <dithering_fragment>
`

let uniforms = {
    uTime: uTime,
    uBigWaveElevation: {value: 2.0},
    uBigWaveFrequency: {value: new THREE.Vector2(4, 1.5)},
    uWaveSpeed: {value: 1.0},

    uDepthColor: {value: new THREE.Color(debugObject.depthColor)},
    uSurfaceColor: {value: new THREE.Color(debugObject.surfaceColor)},
    uColorOffset: {value: 0.08},
    uColorMultiplier: {value: 1.3},

    uSmallWaveElevation: {value: 0.15},
    uSmallWaveFrequency: {value: 3},
    uSmallWaveSpeed: {value: 0.2},
    uSmallIteration: {value: 4.0},
}



mesh.material.onBeforeCompile = (shader)=>{
    shader.vertexShader = shader.vertexShader.replace('void main() {', vertexHead)
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', projectVertex)
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', fragmenHead)
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', ditheringFragment)
    shader.uniforms = {
      ...shader.uniforms,
      ...uniforms,
    }
}




mesh.customDepthMaterial = new THREE.MeshDepthMaterial()
mesh.customDepthMaterial.onBeforeCompile = (shader)=>{
  shader.vertexShader = shader.vertexShader.replace('void main() {', vertexHead)
  shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', projectVertex)
  shader.uniforms = {
    ...shader.uniforms,
    ...uniforms,
  }
}
mesh.customDepthMaterial.depthPacking = THREE.RGBADepthPacking

//gui
gui.add(uniforms.uBigWaveElevation, 'value').min(0).max(3).step(0.001).name('Elevation of wave')
gui.add(uniforms.uBigWaveFrequency.value, 'x').min(0).max(10).step(0.001).name('FrequencyX')
gui.add(uniforms.uBigWaveFrequency.value, 'y').min(0).max(10).step(0.001).name('FrequencyY')
gui.add(uniforms.uWaveSpeed, 'value').min(0).max(10).step(0.001).name('Wave Speed')
gui.addColor(debugObject, 'depthColor').onChange(()=>{uniforms.uDepthColor.value.set(debugObject.depthColor)})
gui.addColor(debugObject, 'surfaceColor').onChange(()=>{uniforms.uSurfaceColor.value.set(debugObject.surfaceColor)})
gui.add(uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('Color Offset')
gui.add(uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('Color Multiplier')

gui.add(uniforms.uSmallWaveElevation, 'value').min(0).max(1).step(0.001).name('Elevation of small waves')
gui.add(uniforms.uSmallWaveFrequency, 'value').min(0).max(30).step(0.001).name('Small waves Frequency')
gui.add(uniforms.uSmallWaveSpeed, 'value').min(0).max(4).step(0.001).name('Speed of small wave')
gui.add(uniforms.uSmallIteration, 'value').min(0).max(8).step(1).name('iteration of perlin')



// Events

const tick = (t)=>{
  uTime.value = t 
  rendering.render()
}

gsap.ticker.add(tick)


