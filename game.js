/* ==========================================================================
   Neon Deep Sea Fishing - game.js
   Core Game Engine, Synthesized Audio, Canvas Rendering, & Mechanics
   ========================================================================== */

// ==========================================================================
// 0. 寫實魚類圖片資產加載與處理 (Asset Loader)
// ==========================================================================
const IMAGES = {};
const IMAGE_PATHS = {
    goldfish: 'assets/goldfish.jpg',
    clownfish: 'assets/clownfish.jpg',
    bluetang: 'assets/bluetang.jpg',
    anglerfish: 'assets/anglerfish.jpg',
    shark: 'assets/shark.jpg',
    dragon: 'assets/dragon.jpg'
};

function loadAndProcessAssets(callback) {
    let loadedCount = 0;
    const keys = Object.keys(IMAGE_PATHS);
    const totalCount = keys.length;
    
    // 獲取開始按鈕以展示加載進度
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = '載入寫實魚群 (0%)...';
    }

    keys.forEach(key => {
        const img = new Image();
        img.src = IMAGE_PATHS[key];
        img.onload = () => {
            // 1. 將圖片繪製到臨時畫布
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // 2. 去除黑色背景 (R < 15, G < 15, B < 15) 轉換為透明
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                if (r < 15 && g < 15 && b < 15) {
                    data[i+3] = 0; // Alpha 設為 0 透明
                }
            }
            ctx.putImageData(imgData, 0, 0);
            
            // 3. 裁剪四周空白/透明邊框，讓魚的碰撞體積更精準
            const croppedCanvas = cropTransparentCanvas(canvas);
            IMAGES[key] = croppedCanvas; // 存入全局圖片庫
            
            loadedCount++;
            const pct = Math.floor((loadedCount / totalCount) * 100);
            if (startBtn) {
                startBtn.textContent = `載入寫實魚群 (${pct}%)...`;
            }
            
            if (loadedCount === totalCount) {
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = '開始遊戲';
                }
                if (callback) callback();
            }
        };
        img.onerror = () => {
            console.error('Failed to load asset:', IMAGE_PATHS[key]);
            loadedCount++;
            if (loadedCount === totalCount) {
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = '開始遊戲';
                }
                if (callback) callback();
            }
        };
    });
}

// 輔助函式：自動裁剪畫布中的透明邊界
function cropTransparentCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    let minX = w, maxX = 0, minY = h, maxY = 0;
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 0) { // 非透明像素
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    // 如果圖片為空
    if (maxX < minX || maxY < minY) {
        return canvas;
    }
    
    // 加回 2 像素緩衝區
    minX = Math.max(0, minX - 2);
    minY = Math.max(0, minY - 2);
    maxX = Math.min(w - 1, maxX + 2);
    maxY = Math.min(h - 1, maxY + 2);
    
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    
    return cropCanvas;
}


// ==========================================================================
// 1. Web Audio API 音效合成器 (SoundController)
// ==========================================================================
class SoundController {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playCoin() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.setValueAtTime(1320, now + 0.08); // E6
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);
    }

    playExplosion() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(10, now + 0.6);
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);

        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(10, now + 0.5);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.5);
    }

    playLaser() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 30;
        lfoGain.gain.value = 50; 
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.8);
        osc.stop(now + 0.8);
    }

    playFreeze() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.4);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    playDouble() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const start = now + idx * 0.08;
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    }

    playBubblePop() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + Math.random() * 150, now);
        osc.frequency.exponentialRampToValueAtTime(600 + Math.random() * 200, now + 0.08);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }
}

const soundCtrl = new SoundController();


// ==========================================================================
// 2. 魚類定義與屬性配置 (Fish Configuration)
// ==========================================================================
const FISH_TYPES = {
    goldfish: {
        name: '黃金錦鯉魚',
        points: 50,
        speed: 1.7,
        width: 50,
        height: 28,
        health: 1,
        color: '#ffb800',
        scale: 1.0
    },
    clownfish: {
        name: '寫實小丑魚',
        points: 100,
        speed: 1.3,
        width: 60,
        height: 36,
        health: 1,
        color: '#ff5c00',
        scale: 1.0
    },
    bluetang: {
        name: '藍唐王醫生魚',
        points: 200,
        speed: 1.4,
        width: 70,
        height: 42,
        health: 1,
        color: '#0066ff',
        scale: 1.0
    },
    anglerfish: {
        name: '深海大口鮟鱇',
        points: 500,
        speed: 0.95,
        width: 85,
        height: 65,
        health: 3,
        color: '#a000ff',
        scale: 1.0
    },
    shark: {
        name: '狂暴大白鯊',
        points: 1000,
        speed: 0.75,
        width: 155,
        height: 85,
        health: 6,
        color: '#00f0ff',
        scale: 1.0
    },
    dragon: { // Boss 魚
        name: 'Boss 霓虹黃金龍',
        points: 5000,
        speed: 0.55,
        width: 75, // 龍頭寬度
        height: 75, // 龍頭高度
        health: 30,
        color: '#ffd700',
        scale: 1.0,
        isBoss: true
    }
};

