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

      if (brightness > 0.85) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
        gradient.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    if (f === 0 || f === 1 || f === 4 || f === 5) {
      const gradient = ctx.createLinearGradient(0, size * 0.35, 0, size * 0.65);
      gradient.addColorStop(0, 'rgba(60, 50, 40, 0)');
      gradient.addColorStop(0.3, 'rgba(60, 50, 40, 0.04)');
      gradient.addColorStop(0.5, 'rgba(80, 70, 55, 0.06)');
      gradient.addColorStop(0.7, 'rgba(60, 50, 40, 0.04)');
      gradient.addColorStop(1, 'rgba(60, 50, 40, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = size * 0.35 + Math.random() * size * 0.3;
        const brightness = Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, brightness * 0.8 + 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,190,170,${brightness * 0.5})`;
        ctx.fill();
      }
    }

    faces.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.needsUpdate = true;

  return cubeTexture;
}
