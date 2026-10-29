// ============================================================
// config.js — Cấu hình toàn cục + helper tiện ích
// ============================================================

// SHA-256 hash của mật khẩu admin.
// Mật khẩu mặc định: "admin123"
// Muốn đổi → xem README.md mục "Đổi mật khẩu admin"
const ADMIN_PASSWORD_HASH =
  "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

// Thông tin site mặc định (fallback khi /data/site.json chưa có / lỗi)
const SITE_INFO = {
  name: "GameHub",
  logo: "", // để trống → dùng emoji 🎮
  description: "Cổng thông tin game dark theme — tin tức, review và tải game hot nhất.",
  primaryColor: "#7c3aed"
};

// Khóa storage (CHỈ dùng cho session/config, KHÔNG dùng cho bài viết)
const STORAGE_KEYS = {
  GH_CONFIG: "gh_config",          // localStorage: username/repo/branch/PAT
  ADMIN_SESSION: "admin_session",  // sessionStorage: cờ đăng nhập
  ADMIN_LOCK: "admin_lock"         // sessionStorage + localStorage: rate-limit
};

// Số bài mỗi lần "Tải thêm"
const POSTS_PER_PAGE = 8;

// ---------- Helper dùng chung ----------

/** Escape HTML để tránh XSS khi render text */
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

/** Format ngày ISO → dd/mm/yyyy */
function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

/** Sinh slug từ tiếng Việt có dấu */
function slugifyVi(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Sinh ID ngẫu nhiên */
function genId() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