// ==========================================================================
// 3. 魚類物件類別 (Fish Class)
// ==========================================================================
class Fish {
    constructor(typeKey, startX, startY, speedMult = 1) {
        this.typeKey = typeKey;
        const config = FISH_TYPES[typeKey];
        this.name = config.name;
        this.points = config.points;
        this.baseSpeed = config.speed * speedMult;
        this.speed = this.baseSpeed;
        this.width = config.width;
        this.height = config.height;
        this.health = config.health;
        this.maxHealth = config.health;
        this.color = config.color;
        this.isBoss = !!config.isBoss;

        this.x = startX;
        this.y = startY;
        this.vx = (startX < 0) ? (this.speed) : (-this.speed);
        this.vy = (Math.random() - 0.5) * 0.25;
        
        this.angle = Math.atan2(this.vy, this.vx);
        this.swimCycle = Math.random() * 100;
        this.isDead = false;
        this.deathTimer = 0;
        this.fadeAlpha = 1.0;

        if (this.isBoss) {
            this.segments = [];
            this.segmentCount = 14; // 14節龍身
            for (let i = 0; i < this.segmentCount; i++) {
                this.segments.push({ x: startX, y: startY, angle: 0 });
            }
            this.vy = 0.2;
        }
    }

    update(isFrozen) {
        if (this.isDead) {
            this.deathTimer += 1;
            this.fadeAlpha = Math.max(0, 1 - this.deathTimer / 30);
            this.y += 0.45;
            this.angle += 0.04;
            return;
        }

        if (isFrozen) {
            return;
        }

        if (this.isBoss) {
            this.swimCycle += 0.04;
            this.vy = Math.sin(this.swimCycle) * 1.5;
        } else {
            this.swimCycle += 0.12;
            if (Math.random() < 0.015) {
                this.vy = (Math.random() - 0.5) * 0.6;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.angle = Math.atan2(this.vy, this.vx);

        if (this.isBoss) {
            let prevX = this.x;
            let prevY = this.y;
            const distBetweenSegments = 23;
            
            for (let i = 0; i < this.segmentCount; i++) {
                const seg = this.segments[i];
                const dx = prevX - seg.x;
                const dy = prevY - seg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > distBetweenSegments) {
                    const angle = Math.atan2(dy, dx);
                    seg.angle = angle;
                    seg.x = prevX - Math.cos(angle) * distBetweenSegments;
                    seg.y = prevY - Math.sin(angle) * distBetweenSegments;
                }
                prevX = seg.x;
                prevY = seg.y;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;
        
        if (this.isBoss) {
            this.drawBossDragon(ctx);
        } else {
            this.drawNormalFish(ctx);
        }

        ctx.restore();
    }

    // 繪製寫實魚 (使用真實生成的圖片 assets，並套用即時波動網格動畫)
    drawNormalFish(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const facingLeft = this.vx < 0;
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        const w = this.width;
        const h = this.height;

        // 💡 底部霓虹光環背景
        const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, Math.max(w, h) * 0.68);
        auraGrad.addColorStop(0, this.color);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(w, h) * 0.68, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = this.fadeAlpha;

        // 💡 繪製精美波動寫實圖片
        const sprite = IMAGES[this.typeKey];
        if (sprite) {
            const swimCycle = this.isDead ? 0 : this.swimCycle;
            this.drawWavySprite(ctx, sprite, w, h, swimCycle);
        }

        ctx.restore();

        // 繪製血量條
        if (this.health < this.maxHealth && this.health > 0) {
            this.drawHealthBar(ctx, this.x - w/2, this.y - h * 0.65, w);
        }
    }

    // 💡 核心演算法：將寫實魚切成 N 個垂直細條，套用正弦波偏移，製造極其自然的 3D 擺尾游動動畫！
    drawWavySprite(ctx, canvas, width, height, swimCycle) {
        const numSlices = 15;
        const sliceWidth = canvas.width / numSlices;
        const drawSliceWidth = width / numSlices;
        
        for (let i = 0; i < numSlices; i++) {
            const progress = i / numSlices; // 從尾巴(0)到頭部(1)
            
            // 魚頭擺幅小，魚尾擺幅大 (1 - progress)
            const waveAmp = (1 - progress) * 8.5; 
            const waveOffset = Math.sin(swimCycle - progress * Math.PI * 1.6) * waveAmp;
            
            ctx.drawImage(
                canvas,
                i * sliceWidth, 0, sliceWidth, canvas.height, // 來源裁切
                -width/2 + i * drawSliceWidth, -height/2 + waveOffset, drawSliceWidth, height // 目標繪製
            );
        }
    }

    // 繪製 Boss 霓虹黃金龍 (寫實龍頭 + 龍鱗身軀)
    drawBossDragon(ctx) {
        const radius = this.width * 0.38;

        // 1. 繪製身軀節點 (黃金漸變立體龍身)
        for (let i = this.segmentCount - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const sizeRatio = (1 - (i / this.segmentCount) * 0.45);
            const segRadius = radius * sizeRatio;

            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            // 霓虹發光背景
            const auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, segRadius * 1.5);
            auraGrad.addColorStop(0, this.color);
            auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = auraGrad;
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(0, 0, segRadius * 1.5, 0, Math.PI*2);
            ctx.fill();

            // 雙層立體漸層身軀
            const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, segRadius);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.3, '#ffe853');
            bodyGrad.addColorStop(0.7, '#ff8000');
            bodyGrad.addColorStop(1, '#941e00');
            ctx.fillStyle = bodyGrad;
            ctx.globalAlpha = this.fadeAlpha;
            
            ctx.beginPath();
            ctx.arc(0, 0, segRadius, 0, Math.PI * 2);
            ctx.fill();

            // 龍背刺
            ctx.fillStyle = '#ff1a00';
            ctx.beginPath();
            ctx.moveTo(0, -segRadius);
            ctx.lineTo(-12, -segRadius - 12);
            ctx.lineTo(8, -segRadius);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, segRadius);
            ctx.lineTo(-12, segRadius + 12);
            ctx.lineTo(8, segRadius);
            ctx.fill();

