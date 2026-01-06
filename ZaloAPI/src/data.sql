use zalo_db;

INSERT INTO users (
    id,
    avatar_url,
    bio,
    created_at,
    date_of_birth,
    display_name,
    gender,
    is_blocked,
    is_phone_verified,
    last_seen,
    password_hash,
    phone_number,
    role,
    status,
    updated_at,
    username
) VALUES
      (
          1,
          'https://i.pravatar.cc/300?img=11',
          'Thích code đêm và cà phê sữa.',
          '2026-01-01 08:12:45',
          '2005-08-12',
          'Minh Anh',
          'MALE',
          false,
          true,
          '2026-01-05 22:10:00',
          'Duong123@',
          '+84963124578',
          'USER',
          'ONLINE',
          '2026-01-05 22:15:30',
          'minhanh01'
      ),
      (
          2,
          'https://i.pravatar.cc/300?img=32',
          'Gọn gàng, thích checklist.',
          '2026-01-02 07:35:20',
          '2006-03-25',
          'Thu Trang',
          'FEMALE',
          false,
          true,
          '2026-01-06 07:30:00',
          'Duong123@',
          '+84869257566',
          'USER',
          'OFFLINE',
          '2026-01-06 07:45:10',
          'thutrang'
      ),
      (
          3,
          'https://i.pravatar.cc/300?img=12',
          'Thích chụp ảnh và đi bộ đêm.',
          '2026-01-03 18:05:00',
          '2007-11-04',
          'Hoàng Long',
          'MALE',
          false,
          true,
          '2026-01-06 06:50:00',
          'Duong123@',
          '+84981233456',
          'USER',
          'OFFLINE',
          '2026-01-06 07:10:00',
          'hoanglong'
      ),
      (
          4,
          'https://i.pravatar.cc/300?img=5',
          'Nghe nhạc lofi cả ngày.',
          '2026-01-01 13:22:10',
          '2005-01-19',
          'Ngọc Hà',
          'FEMALE',
          false,
          true,
          '2026-01-04 21:40:00',
          'Duong123@',
          '+84903456721',
          'USER',
          'ONLINE',
          '2026-01-04 22:05:10',
          'ngocha05'
      ),
      (
          5,
          'https://i.pravatar.cc/300?img=18',
          'Ít nói nhưng rep nhanh.',
          '2026-01-02 10:08:33',
          '2008-06-03',
          'Đức Mạnh',
          'MALE',
          false,
          true,
          '2026-01-06 07:05:00',
          'Duong123@',
          '+84838811223',
          'USER',
          'OFFLINE',
          '2026-01-06 07:20:30',
          'ducmanh08'
      ),
      (
          6,
          'https://i.pravatar.cc/300?img=24',
          'Thích đọc truyện và xem phim.',
          '2026-01-03 09:45:12',
          '2007-02-14',
          'Khánh Linh',
          'FEMALE',
          false,
          true,
          '2026-01-05 19:12:00',
          'Duong123@',
          '+84916789012',
          'USER',
          'ONLINE',
          '2026-01-05 19:18:44',
          'khanhlinh07'
      ),
      (
          7,
          'https://i.pravatar.cc/300?img=41',
          'Không drama, chỉ chill.',
          '2026-01-04 16:20:05',
          '2006-12-09',
          'Quang Huy',
          'MALE',
          false,
          true,
          '2026-01-06 06:10:00',
          'Duong123@',
          '+84952345678',
          'USER',
          'OFFLINE',
          '2026-01-06 06:15:22',
          'quanghuy06'
      ),
      (
          8,
          'https://i.pravatar.cc/300?img=47',
          'Thích đi cà phê cuối tuần.',
          '2026-01-02 21:11:40',
          '2009-09-21',
          'Mai Phương',
          'FEMALE',
          false,
          true,
          '2026-01-05 23:55:00',
          'Duong123@',
          '+84896543210',
          'USER',
          'OFFLINE',
          '2026-01-06 00:05:30',
          'maiphuong09'
      ),
      (
          9,
          'https://i.pravatar.cc/300?img=27',
          'Đam mê bóng đá và gym nhẹ.',
          '2026-01-01 17:33:28',
          '2005-10-30',
          'Tuấn Kiệt',
          'MALE',
          false,
          true,
          '2026-01-03 20:30:00',
          'Duong123@',
          '+84978112233',
          'USER',
          'ONLINE',
          '2026-01-03 20:40:12',
          'tuankiet05'
      ),
      (
          10,
          'https://i.pravatar.cc/300?img=36',
          'Thích mèo, ghét ồn ào.',
          '2026-01-05 07:50:10',
          '2008-04-17',
          'Bảo Ngọc',
          'FEMALE',
          false,
          true,
          '2026-01-06 07:55:00',
          'Duong123@',
          '+84812345067',
          'USER',
          'ONLINE',
          '2026-01-06 07:59:10',
          'baongoc08'
      ),
      (
          11,
          'https://i.pravatar.cc/300?img=52',
          'Ngủ sớm dậy sớm (thỉnh thoảng).',
          '2026-01-03 12:15:55',
          '2007-07-07',
          'Hải Nam',
          'MALE',
          false,
          true,
          '2026-01-05 08:10:00',
          'Duong123@',
          '+84911223344',
          'USER',
          'OFFLINE',
          '2026-01-05 08:12:30',
          'hainam07'
      ),
      (
          12,
          'https://i.pravatar.cc/300?img=58',
          'Thích chụp đồ ăn trước khi ăn.',
          '2026-01-02 08:40:03',
          '2006-05-28',
          'Lan Chi',
          'FEMALE',
          false,
          true,
          '2026-01-04 09:05:00',
          'Duong123@',
          '+84877788999',
          'USER',
          'OFFLINE',
          '2026-01-04 09:10:10',
          'lanchi06'
      ),
      (
          13,
          'https://i.pravatar.cc/300?img=63',
          'Đang học dev, đừng tag gấp 😵',
          '2026-01-04 10:02:19',
          '2009-01-05',
          'Gia Bảo',
          'MALE',
          false,
          true,
          '2026-01-06 05:45:00',
          'Duong123@',
          '+84966887755',
          'USER',
          'ONLINE',
          '2026-01-06 06:00:00',
          'giabao09'
      ),
      (
          14,
          'https://i.pravatar.cc/300?img=70',
          'Tối code, sáng ngủ bù.',
          '2026-01-05 18:22:41',
          '2008-12-02',
          'Phương Anh',
          'FEMALE',
          false,
          true,
          '2026-01-06 07:25:00',
          'Duong123@',
          '+84845678901',
          'USER',
          'ONLINE',
          '2026-01-06 07:35:20',
          'phuonganh08'
      ),
      (
          15,
          'https://i.pravatar.cc/300?img=15',
          'Thích đi bộ, thích yên tĩnh.',
          '2026-01-01 06:05:10',
          '2005-02-22',
          'Trung Hiếu',
          'MALE',
          false,
          true,
          '2026-01-02 23:10:00',
          'Duong123@',
          '+84934561234',
          'USER',
          'OFFLINE',
          '2026-01-02 23:12:40',
          'trunghieu05'
      );

