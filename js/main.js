/* ====================================================
   main.js - 入口
   倒计时 + 生日当天判断 + 交互事件绑定
   ==================================================== */
(function () {
    'use strict';

    // ===== 生日配置 =====
    const BIRTHDAY_YEAR = 2026;
    const BIRTHDAY_MONTH = 10; // 0-indexed: November = 10
    //const BIRTHDAY_MONTH = 6; // 0-indexed: November = 10
    const BIRTHDAY_DAY = 29;
    //const BIRTHDAY_DAY = 26;
    const TARGET = new Date(BIRTHDAY_YEAR, BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0).getTime();
    const FADE_OUT_DELAY = 4000; // 归零后 4 秒淡出

    // ===== 进度条配置 =====
    const PROGRESS_START = new Date(2026, 4, 26, 12, 0, 0).getTime();
    const PROGRESS_END = TARGET;
    const PROGRESS_TOTAL = PROGRESS_END - PROGRESS_START;

    // ===== DOM =====
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMinutes = document.getElementById('cd-minutes');
    const cdSeconds = document.getElementById('cd-seconds');
    const progressFill = document.getElementById('progress-fill');
    const progressValue = document.getElementById('progress-value');

    // ===== 显示全零 =====
    function setAllZeros() {
        cdDays.textContent = '000';
        cdHours.textContent = '00';
        cdMinutes.textContent = '00';
        cdSeconds.textContent = '00';
    }

    // ===== 更新倒计时显示 =====
    function updateDisplay(diff) {
        const days    = Math.floor(diff / 86400000);
        const hours   = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        cdDays.textContent = String(days).padStart(3, '0');
        cdHours.textContent = String(hours).padStart(2, '0');
        cdMinutes.textContent = String(minutes).padStart(2, '0');
        cdSeconds.textContent = String(seconds).padStart(2, '0');
    }

    // ===== 更新进度条 =====
    function updateProgress() {
        const now = Date.now();
        let pct;
        if (now <= PROGRESS_START) {
            pct = 0;
        } else if (now >= PROGRESS_END) {
            pct = 100;
        } else {
            pct = ((now - PROGRESS_START) / PROGRESS_TOTAL) * 100;
        }
        progressFill.style.width = pct + '%';
        progressValue.textContent = pct.toFixed(6) + '%';
    }

    // ===== 倒计时主逻辑 =====
    function initCountdown() {
        const now = new Date();

        // 判断是否生日当天（无论具体时刻）
        const isBirthdayToday = now.getFullYear() === BIRTHDAY_YEAR
            && now.getMonth() === BIRTHDAY_MONTH
            && now.getDate() === BIRTHDAY_DAY;

        if (isBirthdayToday) {
            // 生日当天：显示全零，4 秒后过渡到庆祝
            setAllZeros();
            setTimeout(() => {
                if (window.Transition) window.Transition.playTransition();
            }, FADE_OUT_DELAY);
            return;
        }

        // 判断是否已过生日（非当天，比如第二天及以后打开）
        // 注意：当前是 2026-07，生日还没到，此分支理论上不会触发，但保留健壮性
        if (now.getTime() > TARGET
            && !(now.getFullYear() === BIRTHDAY_YEAR
                 && now.getMonth() === BIRTHDAY_MONTH
                 && now.getDate() === BIRTHDAY_DAY)) {
            // 已过生日，直接显示庆祝页
            setAllZeros();
            setTimeout(() => {
                if (window.Transition) window.Transition.showCelebrationDirectly();
            }, 1500);
            return;
        }

        // 正常倒计时
        updateDisplay(TARGET - Date.now());
        updateProgress();
        const timer = setInterval(function tick() {
            const diff = TARGET - Date.now();
            if (diff <= 0) {
                clearInterval(timer);
                clearInterval(progressTimer);
                setAllZeros();
                updateProgress();
                setTimeout(() => {
                    if (window.Transition) window.Transition.playTransition();
                }, FADE_OUT_DELAY);
                return;
            }
            updateDisplay(diff);
        }, 1000);

        // 进度条独立更新（50ms 刷新，确保 0.000001% 精度跳动可见）
        const progressTimer = setInterval(function progressTick() {
            const diff = TARGET - Date.now();
            if (diff <= 0) {
                clearInterval(progressTimer);
                updateProgress();
                return;
            }
            updateProgress();
        }, 50);
    }

    // ===== 交互事件 =====
    function bindInteractions() {
        const phaseCelebration = document.getElementById('phase-celebration');
        const btnAll = document.getElementById('btn-firework-all');

        // 点击屏幕放烟花（仅 Phase 3）
        function handleTap(e) {
            // 不在庆祝阶段不处理
            if (!phaseCelebration.classList.contains('active')) return;
            // 排除按钮点击
            if (e.target.closest('.firework-btn')) return;

            let x, y;
            if (e.touches && e.touches.length > 0) {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                x = e.changedTouches[0].clientX;
                y = e.changedTouches[0].clientY;
            } else {
                x = e.clientX;
                y = e.clientY;
            }
            if (window.CanvasManager) {
                window.CanvasManager.launchFirework(x, y);
            }
        }

        // 使用 pointerdown 统一处理触摸和鼠标
        document.addEventListener('pointerdown', handleTap);

        // 满屏烟花按钮
        if (btnAll) {
            btnAll.addEventListener('click', function (e) {
                e.stopPropagation();
                if (window.CanvasManager) window.CanvasManager.fireworksShow();
            });
        }
    }

    // ===== 启动 =====
    function init() {
        initCountdown();
        bindInteractions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