            ctx.restore();
        }

        // 2. 繪製龍頭 (寫實龍頭貼圖)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const facingLeft = this.vx < 0;
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        // 背後發光
        const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * 1.8);
        auraGrad.addColorStop(0, '#ffd700');
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.8, 0, Math.PI*2);
        ctx.fill();
        
        ctx.globalAlpha = this.fadeAlpha;

        const headW = radius * 2.3;
        const headH = radius * 2.3;
        const dragonImg = IMAGES.dragon;

        if (dragonImg) {
            // 直接渲染寫實生成的龍頭
            ctx.drawImage(dragonImg, -headW * 0.5, -headH * 0.5, headW, headH);
        } else {
            // 備用矢量龍頭
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI*2);
            ctx.stroke();
        }

        ctx.restore();

        // 3. 繪製頂部大血條
        if (this.health > 0) {
            this.drawBossHealthBar(ctx);
        }
    }

    drawHealthBar(ctx, x, y, width) {
        const height = 4.5;
        const pct = Math.max(0, this.health / this.maxHealth);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#00ff55';
        ctx.fillRect(x, y, width * pct, height);
        ctx.restore();
    }

    drawBossHealthBar(ctx) {
        const barW = ctx.canvas.width * 0.01 * (60 / (window.devicePixelRatio || 1)) || 280;
        const realBarW = Math.min(barW, 400);
        const barH = 10;
        const x = (ctx.canvas.width / (window.devicePixelRatio || 1) - realBarW) / 2;
        const y = 80;
        const pct = Math.max(0, this.health / this.maxHealth);

        ctx.save();
        ctx.fillStyle = 'rgba(6, 18, 38, 0.7)';
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, realBarW, barH);
        ctx.strokeRect(x, y, realBarW, barH);

        const bloodGrad = ctx.createLinearGradient(x, 0, x + realBarW, 0);
        bloodGrad.addColorStop(0, '#ff007b');
        bloodGrad.addColorStop(1, '#ffd700');
        ctx.fillStyle = bloodGrad;
        ctx.fillRect(x, y, realBarW * pct, barH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name + ` (${this.health}/${this.maxHealth})`, x + realBarW / 2, y - 5);
        ctx.restore();
    }

    checkCollision(netX, netY, netRadius) {
        if (this.isDead) return false;
        
        const dx = this.x - netX;
        const dy = this.y - netY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = this.isBoss ? this.width * 0.95 : Math.max(this.width, this.height) * 0.45;

        if (dist < netRadius + hitRadius) {
            return true;
        }

        if (this.isBoss) {
            for (let i = 0; i < this.segmentCount; i++) {
                const seg = this.segments[i];
                const sdx = seg.x - netX;
                const sdy = seg.y - netY;
                const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
                if (sdist < netRadius + (this.width * 0.38 * (1 - (i / this.segmentCount) * 0.42))) {
                    return true;
                }
            }
        }

        return false;
    }
}

// ==========================================================================
// 4. 砲台與能量彈 (Cannon & Bullet)
// ==========================================================================
class Cannon {
    constructor(width, height) {
        this.x = width / 2;
        this.y = height;
        this.angle = 0;
        this.recoil = 0;
        this.width = 44;
        this.height = 70;
    }

    resize(width, height) {
        this.x = width / 2;
        this.y = height;
    }

    updateAngle(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        this.angle = Math.atan2(dy, dx);
    }

    update() {
        if (this.recoil > 0) {
            this.recoil -= 1.5;
            if (this.recoil < 0) this.recoil = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        const rectLength = this.height - this.recoil;

        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -rectLength);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -rectLength);
        ctx.stroke();

        ctx.fillStyle = '#9d00ff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-14, -rectLength * 0.6, 6, rectLength * 0.5);
        ctx.fillRect(8, -rectLength * 0.6, 6, rectLength * 0.5);

        ctx.fillStyle = 'rgba(6, 18, 38, 0.9)';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(0, 10, 26, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff007b';
        ctx.beginPath();
        ctx.arc(0, 10, 8, Math.PI, 0);
        ctx.fill();

        ctx.restore();
    }
}

class Bullet {
    constructor(startX, startY, angle, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.speed = 12;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.targetX = targetX;
        this.targetY = targetY;
        
        const dx = targetX - startX;
        const dy = targetY - startY;
        this.totalDist = Math.sqrt(dx * dx + dy * dy);
        this.distTraveled = 0;

        this.isDead = false;
        this.radius = 6.5;
        this.color = '#00f3ff';
    }

    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.distTraveled += this.speed;

        if (this.distTraveled >= this.totalDist - 6) {
            this.isDead = true;
        }