INSERT INTO user_privacy_settings (
    user_id,
    allow_find_by_phone,
    allow_friend_request_from_strangers,
    show_phone_to_friends
) VALUES
      (1,  true, true, true),
      (2,  true, true, false),
      (3,  true, true, true),
      (4,  true, true, false),
      (5,  true, true, true),
      (6,  true, true, false),
      (7,  true, true, true),
      (8,  true, true, false),
      (9,  true, true, true),
      (10, true, true, false),
      (11, true, true, true),
      (12, true, true, false),
      (13, true, true, true),
      (14, true, true, false),
      (15, true, true, true);

INSERT INTO friend_requests (
    created_at,
    message,
    status,
    updated_at,
    sender_id,
    receiver_id
) VALUES
      ('2026-01-05 07:00:00', 'Kết bạn nhé', 'PENDING', '2026-01-05 07:00:00', 1, 3),
      ('2026-01-05 07:01:00', 'Xin add', 'PENDING', '2026-01-05 07:01:00', 2, 4),
      ('2026-01-05 07:02:00', 'Hello', 'PENDING', '2026-01-05 07:02:00', 3, 5),
      ('2026-01-05 07:03:00', 'Add friend', 'PENDING', '2026-01-05 07:03:00', 4, 6),
      ('2026-01-05 07:04:00', 'Kết bạn', 'PENDING', '2026-01-05 07:04:00', 5, 7),
      ('2026-01-05 07:05:00', 'Chào bạn', 'PENDING', '2026-01-05 07:05:00', 6, 8),
      ('2026-01-05 07:06:00', 'Xin làm quen', 'PENDING', '2026-01-05 07:06:00', 7, 9),
      ('2026-01-05 07:07:00', 'Hello', 'PENDING', '2026-01-05 07:07:00', 8, 10),
      ('2026-01-05 07:08:00', 'Add nhé', 'PENDING', '2026-01-05 07:08:00', 9, 11),
      ('2026-01-05 07:09:00', 'Kết nối', 'PENDING', '2026-01-05 07:09:00', 10, 12),
      ('2026-01-05 07:10:00', 'Xin add', 'PENDING', '2026-01-05 07:10:00', 11, 13),
      ('2026-01-05 07:11:00', 'Làm quen', 'PENDING', '2026-01-05 07:11:00', 12, 14),
      ('2026-01-05 07:12:00', 'Kết bạn', 'PENDING', '2026-01-05 07:12:00', 13, 15),
      ('2026-01-05 07:13:00', 'Hello', 'PENDING', '2026-01-05 07:13:00', 14, 1),
      ('2026-01-05 07:14:00', 'Xin kết bạn', 'PENDING', '2026-01-05 07:14:00', 15, 2);

