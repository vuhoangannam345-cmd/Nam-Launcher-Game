// ============================================================
// config.js — Cấu hình toàn cục
// ============================================================

// Mật khẩu admin (Gõ trực tiếp, không dùng hash nữa để tránh lỗi)
const ADMIN_PASSWORD_HASH = "Admin1223";

const SITE_INFO = {
  name: "Nam Gaming",
  logo: "https://i.postimg.cc/0w7jST9s/2aa9b0ff-4e2b-488c-bb0e-e2fb800cecc8.png",
  description: "Chào mừng bạn đến với Nam Gaming — Điểm đến tin cậy của mọi game thủ.",
  primaryColor: "#7c3aed"
};

const STORAGE_KEYS = {
  GH_CONFIG: "gh_config",          
  ADMIN_SESSION: "admin_session",  
  ADMIN_LOCK: "admin_lock"         
};

const POSTS_PER_PAGE = 8;

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return iso; }
}

function slugifyVi(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function genId() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