        if (this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Net {
    constructor(x, y, scale = 1.0, isLaser = false) {
        this.x = x;
        this.y = y;
        this.isLaser = isLaser;
        
        this.maxRadius = (isLaser ? 80 : 70) * scale;
        this.radius = 5;
        this.growSpeed = 4.0;
        this.fadeSpeed = 0.038;
        this.alpha = 1.0;
        this.isDead = false;
        this.color = isLaser ? '#ffd700' : '#00f3ff';
        
        this.hasEvaluated = false;
    }

    update() {
        if (this.radius < this.maxRadius) {
            this.radius += this.growSpeed;
        } else {
            this.alpha -= this.fadeSpeed;
            if (this.alpha <= 0) {
                this.isDead = true;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.color;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.95, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.8;
        const lineCount = 6;
        for (let i = 0; i < lineCount; i++) {
            const angle = (i * Math.PI) / lineCount;
            const x1 = this.x + Math.cos(angle) * this.radius;
            const y1 = this.y + Math.sin(angle) * this.radius;
            const x2 = this.x - Math.cos(angle) * this.radius;
            const y2 = this.y - Math.sin(angle) * this.radius;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, type = 'bubble', color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.isDead = false;

        const angle = Math.random() * Math.PI * 2;
        
        if (type === 'bubble') {
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = -0.5 - Math.random() * 0.8;
            this.radius = 1.5 + Math.random() * 3.5;
            this.alpha = 0.25 + Math.random() * 0.5;
            this.fadeSpeed = 0.002 + Math.random() * 0.002;
            this.wobbleSpeed = 0.02 + Math.random() * 0.03;
            this.wobbleRange = 0.5 + Math.random() * 1.5;
            this.wobblePhase = Math.random() * 100;
        } else if (type === 'gold') {
            this.vx = Math.cos(angle) * (2 + Math.random() * 4);
            this.vy = Math.sin(angle) * (2 + Math.random() * 4);
            this.radius = 5 + Math.random() * 3;
            this.alpha = 1.0;
            this.fadeSpeed = 0;
            this.flyToHUD = false;
            this.timer = 0;
            this.maxStayTime = 12 + Math.random() * 12;
        } else if (type === 'spark') {
            const speed = 1.2 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 1.5 + Math.random() * 2;
            this.alpha = 1.0;
            this.fadeSpeed = 0.032 + Math.random() * 0.032;
            this.friction = 0.94;
        } else if (type === 'ice') {
            const speed = 0.5 + Math.random() * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 2 + Math.random() * 3;
            this.alpha = 0.8;
            this.fadeSpeed = 0.02;
        }
    }

    update(hudScoreRect) {
        if (this.type === 'bubble') {
            this.wobblePhase += this.wobbleSpeed;
            this.x += this.vx + Math.sin(this.wobblePhase) * this.wobbleRange * 0.1;
            this.y += this.vy;
            this.alpha -= this.fadeSpeed;
            if (this.alpha <= 0 || this.y < -10) this.isDead = true;
        } 
        else if (this.type === 'gold') {
            this.timer++;
            if (!this.flyToHUD) {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.92;
                this.vy *= 0.92;
                
                if (this.timer > this.maxStayTime) {
                    this.flyToHUD = true;
                }
            } else {
                const targetX = hudScoreRect.x + hudScoreRect.w / 2;
                const targetY = hudScoreRect.y + hudScoreRect.h / 2;
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 15) {
                    this.isDead = true;
                    return true;
                }

                const speed = 14;
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            }
        } 
        else if (this.type === 'spark') {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.fadeSpeed;
            if (this.alpha <= 0) this.isDead = true;
        }
        else if (this.type === 'ice') {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.fadeSpeed;
            if (this.alpha <= 0) this.isDead = true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (this.type === 'bubble') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'gold') {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (this.type === 'ice') {
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            const r = this.radius;
            ctx.moveTo(this.x, this.y - r);
            ctx.lineTo(this.x + r * 0.3, this.y - r * 0.3);
            ctx.lineTo(this.x + r, this.y);
            ctx.lineTo(this.x + r * 0.3, this.y + r * 0.3);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x - r * 0.3, this.y + r * 0.3);
            ctx.lineTo(this.x - r, this.y);
            ctx.lineTo(this.x - r * 0.3, this.y - r * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color = '#ffd700') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.vy = -1.3;
        this.alpha = 1.0;
        this.fadeSpeed = 0.022;
        this.isDead = false;
    }

    update() {
        this.y += this.vy;
        this.alpha -= this.fadeSpeed;
        if (this.alpha <= 0) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 22px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}


// ==========================================================================
// 5. 遊戲核心邏輯控制器 (Game Controller)
// ==========================================================================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('fishing_high_score') || '0');
        this.combo = 0;
        this.comboTimer = 0;
        this.timeLeft = 60;
        
        this.stats = {
            fishCaught: 0,
            maxCombo: 0,
            bossKilled: 0
        };

        this.gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
        this.isFrozen = false;
        this.freezeTimer = 0;
        
        this.isLaserActive = false;
        this.laserTimer = 0;
        this.laserX = 0;

        this.isDoubleScore = false;
        this.doubleScoreTimer = 0;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.fishList = [];
        this.bulletList = [];
        this.netList = [];
        this.particleList = [];
        this.textList = [];

        this.cannon = null;

        this.cooldowns = {
            freeze: { duration: 15, current: 0 },
            laser: { duration: 20, current: 0 },
            bomb: { duration: 12, current: 0 },
            double: { duration: 25, current: 0 }
        };

        this.eventTimer = 3;
        this.activeEvent = null;
        this.eventDuration = 0;

        this.sunRaysPhase = 0;
        this.hudScoreRect = { x: 20, y: 20, w: 100, h: 45 };

        this.initEvents();
        this.resize();
    }

    init() {
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 60;
        this.stats = { fishCaught: 0, maxCombo: 0, bossKilled: 0 };
        
        this.isFrozen = false;
        this.isLaserActive = false;
        this.isDoubleScore = false;
        
        this.fishList = [];
        this.bulletList = [];
        this.netList = [];
        this.particleList = [];
        this.textList = [];

        Object.keys(this.cooldowns).forEach(k => {
            this.cooldowns[k].current = 0;
            const overlay = document.getElementById(`cd-${k}`);
            if (overlay) overlay.style.height = '0%';
            const btn = document.getElementById(`btn-${k}`);
            if (btn) btn.classList.remove('cooldown', 'active-skill');
        });

        this.cannon = new Cannon(this.width, this.height);
        
        for (let i = 0; i < 20; i++) {
            this.particleList.push(new Particle(
                Math.random() * this.width,
                Math.random() * this.height,
                'bubble'
            ));
        }

        for (let i = 0; i < 4; i++) {
            this.spawnFish();
        }
    }

    resize() {
        const cssWidth = window.innerWidth;
        const cssHeight = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = cssWidth * dpr;
        this.canvas.height = cssHeight * dpr;
        this.canvas.style.width = cssWidth + 'px';
        this.canvas.style.height = cssHeight + 'px';

        this.width = cssWidth;
        this.height = cssHeight;

        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        
        if (this.cannon) {
            this.cannon.resize(this.width, this.height);
        }

        const scoreBox = document.querySelector('.score-box');
        if (scoreBox) {
            const rect = scoreBox.getBoundingClientRect();
            this.hudScoreRect = {
                x: rect.left,
                y: rect.top,
                w: rect.width,
                h: rect.height
            };
        }
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());

        document.getElementById('btn-start').addEventListener('click', (e) => {
            e.stopPropagation();
            soundCtrl.init();
            this.start();
        });

        document.getElementById('btn-restart').addEventListener('click', (e) => {
            e.stopPropagation();
            soundCtrl.init();
            this.start();
        });

        this.canvas.addEventListener('touchstart', (e) => this.handleTap(e), { passive: false });
        this.canvas.addEventListener('mousedown', (e) => this.handleTap(e));

        document.getElementById('btn-freeze').addEventListener('click', (e) => { e.stopPropagation(); this.useFreeze(); });
        document.getElementById('btn-laser').addEventListener('click', (e) => { e.stopPropagation(); this.useLaser(); });
        document.getElementById('btn-bomb').addEventListener('click', (e) => { e.stopPropagation(); this.useBomb(); });
        document.getElementById('btn-double').addEventListener('click', (e) => { e.stopPropagation(); this.useDouble(); });

        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    start() {
        this.init();
        this.gameState = 'PLAYING';
        
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('skills-panel').classList.remove('hidden');

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'PLAYING') {
                this.tick();
            }
        }, 1000);
    }

    tick() {
        this.timeLeft--;
        document.getElementById('time-val').textContent = this.timeLeft;
        
        if (this.timeLeft <= 10) {
            document.getElementById('time-val').classList.add('red-glow');
        } else {
            document.getElementById('time-val').classList.remove('red-glow');
        }

        if (this.timeLeft <= 0) {
            this.gameOver();
            return;
        }

        if (Math.random() < 0.3) {
            soundCtrl.playBubblePop();
        }

        Object.keys(this.cooldowns).forEach(k => {
            const cd = this.cooldowns[k];
            if (cd.current > 0) {
                cd.current--;
                const pct = (cd.current / cd.duration) * 100;
                document.getElementById(`cd-${k}`).style.height = `${pct}%`;
                
                if (cd.current === 0) {
                    const btn = document.getElementById(`btn-${k}`);
                    btn.classList.remove('cooldown');
                }
            }
        });

        this.eventTimer--;
        if (this.eventTimer <= 0) {
            this.triggerRandomEvent();
        }
    }

    triggerRandomEvent() {
        if (this.activeEvent) return;

        const rand = Math.random();
        if (rand < 0.5) {
            this.triggerFishTide();
        } else {
            this.triggerBossEvent();
        }

        this.eventTimer = 18 + Math.floor(Math.random() * 8);
    }

    triggerFishTide() {
        this.activeEvent = 'TIDE';
        this.eventDuration = 10;

        this.showEventBanner('魚潮來襲！大批寫實魚群快速出沒！');
        
        const tideInterval = setInterval(() => {
            if (this.gameState !== 'PLAYING' || this.eventDuration <= 0) {
                clearInterval(tideInterval);
                this.activeEvent = null;
                return;
            }

            const side = Math.random() < 0.5 ? -60 : this.width + 60;
            const pattern = Math.random() < 0.5 ? 'wave' : 'diagonal';

            for (let i = 0; i < 3; i++) {
                const y = 80 + (this.height / 4) * i + (Math.random() - 0.5) * 40;
                const fish = this.spawnFishAt(side, y, 1.55);
                if (pattern === 'wave') {
                    fish.vy = Math.sin(i) * 1.5;
                } else {
                    fish.vy = (side < 0 ? 0.7 : -0.7);
                }
            }
        }, 1200);

        const tideCd = setInterval(() => {
            this.eventDuration--;
            if (this.eventDuration <= 0) {
                clearInterval(tideCd);
            }
        }, 1000);
    }

    triggerBossEvent() {
        this.activeEvent = 'BOSS';
        this.showEventBanner('警告：Boss 霓虹黃金龍降臨！');

        const side = Math.random() < 0.5 ? -150 : this.width + 150;
        const y = this.height * 0.4;
        
        const boss = new Fish('dragon', side, y, 1.0);
        this.fishList.push(boss);

        const checkBoss = setInterval(() => {
            if (this.gameState !== 'PLAYING') {
                clearInterval(checkBoss);
                this.activeEvent = null;
                return;
            }

            const isBossAlive = this.fishList.some(f => f.typeKey === 'dragon' && !f.isDead);
            const isBossStillHere = this.fishList.some(f => f.typeKey === 'dragon');

            if (!isBossStillHere) {
                clearInterval(checkBoss);
                this.activeEvent = null;
            } 
            else if (!isBossAlive && isBossStillHere) {
                clearInterval(checkBoss);
                this.stats.bossKilled++;
                this.showEventBanner('Boss 被擊敗！獲得 5000 點獎勵！');
                this.activeEvent = null;
            }
        }, 500);
    }

    showEventBanner(text) {
        const banner = document.getElementById('event-banner');
        const bannerText = document.getElementById('event-text');
        
        bannerText.textContent = text;
        banner.classList.add('active');
        
        setTimeout(() => {
            banner.classList.remove('active');
        }, 4000);
    }

    gameOver() {
        this.gameState = 'GAMEOVER';
        clearInterval(this.timerInterval);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fishing_high_score', this.highScore);
        }

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('skills-panel').classList.add('hidden');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;

        document.getElementById('stat-fish-caught').textContent = this.stats.fishCaught;
        document.getElementById('stat-max-combo').textContent = this.stats.maxCombo;
        document.getElementById('stat-boss-killed').textContent = this.stats.bossKilled;

        document.getElementById('game-over-overlay').classList.remove('hidden');
    }

