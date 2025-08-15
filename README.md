# 🤖 DeepSeek Chatbot Web Application

Một ứng dụng web chatbot hiện đại được xây dựng với DeepSeek API, cung cấp trải nghiệm chat AI mượt mà và thân thiện với người dùng.

## ✨ Tính năng chính

- 💬 Chat real-time với DeepSeek AI
- 🎨 Giao diện đẹp mắt với Dark/Light mode
- 📱 Responsive design cho mọi thiết bị
- 💾 Lưu trữ lịch sử chat
- 📁 Quản lý nhiều phiên chat
- 🧹 Xóa tất cả tin nhắn trong một phiên
- 📤 Export chat history
- 🔍 Tìm kiếm trong lịch sử
- ⚡ Tối ưu hiệu suất

## 🛠️ Công nghệ sử dụng

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Router
- React Query
- React Markdown
- Prism.js (syntax highlighting)

### Backend
- Node.js + Express.js
- TypeScript
- SQLite database
- JWT authentication
- Rate limiting
- CORS support

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn

### Cài đặt
```bash
# Clone repository
git clone <repository-url>
cd Chatbot-deepseek

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

### Cấu hình môi trường
Tạo file `.env` trong thư mục backend:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
JWT_SECRET=your_jwt_secret_here
PORT=3001
```

## 📁 Cấu trúc dự án

```
Chatbot-deepseek/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── backend/           # Node.js server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   └── package.json
└── shared/            # Shared types
    └── types.ts
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🙏 Cảm ơn

- DeepSeek team cho API tuyệt vời
- Cộng đồng open source
- Tất cả contributors
