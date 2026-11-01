// ============================================================
// admin.js — Dashboard CRUD (Bản Final - Tích hợp Bình luận)
// ============================================================
(() => {
  const state = {
    posts: [], postsSha: null, 
    site: null, siteSha: null,
    comments: [], commentsSha: null, // Thêm biến quản lý bình luận
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
    
    // Tự động load lại bảng bình luận khi chuyển sang tab
    if (name === "comments") renderCommentsTable();
  }

  // ==========================================
  // 1. QUẢN LÝ BÀI VIẾT
  // ==========================================
  async function loadPosts() {
    const file = await GH.getFile("data/posts.json");
    state.postsSha = file ? file.sha : null;
    try { state.posts = file ? JSON.parse(file.content) : []; if (!Array.isArray(state.posts)) state.posts = []; } catch { state.posts = []; }
  }

  async function savePosts(message) {
    await GH.putFile("data/posts.json", JSON.stringify(state.posts, null, 2), state.postsSha, message);
    await loadPosts();
  }

  function renderPostsTable() {
    const tbody = document.getElementById("posts-tbody");
    if (!tbody) return;
    if (state.posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">Chưa có bài viết nào.</td></tr>`;
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

  // ==========================================
  // 2. QUẢN LÝ BÌNH LUẬN (MỚI)
  // ==========================================
  async function loadComments() {
    const file = await GH.getFile("data/comments.json");
    state.commentsSha = file ? file.sha : null;
    try { 
      state.comments = file ? JSON.parse(file.content) : []; 
      if (!Array.isArray(state.comments)) state.comments = []; 
    } catch { state.comments = []; }
  }

  async function saveComments(message) {
    await GH.putFile("data/comments.json", JSON.stringify(state.comments, null, 2), state.commentsSha, message);
    await loadComments(); // Đồng bộ sha
  }

  function renderCommentsTable() {
    const tbody = document.getElementById("comments-tbody");
    if (!tbody) return;

    if (state.comments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;">Không có bình luận nào.</td></tr>`;
      return;
    }

    // Sắp xếp bình luận mới nhất lên đầu
    const sorted = [...state.comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    tbody.innerHTML = sorted.map(c => `
      <tr>
        <td><code>${c.id}</code></td>
        <td><span class="badge">${escapeHtml(c.postId)}</span></td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.content)}</td>
        <td>
          <button class="btn btn-danger btn-sm" data-del-cmt="${c.id}">Xóa</button>
        </td>
      </tr>
    `).join("");

    // Gắn sự kiện xóa bình luận
    tbody.querySelectorAll("[data-del-cmt]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
        const id = btn.dataset.delCmt;
        state.comments = state.comments.filter(c => c.id !== id);
        try {
          await saveComments(`Delete comment ${id}`);
          renderCommentsTable();
          toast("Đã xóa bình luận!");
        } catch (e) { toast("Lỗi xóa: " + e.message, "error"); }
      });
    });
  }

  // Xử lý form Thêm bình luận thủ công
  document.getElementById("btn-toggle-add-comment")?.addEventListener("click", () => {
    const wrap = document.getElementById("add-comment-wrap");
    wrap.style.display = wrap.style.display === "none" ? "block" : "none";
  });
  
  document.getElementById("btn-cancel-add-comment")?.addEventListener("click", () => {
    document.getElementById("add-comment-wrap").style.display = "none";
    document.getElementById("add-comment-form").reset();
  });

  document.getElementById("add-comment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Đang lưu...";

    try {
      const newCmt = {
        id: "cmt_" + Date.now(),
        postId: document.getElementById("ac-postid").value.trim(),
        name: document.getElementById("ac-name").value.trim(),
        content: document.getElementById("ac-content").value.trim(),
        parentId: null,
        createdAt: new Date().toISOString()
      };

      state.comments.push(newCmt);
      await saveComments("Add manual comment");
      
      document.getElementById("add-comment-form").reset();
      document.getElementById("add-comment-wrap").style.display = "none";
      renderCommentsTable();
      toast("Đã thêm bình luận!");
    } catch (err) {
      toast("Lỗi: " + err.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Lưu bình luận";
    }
  });

  document.getElementById("btn-reload-comments")?.addEventListener("click", async () => {
    try {
      await loadComments();
      renderCommentsTable();
      toast("Đã tải lại bình luận!");
    } catch (e) { toast("Lỗi: " + e.message, "error"); }
  });


  // ==========================================
  // 3. SOẠN BÀI & CÀI ĐẶT SITE
  // ==========================================
  function populateCategorySelect() {
    const sel = document.getElementById("f-category");
    if (!sel) return;
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

  async function loadSite() {
    const file = await GH.getFile("data/site.json");
    state.siteSha = file ? file.sha : null;
    try { state.site = file ? JSON.parse(file.content) : { ...SITE_INFO }; } catch { state.site = { ...SITE_INFO }; }
  }

  async function saveSite(site) {
    const freshFile = await GH.getFile("data/site.json");
    state.siteSha = freshFile ? freshFile.sha : null;
    await GH.putFile("data/site.json", JSON.stringify(site, null, 2), state.siteSha, "Update site settings");
    await loadSite();
  }

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

  // ==========================================
  // 4. CẤU HÌNH GITHUB & KHỞI TẠO
  // ==========================================
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
      await loadSite(); 
      await loadPosts();
      await loadComments(); // Tải bình luận
      renderPostsTable(); 
      populateCategorySelect(); 
      fillSiteForm();
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
