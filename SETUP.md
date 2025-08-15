# 🚀 Hướng dẫn cài đặt và chạy DeepSeek Chatbot

## 📋 Yêu cầu hệ thống

- **Node.js**: Phiên bản 18.0.0 trở lên
- **npm**: Phiên bản 8.0.0 trở lên
- **DeepSeek API Key**: Đăng ký tại [DeepSeek Console](https://platform.deepseek.com/)

## 🔧 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd Chatbot-deepseek
```

### 2. Cài đặt dependencies
```bash
# Cài đặt tất cả dependencies (backend + frontend)
npm run install:all

# Hoặc cài đặt riêng lẻ:
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Cấu hình môi trường

#### Backend (.env)
Tạo file `.env` trong thư mục `backend/`:
```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_PATH=./data/chatbot.db
```

#### Frontend (.env)
Tạo file `.env` trong thư mục `frontend/`:
```env
VITE_API_URL=http://localhost:3001/api
```

## 🏃‍♂️ Chạy ứng dụng

### Development mode
```bash
# Chạy cả backend và frontend
npm run dev

# Hoặc chạy riêng lẻ:
# Backend (port 3001)
npm run dev:backend

# Frontend (port 3000)
npm run dev:frontend
```

### Production mode
```bash
# Build cả backend và frontend
npm run build

# Chạy production server
npm start
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📁 Cấu trúc dự án

```
Chatbot-deepseek/
├── backend/                 # Node.js + Express server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.ts        # Server entry point
│   ├── data/               # SQLite database files
│   └── package.json
├── frontend/               # React + TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/         # State management
│   │   └── main.tsx        # App entry point
│   └── package.json
├── shared/                 # Shared TypeScript types
│   └── types.ts
└── package.json           # Root package.json
```

## 🔑 Lấy DeepSeek API Key

1. Truy cập [DeepSeek Console](https://platform.deepseek.com/)
2. Đăng ký tài khoản hoặc đăng nhập
3. Tạo API key mới
4. Copy API key vào file `.env`

## 🛠️ Tính năng chính

### ✅ Đã hoàn thành
- [x] Đăng ký/Đăng nhập người dùng
- [x] Chat với DeepSeek AI
- [x] Lưu trữ lịch sử chat
- [x] Quản lý nhiều phiên chat
- [x] Dark/Light mode
- [x] Responsive design
- [x] Markdown rendering
- [x] Code syntax highlighting
- [x] Export chat history
- [x] Tìm kiếm phiên chat
- [x] JWT authentication
- [x] Rate limiting
- [x] Error handling

### 🚧 Đang phát triển
- [ ] Streaming responses
- [ ] File upload
- [ ] Voice chat
- [ ] Multi-language support
- [ ] Advanced settings

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng**
   ```bash
   # Kiểm tra process đang sử dụng port
   lsof -i :3000
   lsof -i :3001
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database không tạo được**
   ```bash
   # Xóa file database cũ
   rm backend/data/chatbot.db
   
   # Restart server
   npm run dev:backend
   ```

3. **CORS error**
   - Kiểm tra `FRONTEND_URL` trong file `.env`
   - Đảm bảo frontend đang chạy trên port 3000

4. **API key không hợp lệ**
   - Kiểm tra `DEEPSEEK_API_KEY` trong file `.env`
   - Đảm bảo API key có quyền truy cập

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### Chat
- `POST /api/chat/send` - Gửi tin nhắn
- `GET /api/chat/messages/:sessionId` - Lấy tin nhắn
- `DELETE /api/chat/messages/:messageId` - Xóa tin nhắn

### Sessions
- `GET /api/sessions` - Lấy danh sách phiên chat
- `POST /api/sessions` - Tạo phiên chat mới
- `PUT /api/sessions/:sessionId` - Cập nhật phiên chat
- `DELETE /api/sessions/:sessionId` - Xóa phiên chat
- `GET /api/sessions/:sessionId/export` - Xuất phiên chat

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