INSERT INTO friend_requests (
    created_at,
    message,
    status,
    updated_at,
    sender_id,
    receiver_id
) VALUES
      ('2026-01-01 10:00:00', 'Kết bạn nhé', 'ACCEPTED', '2026-01-01 10:05:00', 1, 2),
      ('2026-01-01 10:10:00', 'Làm quen nha', 'ACCEPTED', '2026-01-01 10:15:00', 2, 3),
      ('2026-01-01 10:20:00', 'Xin add', 'ACCEPTED', '2026-01-01 10:25:00', 3, 4),
      ('2026-01-01 10:30:00', 'Kết nối nhé', 'ACCEPTED', '2026-01-01 10:35:00', 4, 5),
      ('2026-01-01 10:40:00', 'Hello', 'ACCEPTED', '2026-01-01 10:45:00', 5, 6),
      ('2026-01-02 11:00:00', 'Kết bạn', 'ACCEPTED', '2026-01-02 11:05:00', 6, 7),
      ('2026-01-02 11:10:00', 'Add friend', 'ACCEPTED', '2026-01-02 11:15:00', 7, 8),
      ('2026-01-02 11:20:00', 'Chào bạn', 'ACCEPTED', '2026-01-02 11:25:00', 8, 9),
      ('2026-01-02 11:30:00', 'Xin kết bạn', 'ACCEPTED', '2026-01-02 11:35:00', 9, 10),
      ('2026-01-03 12:00:00', 'Kết nối', 'ACCEPTED', '2026-01-03 12:05:00', 10, 11),
      ('2026-01-03 12:10:00', 'Hello', 'ACCEPTED', '2026-01-03 12:15:00', 11, 12),
      ('2026-01-03 12:20:00', 'Add nhé', 'ACCEPTED', '2026-01-03 12:25:00', 12, 13),
      ('2026-01-03 12:30:00', 'Làm quen', 'ACCEPTED', '2026-01-03 12:35:00', 13, 14),
      ('2026-01-04 13:00:00', 'Kết bạn', 'ACCEPTED', '2026-01-04 13:05:00', 14, 15),
      ('2026-01-04 13:10:00', 'Xin add', 'ACCEPTED', '2026-01-04 13:15:00', 15, 1);

