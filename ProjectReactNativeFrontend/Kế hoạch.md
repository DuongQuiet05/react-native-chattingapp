# Hướng dẫn Toàn diện Xây dựng Ứng dụng Giống Zalo: React Native, Spring Boot, MySQL và Gọi video Agora

Tài liệu này cung cấp một kế hoạch chi tiết, cấp độ sản xuất để phát
triển một ứng dụng trò chuyện và gọi video thời gian thực, tương tự như
Zalo. Hướng dẫn này bao gồm toàn bộ vòng đời phát triển, từ thiết kế
kiến trúc, cấu trúc cơ sở dữ liệu, đến triển khai backend và frontend,
sử dụng một bộ công nghệ hiện đại bao gồm React Native, Spring Boot,
MySQL, tích hợp gọi video qua Agora và quản lý dữ liệu phía client với
TanStack Query.

## Phần I: Nền tảng Kiến trúc & Thiết kế Hệ thống {#phần-i-nền-tảng-kiến-trúc-thiết-kế-hệ-thống}

Phần này thiết lập bản thiết kế cấp cao cho ứng dụng, không chỉ chi tiết
hóa các thành phần mà còn giải thích lý do đằng sau sự tương tác của
chúng, tập trung vào việc tạo ra một hệ thống có khả năng mở rộng và bảo
mật.

### 1.1. Sơ đồ Hệ thống Cấp cao {#sơ-đồ-hệ-thống-cấp-cao}

Kiến trúc của ứng dụng được xây dựng dựa trên mô hình ba tầng
(three-tier) đã được kiểm chứng, giúp phân tách rõ ràng các mối quan tâm
và tăng cường khả năng bảo trì.^1^

- **Tầng Trình bày (Client):** Ứng dụng React Native đóng vai trò là
  > tầng trình bày, chịu trách nhiệm về giao diện người dùng (UI), trải
  > nghiệm người dùng (UX) và tất cả các tương tác trực tiếp với người
  > dùng.^1^

- **Tầng Ứng dụng/Nghiệp vụ (Server):** Ứng dụng Spring Boot là trái tim
  > của hệ thống, chứa toàn bộ logic nghiệp vụ, xử lý các yêu cầu API,
  > quản lý giao tiếp thời gian thực và kết nối với các dịch vụ bên
  > ngoài.^1^

- **Tầng Dữ liệu:** Cơ sở dữ liệu MySQL hoạt động như một lớp lưu trữ
  > bền vững, chịu trách nhiệm lưu trữ tất cả dữ liệu của ứng dụng, từ
  > thông tin người dùng đến lịch sử tin nhắn.^1^

Sơ đồ kiến trúc tổng thể dưới đây minh họa luồng giao tiếp giữa các
thành phần: client React Native giao tiếp với backend Spring Boot thông
qua cả REST API (cho các hoạt động không đồng bộ) và WebSockets (cho
giao tiếp thời gian thực). Backend sau đó tương tác với cơ sở dữ liệu
MySQL để lưu trữ và truy xuất dữ liệu. Các dịch vụ của bên thứ ba như
Agora cho gọi video và Firebase Cloud Messaging (FCM) cho thông báo đẩy
được tích hợp vào hệ thống để cung cấp các chức năng nâng cao.^2^

Mặc dù ban đầu được xây dựng như một ứng dụng nguyên khối (monolith),
ứng dụng Spring Boot nên áp dụng phương pháp tiếp cận hướng dịch vụ.
Điều này liên quan đến việc phân tách các mối quan tâm thành các mô-đun
logic riêng biệt như Xác thực, Nhắn tin, Hồ sơ người dùng và Quản lý
cuộc gọi. Cách tiếp cận này tuân thủ các nguyên tắc thiết kế phần mềm
hiện đại, giúp dễ dàng bảo trì và tạo điều kiện cho việc chuyển đổi sang
kiến trúc microservices trong tương lai nếu cần.^4^

### 1.2. Chiến lược Giao tiếp Thời gian thực: Phương pháp Hybrid {#chiến-lược-giao-tiếp-thời-gian-thực-phương-pháp-hybrid}

Để tối ưu hóa hiệu suất và sử dụng tài nguyên, một mô hình giao tiếp
hybrid (lai) được khuyến nghị.

- **RESTful APIs (HTTP):** Được sử dụng cho các tương tác không trạng
  > thái, theo mô hình yêu cầu-phản hồi. Đây là lựa chọn lý tưởng cho
  > các hoạt động như đăng nhập/đăng ký người dùng, lấy thông tin hồ sơ,
  > truy xuất lịch sử trò chuyện và khởi tạo cuộc gọi. Spring MVC là
  > công cụ phù hợp để xây dựng các API này.^4^

- **WebSockets:** Được sử dụng để thiết lập các kết nối bền vững, hai
  > chiều cho giao tiếp thời gian thực. Điều này là cần thiết cho việc
  > gửi và nhận tin nhắn tức thì, hiển thị chỉ báo \"đang gõ\" và cập
  > nhật trạng thái hiện diện (online/offline) của người dùng.^7^

- **STOMP (Simple Text Oriented Messaging Protocol):** Việc sử dụng
  > STOMP trên nền tảng WebSockets mang lại nhiều lợi thế. STOMP cung
  > cấp một lớp trừu tượng cấp cao hơn, dựa trên tin nhắn với các \"đích
  > đến\" (destinations) được đặt tên (ví dụ: /topic/group/{groupId},
  > /user/{userId}/queue/private). Điều này đơn giản hóa đáng kể việc
  > định tuyến tin nhắn và logic phía client.^9^ Cấu hình backend Spring
  > cho các điểm cuối STOMP sẽ được chi tiết hóa, bao gồm việc đăng ký
  > một điểm cuối tại /ws và kích hoạt các tiền tố đích của ứng dụng như
  > /app.^9^

