/* ====================================================
   transition.js - Phase 2 揭晓过渡动画时间线
   ==================================================== */
(function () {
    'use strict';

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * 执行完整的 Phase 2 过渡序列
     */
    async function playTransition() {
        const phaseCountdown = document.getElementById('phase-countdown');
        const phaseReveal = document.getElementById('phase-reveal');
        const starsLayer = document.querySelector('.stars-layer');
        const nebulaOverlay = document.querySelector('.nebula-overlay');
        const titleEn = document.querySelector('.reveal-title-en');
        const titleCn = document.querySelector('.reveal-title-cn');
        const always = document.querySelector('.reveal-always');

        // 切换 Canvas 到过渡阶段
        if (window.CanvasManager) window.CanvasManager.setPhase(2);

        // T+0: 淡出倒计时
        phaseCountdown.classList.add('fade-out');
        phaseCountdown.classList.remove('active');
        starsLayer.classList.add('twinkle-fast');

        await wait(800);

        // T+0.8s: 批量发射 5 颗流星
        if (window.CanvasManager) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => window.CanvasManager.spawnShootingStar(), i * 200);
            }
        }

        await wait(700);

        // T+1.5s: 星云提亮
        nebulaOverlay.classList.add('brighten');

        await wait(500);

        // T+2.0s: 显示标题
        phaseReveal.classList.add('active');
        titleEn.classList.add('animate-in');

        await wait(500);

        // T+2.5s: 中文标题
        titleCn.classList.add('animate-in');

        await wait(300);

        // T+2.8s: Always
        always.classList.add('animate-in');

        await wait(700);

        // T+3.5s: 第一束烟花
        if (window.CanvasManager) {
            const tx = window.innerWidth * (0.3 + Math.random() * 0.4);
            const ty = window.innerHeight * 0.35;
            window.CanvasManager.launchFirework(tx, ty);
        }

        await wait(1000);

        // T+4.5s: 切换到 Phase 3
        switchToCelebration();
    }

    /**
     * 切换到 Phase 3 庆祝页面
     */
    function switchToCelebration() {
        const phaseReveal = document.getElementById('phase-reveal');
        const phaseCelebration = document.getElementById('phase-celebration');
        const starsLayer = document.querySelector('.stars-layer');

        phaseReveal.classList.remove('active');
        phaseReveal.classList.add('fade-out');
        starsLayer.classList.remove('twinkle-fast');

        phaseCelebration.classList.add('active');

        if (window.CanvasManager) window.CanvasManager.setPhase(3);
    }

    /**
     * 直接跳到庆祝页面（已过生日场景）
     */
    function showCelebrationDirectly() {
        const phaseCountdown = document.getElementById('phase-countdown');
        const phaseCelebration = document.getElementById('phase-celebration');

        phaseCountdown.classList.remove('active');
        phaseCelebration.classList.add('active');

        if (window.CanvasManager) window.CanvasManager.setPhase(3);
    }

    window.Transition = {
        playTransition,
        switchToCelebration,
        showCelebrationDirectly
    };
})();
