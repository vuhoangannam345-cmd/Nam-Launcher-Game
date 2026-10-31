# 🎮 Nam Gaming — Nền tảng chia sẻ Game miễn phí
Bản quyền thuộc NamGaming tức PhantomNam ! ©2026 (30/10/2026)

Chào mừng bạn đến với **Nam Gaming**! Đây là một website blog game tĩnh (Static Site) được thiết kế với phong cách **Cyberpunk 2026** (Neon, Kính mờ, Hiệu ứng Mưa Matrix). 

Website **không cần server backend**, chạy hoàn toàn trên môi trường tĩnh (GitHub Pages hoặc Cloudflare Pages). Trang Quản trị (Admin) cho phép bạn thêm/sửa/xóa bài viết trực tiếp thông qua **GitHub REST API** mà không cần cài đặt cơ sở dữ liệu.

---

## ✨ Tính năng nổi bật

- 🌌 **Giao diện Cyberpunk 2026**: Dark theme kết hợp Neon Cyan, hiệu ứng kính mờ (Glassmorphism) và mưa Matrix.
- 🌓 **Chuyển đổi Sáng/Tối**: Tích hợp nút chuyển đổi giao diện (Lưu vào `localStorage`).
- 📄 **Single Source of Truth**: Mọi bài viết được lưu trữ duy nhất tại file `data/posts.json` trên GitHub.
- 🔐 **Trang Admin Bảo Mật**: Đăng nhập bằng mật khẩu (Hash SHA-256) , tự động khóa 60s nếu nhập sai quá 3 lần.
- ✏️ **Trình soạn thảo thông minh**: Tự động tạo Slug, upload ảnh trực tiếp lên `assets/uploads/`, preview thumbnail.
- 🔍 **Tìm kiếm & Lọc**: Tìm kiếm realtime, lọc theo thể loại, nút "Tải thêm" (Load more).
- 📱 **Responsive 100%**: Tự động co giãn hoàn hảo từ PC, Tablet đến Mobile.
- 🚀 **SEO Tự Động**: Tự động cập nhật Sitemap và Ping Google thông qua GitHub Actions.
- 🌍 **Flag Counter**: Thống kê lượt truy cập từ các quốc gia.

---

## ⚠️ QUY TẮC DỮ LIỆU (BẮT BUỘC)

| Loại dữ liệu | Nơi lưu trữ |
|---|---|
| **Bài viết** | `data/posts.json` trên GitHub — **Nguồn dữ liệu duy nhất** |
| **Cấu hình site (Tên, Logo, Màu)** | `data/site.json` trên GitHub |
| **Hình ảnh Upload** | Thư mục `assets/uploads/` trên GitHub |
| **Cấu hình GitHub (User, Repo, PAT)** | `localStorage` (Chỉ lưu trên máy Admin) |
| **Trạng thái đăng nhập** | `sessionStorage` |
| **Giao diện Sáng/Tối** | `localStorage` |

> 🚫 **TUYỆT ĐỐI KHÔNG** lưu bài viết vào `localStorage`, `sessionStorage` hay `IndexedDB`. Nếu GitHub API gặp lỗi, trang web sẽ báo lỗi chứ **không được phép** tự động lưu tạm xuống trình duyệt.
