#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

APP_PATH = '/Users/mianmian/WorkBuddy/2026-08-20-09-33-44/growtree/app.js'
CSS_PATH = '/Users/mianmian/WorkBuddy/2026-08-20-09-33-44/growtree/styles.css'

with open(APP_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. bump build
if "const APP_BUILD = '20260820f';" not in text:
    raise RuntimeError('APP_BUILD marker not found')
text = text.replace("const APP_BUILD = '20260820f';", "const APP_BUILD = '20260820g';")

# 2. enrich BOOKS with rating/tags
book_meta = [
    ('认知觉醒', 4.7, ['个人成长', '职场工作', '情绪处理']),
    ('被讨厌的勇气', 4.6, ['情绪处理', '个人成长']),
    ('非暴力沟通', 4.5, ['情绪处理', '职场工作']),
    ('也许你该找个人聊聊', 4.6, ['情绪处理', '个人成长']),
    ('与生命和解', 4.4, ['个人成长', '情绪处理']),
    ('活着', 4.9, ['文学小说', '个人成长']),
    ('蛤蟆先生去看心理医生', 4.5, ['情绪处理', '个人成长']),
    ('小王子', 4.8, ['文学小说', '个人成长']),
    ('人类简史', 4.7, ['社科人文', '个人成长']),
]
for title, rating, tags in book_meta:
    pat = rf"(title:\s*'{re.escape(title)}'[\s\S]*?desc:\s*'[^']+?',)"
    repl = r"\1\n        rating: " + str(rating) + ", tags: " + str(tags).replace("'", "'") + ","
    new_text, n = re.subn(pat, repl, text, count=1)
    if n != 1:
        raise RuntimeError(f'failed to enrich book: {title}')
    text = new_text

# 3. replace renderReading block
old_block = re.search(
    r"// ==================== 学习模块 ====================\nfunction renderReading\(\) \{[\s\S]*?function closeBookReview\(\) \{\n    document\.getElementById\('bookReviewModal'\)\.classList\.remove\('show'\);\n\}",
    text
)
if not old_block:
    raise RuntimeError('renderReading block not found')

new_block = r'''// ==================== 阅读板块（build 20260820g） ====================

function renderReading() {
    const tab = state._readingTab || 'daily';
    const tag = state._readingTag || 'all';
    const query = (state._readingQuery || '').trim().toLowerCase();
    const allTags = getReadingTags();
    const idx = getDailyIndex(BOOKS);
    const dailyBooks = [0, 1].map(i => BOOKS[(idx + i) % BOOKS.length]);
    const listBooks = getReadingListBooks(tag);

    return `
        <div class="reading-wrap">
            <div class="reading-search-row">
                <div class="reading-search-input-wrap">
                    <input type="text" id="readingSearchInput" class="input reading-search-input" placeholder="输入书名或作者搜索当前书籍…" data-action="reading-search-input" value="${escapeHtml(query)}">
                    <button class="btn btn-primary reading-search-btn" data-action="reading-web-search">🔍 联网搜索</button>
                </div>
                <div class="reading-search-tip">本地搜索实时过滤；按回车从 Google Books / 豆瓣 / 知乎 获取更多结果</div>
            </div>

            <div class="card tab-card reading-tab-card">
                <div class="tab-bar">
                    <button class="tab-btn ${tab === 'daily' ? 'active' : ''}" data-action="reading-tab" data-tab="daily">📅 每日推荐</button>
                    <button class="tab-btn ${tab === 'analysis' ? 'active' : ''}" data-action="reading-tab" data-tab="analysis">🔍 深度评析</button>
                    <button class="tab-btn ${tab === 'list' ? 'active' : ''}" data-action="reading-tab" data-tab="list">🏆 书单</button>
                </div>
            </div>

            <div class="reading-panels">
                <div class="reading-panel ${tab === 'daily' ? 'active' : ''}" id="readingPanel-daily">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">📖 每日好书推荐</div>
                            <span style="font-size:12px;color:var(--text-secondary)">每日 2 本 · 深度评析</span>
                        </div>
                        ${dailyBooks.map((b, i) => renderReadingDailyItem(b, (idx + i) % BOOKS.length, i + 1)).join('')}
                    </div>
                </div>

                <div class="reading-panel ${tab === 'analysis' ? 'active' : ''}" id="readingPanel-analysis">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">🔍 深度评析与交互</div>
                            <span style="font-size:12px;color:var(--text-secondary)">${BOOKS.length} 本 · 点击卡片查看完整评析</span>
                        </div>
                        <div class="reading-grid">
                            ${BOOKS.map((b, i) => renderReadingAnalysisCard(b, i)).join('')}
                        </div>
                    </div>
                </div>

                <div class="reading-panel ${tab === 'list' ? 'active' : ''}" id="readingPanel-list">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">🏆 值得阅读的书单 Top 10</div>
                            <span style="font-size:12px;color:var(--text-secondary)">每日更新 · 按评分与热度排序</span>
                        </div>
                        <div class="reading-tag-bar">
                            ${allTags.map(t => `<button class="reading-tag-chip ${tag === t.id ? 'active' : ''}" data-action="reading-tag" data-tag="${escapeHtml(t.id)}">${escapeHtml(t.name)}${t.count ? ` · ${t.count}` : ''}</button>`).join('')}
                        </div>
                        <div class="reading-list">
                            ${listBooks.length ? listBooks.map((b, i) => renderReadingListItem(b, BOOKS.indexOf(b), i + 1)).join('') : '<div class="reading-empty"><span class="emoji">📭</span>该标签下暂无书籍</div>'}
                        </div>
                    </div>
                </div>
            </div>

            <div id="readingWebResults"></div>
        </div>
    `;
}

function bookTeaser(book) {
    if (!book.deepRead) return '暂无书本评析';
    const first = book.deepRead.split(/\n\n/).filter(p => p.trim())[0] || '';
    const text = first.trim();
    if (text.length > 140) return text.slice(0, 140).trim() + '…';
    return text;
}

function bookFramework(book) {
    if (!book.deepRead) return [];
    return book.deepRead.split(/\n\n/).filter(p => p.trim()).slice(0, 5).map(p => {
        const t = p.trim();
        return t.length > 80 ? t.slice(0, 80) + '…' : t;
    });
}

function bookFullReview(book) {
    if (!book.deepRead) return '<p>暂无书本评析</p>';
    return book.deepRead.split(/\n\n/).filter(p => p.trim()).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
}

function readingCoverUrl(book) {
    const cache = state.data.apiCache || {};
    const key = 'bookCover_' + book.title;
    if (cache[key]) return cache[key];
    return `https://placehold.co/120x170/6b8e5e/ffffff?text=${encodeURIComponent(book.title.slice(0, 4))}`;
}

function renderBookTags(book) {
    if (!book.tags || !book.tags.length) return '';
    return `<div class="reading-tags">${book.tags.map(t => `<span class="reading-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
}

function renderReadingDailyItem(book, realIdx, rank) {
    const searchText = escapeHtml([book.title, book.author, book.platform, ...(book.tags || [])].join(' ').toLowerCase());
    return `
        <div class="reading-item" data-book-idx="${realIdx}" data-search="${searchText}">
            <div class="reading-rank">${rank}</div>
            <img class="reading-cover" src="${readingCoverUrl(book)}" alt="${escapeHtml(book.title)}" loading="lazy">
            <div class="reading-body">
                <div class="reading-title-row">
                    <div class="reading-title">${escapeHtml(book.title)}</div>
                    <div class="reading-rating">⭐ ${book.rating}</div>
                </div>
                <div class="reading-author">${escapeHtml(book.author)} · ${escapeHtml(book.platform)}</div>
                ${renderBookTags(book)}
                <div class="reading-desc">${escapeHtml(book.desc)}</div>
                <div class="reading-review">
                    <span class="review-label">书本评析：</span>
                    <span class="review-text">${escapeHtml(bookTeaser(book))}</span>
                </div>
                <button class="btn btn-secondary reading-expand" data-action="open-book-review" data-idx="${realIdx}">查看完整书本评析</button>
                <div class="reading-actions">
                    <button class="btn btn-primary" data-action="open-link" data-link="https://weread.qq.com/web/search?keyword=${encodeURIComponent(book.title)}" style="font-size:12px">📖 微信读书</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://www.ximalaya.com/search/${encodeURIComponent(book.title)}" style="font-size:12px">🎧 喜马拉雅</button>
                </div>
            </div>
        </div>
    `;
}

function renderReadingAnalysisCard(book, realIdx) {
    const searchText = escapeHtml([book.title, book.author, book.platform, ...(book.tags || [])].join(' ').toLowerCase());
    return `
        <div class="reading-card" data-book-idx="${realIdx}" data-search="${searchText}" data-action="open-book-review" data-idx="${realIdx}">
            <img class="reading-cover" src="${readingCoverUrl(book)}" alt="${escapeHtml(book.title)}" loading="lazy">
            <div class="reading-card-body">
                <div class="reading-card-title">${escapeHtml(book.title)}</div>
                <div class="reading-card-author">${escapeHtml(book.author)}</div>
                <div class="reading-card-rating">⭐ ${book.rating}</div>
                <div class="reading-card-desc">${escapeHtml(book.desc)}</div>
                ${renderBookTags(book)}
            </div>
        </div>
    `;
}

function renderReadingListItem(book, realIdx, rank) {
    const searchText = escapeHtml([book.title, book.author, book.platform, ...(book.tags || [])].join(' ').toLowerCase());
    return `
        <div class="reading-item reading-list-item" data-book-idx="${realIdx}" data-search="${searchText}">
            <div class="reading-rank ${rank <= 3 ? 'reading-rank-top' : ''}">${rank}</div>
            <img class="reading-cover reading-cover-sm" src="${readingCoverUrl(book)}" alt="${escapeHtml(book.title)}" loading="lazy">
            <div class="reading-body">
                <div class="reading-title-row">
                    <div class="reading-title">${escapeHtml(book.title)}</div>
                    <div class="reading-rating">⭐ ${book.rating}</div>
                </div>
                <div class="reading-author">${escapeHtml(book.author)}</div>
                <div class="reading-desc">${escapeHtml(book.desc)}</div>
                ${renderBookTags(book)}
            </div>
        </div>
    `;
}

function getReadingTags() {
    const counts = {};
    BOOKS.forEach(b => (b.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    const hardTags = ['全部', '科幻', '个人成长', '情绪处理', '职场工作', '文学小说', '社科人文'];
    return hardTags.map(name => ({ id: name === '全部' ? 'all' : name, name, count: counts[name] || 0 }));
}

function getReadingListBooks(tag) {
    let list = BOOKS.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.title.localeCompare(b.title, 'zh'));
    if (tag && tag !== 'all') {
        list = list.filter(b => (b.tags || []).includes(tag));
    }
    return list.slice(0, 10);
}

function openBookReview(idx) {
    const book = BOOKS[idx];
    if (!book) return;
    const titleEl = document.getElementById('bookReviewTitle');
    const bodyEl = document.getElementById('bookReviewBody');
    if (titleEl) titleEl.textContent = `📖 ${book.title}`;
    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="reading-modal-head">
                <img class="reading-modal-cover" src="${readingCoverUrl(book)}" alt="${escapeHtml(book.title)}">
                <div class="reading-modal-meta">
                    <div class="reading-modal-title">${escapeHtml(book.title)}</div>
                    <div class="reading-modal-author">${escapeHtml(book.author)} · ${escapeHtml(book.platform)}</div>
                    <div class="reading-modal-rating">⭐ ${book.rating}</div>
                    ${renderBookTags(book)}
                    <div class="reading-modal-desc">${escapeHtml(book.desc)}</div>
                </div>
            </div>
            <div class="reading-modal-section">
                <h4>📚 重点框架目录</h4>
                <ul class="reading-framework">
                    ${bookFramework(book).map(p => `<li>${escapeHtml(p)}</li>`).join('') || '<li>暂无框架目录</li>'}
                </ul>
            </div>
            <div class="reading-modal-section">
                <h4>📝 完整深度评析</h4>
                ${bookFullReview(book)}
            </div>
            <div class="reading-modal-section">
                <h4>🔗 延伸阅读</h4>
                <div class="reading-actions">
                    <button class="btn btn-primary" data-action="open-link" data-link="https://weread.qq.com/web/search?keyword=${encodeURIComponent(book.title)}">📖 微信读书</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://www.ximalaya.com/search/${encodeURIComponent(book.title)}">🎧 喜马拉雅</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://www.douban.com/search?q=${encodeURIComponent(book.title)}">🌐 豆瓣搜索</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://www.zhihu.com/search?type=content&q=${encodeURIComponent(book.title)}">💬 知乎搜索</button>
                </div>
            </div>
        `;
    }
    document.getElementById('bookReviewModal').classList.add('show');
}

function closeBookReview() {
    document.getElementById('bookReviewModal').classList.remove('show');
}

function filterReadingCards() {
    const q = (state._readingQuery || '').trim().toLowerCase();
    document.querySelectorAll('.reading-item, .reading-card').forEach(el => {
        const text = (el.dataset.search || '').toLowerCase();
        el.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
}

async function doReadingWebSearch() {
    const input = document.getElementById('readingSearchInput');
    const q = (input && input.value || '').trim();
    if (!q) { toast('请输入书名或作者'); return; }
    const wrap = document.getElementById('readingWebResults');
    if (!wrap) return;
    wrap.innerHTML = `
        <div class="card reading-web-card">
            <div class="card-header"><div class="card-title">🌐 联网搜索结果</div><span style="font-size:12px;color:var(--text-secondary)">来自 Google Books</span></div>
            <div class="reading-loading">正在搜索「${escapeHtml(q)}」…</div>
        </div>
    `;
    try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&langRestrict=zh`;
        const res = await fetch(url);
        const data = await res.json();
        renderWebBookResults(q, data.items || []);
    } catch (e) {
        wrap.innerHTML = `
            <div class="card reading-web-card">
                <div class="card-header"><div class="card-title">🌐 联网搜索结果</div></div>
                <div class="reading-empty">联网搜索失败，已为你打开外部搜索页面</div>
                <div class="reading-actions" style="padding:0 16px 16px">
                    <button class="btn btn-primary" data-action="open-link" data-link="https://www.google.com/search?tbm=bks&q=${encodeURIComponent(q)}">Google Books</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://www.douban.com/search?q=${encodeURIComponent(q)}">豆瓣搜索</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://www.zhihu.com/search?type=content&q=${encodeURIComponent(q)}">知乎搜索</button>
                </div>
            </div>
        `;
        openExternal(`https://www.google.com/search?tbm=bks&q=${encodeURIComponent(q)}`);
    }
}

function renderWebBookResults(q, items) {
    const wrap = document.getElementById('readingWebResults');
    if (!wrap) return;
    const list = items.slice(0, 8).map(item => {
        const info = item.volumeInfo || {};
        const title = info.title || '未知书名';
        const authors = (info.authors || []).join(' / ') || '未知作者';
        const thumb = info.imageLinks && info.imageLinks.thumbnail ? info.imageLinks.thumbnail.replace('http:', 'https:') : '';
        const desc = info.description || '暂无简介';
        const rating = info.averageRating ? `⭐ ${info.averageRating}` : '';
        const link = info.infoLink || `https://books.google.com/books?q=${encodeURIComponent(title)}`;
        return `
            <div class="web-result">
                ${thumb ? `<img class="web-result-cover" src="${thumb}" alt="" loading="lazy">` : '<div class="web-result-cover web-result-placeholder">📚</div>'}
                <div class="web-result-body">
                    <div class="web-result-title">${escapeHtml(title)}</div>
                    <div class="web-result-author">${escapeHtml(authors)} ${rating ? `<span class="web-result-rating">${rating}</span>` : ''}</div>
                    <div class="web-result-desc">${escapeHtml(desc.slice(0, 120))}${desc.length > 120 ? '…' : ''}</div>
                    <div class="reading-actions">
                        <button class="btn btn-primary" data-action="open-link" data-link="${escapeHtml(link)}" style="font-size:12px">查看详情</button>
                        <button class="btn btn-secondary" data-action="open-link" data-link="https://www.douban.com/search?q=${encodeURIComponent(title)}" style="font-size:12px">豆瓣</button>
                        <button class="btn btn-secondary" data-action="open-link" data-link="https://www.zhihu.com/search?type=content&q=${encodeURIComponent(title)}" style="font-size:12px">知乎</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    wrap.innerHTML = `
        <div class="card reading-web-card">
            <div class="card-header">
                <div class="card-title">🌐 联网搜索结果</div>
                <span style="font-size:12px;color:var(--text-secondary)">「${escapeHtml(q)}」· 来自 Google Books</span>
            </div>
            ${list || '<div class="reading-empty">未找到相关书籍，试试在豆瓣 / 知乎搜索</div>'}
            <div class="reading-actions" style="padding:0 16px 16px">
                <button class="btn btn-secondary" data-action="open-link" data-link="https://www.douban.com/search?q=${encodeURIComponent(q)}">在豆瓣搜索</button>
                <button class="btn btn-secondary" data-action="open-link" data-link="https://www.zhihu.com/search?type=content&q=${encodeURIComponent(q)}">在知乎搜索</button>
            </div>
        </div>
    `;
}

function initReading() {
    filterReadingCards();
    loadBookCovers();
}

async function loadBookCovers() {
    if (state._bookCoversLoading) return;
    state._bookCoversLoading = true;
    const cache = state.data.apiCache || {};
    let changed = false;
    for (const b of BOOKS) {
        const key = 'bookCover_' + b.title;
        if (cache[key]) continue;
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(b.title + ' ' + b.author)}&maxResults=1`);
            const data = await res.json();
            const img = data.items && data.items[0] && data.items[0].volumeInfo && data.items[0].volumeInfo.imageLinks && data.items[0].volumeInfo.imageLinks.thumbnail;
            if (img) {
                cache[key] = img.replace('http:', 'https:');
                changed = true;
            }
        } catch (e) {}
    }
    if (changed) saveState();
    state._bookCoversLoading = false;
    document.querySelectorAll('img.reading-cover, img.reading-modal-cover').forEach(img => {
        const wrap = img.closest('[data-book-idx]');
        const b = wrap ? BOOKS[parseInt(wrap.dataset.bookIdx)] : null;
        if (!b) return;
        const url = readingCoverUrl(b);
        if (url && img.src !== url) img.src = url;
    });
}
'''

text = text[:old_block.start()] + new_block + text[old_block.end():]

# 4. replace open/close handlers with expanded block
old_handlers = """        if (action === 'open-book-review') {
            openBookReview(parseInt(el.dataset.idx));
            return;
        }

        if (action === 'close-book-review') {
            closeBookReview();
            return;
        }"""
if old_handlers not in text:
    raise RuntimeError('book review handlers not found')
new_handlers = """        if (action === 'open-book-review') {
            openBookReview(parseInt(el.dataset.idx));
            return;
        }

        if (action === 'reading-tab') {
            state._readingTab = el.dataset.tab;
            render();
            return;
        }

        if (action === 'reading-tag') {
            state._readingTag = el.dataset.tag;
            render();
            return;
        }

        if (action === 'reading-web-search') {
            doReadingWebSearch();
            return;
        }

        if (action === 'close-book-review') {
            closeBookReview();
            return;
        }"""
text = text.replace(old_handlers, new_handlers)

# 5. input handler for reading search
old_input = """        if (action === 'reading-note' || action === 'memo') {
            updateMemo(el.value);
            if (el.value.trim()) awardContentBonus();
        }
    });"""
if old_input not in text:
    raise RuntimeError('input handler block not found')
new_input = """        if (action === 'reading-note' || action === 'memo') {
            updateMemo(el.value);
            if (el.value.trim()) awardContentBonus();
        }
        if (action === 'reading-search-input') {
            state._readingQuery = el.value;
            filterReadingCards();
            return;
        }
    });"""
text = text.replace(old_input, new_input)

# 6. keydown handler for reading search Enter
old_keydown = """        else if (el.id === 'checkInName') { e.preventDefault(); document.querySelector('[data-action="add-checkin"]')?.click(); }
    });"""
if old_keydown not in text:
    raise RuntimeError('keydown handler block not found')
new_keydown = """        else if (el.id === 'checkInName') { e.preventDefault(); document.querySelector('[data-action="add-checkin"]')?.click(); }
        else if (el.id === 'readingSearchInput') { e.preventDefault(); doReadingWebSearch(); }
    });"""
text = text.replace(old_keydown, new_keydown)

# 7. render() initReading
old_render = """    // 英语学习 → 英语游乐场：仅当该视图已渲染（含 #egLessonOutput）时才初始化交互
    if (document.getElementById('egLessonOutput')) initEnglishPlayground();
}"""
if old_render not in text:
    raise RuntimeError('render() init block not found')
new_render = """    // 英语学习 → 英语游乐场：仅当该视图已渲染（含 #egLessonOutput）时才初始化交互
    if (document.getElementById('egLessonOutput')) initEnglishPlayground();
    // 阅读板块交互初始化
    if (document.getElementById('readingSearchInput')) initReading();
}"""
text = text.replace(old_render, new_render)

with open(APP_PATH, 'w', encoding='utf-8') as f:
    f.write(text)

# 8. append CSS
reading_css = r'''
/* ===== 阅读板块升级（build 20260820g） ===== */

.reading-search-row { margin-bottom: 14px; }
.reading-search-input-wrap { display: flex; gap: 10px; }
.reading-search-input { flex: 1; min-width: 0; }
.reading-search-btn { flex-shrink: 0; white-space: nowrap; }
.reading-search-tip { font-size: 12px; color: var(--text-secondary); margin-top: 6px; padding-left: 2px; }
.reading-tab-card { margin-bottom: 14px; padding: 6px; }
.reading-tab-card .tab-bar { display: flex; gap: 8px; }
.reading-tab-card .tab-btn { flex: 1; justify-content: center; font-size: 13px; }
.reading-panels { position: relative; }
.reading-panel { display: none; }
.reading-panel.active { display: block; animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.reading-item { display: flex; gap: 14px; background: var(--bg); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px; align-items: flex-start; }
.reading-list-item { align-items: center; }
.reading-rank { width: 26px; height: 26px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
.reading-rank-top { background: var(--primary); color: #fff; }
.reading-cover { width: 90px; height: 126px; border-radius: 8px; object-fit: cover; background: var(--surface); flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.reading-cover-sm { width: 64px; height: 90px; }
.reading-body { flex: 1; min-width: 0; }
.reading-title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.reading-title { font-weight: 700; font-size: 15px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reading-rating { font-size: 13px; color: #f5a623; font-weight: 600; flex-shrink: 0; }
.reading-author { font-size: 12px; color: var(--primary); background: var(--primary-light); padding: 2px 8px; border-radius: 8px; display: inline-block; margin-bottom: 6px; }
.reading-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.reading-review { font-size: 13px; color: var(--text); line-height: 1.5; background: var(--surface-2); padding: 10px 12px; border-radius: 10px; border-left: 3px solid var(--primary); margin-bottom: 10px; }
.reading-review .review-label { color: var(--primary-dark); font-weight: 600; }
.reading-expand { width: 100%; margin-bottom: 10px; font-size: 13px; }
.reading-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.reading-actions .btn { font-size: 12px; }
.reading-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.reading-tag { font-size: 11px; color: var(--text-secondary); background: var(--surface); border: 1px solid var(--border); padding: 2px 8px; border-radius: 10px; }

.reading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; padding-top: 4px; }
.reading-card { background: var(--bg); border-radius: var(--radius-sm); padding: 12px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.reading-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.reading-card .reading-cover { width: 100%; height: 160px; object-fit: cover; margin-bottom: 10px; border-radius: var(--radius-sm); }
.reading-card-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reading-card-author { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.reading-card-rating { font-size: 12px; color: #f5a623; font-weight: 600; margin-bottom: 6px; }
.reading-card-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }

.reading-tag-bar { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 16px 14px; border-bottom: 1px solid var(--border); margin: 0 -16px 12px; }
.reading-tag-chip { font-size: 12px; color: var(--text-secondary); background: var(--bg); border: 1px solid var(--border); padding: 5px 12px; border-radius: 16px; cursor: pointer; transition: all 0.15s ease; }
.reading-tag-chip:hover, .reading-tag-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.reading-list { display: flex; flex-direction: column; gap: 10px; }
.reading-empty { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 14px; }
.reading-empty .emoji { display: block; font-size: 32px; margin-bottom: 8px; }
.reading-loading { padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px; }

.reading-web-card { margin-top: 14px; }
.web-result { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: flex-start; }
.web-result:last-child { border-bottom: none; }
.web-result-cover { width: 64px; height: 90px; border-radius: 6px; object-fit: cover; background: var(--surface); flex-shrink: 0; }
.web-result-placeholder { display: flex; align-items: center; justify-content: center; font-size: 28px; }
.web-result-body { flex: 1; min-width: 0; }
.web-result-title { font-weight: 700; font-size: 14px; color: var(--text); margin-bottom: 4px; }
.web-result-author { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.web-result-rating { color: #f5a623; margin-left: 6px; font-weight: 600; }
.web-result-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 8px; }

.reading-modal-head { display: flex; gap: 14px; margin-bottom: 14px; }
.reading-modal-cover { width: 96px; height: 134px; border-radius: 8px; object-fit: cover; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.reading-modal-meta { flex: 1; min-width: 0; }
.reading-modal-title { font-weight: 700; font-size: 17px; margin-bottom: 4px; }
.reading-modal-author { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.reading-modal-rating { font-size: 13px; color: #f5a623; font-weight: 600; margin-bottom: 8px; }
.reading-modal-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.reading-modal-section { margin-top: 14px; }
.reading-modal-section h4 { font-size: 14px; color: var(--primary-dark); margin-bottom: 8px; }
.reading-framework { margin: 0; padding-left: 20px; }
.reading-framework li { font-size: 13px; color: var(--text); line-height: 1.6; }

/* 英语等级 tooltip 更紧凑，避免穿屏（build 20260820g） */
.eg-level-tooltip {
    font-size: 12px !important;
    min-width: 200px !important;
    max-width: min(280px, calc(100vw - 32px)) !important;
    padding: 10px 12px !important;
    line-height: 1.5 !important;
}
.eg-level-tooltip .eg-title { font-size: 13px !important; }
.eg-level-tooltip .eg-row { font-size: 12px !important; padding: 1px 0 !important; gap: 8px !important; }
.eg-level-tooltip .eg-row .eg-symbol { font-size: 16px !important; min-width: 22px !important; }
.eg-level-tooltip .eg-row .eg-name { min-width: 56px !important; font-size: 12px !important; }
.eg-level-tooltip .eg-row .eg-level { font-size: 11px !important; }
.eg-level-tooltip .eg-footer { font-size: 11px !important; }
'''

with open(CSS_PATH, 'a', encoding='utf-8') as f:
    f.write(reading_css)

print('OK: app + css patched')