    handleTap(e) {
        if (this.gameState !== 'PLAYING') return;
        
        if (e.type === 'touchstart') {
            e.preventDefault();
        }

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[e.touches.length - 1].clientX;
            clientY = e.touches[e.touches.length - 1].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const panel = document.getElementById('skills-panel');
        const panelRect = panel.getBoundingClientRect();
        if (clientX >= panelRect.left && clientX <= panelRect.right &&
            clientY >= panelRect.top && clientY <= panelRect.bottom) {
            return;
        }

        if (clientY < 80) return;

        if (this.isLaserActive) {
            this.fireLaserBeam(clientX);
            return;
        }

        this.fireBullet(clientX, clientY);
    }

    fireBullet(targetX, targetY) {
        if (!this.cannon) return;

        this.cannon.updateAngle(targetX, targetY);
        this.cannon.recoil = 15;

        const bullet = new Bullet(
            this.cannon.x, 
            this.cannon.y - 40, 
            this.cannon.angle, 
            targetX, 
            targetY
        );
        this.bulletList.push(bullet);
        soundCtrl.playShoot();
    }

    explodeBullet(x, y) {
        const net = new Net(x, y);
        this.netList.push(net);
    }

    evaluateCatch(net) {
        if (net.hasEvaluated) return;
        net.hasEvaluated = true;

        let caughtSomething = false;

        for (let i = 0; i < this.fishList.length; i++) {
            const fish = this.fishList[i];
            
            if (fish.checkCollision(net.x, net.y, net.radius)) {
                const damage = net.isLaser ? 3 : 1;
                fish.health -= damage;
                caughtSomething = true;

                for (let k = 0; k < 6; k++) {
                    this.particleList.push(new Particle(fish.x, fish.y, 'spark', fish.color));
                }

                if (fish.health <= 0) {
                    fish.isDead = true;
                    this.stats.fishCaught++;

                    let basePoints = fish.points;
                    if (this.isDoubleScore) {
                        basePoints *= 2;
                    }
                    this.score += basePoints;
                    
                    this.combo++;
                    this.comboTimer = 120;
                    if (this.combo > this.stats.maxCombo) {
                        this.stats.maxCombo = this.combo;
                    }

                    const ptsText = this.isDoubleScore ? `+${basePoints} DOUBLE!` : `+${basePoints}`;
                    this.textList.push(new FloatingText(fish.x, fish.y - 10, ptsText, this.isDoubleScore ? '#ff007b' : fish.color));

                    const coinCount = fish.isBoss ? 20 : (fish.points / 100) + 2;
                    for (let j = 0; j < coinCount; j++) {
                        this.particleList.push(new Particle(fish.x, fish.y, 'gold'));
                    }

                    soundCtrl.playCoin();
                } else {
                    this.textList.push(new FloatingText(fish.x, fish.y - 12, 'HIT!', '#ff0055'));
                }
            }
        }

        if (caughtSomething) {
            document.getElementById('score-val').textContent = this.score;
            document.getElementById('score-val').style.transform = 'scale(1.2)';
            setTimeout(() => {
                document.getElementById('score-val').style.transform = 'scale(1)';
            }, 100);
        }
    }

