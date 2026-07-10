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

        gain.gain.setValueAtTime(0.15, now);
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
        name: '霓虹小金魚',
        points: 50,
        speed: 1.8,
        width: 32,
        height: 20,
        health: 1,
        color: '#ffb800',
        glowColor: 'rgba(255, 184, 0, 0.4)',
        scale: 1.0
    },
    clownfish: {
        name: '霓虹小丑魚',
        points: 100,
        speed: 1.4,
        width: 42,
        height: 26,
        health: 1,
        color: '#ff5c00',
        glowColor: 'rgba(255, 92, 0, 0.4)',
        scale: 1.1
    },
    bluetang: {
        name: '藍唐王魚',
        points: 200,
        speed: 1.5,
        width: 50,
        height: 32,
        health: 1,
        color: '#0066ff',
        glowColor: 'rgba(0, 102, 255, 0.5)',
        scale: 1.2
    },
    anglerfish: {
        name: '深海發光鮟鱇',
        points: 500,
        speed: 1.0,
        width: 65,
        height: 50,
        health: 2,
        color: '#a000ff',
        glowColor: 'rgba(160, 0, 255, 0.5)',
        scale: 1.3
    },
    shark: {
        name: '深海狂暴巨鯊',
        points: 1000,
        speed: 0.8,
        width: 120,
        height: 65,
        health: 5,
        color: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.6)',
        scale: 1.6
    },
    dragon: { // Boss 魚
        name: 'Boss 霓虹黃金龍',
        points: 5000,
        speed: 0.6,
        width: 70, // 頭部大小，身體用分段畫
        height: 70,
        health: 25,
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.8)',
        scale: 2.2,
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
        this.width = config.width * config.scale;
        this.height = config.height * config.scale;
        this.health = config.health;
        this.maxHealth = config.health;
        this.color = config.color;
        this.glowColor = config.glowColor;
        this.isBoss = !!config.isBoss;

        this.x = startX;
        this.y = startY;
        this.vx = (startX < 0) ? (this.speed) : (-this.speed);
        this.vy = (Math.random() - 0.5) * 0.4; // 稍微上下漂移
        
        this.angle = Math.atan2(this.vy, this.vx);
        this.swimCycle = Math.random() * 100; // 尾巴搖擺相位
        this.isDead = false;
        this.deathTimer = 0; // 死亡死亡動畫時間
        this.fadeAlpha = 1.0;

        // Boss 霓虹龍的節點跟隨記錄 (尾隨算法)
        if (this.isBoss) {
            this.segments = [];
            this.segmentCount = 12; // 12節身軀
            for (let i = 0; i < this.segmentCount; i++) {
                this.segments.push({ x: startX, y: startY });
            }
            this.vy = 0.2; // Boss 移動呈波浪形
        }
    }

    update(isFrozen) {
        if (this.isDead) {
            this.deathTimer += 1;
            this.fadeAlpha = Math.max(0, 1 - this.deathTimer / 30); // 30幀漸隱
            this.y += 0.5; // 緩慢下沉
            this.angle += 0.05; // 旋轉死亡效果
            return;
        }

        if (isFrozen) {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        // 恢復正常速度
        const currentSpeed = this.baseSpeed;
        this.vx = (this.vx >= 0) ? currentSpeed : -currentSpeed;

        if (this.isBoss) {
            // Boss 蛇形正弦運動
            this.swimCycle += 0.03;
            this.vy = Math.sin(this.swimCycle) * 1.5;
        } else {
            // 普通魚輕微隨機波動
            this.swimCycle += 0.1;
            if (Math.random() < 0.01) {
                this.vy = (Math.random() - 0.5) * 0.8;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.angle = Math.atan2(this.vy, this.vx);

        // 更新 Boss 身體節點
        if (this.isBoss) {
            // 第一節跟隨頭部
            let prevX = this.x;
            let prevY = this.y;
            const distBetweenSegments = 22; // 節點間距
            
            for (let i = 0; i < this.segmentCount; i++) {
                const seg = this.segments[i];
                const dx = prevX - seg.x;
                const dy = prevY - seg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > distBetweenSegments) {
                    const angle = Math.atan2(dy, dx);
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

    // 繪製一般魚 (貝茲曲線)
    drawNormalFish(ctx) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 如果面朝左側，需要上下翻轉避免魚肚朝上
        const facingLeft = this.vx < 0;
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        // 計算尾部搖擺
        const tailSwing = Math.sin(this.swimCycle) * 0.3;

        // 1. 繪製霓虹外發光背景層 (低成本發光：半透明加粗線條)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.fadeAlpha * 0.35;
        this.renderFishPath(ctx, tailSwing);
        ctx.stroke();

        // 2. 繪製內部白色亮區主體
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.fadeAlpha * 0.95;
        this.renderFishPath(ctx, tailSwing);
        ctx.stroke();

        // 3. 填色與細節 (漸層填充)
        const grad = ctx.createLinearGradient(-this.width/2, 0, this.width/2, 0);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
        ctx.globalAlpha = this.fadeAlpha * 0.3;
        ctx.fill();

        // 4. 畫眼睛
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = this.fadeAlpha;
        ctx.beginPath();
        ctx.arc(this.width * 0.28, -this.height * 0.12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.width * 0.29, -this.height * 0.12, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 鮟鱇魚燈籠特有發光燈泡
        if (this.typeKey === 'anglerfish') {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.width * 0.32, -this.height * 0.45, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // 重置
            
            // 燈泡吊桿
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.width * 0.15, -this.height * 0.15);
            ctx.quadraticCurveTo(this.width * 0.3, -this.height * 0.4, this.width * 0.32, -this.height * 0.45);
            ctx.stroke();
        }

        // 血量條 (如果有多血量且受傷過)
        if (this.health < this.maxHealth && this.health > 0) {
            this.drawHealthBar(ctx, -this.width/2, -this.height * 0.7, this.width);
        }
    }

    // 抽象出魚的外輪廓路徑，方便發光層與主體層複用
    renderFishPath(ctx, tailSwing) {
        const w = this.width;
        const h = this.height;

        ctx.beginPath();
        // 魚頭嘴部起點
        ctx.moveTo(w * 0.45, 0);
        // 上半身
        ctx.quadraticCurveTo(w * 0.1, -h * 0.55, -w * 0.15, -h * 0.15);
        // 尾部 (擺動)
        const tailX = -w * 0.5;
        const tailY = Math.sin(tailSwing) * (h * 0.35);
        ctx.lineTo(tailX, tailY);
        // 尾翼展開
        ctx.lineTo(tailX - 6, tailY - h * 0.35);
        ctx.quadraticCurveTo(tailX - 1, tailY, tailX - 6, tailY + h * 0.35);
        ctx.lineTo(tailX, tailY);
        // 下半身
        ctx.quadraticCurveTo(-w * 0.15, h * 0.15, w * 0.1, h * 0.55);
        // 回到頭部
        ctx.quadraticCurveTo(w * 0.35, h * 0.15, w * 0.45, 0);

        // 魚鰭細節
        ctx.moveTo(0, -h * 0.2);
        ctx.quadraticCurveTo(-w * 0.1, -h * 0.5, -w * 0.18, -h * 0.35);
        ctx.moveTo(-w * 0.05, h * 0.2);
        ctx.quadraticCurveTo(-w * 0.15, h * 0.5, -w * 0.22, h * 0.35);
    }

    // 繪製 Boss 霓虹黃金龍 (多節段貪食蛇動畫)
    drawBossDragon(ctx) {
        const radius = this.width * 0.38;

        // 1. 繪製身軀節點 (從後往前畫，讓頭蓋在最上方)
        for (let i = this.segmentCount - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const sizeRatio = (1 - (i / this.segmentCount) * 0.5); // 越往後身軀越細
            const segRadius = radius * sizeRatio;

            ctx.save();
            ctx.translate(seg.x, seg.y);

            // 霓虹發光背景
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 6;
            ctx.globalAlpha = this.fadeAlpha * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, segRadius, 0, Math.PI * 2);
            ctx.stroke();

            // 白色主體
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = this.fadeAlpha * 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, segRadius, 0, Math.PI * 2);
            ctx.stroke();

            // 內圈顏色填充
            const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, segRadius);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.5, this.color);
            bodyGrad.addColorStop(1, '#ff3c00'); // 帶點紅金漸變
            ctx.fillStyle = bodyGrad;
            ctx.globalAlpha = this.fadeAlpha * 0.4;
            ctx.beginPath();
            ctx.arc(0, 0, segRadius, 0, Math.PI * 2);
            ctx.fill();

            // 加上龍鱗鰭
            ctx.fillStyle = '#ff3c00';
            ctx.globalAlpha = this.fadeAlpha * 0.7;
            ctx.beginPath();
            ctx.arc(0, -segRadius, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, segRadius, 4, 0, Math.PI * 2);
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

        // 龍角 & 毛髮裝飾
        ctx.strokeStyle = '#ff3c00';
        ctx.lineWidth = 3;
        ctx.globalAlpha = this.fadeAlpha * 0.8;
        ctx.beginPath();
        // 龍角
        ctx.moveTo(-radius * 0.2, -radius * 0.8);
        ctx.quadraticCurveTo(-radius * 0.6, -radius * 1.5, -radius * 1.0, -radius * 1.6);
        ctx.moveTo(-radius * 0.2, -radius * 0.8);
        ctx.lineTo(-radius * 0.4, -radius * 1.2);
        ctx.stroke();

        // 龍頭主體 (發光層)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.globalAlpha = this.fadeAlpha * 0.35;
        this.renderDragonHeadPath(ctx, radius);
        ctx.stroke();

        // 龍頭主體 (白亮層)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.fadeAlpha * 0.95;
        this.renderDragonHeadPath(ctx, radius);
        ctx.stroke();

        // 填充
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.fadeAlpha * 0.3;
        ctx.fill();

        // 炯炯有神的霓虹大眼睛
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = this.fadeAlpha;
        ctx.beginPath();
        ctx.arc(radius * 0.4, -radius * 0.4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0055'; // 霸氣紅瞳
        ctx.beginPath();
        ctx.arc(radius * 0.5, -radius * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 3. 繪製 Boss 血量條 (置頂全螢幕血條)
        if (this.health > 0) {
            this.drawBossHealthBar(ctx);
        }
    }

    renderDragonHeadPath(ctx, r) {
        ctx.beginPath();
        // 鼻尖起點
        ctx.moveTo(r * 1.2, 0);
        // 上顎
        ctx.quadraticCurveTo(r * 0.8, -r * 0.6, 0, -r * 0.6);
        // 後腦勺
        ctx.quadraticCurveTo(-r * 0.8, -r * 0.8, -r, 0);
        // 下顎
        ctx.quadraticCurveTo(-r * 0.8, r * 0.8, 0, r * 0.6);
        // 口角
        ctx.quadraticCurveTo(r * 0.8, r * 0.6, r * 1.2, 0);
    }

    // 普通魚血條
    drawHealthBar(ctx, x, y, width) {
        const height = 4;
        const pct = Math.max(0, this.health / this.maxHealth);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#00ff55';
        ctx.fillRect(x, y, width * pct, height);
        ctx.restore();
    }

    // Boss 專屬頂部大血條
    drawBossHealthBar(ctx) {
        const barW = ctx.canvas.width * 0.6;
        const barH = 10;
        const x = (ctx.canvas.width - barW) / 2;
        const y = 70;
        const pct = Math.max(0, this.health / this.maxHealth);

        ctx.save();
        // 底色
        ctx.fillStyle = 'rgba(6, 18, 38, 0.7)';
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, barW, barH);
        ctx.strokeRect(x, y, barW, barH);

        // 血條漸變
        const bloodGrad = ctx.createLinearGradient(x, 0, x + barW, 0);
        bloodGrad.addColorStop(0, '#ff007b');
        bloodGrad.addColorStop(1, '#ffd700');
        ctx.fillStyle = bloodGrad;
        ctx.fillRect(x, y, barW * pct, barH);

        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name + ` (${this.health}/${this.maxHealth})`, ctx.canvas.width / 2, y - 5);
        ctx.restore();
    }

    // 碰撞體積判定 (與圓形網碰撞)
    checkCollision(netX, netY, netRadius) {
        if (this.isDead) return false;
        
        // 檢查頭部與網的距離
        const dx = this.x - netX;
        const dy = this.y - netY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = this.isBoss ? this.width * 0.9 : Math.max(this.width, this.height) * 0.5;

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
                if (sdist < netRadius + (this.width * 0.38 * (1 - (i / this.segmentCount) * 0.5))) {
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
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height;
        this.angle = 0; // 弧度
        this.recoil = 0; // 後座力伸縮像素
        this.width = 44;
        this.height = 70;
    }

    resize(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height;
    }

    updateAngle(targetX, targetY) {
        // 計算砲台到點擊點的角度
        const dx = targetX - this.x;
        const dy = targetY - this.y; // 必定是負值，因為砲台在底部
        this.angle = Math.atan2(dy, dx);
    }

    update() {
        if (this.recoil > 0) {
            this.recoil -= 1.5; // 漸漸恢復
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
        this.speed = 10;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        // 子彈飛行終點為點擊點 (或者直到碰觸邊界)
        this.targetX = targetX;
        this.targetY = targetY;
        
        // 判斷是否需要強制在點擊點引爆
        const dx = targetX - startX;
        const dy = targetY - startY;
        this.totalDist = Math.sqrt(dx * dx + dy * dy);
        this.distTraveled = 0;

        this.isDead = false;
        this.radius = 6;
        this.color = '#00f3ff';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.distTraveled += this.speed;

        // 如果到達點擊位置附近，標記為已死以觸發引爆
        if (this.distTraveled >= this.totalDist - 5) {
            this.isDead = true;
        }

        // 邊界判定
        if (this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // 子彈外發光
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 亮白色中心
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
        this.growSpeed = 3.5;
        this.fadeSpeed = 0.035;
        this.alpha = 1.0;
        this.isDead = false;
        this.color = isLaser ? '#ffd700' : '#00f3ff';
        
        // 捕獲判定只在網張開的瞬間（前幾幀）生效一次，避免多重檢索
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

        // 1. 繪製擴散的外發光圓環
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. 內部亮環
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.95, 0, Math.PI * 2);
        ctx.stroke();

        // 3. 網格紋路
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

        // 內圈同心圓
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
            this.vy = -0.6 - Math.random() * 0.8;
            this.radius = 1.5 + Math.random() * 3.5;
            this.alpha = 0.3 + Math.random() * 0.5;
            this.fadeSpeed = 0.002 + Math.random() * 0.002;
            this.wobbleSpeed = 0.02 + Math.random() * 0.03;
            this.wobbleRange = 0.5 + Math.random() * 1.5;
            this.wobblePhase = Math.random() * 100;
        } else if (type === 'gold') {
            // 金幣粒子：爆炸噴射，然後飛往左上角計分板
            this.vx = Math.cos(angle) * (2 + Math.random() * 4);
            this.vy = Math.sin(angle) * (2 + Math.random() * 4);
            this.radius = 5 + Math.random() * 3;
            this.alpha = 1.0;
            this.fadeSpeed = 0;
            this.flyToHUD = false;
            this.timer = 0;
            this.maxStayTime = 15 + Math.random() * 15; // 在原地漂移的時間
        } else if (type === 'spark') {
            // 霓虹擊中火花
            const speed = 1 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 1.5 + Math.random() * 2;
            this.alpha = 1.0;
            this.fadeSpeed = 0.03 + Math.random() * 0.03;
            this.friction = 0.95;
        } else if (type === 'ice') {
            // 冰晶
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
                // 原地飄逸與減速
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.92;
                this.vy *= 0.92;
                
                if (this.timer > this.maxStayTime) {
                    this.flyToHUD = true;
                }
            } else {
                // 飛往計分板位置
                const targetX = hudScoreRect.x + hudScoreRect.w / 2;
                const targetY = hudScoreRect.y + hudScoreRect.h / 2;
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 15) {
                    this.isDead = true;
                    // 當抵達計分板時發出一個小擊中火花
                    return true; // 告知外部生成觸達回饋
                }

                // 朝目標加速飛去
                const speed = 12;
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
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            // 加一點小亮點
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'gold') {
            // 金幣外霓虹圈
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 金幣內亮白圈
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
            // 畫個小四角星
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
        this.vy = -1.2;
        this.alpha = 1.0;
        this.fadeSpeed = 0.02;
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
        
        // 統計指標
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
        this.laserX = 0; // 雷射發射中心線

        this.isDoubleScore = false;
        this.doubleScoreTimer = 0;

        // 實體陣列
        this.fishList = [];
        this.bulletList = [];
        this.netList = [];
        this.particleList = [];
        this.textList = [];

        // 砲台
        this.cannon = null;

        // 技能冷卻管理（秒數）
        this.cooldowns = {
            freeze: { duration: 15, current: 0 },
            laser: { duration: 20, current: 0 },
            bomb: { duration: 12, current: 0 },
            double: { duration: 25, current: 0 }
        };

        // 魚潮與隨機事件計時器
        this.eventTimer = 3; // 3秒後開始排程
        this.activeEvent = null; // 'TIDE', 'BOSS', null
        this.eventDuration = 0;

        // 海底光效相位
        this.sunRaysPhase = 0;

        // HUD 位置估算 (用於金幣飛入動畫)
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

        this.cannon = new Cannon(this.canvas);
        
        // 初始隨機冒出一些小氣泡
        for (let i = 0; i < 20; i++) {
            this.particleList.push(new Particle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                'bubble'
            ));
        }

        // 初始幾條魚
        for (let i = 0; i < 4; i++) {
            this.spawnFish();
        }
    }

    resize() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        if (this.cannon) {
            this.cannon.resize(this.canvas);
        }

        // 實時計算計分板在螢幕上的位置，提供給金幣動畫飛入目標
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

        // 畫布觸控 / 點擊事件 (用於開火)
        this.canvas.addEventListener('touchstart', (e) => this.handleTap(e), { passive: false });
        this.canvas.addEventListener('mousedown', (e) => this.handleTap(e));

        // 技能按鈕點擊
        document.getElementById('btn-freeze').addEventListener('click', (e) => { e.stopPropagation(); this.useFreeze(); });
        document.getElementById('btn-laser').addEventListener('click', (e) => { e.stopPropagation(); this.useLaser(); });
        document.getElementById('btn-bomb').addEventListener('click', (e) => { e.stopPropagation(); this.useBomb(); });
        document.getElementById('btn-double').addEventListener('click', (e) => { e.stopPropagation(); this.useDouble(); });

        // 禁用右鍵與選取
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    start() {
        this.init();
        this.gameState = 'PLAYING';
        
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('skills-panel').classList.remove('hidden');

        // 計時器循環 (每秒更新一次)
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'PLAYING') {
                this.tick();
            }
        }, 1000);
    }

    // 每秒觸發一次：時間遞減、冷卻恢復、事件生成
    tick() {
        // 倒數計時
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

        // 背景偶爾咕嚕聲
        if (Math.random() < 0.3) {
            soundCtrl.playBubblePop();
        }

        // 更新技能冷卻
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

        // 魚潮 / Boss 事件調度
        this.eventTimer--;
        if (this.eventTimer <= 0) {
            this.triggerRandomEvent();
        }
    }

    triggerRandomEvent() {
        if (this.activeEvent) return; // 當前已有事件在進行

        const rand = Math.random();
        if (rand < 0.5) {
            // 魚潮來襲
            this.triggerFishTide();
        } else {
            // Boss 降臨
            this.triggerBossEvent();
        }

        // 下一次事件時間
        this.eventTimer = 18 + Math.floor(Math.random() * 10);
    }

    triggerFishTide() {
        this.activeEvent = 'TIDE';
        this.eventDuration = 10; // 持續10秒

        this.showEventBanner('魚潮來襲！大批霓虹魚群出沒！');
        
        // 開始密集生成特定軌跡的魚
        const tideInterval = setInterval(() => {
            if (this.gameState !== 'PLAYING' || this.eventDuration <= 0) {
                clearInterval(tideInterval);
                this.activeEvent = null;
                return;
            }

            // 一次生 3-4 條魚，共組交叉陣形
            const screenH = window.innerHeight;
            const side = Math.random() < 0.5 ? -50 : window.innerWidth + 50;
            const pattern = Math.random() < 0.5 ? 'wave' : 'diagonal';

            for (let i = 0; i < 3; i++) {
                const y = 100 + (screenH / 4) * i + (Math.random() - 0.5) * 50;
                const fish = this.spawnFishAt(side, y, 1.6);
                if (pattern === 'wave') {
                    fish.vy = Math.sin(i) * 1.5;
                } else {
                    fish.vy = (side < 0 ? 0.8 : -0.8);
                }
            }
        }, 1200);

        // 事件持續時間倒數
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

        // 生成巨大的 Boss 黃金龍
        const side = Math.random() < 0.5 ? -150 : window.innerWidth + 150;
        const y = window.innerHeight * 0.4;
        
        const boss = new Fish('dragon', side, y, 1.0);
        this.fishList.push(boss);

        // 監聽 Boss 狀態
        const checkBoss = setInterval(() => {
            if (this.gameState !== 'PLAYING') {
                clearInterval(checkBoss);
                this.activeEvent = null;
                return;
            }

            // 檢查 Boss 是否已死或已游出螢幕
            const isBossAlive = this.fishList.some(f => f.typeKey === 'dragon' && !f.isDead);
            const isBossStillHere = this.fishList.some(f => f.typeKey === 'dragon');

            if (!isBossStillHere) {
                // Boss 游走了
                clearInterval(checkBoss);
                this.activeEvent = null;
            } 
            else if (!isBossAlive && isBossStillHere) {
                // Boss 被幹掉了
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

        // 儲存最高分
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

    // ==========================================================================
    // 8. 射擊 & 碰撞判定 (Shooting & Collision)
    // ==========================================================================
    handleTap(e) {
        if (this.gameState !== 'PLAYING') return;
        
        // 阻止預防瀏覽器默認縮放/滑動行為
        if (e.type === 'touchstart') {
            e.preventDefault();
        }

        // 取出點擊座標 (相容觸控與滑鼠)
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            // 取最新一個觸碰點
            clientX = e.touches[e.touches.length - 1].clientX;
            clientY = e.touches[e.touches.length - 1].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // 如果點擊是在右側或底部的技能欄範圍，不觸發射擊
        const panel = document.getElementById('skills-panel');
        const panelRect = panel.getBoundingClientRect();
        if (clientX >= panelRect.left && clientX <= panelRect.right &&
            clientY >= panelRect.top && clientY <= panelRect.bottom) {
            return;
        }

        // 如果頂部計分板點擊，也不射擊
        if (clientY < 80) return;

        // 如果雷射開啟中，不能射擊子彈，直接在點擊位置發射寬光束
        if (this.isLaserActive) {
            this.fireLaserBeam(clientX);
            return;
        }

        this.fireBullet(clientX, clientY);
    }

    fireBullet(targetX, targetY) {
        if (!this.cannon) return;

        // 1. 旋轉砲台
        this.cannon.updateAngle(targetX, targetY);
        this.cannon.recoil = 15; // 後座力

        // 2. 創建子彈
        const bullet = new Bullet(
            this.cannon.x, 
            this.cannon.y - 40, 
            this.cannon.angle, 
            targetX, 
            targetY
        );
        this.bulletList.push(bullet);

        // 3. 播放發射音效
        soundCtrl.playShoot();
    }

    // 當子彈抵達或碰撞，轉化為擴散網
    explodeBullet(x, y) {
        const net = new Net(x, y);
        this.netList.push(net);
    }

    // 捕獲判定
    evaluateCatch(net) {
        if (net.hasEvaluated) return;
        net.hasEvaluated = true;

        let caughtSomething = false;

        for (let i = 0; i < this.fishList.length; i++) {
            const fish = this.fishList[i];
            
            if (fish.checkCollision(net.x, net.y, net.radius)) {
                // 減少血量 (雷射跟炸彈有更高的威力)
                const damage = net.isLaser ? 3 : 1;
                fish.health -= damage;
                caughtSomething = true;

                // 產生擊中火花粒子
                for (let k = 0; k < 6; k++) {
                    this.particleList.push(new Particle(fish.x, fish.y, 'spark', fish.color));
                }

                if (fish.health <= 0) {
                    fish.isDead = true;
                    this.stats.fishCaught++;

                    // 計算得分
                    let basePoints = fish.points;
                    if (this.isDoubleScore) {
                        basePoints *= 2;
                    }
                    this.score += basePoints;
                    
                    // Combo 計數
                    this.combo++;
                    this.comboTimer = 120; // 約2秒連擊時間
                    if (this.combo > this.stats.maxCombo) {
                        this.stats.maxCombo = this.combo;
                    }

                    // 浮動得分字體
                    const ptsText = this.isDoubleScore ? `+${basePoints} DOUBLE!` : `+${basePoints}`;
                    this.textList.push(new FloatingText(fish.x, fish.y - 10, ptsText, this.isDoubleScore ? '#ff007b' : fish.color));

                    // 生成金幣粒子
                    const coinCount = fish.isBoss ? 20 : (fish.points / 100) + 2;
                    for (let j = 0; j < coinCount; j++) {
                        this.particleList.push(new Particle(fish.x, fish.y, 'gold'));
                    }

                    soundCtrl.playCoin();
                } else {
                    // 受傷但沒死，顯示受傷紅色特效字體
                    this.textList.push(new FloatingText(fish.x, fish.y - 12, 'HIT!', '#ff0055'));
                }
            }
        }

        if (caughtSomething) {
            // 更新 HUD 得分
            document.getElementById('score-val').textContent = this.score;
            document.getElementById('score-val').style.transform = 'scale(1.2)';
            setTimeout(() => {
                document.getElementById('score-val').style.transform = 'scale(1)';
            }, 100);
        }
    }

    // ==========================================================================
    // 9. 技能釋放實現 (Skills Implementation)
    // ==========================================================================
    
    // 冰凍技能
    useFreeze() {
        if (this.cooldowns.freeze.current > 0 || this.gameState !== 'PLAYING') return;

        this.isFrozen = true;
        this.freezeTimer = 300; // 5秒 (60fps * 5)
        this.cooldowns.freeze.current = this.cooldowns.freeze.duration;
        document.getElementById('btn-freeze').classList.add('cooldown', 'active-skill');

        soundCtrl.playFreeze();

        // 產生漫天飛雪的冰晶粒子
        for (let i = 0; i < 40; i++) {
            this.particleList.push(new Particle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                'ice'
            ));
        }
    }

    // 雷射技能
    useLaser() {
        if (this.cooldowns.laser.current > 0 || this.gameState !== 'PLAYING') return;

        this.isLaserActive = true;
        this.laserTimer = 600; // 雷射發射準備狀態持續 10 秒，玩家有點擊才發射
        this.cooldowns.laser.current = this.cooldowns.laser.duration;
        document.getElementById('btn-laser').classList.add('cooldown', 'active-skill');

        soundCtrl.playFreeze(); // 充能聲
        this.showEventBanner('雷射已加載！點擊任意地方發射！');
    }

    fireLaserBeam(x) {
        this.isLaserActive = false;
        document.getElementById('btn-laser').classList.remove('active-skill');
        
        soundCtrl.playLaser();

        // 雷射主軸
        this.laserX = x;
        this.laserBeamTimer = 45; // 光束持續顯示45幀

        // 在雷射發射路徑上進行大範圍碰撞檢測 (橫跨 y 全高)
        const beamW = 100; // 雷射寬度
        const laserNet = {
            x: x,
            y: this.canvas.height / 2,
            radius: this.canvas.height / 2, // 用半徑覆蓋垂直線
            isLaser: true,
            hasEvaluated: false
        };

        // 自訂雷射碰撞判定：x 軸距離小於 beamW 即可
        for (let i = 0; i < this.fishList.length; i++) {
            const fish = this.fishList[i];
            if (fish.isDead) continue;
            
            // 只要魚的 x 軸落在雷射橫截面內，就算擊中
            const dist = Math.abs(fish.x - x);
            if (dist < beamW + fish.width * 0.4) {
                fish.health -= 6; // 造成巨量傷害
                
                // 激發火花
                for (let k = 0; k < 8; k++) {
                    this.particleList.push(new Particle(fish.x, fish.y, 'spark', '#ffd700'));
                }

                if (fish.health <= 0) {
                    fish.isDead = true;
                    this.stats.fishCaught++;
                    let pts = fish.points * (this.isDoubleScore ? 2 : 1);
                    this.score += pts;
                    
                    this.textList.push(new FloatingText(fish.x, fish.y - 10, `+${pts}`, '#ffd700'));
                    
                    // 金幣
                    for (let j = 0; j < 5; j++) {
                        this.particleList.push(new Particle(fish.x, fish.y, 'gold'));
                    }
                }
            }
        }
        
        document.getElementById('score-val').textContent = this.score;
        soundCtrl.playCoin();
    }

    // 炸彈技能
    useBomb() {
        if (this.cooldowns.bomb.current > 0 || this.gameState !== 'PLAYING') return;

        this.cooldowns.bomb.current = this.cooldowns.bomb.duration;
        document.getElementById('btn-bomb').classList.add('cooldown');

        soundCtrl.playExplosion();

        // 在畫面隨機偏中心的位置產生一場超級巨型捕魚網爆炸
        const x = this.canvas.width * 0.3 + Math.random() * this.canvas.width * 0.4;
        const y = this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.4;

        // 巨型捕魚網 (scale = 3.2倍)
        const superNet = new Net(x, y, 3.5);
        superNet.color = '#ff007b';
        this.netList.push(superNet);

        // 炸彈震屏特效
        this.screenShake = 20;

        // 產生超大範圍火花
        for (let i = 0; i < 30; i++) {
            this.particleList.push(new Particle(x, y, 'spark', '#ff007b'));
        }
    }

    // 雙倍得分技能
    useDouble() {
        if (this.cooldowns.double.current > 0 || this.gameState !== 'PLAYING') return;

        this.isDoubleScore = true;
        this.doubleScoreTimer = 600; // 10秒 (60fps * 10)
        this.cooldowns.double.current = this.cooldowns.double.duration;
        document.getElementById('btn-double').classList.add('cooldown', 'active-skill');

        soundCtrl.playDouble();

        // 炫光文字提示
        this.showEventBanner('雙倍得分啟動！大肆捕獵吧！');
    }

    // ==========================================================================
    // 10. 生產與清掃管理 (Spawning & Cleanup)
    // ==========================================================================
    spawnFish() {
        if (this.gameState !== 'PLAYING') return;

        // 依概率決定生成的魚類
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

        // 從畫面左右外側隨機高度生成
        const side = Math.random() < 0.5 ? -40 : this.canvas.width + 40;
        const y = 80 + Math.random() * (this.canvas.height - 200);

        this.fishList.push(new Fish(type, side, y));
    }

    spawnFishAt(x, y, speedMult = 1.0) {
        // 生成特定位置的魚（如魚潮）
        const rand = Math.random();
        let type = 'goldfish';
        if (rand > 0.7) type = 'clownfish';
        if (rand > 0.9) type = 'bluetang';

        const fish = new Fish(type, x, y, speedMult);
        this.fishList.push(fish);
        return fish;
    }

    // ==========================================================================
    // 11. 主渲染與更新循環 (Draw & Update loop)
    // ==========================================================================
    update() {
        // 畫面震動
        if (this.screenShake > 0) {
            this.screenShake -= 1;
        }

        // 1. 氣泡背景微幅向上漂浮氣泡
        if (Math.random() < 0.08) {
            this.particleList.push(new Particle(
                Math.random() * this.canvas.width,
                this.canvas.height + 10,
                'bubble'
            ));
        }

        // 2. 冰凍狀態計時器
        if (this.isFrozen) {
            this.freezeTimer--;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                document.getElementById('btn-freeze').classList.remove('active-skill');
            }
        }

        // 3. 雙倍分數狀態計時器
        if (this.isDoubleScore) {
            this.doubleScoreTimer--;
            if (this.doubleScoreTimer <= 0) {
                this.isDoubleScore = false;
                document.getElementById('btn-double').classList.remove('active-skill');
            }
        }

        // 4. 雷射主動點擊狀態倒數 (若時間到沒點擊，自動關閉技能)
        if (this.isLaserActive) {
            this.laserTimer--;
            if (this.laserTimer <= 0) {
                this.isLaserActive = false;
                document.getElementById('btn-laser').classList.remove('active-skill');
            }
        }

        // 5. 更新砲台
        if (this.cannon) {
            this.cannon.update();
        }

        // 6. 更新子彈
        for (let i = this.bulletList.length - 1; i >= 0; i--) {
            const bullet = this.bulletList[i];
            bullet.update();
            
            // 子彈撞擊目標或出界，轉化為擴散網
            if (bullet.isDead) {
                this.explodeBullet(bullet.x, bullet.y);
                this.bulletList.splice(i, 1);
            }
        }

        // 7. 更新捕魚網並進行捕捉評估
        for (let i = this.netList.length - 1; i >= 0; i--) {
            const net = this.netList[i];
            net.update();
            
            // 瞬間捕捉判定
            this.evaluateCatch(net);

            if (net.isDead) {
                this.netList.splice(i, 1);
            }
        }

        // 8. 更新魚群並自動補貨
        let aliveBossCount = 0;
        for (let i = this.fishList.length - 1; i >= 0; i--) {
            const fish = this.fishList[i];
            fish.update(this.isFrozen);

            if (fish.typeKey === 'dragon') aliveBossCount++;

            // 邊界判定與清除
            const isOffscreen = (fish.vx > 0 && fish.x > this.canvas.width + 150) || 
                                (fish.vx < 0 && fish.x < -150);

            if (isOffscreen || (fish.isDead && fish.fadeAlpha <= 0)) {
                this.fishList.splice(i, 1);
            }
        }

        // 如果魚太少且當前無大事件，則自動生魚
        if (this.fishList.length < 5 && !this.activeEvent) {
            this.spawnFish();
        }

        // 9. 更新粒子與分數回饋
        for (let i = this.particleList.length - 1; i >= 0; i--) {
            const part = this.particleList[i];
            // part.update 回傳 true 代表金幣抵達計分板
            const arrivedScore = part.update(this.hudScoreRect);
            
            if (arrivedScore) {
                // 產生計分板波紋/火花特效
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

        // 10. 更新浮動文字
        for (let i = this.textList.length - 1; i >= 0; i--) {
            const txt = this.textList[i];
            txt.update();
            if (txt.isDead) {
                this.textList.splice(i, 1);
            }
        }

        // 11. 連擊 (Combo) 遞減
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // 更新 Combo 介面
        const comboVal = document.getElementById('combo-val');
        if (this.combo > 1) {
            comboVal.textContent = `x${this.combo}`;
            comboVal.style.display = 'block';
        } else {
            comboVal.textContent = 'x1';
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 應用震屏
        this.ctx.save();
        if (this.screenShake > 0) {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }

        // 1. 繪製海底背景漸層 (深海蔚藍到迷幻紫)
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGrad.addColorStop(0, '#020713');
        bgGrad.addColorStop(0.5, '#051126');
        bgGrad.addColorStop(1, '#1b0f2e');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. 繪製海底擺動海草 (裝飾性插畫，豐富視覺)
        this.drawSeaweed();

        // 3. 繪製流動海底光影 (Sun Rays)
        this.drawSunRays();

        // 4. 繪製魚群
        for (const fish of this.fishList) {
            fish.draw(this.ctx);
        }

        // 5. 繪製子彈
        for (const bullet of this.bulletList) {
            bullet.draw(this.ctx);
        }

        // 6. 繪製雷射光束 (如果當前雷射射擊中)
        this.drawLaserBeam();

        // 7. 繪製捕魚網
        for (const net of this.netList) {
            net.draw(this.ctx);
        }

        // 8. 繪製粒子 (氣泡、金幣等)
        for (const part of this.particleList) {
            part.draw(this.ctx);
        }

        // 9. 繪製浮動文字
        for (const txt of this.textList) {
            txt.draw(this.ctx);
        }

        // 10. 繪製砲台
        if (this.cannon) {
            this.cannon.draw(this.ctx);
        }

        // 11. 冰凍畫框特效 (藍色螢光邊框)
        if (this.isFrozen) {
            this.drawIceOverlay();
        }

        // 12. 雙倍分數霓虹炫邊
        if (this.isDoubleScore) {
            this.drawDoubleScoreOverlay();
        }

        this.ctx.restore();
    }

    // 繪製動態海底光影 (Sun Rays)
    drawSunRays() {
        this.sunRaysPhase += 0.005;
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        
        const rayCount = 4;
        const angleWidth = 0.08; // 每個光束夾角

        for (let i = 0; i < rayCount; i++) {
            const centerAngle = Math.PI / 4 + Math.sin(this.sunRaysPhase + i * 1.5) * 0.15;
            
            const grad = this.ctx.createRadialGradient(
                this.canvas.width * 0.3, -50, 0,
                this.canvas.width * 0.3, -50, this.canvas.height * 1.2
            );
            grad.addColorStop(0, 'rgba(0, 243, 255, 0.12)');
            grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.03)');
            grad.addColorStop(1, 'rgba(0, 243, 255, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width * 0.3, -50);
            
            // 繪製扇形
            const startX = this.canvas.width * 0.3 + Math.cos(centerAngle - angleWidth) * this.canvas.height * 1.5;
            const startY = -50 + Math.sin(centerAngle - angleWidth) * this.canvas.height * 1.5;
            const endX = this.canvas.width * 0.3 + Math.cos(centerAngle + angleWidth) * this.canvas.height * 1.5;
            const endY = -50 + Math.sin(centerAngle + angleWidth) * this.canvas.height * 1.5;
            
            this.ctx.lineTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    // 繪製海草 (Swaying Seaweed)
    drawSeaweed() {
        const time = Date.now() * 0.0015;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        const weedCount = 8;
        const spacing = this.canvas.width / (weedCount + 1);

        for (let i = 0; i < weedCount; i++) {
            const x = spacing * (i + 1);
            const height = 120 + Math.sin(i * 45) * 40;
            const sway = Math.sin(time + i) * 15;

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.canvas.height);
            this.ctx.quadraticCurveTo(
                x - sway * 0.5, this.canvas.height - height * 0.5,
                x + sway, this.canvas.height - height
            );
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    // 繪製發射雷射
    drawLaserBeam() {
        if (this.laserBeamTimer > 0) {
            this.laserBeamTimer--;
            
            const x = this.laserX;
            const w = 90 * (this.laserBeamTimer / 45); // 隨時間縮窄

            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';

            // 1. 金色外雷射
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(x - w, 0, w * 2, this.canvas.height);

            // 2. 核心白光雷射
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x - w * 0.3, 0, w * 0.6, this.canvas.height);

            // 3. 兩側雷射軌道閃電粒子
            if (Math.random() < 0.5) {
                for (let y = 0; y < this.canvas.height; y += 80) {
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

    // 冰凍邊框覆蓋
    drawIceOverlay() {
        this.ctx.save();
        const grad = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.4,
            this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.8
        );
        grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0.35)');
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製冰晶四角邊框
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
    }

    // 雙倍得分霓虹邊框
    drawDoubleScoreOverlay() {
        this.ctx.save();
        const flash = Math.abs(Math.sin(Date.now() * 0.01));
        this.ctx.strokeStyle = `rgba(255, 0, 123, ${0.2 + flash * 0.4})`;
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
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

// ==========================================================================
// 12. 網頁加載啟動初始化
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.loop();
});
