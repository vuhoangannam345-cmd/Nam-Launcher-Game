// ============================================================
// config.js — Cấu hình toàn cục + helper tiện ích
// ============================================================

// SHA-256 hash của mật khẩu admin. (Mật khẩu mới: "Namgaming2013")
const ADMIN_PASSWORD_HASH =
  "b3e442652fb2da45aee05b9a77c8a573b215de07d0e540b24e3a3b36a20a9023";

// Thông tin site mặc định (Sẽ tự động ghi đè khi bạn lưu trên Admin)
const SITE_INFO = {
  name: "Nam Gaming",
  logo: "https://i.postimg.cc/0w7jST9s/2aa9b0ff-4e2b-488c-bb0e-e2fb800cecc8.png",
  description: "Chào mừng bạn đến với Nam Gaming — Điểm đến tin cậy của mọi game thủ. Chúng tôi cung cấp link tải game chất lượng cao, an toàn và bảo mật tuyệt đối.",
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