    useFreeze() {
        if (this.cooldowns.freeze.current > 0 || this.gameState !== 'PLAYING') return;

        this.isFrozen = true;
        this.freezeTimer = 300;
        this.cooldowns.freeze.current = this.cooldowns.freeze.duration;
        document.getElementById('btn-freeze').classList.add('cooldown', 'active-skill');

        soundCtrl.playFreeze();

        for (let i = 0; i < 40; i++) {
            this.particleList.push(new Particle(
                Math.random() * this.width,
                Math.random() * this.height,
                'ice'
            ));
        }
    }

    useLaser() {
        if (this.cooldowns.laser.current > 0 || this.gameState !== 'PLAYING') return;

        this.isLaserActive = true;
        this.laserTimer = 600;
        this.cooldowns.laser.current = this.cooldowns.laser.duration;
        document.getElementById('btn-laser').classList.add('cooldown', 'active-skill');

        soundCtrl.playFreeze();
        this.showEventBanner('雷射已加載！點擊任意地方發射！');
    }

    fireLaserBeam(x) {
        this.isLaserActive = false;
        document.getElementById('btn-laser').classList.remove('active-skill');
        
        soundCtrl.playLaser();

        this.laserX = x;
        this.laserBeamTimer = 45;

        const beamW = 100;

        for (let i = 0; i < this.fishList.length; i++) {
            const fish = this.fishList[i];
            if (fish.isDead) continue;
            
            const dist = Math.abs(fish.x - x);
            if (dist < beamW + fish.width * 0.4) {
                fish.health -= 6;
                
                for (let k = 0; k < 8; k++) {
                    this.particleList.push(new Particle(fish.x, fish.y, 'spark', '#ffd700'));
                }

                if (fish.health <= 0) {
                    fish.isDead = true;
                    this.stats.fishCaught++;
                    let pts = fish.points * (this.isDoubleScore ? 2 : 1);
                    this.score += pts;
                    
                    this.textList.push(new FloatingText(fish.x, fish.y - 10, `+${pts}`, '#ffd700'));
                    
                    for (let j = 0; j < 5; j++) {
                        this.particleList.push(new Particle(fish.x, fish.y, 'gold'));
                    }
                }
            }
        }
        
        document.getElementById('score-val').textContent = this.score;
        soundCtrl.playCoin();
    }

