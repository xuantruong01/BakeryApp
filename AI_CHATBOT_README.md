# Hướng dẫn cấu hình AI ChatBot

## Tính năng AI ChatBot

ChatBot thông minh sử dụng Google Gemini AI với các tính năng:

- 🤖 Trả lời câu hỏi về sản phẩm, giá cả
- 📊 Phân tích lịch sử mua hàng của khách
- 💡 Gợi ý sản phẩm phù hợp dựa trên sở thích
- 🎯 Tư vấn combo và sản phẩm mới
- 💬 Hội thoại tự nhiên bằng tiếng Việt

## Cách lấy API Key miễn phí

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Nhấn "Create API Key"
4. Chọn project hoặc tạo mới
5. Copy API key vừa tạo

## Cấu hình API Key

Mở file `src/services/aiService.ts` và thay đổi dòng:

```typescript
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // Thay bằng API key của bạn
```

Ví dụ:

```typescript
const GEMINI_API_KEY = "AIzaSyDlSVPPPF7w8BLo6E2LwDXeXzCq0c1234";
```

## Sử dụng

1. Khách hàng nhấn vào nút AI floating (biểu tượng ✨) ở HomeScreen hoặc AccountScreen
2. AI sẽ tự động:
   - Load lịch sử đơn hàng của khách
   - Load danh sách sản phẩm hiện có
   - Tạo context thông minh
3. Khách hàng có thể:
   - Hỏi về sản phẩm: "Có bánh sinh nhật không?"
   - Xem gợi ý: "Gợi ý món phù hợp với tôi"
   - Hỏi giá: "Giá bánh croissant bao nhiêu?"
   - Tìm combo: "Có combo tiết kiệm không?"

## Tính năng nâng cao

- **Context từ lịch sử**: AI biết khách đã mua gì trước đây
- **Gợi ý tự động**: Hiển thị 3 câu hỏi gợi ý thông minh
- **Học từ hành vi**: AI phân tích sản phẩm mua nhiều nhất để gợi ý tốt hơn

## Giới hạn API miễn phí

- Google Gemini Free tier: 60 requests/minute
- Đủ cho hầu hết ứng dụng nhỏ và vừa
- Nếu cần nhiều hơn, nâng cấp lên paid plan

## Troubleshooting

### Lỗi "API Error: 400"

- Kiểm tra API key có đúng không
- Đảm bảo đã enable Gemini API trong Google Cloud Console

### Lỗi "API Error: 429"

- Vượt quá giới hạn request
- Chờ 1 phút rồi thử lại

### AI trả lời không chính xác

- Kiểm tra dữ liệu sản phẩm trong Firestore
- Đảm bảo field `name`, `price`, `category` đầy đủ
