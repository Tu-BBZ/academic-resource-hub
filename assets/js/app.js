/**
 * app.js - 主入口逻辑
 * 负责：JSON数据加载、分类标签筛选、卡片渲染、板块切换、移动端菜单
 */

// ============ 全局状态 ============
const AppState = {
    datasets: [],
    news: [],
    methods: [],
    currentDatasetFilter: '全部',
    currentNewsFilter: '全部',
    currentMethodFilter: '全部',
    lastUpdate: null
};

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 并行加载三个数据文件
        const [datasetsRes, newsRes, methodsRes] = await Promise.all([
            fetch('data/datasets.json'),
            fetch('data/news.json'),
            fetch('data/methods.json')
        ]);

        const [datasetsData, newsData, methodsData] = await Promise.all([
            datasetsRes.json(),
            newsRes.json(),
            methodsRes.json()
        ]);

        AppState.datasets = datasetsData.items || [];
        AppState.news = newsData.items || [];
        AppState.methods = methodsData.items || [];
        AppState.lastUpdate = datasetsData.lastUpdate || newsData.lastUpdate || methodsData.lastUpdate || new Date().toLocaleDateString('zh-CN');

        // 初始化各板块
        initStats();
        initDatasets();
        initNews();
        initMethods();
        initNavScroll();
        initMobileMenu();
        updateLastUpdate();

        // 隐藏加载动画
        setTimeout(() => {
            const overlay = document.getElementById('loadingOverlay');
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 400);
        }, 300);

    } catch (error) {
        console.error('数据加载失败:', error);
        const overlay = document.getElementById('loadingOverlay');
        overlay.innerHTML = `
            <div class="text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <p class="text-gray-600 font-medium mb-2">数据加载失败</p>
                <p class="text-gray-400 text-sm mb-4">${error.message}</p>
                <p class="text-gray-400 text-xs">请确保通过 HTTP 服务器访问（如 GitHub Pages）</p>
            </div>
        `;
    }
});

// ============ 统计信息 ============
function initStats() {
    document.getElementById('statDatasets').textContent = AppState.datasets.length;
    document.getElementById('statNews').textContent = AppState.news.length;
    document.getElementById('statMethods').textContent = AppState.methods.length;
}

// ============ 数据资源板块 ============
function initDatasets() {
    const categories = ['全部', ...new Set(AppState.datasets.map(d => d.category))];
    renderFilterTags('datasetTags', categories, AppState.currentDatasetFilter, (cat) => {
        AppState.currentDatasetFilter = cat;
        updateFilterTags('datasetTags', cat);
        renderDatasetCards();
    });
    renderDatasetCards();
}

function renderDatasetCards() {
    const container = document.getElementById('datasetCards');
    const emptyEl = document.getElementById('datasetEmpty');
    const filtered = AppState.currentDatasetFilter === '全部'
        ? AppState.datasets
        : AppState.datasets.filter(d => d.category === AppState.currentDatasetFilter);

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }
    emptyEl.classList.add('hidden');

    // 卡片图标映射
    const iconMap = {
        '人口与经济': { icon: '👥', bg: '#dbeafe' },
        '土地利用': { icon: '🗺️', bg: '#dcfce7' },
        '遥感影像': { icon: '🛰️', bg: '#f3e8ff' },
        'POI数据': { icon: '📍', bg: '#fef3c7' },
        '交通出行': { icon: '🚗', bg: '#fce7f3' },
        '自然环境': { icon: '🌿', bg: '#ecfdf5' },
        '综合平台': { icon: '🌐', bg: '#e0e7ff' },
        '矢量数据': { icon: '📐', bg: '#f0fdf4' },
        '地理编码': { icon: '🔍', bg: '#fef9c3' },
        '生态数据': { icon: '🌱', bg: '#d1fae5' },
        '气象数据': { icon: '🌤️', bg: '#dbeafe' },
        '行政区划': { icon: '🏛️', bg: '#fce7f3' },
        '社会经济': { icon: '📊', bg: '#e0e7ff' }
    };

    container.innerHTML = filtered.map((item, i) => {
        const iconInfo = iconMap[item.category] || { icon: '📁', bg: '#f3f4f6' };
        return `
        <div class="dataset-card animate-in" style="animation-delay: ${i * 0.05}s">
            <div class="card-header">
                <div class="card-icon" style="background: ${iconInfo.bg}">${iconInfo.icon}</div>
                <span class="card-category">${item.category}</span>
            </div>
            <div class="card-title">${escapeHtml(item.name)}</div>
            <div class="card-desc">${escapeHtml(item.description)}</div>
            <div class="card-footer">
                <span class="card-source">${escapeHtml(item.source || '')}</span>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-link">
                    访问链接
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                </a>
            </div>
        </div>`;
    }).join('');
}

// ============ 热点资讯板块 ============
function initNews() {
    const categories = ['全部', ...new Set(AppState.news.map(n => n.category))];
    renderFilterTags('newsTags', categories, AppState.currentNewsFilter, (cat) => {
        AppState.currentNewsFilter = cat;
        updateFilterTags('newsTags', cat);
        renderNewsCards();
    });
    renderNewsCards();
}