INSERT INTO friendships (
    created_at,
    user1_id,
    user2_id
) VALUES
      ('2026-01-01 10:05:00', 1, 2),
      ('2026-01-01 10:15:00', 2, 3),
      ('2026-01-01 10:25:00', 3, 4),
      ('2026-01-01 10:35:00', 4, 5),
      ('2026-01-01 10:45:00', 5, 6),
      ('2026-01-02 11:05:00', 6, 7),
      ('2026-01-02 11:15:00', 7, 8),
      ('2026-01-02 11:25:00', 8, 9),
      ('2026-01-02 11:35:00', 9, 10),
      ('2026-01-03 12:05:00', 10, 11),
      ('2026-01-03 12:15:00', 11, 12),
      ('2026-01-03 12:25:00', 12, 13),
      ('2026-01-03 12:35:00', 13, 14),
      ('2026-01-04 13:05:00', 14, 15),
      ('2026-01-04 13:15:00', 15, 1);


INSERT INTO blocked_users (
    blocked_at,
    blocker_id,
    blocked_id
) VALUES
      ('2026-01-02 20:00:00', 1, 6),
      ('2026-01-02 20:05:00', 2, 7),
      ('2026-01-02 20:10:00', 3, 8),
      ('2026-01-02 20:15:00', 4, 9),
      ('2026-01-02 20:20:00', 5, 10),
      ('2026-01-03 21:00:00', 6, 11),
      ('2026-01-03 21:05:00', 7, 12),
      ('2026-01-03 21:10:00', 8, 13),
      ('2026-01-03 21:15:00', 9, 14),
      ('2026-01-03 21:20:00', 10, 15),
      ('2026-01-04 22:00:00', 11, 1),
      ('2026-01-04 22:05:00', 12, 2),
      ('2026-01-04 22:10:00', 13, 3),
      ('2026-01-04 22:15:00', 14, 4),
      ('2026-01-04 22:20:00', 15, 5);


INSERT INTO notifications (
    content,
    created_at,
    is_read,
    notification_type,
    related_entity_id,
    related_entity_type,
    title,
    user_id
) VALUES
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:02:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 3),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:03:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 4),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:04:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 5),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:05:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 6),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:06:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 7),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:07:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 8),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:08:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 9),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:09:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 10),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:10:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 11),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:11:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 12),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:12:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 13),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:13:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 14),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:14:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 15),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:15:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 1),
      ('Bạn có lời mời kết bạn mới', '2026-01-05 07:16:10', false, 'FRIEND_REQUEST', NULL, NULL, 'Lời mời kết bạn', 2);


