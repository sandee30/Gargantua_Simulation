import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  lensingVertexShader,
  lensingFragmentShader,
  horizonVertexShader,
  horizonFragmentShader,
  diskVertexShader,
  diskFragmentShader,
} from './shaders.js';
import { createStarfieldCubemap } from './createStarfield.js';

const RS = 1.0;
const SPIN = 0.998;
const DISK_INNER = 1.23 * RS;
const DISK_OUTER = 6.0 * RS;

export default function BlackHoleSimulation() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.0, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const starfieldCubemap = createStarfieldCubemap();

    const lensingGeo = new THREE.SphereGeometry(80, 64, 64);
    const lensingMat = new THREE.ShaderMaterial({
      vertexShader: lensingVertexShader,
      fragmentShader: lensingFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBlackHolePos: { value: new THREE.Vector3(0, 0, 0) },
        uRs: { value: RS },
        uSpin: { value: SPIN },
        uStarfield: { value: starfieldCubemap },
        uDiskInner: { value: DISK_INNER },
        uDiskOuter: { value: DISK_OUTER },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(lensingGeo, lensingMat));

    const horizonGeo = new THREE.SphereGeometry(RS * 0.98, 64, 64);
    const horizonMat = new THREE.ShaderMaterial({
      vertexShader: horizonVertexShader,
      fragmentShader: horizonFragmentShader,
      depthWrite: true,
    });
    scene.add(new THREE.Mesh(horizonGeo, horizonMat));

    const diskGeo = new THREE.RingGeometry(DISK_INNER, DISK_OUTER, 256, 1);
    const diskPositions = diskGeo.attributes.position;
    for (let i = 0; i < diskPositions.count; i++) {
      const x = diskPositions.getX(i);
      const y = diskPositions.getY(i);
      diskPositions.setXYZ(i, x, 0, y);
    }
    diskGeo.computeVertexNormals();

    const diskMat = new THREE.ShaderMaterial({
      vertexShader: diskVertexShader,
      fragmentShader: diskFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRs: { value: RS },
        uDiskInner: { value: DISK_INNER },
        uDiskOuter: { value: DISK_OUTER },
        uSpin: { value: SPIN },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    scene.add(diskMesh);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.5, 0.4, 0.3
    );
    composer.addPass(bloomPass);

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let cameraTheta = 0;
    let cameraPhi = Math.PI / 2 - 0.26;
    let cameraRadius = 12;
    const autoRotateSpeed = (2 * Math.PI) / 60;
    let breathTime = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      cameraTheta -= dx * 0.005;
      cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi - dy * 0.005));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e) => {
      cameraRadius = Math.max(3, Math.min(30, cameraRadius + e.deltaY * 0.01));
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      cameraTheta -= dx * 0.005;
      cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi - dy * 0.005));
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: true });


    const clock = new THREE.Clock();
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        cameraTheta += autoRotateSpeed * delta;
      }

      breathTime += delta;
      const breathOffset = Math.sin(breathTime * 0.3) * 0.1;
      const currentRadius = cameraRadius + breathOffset;

      const x = currentRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      const y = currentRadius * Math.cos(cameraPhi);
      const z = currentRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      lensingMat.uniforms.uTime.value = elapsed;
      diskMat.uniforms.uTime.value = elapsed;

      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full"
      style={{ cursor: 'grab' }}
    />
  );
}
