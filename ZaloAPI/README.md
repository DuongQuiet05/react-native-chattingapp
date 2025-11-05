# Zalo API - Chat Application Backend

API backend cho ứng dụng chat giống Zalo được xây dựng bằng Spring Boot, WebSocket, JWT Authentication và MySQL.

## 📋 Tính năng

- ✅ **Authentication & Authorization**: JWT-based authentication
- ✅ **User Management**: Đăng ký, đăng nhập, quản lý profile và status
- ✅ **Conversations**: Tạo và quản lý cuộc trò chuyện 1-1 và nhóm
- ✅ **Real-time Messaging**: WebSocket/STOMP cho chat real-time
- ✅ **Message Receipts**: Theo dõi trạng thái đã gửi/đã nhận/đã đọc
- ✅ **Call Logs**: Lịch sử cuộc gọi video
- ✅ **Swagger UI**: API documentation và testing

## 🛠️ Tech Stack

- **Framework**: Spring Boot 3.5.7
- **Security**: Spring Security + JWT
- **Database**: MySQL
- **Real-time**: WebSocket + STOMP
- **ORM**: Spring Data JPA + Hibernate
- **API Docs**: SpringDoc OpenAPI (Swagger)
- **Build Tool**: Gradle

## 📦 Cấu trúc Project

```
src/main/java/org/example/zaloapi/
├── config/              # Configuration classes
│   ├── SecurityConfig.java
│   ├── WebSocketConfig.java
│   └── OpenApiConfig.java
├── controller/          # REST & WebSocket controllers
│   ├── AuthController.java
│   ├── UserController.java
│   ├── ConversationController.java
│   ├── MessageController.java
│   └── WebSocketController.java
├── dto/                 # Data Transfer Objects
│   ├── AuthResponse.java
│   ├── LoginRequest.java
│   ├── RegisterRequest.java
│   ├── MessageDto.java
│   ├── ConversationDto.java
│   └── ...
├── entity/              # JPA Entities
│   ├── User.java
│   ├── Conversation.java
│   ├── Message.java
│   ├── MessageReceipt.java
│   ├── CallLog.java
│   └── ...
├── repository/          # Spring Data JPA Repositories
├── service/             # Business logic services
│   ├── AuthService.java
│   ├── UserService.java
│   ├── ConversationService.java
│   └── MessageService.java
├── security/            # Security components
│   ├── JwtUtil.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetailsService.java
└── exception/           # Exception handlers
```

## 🚀 Cài đặt và Chạy

### 1. Yêu cầu

- Java 17+
- MySQL 8.0+
- Gradle 8.x

### 2. Cấu hình Database

Tạo database MySQL:

```sql
CREATE DATABASE zalo_db;
```

Cập nhật thông tin database trong `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/zalo_db
spring.datasource.username=root
spring.datasource.password=your_password
```

### 3. Build và Run

```bash
# Build project
./gradlew clean build

# Run application
./gradlew bootRun
```

Hoặc chạy trực tiếp file JAR:

```bash
java -jar build/libs/ZaloAPI-0.0.1-SNAPSHOT.jar
```

Application sẽ chạy tại: `http://localhost:8080`

## 📚 API Documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`

API Docs JSON: `http://localhost:8080/v3/api-docs`

## 🔐 Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user1",
  "password": "password123",
  "displayName": "User One"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "user1",
  "displayName": "User One",
  "avatarUrl": null
}
```

### Sử dụng Token

Thêm header vào mọi request cần authentication:

```
Authorization: Bearer {your_token}
```

## 💬 REST API Endpoints

### Users

- `GET /api/users/me` - Get current user info
- `GET /api/users/{userId}` - Get user by ID
- `GET /api/users` - Get all users
- `PUT /api/users/{userId}/status` - Update user status
- `PUT /api/users/{userId}/profile` - Update user profile

### Conversations

- `POST /api/conversations` - Create new conversation
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/{conversationId}` - Get conversation details

### Messages

- `POST /api/messages` - Send message
- `GET /api/messages/conversation/{conversationId}` - Get messages
- `PUT /api/messages/{messageId}/delivered` - Mark as delivered
- `PUT /api/messages/{messageId}/read` - Mark as read

## 🔌 WebSocket Endpoints

### Connect to WebSocket