### 1.3. Luồng Xác thực và Bảo mật {#luồng-xác-thực-và-bảo-mật}

Một luồng xác thực dựa trên JSON Web Token (JWT) sẽ được triển khai để
bảo mật toàn bộ hệ thống. Đây là một thành phần quan trọng để bảo vệ một
hệ thống phân tán.

- **Luồng Đăng nhập:** Người dùng gửi thông tin đăng nhập qua một điểm
  > cuối REST. Máy chủ Spring Boot xác thực thông tin này, tạo ra một
  > JWT chứa các thông tin nhận dạng người dùng (ví dụ: userId,
  > username) và trả về cho client React Native.^11^

- **Bảo mật REST APIs:** Đối với các yêu cầu HTTP tiếp theo, client sẽ
  > đính kèm JWT trong tiêu đề Authorization. Một bộ lọc JwtTokenFilter
  > trong chuỗi bảo mật của Spring Security sẽ chặn và xác thực token
  > này trên mỗi yêu cầu, đảm bảo rằng chỉ những người dùng đã được xác
  > thực mới có thể truy cập các tài nguyên được bảo vệ.^12^

- **Bảo mật WebSockets:** Đây là một quy trình phức tạp hơn. JWT phải
  > được truyền trong quá trình bắt tay (handshake) WebSocket ban đầu,
  > thường là qua một tiêu đề kết nối. Một ChannelInterceptor hoặc
  > HandshakeInterceptor tùy chỉnh của Spring sẽ xác thực token, xác
  > thực người dùng và liên kết danh tính Principal của họ với phiên
  > WebSocket. Bước này cực kỳ quan trọng vì nó cho phép hệ thống gửi
  > tin nhắn nhắm mục tiêu đến những người dùng cụ thể, đảm bảo tính
  > riêng tư và bảo mật.^13^

Việc sử dụng một mô hình bảo mật thống nhất là điều cốt yếu. Cả API REST
và kết nối WebSocket đều phải được bảo mật bằng cùng một cơ chế, đó là
JWT. Luồng hoạt động này tạo ra một mối liên kết nhân quả: việc đăng
nhập thành công qua HTTP cung cấp token, và token này sau đó là điều
kiện bắt buộc để thiết lập một kết nối WebSocket đã được xác thực. Do
đó, kiến trúc bảo mật của backend phải được thiết kế một cách toàn diện.
Cùng một lớp tiện ích JWT và dịch vụ chi tiết người dùng được sử dụng
cho JwtTokenFilter của REST cũng phải được truy cập bởi
HandshakeInterceptor của WebSocket. Cách tiếp cận thống nhất này là một
phương pháp hay nhất để đảm bảo tính mạnh mẽ và khả năng bảo trì của hệ
thống.

## Phần II: Kiến trúc Cơ sở dữ liệu: Xương sống Dữ liệu

Phần này cung cấp một lược đồ cơ sở dữ liệu có khả năng mở rộng và sẵn
sàng cho môi trường sản xuất. Lược đồ này vượt ra ngoài các ví dụ đơn
giản để giải quyết các vấn đề phức tạp trong thế giới thực như trò
chuyện nhóm và trạng thái đã đọc của từng người dùng.

### 2.1. Sơ đồ Quan hệ Thực thể (ERD) {#sơ-đồ-quan-hệ-thực-thể-erd}

Một sơ đồ ERD chuyên nghiệp sẽ được trình bày, minh họa trực quan tất cả
các bảng, cột, khóa chính, khóa ngoại và các mối quan hệ (một-một,
một-nhiều, nhiều-nhiều). Điều này cung cấp một cái nhìn tổng quan nhanh
chóng về toàn bộ mô hình dữ liệu.^14^

### 2.2. Định nghĩa Lược đồ Chi tiết {#định-nghĩa-lược-đồ-chi-tiết}

Phần này sẽ cung cấp một phân tích chi tiết về cấu trúc và mục đích của
từng bảng, được thiết kế để có khả năng mở rộng và hiệu suất cao trong
một cơ sở dữ liệu quan hệ như MySQL.

