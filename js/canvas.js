/* ====================================================
   canvas.js - Canvas 管理器
   双 Canvas 分层 + DPR 适配 + 动画循环 + 粒子调度
   ==================================================== */
(function () {
    'use strict';

    const bgCanvas = document.getElementById('canvas-bg');
    const fxCanvas = document.getElementById('canvas-fx');
    const bgCtx = bgCanvas.getContext('2d', { alpha: false });
    const fxCtx = fxCanvas.getContext('2d', { alpha: true });

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const MAX_SPARKS = isMobile ? 400 : 1200;
    const MAX_HEARTS = isMobile ? 15 : 40;

    const P = window.Particles;

    // 对象池
    const sparkPool = new P.ParticlePool(() => new P.Spark(), isMobile ? 200 : 600);
    const starPool  = new P.ParticlePool(() => new P.ShootingStar(), 10);
    const fwPool    = new P.ParticlePool(() => new P.Firework(), 20);
    const heartPool = new P.ParticlePool(() => new P.HeartParticle(), 10);

    // 活动粒子数组
    let shootingStars = [];
    let fireworks = [];
    let sparks = [];
    let hearts = [];

    // 阶段控制
    let currentPhase = 1; // 1=倒计时, 2=过渡, 3=庆祝
    let meteorTimer = 0;
    let nextMeteorAt = 3000 + Math.random() * 5000; // 3-8秒
    let fireworkTimer = 0;
    let nextFireworkAt = 2000;
    let heartTimer = 0;
    let nextHeartAt = 1500;

    let animFrameId = null;
    let lastTime = performance.now();

    // ===== DPR 适配 =====
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        [bgCanvas, fxCanvas].forEach(c => {
            c.width = w * dpr;
            c.height = h * dpr;
            c.style.width = w + 'px';
            c.style.height = h + 'px';
        });
        bgCtx.setTransform(1, 0, 0, 1, 0, 0);
        fxCtx.setTransform(1, 0, 0, 1, 0, 0);
        bgCtx.scale(dpr, dpr);
        fxCtx.scale(dpr, dpr);
        drawStaticStars();
    }

    // ===== 在 bgCanvas 绘制静态星点（仅 resize 时） =====
    function drawStaticStars() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        bgCtx.fillStyle = '#000';
        bgCtx.fillRect(0, 0, w, h);
        // 极少量静态远景星点（box-shadow 层为主，这里补一些微光）
        const count = isMobile ? 30 : 60;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * 0.8;
            const op = 0.15 + Math.random() * 0.25;
            bgCtx.beginPath();
            bgCtx.arc(x, y, r, 0, Math.PI * 2);
            bgCtx.fillStyle = `rgba(255,255,255,${op})`;
            bgCtx.fill();
        }
    }

    // ===== 生成流星 =====
    function spawnShootingStar() {
        const s = starPool.acquire();
        s.spawn(window.innerWidth, window.innerHeight);
        shootingStars.push(s);
    }

    // ===== 发射烟花 =====
    function launchFirework(tx, ty) {
        const sx = window.innerWidth * (0.3 + Math.random() * 0.4);
        const sy = window.innerHeight;
        const color = P.FIREWORK_COLORS[Math.floor(Math.random() * P.FIREWORK_COLORS.length)];
        const fw = fwPool.acquire();
        fw.spawn(sx, sy, tx, ty, color);
        fireworks.push(fw);
    }

    // ===== 在随机位置发射烟花（自动模式） =====
    function launchRandomFirework() {
        const tx = window.innerWidth * (0.15 + Math.random() * 0.7);
        const ty = window.innerHeight * (0.15 + Math.random() * 0.35);
        launchFirework(tx, ty);
    }

    // ===== 爆炸 =====
    function explode(x, y, color) {
        const count = isMobile ? 50 : 90;
        for (let i = 0; i < count; i++) {
            if (sparks.length >= MAX_SPARKS) break;
            const sp = sparkPool.acquire();
            // 20% 白色粒子增加层次
            const c = Math.random() < 0.2 ? 'rgba(255,255,255,1)' : color;
            sp.spawn(x, y, c);
            sparks.push(sp);
        }
    }

    // ===== 生成爱心 =====
    function spawnHeart() {
        if (hearts.length >= MAX_HEARTS) return;
        const h = heartPool.acquire();
        h.spawn(window.innerWidth, window.innerHeight);
        hearts.push(h);
    }

    // ===== 主循环 =====
    function animate(now) {
        const dt = now - lastTime;
        lastTime = now;

        const w = window.innerWidth;
        const h = window.innerHeight;

        fxCtx.clearRect(0, 0, w, h);

        // ---- 流星调度 ----
        meteorTimer += dt;
        if (meteorTimer >= nextMeteorAt) {
            spawnShootingStar();
            meteorTimer = 0;
            // Phase 1 低频，Phase 2/3 稍高
            nextMeteorAt = currentPhase === 1
                ? (3000 + Math.random() * 5000)
                : (1500 + Math.random() * 3000);
        }

        // ---- 烟花调度（仅 Phase 3） ----
        if (currentPhase === 3) {
            fireworkTimer += dt;
            if (fireworkTimer >= nextFireworkAt) {
                launchRandomFirework();
                fireworkTimer = 0;
                nextFireworkAt = 2000 + Math.random() * 3000;
            }
            // ---- 爱心调度 ----
            heartTimer += dt;
            if (heartTimer >= nextHeartAt) {
                spawnHeart();
                heartTimer = 0;
                nextHeartAt = 1000 + Math.random() * 1500;
            }
        }

        // ---- 更新+绘制 流星 ----
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.update();
            s.draw(fxCtx);
            if (!s.active) {
                starPool.release(s);
                shootingStars.splice(i, 1);
            }
        }

        // ---- 更新+绘制 烟花发射体 ----
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const fw = fireworks[i];
            fw.update();
            fw.draw(fxCtx);
            if (fw.exploded) {
                explode(fw.x, fw.y, fw.color);
                fwPool.release(fw);
                fireworks.splice(i, 1);
            } else if (!fw.active) {
                fwPool.release(fw);
                fireworks.splice(i, 1);
            }
        }

        // ---- 更新+绘制 爆炸火花 ----
        for (let i = sparks.length - 1; i >= 0; i--) {
            const sp = sparks[i];
            sp.update();
            sp.draw(fxCtx);
            if (!sp.active) {
                sparkPool.release(sp);
                sparks.splice(i, 1);
            }
        }

        // ---- 更新+绘制 爱心 ----
        for (let i = hearts.length - 1; i >= 0; i--) {
            const hp = hearts[i];
            hp.update();
            hp.draw(fxCtx);
            if (!hp.active) {
                heartPool.release(hp);
                hearts.splice(i, 1);
            }
        }

        animFrameId = requestAnimationFrame(animate);
    }

    // ===== 阶段切换 =====
    function setPhase(phase) {
        currentPhase = phase;
    }

    // ===== 满屏烟花 =====
    function fireworksShow() {
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const tx = window.innerWidth * (0.1 + Math.random() * 0.8);
                const ty = window.innerHeight * (0.1 + Math.random() * 0.4);
                launchFirework(tx, ty);
            }, i * 100);
        }
    }

    // ===== 离屏暂停 =====
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        } else {
            if (!animFrameId) {
                lastTime = performance.now();
                animFrameId = requestAnimationFrame(animate);
            }
        }
    });

    // ===== resize 防抖 =====
    let resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 200);
    });

    // ===== 初始化 =====
    resizeCanvas();
    animFrameId = requestAnimationFrame(animate);

    // ===== 暴露 API =====
    window.CanvasManager = {
        spawnShootingStar,
        launchFirework,
        launchRandomFirework,
        fireworksShow,
        setPhase
    };
})();
