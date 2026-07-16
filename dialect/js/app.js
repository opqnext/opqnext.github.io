/**
 * 涿鹿方言数字博物馆 — 主应用逻辑
 * SPA hash 路由，动态加载 JSON 数据并渲染各页面
 */

const App = {
  data: {},
  PAGE_SIZE: 30,
  currentPage: 1,
  currentVolume: 'all',
  currentLetter: 'all',
  searchQuery: '',

  /* ====== 初始化 ====== */
  async init() {
    this.initTheme();
    await this.loadData();
    this.bindEvents();
    this.initScrollReveal();
    this.route();
    window.addEventListener('hashchange', () => this.route());
  },

  async loadData() {
    const files = ['meta', 'academic', 'vocab-2012', 'vocab-2014', 'idioms', 'categories'];
    const results = await Promise.all(
      files.map(f => fetch(`data/${f}.json`).then(r => r.json()))
    );
    this.data.meta = results[0];
    this.data.academic = results[1];
    this.data.vocab2012 = results[2];
    this.data.vocab2014 = results[3];
    this.data.idioms = results[4];
    this.data.categories = results[5];

    // 合并所有词条为扁平数组，方便搜索
    this.allEntries = [];
    for (const vol of this.data.vocab2012.volumes) {
      for (const e of vol.entries) {
        e._version = '2012';
        e._volume = vol.title;
        this.allEntries.push(e);
      }
    }
    for (const vol of this.data.vocab2014.volumes) {
      for (const e of vol.entries) {
        e._version = '2014';
        e._volume = vol.title;
        this.allEntries.push(e);
      }
    }
  },

  /* ====== 暗色模式 ====== */
  initTheme() {
    const saved = localStorage.getItem('dialect-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    this.updateThemeIcon();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('dialect-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        this.updateThemeIcon();
      }
    });
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dialect-theme', next);
    this.updateThemeIcon();
  },

  updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = isDark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
      btn.title = isDark ? '切换亮色模式' : '切换暗色模式';
    }
  },

  /* ====== 滚动渐显动画 ====== */
  initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    this._revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this._revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  },

  applyReveal(container) {
    if (!this._revealObserver || !container) return;
    container.querySelectorAll('.reveal').forEach(el => {
      this._revealObserver.observe(el);
    });
  },

  /* ====== 路由 ====== */
  route() {
    const hash = location.hash.slice(1) || '/';
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('visible'));

    // 更新导航高亮
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-route') === hash);
    });

    // 关闭移动端菜单
    this.closeMobileMenu();

    if (hash === '/' || hash === '') {
      this.showPage('home');
      this.renderHome();
    } else if (hash === '/dict') {
      this.showPage('dict');
      this.renderDict();
    } else if (hash === '/academic') {
      this.showPage('academic');
      this.renderAcademic();
    } else if (hash === '/idioms') {
      this.showPage('idioms');
      this.renderIdioms();
    } else if (hash === '/daily') {
      this.showPage('daily');
      this.renderDailyPage();
    } else if (hash === '/categories') {
      this.showPage('categories');
      this.renderCategories();
    } else if (hash === '/about') {
      this.showPage('about');
    } else if (hash.startsWith('/search/')) {
      this.searchQuery = decodeURIComponent(hash.split('/search/')[1] || '');
      this.showPage('dict');
      this.renderDict();
    } else {
      this.showPage('home');
      this.renderHome();
    }
  },

  showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('visible'));
    const el = document.getElementById('page-' + id);
    if (el) el.classList.add('visible');
    window.scrollTo(0, 0);
  },

  /* ====== 移动端菜单 ====== */
  toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('nav-hamburger');
    if (menu && btn) {
      const isOpen = menu.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
    }
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('nav-hamburger');
    if (menu) menu.classList.remove('open');
    if (btn) btn.classList.remove('open');
  },

  /* ====== 事件绑定 ====== */
  bindEvents() {
    // 首页搜索
    const heroSearch = document.getElementById('hero-search');
    if (heroSearch) {
      heroSearch.addEventListener('keydown', e => {
        if (e.key === 'Enter' && heroSearch.value.trim()) {
          this.searchQuery = heroSearch.value.trim();
          location.hash = '/dict';
          setTimeout(() => {
            const dictSearch = document.getElementById('dict-search');
            if (dictSearch) dictSearch.value = this.searchQuery;
            this.currentPage = 1;
            this.renderDict();
          }, 50);
        }
      });
    }

    // 音调模式切换（全局代理）
    document.addEventListener('click', e => {
      const btn = e.target.closest('.tone-mode-btn');
      if (btn) {
        const mode = btn.dataset.mode;
        document.body.classList.toggle('tone-dots', mode === 'dots');
        document.querySelectorAll('.tone-mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.tone-mode-btn[data-mode="${mode}"]`).forEach(b => b.classList.add('active'));
      }
    });
  },

  /* ====== 首页渲染 ====== */
  renderHome() {
    const meta = this.data.meta;
    const s = meta.stats;

    this.animateNumber('stat-vocab', s.total_vocab);
    this.animateNumber('stat-idioms', s.total_idioms);
    this.animateNumber('stat-academic', s.academic_chapters);
    this.animateNumber('stat-volumes', s.vocab_2012_volumes + s.vocab_2014_volumes);

    this.renderDailyWords();
    this.applyReveal(document.getElementById('page-home'));
  },

  /* 数字递增动画 */
  animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (target - from) * ease).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /* 今日方言独立页面：3列 x 5行 = 15条随机词条 */
  renderDailyPage() {
    const container = document.getElementById('daily-page-cards');
    if (!container || this.allEntries.length === 0) return;

    const count = Math.min(15, this.allEntries.length);
    const shuffled = [...this.allEntries].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, count);

    container.innerHTML = picks.map((e, i) => `
      <div class="daily-page-card" style="animation-delay:${i * 40}ms">
        <div class="dc-headword">${ToneRenderer.render(e.headword)}</div>
        <div class="dc-gloss">${this.esc(e.gloss).substring(0, 60)}${e.gloss.length > 60 ? '...' : ''}</div>
      </div>
    `).join('');
  },

  renderDailyWords() {
    const container = document.getElementById('daily-words');
    if (!container || this.allEntries.length === 0) return;

    const shuffled = [...this.allEntries].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, 3);

    container.innerHTML = picks.map(e => `
      <div class="daily-card">
        <div class="dc-headword">${ToneRenderer.render(e.headword)}</div>
        <div class="dc-gloss">${this.esc(e.gloss).substring(0, 80)}${e.gloss.length > 80 ? '...' : ''}</div>
      </div>
    `).join('');
  },

  /* ====== 词典渲染 ====== */
  renderDict() {
    const container = document.getElementById('dict-entries');
    const searchInput = document.getElementById('dict-search');
    const volumeTabs = document.getElementById('volume-tabs');
    const paginationEl = document.getElementById('dict-pagination');
    const resultHeader = document.getElementById('dict-result-header');

    if (!container) return;

    if (searchInput && this.searchQuery && !searchInput.value) {
      searchInput.value = this.searchQuery;
    }
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filtered = this.allEntries;
    if (this.currentVolume !== 'all') {
      filtered = filtered.filter(e => e._volume === this.currentVolume);
    }
    if (query) {
      filtered = filtered.filter(e =>
        e.headword.toLowerCase().includes(query) ||
        e.gloss.toLowerCase().includes(query) ||
        (e.variants && e.variants.some(v => v.toLowerCase().includes(query)))
      );
    }

    if (resultHeader) {
      if (query) {
        resultHeader.innerHTML = `搜索 <strong>"${this.esc(query)}"</strong> 找到 <strong>${filtered.length}</strong> 条结果`;
      } else {
        resultHeader.innerHTML = `共 <strong>${filtered.length}</strong> 条词条`;
      }
      resultHeader.style.display = 'block';
    }

    const totalPages = Math.ceil(filtered.length / this.PAGE_SIZE);
    if (this.currentPage > totalPages) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    const pageEntries = filtered.slice(start, start + this.PAGE_SIZE);

    if (pageEntries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>没有找到匹配的词条</p>
        </div>`;
    } else {
      container.innerHTML = pageEntries.map((e, i) => {
        const hw = query ? this.highlight(ToneRenderer.render(e.headword), query) : ToneRenderer.render(e.headword);
        const gl = query ? this.highlight(this.esc(e.gloss), query) : this.esc(e.gloss);
        const variants = e.variants && e.variants.length > 0
          ? `<div class="entry-variants">同义: ${e.variants.map(v => `<span>${this.esc(v)}</span>`).join('')}</div>`
          : '';
        return `
          <div class="entry-item" style="animation-delay:${i * 0.03}s">
            <div class="entry-headword">${hw}</div>
            <div class="entry-gloss">${gl}</div>
            ${variants}
            <div class="entry-source">${this.esc(e._volume)} · ${e._version}版</div>
          </div>`;
      }).join('');
    }

    if (paginationEl && totalPages > 1) {
      this.renderPagination(paginationEl, totalPages);
    } else if (paginationEl) {
      paginationEl.innerHTML = '';
    }

    this.renderVolumeTabs(volumeTabs);
  },

  renderVolumeTabs(container) {
    if (!container) return;
    const allVolumes = [
      { label: '全部', value: 'all' },
      ...this.data.vocab2012.volumes.map(v => ({ label: v.title.replace('词汇汇编', ''), value: v.title })),
      ...this.data.vocab2014.volumes.filter(v => v.entry_count > 0).map(v => ({ label: '14版' + v.title.replace('词汇汇编', ''), value: v.title })),
    ];

    container.innerHTML = allVolumes.map(v =>
      `<button class="${this.currentVolume === v.value ? 'active' : ''}" data-vol="${this.esc(v.value)}">${this.esc(v.label)}</button>`
    ).join('');

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentVolume = btn.dataset.vol;
        this.currentPage = 1;
        this.renderDict();
      });
    });
  },

  renderPagination(container, totalPages) {
    let html = '';
    html += `<button ${this.currentPage <= 1 ? 'disabled' : ''} data-pg="${this.currentPage - 1}">&laquo;</button>`;

    const range = this.getPageRange(this.currentPage, totalPages);
    for (const pg of range) {
      if (pg === '...') {
        html += `<span class="page-info">...</span>`;
      } else {
        html += `<button class="${pg === this.currentPage ? 'active' : ''}" data-pg="${pg}">${pg}</button>`;
      }
    }

    html += `<button ${this.currentPage >= totalPages ? 'disabled' : ''} data-pg="${this.currentPage + 1}">&raquo;</button>`;
    container.innerHTML = html;

    container.querySelectorAll('button[data-pg]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.pg);
        this.renderDict();
        document.getElementById('page-dict').scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  },

  /* ====== 学术档案渲染（修复导航跳转） ====== */
  renderAcademic() {
    const container = document.getElementById('academic-content');
    if (!container) return;

    const acad = this.data.academic;
    let html = '';

    html += `<div class="academic-chapter" id="ch-preface">
      <h2>${this.esc(acad.preface.title)}</h2>
      ${acad.preface.paragraphs.map(p => `<p>${this.esc(p)}</p>`).join('')}
    </div>`;

    for (const ch of acad.chapters) {
      // 跳过 content 中与标题重复的第一段（原始数据中标题在 content[0] 里重复出现）
      const paragraphs = ch.content.filter((p, i) => {
        if (i === 0 && p.replace(/[。\s]/g, '') === ch.title.replace(/[。\s]/g, '')) return false;
        return true;
      });
      html += `<div class="academic-chapter" id="ch-${ch.id}">
        <h2>${this.esc(ch.title)}</h2>
        ${paragraphs.map(p => `<p>${this.esc(p)}</p>`).join('')}
      </div>`;
    }

    container.innerHTML = html;

    // 渲染目录导航（使用 data-target 而非 href，避免触发路由跳转）
    const nav = document.getElementById('academic-nav');
    if (nav) {
      let navHtml = `<a data-target="ch-preface">前言</a>`;
      for (const ch of acad.chapters) {
        navHtml += `<a data-target="ch-${ch.id}">${this.esc(ch.title)}</a>`;
      }
      nav.innerHTML = navHtml;

      nav.querySelectorAll('a[data-target]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetId = a.getAttribute('data-target');
          const target = document.getElementById(targetId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 高亮当前导航项
            nav.querySelectorAll('a').forEach(x => x.classList.remove('active-ch'));
            a.classList.add('active-ch');
          }
        });
      });
    }
  },

  /* ====== 惯用俗语渲染 ====== */
  renderIdioms() {
    const container = document.getElementById('idiom-entries');
    const letterNav = document.getElementById('letter-nav');
    const searchInput = document.getElementById('idiom-search');
    const resultHeader = document.getElementById('idiom-result-header');

    if (!container) return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const groups = this.data.idioms.groups;
    const allLetters = 'ABCDEFGHJKLMNPQRSTWXYZ'.split('');
    const availableLetters = new Set(groups.map(g => g.letter));

    if (letterNav) {
      letterNav.innerHTML = allLetters.map(l => {
        const avail = availableLetters.has(l);
        const active = this.currentLetter === l;
        return `<a class="${active ? 'active' : ''} ${avail ? '' : 'disabled'}" data-letter="${l}">${l}</a>`;
      }).join('') + `<a class="${this.currentLetter === 'all' ? 'active' : ''}" data-letter="all" style="width:auto;padding:0 10px">全部</a>`;

      letterNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          this.currentLetter = a.dataset.letter;
          this.renderIdioms();
        });
      });
    }

    let displayGroups = groups;
    if (this.currentLetter !== 'all') {
      displayGroups = groups.filter(g => g.letter === this.currentLetter);
    }

    let totalShown = 0;
    let html = '';
    for (const group of displayGroups) {
      let entries = group.entries;
      if (query) {
        entries = entries.filter(e =>
          e.headword.toLowerCase().includes(query) ||
          e.gloss.toLowerCase().includes(query)
        );
      }
      if (entries.length === 0) continue;
      totalShown += entries.length;

      html += `<div class="letter-group" id="letter-${group.letter}">
        <h3>${group.letter}</h3>
        <div class="entry-list">
          ${entries.map((e, i) => `
            <div class="entry-item" style="animation-delay:${Math.min(i * 0.02, 0.3)}s">
              <div class="entry-headword">${ToneRenderer.render(e.headword)}</div>
              <div class="entry-gloss">${this.esc(e.gloss)}</div>
            </div>`).join('')}
        </div>
      </div>`;
    }

    if (resultHeader) {
      resultHeader.innerHTML = query
        ? `搜索 <strong>"${this.esc(query)}"</strong> 找到 <strong>${totalShown}</strong> 条`
        : `共 <strong>${totalShown}</strong> 条惯用俗语`;
    }

    container.innerHTML = html || `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>没有找到匹配的俗语</p>
      </div>`;
  },

  /* ====== 分类汇编渲染 ====== */
  renderCategories() {
    const container = document.getElementById('category-content');
    if (!container) return;

    const cats = this.data.categories;
    let html = `<p class="page-subtitle">${this.esc(cats.note)}</p>`;

    for (const cat of cats.categories) {
      html += `<h3 style="font-size:18px;font-weight:600;margin-bottom:16px;font-family:'Noto Serif SC',serif">${this.esc(cat.title)}</h3>`;
      html += `<div class="category-table-wrap"><table class="category-table">
        <thead><tr><th>普通话</th><th>涿鹿方言</th></tr></thead>
        <tbody>`;
      for (const entry of cat.entries) {
        html += `<tr>
          <td>${this.esc(entry.standard)}</td>
          <td><div class="dialect-cell">${entry.dialect.map(d => `<span class="dialect-tag">${this.esc(d)}</span>`).join('')}</div></td>
        </tr>`;
      }
      html += `</tbody></table></div>`;
    }

    container.innerHTML = html;
  },

  /* ====== 工具函数 ====== */
  esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  highlight(html, query) {
    if (!query) return html;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
