/* ====================================================
   quotes.js - 语录数据与随机轮换器
   每个元素为 [正文, 署名?]
   ==================================================== */
(function () {
    'use strict';

    const QUOTES = [
        [
            '——致　我最下流的幻想，最崇高的理想\n　　　　　最肤浅的臆想，最深邃的梦想',
            ''
        ]
    ];

    // ===== 洗牌循环抽选器 =====
    // 每次洗牌后按顺序取，取完一轮重新洗牌
    // 支持 localStorage 持久化，刷新后接着上次进度继续，直到一轮用完才重新洗牌
    const STORAGE_KEY = 'quote_rotator_pool_v1';

    const QuoteRotator = {
        _pool: [],
        _index: 0,

        /**
         * 初始化：尝试从 localStorage 恢复进度；
         * 若没有保存记录或记录已用完则重新洗牌。
         */
        init: function () {
            this._load();

            // 如果池子为空或索引超出长度，说明需要新的一轮
            if (!Array.isArray(this._pool) || this._pool.length === 0 || this._index >= this._pool.length) {
                this._shuffle();
            }

            this._save();
        },

        /** 获取下一条语录（保证不重复直到所有都显示过） */
        next: function () {
            if (this._index >= this._pool.length) {
                this._shuffle();
            }

            const quote = this._pool[this._index++];
            this._save();
            return quote;
        },

        /** Fisher-Yates 洗牌 */
        _shuffle: function () {
            this._pool = QUOTES.slice();
            for (let i = this._pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this._pool[i], this._pool[j]] = [this._pool[j], this._pool[i]];
            }
            this._index = 0;
        },

        /** 从 localStorage 恢复抽选进度 */
        _load: function () {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (!saved) return;

                const data = JSON.parse(saved);
                if (
                    Array.isArray(data.pool) &&
                    data.pool.length > 0 &&
                    typeof data.index === 'number' &&
                    data.index >= 0
                ) {
                    this._pool = data.pool;
                    this._index = data.index;
                }
            } catch (e) {
                // 忽略读取错误，保持当前状态（通常为空，之后会重新洗牌）
            }
        },

        /** 保存当前抽选进度到 localStorage */
        _save: function () {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    pool: this._pool,
                    index: this._index
                }));
            } catch (e) {
                // 忽略写入错误（例如隐私模式或存储已满）
            }
        }
    };

    window.QuoteRotator = QuoteRotator;
    window.QUOTES = QUOTES;
})();