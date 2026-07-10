/* ==========================================================================
   Neon Deep Sea Fishing - game.js
   Core Game Engine, Synthesized Audio, Canvas Rendering, & Mechanics
   ========================================================================== */

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

    // 播放發射子彈音效 (氣泡上升/能量充能聲)
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

    // 播放捕獲成功/金幣音效 (雙音階清脆響鈴)
    playCoin() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // 第一個高音
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

    // 播放炸彈爆炸音效 (低頻白噪音爆炸)
    playExplosion() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // 1. 低頻正弦波掃描
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

        // 2. 噪聲緩衝區模擬爆炸碎裂聲
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5秒
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // 噪聲濾波器
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

    // 播放雷射發射音效
    playLaser() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);

        // 加上低頻震盪 (LFO)
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 30; // 30Hz
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

    // 播放冰凍音效 (高音水晶撞擊聲)
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

    // 播放雙倍得分音效 (輕快上揚音階)
    playDouble() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
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

    // 播放隨機背景氣泡咕嚕聲
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
        name: '霓虹黃金魚',
        points: 50,
        speed: 1.8,
        width: 45,
        height: 25,
        health: 1,
        color: '#ffb800',
        glowColor: 'rgba(255, 184, 0, 0.4)',
        scale: 1.0
    },
    clownfish: {
        name: '霓虹小丑魚',
        points: 100,
        speed: 1.4,
        width: 55,
        height: 32,
        health: 1,
        color: '#ff5c00',
        glowColor: 'rgba(255, 92, 0, 0.4)',
        scale: 1.0
    },
    bluetang: {
        name: '藍唐王魚',
        points: 200,
        speed: 1.5,
        width: 65,
        height: 40,
        health: 1,
        color: '#0066ff',
        glowColor: 'rgba(0, 102, 255, 0.5)',
        scale: 1.0
    },
    anglerfish: {
        name: '深海鮟鱇魚',
        points: 500,
        speed: 1.0,
        width: 80,
        height: 60,
        health: 3,
        color: '#a000ff',
        glowColor: 'rgba(160, 0, 255, 0.5)',
        scale: 1.0
    },
    shark: {
        name: '深海狂暴巨鯊',
        points: 1000,
        speed: 0.8,
        width: 150,
        height: 80,
        health: 6,
        color: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.6)',
        scale: 1.0
    },
    dragon: { // Boss 魚
        name: 'Boss 霓虹黃金龍',
        points: 5000,
        speed: 0.6,
        width: 65, // 頭部半徑大小
        height: 65,
        health: 30,
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.8)',
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
        this.glowColor = config.glowColor;
        this.isBoss = !!config.isBoss;

        this.x = startX;
        this.y = startY;
        this.vx = (startX < 0) ? (this.speed) : (-this.speed);
        this.vy = (Math.random() - 0.5) * 0.3; // 上下微幅飄移
        
        this.angle = Math.atan2(this.vy, this.vx);
        this.swimCycle = Math.random() * 100; // 尾巴擺動相位
        this.isDead = false;
        this.deathTimer = 0; // 死亡動畫計時
        this.fadeAlpha = 1.0;

        // Boss 霓虹龍的節點跟隨記錄 (尾隨算法)
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
            this.fadeAlpha = Math.max(0, 1 - this.deathTimer / 30); // 30幀漸隱
            this.y += 0.4; // 緩慢下沉
            this.angle += 0.05; // 旋轉死亡效果
            return;
        }

        if (isFrozen) {
            return; // 冰凍時完全不動
        }

        if (this.isBoss) {
            this.swimCycle += 0.035;
            this.vy = Math.sin(this.swimCycle) * 1.6;
        } else {
            this.swimCycle += 0.12;
            if (Math.random() < 0.015) {
                this.vy = (Math.random() - 0.5) * 0.7;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.angle = Math.atan2(this.vy, this.vx);

        // 更新 Boss 身體節點的座標與角度
        if (this.isBoss) {
            let prevX = this.x;
            let prevY = this.y;
            const distBetweenSegments = 24;
            
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

    // 繪製寫實精美魚類 (立體漸層、花紋細節與精緻眼部)
    drawNormalFish(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 面朝左側時進行水平鏡像，防止魚翻肚
        const facingLeft = this.vx < 0;
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        // 動態尾巴搖擺相位
        const tailSwing = Math.sin(this.swimCycle) * 0.28;
        const w = this.width;
        const h = this.height;

        // 💡 底部霓虹霓光圈 (柔和漸層陰影，不耗效能)
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 16;

        if (this.typeKey === 'goldfish') {
            this.drawGoldfishDetail(ctx, w, h, tailSwing);
        } else if (this.typeKey === 'clownfish') {
            this.drawClownfishDetail(ctx, w, h, tailSwing);
        } else if (this.typeKey === 'bluetang') {
            this.drawBlueTangDetail(ctx, w, h, tailSwing);
        } else if (this.typeKey === 'anglerfish') {
            this.drawAnglerfishDetail(ctx, w, h, tailSwing);
        } else if (this.typeKey === 'shark') {
            this.drawSharkDetail(ctx, w, h, tailSwing);
        }

        ctx.restore();

        // 繪製血量條
        if (this.health < this.maxHealth && this.health > 0) {
            this.drawHealthBar(ctx, this.x - w/2, this.y - h * 0.7, w);
        }
    }

    // 1. 霓虹黃金魚 (金光鱗片、長擺尾巴與精美漸層)
    drawGoldfishDetail(ctx, w, h, tailSwing) {
        // 大尾鰭 (雙層半透明飄逸感)
        ctx.save();
        ctx.translate(-w * 0.35, 0);
        ctx.rotate(tailSwing * 1.5);
        const tailGrad = ctx.createLinearGradient(-w * 0.5, 0, 0, 0);
        tailGrad.addColorStop(0, 'rgba(255, 60, 0, 0.9)');
        tailGrad.addColorStop(0.5, 'rgba(255, 184, 0, 0.7)');
        tailGrad.addColorStop(1, 'rgba(255, 230, 0, 0.2)');
        ctx.fillStyle = tailGrad;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-w * 0.3, -h * 0.9, -w * 0.6, -h * 1.1, -w * 0.7, -h * 0.7);
        ctx.bezierCurveTo(-w * 0.55, -h * 0.2, -w * 0.55, h * 0.2, -w * 0.7, h * 0.7);
        ctx.bezierCurveTo(-w * 0.6, h * 1.1, -w * 0.3, h * 0.9, 0, 0);
        ctx.fill();
        
        // 尾翼紋理線
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-w * 0.3, i * h * 0.2, -w * 0.62, i * h * 0.22);
            ctx.stroke();
        }
        ctx.restore();

        // 魚身主體 (金黃立體徑向漸層)
        const bodyGrad = ctx.createRadialGradient(w * 0.15, -h * 0.1, 2, 0, 0, w * 0.5);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, '#ffcc00');
        bodyGrad.addColorStop(0.8, '#ff5100');
        bodyGrad.addColorStop(1, '#9b1c00');
        ctx.fillStyle = bodyGrad;
        
        ctx.beginPath();
        ctx.moveTo(w * 0.45, 0);
        ctx.bezierCurveTo(w * 0.25, -h * 0.65, -w * 0.2, -h * 0.6, -w * 0.4, 0);
        ctx.bezierCurveTo(-w * 0.2, h * 0.6, w * 0.25, h * 0.65, w * 0.45, 0);
        ctx.fill();

        // 魚背鰭 & 腹鰭 (紅色半透明)
        ctx.fillStyle = 'rgba(255, 60, 0, 0.85)';
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.38);
        ctx.quadraticCurveTo(-w * 0.15, -h * 0.9, -w * 0.3, -h * 0.5);
        ctx.lineTo(-w * 0.12, -h * 0.3);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-w * 0.1, h * 0.38);
        ctx.quadraticCurveTo(-w * 0.2, h * 0.7, -w * 0.3, h * 0.4);
        ctx.fill();

        // 精緻亮眼睛
        this.drawRealisticEye(ctx, w * 0.22, -h * 0.12, 5.5, '#ffd700');
    }

    // 2. 霓虹小丑魚 (立體橙色、三道帶黑色邊框的白斑紋與圓潤胸鰭)
    drawClownfishDetail(ctx, w, h, tailSwing) {
        // 擺動尾巴
        ctx.save();
        ctx.translate(-w * 0.35, 0);
        ctx.rotate(tailSwing * 1.3);
        ctx.fillStyle = '#ff5c00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-w * 0.18, -h * 0.5, -w * 0.28, -h * 0.4);
        ctx.quadraticCurveTo(-w * 0.2, 0, -w * 0.28, h * 0.4);
        ctx.quadraticCurveTo(-w * 0.18, h * 0.5, 0, 0);
        ctx.fill();
        ctx.stroke();

        // 尾部黑邊與白端
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-w * 0.24, 0, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // 魚身主體 (圓潤且色彩飽和)
        ctx.save();
        const bodyGrad = ctx.createRadialGradient(w * 0.1, -h * 0.1, 2, 0, 0, w * 0.52);
        bodyGrad.addColorStop(0, '#ffa600');
        bodyGrad.addColorStop(0.6, '#ff5c00');
        bodyGrad.addColorStop(1, '#a62400');
        ctx.fillStyle = bodyGrad;
        
        // 描繪主身路徑
        ctx.beginPath();
        ctx.moveTo(w * 0.45, 0);
        ctx.bezierCurveTo(w * 0.25, -h * 0.65, -w * 0.25, -h * 0.55, -w * 0.42, 0);
        ctx.bezierCurveTo(-w * 0.25, h * 0.55, w * 0.25, h * 0.65, w * 0.45, 0);
        ctx.fill();
        ctx.clip(); // 使用 clip 來只在魚身繪製白色橫帶！這能保證線條邊緣完美契合魚身！

        // 繪製三道標誌性白色條紋 (帶有黑框線)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#ffffff';
        
        // 條紋1 (頭部)
        ctx.beginPath();
        ctx.ellipse(w * 0.18, 0, w * 0.08, h * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 條紋2 (身中)
        ctx.beginPath();
        ctx.ellipse(-w * 0.06, 0, w * 0.09, h * 0.68, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 條紋3 (尾前)
        ctx.beginPath();
        ctx.ellipse(-w * 0.28, 0, w * 0.05, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore(); // 結束裁剪 clip

        // 外框補描一次黑色邊緣，讓圖形更立體
        ctx.strokeStyle = '#2b0700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.45, 0);
        ctx.bezierCurveTo(w * 0.25, -h * 0.65, -w * 0.25, -h * 0.55, -w * 0.42, 0);
        ctx.bezierCurveTo(-w * 0.25, h * 0.55, w * 0.25, h * 0.65, w * 0.45, 0);
        ctx.stroke();

        // 圓潤胸鰭 (橘黃黑邊)
        ctx.fillStyle = '#ffa600';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, h * 0.2, w * 0.12, h * 0.2, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 圓潤背鰭
        ctx.fillStyle = '#ff5c00';
        ctx.beginPath();
        ctx.ellipse(-w * 0.05, -h * 0.45, w * 0.2, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 亮眼睛
        this.drawRealisticEye(ctx, w * 0.24, -h * 0.1, 5, '#ffffff');
    }

    // 3. 藍唐王魚 (標誌性黑色倒鉤花紋、鮮黃胸鰭與黃色三角尾鰭)
    drawBlueTangDetail(ctx, w, h, tailSwing) {
        // 黃色三角尾翼
        ctx.save();
        ctx.translate(-w * 0.36, 0);
        ctx.rotate(tailSwing * 1.4);
        
        // 黃色漸變尾部
        const tailGrad = ctx.createLinearGradient(-w * 0.25, 0, 0, 0);
        tailGrad.addColorStop(0, '#ffd800');
        tailGrad.addColorStop(1, '#ff6600');
        ctx.fillStyle = tailGrad;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, -h * 0.12);
        ctx.lineTo(-w * 0.24, -h * 0.5);
        ctx.quadraticCurveTo(-w * 0.2, 0, -w * 0.24, h * 0.5);
        ctx.lineTo(0, h * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 魚身主體 (艷麗藍色徑向漸層)
        const bodyGrad = ctx.createRadialGradient(w * 0.12, -h * 0.1, 2, 0, 0, w * 0.5);
        bodyGrad.addColorStop(0, '#00dfff');
        bodyGrad.addColorStop(0.4, '#0055ff');
        bodyGrad.addColorStop(0.9, '#000c80');
        bodyGrad.addColorStop(1, '#00002b');
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.45, 0);
        ctx.bezierCurveTo(w * 0.25, -h * 0.65, -w * 0.22, -h * 0.52, -w * 0.4, 0);
        ctx.bezierCurveTo(-w * 0.22, h * 0.52, w * 0.25, h * 0.65, w * 0.45, 0);
        ctx.fill();

        // 黑色「調色盤」側身紋路 (寫實藍唐王魚特徵)
        ctx.fillStyle = '#0a0d1a';
        ctx.beginPath();
        ctx.moveTo(-w * 0.28, 0);
        ctx.bezierCurveTo(-w * 0.2, -h * 0.38, w * 0.05, -h * 0.38, w * 0.12, -h * 0.1);
        ctx.bezierCurveTo(w * 0.05, h * 0.05, -w * 0.12, -h * 0.15, -w * 0.1, h * 0.2);
        ctx.bezierCurveTo(-w * 0.18, h * 0.32, -w * 0.28, h * 0.1, -w * 0.28, 0);
        ctx.fill();

        // 鮮黃色胸鰭
        ctx.fillStyle = '#ffd800';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(-w * 0.05, h * 0.1, w * 0.13, h * 0.12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 藍色大背鰭
        ctx.fillStyle = '#0055ff';
        ctx.beginPath();
        ctx.moveTo(-w * 0.15, -h * 0.4);
        ctx.quadraticCurveTo(w * 0.05, -h * 0.65, w * 0.22, -h * 0.3);
        ctx.lineTo(w * 0.1, -h * 0.28);
        ctx.closePath();
        ctx.fill();

        // 亮眼睛
        this.drawRealisticEye(ctx, w * 0.25, -h * 0.12, 5.5, '#00ffff');
    }

    // 4. 深海鮟鱇魚 (怪異大口、鋒利牙齒、黃色發光頭燈)
    drawAnglerfishDetail(ctx, w, h, tailSwing) {
        // 怪異的半透明帶刺尾巴
        ctx.save();
        ctx.translate(-w * 0.38, h * 0.05);
        ctx.rotate(tailSwing * 1.2);
        ctx.fillStyle = 'rgba(160, 0, 255, 0.45)';
        ctx.strokeStyle = '#a000ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-w * 0.25, -h * 0.3);
        ctx.lineTo(-w * 0.18, 0);
        ctx.lineTo(-w * 0.25, h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 鮟鱇魚主體 (暗紫到黑的粗獷立體漸層)
        const bodyGrad = ctx.createRadialGradient(w * 0.15, -h * 0.05, 2, 0, 0, w * 0.52);
        bodyGrad.addColorStop(0, '#c75cff');
        bodyGrad.addColorStop(0.5, '#6a00b0');
        bodyGrad.addColorStop(0.9, '#24003d');
        bodyGrad.addColorStop(1, '#0c0014');
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        ctx.moveTo(w * 0.42, -h * 0.08); // 嘴上緣
        ctx.bezierCurveTo(w * 0.28, -h * 0.72, -w * 0.22, -h * 0.52, -w * 0.4, h * 0.05);
        ctx.bezierCurveTo(-w * 0.25, h * 0.58, w * 0.1, h * 0.65, w * 0.38, h * 0.25); // 嘴下緣
        ctx.lineTo(w * 0.08, h * 0.06); // 裂嘴深處
        ctx.closePath();
        ctx.fill();

        // 恐怖的鋸齒狀白色大牙 (繪製多個白色實心三角形)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3d0066';
        ctx.lineWidth = 0.6;
        
        // 上排牙
        const teethUpper = [
            {x: w * 0.38, y: -h * 0.06, tx: w * 0.36, ty: h * 0.06},
            {x: w * 0.29, y: -h * 0.03, tx: w * 0.26, ty: h * 0.08},
            {x: w * 0.20, y: 0,          tx: w * 0.18, ty: h * 0.09},
            {x: w * 0.12, y: h * 0.03,  tx: w * 0.11, ty: h * 0.1}
        ];
        teethUpper.forEach(t => {
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.tx, t.ty);
            ctx.lineTo(t.x - 4, t.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // 下排牙 (朝上凸出)
        const teethLower = [
            {x: w * 0.36, y: h * 0.23, tx: w * 0.34, ty: -h * 0.02},
            {x: w * 0.27, y: h * 0.18, tx: w * 0.25, ty: -h * 0.03},
            {x: w * 0.18, y: h * 0.12, tx: w * 0.17, ty: -h * 0.01}
        ];
        teethLower.forEach(t => {
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.tx, t.ty);
            ctx.lineTo(t.x - 3, t.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // 懸吊的發光燈泡
        ctx.save();
        ctx.strokeStyle = '#a000ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, -h * 0.28);
        ctx.quadraticCurveTo(w * 0.36, -h * 0.72, w * 0.34, -h * 0.85); // 燈泡吊桿
        ctx.stroke();

        // 燈泡本體 (霓虹黃光發光核心)
        const bulbGrad = ctx.createRadialGradient(w * 0.34, -h * 0.85, 1, w * 0.34, -h * 0.85, 10);
        bulbGrad.addColorStop(0, '#ffffff');
        bulbGrad.addColorStop(0.3, '#ffea00');
        bulbGrad.addColorStop(0.8, 'rgba(255, 234, 0, 0.4)');
        bulbGrad.addColorStop(1, 'rgba(255, 234, 0, 0)');
        ctx.fillStyle = bulbGrad;
        ctx.beginPath();
        ctx.arc(w * 0.34, -h * 0.85, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 綠黃色玻璃眼
        this.drawRealisticEye(ctx, w * 0.15, -h * 0.26, 4.8, '#aaff00');
    }

    // 5. 深海狂暴巨鯊 (青灰色流線身軀、白色腹部、鯊魚鰓裂、尖銳背鰭)
    drawSharkDetail(ctx, w, h, tailSwing) {
        // 大擺幅尾翼
        ctx.save();
        ctx.translate(-w * 0.42, 0);
        ctx.rotate(tailSwing * 1.1);
        
        const tailGrad = ctx.createLinearGradient(-w * 0.2, 0, 0, 0);
        tailGrad.addColorStop(0, '#00f0ff');
        tailGrad.addColorStop(1, '#005c8a');
        ctx.fillStyle = tailGrad;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-w * 0.18, -h * 0.75, -w * 0.28, -h * 0.82);
        ctx.quadraticCurveTo(-w * 0.2, -h * 0.1, -w * 0.26, h * 0.52);
        ctx.quadraticCurveTo(-w * 0.12, h * 0.1, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 鯊魚背部青灰漸層
        const backGrad = ctx.createLinearGradient(0, -h * 0.4, 0, h * 0.4);
        backGrad.addColorStop(0, '#005b7f');
        backGrad.addColorStop(0.4, '#00b7d6');
        backGrad.addColorStop(0.7, '#dafbff'); // 腹部漸白
        backGrad.addColorStop(1, '#ffffff');

        // 畫流線型鯊魚身
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.48, -h * 0.05); // 吻部尖端
        ctx.bezierCurveTo(w * 0.28, -h * 0.52, -w * 0.28, -h * 0.45, -w * 0.45, 0);
        ctx.bezierCurveTo(-w * 0.28, h * 0.52, w * 0.2, h * 0.58, w * 0.48, -h * 0.05);
        ctx.fill();

        // 巨型三角背鰭
        ctx.fillStyle = '#005b7f';
        ctx.beginPath();
        ctx.moveTo(-w * 0.02, -h * 0.32);
        ctx.quadraticCurveTo(-w * 0.1, -h * 0.85, -w * 0.24, -h * 0.72);
        ctx.quadraticCurveTo(-w * 0.2, -h * 0.3, -w * 0.15, -h * 0.25);
        ctx.closePath();
        ctx.fill();

        // 胸鰭
        ctx.fillStyle = '#006c96';
        ctx.beginPath();
        ctx.moveTo(w * 0.08, h * 0.15);
        ctx.quadraticCurveTo(w * 0.06, h * 0.72, -w * 0.14, h * 0.65);
        ctx.quadraticCurveTo(-w * 0.08, h * 0.25, -w * 0.02, h * 0.15);
        ctx.closePath();
        ctx.fill();

        // 鯊魚鰓裂 (3道暗灰色弧線)
        ctx.strokeStyle = '#003a52';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(w * 0.18 - i * 6, h * 0.02, 10, -Math.PI / 4, Math.PI / 4);
            ctx.stroke();
        }

        // 霸氣生氣眼與黑白眼仁
        this.drawRealisticEye(ctx, w * 0.32, -h * 0.1, 6, '#ff0055');
    }

    // 公用的精緻寫實眼睛繪製
    drawRealisticEye(ctx, x, y, radius, irisColor) {
        ctx.save();
        // 眼白
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 虹膜 (彩色部分)
        ctx.fillStyle = irisColor;
        ctx.beginPath();
        ctx.arc(x + radius * 0.15, y, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // 瞳孔
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // 高光點
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - radius * 0.22, y - radius * 0.22, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 6. 繪製 Boss 霓虹黃金龍 (極致華麗的黃金龍頭與鱗片身軀)
    drawBossDragon(ctx) {
        const radius = this.width * 0.38;

        // 1. 繪製身軀節點 (從尾到頭繪製，實現遮蓋與層次感)
        for (let i = this.segmentCount - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const sizeRatio = (1 - (i / this.segmentCount) * 0.42); // 身軀遞減
            const segRadius = radius * sizeRatio;

            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            // 💡 霓虹外發光陰影
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 18;

            // 雙層立體漸層身軀 (金光閃爍)
            const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, segRadius);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.3, '#ffe853');
            bodyGrad.addColorStop(0.7, '#ff8000');
            bodyGrad.addColorStop(1, '#941e00');
            ctx.fillStyle = bodyGrad;
            
            ctx.beginPath();
            ctx.arc(0, 0, segRadius, 0, Math.PI * 2);
            ctx.fill();

            // 龍背刺 / 鰭
            ctx.fillStyle = '#ff1a00';
            ctx.shadowBlur = 5;
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

        // 2. 繪製龍頭
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const facingLeft = this.vx < 0;
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 24;

        // 龍角 (立體紅色分叉鹿角)
        ctx.strokeStyle = '#ff2b00';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // 主角
        ctx.moveTo(-radius * 0.15, -radius * 0.8);
        ctx.quadraticCurveTo(-radius * 0.7, -radius * 1.6, -radius * 1.2, -radius * 1.8);
        // 分叉角1
        ctx.moveTo(-radius * 0.5, -radius * 1.25);
        ctx.quadraticCurveTo(-radius * 0.4, -radius * 1.6, -radius * 0.2, -radius * 1.7);
        // 分叉角2
        ctx.moveTo(-radius * 0.8, -radius * 1.5);
        ctx.quadraticCurveTo(-radius * 0.9, -radius * 1.8, -radius * 0.75, -radius * 1.95);
        ctx.stroke();

        // 龍鬚 (擺動的兩條金色長龍鬚)
        const whiskersSway = Math.sin(this.swimCycle * 2) * 12;
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(radius * 0.9, radius * 0.15);
        ctx.bezierCurveTo(radius * 1.4, radius * 0.5, radius * 1.6, radius * 0.6 + whiskersSway, radius * 2.1, radius * 0.4 + whiskersSway);
        ctx.moveTo(radius * 0.9, -radius * 0.15);
        ctx.bezierCurveTo(radius * 1.4, -radius * 0.5, radius * 1.6, -radius * 0.6 - whiskersSway, radius * 2.1, -radius * 0.4 - whiskersSway);
        ctx.stroke();

        // 龍頭主體 (立體黃金漸層)
        const headGrad = ctx.createRadialGradient(radius * 0.3, -radius * 0.1, 2, 0, 0, radius * 1.1);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.3, '#ffd700');
        headGrad.addColorStop(0.8, '#ff6600');
        headGrad.addColorStop(1, '#a61c00');
        ctx.fillStyle = headGrad;

        ctx.beginPath();
        ctx.moveTo(radius * 1.28, 0); // 鼻尖
        ctx.quadraticCurveTo(radius * 0.9, -radius * 0.7, 0, -radius * 0.72); // 龍額
        ctx.quadraticCurveTo(-radius * 0.9, -radius * 0.8, -radius * 1.1, 0); // 枕骨
        ctx.quadraticCurveTo(-radius * 0.85, radius * 0.8, 0, radius * 0.72); // 龍腮
        ctx.quadraticCurveTo(radius * 0.9, radius * 0.7, radius * 1.28, 0);
        ctx.closePath();
        ctx.fill();

        // 威武龍眼 (霸氣紅瞳、眼眶描黑)
        this.drawRealisticEye(ctx, radius * 0.42, -radius * 0.35, 8.5, '#ff003c');

        ctx.restore();

        // 3. 繪製 Boss 頂部橫條大血條
        if (this.health > 0) {
            this.drawBossHealthBar(ctx);
        }
    }

    // 普通魚血條
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

    // Boss 專屬頂部大血條
    drawBossHealthBar(ctx) {
        const barW = ctx.canvas.width * 0.01 * (60 / (window.devicePixelRatio || 1)) || 280; // 寬度適應
        const realBarW = Math.min(barW, 400);
        const barH = 10;
        // 使用 CSS 尺寸繪製
        const x = (ctx.canvas.width / (window.devicePixelRatio || 1) - realBarW) / 2;
        const y = 80;
        const pct = Math.max(0, this.health / this.maxHealth);

        ctx.save();
        // 底色
        ctx.fillStyle = 'rgba(6, 18, 38, 0.7)';
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, realBarW, barH);
        ctx.strokeRect(x, y, realBarW, barH);

        // 血條漸變
        const bloodGrad = ctx.createLinearGradient(x, 0, x + realBarW, 0);
        bloodGrad.addColorStop(0, '#ff007b');
        bloodGrad.addColorStop(1, '#ffd700');
        ctx.fillStyle = bloodGrad;
        ctx.fillRect(x, y, realBarW * pct, barH);

        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name + ` (${this.health}/${this.maxHealth})`, x + realBarW / 2, y - 5);
        ctx.restore();
    }

    // 碰撞體積判定 (與圓形網碰撞)
    checkCollision(netX, netY, netRadius) {
        if (this.isDead) return false;
        
        const dx = this.x - netX;
        const dy = this.y - netY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = this.isBoss ? this.width * 0.95 : Math.max(this.width, this.height) * 0.45;

        if (dist < netRadius + hitRadius) {
            return true;
        }

        // 如果是 Boss，額外檢查每一個身軀節點是否在捕魚網內
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
        this.angle = 0; // 弧度
        this.recoil = 0; // 後座力伸縮像素
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
        ctx.rotate(this.angle + Math.PI / 2); // 轉向垂直向上

        const rectLength = this.height - this.recoil;

        // 1. 砲管外發光
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -rectLength);
        ctx.stroke();

        // 2. 砲管主體
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -rectLength);
        ctx.stroke();

        // 3. 雙槍管側翼
        ctx.fillStyle = '#9d00ff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-14, -rectLength * 0.6, 6, rectLength * 0.5);
        ctx.fillRect(8, -rectLength * 0.6, 6, rectLength * 0.5);

        // 4. 砲台底座 (半圓)
        ctx.fillStyle = 'rgba(6, 18, 38, 0.9)';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(0, 10, 26, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // 5. 底座內霓虹核心
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
        
        // 子彈飛行終點
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

        // 如果到達點擊位置附近，引爆
        if (this.distTraveled >= this.totalDist - 6) {
            this.isDead = true;
        }

        // 邊界判定
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

// ==========================================================================
// 5. 捕魚能量網與爆裂特效 (Net Class)
// ==========================================================================
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

// ==========================================================================
// 6. 粒子與文字特效 (Particles & FloatingText)
// ==========================================================================
class Particle {
    constructor(x, y, type = 'bubble', color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.type = type; // 'bubble', 'gold', 'spark', 'ice'
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
                    return true; // 告知外部生成觸達回饋
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
// 7. 遊戲核心邏輯控制器 (Game Controller)
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

        // CSS 邏輯維度 (全解析度適配核心)
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 實體陣列
        this.fishList = [];
        this.bulletList = [];
        this.netList = [];
        this.particleList = [];
        this.textList = [];

        // 砲台
        this.cannon = null;

        // 技能冷卻管理
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

        // 重置冷卻
        Object.keys(this.cooldowns).forEach(k => {
            this.cooldowns[k].current = 0;
            const overlay = document.getElementById(`cd-${k}`);
            if (overlay) overlay.style.height = '0%';
            const btn = document.getElementById(`btn-${k}`);
            if (btn) btn.classList.remove('cooldown', 'active-skill');
        });

        // 初始化砲台 (使用邏輯寬度與高度)
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
        // 1. 取得最新邏輯視口尺寸
        const cssWidth = window.innerWidth;
        const cssHeight = window.innerHeight;

        // 2. 取得設備像素比
        const dpr = window.devicePixelRatio || 1;

        // 3. 設定 Canvas 實體像素大小 (防止高解析度屏模糊)
        this.canvas.width = cssWidth * dpr;
        this.canvas.height = cssHeight * dpr;

        // 4. 設定 Canvas 的 CSS Style 大小 (保證不被擠壓变形)
        this.canvas.style.width = cssWidth + 'px';
        this.canvas.style.height = cssHeight + 'px';

        // 5. 保存邏輯寬高供遊戲更新邏輯使用 (完美解決 iPhone 17 Viewport 越界問題)
        this.width = cssWidth;
        this.height = cssHeight;

        // 6. 重置縮放，縮放背景繪製 Context
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        
        if (this.cannon) {
            this.cannon.resize(this.width, this.height);
        }

        // 重新獲取計分板的位置
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

        // 開始按鈕
        document.getElementById('btn-start').addEventListener('click', (e) => {
            e.stopPropagation();
            soundCtrl.init();
            this.start();
        });

        // 重新開始按鈕
        document.getElementById('btn-restart').addEventListener('click', (e) => {
            e.stopPropagation();
            soundCtrl.init();
            this.start();
        });

        // 移動端防抖與事件註冊
        this.canvas.addEventListener('touchstart', (e) => this.handleTap(e), { passive: false });
        this.canvas.addEventListener('mousedown', (e) => this.handleTap(e));

        // 技能點擊
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

        this.showEventBanner('魚潮來襲！大批霓虹魚群快速出沒！');
        
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

        // 避免點擊到技能面板欄
        const panel = document.getElementById('skills-panel');
        const panelRect = panel.getBoundingClientRect();
        if (clientX >= panelRect.left && clientX <= panelRect.right &&
            clientY >= panelRect.top && clientY <= panelRect.bottom) {
            return;
        }

        // 避免點擊頂部計分板
        if (clientY < 80) return;

        if (this.isLaserActive) {
            this.fireLaserBeam(clientX);
            return;
        }

        this.fireBullet(clientX, clientY);
    }

    fireBullet(targetX, targetY) {
        if (!this.cannon) return;

        // 用 CSS 邏輯像素點進行砲管轉向
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

                // 產生擊中火花
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
        }
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.loop();
});
