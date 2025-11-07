# Admin Panel - Next.js

Ứng dụng quản lý Admin cho Zalo Clone được xây dựng bằng Next.js.

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu hình

Tạo file `.env.local` với nội dung:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Tính năng

- Đăng nhập Admin
- Dashboard với thống kê
- Quản lý người dùng (xem, cập nhật role, chặn, xóa)
- Quản lý bài viết (xem, xóa)

## Lưu ý

Bạn cần có tài khoản với role ADMIN để truy cập admin panel. Có thể cập nhật role của user thông qua API hoặc database trực tiếp.