```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({
  'Authorization': 'Bearer ' + token
}, onConnected, onError);
```

### Subscribe to Topics

```javascript
// Subscribe to conversation
stompClient.subscribe('/topic/conversations/' + conversationId, onMessageReceived);

// Subscribe to private messages
stompClient.subscribe('/user/queue/private', onPrivateMessage);
```

### Send Messages

```javascript
// Send message
stompClient.send('/app/chat.send', {}, JSON.stringify({
  conversationId: 1,
  content: 'Hello!',
  messageType: 'TEXT'
}));

// Send typing indicator
stompClient.send('/app/chat.typing', {}, JSON.stringify({
  conversationId: 1
}));

// Mark as read
stompClient.send('/app/chat.read', {}, JSON.stringify({
  id: messageId,
  conversationId: conversationId
}));
```

## 📊 Database Schema

### Users Table
- id, username, password_hash, display_name, avatar_url
- status (ONLINE/OFFLINE/AWAY), last_seen

### Conversations Table
- id, type (PRIVATE/GROUP), group_name, group_avatar_url
- created_by, created_at

### Messages Table
- id, conversation_id, sender_id, content
- message_type (TEXT/IMAGE/VIDEO/SYSTEM), sent_at

### Message_Receipts Table
- id, message_id, user_id, conversation_id
- status (SENT/DELIVERED/READ), updated_at

### Call_Logs Table
- id, conversation_id, caller_id
- start_time, end_time, duration_seconds
- status (INITIATED/ANSWERED/MISSED/ENDED/DECLINED)

## 🧪 Testing với Swagger

1. Mở Swagger UI: `http://localhost:8080/swagger-ui.html`
2. Register một user mới qua endpoint `/api/auth/register`
3. Login để lấy JWT token qua endpoint `/api/auth/login`
4. Click nút **Authorize** ở góc trên bên phải
5. Nhập: `Bearer {your_token}` và click **Authorize**
6. Bây giờ bạn có thể test tất cả các API endpoints!

## 🔧 Configuration

### JWT Configuration

Trong `application.properties`:

```properties
# JWT secret key (nên đổi trong production)
jwt.secret=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437

# JWT expiration time (24 hours in milliseconds)
jwt.expiration=86400000
```

### WebSocket Configuration

WebSocket endpoint: `/ws`
- Broker prefixes: `/topic`, `/queue`
- Application prefix: `/app`
- User prefix: `/user`

## 📝 Ví dụ Flow hoàn chỉnh

### 1. Đăng ký và đăng nhập 2 users

```bash
# User 1
POST /api/auth/register
{
  "username": "alice",
  "password": "password123",
  "displayName": "Alice"
}

# User 2
POST /api/auth/register
{
  "username": "bob",
  "password": "password123",
  "displayName": "Bob"
}
```

### 2. Tạo private conversation

```bash
POST /api/conversations
Authorization: Bearer {alice_token}

{
  "type": "PRIVATE",
  "participantIds": [1, 2]  # Alice and Bob's IDs
}
```

### 3. Gửi message qua REST API

```bash
POST /api/messages
Authorization: Bearer {alice_token}

{
  "conversationId": 1,
  "content": "Hello Bob!",
  "messageType": "TEXT"
}
```

### 4. Gửi message qua WebSocket

```javascript
// Alice connects and sends message
stompClient.send('/app/chat.send', {}, JSON.stringify({
  conversationId: 1,
  content: 'Hello Bob!',
  messageType: 'TEXT'
}));

// Bob receives message on subscription
stompClient.subscribe('/topic/conversations/1', (message) => {
  const chatMessage = JSON.parse(message.body);
  console.log('Received:', chatMessage);
});
```

## 🚨 Troubleshooting

### Database Connection Error
- Kiểm tra MySQL đã chạy
- Verify username/password trong `application.properties`
- Đảm bảo database `zalo_db` đã được tạo

### JWT Token Invalid
- Kiểm tra token còn hạn (24h)
- Đảm bảo format header: `Bearer {token}`
- Verify jwt.secret trong config

### WebSocket Connection Failed
- Kiểm tra CORS configuration
- Verify JWT token được gửi trong CONNECT frame
- Check browser console cho errors

## 📄 License

Apache 2.0

## 👥 Contributors

Developed by KyIV

---

**Happy Coding! 🚀**

