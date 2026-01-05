export type Slide = {
  id: string;
  title: string;
  description: string;
  color: string;
};

export const slides: Slide[] = [
  {
    id: "1",
    title: "Trò chuyện thật dễ dàng",
    description:
      "Gửi tin nhắn ngay lập tức với trải nghiệm trò chuyện mượt mà, không bị xao nhãng.",
    color: "#1F1F1F",
  },
  {
    id: "2",
    title: "Chia sẻ khoảnh khắc thật nhanh",
    description:
      "Gửi ảnh, video và kỷ niệm chỉ trong tích tắc — vì từng khoảnh khắc đều đáng giá.",
    color: "#2e8a8a",
  },
  {
    id: "3",
    title: "Kết nối với mọi người",
    description:
      "Kết bạn khắp nơi, từ lớp học đến mọi miền thế giới — luôn gần nhau dù cách xa.",
    color: "#4db6b6",
  },
];