function renderNewsCards() {
    const container = document.getElementById('newsCards');
    const emptyEl = document.getElementById('newsEmpty');
    const filtered = AppState.currentNewsFilter === '全部'
        ? AppState.news
        : AppState.news.filter(n => n.category === AppState.currentNewsFilter);

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }
    emptyEl.classList.add('hidden');

    const tagClassMap = {
        '学术论文': 'tag-paper',
        '学术会议': 'tag-conference',
        '研究工具': 'tag-tool',
        '政策法规': 'tag-policy',
        '行业动态': 'tag-industry'
    };

    container.innerHTML = filtered.map((item, i) => {
        const date = parseDate(item.date);
        const tagClass = tagClassMap[item.category] || 'tag-industry';
        return `
        <div class="news-card animate-in" style="animation-delay: ${i * 0.04}s">
            <div class="news-date-col">
                <div class="news-day">${date.day}</div>
                <div class="news-month">${date.month}</div>
            </div>
            <div class="news-content">
                <div class="news-title">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
                </div>
                <div class="news-summary">${escapeHtml(item.summary)}</div>
                <div class="news-meta">
                    <span class="news-tag ${tagClass}">${item.category}</span>
                    ${item.tags ? item.tags.map(t => `<span class="news-tag tag-tool">${escapeHtml(t)}</span>`).join('') : ''}
                    <span class="news-source">${escapeHtml(item.source || '')}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============ 分析方法板块 ============
function initMethods() {
    const categories = ['全部', ...new Set(AppState.methods.map(m => m.category))];
    renderFilterTags('methodTags', categories, AppState.currentMethodFilter, (cat) => {
        AppState.currentMethodFilter = cat;
        updateFilterTags('methodTags', cat);
        renderMethodGroups();
    });
    renderMethodGroups();
}

function renderMethodGroups() {
    const container = document.getElementById('methodGroups');
    const emptyEl = document.getElementById('methodEmpty');
    const filtered = AppState.currentMethodFilter === '全部'
        ? AppState.methods
        : AppState.methods.filter(m => m.category === AppState.currentMethodFilter);

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }
    emptyEl.classList.add('hidden');

    // 按分类分组
    const groups = {};
    filtered.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
    });

    // 分组图标
    const groupIconMap = {
        '描述统计': '📊',
        '回归分析': '📈',
        '空间计量': '🌐',
        'GIS空间分析': '🗺️',
        '机器学习': '🤖',
        '质性分析': '📝',
        '多准则决策': '⚖️',
        '网络分析': '🔗',
        '时间序列': '⏱️'
    };

    container.innerHTML = Object.entries(groups).map(([category, items], gi) => `
        <div class="method-group expanded animate-in" style="animation-delay: ${gi * 0.08}s">
            <div class="method-group-header" onclick="toggleMethodGroup(this)">
                <span class="group-title">
                    ${groupIconMap[category] || '📁'} ${escapeHtml(category)}
                </span>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="group-count">${items.length} 种方法</span>
                    <svg class="expand-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            <div class="method-group-body">
                ${items.map(item => `
                    <div class="method-item">
                        <div class="method-name">${escapeHtml(item.name)}</div>
                        <div class="method-desc">${escapeHtml(item.description)}</div>
                        ${item.links && item.links.length > 0 ? `
                            <div class="method-links">
                                ${item.links.map(link => `
                                    <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="method-link">
                                        ${escapeHtml(link.title)}
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                        </svg>
                                    </a>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${item.tools && item.tools.length > 0 ? `
                            <div class="method-tools">
                                ${item.tools.map(t => `<span class="tool-badge">${escapeHtml(t)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ============ 分类标签渲染 ============
function renderFilterTags(containerId, categories, activeCategory, onClick) {
    const container = document.getElementById(containerId);
    container.innerHTML = categories.map(cat => {
        const isActive = cat === activeCategory;
        const count = cat === '全部'
            ? getTotalCount(containerId.replace('Tags', ''))
            : getCountByCategory(containerId.replace('Tags', ''), cat);
        return `
            <button class="filter-tag ${isActive ? 'active' : ''}" data-category="${cat}">
                ${cat}<span class="tag-count">${count}</span>
            </button>
        `;
    }).join('');

    container.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            onClick(btn.dataset.category);
        });
    });
}

function updateFilterTags(containerId, activeCategory) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('.filter-tag').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === activeCategory);
    });
}

function getTotalCount(section) {
    if (section === 'dataset') return AppState.datasets.length;
    if (section === 'news') return AppState.news.length;
    if (section === 'method') return AppState.methods.length;
    return 0;
}

function getCountByCategory(section, category) {
    let data;
    if (section === 'dataset') data = AppState.datasets;
    else if (section === 'news') data = AppState.news;
    else if (section === 'method') data = AppState.methods;
    else return 0;
    return data.filter(item => item.category === category).length;
}

// ============ 分析方法分组折叠 ============
function toggleMethodGroup(headerEl) {
    const group = headerEl.parentElement;
    group.classList.toggle('expanded');
}

// ============ 导航栏滚动效果 ============
function initNavScroll() {
    const navbar = document.getElementById('navbar');
    const sections = ['datasets', 'news', 'methods'];

    window.addEventListener('scroll', () => {
        // 导航栏阴影
        navbar.classList.toggle('scrolled', window.scrollY > 10);

        // 激活当前板块的导航链接
        let currentSection = '';
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top <= 120) {
                currentSection = id;
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + currentSection);
        });
    });
}

// ============ 移动端菜单 ============
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    // 点击链接后关闭菜单
    menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

// ============ 最后更新时间 ============
function updateLastUpdate() {
    document.getElementById('lastUpdate').textContent = AppState.lastUpdate;
}

// ============ 工具函数 ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseDate(dateStr) {
    if (!dateStr) return { day: '--', month: '--' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        // 尝试解析 YYYY-MM-DD 格式
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            return { day: parseInt(parts[2]), month: parts[1] + '月' };
        }
        return { day: '--', month: '--' };
    }
    return {
        day: d.getDate(),
        month: (d.getMonth() + 1) + '月'
    };
}
