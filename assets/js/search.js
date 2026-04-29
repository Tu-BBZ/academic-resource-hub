/**
 * search.js - 全局搜索模块
 * 负责：关键词搜索、多字段匹配、结果高亮、下拉展示
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');

    let debounceTimer = null;
    let currentIndex = -1;

    // 搜索输入事件（300ms防抖）
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        // 显示/隐藏清除按钮
        searchClear.style.display = query ? 'flex' : 'none';

        if (!query) {
            hideResults();
            return;
        }

        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // 清除按钮
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        hideResults();
        searchInput.focus();
    });

    // 键盘导航
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = Math.min(currentIndex + 1, items.length - 1);
            updateActiveResult(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = Math.max(currentIndex - 1, 0);
            updateActiveResult(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentIndex >= 0 && items[currentIndex]) {
                items[currentIndex].click();
            }
        } else if (e.key === 'Escape') {
            hideResults();
        }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchInput') && !e.target.closest('#searchResults')) {
            hideResults();
        }
    });

    // ============ 执行搜索 ============
    function performSearch(query) {
        const keywords = query.toLowerCase().split(/\s+/);
        const results = [];

        // 搜索数据资源
        AppState.datasets.forEach(item => {
            const score = matchScore(item, keywords, ['name', 'description', 'category', 'tags', 'source']);
            if (score > 0) {
                results.push({ ...item, _type: 'dataset', _score: score, _section: '#datasets' });
            }
        });

        // 搜索热点资讯
        AppState.news.forEach(item => {
            const score = matchScore(item, keywords, ['title', 'summary', 'category', 'tags', 'source']);
            if (score > 0) {
                results.push({ ...item, _type: 'news', _score: score, _section: '#news' });
            }
        });

        // 搜索分析方法
        AppState.methods.forEach(item => {
            const score = matchScore(item, keywords, ['name', 'description', 'category', 'tools']);
            if (score > 0) {
                results.push({ ...item, _type: 'method', _score: score, _section: '#methods' });
            }
        });

        // 按得分排序
        results.sort((a, b) => b._score - a._score);

        // 限制显示数量
        const display = results.slice(0, 20);

        renderResults(display, query);
        currentIndex = -1;
    }

    // ============ 匹配得分 ============
    function matchScore(item, keywords, fields) {
        let score = 0;
        const text = fields
            .map(f => {
                const val = item[f];
                return Array.isArray(val) ? val.join(' ') : (val || '');
            })
            .join(' ')
            .toLowerCase();

        keywords.forEach(kw => {
            if (text.includes(kw)) {
                score++;
                // 标题匹配加权
                const title = (item.name || item.title || '').toLowerCase();
                if (title.includes(kw)) score += 3;
                // 完全匹配加权
                if (title === kw) score += 5;
            }
        });

        return score;
    }

    // ============ 渲染搜索结果 ============
    function renderResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <svg class="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <p class="text-sm">未找到相关结果</p>
                </div>
            `;
            searchResults.classList.remove('hidden');
            return;
        }

        const typeLabels = {
            dataset: '数据资源',
            news: '热点资讯',
            method: '分析方法'
        };

        searchResults.innerHTML = results.map((item, i) => {
            let title, desc;
            if (item._type === 'dataset') {
                title = highlightText(item.name, query);
                desc = highlightText(item.description, query);
            } else if (item._type === 'news') {
                title = highlightText(item.title, query);
                desc = highlightText(item.summary, query);
            } else {
                title = highlightText(item.name, query);
                desc = highlightText(item.description, query);
            }

            return `
                <div class="search-result-item" data-index="${i}" data-section="${item._section}" onclick="navigateToSection('${item._section}')">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span class="result-category cat-${item._type}">${typeLabels[item._type]}</span>
                        <span style="font-size:12px;color:#9ca3af;">${item.category || ''}</span>
                    </div>
                    <div style="font-size:14px;font-weight:600;color:#1f2937;line-height:1.4;">${title}</div>
                    <div style="font-size:12px;color:#6b7280;line-height:1.4;margin-top:2px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${desc}</div>
                </div>
            `;
        }).join('');

        searchResults.classList.remove('hidden');
    }

    // ============ 高亮匹配文字 ============
    function highlightText(text, query) {
        if (!text || !query) return escapeHtml(text || '');
        const escaped = escapeHtml(text);
        const keywords = query.toLowerCase().split(/\s+/);
        let result = escaped;

        keywords.forEach(kw => {
            const regex = new RegExp(`(${escapeRegex(kw)})`, 'gi');
            result = result.replace(regex, '<span class="search-highlight">$1</span>');
        });

        return result;
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============ 导航到对应板块 ============
    window.navigateToSection = function(section) {
        hideResults();
        const el = document.querySelector(section);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            // 添加高亮闪烁效果
            el.style.transition = 'box-shadow 0.3s';
            el.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.3)';
            setTimeout(() => {
                el.style.boxShadow = 'none';
            }, 1500);
        }
    };

    // ============ 隐藏搜索结果 ============
    function hideResults() {
        searchResults.classList.add('hidden');
        currentIndex = -1;
    }

    // ============ 键盘导航高亮 ============
    function updateActiveResult(items) {
        items.forEach((item, i) => {
            item.style.background = i === currentIndex ? '#f0f7ff' : '';
        });
        if (items[currentIndex]) {
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        }
    }
});
