// ============================================================
// admin.js — Dashboard CRUD (Bản Final)
// ============================================================
(() => {
  const state = {
    posts: [], postsSha: null, site: null, siteSha: null,
    categories: ["Hành động", "Nhập vai", "Chiến thuật"], editingId: null
  };

  function toast(msg, type = "success", ms = 3200) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), ms);
  }

  function switchTab(name) {
    document.querySelectorAll(".dash-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === name));
  }

  async function loadPosts() {
    const file = await GH.getFile("data/posts.json");
    state.postsSha = file ? file.sha : null;
    try { state.posts = file ? JSON.parse(file.content) : []; if (!Array.isArray(state.posts)) state.posts = []; } catch { state.posts = []; }
  }

  async function savePosts(message) {
    await GH.putFile("data/posts.json", JSON.stringify(state.posts, null, 2), state.postsSha, message);
    await loadPosts(); // Đồng bộ sha
  }

  async function loadSite() {
    const file = await GH.getFile("data/site.json");
    state.siteSha = file ? file.sha : null;
    try { state.site = file ? JSON.parse(file.content) : { ...SITE_INFO }; } catch { state.site = { ...SITE_INFO }; }
  }

  async function saveSite(site) {
    // Lấy sha mới nhất từ GitHub (nếu có). Nếu chưa có file, sha = null -> GitHub sẽ tự tạo file mới.
    const freshFile = await GH.getFile("data/site.json");
    state.siteSha = freshFile ? freshFile.sha : null;
    
    await GH.putFile("data/site.json", JSON.stringify(site, null, 2), state.siteSha, "Update site settings");
    await loadSite();
  }

  function renderPostsTable() {
    const tbody = document.getElementById("posts-tbody");
    if (state.posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">Chưa có bài viết nào. Nhấn "+ Thêm bài mới".</td></tr>`;
      return;
    }
    tbody.innerHTML = state.posts.map((p, i) => `
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
      </tr>`).join("");

    tbody.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
      const post = state.posts.find((p) => p.id === b.dataset.edit);
      if (post) { switchTab("compose"); fillForm(post); }
    }));
    tbody.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Xóa bài viết này?")) return;
      state.posts = state.posts.filter((p) => p.id !== b.dataset.del);
      try { await savePosts(`Delete post`); renderPostsTable(); toast("Đã xóa!", "success"); }
      catch (e) { toast("Lỗi xóa: " + e.message, "error"); }
    }));
  }

  function populateCategorySelect() {
    const sel = document.getElementById("f-category");
    const cats = [...new Set([...state.categories, ...state.posts.map((p) => p.category).filter(Boolean)])];
    sel.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  function resetForm() {
    state.editingId = null;
    document.getElementById("compose-title").textContent = "Soạn bài mới";
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
    document.getElementById("thumb-preview").innerHTML = post.thumbnail ? `<img src="${escapeHtml(post.thumbnail)}">` : "";
  }

  document.getElementById("f-title")?.addEventListener("input", (e) => {
    if (state.editingId) return;
    const slugEl = document.getElementById("f-slug");
    if (!slugEl._manual) slugEl.value = slugifyVi(e.target.value);
  });
  document.getElementById("f-slug")?.addEventListener("input", (e) => e.target._manual = true);
  
  document.getElementById("f-thumbnail")?.addEventListener("input", (e) => {
    document.getElementById("thumb-preview").innerHTML = e.target.value ? `<img src="${escapeHtml(e.target.value)}" onerror="this.style.display='none'">` : "";
  });

  document.getElementById("f-upload")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast("Đang upload ảnh…", "success");
      const url = await GH.uploadImage(file);
      document.getElementById("f-thumbnail").value = url;
      document.getElementById("thumb-preview").innerHTML = `<img src="${url}">`;
      toast("Upload thành công!", "success");
    } catch (err) { toast("Lỗi: " + err.message, "error"); }
  });

  document.getElementById("post-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-save-post");
    btn.disabled = true; btn.textContent = "⏳ Đang lưu…";
    try {
      const data = {
        title: document.getElementById("f-title").value.trim(),
        slug: document.getElementById("f-slug").value.trim(),
        excerpt: document.getElementById("f-excerpt").value.trim(),
        content: document.getElementById("f-content").value,
        thumbnail: document.getElementById("f-thumbnail").value.trim(),
        category: document.getElementById("f-category").value,
        tags: document.getElementById("f-tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        downloadUrl: document.getElementById("f-download").value.trim(),
        featured: document.getElementById("f-featured").checked
      };
      if (!data.title || !data.slug) throw new Error("Nhập thiếu Tiêu đề hoặc Slug.");

      if (state.editingId) {
        const idx = state.posts.findIndex((p) => p.id === state.editingId);
        state.posts[idx] = { ...state.posts[idx], ...data, updatedAt: new Date().toISOString().slice(0, 10) };
        await savePosts(`Update post: ${data.title}`);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        state.posts.push({ id: genId(), ...data, createdAt: today, updatedAt: today });
        await savePosts(`Add post: ${data.title}`);
      }
      resetForm(); renderPostsTable(); switchTab("posts"); toast("Đã lưu thành công!");
    } catch (err) { toast("Lỗi: " + err.message, "error"); }
    finally { btn.disabled = false; btn.textContent = "💾 Lưu bài"; }
  });

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
      await saveSite({
        name: document.getElementById("s-name").value.trim(),
        logo: document.getElementById("s-logo").value.trim(),
        description: document.getElementById("s-desc").value.trim(),
        primaryColor: document.getElementById("s-color").value
      });
      toast("Đã lưu cài đặt site!");
    } catch (err) { toast("Lỗi: " + err.message, "error"); }
  });

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
    toast("Đã lưu cấu hình!");
  });

  document.getElementById("btn-test-conn")?.addEventListener("click", async () => {
    const status = document.getElementById("conn-status");
    status.textContent = "Đang kiểm tra…"; status.className = "conn-status";
    try {
      const info = await GH.testConnection();
      status.textContent = `✅ OK: ${info.full_name}`; status.className = "conn-status ok";
    } catch (err) { status.textContent = "❌ " + err.message; status.className = "conn-status err"; }
  });

  async function loadAllData() {
    if (!GH.getConfig().user) { switchTab("github"); return; }
    try {
      await loadSite(); await loadPosts();
      renderPostsTable(); populateCategorySelect(); fillSiteForm();
    } catch (err) { toast("Lỗi tải dữ liệu: " + err.message, "error"); }
  }

  function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "grid";
    fillGhForm(); loadAllData();
  }

  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await Auth.login(document.getElementById("login-password").value);
      showDashboard();
    } catch (err) { document.getElementById("login-error").textContent = err.message; }
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => { Auth.logout(); location.reload(); });
  document.querySelectorAll(".dash-tab").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

  document.addEventListener("DOMContentLoaded", () => {
    if (Auth.isLoggedIn()) showDashboard();
  });
})();
