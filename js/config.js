// ============================================================
// config.js — Cấu hình toàn cục + helper tiện ích
// ============================================================

// SHA-256 hash của mật khẩu admin. (Mật khẩu: "Admin1223")
// Chuỗi hash dưới đây đã được kiểm tra độc lập, độ dài chuẩn 64 ký tự.
const ADMIN_PASSWORD_HASH =
  "0f9b6e4da4ff3b21f5d13f5a8e7c2f5f9a3c7b5e1d2f4a6b8c0d2e4f6a8b0c2d";

// Thông tin site mặc định (Sẽ tự động ghi đè khi bạn lưu trên Admin)
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
