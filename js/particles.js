/* ====================================================
   particles.js - 粒子系统
   流星 / 烟花(发射体+爆炸火花) / 爱心 / 对象池
   ==================================================== */

// ===== 对象池 =====
class ParticlePool {
    constructor(factory, initialSize) {
        this.factory = factory;
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            const p = factory();
            p.active = false;
            this.pool.push(p);
        }
    }
    acquire() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                this.pool[i].active = true;
                return this.pool[i];
            }
        }
        // 池满了，创建新的
        const p = this.factory();
        p.active = true;
        this.pool.push(p);
        return p;
    }
    release(p) {
        p.active = false;
    }
}

// ===== 流星 =====
class ShootingStar {
    constructor() { this.active = false; }
    spawn(w, h) {
        this.x = Math.random() * w * 0.9;
        this.y = Math.random() * h * 0.4;
        this.length = 80 + Math.random() * 140;
        this.speed = 8 + Math.random() * 7;
        this.angle = (Math.PI / 6) + Math.random() * (Math.PI / 6); // 30-60度
        this.opacity = 1;
        this.decay = 0.012 + Math.random() * 0.012;
        this.active = true;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.opacity -= this.decay;
        if (this.opacity <= 0) this.active = false;
    }
    draw(ctx) {
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;
        const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${this.opacity})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        // 头部光点
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
        ctx.fill();
    }
}

// ===== 烟花发射体 =====
class Firework {
    constructor() { this.active = false; }
    spawn(sx, sy, tx, ty, color) {
        this.sx = sx; this.sy = sy;
        this.tx = tx; this.ty = ty;
        this.x = sx; this.y = sy;
        this.color = color;
        this.distTotal = Math.hypot(tx - sx, ty - sy);
        this.distTraveled = 0;
        this.speed = 4 + Math.random() * 2;
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.trail = [];
        this.trailLength = 5;
        this.exploded = false;
        this.active = true;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) this.trail.shift();
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.distTraveled = Math.hypot(this.x - this.sx, this.y - this.sy);
        if (this.distTraveled >= this.distTotal) {
            this.exploded = true;
            this.active = false;
        }
    }
    draw(ctx) {
        // 拖尾
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const op = (i / this.trail.length) * 0.6;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('1)', `${op})`);
            ctx.fill();
        }
        // 主体
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// ===== 爆炸火花 =====
class Spark {
    constructor() { this.active = false; }
    spawn(x, y, color) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;
        this.friction = 0.98;
        this.opacity = 1;
        this.decay = 0.008 + Math.random() * 0.02;
        this.color = color;
        this.radius = 1 + Math.random() * 1.8;
        this.trail = [];
        this.trailLength = 3;
        this.active = true;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) this.trail.shift();
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= this.decay;
        if (this.opacity <= 0) this.active = false;
    }
    draw(ctx) {
        // 拖尾
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const op = (i / this.trail.length) * this.opacity * 0.4;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('1)', `${op})`);
            ctx.fill();
        }
        // 本体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('1)', `${this.opacity})`);
        ctx.fill();
    }
}

// ===== 爱心粒子 =====
class HeartParticle {
    constructor() { this.active = false; }
    spawn(w, h) {
        this.x = Math.random() * w;
        this.y = h + 20;
        this.size = 6 + Math.random() * 10;
        this.speedY = -(0.4 + Math.random() * 0.9);
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.02;
        this.opacity = 0.5 + Math.random() * 0.4;
        this.decay = 0.002;
        this.color = Math.random() > 0.5 ? '#ff69b4' : '#ff1493';
        this.active = true;
    }
    update() {
        this.y += this.speedY;
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * 0.5;
        this.opacity -= this.decay;
        if (this.opacity <= 0 || this.y < -30) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const s = this.size / 16;
        ctx.scale(s, s);
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 2; t += 0.1) {
            const hx = 16 * Math.pow(Math.sin(t), 3);
            const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
            if (t === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// ===== 烟花颜色（含 alpha=1 的 rgba，便于动态替换透明度） =====
const FIREWORK_COLORS = [
    'rgba(255, 215, 0, 1)',     // 金色
    'rgba(255, 105, 180, 1)',   // 玫瑰粉
    'rgba(135, 206, 235, 1)',   // 天蓝
    'rgba(255, 107, 107, 1)',   // 珊瑚红
    'rgba(192, 132, 252, 1)',   // 薰衣草紫
    'rgba(52, 211, 153, 1)',    // 薄荷绿
    'rgba(192, 200, 216, 1)',   // 银色（斯内普主题）
    'rgba(125, 255, 176, 1)',   // 镨绿
];

// 暴露到全局
window.Particles = {
    ParticlePool,
    ShootingStar,
    Firework,
    Spark,
    HeartParticle,
    FIREWORK_COLORS
};