# =================================================================
INSERT INTO posts (
    id,
    content,
    created_at,
    is_hidden,
    location,
    privacy_type,
    updated_at,
    author_id
) VALUES
      (1,  'Cuối tuần nhẹ nhàng ☕',              '2026-01-01 09:00:00', false, 'Hà Nội', 'PUBLIC',   '2026-01-01 09:00:00', 1),
      (2,  'Một ngày nhiều nắng',                '2026-01-01 10:10:00', false, null,     'FRIENDS',  '2026-01-01 10:10:00', 2),
      (3,  'Đi bộ tối nay khá chill',             '2026-01-01 11:20:00', false, null,     'PUBLIC',   '2026-01-01 11:20:00', 3),
      (4,  'Một chút ảnh hôm nay 📸',             '2026-01-01 14:00:00', false, 'Hà Nội', 'PUBLIC',   '2026-01-01 14:00:00', 4),
      (5,  'Test upload video',                  '2026-01-02 09:30:00', false, null,     'FRIENDS',  '2026-01-02 09:30:00', 5),
      (6,  'Cuộc sống chậm lại',                  '2026-01-02 11:00:00', false, null,     'PUBLIC',   '2026-01-02 11:00:00', 6),
      (7,  'Chuyện hôm nay',                      '2026-01-02 15:40:00', false, null,     'PUBLIC',   '2026-01-02 15:40:00', 7),
      (8,  'Video ngắn',                          '2026-01-03 08:50:00', false, null,     'FRIENDS',  '2026-01-03 08:50:00', 8),
      (9,  'Album nhỏ cuối ngày',                 '2026-01-03 17:30:00', false, null,     'PUBLIC',   '2026-01-03 17:30:00', 9),
      (10, 'Một chút suy nghĩ',                   '2026-01-03 19:10:00', false, null,     'PUBLIC',   '2026-01-03 19:10:00', 10),
      (11, 'Tối nay hơi mệt',                     '2026-01-04 09:00:00', false, null,     'FRIENDS',  '2026-01-04 09:00:00', 11),
      (12, 'Chia sẻ nhanh',                       '2026-01-04 10:20:00', false, null,     'PUBLIC',   '2026-01-04 10:20:00', 12),
      (13, 'Ngày mới bắt đầu',                    '2026-01-04 15:00:00', false, null,     'PUBLIC',   '2026-01-04 15:00:00', 13),
      (14, 'Ảnh cũ nhưng thích',                  '2026-01-05 07:00:00', false, null,     'FRIENDS',  '2026-01-05 07:00:00', 14),
      (15, 'Hôm nay ổn',                          '2026-01-05 07:30:00', false, null,     'PUBLIC',   '2026-01-05 07:30:00', 15),
      (16, 'Thử đăng thêm bài',                   '2026-01-02 16:00:00', false, null,     'PUBLIC',   '2026-01-02 16:00:00', 1),
      (17, 'Ảnh dạo phố',                         '2026-01-03 09:40:00', false, null,     'PUBLIC',   '2026-01-03 09:40:00', 2),
      (18, 'Video ngắn buổi tối',                 '2026-01-03 20:00:00', false, null,     'FRIENDS',  '2026-01-03 20:00:00', 3),
      (19, 'Cuối ngày',                           '2026-01-04 18:30:00', false, null,     'PUBLIC',   '2026-01-04 18:30:00', 4),
      (20, 'Một chút kỷ niệm',                    '2026-01-05 07:50:00', false, null,     'PUBLIC',   '2026-01-05 07:50:00', 5);

