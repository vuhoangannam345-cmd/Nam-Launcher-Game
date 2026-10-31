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

---

## 🚀 Hướng dẫn Triển khai (Deploy)

Bạn có thể chọn deploy trên **Cloudflare Pages** (Khuyên dùng - Tốc độ cao) hoặc **GitHub Pages**.

### Cách 1: Deploy lên Cloudflare Pages (Tên miền: `namgmvn.pages.dev`)
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Chọn Repository `Nam-Launcher-Game` của bạn.
4. Ở phần **Build settings**, để trống tất cả (vì đây là web tĩnh HTML/JS).
5. Bấm **Save and Deploy**. Web sẽ chạy ngay lập tức.

### Cách 2: Deploy lên GitHub Pages
1. Trên GitHub, vào **Settings** -> **Pages**.
2. Ở mục **Build and deployment**, chọn Source là **Deploy from a branch**.
3. Chọn nhánh `main` và thư mục `/ (root)`. Bấm **Save**.

---

## 🔐 Hướng dẫn Cấu hình Trang Quản Trị (Admin)

Để đăng bài, bạn truy cập vào đường dẫn `/admin.html` (VD: `https://namgmvn.pages.dev/admin.html`).

### 1. Tạo GitHub Personal Access Token (PAT)
Vì Admin dùng API để ghi dữ liệu, bạn cần cấp quyền cho nó:
1. Vào GitHub -> **Settings** (Tài khoản cá nhân) -> **Developer settings** -> **Personal access tokens** -> **Fine-grained tokens**.
2. Bấm **Generate new token**.
3. Chọn quyền truy cập vào Repository `Nam-Launcher-Game`.
4. Ở phần **Permissions**, tìm mục **Contents** và chọn **Read and write**.
5. Tạo Token và copy dãy ký tự đó.
6. Dán Token này vào tab **Cấu hình GitHub** trên trang Admin của bạn.

### 2. Đổi mật khẩu Admin
Mật khẩu mặc định được lưu dưới dạng mã hóa SHA-256 trong file `js/config.js`.
Để đổi mật khẩu:
1. Mở trình duyệt, nhấn `F12` chọn tab **Console**.
2. Dán đoạn code sau (thay `matkhaumoi` bằng mật khẩu bạn muốn):
```javascript
crypto.subtle.digest('SHA-256', new TextEncoder().encode('matkhaumoi'))
  .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
