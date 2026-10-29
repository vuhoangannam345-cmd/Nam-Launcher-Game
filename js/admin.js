// ============================================================
// admin.js — Dashboard CRUD (đọc/ghi thẳng lên GitHub)
// ============================================================
(() => {
  const state = {
    posts: [],
    postsSha: null,
    site: null,
    siteSha: null,
    categories: ["Hành động", "Nhập vai", "Chiến thuật"],
    editingId: null
  };

  // ---------- UI helpers ----------
  function toast(msg, type = "success", ms = 3200) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), ms);
  }

  function showLoginError(msg) {
    const el = document.getElementById("login-error");
    if (el) el.textContent = msg;
  }

  function switchTab(name) {
    document.querySelectorAll(".dash-tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === name)
    );
    document.querySelectorAll(".tab-panel").forEach((p) =>
      p.classList.toggle("active", p.dataset.panel === name)
    );
  }

  // ---------- GitHub data ----------
  async function loadPosts() {
    const file = await GH.getFile("data/posts.json");
    state.postsSha = file ? file.sha : null;
    try {
      state.posts = file ? JSON.parse(file.content) : [];
      if (!Array.isArray(state.posts)) state.posts = state.posts.posts || [];
    } catch {
      state.posts = [];
    }
  }

  async function savePosts(message) {
    const content = JSON.stringify(state.posts, null, 2);
    await GH.putFile("data/posts.json", content, state.postsSha, message);
    // Fetch lại để đồng bộ sha mới
    await loadPosts();
  }

  async function addPost(post) {
    state.posts.push(post);
    await savePosts(`Add post: ${post.title}`);
  }

  async function updatePost(id, updates) {
    const idx = state.posts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Không tìm thấy bài viết trong file.");
    state.posts[idx] = {
      ...state.posts[idx],
      ...updates,
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    await savePosts(`Update post: ${state.posts[idx].title}`);
  }

  async function deletePost(id) {
    state.posts = state.posts.filter((p) => p.id !== id);
    await savePosts(`Delete post: ${id}`);
  }

  async function loadSite() {
    const file = await GH.getFile("data/site.json");
    state.siteSha = file ? file.sha : null;
    try {
      state.site = file ? JSON.parse(file.content) : { ...SITE_INFO };
    } catch {
      state.site = { ...SITE_INFO };
    }
  }

  async function saveSite(site) {
    const content = JSON.stringify(site, null, 2);
    await GH.putFile("data/site.json", content, state.siteSha, "Update site settings");
    await loadSite();
  }

  // ---------- Table ----------
  function renderPostsTable() {
    const tbody = document.getElementById("posts-tbody");
    if (!tbody) return;
    if (state.posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-dim)">Chưa có bài viết nào. Nhấn "+ Thêm bài mới".</td></tr>`;
      return;
    }
    tbody.innerHTML = state.posts
      .map(
        (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.thumbnail ? `<img src="${escapeHtml(p.thumbnail)}" alt="">` : "—"}</td>
        <td class="title-cell">${escapeHtml(p.title)}</td>
        <td><span class="badge">${escapeHtml(p.category || "")}</span></td>
        <td>${formatDate(p.createdAt)}</td>
        <td>${p.featured ? '<span class="badge badge-yes">⭐ Có</span>' : "—"}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm" data-edit="${escapeHtml(p.id)}">Sửa</button>
          <button class="btn btn-danger btn-sm" data-del="${escapeHtml(p.id)}">Xóa</button>
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => startEdit(b.dataset.edit))
    );
    tbody.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => confirmDelete(b.dataset.del))
    );
  }

  async function confirmDelete(id) {
    const post = state.posts.find((p) => p.id === id);
    if (!post) return;
    if (!confirm(`Xóa bài "${post.title}"? Thao tác này ghi trực tiếp lên GitHub.`)) return;
    try {
      await deletePost(id);
      renderPostsTable();
      toast("Đã xóa bài viết khỏi GitHub.", "success");
    } catch (e) {
      toast("Lỗi xóa: " + e.message, "error");
    }
  }

  // ---------- Compose form ----------
  function populateCategorySelect() {
    const sel = document.getElementById("f-category");
    if (!sel) return;
    const cats = [...new Set([...state.categories, ...state.posts.map((p) => p.category).filter(Boolean)])];
    sel.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  function resetForm() {
    state.editingId = null;
    document.getElementById("compose-title").textContent = "Soạn bài mới";
    document.getElementById("f-id").value = "";
    document.getElementById("post-form").reset();
    document.getElementById("thumb-preview").innerHTML = "";
    populateCategorySelect();
  }

  function fillForm(post) {
    state.editingId = post.id;
    document.getElementById("compose-title").textContent = `Sửa bài: ${post.title}`;
    document.getElementById("f-id").value = post.id;
    document.getElementById("f-title").value = post.title || "";
    document.getElementById("f-slug").value = post.slug || "";
    document.getElementById("f-excerpt").value = post.excerpt || "";
    document.getElementById("f-content").value = post.content || "";
    document.getElementById("f-thumbnail").value = post.thumbnail || "";
    document.getElementById("f-category").value = post.category || state.categories[0];
    document.getElementById("f-tags").value = (post.tags || []).join(", ");
    document.getElementById("f-download").value = post.downloadUrl || "";
    document.getElementById("f-featured").checked = !!post.featured;
    updateThumbPreview();
  }

  function startEdit(id) {
    const post = state.posts.find((p) => p.id === id);
    if (!post) return;
    switchTab("compose");
    fillForm(post);
  }

  function updateThumbPreview() {
    const url = document.getElementById("f-thumbnail").value.trim();
    const el = document.getElementById("thumb-preview");
    el.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="preview" onerror="this.style.display='none'">` : "";
  }

  // Auto slug
  document.getElementById("f-title")?.addEventListener("input", (e) => {
    if (state.editingId) return; // không auto khi đang sửa
    const slugEl = document.getElementById("f-slug");
    if (slugEl && !slugEl._manual) {
      slugEl.value = slugifyVi(e.target.value);
    }
  });
  document.getElementById("f-slug")?.addEventListener("input", (e) => {
    e.target._manual = true;
  });

  // Thumbnail preview
  document.getElementById("f-thumbnail")?.addEventListener("input", updateThumbPreview);

  // Upload file
  document.getElementById("f-upload")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast("Đang upload ảnh lên GitHub…", "success", 1500);
      const url = await GH.uploadImage(file);
      document.getElementById("f-thumbnail").value = url;
      updateThumbPreview();
      toast("Upload thành công!", "success");
    } catch (err) {
      toast("Lỗi upload: " + err.message, "error", 5000);
    }
  });

  // Content quick insert
  const SNIPPETS = {
    h2: "<h2>Tiêu đề mục</h2>\n",
    h3: "<h3>Tiêu đề phụ</h3>\n",
    p: "<p>Đoạn văn mới.</p>\n",
    b: "<strong>chữ đậm</strong>",
    i: "<em>chữ nghiêng</em>",
    ul: "<ul>\n  <li>Mục 1</li>\n  <li>Mục 2</li>\n</ul>\n",
    img: '<img src="https://..." alt="">\n',
    link: '<a href="https://...">liên kết</a>',
    video: '<iframe width="560" height="315" src="https://www.youtube.com/embed/..." frameborder="0" allowfullscreen></iframe>\n'
  };
  document.getElementById("content-toolbar")?.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ta = document.getElementById("f-content");
      const code = SNIPPETS[btn.dataset.insert] || "";
      const start = ta.selectionStart;
      ta.value = ta.value.slice(0, start) + code + ta.value.slice(ta.selectionEnd);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + code.length;
    });
  });

  // Submit post
  document.getElementById("post-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-save-post");
    btn.disabled = true;
    btn.textContent = "⏳ Đang lưu…";
    try {
      const data = {
        title: document.getElementById("f-title").value.trim(),
        slug: document.getElementById("f-slug").value.trim(),
        excerpt: document.getElementById("f-excerpt").value.trim(),
        content: document.getElementById("f-content").value,
        thumbnail: document.getElementById("f-thumbnail").value.trim(),
        category: document.getElementById("f-category").value,
        tags: document
          .getElementById("f-tags")
          .value.split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        downloadUrl: document.getElementById("f-download").value.trim(),
        featured: document.getElementById("f-featured").checked
      };
      if (!data.title || !data.slug) {
        toast("Vui lòng nhập tiêu đề và slug.", "error");
        return;
      }

      if (state.editingId) {
        await updatePost(state.editingId, data);
        toast("Đã cập nhật bài viết!", "success");
      } else {
        const today = new Date().toISOString().slice(0, 10);
        await addPost({
          id: genId(),
          ...data,
          createdAt: today,
          updatedAt: today
        });
        toast("Đã thêm bài viết mới!", "success");
      }

      resetForm();
      renderPostsTable();
      populateCategorySelect();
      switchTab("posts");
    } catch (err) {
      toast("Lỗi lưu: " + err.message, "error", 5000);
    } finally {
      btn.disabled = false;
      btn.textContent = "💾 Lưu bài";
    }
  });

  document.getElementById("btn-cancel-edit")?.addEventListener("click", () => {
    resetForm();
    switchTab("posts");
  });
  document.getElementById("btn-new-post")?.addEventListener("click", () => {
    resetForm();
    switchTab("compose");
  });

  // ---------- Site form ----------
  function fillSiteForm() {
    const s = state.site || SITE_INFO;
    document.getElementById("s-name").value = s.name || "";
    document.getElementById("s-logo").value = s.logo || "";
    document.getElementById("s-desc").value = s.description || "";
    document.getElementById("s-color").value = s.primaryColor || "#7c3aed";
  }
  document.getElementById("site-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const site = {
        name: document.getElementById("s-name").value.trim(),
        logo: document.getElementById("s-logo").value.trim(),
        description: document.getElementById("s-desc").value.trim(),
        primaryColor: document.getElementById("s-color").value
      };
      await saveSite(site);
      toast("Đã lưu cài đặt site!", "success");
    } catch (err) {
      toast("Lỗi: " + err.message, "error");
    }
  });

  // ---------- GitHub config ----------
  function fillGhForm() {
    const c = GH.getConfig();
    document.getElementById("g-user").value = c.user || "";
    document.getElementById("g-repo").value = c.repo || "";
    document.getElementById("g-branch").value = c.branch || "main";
    document.getElementById("g-pat").value = c.pat || "";
  }
  document.getElementById("gh-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    GH.setConfig({
      user: document.getElementById("g-user").value.trim(),
      repo: document.getElementById("g-repo").value.trim(),
      branch: document.getElementById("g-branch").value.trim() || "main",
      pat: document.getElementById("g-pat").value.trim()
    });
    toast("Đã lưu cấu hình GitHub vào localStorage.", "success");
  });
  document.getElementById("btn-test-conn")?.addEventListener("click", async () => {
    const status = document.getElementById("conn-status");
    status.textContent = "Đang kiểm tra…";
    status.className = "conn-status";
    try {
      const info = await GH.testConnection();
      status.textContent = `✅ Kết nối OK: ${info.full_name} (${info.private ? "private" : "public"})`;
      status.className = "conn-status ok";
    } catch (err) {
      status.textContent = "❌ " + err.message;
      status.className = "conn-status err";
    }
  });

  // ---------- Load all data ----------
  async function loadAllData() {
    if (!GH.getConfig().user) {
      toast("Chưa cấu hình GitHub. Vào tab Cấu hình GitHub trước.", "error", 5000);
      switchTab("github");
      return;
    }
    try {
      await loadSite();
      await loadPosts();
      renderPostsTable();
      populateCategorySelect();
      fillSiteForm();
    } catch (err) {
      toast("Lỗi tải dữ liệu: " + err.message, "error", 5000);
    }
  }

  // ---------- Login flow ----------
  function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "grid";
    fillGhForm();
    loadAllData();
  }

  function initLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showLoginError("");
      try {
        await Auth.login(document.getElementById("login-password").value);
        document.getElementById("login-password").value = "";
        showDashboard();
      } catch (err) {
        showLoginError(err.message);
      }
    });
  }

  function initLogout() {
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      Auth.logout();
      location.reload();
    });
  }

  // ---------- Tabs ----------
  document.querySelectorAll(".dash-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Reload posts
  document.getElementById("btn-reload-posts")?.addEventListener("click", async () => {
    try {
      await loadPosts();
      renderPostsTable();
      toast("Đã tải lại từ GitHub.", "success");
    } catch (err) {
      toast("Lỗi: " + err.message, "error");
    }
  });

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initLogout();
    if (Auth.isLoggedIn()) {
      showDashboard();
    }
  });
})();