INSERT INTO post_media (post_id, media_url) VALUES
                                                (1, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1762265026/zalo_chat/images/ujquidnnldmfxiidtytt.jpg'),
                                                (2, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1762328402/zalo_chat/images/fypecxogsrfy4wxpi2wy.jpg'),
                                                (3, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1762419035/zalo_chat/images/blkq0wfity7q0ytu7n7f.jpg'),
                                                (4, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1762499421/zalo_chat/images/ta6nkmktgq9ockvgnhaj.jpg'),
                                                (4, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1762499432/zalo_chat/images/dpboq6ib79ixszj3zp5a.jpg'),
                                                (5, 'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762502810/zalo_chat/videos/hqkdleiqrslpjmkvbid5.mp4'),
                                                (6, 'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762503859/zalo_chat/videos/uasfnn8ffmjsnbl2fmre.mp4'),
                                                (8, 'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762850047/zalo_chat/videos/nqemghnrsaam4by6evbm.mp4'),
                                                (9, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1763089864/zalo_chat/images/zhyngh82kqln7otajgty.jpg'),
                                                (9, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1763089870/zalo_chat/images/it0fjlucipzhf1enyamx.jpg'),
                                                (9, 'https://res.cloudinary.com/dlz6sulzj/image/upload/v1763089875/zalo_chat/images/b7u7lufvqra8caboa0fx.jpg');

INSERT INTO post_media (post_id, media_url) VALUES
                                                (7,  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'),
                                                (10, 'https://images.unsplash.com/photo-1492724441997-5dc865305da7'),
                                                (11, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'),
                                                (12, 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e'),
                                                (13, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470'),
                                                (14, 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429'),
                                                (15, 'https://images.unsplash.com/photo-1491553895911-0055eca6402d'),
                                                (16, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'),
                                                (17, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d'),
                                                (18, 'https://images.unsplash.com/photo-1500534623283-312aade485b7'),
                                                (19, 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913'),
                                                (20, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee');

INSERT INTO comments (
    id,
    content,
    created_at,
    updated_at,
    author_id,
    parent_comment_id,
    post_id
) VALUES
-- user 1
(1, 'Bài này hay đó', '2026-01-02 10:00:00', '2026-01-02 10:00:00', 1, NULL, 2),
(2, 'Nhìn chill ghê', '2026-01-03 11:00:00', '2026-01-03 11:00:00', 1, NULL, 3),

-- user 2
(3, 'Ảnh đẹp thật', '2026-01-02 10:05:00', '2026-01-02 10:05:00', 2, NULL, 1),
(4, 'Xem mà thấy dễ chịu', '2026-01-03 11:05:00', '2026-01-03 11:05:00', 2, NULL, 4),

-- user 3
(5, 'Video mượt ghê', '2026-01-02 10:10:00', '2026-01-02 10:10:00', 3, NULL, 5),
(6, 'Góc này nhìn quen quen', '2026-01-03 11:10:00', '2026-01-03 11:10:00', 3, NULL, 6),

-- user 4
(7, 'Thích mấy bài kiểu này', '2026-01-02 10:15:00', '2026-01-02 10:15:00', 4, NULL, 7),
(8, 'Đúng kiểu mình thích', '2026-01-03 11:15:00', '2026-01-03 11:15:00', 4, NULL, 8),

-- user 5
(9, 'Xem xong thấy muốn đi chơi', '2026-01-02 10:20:00', '2026-01-02 10:20:00', 5, NULL, 9),
(10, 'Bài này ổn áp', '2026-01-03 11:20:00', '2026-01-03 11:20:00', 5, NULL, 10),

-- user 6
(11, 'Nhẹ nhàng ghê', '2026-01-02 10:25:00', '2026-01-02 10:25:00', 6, NULL, 11),
(12, 'Cảm giác rất thật', '2026-01-03 11:25:00', '2026-01-03 11:25:00', 6, NULL, 12),

-- user 7
(13, 'Xem là muốn đăng bài liền', '2026-01-02 10:30:00', '2026-01-02 10:30:00', 7, NULL, 13),
(14, 'Kiểu này mình thích', '2026-01-03 11:30:00', '2026-01-03 11:30:00', 7, NULL, 14),

-- user 8
(15, 'Video coi đã ghê', '2026-01-02 10:35:00', '2026-01-02 10:35:00', 8, NULL, 15),
(16, 'Nhìn rất có mood', '2026-01-03 11:35:00', '2026-01-03 11:35:00', 8, NULL, 16),

-- user 9
(17, 'Coi mà thấy thư giãn', '2026-01-02 10:40:00', '2026-01-02 10:40:00', 9, NULL, 17),
(18, 'Góc chụp đẹp đó', '2026-01-03 11:40:00', '2026-01-03 11:40:00', 9, NULL, 18),

-- user 10
(19, 'Xem cũng cuốn', '2026-01-02 10:45:00', '2026-01-02 10:45:00', 10, NULL, 19),
(20, 'Nhìn là thấy chill liền', '2026-01-03 11:45:00', '2026-01-03 11:45:00', 10, NULL, 20),

-- user 11
(21, 'Ảnh này hợp vibe ghê', '2026-01-02 10:50:00', '2026-01-02 10:50:00', 11, NULL, 1),
(22, 'Xem lại vẫn thấy ổn', '2026-01-03 11:50:00', '2026-01-03 11:50:00', 11, NULL, 2),

-- user 12
(23, 'Video này coi thích', '2026-01-02 10:55:00', '2026-01-02 10:55:00', 12, NULL, 3),
(24, 'Đúng kiểu mạng xã hội', '2026-01-03 11:55:00', '2026-01-03 11:55:00', 12, NULL, 4),

-- user 13
(25, 'Mấy bài này coi không chán', '2026-01-02 11:00:00', '2026-01-02 11:00:00', 13, NULL, 5),
(26, 'Nhìn là muốn lướt tiếp', '2026-01-03 12:00:00', '2026-01-03 12:00:00', 13, NULL, 6),

-- user 14
(27, 'Kiểu này hợp feed', '2026-01-02 11:05:00', '2026-01-02 11:05:00', 14, NULL, 7),
(28, 'Coi mà không bị ngán', '2026-01-03 12:05:00', '2026-01-03 12:05:00', 14, NULL, 8),

-- user 15
(29, 'Bài này coi được đó', '2026-01-02 11:10:00', '2026-01-02 11:10:00', 15, NULL, 9),
(30, 'Xem mà thấy dễ chịu ghê', '2026-01-03 12:10:00', '2026-01-03 12:10:00', 15, NULL, 10);

INSERT INTO post_reactions (
    created_at,
    reaction_type,
    updated_at,
    post_id,
    user_id
) VALUES
-- post 1
('2026-01-02 12:00:00','LIKE','2026-01-02 12:00:00',1,2),
('2026-01-02 12:01:00','LOVE','2026-01-02 12:01:00',1,3),
('2026-01-02 12:02:00','HAHA','2026-01-02 12:02:00',1,4),
('2026-01-02 12:03:00','WOW','2026-01-02 12:03:00',1,5),
('2026-01-02 12:04:00','LIKE','2026-01-02 12:04:00',1,6),

-- post 2
('2026-01-02 12:10:00','LIKE','2026-01-02 12:10:00',2,3),
('2026-01-02 12:11:00','LOVE','2026-01-02 12:11:00',2,4),
('2026-01-02 12:12:00','WOW','2026-01-02 12:12:00',2,5),
('2026-01-02 12:13:00','HAHA','2026-01-02 12:13:00',2,6),
('2026-01-02 12:14:00','LIKE','2026-01-02 12:14:00',2,7),

-- post 3
('2026-01-02 12:20:00','LIKE','2026-01-02 12:20:00',3,4),
('2026-01-02 12:21:00','LOVE','2026-01-02 12:21:00',3,5),
('2026-01-02 12:22:00','WOW','2026-01-02 12:22:00',3,6),
('2026-01-02 12:23:00','HAHA','2026-01-02 12:23:00',3,7),
('2026-01-02 12:24:00','LIKE','2026-01-02 12:24:00',3,8),

-- post 4
('2026-01-02 12:30:00','LIKE','2026-01-02 12:30:00',4,5),
('2026-01-02 12:31:00','LOVE','2026-01-02 12:31:00',4,6),
('2026-01-02 12:32:00','WOW','2026-01-02 12:32:00',4,7),
('2026-01-02 12:33:00','HAHA','2026-01-02 12:33:00',4,8),
('2026-01-02 12:34:00','LIKE','2026-01-02 12:34:00',4,9),

-- post 5
('2026-01-02 12:40:00','LIKE','2026-01-02 12:40:00',5,6),
('2026-01-02 12:41:00','LOVE','2026-01-02 12:41:00',5,7),
('2026-01-02 12:42:00','WOW','2026-01-02 12:42:00',5,8),
('2026-01-02 12:43:00','HAHA','2026-01-02 12:43:00',5,9),
('2026-01-02 12:44:00','LIKE','2026-01-02 12:44:00',5,10);

INSERT INTO stories (
    id,
    created_at,
    expires_at,
    image_url,
    music_title,
    music_url,
    text_overlay,
    video_url,
    view_count,
    user_id
) VALUES
      (1,'2026-01-04 09:00:00','2026-01-05 09:00:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762700027/zalo_chat/videos/a91ckvurge6lbrz2wm55.mp4',3,1),
      (2,'2026-01-04 09:10:00','2026-01-05 09:10:00',
       'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',NULL,NULL,NULL,NULL,2,2),
      (3,'2026-01-04 09:20:00','2026-01-05 09:20:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762502810/zalo_chat/videos/hqkdleiqrslpjmkvbid5.mp4',4,3),
      (4,'2026-01-04 09:30:00','2026-01-05 09:30:00',
       'https://images.unsplash.com/photo-1506744038136-46273834b3fb',NULL,NULL,NULL,NULL,1,4),
      (5,'2026-01-04 09:40:00','2026-01-05 09:40:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762503859/zalo_chat/videos/uasfnn8ffmjsnbl2fmre.mp4',2,5),
      (6,'2026-01-04 09:50:00','2026-01-05 09:50:00',
       'https://images.unsplash.com/photo-1492724441997-5dc865305da7',NULL,NULL,NULL,NULL,3,6),
      (7,'2026-01-04 10:00:00','2026-01-05 10:00:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762850047/zalo_chat/videos/nqemghnrsaam4by6evbm.mp4',2,7),
      (8,'2026-01-04 10:10:00','2026-01-05 10:10:00',
       'https://images.unsplash.com/photo-1500534623283-312aade485b7',NULL,NULL,NULL,NULL,1,8),
      (9,'2026-01-04 10:20:00','2026-01-05 10:20:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762700027/zalo_chat/videos/a91ckvurge6lbrz2wm55.mp4',3,9),
      (10,'2026-01-04 10:30:00','2026-01-05 10:30:00',
       'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',NULL,NULL,NULL,NULL,2,10),
      (11,'2026-01-04 10:40:00','2026-01-05 10:40:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762502810/zalo_chat/videos/hqkdleiqrslpjmkvbid5.mp4',4,11),
      (12,'2026-01-04 10:50:00','2026-01-05 10:50:00',
       'https://images.unsplash.com/photo-1501785888041-af3ef285b470',NULL,NULL,NULL,NULL,1,12),
      (13,'2026-01-04 11:00:00','2026-01-05 11:00:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762503859/zalo_chat/videos/uasfnn8ffmjsnbl2fmre.mp4',2,13),
      (14,'2026-01-04 11:10:00','2026-01-05 11:10:00',
       'https://images.unsplash.com/photo-1495567720989-cebdbdd97913',NULL,NULL,NULL,NULL,3,14),
      (15,'2026-01-04 11:20:00','2026-01-05 11:20:00',NULL,NULL,NULL,NULL,
       'https://res.cloudinary.com/dlz6sulzj/video/upload/v1762700027/zalo_chat/videos/a91ckvurge6lbrz2wm55.mp4',1,15);

INSERT INTO story_views (
    viewed_at,
    story_id,
    user_id
) VALUES
      ('2026-01-04 12:00:00', 1, 2),
      ('2026-01-04 12:01:00', 2, 3),
      ('2026-01-04 12:02:00', 3, 4),
      ('2026-01-04 12:03:00', 4, 5),
      ('2026-01-04 12:04:00', 5, 6),
      ('2026-01-04 12:05:00', 6, 7),
      ('2026-01-04 12:06:00', 7, 8),
      ('2026-01-04 12:07:00', 8, 9),
      ('2026-01-04 12:08:00', 9, 10),
      ('2026-01-04 12:09:00', 10, 11),
      ('2026-01-04 12:10:00', 11, 12),
      ('2026-01-04 12:11:00', 12, 13),
      ('2026-01-04 12:12:00', 13, 14),
      ('2026-01-04 12:13:00', 14, 15),
      ('2026-01-04 12:14:00', 15, 1);
