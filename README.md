# 🎮 GameHub — Static Gaming Blog trên GitHub Pages

Website blog game (dark theme) giống Google Sites, **không cần server**, deploy 100% trên **GitHub Pages**. Admin CRUD bài viết **trực tiếp lên `data/posts.json` qua GitHub REST API**.

---

## ✨ Tính năng

- 🌑 Dark theme gaming (gradient tím–xanh, glow, font Orbitron/Rajdhani)
- 📄 **Single source of truth**: `data/posts.json` — mọi CRUD ghi thẳng lên GitHub
- 🔐 Trang admin có mật khẩu (SHA-256 + rate-limit 5 lần / khóa 60s)
- ✏️ Soạn bài với auto-slug, upload ảnh lên `assets/uploads/`, preview thumbnail
- 🔍 Tìm kiếm realtime + lọc theo thể loại + "Tải thêm" 8 bài/lần
- 🏷️ Sidebar: bài mới, danh mục, tag cloud
- 📱 Responsive 1-2-3-4 cột
- 🚀 SEO động (title, meta description, Open Graph) theo từng bài

---

## ⚠️ QUY TẮC DỮ LIỆU (BẮT BUỘC)

| Loại dữ liệu | Nơi lưu |
|---|---|
| **Bài viết** | `data/posts.json` trên GitHub — **duy nhất** |
| **Cấu hình site** | `data/site.json` trên GitHub |
| **Ảnh upload** | `assets/uploads/` trên GitHub |
| Cấu hình GitHub (user/repo/branch/PAT) | `localStorage` |
| Trạng thái đăng nhập admin | `sessionStorage` |

> 🚫 **KHÔNG BAO GIỜ** lưu bài viết vào `localStorage`, `sessionStorage`, `IndexedDB` hay cache trình duyệt. Nếu GitHub API lỗi → hiển thị lỗi, **không fallback** ghi local.

---

## 🚀 Hướng dẫn deploy

### 1. Tạo repo

```bash
# Trên GitHub: New repository → đặt tên (vd: my-game-blog)
# Public repo (nếu muốn dùng GitHub Pages miễn phí)