- **Bảng users:** Lưu trữ thông tin hồ sơ người dùng, thông tin xác thực
  > và trạng thái hiện diện.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - username (VARCHAR, UNIQUE)

  - password_hash (VARCHAR)

  - display_name (VARCHAR)

  - avatar_url (VARCHAR)

  - status (ENUM(\'ONLINE\', \'OFFLINE\', \'AWAY\'))

  - last_seen (TIMESTAMP)

  - ^17^

- **Bảng conversations:** Bảng trung tâm để định nghĩa một cuộc trò
  > chuyện, dù là giữa hai người hay một nhóm.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - type (ENUM(\'PRIVATE\', \'GROUP\'))

  - group_name (VARCHAR, có thể null cho cuộc trò chuyện riêng tư)

  - group_avatar_url (VARCHAR, có thể null)

  - created_by (FK đến users.id)

  - created_at (TIMESTAMP)

  - ^17^

- **Bảng conversation_participants:** Bảng nối cho mối quan hệ
  > nhiều-nhiều giữa users và conversations.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - conversation_id (FK đến conversations.id)

  - user_id (FK đến users.id)

  - role (ENUM(\'ADMIN\', \'MEMBER\'), mặc định là \'MEMBER\')

  - joined_at (TIMESTAMP)

  - Ràng buộc duy nhất trên (conversation_id, user_id).

  - ^17^

- **Bảng messages:** Lưu trữ mọi tin nhắn được gửi trong hệ thống.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - conversation_id (FK đến conversations.id, được đánh chỉ mục)

  - sender_id (FK đến users.id)

  - content (TEXT)

  - message_type (ENUM(\'TEXT\', \'IMAGE\', \'VIDEO\', \'SYSTEM\'), mặc
    > định là \'TEXT\')

  - sent_at (TIMESTAMP, được đánh chỉ mục)

  - ^17^

- **Bảng message_receipts:** Chìa khóa để theo dõi trạng thái delivered
  > (đã gửi đến) và read (đã đọc) cho mỗi người dùng trong một cuộc trò
  > chuyện, đặc biệt quan trọng đối với các cuộc trò chuyện nhóm.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - message_id (FK đến messages.id)

  - user_id (FK đến users.id)

  - conversation_id (FK đến conversations.id, để truy vấn dễ dàng hơn)

  - status (ENUM(\'SENT\', \'DELIVERED\', \'READ\'))

  - updated_at (TIMESTAMP)

  - Ràng buộc duy nhất trên (message_id, user_id).

  - ^17^

- **Bảng call_logs:** Lưu trữ lịch sử của tất cả các cuộc gọi video.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - conversation_id (FK đến conversations.id, có thể null nếu cuộc gọi
    > không dựa trên trò chuyện)

  - caller_id (FK đến users.id)

  - start_time (TIMESTAMP)

  - end_time (TIMESTAMP, có thể null)

  - duration_seconds (INT)

  - status (ENUM(\'INITIATED\', \'ANSWERED\', \'MISSED\', \'ENDED\'))

  - ^27^

- **Bảng call_participants:** Theo dõi những người dùng nào đã tham gia
  > vào cuộc gọi nào.

  - id (PK, BIGINT, AUTO_INCREMENT)

  - call_log_id (FK đến call_logs.id)

  - user_id (FK đến users.id)

  - join_time (TIMESTAMP)

  - leave_time (TIMESTAMP, có thể null)

  - ^27^

Vấn đề theo dõi trạng thái \"đã đọc\" trong các cuộc trò chuyện nhóm là
một thách thức phổ biến. Một phương pháp đơn giản như sử dụng một cột
status duy nhất trên bảng messages chỉ hoạt động cho các cuộc trò chuyện
1-1 và không thể mở rộng cho các nhóm.^18^ Trong một cuộc trò chuyện
nhóm với N thành viên, một tin nhắn duy nhất có N-1 người nhận tiềm
năng, và mỗi người sẽ nhận và đọc tin nhắn vào những thời điểm khác
nhau. Do đó, việc theo dõi trạng thái phải được thực hiện trên cơ sở mỗi
người dùng, mỗi tin nhắn.

Giải pháp tối ưu và có khả năng mở rộng cao trong cơ sở dữ liệu quan hệ
là sử dụng một bảng chuyên dụng message_receipts. Khi một tin nhắn được
gửi, không có bản ghi nào được tạo trong bảng này. Khi client của người
nhận xác nhận đã nhận được tin nhắn (delivered), nó sẽ thông báo cho máy
chủ, máy chủ sẽ chèn một hàng (message_id, user_id, \'DELIVERED\'). Khi
người dùng đọc tin nhắn, hàng đó sẽ được cập nhật thành status =
\'READ\'. Mặc dù cách tiếp cận này có vẻ nặng về ghi, nhưng các thao tác
ghi này nhỏ, được đánh chỉ mục và phân tán, điều mà các cơ sở dữ liệu
quan hệ xử lý rất hiệu quả. Nó tránh được các giới hạn về kích thước tài
liệu và xung đột cập nhật thường thấy trong các giải pháp NoSQL.^24^ Do
đó, việc triển khai bảng message_receipts được coi là giải pháp mạnh mẽ
nhất để thực hiện tính năng trạng thái đã đọc trong một ứng dụng trò
chuyện hiện đại.

### 2.3. Script SQL CREATE TABLE {#script-sql-create-table}

Phần này cung cấp các script SQL Data Definition Language (DDL) hoàn
chỉnh, sẵn sàng để sao chép và sử dụng để tạo toàn bộ lược đồ cơ sở dữ
liệu trong MySQL. Các script này bao gồm định nghĩa bảng, khóa chính,
ràng buộc khóa ngoại với các mệnh đề ON DELETE thích hợp, và các chỉ mục
(indexes) cho các cột quan trọng về hiệu suất như conversation_id và
sent_at.^19^

> SQL

\-- Bảng users  
CREATE TABLE users (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
username VARCHAR(255) NOT NULL UNIQUE,  
password_hash VARCHAR(255) NOT NULL,  
display_name VARCHAR(255),  
avatar_url VARCHAR(255),  
status ENUM(\'ONLINE\', \'OFFLINE\', \'AWAY\') DEFAULT \'OFFLINE\',  
last_seen TIMESTAMP,  
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP  
);  
  
\-- Bảng conversations  
CREATE TABLE conversations (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
type ENUM(\'PRIVATE\', \'GROUP\') NOT NULL,  
group_name VARCHAR(255),  
group_avatar_url VARCHAR(255),  
created_by BIGINT,  
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,  
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL  
);  
  
\-- Bảng conversation_participants  
CREATE TABLE conversation_participants (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
conversation_id BIGINT NOT NULL,  
user_id BIGINT NOT NULL,  
role ENUM(\'ADMIN\', \'MEMBER\') DEFAULT \'MEMBER\',  
joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
UNIQUE (conversation_id, user_id),  
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE
CASCADE,  
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE  
);  
  
\-- Bảng messages  
CREATE TABLE messages (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
conversation_id BIGINT NOT NULL,  
sender_id BIGINT,  
content TEXT,  
message_type ENUM(\'TEXT\', \'IMAGE\', \'VIDEO\', \'SYSTEM\') DEFAULT
\'TEXT\',  
sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE
CASCADE,  
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,  
INDEX (conversation_id),  
INDEX (sent_at)  
);  
  
\-- Bảng message_receipts  
CREATE TABLE message_receipts (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
message_id BIGINT NOT NULL,  
user_id BIGINT NOT NULL,  
conversation_id BIGINT NOT NULL,  
status ENUM(\'SENT\', \'DELIVERED\', \'READ\') NOT NULL,  
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,  
UNIQUE (message_id, user_id),  
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,  
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,  
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE
CASCADE  
);  
  
\-- Bảng call_logs  
CREATE TABLE call_logs (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
conversation_id BIGINT,  
caller_id BIGINT,  
start_time TIMESTAMP NOT NULL,  
end_time TIMESTAMP,  
duration_seconds INT,  
status ENUM(\'INITIATED\', \'ANSWERED\', \'MISSED\', \'ENDED\',
\'DECLINED\') NOT NULL,  
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET
NULL,  
FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE SET NULL  
);  
  
\-- Bảng call_participants  
CREATE TABLE call_participants (  
id BIGINT AUTO_INCREMENT PRIMARY KEY,  
call_log_id BIGINT NOT NULL,  
user_id BIGINT NOT NULL,  
join_time TIMESTAMP,  
leave_time TIMESTAMP,  
FOREIGN KEY (call_log_id) REFERENCES call_logs(id) ON DELETE CASCADE,  
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE  
);

## Phần III: Triển khai Backend: Sức mạnh của Spring Boot

Phần này đi sâu vào việc xây dựng ứng dụng phía máy chủ, với các ví dụ
mã chi tiết và giải thích cho từng thành phần chính.

### 3.1. Khởi tạo Dự án và các Dependency Cốt lõi (pom.xml) {#khởi-tạo-dự-án-và-các-dependency-cốt-lõi-pom.xml}

Hướng dẫn từng bước sử dụng Spring Initializr (start.spring.io) để tạo
cấu trúc dự án.^9^ Một bảng chi tiết các dependency Maven cần thiết và
mục đích của chúng sẽ được bao gồm.

| **Nhóm Dependency**      | **Artifact ID**                   | **Mục đích**                                         |
|--------------------------|-----------------------------------|------------------------------------------------------|
| org.springframework.boot | spring-boot-starter-web           | Dành cho việc xây dựng các RESTful API.^9^           |
| org.springframework.boot | spring-boot-starter-data-jpa      | Dành cho việc lưu trữ dữ liệu với JPA/Hibernate.^29^ |
| org.springframework.boot | spring-boot-starter-websocket     | Dependency cốt lõi cho hỗ trợ WebSocket và STOMP.^9^ |
| org.springframework.boot | spring-boot-starter-security      | Dành cho việc triển khai xác thực và phân quyền.^5^  |
| mysql                    | mysql-connector-j                 | Trình điều khiển JDBC cho MySQL.^30^                 |
| io.jsonwebtoken          | jjwt-api, jjwt-impl, jjwt-jackson | Dành cho việc tạo và phân tích cú pháp JWT.^12^      |
| io.agora.rtc             | server-sdk (hoặc tương tự)        | SDK Java của Agora để tạo token.^31^                 |

### 3.2. Xây dựng Lớp RESTful API (Spring Data JPA) {#xây-dựng-lớp-restful-api-spring-data-jpa}

- **Entities:** Định nghĩa các thực thể JPA (@Entity) ánh xạ trực tiếp
  > đến các bảng cơ sở dữ liệu đã được định nghĩa trong Phần II.^6^

- **Repositories:** Tạo các giao diện repository kế thừa từ
  > JpaRepository để có được chức năng CRUD đầy đủ mà không cần viết
  > mã.^30^

- **Services:** Triển khai lớp logic nghiệp vụ (@Service) để đóng gói
  > các hoạt động (ví dụ: createConversation, getMessagesForUser).

- **Controllers:** Tạo các bộ điều khiển REST (@RestController) để phơi
  > bày các điểm cuối cho quản lý người dùng, lịch sử cuộc trò chuyện,
  > v.v..^30^

### 3.3. Triển khai Trò chuyện Thời gian thực với WebSockets {#triển-khai-trò-chuyện-thời-gian-thực-với-websockets}

- **Cấu hình WebSocket:** Hướng dẫn chi tiết về tệp
  > WebSocketConfig.java.

  - Sử dụng chú thích @Configuration và
    > @EnableWebSocketMessageBroker.^9^

  - Cấu hình message broker (configureMessageBroker) để định nghĩa các
    > tiền tố đích của ứng dụng (/app) và các đích của broker (/topic,
    > /queue).^9^

  - Đăng ký điểm cuối STOMP (registerStompEndpoints) tại /ws, cho phép
    > CORS và thêm SockJS làm phương án dự phòng cho các trình duyệt cũ
    > hơn.^9^

- **Mô hình Tin nhắn:** Tạo các POJO (Plain Old Java Objects) cho các
  > tin nhắn trò chuyện (ví dụ: ChatMessage) sẽ được tuần tự hóa
  > thành/từ JSON.^10^

- **Bộ điều khiển WebSocket:**

  - Tạo một bộ điều khiển với các chú thích @MessageMapping để xử lý các
    > tin nhắn được gửi từ client đến các đích như
    > /app/chat.sendMessage.^13^

  - Sử dụng @Payload để liên kết nội dung tin nhắn đến đối tượng
    > ChatMessage.

  - Tiêm (inject) SimpMessagingTemplate để gửi tin nhắn trở lại cho
    > client.^13^

- **Logic Định tuyến Tin nhắn:**

  - **Trò chuyện nhóm:** Sử dụng
    > messagingTemplate.convertAndSend(\"/topic/conversations/{conversationId}\",
    > message) để phát tin nhắn đến tất cả những người đăng ký một chủ
    > đề nhóm.^13^

  - **Trò chuyện riêng tư:** Sử dụng
    > messagingTemplate.convertAndSendToUser(\"{recipientUsername}\",
    > \"/queue/private\", message) để gửi tin nhắn đến hàng đợi riêng
    > của một người dùng cụ thể. Đây là lúc việc xác thực WebSocket trở
    > nên cực kỳ quan trọng.^13^

### 3.4. Bảo mật Ứng dụng với JWT {#bảo-mật-ứng-dụng-với-jwt}

- **Cấu hình Spring Security:** Hướng dẫn từng bước để thiết lập bean
  > SecurityFilterChain. Điều này bao gồm việc cấu hình CORS, vô hiệu
  > hóa CSRF (cho các API không trạng thái) và định nghĩa các điểm cuối
  > nào là công khai (/api/auth/\*\*) và điểm cuối nào được bảo mật.^12^

- **Dịch vụ Tiện ích JWT:** Tạo một lớp JwtUtil chịu trách nhiệm tạo
  > token khi đăng nhập thành công, và phân tích/xác thực token từ các
  > yêu cầu đến.^12^

- **UserDetailsService:** Triển khai giao diện này để tải chi tiết người
  > dùng từ cơ sở dữ liệu để xác thực.^12^

- **JwtTokenFilter:** Một bộ lọc tùy chỉnh chạy một lần cho mỗi yêu cầu.
  > Nó trích xuất JWT từ tiêu đề Authorization, xác thực nó và đặt đối
  > tượng Authentication trong SecurityContextHolder nếu token hợp lệ.
  > Điều này bảo mật tất cả các điểm cuối REST.^12^

- **Xác thực WebSocket (JwtHandshakeInterceptor):**

  - Triển khai một HandshakeInterceptor để chặn yêu cầu kết nối
    > WebSocket *trước khi* quá trình bắt tay hoàn tất.^13^

  - Interceptor sẽ đọc JWT từ một tham số truy vấn hoặc tiêu đề, xác
    > thực nó bằng JwtUtil và lấy danh tính của người dùng.

  - Sau đó, nó sẽ đặt đối tượng Principal đã được xác thực của người
    > dùng vào các thuộc tính của phiên WebSocket. Đây là bước quan
    > trọng liên kết kết nối WebSocket với một người dùng cụ thể, đã
    > được xác thực.^13^

Khả năng gửi tin nhắn đến người dùng cụ thể là kết quả trực tiếp của
việc xác thực thành công phiên WebSocket ở giai đoạn bắt tay. Máy chủ
cần một cách để ánh xạ một \"người dùng\" (ví dụ: tên người dùng
\'john_doe\') với một kết nối/phiên WebSocket đang hoạt động cụ thể. Ánh
xạ này không thể dựa trên sự tin tưởng mà phải được xác minh bằng mật
mã. JwtHandshakeInterceptor thực hiện việc xác minh này tại thời điểm
kết nối bằng cách xác thực JWT.^13^ Sau khi xác thực thành công, nó liên
kết Principal đã được xác thực của người dùng với phiên WebSocket đó.
Sau này, khi messagingTemplate.convertAndSendToUser(\"john_doe\",\...)
được gọi, message broker của Spring sẽ tra cứu phiên được liên kết với
Principal có tên \"john_doe\" và chỉ gửi tin nhắn đến phiên đó.^13^ Mối
quan hệ nhân quả này là nền tảng trong việc xây dựng chức năng trò
chuyện riêng tư và an toàn.

### 3.5. Triển khai Máy chủ Token Agora {#triển-khai-máy-chủ-token-agora}

- **Dependency SDK Agora:** Thêm thư viện trình tạo token Agora cho Java
  > vào pom.xml. Dependency chính xác có thể thay đổi, nhưng nó sẽ được
  > lấy từ Maven Central.^31^

- **Dịch vụ Tạo Token:** Tạo một AgoraTokenService đóng gói logic để tạo
  > token RTC (Real-Time Communication).

- **Điểm cuối REST:** Phơi bày một điểm cuối REST an toàn (ví dụ: POST
  > /api/calls/token) chấp nhận channelName và userId.

- **Logic Triển khai:** Điểm cuối sẽ sử dụng lớp RtcTokenBuilder2 của
  > Agora (hoặc lớp tương tự) để tạo token. Các tham số chính sẽ là
  > appId, appCertificate (được lưu trữ an toàn dưới dạng biến môi
  > trường), channelName được yêu cầu, ID của người dùng đã được xác
  > thực và thời gian hết hạn.^37^ Token này sau đó được trả về cho
  > client.

## Phần IV: Triển khai Frontend: Client React Native

Phần này sẽ hướng dẫn nhà phát triển xây dựng client di động, tập trung
vào các phương pháp hiện đại để quản lý trạng thái và xử lý dữ liệu thời
gian thực.

### 4.1. Thiết lập Dự án và Điều hướng {#thiết-lập-dự-án-và-điều-hướng}

- Khởi tạo một dự án React Native mới bằng React Native CLI.^41^

- Cài đặt và cấu hình React Navigation để quản lý màn hình (ví dụ:
  > StackNavigator để điều hướng giữa danh sách cuộc trò chuyện, màn
  > hình trò chuyện và màn hình gọi video).^41^

### 4.2. Phát triển UI và Thư viện Component {#phát-triển-ui-và-thư-viện-component}

Việc lựa chọn một thư viện UI phù hợp có thể đẩy nhanh đáng kể quá trình
phát triển. Dưới đây là so sánh một số lựa chọn phổ biến:

| **Thư viện**                 | **Tính năng chính**                                                                                                       | **Phù hợp nhất cho**                                                     |
|------------------------------|---------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| **React Native Gifted Chat** | Một thành phần UI trò chuyện hoàn chỉnh, được xây dựng sẵn với thanh công cụ nhập liệu, bong bóng chat, avatar, v.v..^43^ | Xây dựng nhanh một giao diện trò chuyện tiêu chuẩn.^44^                  |
| **CometChat UI Kit**         | Các thành phần mô-đun, cấp doanh nghiệp (Cuộc trò chuyện, Tin nhắn) với logic nghiệp vụ tích hợp sẵn.^45^                 | Các đội cần khả năng tùy biến cao với logic nghiệp vụ được xây dựng sẵn. |
| **React Native Paper**       | Các thành phần theo Material Design, có khả năng tùy biến giao diện cao.^43^                                              | Các ứng dụng cần tuân thủ nhất quán các nguyên tắc Material Design.      |
| **UI Kitten**                | Dựa trên Eva Design System, với khả năng chuyển đổi chủ đề trong thời gian chạy (chế độ sáng/tối).^46^                    | Các ứng dụng dựa trên hệ thống thiết kế với trọng tâm là chủ đề.         |

Hướng dẫn này sẽ sử dụng **React Native Gifted Chat** vì tính đơn giản
và đầy đủ tính năng của nó, cung cấp các ví dụ mã cho việc thiết lập cơ
bản với các props messages, onSend, và user.^44^

### 4.3. Quản lý Trạng thái Phía Client với TanStack Query {#quản-lý-trạng-thái-phía-client-với-tanstack-query}

- **Thiết lập:** Bọc gốc của ứng dụng bằng QueryClientProvider để làm
  > cho query client có sẵn trong toàn bộ ứng dụng.^47^

- **useQuery để Lấy Dữ liệu:**

  - Lấy danh sách các cuộc trò chuyện của người dùng: useQuery({
    > queryKey: \[\'conversations\'\], queryFn: fetchConversations }).

  - Lấy tin nhắn cho một cuộc trò chuyện cụ thể: useQuery({ queryKey:
    > \[\'messages\', conversationId\], queryFn: () =\>
    > fetchMessages(conversationId) }). Sự phụ thuộc của khóa truy vấn
    > vào conversationId sẽ tự động kích hoạt việc lấy lại dữ liệu khi
    > người dùng chuyển đổi cuộc trò chuyện.^49^

- **useMutation để Sửa đổi Dữ liệu:**

  - Triển khai một mutation để gửi một tin nhắn mới.

  - Callback onSuccess sẽ được sử dụng để vô hiệu hóa truy vấn
    > \[\'messages\', conversationId\], kích hoạt việc lấy lại dữ liệu
    > để hiển thị tin nhắn mới.

  - Một phần nâng cao sẽ đề cập đến **cập nhật lạc quan (optimistic
    > updates)**: cập nhật bộ đệm cục bộ ngay lập tức *trước khi* yêu
    > cầu mạng hoàn tất, và hoàn tác nếu thất bại. Điều này cung cấp một
    > trải nghiệm UI nhanh nhạy, tức thì.^49^

- **Đặc thù của React Native:** Cấu hình TanStack Query cho môi trường
  > di động, bao gồm việc lấy lại dữ liệu khi ứng dụng được focus
  > (AppState) và màn hình được focus (useFocusEffect từ React
  > Navigation).^51^

### 4.4. Tích hợp Thời gian thực với STOMP và TanStack Query {#tích-hợp-thời-gian-thực-với-stomp-và-tanstack-query}

- **Kết nối đến WebSocket:**

  - Cài đặt @stomp/stompjs và sockjs-client.^52^

  - Tạo một hook hoặc context có thể tái sử dụng (WebSocketProvider) để
    > quản lý vòng đời của client STOMP (kết nối, ngắt kết nối, đăng
    > ký).

  - Logic kết nối sẽ bao gồm việc truyền JWT của người dùng trong các
    > tiêu đề kết nối để xác thực bởi HandshakeInterceptor của
    > backend.^53^

- **Đăng ký Chủ đề:**

  - Khi vào màn hình trò chuyện nhóm, đăng ký
    > /topic/conversations/{conversationId}.

  - Đối với tin nhắn riêng tư, đăng ký hàng đợi dành riêng cho người
    > dùng, ví dụ: /user/queue/private.

- **Tích hợp Cập nhật Thời gian thực với Bộ đệm:**

  - Đây là một phần quan trọng. Khi một tin nhắn mới đến từ việc đăng ký
    > WebSocket, thay vì sử dụng useState, mã sẽ cập nhật trực tiếp bộ
    > đệm của TanStack Query.

  - Ví dụ: queryClient.setQueryData(\[\'messages\', conversationId\],
    > (oldData) =\>). Điều này tận dụng TanStack Query làm nguồn sự thật
    > duy nhất cho trạng thái máy chủ, đảm bảo tính nhất quán và ngăn
    > chặn các tình huống chạy đua (race conditions).^49^

Việc sử dụng TanStack Query làm \"hệ thần kinh trung ương\" cho trạng
thái máy chủ là một mẫu kiến trúc mạnh mẽ. Một ứng dụng trò chuyện có
hai nguồn thay đổi trạng thái máy chủ: các hành động do người dùng khởi
xướng (lấy lịch sử qua useQuery, gửi tin nhắn qua useMutation) và các sự
kiện do máy chủ đẩy (một tin nhắn mới đến qua WebSocket). Nếu hai nguồn
này cập nhật các biến trạng thái khác nhau, trạng thái UI có thể trở nên
không nhất quán. Mẫu hình chuyên gia là coi bộ đệm của TanStack Query là
*nguồn sự thật duy nhất* cho tất cả dữ liệu liên quan đến máy chủ. Điều
này có nghĩa là khi WebSocket nhận được một tin nhắn mới, hàm xử lý của
nó không nên gọi setMessages, mà thay vào đó nên gọi
queryClient.setQueryData(\...), chèn tin nhắn mới vào dữ liệu đã được
lưu trong bộ đệm. Vì UI đã đăng ký với hook useQuery, nó sẽ tự động và
phản ứng lại để hiển thị tin nhắn mới mà không cần lấy lại dữ liệu từ
mạng.

### 4.5. Triển khai Gọi video với Agora {#triển-khai-gọi-video-với-agora}

- **Cài đặt SDK:** Cài đặt SDK react-native-agora và cấu hình các quyền
  > truy cập gốc cho máy ảnh và micro trong AndroidManifest.xml và
  > Info.plist.^54^

- **UI Gọi video:** Xây dựng một thành phần VideoCallScreen sử dụng
  > RtcLocalView và RtcRemoteView của Agora để hiển thị các luồng
  > video.^54^ Thêm các điều khiển UI để tắt tiếng, tắt video và kết
  > thúc cuộc gọi.

- **Luồng Hoạt động Hoàn chỉnh (Hướng dẫn qua mã):**

  1.  Người dùng nhấn nút \"gọi video\".

  2.  Ứng dụng thực hiện một cuộc gọi API đã được xác thực đến điểm cuối
      > /api/calls/token của backend Spring Boot, yêu cầu một token cho
      > một tên kênh cụ thể (ví dụ: ID cuộc trò chuyện).

  3.  Backend xác thực JWT của người dùng và trả về một token Agora mới
      > được tạo.^39^

  4.  Client React Native khởi tạo engine Agora với App ID.^55^

  5.  Client gọi engine.joinChannel(token, channelName,\...) sử dụng
      > token đã lấy để tham gia kênh gọi video một cách an toàn.^39^

  6.  Các trình xử lý sự kiện (onUserJoined, onUserOffline) được sử dụng
      > để quản lý việc người dùng từ xa tham gia hoặc rời khỏi cuộc
      > gọi.

## Phần V: Các Tính năng Nâng cao và Tích hợp

Phần này bao gồm các tính năng cần thiết cho một ứng dụng trò chuyện
hiện đại nhưng đòi hỏi sự tích hợp với các dịch vụ bổ sung.

### 5.1. Triển khai Thông báo Đẩy với FCM {#triển-khai-thông-báo-đẩy-với-fcm}

- **Thiết lập Firebase:** Tạo một dự án Firebase và cấu hình nó cho
  > Android và iOS.^57^

- **Phía Client (React Native):**

  - Sử dụng @react-native-firebase/messaging để yêu cầu quyền và lấy
    > token FCM của thiết bị.^58^

  - Gửi token này đến backend Spring Boot để được lưu trữ và liên kết
    > với người dùng (ví dụ: trong bảng users hoặc một bảng devices
    > chuyên dụng).

  - Thiết lập các trình lắng nghe cho các thông báo ở nền trước và nền
    > sau.^58^

- **Phía Backend (Spring Boot):**

  - Thêm dependency Firebase Admin SDK.

  - Cấu hình SDK với thông tin xác thực tài khoản dịch vụ.^3^

  - Tạo một PushNotificationService mà khi một người dùng ngoại tuyến và
    > nhận được tin nhắn, sẽ lấy token FCM của họ từ cơ sở dữ liệu và
    > gửi một payload thông báo qua Firebase Admin SDK.^3^

### 5.2. Xử lý Tải lên Media và Tệp {#xử-lý-tải-lên-media-và-tệp}

- **Điểm cuối Backend (Spring Boot):**

  - Tạo một điểm cuối @PostMapping chấp nhận MultipartFile.^60^

  - Lớp dịch vụ sẽ chịu trách nhiệm lưu tệp vào một giải pháp lưu trữ
    > (ví dụ: đĩa cục bộ để đơn giản, hoặc Amazon S3 cho môi trường sản
    > xuất) và tạo một mục tương ứng trong bảng messages với
    > message_type = \'IMAGE\' và URL của tệp trong trường content.

- **Phía Client (React Native):**

  - Sử dụng một thư viện như react-native-image-picker để cho phép người
    > dùng chọn một hình ảnh từ thư viện hoặc máy ảnh của họ.^62^

  - Xây dựng một đối tượng FormData với hình ảnh đã chọn và gửi nó đến
    > điểm cuối multipart của backend bằng fetch hoặc axios.^63^

## Phần VI: Triển khai và Phân phối

Phần cuối cùng cung cấp các hướng dẫn thực tế, từng bước để đưa ứng dụng
đến tay người dùng.

### 6.1. Triển khai Backend Spring Boot lên AWS EC2 {#triển-khai-backend-spring-boot-lên-aws-ec2}

- **Đóng gói:** Xây dựng ứng dụng Spring Boot thành một tệp JAR có thể
  > thực thi bằng Maven (mvn clean package).^65^

- **Thiết lập Phiên bản EC2:**

  - Khởi chạy một phiên bản EC2 mới (ví dụ: Ubuntu) trên AWS.^66^

  - Cấu hình các nhóm bảo mật để mở các cổng cần thiết (22 cho SSH,
    > 80/443 cho HTTP/S, 8080 cho ứng dụng).^65^

  - Kết nối đến phiên bản qua SSH và cài đặt Java.^66^

- **Triển khai:**

  - Chuyển tệp JAR đến phiên bản EC2 bằng SCP (Secure Copy).^68^

  - Chạy ứng dụng ở chế độ nền bằng nohup java -jar your-app.jar &. Để
    > có một thiết lập sản xuất mạnh mẽ hơn, hãy tạo một tệp dịch vụ
    > systemd để quản lý quy trình ứng dụng và cho phép tự động khởi
    > động lại khi có lỗi hoặc khi máy chủ khởi động lại.^65^

- **Reverse Proxy (Nginx):** Thiết lập Nginx làm reverse proxy để chuyển
  > tiếp các yêu cầu từ cổng tiêu chuẩn 80 đến ứng dụng Spring Boot đang
  > chạy trên cổng 8080. Đây là một thực hành sản xuất tiêu chuẩn.^66^

### 6.2. Xuất bản Ứng dụng React Native {#xuất-bản-ứng-dụng-react-native}

- **Google Play Store (Android):**

  1.  **Tạo Khóa Tải lên:** Sử dụng keytool để tạo một kho khóa ký.^69^

  2.  **Cấu hình Gradle:** Thêm thông tin kho khóa vào gradle.properties
      > và cấu hình signingConfigs trong build.gradle.^69^

  3.  **Xây dựng Bản phát hành AAB:** Chạy cd android &&./gradlew
      > bundleRelease để tạo Android App Bundle (AAB).^69^

  4.  **Xuất bản:** Tạo một danh sách ứng dụng trong Google Play
      > Console, tải lên tệp AAB, điền thông tin cửa hàng và gửi để xem
      > xét.^70^

- **Apple App Store (iOS):**

  1.  **Chương trình Nhà phát triển Apple:** Đăng ký chương trình và
      > thiết lập App ID và chứng chỉ trong cổng thông tin nhà phát
      > triển.^72^

  2.  **Cấu hình Xcode:** Mở tệp .xcworkspace của dự án, đặt đúng nhóm
      > và cấu hình định danh gói.^72^

  3.  **Cấu hình Lược đồ Phát hành:** Đảm bảo lược đồ xây dựng được đặt
      > thành Release.^73^

  4.  **Lưu trữ:** Sử dụng Xcode để lưu trữ ứng dụng (Product -\>
      > Archive).^73^

  5.  **Tải lên và Gửi:** Sử dụng Xcode Organizer hoặc ứng dụng
      > Transporter để tải lên bản lưu trữ lên App Store Connect. Sau
      > đó, hoàn thành danh sách ứng dụng, chọn bản dựng và gửi để xem
      > xét.^72^

## Kết luận

Việc xây dựng một ứng dụng phức tạp như Zalo đòi hỏi một kiến trúc được
cân nhắc kỹ lưỡng, kết hợp các công nghệ mạnh mẽ một cách liền mạch.
Bằng cách tuân theo hướng dẫn này, các nhóm phát triển có thể tận dụng
sức mạnh của Spring Boot cho một backend có khả năng mở rộng, React
Native cho một trải nghiệm người dùng đa nền tảng linh hoạt, và các dịch
vụ hàng đầu như Agora cho giao tiếp thời gian thực.

Các quyết định kiến trúc quan trọng, chẳng hạn như áp dụng mô hình bảo
mật JWT thống nhất cho cả REST và WebSockets, triển khai một lược đồ cơ
sở dữ liệu quan hệ mạnh mẽ với một bảng message_receipts chuyên dụng, và
sử dụng TanStack Query làm nguồn sự thật duy nhất cho trạng thái máy chủ
phía client, là nền tảng để tạo ra một ứng dụng đáng tin cậy, hiệu suất
cao và có thể bảo trì. Tài liệu này cung cấp một lộ trình toàn diện,
không chỉ về \"cách làm\" mà còn về \"tại sao\", trang bị cho các nhà
phát triển kiến thức để xây dựng một giải pháp trò chuyện và gọi video
cấp sản xuất, sẵn sàng cho sự phát triển trong tương lai.