import * as THREE from 'three';

// Procedural texture generator - creates all game textures from canvas
export class TextureFactory {
  constructor() {
    this.cache = {};
  }

  getTexture(name) {
    if (this.cache[name]) return this.cache[name];
    const tex = this['_' + name]();
    this.cache[name] = tex;
    return tex;
  }

  _createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { canvas: c, ctx: c.getContext('2d') };
  }

  _asphalt() {
    const { canvas, ctx } = this._createCanvas(512, 512);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, 512, 512);
    // Noise for asphalt texture
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const v = 40 + Math.random() * 30;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    // Subtle cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      for (let j = 0; j < 4; j++) {
        ctx.lineTo(ctx.canvas.width * Math.random(), ctx.canvas.height * Math.random());
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  _roadLine() {
    const { canvas, ctx } = this._createCanvas(64, 256);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, 64, 256);
    // Dashed center line
    ctx.fillStyle = '#f0e060';
    for (let y = 0; y < 256; y += 48) {
      ctx.fillRect(28, y, 8, 30);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _sidewalk() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(0, 0, 256, 256);
    // Paving pattern
    ctx.strokeStyle = '#998877';
    ctx.lineWidth = 2;
    for (let x = 0; x < 256; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    // Grime
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(80,70,60,${Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  _brick() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    const baseR = 140 + Math.random() * 40;
    const baseG = 60 + Math.random() * 30;
    const baseB = 50 + Math.random() * 20;
    ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
    ctx.fillRect(0, 0, 256, 256);
    const bw = 50, bh = 24, gap = 3;
    for (let row = 0; row < 256 / (bh + gap); row++) {
      const offset = (row % 2) * (bw / 2);
      for (let col = -1; col < 256 / (bw + gap) + 1; col++) {
        const x = col * (bw + gap) + offset;
        const y = row * (bh + gap);
        const rv = Math.random() * 30 - 15;
        ctx.fillStyle = `rgb(${baseR + rv},${baseG + rv},${baseB + rv})`;
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x, y, bw, bh);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _concrete() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = '#c8c0b8';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) {
      const v = 160 + Math.random() * 50;
      ctx.fillStyle = `rgb(${v},${v-5},${v-10})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _glass() {
    const { canvas, ctx } = this._createCanvas(128, 128);
    const grd = ctx.createLinearGradient(0, 0, 128, 128);
    grd.addColorStop(0, '#4488aa');
    grd.addColorStop(0.5, '#6699bb');
    grd.addColorStop(1, '#3377aa');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    // Reflection streaks
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(20, 0, 15, 128);
    ctx.fillRect(70, 0, 8, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _windowGrid() {
    const { canvas, ctx } = this._createCanvas(256, 512);
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, 256, 512);
    const cols = 4, rows = 8;
    const ww = 50, wh = 45;
    const gapX = (256 - cols * ww) / (cols + 1);
    const gapY = (512 - rows * wh) / (rows + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gapX + c * (ww + gapX);
        const y = gapY + r * (wh + gapY);
        const lit = Math.random() > 0.4;
        if (lit) {
          const warmth = Math.random();
          ctx.fillStyle = warmth > 0.5 ? '#ffe8a0' : '#aaccee';
        } else {
          ctx.fillStyle = '#2a3040';
        }
        ctx.fillRect(x, y, ww, wh);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, ww, wh);
        // Window cross
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + ww / 2, y); ctx.lineTo(x + ww / 2, y + wh);
        ctx.moveTo(x, y + wh / 2); ctx.lineTo(x + ww, y + wh / 2);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _roof() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 256, 256);
    // Roof tiles
    for (let y = 0; y < 256; y += 16) {
      const off = (Math.floor(y / 16) % 2) * 16;
      for (let x = 0; x < 256; x += 32) {
        const v = 85 + Math.random() * 20;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + off, y, 30, 14);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x + off, y, 30, 14);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _grass() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = '#3a7a3a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) {
      const g = 80 + Math.random() * 60;
      ctx.fillStyle = `rgb(${30 + Math.random() * 30},${g},${20 + Math.random() * 20})`;
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillRect(x, y, 1, 2 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    return tex;
  }

  _dirt() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      const v = Math.random();
      ctx.fillStyle = `rgb(${120 + v * 40},${95 + v * 30},${65 + v * 25})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  _metal() {
    const { canvas, ctx } = this._createCanvas(128, 128);
    const grd = ctx.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, '#aaa');
    grd.addColorStop(0.5, '#ccc');
    grd.addColorStop(1, '#999');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) {
      const v = 150 + Math.random() * 50;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  _tireRubber() {
    const { canvas, ctx } = this._createCanvas(64, 64);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 64, 64);
    // Tread pattern
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 8);
      ctx.lineTo(64, i * 8);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _carPaint(color) {
    const key = 'carPaint_' + color;
    if (this.cache[key]) return this.cache[key];
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    // Metallic flake effect
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    // Subtle gradient for curvature
    const grd = ctx.createLinearGradient(0, 0, 256, 256);
    grd.addColorStop(0, 'rgba(255,255,255,0.05)');
    grd.addColorStop(0.5, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    this.cache[key] = tex;
    return tex;
  }

  _shopFront() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    ctx.fillStyle = '#554433';
    ctx.fillRect(0, 0, 256, 256);
    // Shop window
    ctx.fillStyle = '#3a6677';
    ctx.fillRect(15, 60, 226, 140);
    // Reflection
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(20, 65, 60, 130);
    // Door
    ctx.fillStyle = '#443322';
    ctx.fillRect(100, 100, 56, 100);
    ctx.fillStyle = '#brass';
    ctx.fillStyle = '#c0a040';
    ctx.beginPath();
    ctx.arc(145, 155, 4, 0, Math.PI * 2);
    ctx.fill();
    // Sign area
    ctx.fillStyle = '#332211';
    ctx.fillRect(15, 15, 226, 35);
    ctx.fillStyle = '#ddccaa';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHOP', 128, 42);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  _storeSign(text, bgColor) {
    const key = 'sign_' + text;
    if (this.cache[key]) return this.cache[key];
    const { canvas, ctx } = this._createCanvas(256, 64);
    ctx.fillStyle = bgColor || '#334455';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 252, 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    this.cache[key] = tex;
    return tex;
  }

  _checkered() {
    const { canvas, ctx } = this._createCanvas(128, 128);
    const s = 16;
    for (let y = 0; y < 128; y += s) {
      for (let x = 0; x < 128; x += s) {
        ctx.fillStyle = ((x + y) / s) % 2 === 0 ? '#fff' : '#111';
        ctx.fillRect(x, y, s, s);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _water() {
    const { canvas, ctx } = this._createCanvas(256, 256);
    const grd = ctx.createLinearGradient(0, 0, 256, 256);
    grd.addColorStop(0, '#1a5276');
    grd.addColorStop(0.5, '#2980b9');
    grd.addColorStop(1, '#1a5276');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
    // Ripple highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const y = Math.random() * 256;
      ctx.moveTo(0, y);
      for (let x = 0; x < 256; x += 10) {
        ctx.lineTo(x, y + Math.sin(x * 0.05) * 3);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  _wood() {
    const { canvas, ctx } = this._createCanvas(128, 128);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 128;
      ctx.strokeStyle = `rgba(60,40,10,${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y + (Math.random() - 0.5) * 10);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}
