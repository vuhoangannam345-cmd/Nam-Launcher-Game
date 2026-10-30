// ========================================
// main.js — Public site (index.html + post.html)
// ========================================
(() => {
  const state = {
    allPosts: [],
    site: null,
    filter: { q: "", category: "all" },
    page: 1
  };

  // ---------- Data loaders ----------
  async function loadSite() {
    try {
      const res = await fetch("data/site.json?v=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("not found");
      return await res.json();
    } catch {
      return SITE_INFO;
    }
  }

  async function loadPosts() {
    try {
      const res = await fetch("data/posts.json?v=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      return Array.isArray(data) ? data : (data.posts || []);
    } catch (e) {
      console.error("Không load được posts.json:", e);
      return [];
    }
  }

  // ---------- Header ----------
  function renderHeader(site) {
    const el = document.getElementById("site-header");
    if (!el) return;
    const logoHtml = site.logo
      ? `<img src="${escapeHtml(site.logo)}" alt="logo">`
      : "🎮";
    el.innerHTML = `
      <div class="header-inner">
        <a href="index.html" class="brand">
          <span class="brand-logo">${logoHtml}</span>
          <span class="brand-name">${escapeHtml(site.name || "GameHub")}</span>
        </a>
        <nav class="header-nav">
          <a href="index.html">Trang chủ</a>
          <a href="index.html#categories">Thể loại</a>
        </nav>
        <div class="search-box">
          <input type="search" id="search-input" placeholder="Tìm kiếm game, bài viết, tag..." />
        </div>
        <button class="menu-toggle" id="menu-toggle" aria-label="Menu">☰</button>
      </div>
      <nav class="mobile-nav" id="mobile-nav">
        <a href="index.html">Trang chủ</a>
        <a href="index.html#categories">Thể loại</a>
        <a href="admin.html">Quản trị</a>
      </nav>
    `;

    const toggle = document.getElementById("menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");
    toggle?.addEventListener("click", () => mobileNav.classList.toggle("open"));

    const search = document.getElementById("search-input");
    if (search) {
      search.addEventListener("input", (e) => {
        state.filter.q = e.target.value.trim().toLowerCase();
        state.page = 1;
        applyFilters();
      });
    }
  }

  // ---------- Footer ----------
  function renderFooter(site) {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML = `
      <div class="footer-inner">
        <div>
          <h4>${escapeHtml(site.name || "Nam Gaming")}</h4>
          <p>${escapeHtml(site.description || "")}</p>
        </div>
        <div>
          <h4>Liên kết</h4>
          <p><a href="index.html">Trang chủ</a></p>
          <p><a href="admin.html">NPanel</a></p>
        </div>
        <div>
          <h4>Tuyên bố miễn trừ trách nhiệm</h4>
          <p>Website chỉ chia sẻ thông tin và liên kết. Mọi bản quyền game thuộc về nhà phát hành.</p>
        </div>
      </div>
      <div class="footer-bottom">
        © ${new Date().getFullYear()} ${escapeHtml(site.name || "NamGaming")}. All rights reserved.
      </div>
    `;
  }

  // ---------- Hero ----------
  function renderHero() {
    const heroEl = document.getElementById("hero");
    if (!heroEl) return;

    const featured = state.allPosts.find((p) => p.featured) || state.allPosts[0];
    if (!featured) {
      heroEl.innerHTML = "";
      return;
    }
    heroEl.innerHTML = `
      <a href="post.html?id=${encodeURIComponent(featured.slug || featured.id)}" class="hero-card">
        <div class="hero-bg" style="background-image:url('${escapeHtml(featured.thumbnail || "")}')"></div>
        <div class="hero-content">
          <span class="hero-badge">⭐ Nổi bật</span>
          <h2 class="hero-title">${escapeHtml(featured.title)}</h2>
          <p class="hero-excerpt">${escapeHtml(featured.excerpt || "")}</p>
          <div class="hero-meta">
            <span class="cat">${escapeHtml(featured.category || "")}</span>
            <span>${formatDate(featured.createdAt)}</span>
          </div>
          <button class="btn btn-primary">Xem ngay →</button>
        </div>
      </a>
    `;
  }

  // ---------- Filters ----------
  function renderFilters() {
    const el = document.getElementById("filters-bar");
    if (!el) return;
    const cats = ["all", ...new Set(state.allPosts.map((p) => p.category).filter(Boolean))];
    el.innerHTML = cats
      .map(
        (c) => `
      <button class="cat-filter ${state.filter.category === c ? "active" : ""}"
              data-cat="${escapeHtml(c)}">
        ${c === "all" ? "Tất cả" : escapeHtml(c)}
      </button>`
      )
      .join("");

    el.querySelectorAll(".cat-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filter.category = btn.dataset.cat;
        state.page = 1;
        el.querySelectorAll(".cat-filter").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilters();
      });
    });
  }

  // ---------- Apply filters ----------
  function applyFilters() {
    const { q, category } = state.filter;
    const filtered = state.allPosts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      const hay = [
        p.title,
        p.excerpt,
        (p.tags || []).join(" "),
        p.category
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    renderGrid(filtered);
  }

  // ---------- Grid ----------
  function renderGrid(posts) {
    const grid = document.getElementById("posts-grid");
    const moreWrap = document.getElementById("load-more-wrap");
    if (!grid) return;

    const shown = posts.slice(0, state.page * POSTS_PER_PAGE);
    if (posts.length === 0) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Mệt quá, không tìm thấy bài viết phù hợp </div>`;
      if (moreWrap) moreWrap.innerHTML = "";
      return;
    }

    grid.innerHTML = shown
      .map(
        (p) => `
      <a href="post.html?id=${encodeURIComponent(p.slug || p.id)}" class="post-card">
        <div class="post-thumb">
          <img src="${escapeHtml(p.thumbnail || "")}" alt="${escapeHtml(p.title)}" loading="lazy" />
          <span class="post-cat">${escapeHtml(p.category || "")}</span>
        </div>
        <div class="post-body">
          <h3 class="post-title">${escapeHtml(p.title)}</h3>
          <p class="post-excerpt">${escapeHtml(p.excerpt || "")}</p>
          <span class="post-date">${formatDate(p.createdAt)}</span>
        </div>
      </a>`
      )
      .join("");

    if (moreWrap) {
      if (shown.length < posts.length) {
        moreWrap.innerHTML = `<button class="btn btn-ghost" id="btn-load-more">Tải thêm (${posts.length - shown.length})</button>`;
        document.getElementById("btn-load-more").addEventListener("click", () => {
          state.page++;
          renderGrid(posts);
        });
      } else {
        moreWrap.innerHTML = "";
      }
    }
  }

  // ---------- Sidebar ----------
  function renderSidebar() {
    const el = document.getElementById("sidebar");
    if (!el) return;

    // Bài mới
    const recent = [...state.allPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Danh mục
    const catCounts = {};
    state.allPosts.forEach((p) => {
      if (p.category) catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });

    // Tags
    const tagCounts = {};
    state.allPosts.forEach((p) =>
      (p.tags || []).forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      })
    );
    const tags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    el.innerHTML = `
      <div class="widget">
        <h3>🔥 Bài Viết Mới</h3>
        <ul class="widget-list">
          ${recent
            .map(
              (p) => `
            <li>
              <a href="post.html?id=${encodeURIComponent(p.slug || p.id)}">
                <img class="mini-thumb" src="${escapeHtml(p.thumbnail || "")}" alt="">
                <div>
                  <div class="mini-title">${escapeHtml(p.title)}</div>
                  <div class="mini-date">${formatDate(p.createdAt)}</div>
                </div>
              </a>
            </li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="widget" id="categories">
        <h3>📂 Thể Loại</h3>
        <ul class="cat-list">
          ${Object.entries(catCounts)
            .map(
              ([c, n]) => `
            <li data-cat="${escapeHtml(c)}">
              <span>${escapeHtml(c)}</span>
              <span class="count">${n}</span>
            </li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="widget">
        <h3>🏷️ Thẻ Phân Loại</h3>
        <div class="tag-cloud">
          ${tags
            .map(
              ([t, n]) =>
                `<a class="tag-chip" href="#" data-tag="${escapeHtml(t)}">#${escapeHtml(t)} (${n})</a>`
            )
            .join("")}
        </div>
      </div>
    `;

    // Click category → filter
    el.querySelectorAll(".cat-list li").forEach((li) => {
      li.addEventListener("click", () => {
        state.filter.category = li.dataset.cat;
        state.page = 1;
        const fbtns = document.querySelectorAll(".cat-filter");
        fbtns.forEach((b) => b.classList.toggle("active", b.dataset.cat === li.dataset.cat));
        applyFilters();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    // Click tag → set search
    el.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        const tag = chip.dataset.tag;
        const search = document.getElementById("search-input");
        if (search) {
          search.value = tag;
          state.filter.q = tag.toLowerCase();
          state.page = 1;
          applyFilters();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  // ---------- Post detail ----------
  function renderPostDetail(post) {
    const el = document.getElementById("post-detail");
    if (!el) return;
    el.innerHTML = `
      <div class="breadcrumb">
        <a href="index.html">Trang chủ</a> / <span>${escapeHtml(post.category || "")}</span>
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">
        <span class="cat">${escapeHtml(post.category || "")}</span>
        <span>📅 ${formatDate(post.createdAt)}</span>
      </div>
      ${post.thumbnail ? `<div class="post-cover"><img src="${escapeHtml(post.thumbnail)}" alt=""></div>` : ""}
      <div class="post-content">${post.content || ""}</div>
      ${(post.tags || []).length
        ? `<div class="post-tags">${post.tags
            .map((t) => `<span class="tag-chip">#${escapeHtml(t)}</span>`)
            .join("")}</div>`
        : ""}
      ${post.downloadUrl
        ? `<div class="download-cta">
             <p>Suy nghĩ kĩ chưa ?, Tải game nhá :)</p>
             <a class="btn btn-primary" href="${escapeHtml(post.downloadUrl)}" target="_blank" rel="noopener">
               ⬇ Tải game
             </a>
           </div>`
        : ""}
    `;
  }

  function renderRelated(post) {
    const el = document.getElementById("related-posts");
    if (!el) return;
    const related = state.allPosts
      .filter(
        (p) =>
          p.id !== post.id &&
          (p.category === post.category ||
            (p.tags || []).some((t) => (post.tags || []).includes(t)))
      )
      .slice(0, 4);

    if (related.length === 0) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = `
      <h2>Bài Viết Liên Quan</h2>
      <div class="related-grid">
        ${related
          .map(
            (p) => `
          <a href="post.html?id=${encodeURIComponent(p.slug || p.id)}" class="post-card">
            <div class="post-thumb">
              <img src="${escapeHtml(p.thumbnail || "")}" alt="" loading="lazy">
              <span class="post-cat">${escapeHtml(p.category || "")}</span>
            </div>
            <div class="post-body">
              <h3 class="post-title">${escapeHtml(p.title)}</h3>
              <span class="post-date">${formatDate(p.createdAt)}</span>
            </div>
          </a>`
          )
          .join("")}
      </div>
    `;
  }

  function updateSEO(post, site) {
    document.title = `${post.title} — ${site.name || "GameHub"}`;
    const setMeta = (sel, attr, val) => {
      const el = document.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    };
    setMeta('meta[name="description"]', "content", post.excerpt || "");
    setMeta("#og-title", "content", post.title);
    setMeta("#og-desc", "content", post.excerpt || "");
    setMeta("#og-image", "content", post.thumbnail || "");
  }

  function showPostError(msg) {
    const el = document.getElementById("post-detail");
    if (!el) return;
    el.innerHTML = `<div class="empty">${escapeHtml(msg)}<br><br><a class="btn btn-primary" href="index.html">← Về trang chủ</a></div>`;
  }

  // ---------- Init ----------
  async function initHome() {
    state.site = await loadSite();
    state.allPosts = await loadPosts();

    renderHeader(state.site);
    renderFooter(state.site);
    renderHero();
    renderFilters();
    applyFilters();
    renderSidebar();
  }

  async function initPost() {
    state.site = await loadSite();
    state.allPosts = await loadPosts();

    renderHeader(state.site);
    renderFooter(state.site);

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (!id) {
      showPostError("Không tìm thấy bài viết.");
      return;
    }
    const post = state.allPosts.find((p) => p.slug === id || p.id === id);
    if (!post) {
      showPostError("Bài viết không tồn tại hoặc đã bị xóa.");
      return;
    }

    renderPostDetail(post);
    renderRelated(post);
    renderSidebar();
    updateSEO(post, state.site);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    else if (page === "post") initPost();
  });
})();
