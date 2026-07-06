# Sơn.blog — React SPA

Bản chuyển đổi từ `frontend/demoBlog.html` (bản demo HTML tĩnh) sang một
ứng dụng React SPA, dùng Vite, tối ưu để deploy lên AWS S3 static
website hosting.

## Cấu trúc

```
src/
  data/posts.js          # dữ liệu bài viết mẫu (mock data)
  context/BlogContext.jsx# state dùng chung: danh sách bài viết, đăng nhập admin
  components/            # Header, Footer, PostCard, TagFilter
  pages/                 # HomePage, PostDetailPage, LoginPage, AdminPage
  App.jsx                # khai báo route (HashRouter)
```

Đăng nhập demo cho khu vực quản trị: `demo@blog.dev` / `123456`.

## Routing: vì sao dùng HashRouter

Ứng dụng dùng `HashRouter` (URL dạng `/#/post/1`) thay vì
`BrowserRouter`.

| | HashRouter | BrowserRouter |
|---|---|---|
| Deploy lên S3 thuần (không CloudFront) | Hoạt động ngay, không cần cấu hình thêm | Cần cấu hình "Error document" trỏ về `index.html` (S3 static website hosting hỗ trợ việc này qua routing rule/error document) |
| URL | Có dấu `#` | Sạch hơn, không dấu `#` |
| Refresh / truy cập trực tiếp một route con | Luôn về đúng `index.html` vì phần path thật luôn là `/` | Nếu thiếu cấu hình error document, S3 trả lỗi 403/404 |

Vì mục tiêu là deploy lên **S3 static hosting thuần**, `HashRouter`
được chọn làm mặc định vì đơn giản, không phụ thuộc cấu hình bổ sung.
Nếu sau này dùng CloudFront (có thể cấu hình custom error response
307/404 → `index.html`) thì có thể đổi sang `BrowserRouter` để có URL
sạch hơn — chỉ cần đổi import trong `src/App.jsx`.

## Build

```bash
npm install
npm run build
```

Kết quả nằm ở thư mục `dist/`. `vite.config.js` đã cấu hình
`base: './'` nên mọi asset (JS, CSS, font) dùng đường dẫn tương đối —
chạy đúng khi bucket S3 không có domain gốc cố định.

## Deploy thủ công lên S3

```bash
aws s3 sync dist/ s3://ten-bucket --delete
```

### Bật Static website hosting trên S3

1. Vào bucket → **Properties** → **Static website hosting** → Enable.
2. **Index document**: `index.html`
3. **Error document**: `index.html`
   (bắt buộc nếu dùng `BrowserRouter`; với `HashRouter` mặc định của
   dự án thì không bắt buộc, nhưng vẫn nên đặt để tránh lỗi 404 khi
   người dùng gõ thẳng một URL không tồn tại).
4. Đảm bảo bucket policy cho phép `s3:GetObject` public (hoặc đứng sau
   CloudFront/OAC nếu cần riêng tư + HTTPS + CDN).

## Scripts

- `npm run dev` — chạy dev server
- `npm run build` — build production vào `dist/`
- `npm run preview` — xem thử bản build ở local