    useBomb() {
        if (this.cooldowns.bomb.current > 0 || this.gameState !== 'PLAYING') return;

        this.cooldowns.bomb.current = this.cooldowns.bomb.duration;
        document.getElementById('btn-bomb').classList.add('cooldown');

        soundCtrl.playExplosion();

        const x = this.width * 0.3 + Math.random() * this.width * 0.4;
        const y = this.height * 0.3 + Math.random() * this.height * 0.4;

        const superNet = new Net(x, y, 3.5);
        superNet.color = '#ff007b';
        this.netList.push(superNet);

        this.screenShake = 20;

        for (let i = 0; i < 30; i++) {
            this.particleList.push(new Particle(x, y, 'spark', '#ff007b'));
        }
    }

    useDouble() {
        if (this.cooldowns.double.current > 0 || this.gameState !== 'PLAYING') return;

        this.isDoubleScore = true;
        this.doubleScoreTimer = 600;
        this.cooldowns.double.current = this.cooldowns.double.duration;
        document.getElementById('btn-double').classList.add('cooldown', 'active-skill');

        soundCtrl.playDouble();
        this.showEventBanner('雙倍得分啟動！大肆捕獵吧！');
    }

    spawnFish() {
        if (this.gameState !== 'PLAYING') return;

        const rand = Math.random();
        let type = 'goldfish';
        
        if (rand > 0.95) {
            type = 'shark';
        } else if (rand > 0.82) {
            type = 'anglerfish';
        } else if (rand > 0.60) {
            type = 'bluetang';
        } else if (rand > 0.30) {
            type = 'clownfish';
        }

        const side = Math.random() < 0.5 ? -60 : this.width + 60;
        const y = 80 + Math.random() * (this.height - 180);

        this.fishList.push(new Fish(type, side, y));
    }

    spawnFishAt(x, y, speedMult = 1.0) {
        const rand = Math.random();
        let type = 'goldfish';
        if (rand > 0.7) type = 'clownfish';
        if (rand > 0.9) type = 'bluetang';

        const fish = new Fish(type, x, y, speedMult);
        this.fishList.push(fish);
        return fish;
    }

    update() {
        if (this.screenShake > 0) {
            this.screenShake -= 1;
        }

        if (Math.random() < 0.08) {
            this.particleList.push(new Particle(
                Math.random() * this.width,
                this.height + 10,
                'bubble'
            ));
        }

        if (this.isFrozen) {
            this.freezeTimer--;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                document.getElementById('btn-freeze').classList.remove('active-skill');
            }
        }

        if (this.isDoubleScore) {
            this.doubleScoreTimer--;
            if (this.doubleScoreTimer <= 0) {
                this.isDoubleScore = false;
                document.getElementById('btn-double').classList.remove('active-skill');
            }
        }

        if (this.isLaserActive) {
            this.laserTimer--;
            if (this.laserTimer <= 0) {
                this.isLaserActive = false;
                document.getElementById('btn-laser').classList.remove('active-skill');
            }
        }

        if (this.cannon) {
            this.cannon.update();
        }

        for (let i = this.bulletList.length - 1; i >= 0; i--) {
            const bullet = this.bulletList[i];
            bullet.update(this.width, this.height);
            
            if (bullet.isDead) {
                this.explodeBullet(bullet.x, bullet.y);
                this.bulletList.splice(i, 1);
            }
        }

        for (let i = this.netList.length - 1; i >= 0; i--) {
            const net = this.netList[i];
            net.update();
            this.evaluateCatch(net);

            if (net.isDead) {
                this.netList.splice(i, 1);
            }
        }

        let aliveBossCount = 0;
        for (let i = this.fishList.length - 1; i >= 0; i--) {
            const fish = this.fishList[i];
            fish.update(this.isFrozen);

            if (fish.typeKey === 'dragon') aliveBossCount++;

            const isOffscreen = (fish.vx > 0 && fish.x > this.width + 160) || 
                                (fish.vx < 0 && fish.x < -160);

            if (isOffscreen || (fish.isDead && fish.fadeAlpha <= 0)) {
                this.fishList.splice(i, 1);
            }
        }

        if (this.fishList.length < 5 && !this.activeEvent) {
            this.spawnFish();
        }

        for (let i = this.particleList.length - 1; i >= 0; i--) {
            const part = this.particleList[i];
            const arrivedScore = part.update(this.hudScoreRect);
            
            if (arrivedScore) {
                for (let k = 0; k < 3; k++) {
                    this.particleList.push(new Particle(
                        this.hudScoreRect.x + this.hudScoreRect.w / 2 + (Math.random() - 0.5) * 20,
                        this.hudScoreRect.y + this.hudScoreRect.h / 2 + (Math.random() - 0.5) * 10,
                        'spark',
                        '#ffd700'
                    ));
                }
            }

            if (part.isDead) {
                this.particleList.splice(i, 1);
            }
        }

