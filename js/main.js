// ============================================================
// main.js — Public site (index.html + post.html)
// Nam Gaming — Dark gaming theme
// ============================================================

// ====== CẤU HÌNH CHUNG ======
const SITE_INFO = {
  name: "Nam Gaming",
  description: "Web nạp game & chia sẻ thủ thuật, launcher, tool cho gamer Việt.",
  logo: "" // ví dụ: "assets/logo.png" — để trống sẽ hiện icon 🎮
};

const POSTS_PER_PAGE = 8;

// ====== KHỞI TẠO ỨNG DỤNG ======
(() => {
  // ---------- State toàn cục ----------
  const state = {
    allPosts: [],
    site: null,
    filter: { q: "", category: "all" },
    page: 1
  };

  // ============================================================
  // 1. DATA LOADERS
  // ============================================================

  /**
   * Load thông tin site từ data/site.json
   * Fallback về SITE_INFO nếu không có file
   */
  async function loadSite() {
    try {
      const res = await fetch("data/site.json?v=" + Date.now(), {
        cache: "no-store"
      });
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      return { ...SITE_INFO, ...data };
    } catch {
      return SITE_INFO;
    }
  }

  /**
   * Load danh sách bài viết từ data/posts.json
   * Hỗ trợ cả dạng mảng thuần và object { posts: [...] }
   */
  async function loadPosts() {
    try {
      const res = await fetch("data/posts.json?v=" + Date.now(), {
        cache: "no-store"
      });
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      return Array.isArray(data) ? data : data.posts || [];
    } catch (e) {
      console.error("[Nam Gaming] Không load được posts.json:", e);
      return [];
    }
  }

  // ============================================================
  // 2. HELPERS
  // ============================================================

  /** Chống XSS cơ bản khi render HTML */
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Format ngày về dạng dd/mm/yyyy */
  function formatDate(d) {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    } catch {
      return d;
    }
  }

  /** Lấy id/slug chuẩn của 1 post */
  function getPostId(post) {
    return post.slug || post.id;
  }

  // ============================================================
  // 3. HEADER
  // ============================================================

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
          <span class="brand-name">${escapeHtml(site.name || "Nam Gaming")}</span>
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
      </nav>
    `;

    // Toggle menu mobile
    const toggle = document.getElementById("menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");
    toggle?.addEventListener("click", () => mobileNav.classList.toggle("open"));

    // Ô tìm kiếm
    const search = document.getElementById("search-input");
    if (search) {
      // Đồng bộ giá trị ban đầu nếu có sẵn từ URL
      const params = new URLSearchParams(location.search);
      const qParam = params.get("q");
      if (qParam) {
        search.value = qParam;
        state.filter.q = qParam.toLowerCase();
      }

      search.addEventListener("input", (e) => {
        state.filter.q = e.target.value.trim().toLowerCase();
        state.page = 1;
        applyFilters();
      });
    }
  }

  // ============================================================
  // 4. FOOTER
  // ============================================================

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
          <p><a href="index.html#categories">Thể loại</a></p>
        </div>
        <div>
          <h4>Disclaimer</h4>
          <p>Website chỉ chia sẻ thông tin và liên kết. Mọi bản quyền game thuộc về nhà phát hành.</p>
          <p style="margin-top: 1rem; color: #ff6b00; font-weight: bold;">☕ Mời mình ly Hao Hao (Quét mã góc phải)</p>
        </div>
      </div>
      <div class="footer-bottom">
        © ${new Date().getFullYear()} ${escapeHtml(site.name || "Nam Gaming")}. All rights reserved.
      </div>
    `;
  }

  // ============================================================
  // 5. HERO (bài nổi bật)
  // ============================================================

  function renderHero() {
    const heroEl = document.getElementById("hero");
    if (!heroEl) return;

    const featured =
      state.allPosts.find((p) => p.featured) || state.allPosts[0];

    if (!featured) {
      heroEl.innerHTML = "";
      return;
    }

    heroEl.innerHTML = `
      <a href="post.html?id=${encodeURIComponent(getPostId(featured))}" class="hero-card">
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

  // ============================================================
  // 6. FILTER BAR (danh mục)
  // ============================================================

  function renderFilters() {
    const el = document.getElementById("filters-bar");
    if (!el) return;

    const cats = [
      "all",
      ...new Set(state.allPosts.map((p) => p.category).filter(Boolean))
    ];

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
        el.querySelectorAll(".cat-filter").forEach((b) =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
        applyFilters();
      });
    });
  }

  // ============================================================
  // 7. APPLY FILTERS
  // ============================================================

  function applyFilters() {
    const { q, category } = state.filter;

    const filtered = state.allPosts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;

      const hay = [p.title, p.excerpt, (p.tags || []).join(" "), p.category]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });

    renderGrid(filtered);
  }

  // ============================================================
  // 8. POSTS GRID
  // ============================================================

  function renderGrid(posts) {
    const grid = document.getElementById("posts-grid");
    const moreWrap = document.getElementById("load-more-wrap");
    if (!grid) return;

    const shown = posts.slice(0, state.page * POSTS_PER_PAGE);

    if (posts.length === 0) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Không tìm thấy bài viết phù hợp 🤖</div>`;
      if (moreWrap) moreWrap.innerHTML = "";
      return;
    }

    grid.innerHTML = shown
      .map(
        (p) => `
      <a href="post.html?id=${encodeURIComponent(getPostId(p))}" class="post-card">
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

    // Nút tải thêm
    if (moreWrap) {
      if (shown.length < posts.length) {
        moreWrap.innerHTML = `<button class="btn btn-ghost" id="btn-load-more">Tải thêm (${posts.length - shown.length})</button>`;
        document
          .getElementById("btn-load-more")
          .addEventListener("click", () => {
            state.page++;
            renderGrid(posts);
          });
      } else {
        moreWrap.innerHTML = "";
      }
    }
  }

  // ============================================================
  // 9. SIDEBAR (bài mới + danh mục + tag + donate QR)
  // ============================================================

  function renderSidebar() {
    const el = document.getElementById("sidebar");
    if (!el) return;

    // ----- Bài mới nhất -----
    const recent = [...state.allPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // ----- Đếm danh mục -----
    const catCounts = {};
    state.allPosts.forEach((p) => {
      if (p.category) catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });

    // ----- Đếm tag -----
    const tagCounts = {};
    state.allPosts.forEach((p) =>
      (p.tags || []).forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      })
    );

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);

    // ----- Render HTML -----
    el.innerHTML = `
      <!-- Bài mới -->
      <div class="widget">
        <h3>🔥 Bài mới nhất</h3>
        <ul class="widget-list">
          ${
            recent.length === 0
              ? `<li style="color:var(--text-dim)">Chưa có bài viết nào</li>`
              : recent
                  .map(
                    (p) => `
            <li>
              <a href="post.html?id=${encodeURIComponent(getPostId(p))}">
                <img class="mini-thumb" src="${escapeHtml(p.thumbnail || "")}" alt="${escapeHtml(p.title)}" loading="lazy" />
                <div>
                  <div class="mini-title">${escapeHtml(p.title)}</div>
                  <div class="mini-date">${formatDate(p.createdAt)}</div>
                </div>
              </a>
            </li>`
                  )
                  .join("")
          }
        </ul>
      </div>

      <!-- Danh mục -->
      <div class="widget" id="categories">
        <h3>📁 Danh mục</h3>
        <ul class="cat-list">
          ${
            Object.keys(catCounts).length === 0
              ? `<li style="color:var(--text-dim)">Chưa có danh mục</li>`
              : Object.entries(catCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(
                    ([cat, count]) => `
            <li data-cat="${escapeHtml(cat)}">
              <span>${escapeHtml(cat)}</span>
              <span class="count">${count}</span>
            </li>`
                  )
                  .join("")
          }
        </ul>
      </div>

      <!-- Tags -->
      <div class="widget">
        <h3>🏷️ Thẻ phổ biến</h3>
        <div class="tag-cloud">
          ${
            topTags.length === 0
              ? `<span style="color:var(--text-dim);font-size:0.85rem">Chưa có tag</span>`
              : topTags
                  .map(
                    (t) =>
                      `<button class="tag-chip" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`
                  )
                  .join("")
          }
        </div>
      </div>

      <!-- Donate QR -->
      <div class="widget donate-widget">
        <h3>☕ Ủng hộ tác giả</h3>
        <p>Nếu thấy web hữu ích, mời mình ly Hao Hao để có động lực viết tiếp nhé!</p>
        <img
          class="donate-qr"
          src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MB%20BANK%20NAM%20GAMING%200123456789"
          alt="QR Donate"
          loading="lazy"
        />
        <div class="donate-note">Quét mã để ủng hộ 💖</div>
      </div>
    `;

    // ----- Sự kiện click danh mục -----
    el.querySelectorAll(".cat-list li[data-cat]").forEach((li) => {
      li.addEventListener("click", () => {
        state.filter.category = li.dataset.cat;
        state.page = 1;

        // Đồng bộ nút filter trên đầu
        document.querySelectorAll(".cat-filter").forEach((b) => {
          b.classList.toggle("active", b.dataset.cat === li.dataset.cat);
        });

        applyFilters();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    // ----- Sự kiện click tag -----
    el.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const tag = chip.dataset.tag;
        state.filter.q = tag.toLowerCase();
        state.page = 1;

        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.value = tag;

        applyFilters();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  // ============================================================
  // 10. POST DETAIL (post.html)
  // ============================================================

  async function renderPostDetail() {
    const container = document.getElementById("post-detail");
    if (!container) return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) {
      container.innerHTML = `<div class="empty">Không tìm thấy bài viết 🤔</div>`;
      return;
    }

    const post = state.allPosts.find(
      (p) => String(getPostId(p)) === String(id)
    );

    if (!post) {
      container.innerHTML = `<div class="empty">Bài viết không tồn tại hoặc đã bị xoá 😢</div>`;
      return;
    }

    // Cập nhật title trang
    document.title = `${post.title} — ${state.site?.name || "Nam Gaming"}`;

    // Cập nhật meta description nếu có
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && post.excerpt) {
      metaDesc.setAttribute("content", post.excerpt);
    }

    // Breadcrumb
    const breadcrumb = `
      <div class="breadcrumb">
        <a href="index.html">Trang chủ</a> ›
        <a href="index.html#categories">${escapeHtml(post.category || "Bài viết")}</a> ›
        <span>${escapeHtml(post.title)}</span>
      </div>`;

    // Ảnh cover
    const cover = post.thumbnail
      ? `<div class="post-cover"><img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" /></div>`
      : "";

    // Tags
    const tagsHtml =
      (post.tags || []).length > 0
        ? `<div class="post-tags">
             ${post.tags
               .map((t) => `<span class="tag-chip">#${escapeHtml(t)}</span>`)
               .join("")}
           </div>`
        : "";

    // Nút tải xuống
    const downloadHtml = post.downloadUrl
      ? `<div class="download-cta">
           <p>📥 Tải về và trải nghiệm ngay</p>
           <a href="${escapeHtml(post.downloadUrl)}" class="btn btn-primary" target="_blank" rel="noopener">
             Tải xuống ngay
           </a>
         </div>`
      : "";

    // Render
    container.innerHTML = `
      ${breadcrumb}
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">
        <span class="cat">${escapeHtml(post.category || "")}</span>
        <span>📅 ${formatDate(post.createdAt)}</span>
        ${post.author ? `<span>✍️ ${escapeHtml(post.author)}</span>` : ""}
      </div>
      ${cover}
      <div class="post-content">${post.content || post.excerpt || ""}</div>
      ${tagsHtml}
      ${downloadHtml}
      <div class="related" id="related-posts"></div>
    `;

    renderRelated(post);
  }

  // ============================================================
  // 11. RELATED POSTS
  // ============================================================

  function renderRelated(currentPost) {
    const el = document.getElementById("related-posts");
    if (!el) return;

    const currentId = String(getPostId(currentPost));

    const related = state.allPosts
      .filter((p) => {
        if (String(getPostId(p)) === currentId) return false;
        const sameCat = p.category === currentPost.category;
        const sameTag = (p.tags || []).some((t) =>
          (currentPost.tags || []).includes(t)
        );
        return sameCat || sameTag;
      })
      .slice(0, 4);

    if (related.length === 0) {
      el.innerHTML = "";
      return;
    }

    el.innerHTML = `
      <h2>Bài viết liên quan</h2>
      <div class="related-grid">
        ${related
          .map(
            (p) => `
          <a href="post.html?id=${encodeURIComponent(getPostId(p))}" class="post-card">
            <div class="post-thumb">
              <img src="${escapeHtml(p.thumbnail || "")}" alt="${escapeHtml(p.title)}" loading="lazy" />
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

  // ============================================================
  // 12. INIT
  // ============================================================

  async function init() {
    // Load song song site info + posts
    const [site, posts] = await Promise.all([loadSite(), loadPosts()]);

    state.site = site;
    state.allPosts = Array.isArray(posts) ? posts : [];

    // Header + Footer
    renderHeader(site);
    renderFooter(site);

    // Trang chủ
    if (document.getElementById("posts-grid")) {
      renderHero();
      renderFilters();
      applyFilters();
    }

    // Sidebar (dùng chung cho cả index và post)
    if (document.getElementById("sidebar")) {
      renderSidebar();
    }

    // Trang chi tiết bài viết
    if (document.getElementById("post-detail")) {
      await renderPostDetail();
    }
  }

  // Expose ra global để debug (tuỳ chọn)
  window.__NAM_GAMING__ = { state, init };

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
