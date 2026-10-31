# 🎮 Nam Gaming — Nền tảng chia sẻ Game miễn phí
Bản quyền thuộc NamGaming tức PhantomNam ! ©2026 (30/10/2026)

Chào mừng bạn đến với **Nam Gaming**! Đây là một website blog game tĩnh (Static Site) được thiết kế với phong cách **Cyberpunk 2026** (Neon, Kính mờ, Hiệu ứng Mưa Matrix). 

Website **không cần server backend**, chạy hoàn toàn trên môi trường tĩnh (GitHub Pages hoặc Cloudflare Pages). Trang Quản trị (Admin) cho phép bạn thêm/sửa/xóa bài viết trực tiếp thông qua **GitHub REST API** mà không cần cài đặt cơ sở dữ liệu.

---
<img width="927" height="506" alt="image" src="https://github.com/user-attachments/assets/b876c1d1-2281-453c-8f3b-d325ea7e5b52" />

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
<img width="1920" height="995" alt="image" src="https://github.com/user-attachments/assets/fa85550e-426c-493f-a34a-80de66155872" />
<img width="200" height="29" alt="image" src="https://github.com/user-attachments/assets/9ae4fbf2-4642-41df-8ca5-a05d3de5f298" />

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
