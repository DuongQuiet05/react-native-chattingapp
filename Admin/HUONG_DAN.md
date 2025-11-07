# Hướng dẫn Hệ thống Admin Panel

## Tổng quan

Đã triển khai hệ thống quản lý Admin cho ứng dụng Zalo Clone với đầy đủ tính năng quản lý người dùng và bài viết.

## Backend (Spring Boot)

### Các thay đổi chính:

1. **Entity User** (`User.java`):
   - Thêm field `role` với enum `UserRole` (USER, ADMIN)
   - Mặc định là USER khi tạo mới

2. **Security** (`SecurityConfig.java`):
   - Thêm `@EnableMethodSecurity` để hỗ trợ `@PreAuthorize`
   - Bảo vệ endpoint `/api/admin/**` chỉ cho role ADMIN

3. **CustomUserDetailsService**:
   - Cập nhật để load role vào authorities
   - Tạo SimpleGrantedAuthority với format "ROLE_ADMIN" hoặc "ROLE_USER"

4. **AdminService** (`AdminService.java`):
   - Quản lý users: getAllUsers, getUserById, updateUserRole, updateUserStatus, deleteUser, banUser
   - Quản lý posts: getAllPosts, getPostById, deletePost, getPostsByUser
   - Thống kê: getTotalUsers, getTotalPosts, getTotalAdmins

5. **AdminController** (`AdminController.java`):
   - Tất cả endpoints được bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")`
   - Endpoints:
     - `GET /api/admin/users` - Danh sách users (có pagination và search)
     - `GET /api/admin/users/{userId}` - Chi tiết user
     - `PUT /api/admin/users/{userId}/role?role=ADMIN` - Cập nhật role
     - `PUT /api/admin/users/{userId}/status?status=OFFLINE` - Cập nhật status
     - `DELETE /api/admin/users/{userId}` - Xóa user
     - `POST /api/admin/users/{userId}/ban` - Chặn user
     - `GET /api/admin/posts` - Danh sách posts (có pagination và search)
     - `GET /api/admin/posts/{postId}` - Chi tiết post
     - `DELETE /api/admin/posts/{postId}` - Xóa post
     - `GET /api/admin/users/{userId}/posts` - Danh sách posts của user
     - `GET /api/admin/stats` - Thống kê tổng quan

6. **UserRepository**:
   - Thêm method `findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase` cho search
   - Thêm method `countByRole` cho thống kê

7. **UserDto**:
   - Thêm field `role` để hiển thị role của user

## Frontend (Next.js Admin Panel)

### Cấu trúc:

```
Admin/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard với thống kê
│   ├── login/
│   │   └── page.tsx        # Trang đăng nhập
│   ├── users/
│   │   └── page.tsx        # Quản lý users
│   └── posts/
│       └── page.tsx        # Quản lý posts
├── lib/
│   └── api-client.ts       # Axios client với interceptors
└── package.json
```

### Tính năng:

1. **Dashboard** (`/`):
   - Hiển thị thống kê: Tổng users, Tổng posts, Tổng admins
   - Navigation đến các trang quản lý

2. **Login** (`/login`):
   - Đăng nhập với username/password
   - Lưu token vào localStorage
   - Tự động redirect nếu chưa đăng nhập

3. **Quản lý Users** (`/users`):
   - Danh sách users với pagination
   - Tìm kiếm theo username hoặc displayName
   - Hiển thị role (ADMIN/USER) với badge màu
   - Actions:
     - Cập nhật role (Làm Admin / Hủy Admin)
     - Chặn user
     - Xóa user

4. **Quản lý Posts** (`/posts`):
   - Danh sách posts với pagination
   - Tìm kiếm theo nội dung
   - Hiển thị thông tin: tác giả, nội dung, số comments/reactions, privacy type
   - Action: Xóa post

## Cách sử dụng

### 1. Thiết lập Backend

1. Đảm bảo database đã chạy và có schema `zalo_db`
2. Thực thi migration hoặc để Hibernate tự động tạo bảng với field `role`
3. Tạo user admin đầu tiên thông qua database:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE username = 'your_admin_username';
   ```
   Hoặc sử dụng API để update role sau khi đăng ký user thường.

### 2. Chạy Backend

```bash
cd ZaloAPI
./gradlew bootRun
```

Backend sẽ chạy tại `http://localhost:8080`

### 3. Thiết lập Frontend Admin

```bash
cd Admin
npm install
```

Tạo file `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. Chạy Frontend Admin

```bash
npm run dev
```

Admin panel sẽ chạy tại `http://localhost:3000`

### 5. Đăng nhập

1. Truy cập `http://localhost:3000/login`
2. Đăng nhập với tài khoản có role ADMIN
3. Sau khi đăng nhập thành công, sẽ được redirect đến dashboard

## Lưu ý quan trọng

1. **Quyền truy cập**: Chỉ users có role ADMIN mới có thể truy cập admin panel và các API `/api/admin/**`

2. **Tạo Admin đầu tiên**: 
   - Có thể tạo user thường qua API `/api/auth/register`
   - Sau đó update role trong database: `UPDATE users SET role = 'ADMIN' WHERE id = ?;`
   - Hoặc sau khi đăng nhập vào admin panel với một admin khác, có thể cập nhật role qua UI

3. **Bảo mật**: 
   - Token được lưu trong localStorage
   - Tự động logout khi token hết hạn hoặc 401
   - Backend kiểm tra role ở cả SecurityConfig và method level

4. **CORS**: Backend đã cấu hình CORS để cho phép frontend admin truy cập

## API Documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`

Tất cả admin endpoints đều có trong Swagger UI và được tag là "Admin".

## Troubleshooting

1. **Lỗi 403 Forbidden**: Đảm bảo user đã đăng nhập có role ADMIN
2. **Lỗi CORS**: Kiểm tra cấu hình CORS trong SecurityConfig
3. **Token không hợp lệ**: Đăng xuất và đăng nhập lại
4. **Không thấy role trong database**: Chạy migration hoặc để Hibernate tự động tạo column

## Mở rộng trong tương lai

Có thể thêm:
- Quản lý comments
- Quản lý conversations
- Phân quyền chi tiết hơn (Moderator, Super Admin)
- Audit log cho các thao tác admin
- Export dữ liệu (CSV, Excel)
- Dashboard với charts và analytics