        for (let i = this.textList.length - 1; i >= 0; i--) {
            const txt = this.textList[i];
            txt.update();
            if (txt.isDead) {
                this.textList.splice(i, 1);
            }
        }

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        const comboVal = document.getElementById('combo-val');
        if (this.combo > 1) {
            comboVal.textContent = `x${this.combo}`;
        } else {
            comboVal.textContent = 'x1';
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.save();
        if (this.screenShake > 0) {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }

        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#020713');
        bgGrad.addColorStop(0.5, '#051126');
        bgGrad.addColorStop(1, '#1b0f2e');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawSeaweed();
        this.drawSunRays();

        for (const fish of this.fishList) {
            fish.draw(this.ctx);
        }

        for (const bullet of this.bulletList) {
            bullet.draw(this.ctx);
        }

        this.drawLaserBeam();

        for (const net of this.netList) {
            net.draw(this.ctx);
        }

        for (const part of this.particleList) {
            part.draw(this.ctx);
        }

        for (const txt of this.textList) {
            txt.draw(this.ctx);
        }

        if (this.cannon) {
            this.cannon.draw(this.ctx);
        }

        if (this.isFrozen) {
            this.drawIceOverlay();
        }

        if (this.isDoubleScore) {
            this.drawDoubleScoreOverlay();
        }

        this.ctx.restore();
    }

    // 當處於首頁或結束頁時，依然維持背景動畫的平滑渲染
    drawStaticOrOverlayBackground() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#020713');
        bgGrad.addColorStop(0.5, '#051126');
        bgGrad.addColorStop(1, '#1b0f2e');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawSeaweed();
        this.drawSunRays();

        // 背景飄逸泡泡
        if (Math.random() < 0.05) {
            this.particleList.push(new Particle(
                Math.random() * this.width,
                this.height + 10,
                'bubble'
            ));
        }
        const dummyHud = { x: 0, y: 0, w: 0, h: 0 };
        for (let i = this.particleList.length - 1; i >= 0; i--) {
            const part = this.particleList[i];
            if (part.type === 'bubble') {
                part.update(dummyHud);
                part.draw(this.ctx);
            }
            if (part.isDead) {
                this.particleList.splice(i, 1);
            }
        }
    }

    drawSunRays() {
        this.sunRaysPhase += 0.004;
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        
        const rayCount = 4;
        const angleWidth = 0.08;

        for (let i = 0; i < rayCount; i++) {
            const centerAngle = Math.PI / 4 + Math.sin(this.sunRaysPhase + i * 1.5) * 0.15;
            
            const grad = this.ctx.createRadialGradient(
                this.width * 0.3, -50, 0,
                this.width * 0.3, -50, this.height * 1.2
            );
            grad.addColorStop(0, 'rgba(0, 243, 255, 0.12)');
            grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.03)');
            grad.addColorStop(1, 'rgba(0, 243, 255, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.moveTo(this.width * 0.3, -50);
            
            const startX = this.width * 0.3 + Math.cos(centerAngle - angleWidth) * this.height * 1.5;
            const startY = -50 + Math.sin(centerAngle - angleWidth) * this.height * 1.5;
            const endX = this.width * 0.3 + Math.cos(centerAngle + angleWidth) * this.height * 1.5;
            const endY = -50 + Math.sin(centerAngle + angleWidth) * this.height * 1.5;
            
            this.ctx.lineTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawSeaweed() {
        const time = Date.now() * 0.0015;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        const weedCount = 8;
        const spacing = this.width / (weedCount + 1);

        for (let i = 0; i < weedCount; i++) {
            const x = spacing * (i + 1);
            const height = 120 + Math.sin(i * 45) * 40;
            const sway = Math.sin(time + i) * 15;

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.height);
            this.ctx.quadraticCurveTo(
                x - sway * 0.5, this.height - height * 0.5,
                x + sway, this.height - height
            );
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawLaserBeam() {
        if (this.laserBeamTimer > 0) {
            this.laserBeamTimer--;
            
            const x = this.laserX;
            const w = 90 * (this.laserBeamTimer / 45);

            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';

            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
            this.ctx.fillRect(x - w, 0, w * 2, this.height);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x - w * 0.3, 0, w * 0.6, this.height);

            if (Math.random() < 0.5) {
                for (let y = 0; y < this.height; y += 80) {
                    this.particleList.push(new Particle(
                        x + (Math.random() - 0.5) * w * 1.5,
                        y + (Math.random() - 0.5) * 40,
                        'spark',
                        '#ffd700'
                    ));
                }
            }

            this.ctx.restore();
        }
    }

    drawIceOverlay() {
        this.ctx.save();
        const grad = this.ctx.createRadialGradient(
            this.width/2, this.height/2, this.height * 0.4,
            this.width/2, this.height/2, this.height * 0.8
        );
        grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0.35)');
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(0, 0, this.width, this.height);
        
        this.ctx.restore();
    }

    drawDoubleScoreOverlay() {
        this.ctx.save();
        const flash = Math.abs(Math.sin(Date.now() * 0.01));
        this.ctx.strokeStyle = `rgba(255, 0, 123, ${0.2 + flash * 0.4})`;
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(0, 0, this.width, this.height);
        this.ctx.restore();
    }

    loop() {
        if (this.gameState === 'PLAYING') {
            this.update();
            this.draw();
        } else {
            // 在開始/結束畫面也維持海水光影動畫
            this.drawStaticOrOverlayBackground();
        }
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    loadAndProcessAssets(() => {
        game.loop();
    });
});
