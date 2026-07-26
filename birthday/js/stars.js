/* ====================================================
   stars.js - 运行时生成星空 box-shadow
   三层星星：小(1px) / 中(2px) / 大(3px)
   ==================================================== */
(function () {
    'use strict';

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const W = window.innerWidth;
    const H = window.innerHeight;

    // 各层星星数量（移动端较少）
    const COUNT_SMALL  = isMobile ? 120 : 250;
    const COUNT_MEDIUM = isMobile ? 60  : 120;
    const COUNT_LARGE  = isMobile ? 25  : 50;

    /**
     * 生成 box-shadow 字符串
     * @param {number} count - 星星数量
     * @param {number} size - 星星尺寸 px
     * @returns {string} box-shadow 值
     */
    function generateShadows(count, size) {
        const shadows = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * W);
            const y = Math.floor(Math.random() * H);
            const opacity = (0.4 + Math.random() * 0.6).toFixed(2);
            // 大星星偶尔带轻微色调
            let color;
            if (size >= 3 && Math.random() > 0.8) {
                color = `rgba(200, 220, 255, ${opacity})`;
            } else if (size >= 3 && Math.random() > 0.9) {
                color = `rgba(255, 230, 200, ${opacity})`;
            } else {
                color = `rgba(255, 255, 255, ${opacity})`;
            }
            shadows.push(`${x}px ${y}px 0 ${size > 1 ? (size - 1) : 0}px ${color}`);
        }
        return shadows.join(', ');
    }

    /**
     * 注入星星样式到指定元素
     */
    function applyStars() {
        const small  = document.querySelector('.stars-small');
        const medium = document.querySelector('.stars-medium');
        const large  = document.querySelector('.stars-large');

        if (small) {
            small.style.boxShadow = generateShadows(COUNT_SMALL, 1);
        }
        if (medium) {
            medium.style.width = '2px';
            medium.style.height = '2px';
            medium.style.boxShadow = generateShadows(COUNT_MEDIUM, 2);
        }
        if (large) {
            large.style.width = '3px';
            large.style.height = '3px';
            large.style.boxShadow = generateShadows(COUNT_LARGE, 3);
        }
    }

    // DOM 就绪后立即生成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyStars);
    } else {
        applyStars();
    }

    // resize 时防抖重新生成
    let resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyStars, 300);
    });
})();
