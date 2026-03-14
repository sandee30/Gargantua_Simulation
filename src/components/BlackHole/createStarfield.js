import * as THREE from 'three';

export function createStarfieldCubemap() {
  const size = 1024;
  const faces = [];

  for (let f = 0; f < 6; f++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    const starCount = 2000;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = Math.random();
      const radius = brightness * 1.5 + 0.3;

      const temp = Math.random();
      let r, g, b;
      if (temp < 0.15) {
        r = 180 + Math.random() * 75;
        g = 200 + Math.random() * 55;
        b = 255;
      } else if (temp < 0.5) {
        r = 255;
        g = 240 + Math.random() * 15;
        b = 200 + Math.random() * 55;
      } else if (temp < 0.8) {
        r = 255;
        g = 180 + Math.random() * 60;
        b = 100 + Math.random() * 80;
      } else {
        r = 255;
        g = 120 + Math.random() * 60;
        b = 80 + Math.random() * 40;
      }

      const alpha = 0.3 + brightness * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
    

    faces.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.needsUpdate = true;

  return cubeTexture;
}
