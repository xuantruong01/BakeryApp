# 🔐 Hướng dẫn cấu hình API Key an toàn

## ✅ Đã hoàn thành setup

### 1. File `.env` đã được tạo

- Chứa biến `EXPO_PUBLIC_GEMINI_API_KEY`
- Đã được thêm vào `.gitignore` → **KHÔNG bao giờ commit lên Git**

### 2. Code đã được cập nhật

- `aiService.ts` đọc API key từ environment variable
- An toàn hơn, không hardcode trong code

## 🚀 Cách sử dụng

### Bước 1: Thêm API key mới vào file `.env`

Mở file `.env` và thay thế:

```env
EXPO_PUBLIC_GEMINI_API_KEY=PASTE_YOUR_NEW_API_KEY_HERE
```

Thành:

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...your_actual_new_key_here
```

### Bước 2: Restart Expo server

```powershell
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
npx expo start --clear
```

**LƯU Ý:** Phải dùng `--clear` để Expo load lại environment variables!

### Bước 3: Test

Mở app và thử chat với AI. Nếu hoạt động → **Thành công!** ✅

## 🔒 Bảo mật

### ✅ Những gì đã được bảo vệ:

- ✅ API key KHÔNG còn trong code
- ✅ File `.env` được gitignore → không commit
- ✅ Chỉ có file `.env.example` (không chứa key thật) được commit
- ✅ Mỗi developer có thể dùng key riêng

### ⚠️ Lưu ý quan trọng:

1. **KHÔNG BAO GIỜ** commit file `.env` vào Git
2. **KHÔNG BAO GIỜ** share API key công khai
3. Khi deploy production, set environment variables trên hosting platform
4. Rotate API key định kỳ (mỗi 3-6 tháng)

## 📱 Expo Environment Variables

Expo hỗ trợ 2 loại biến:

### 1. `EXPO_PUBLIC_*` (Public - có thể dùng ở client)

```env
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_API_URL=...
```

Truy cập: `process.env.EXPO_PUBLIC_GEMINI_API_KEY`

### 2. Biến thường (Server-side only)

```env
PRIVATE_SECRET=...
```

Chỉ dùng trong server-side code, không expose ra client.

## 🐛 Troubleshooting

### Lỗi: "API key chưa được cấu hình"

**Nguyên nhân:** Expo chưa load file `.env`

**Giải pháp:**

```powershell
# 1. Đảm bảo file .env tồn tại trong thư mục root
# 2. Restart với clear cache
npx expo start --clear
```

### Lỗi: "PERMISSION_DENIED" hoặc "403"

**Nguyên nhân:** API key sai hoặc đã bị revoke

**Giải pháp:**

1. Tạo API key mới: https://aistudio.google.com/app/apikey
2. Cập nhật vào `.env`
3. Restart app

### App không đọc được environment variables

**Giải pháp:**

```powershell
# Clear cache và rebuild
npx expo start --clear

# Hoặc
rm -rf node_modules
npm install
npx expo start --clear
```

## 📚 Tài liệu tham khảo

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Gemini API](https://ai.google.dev/docs)
- [Security Best Practices](https://docs.expo.dev/guides/security/)

## ✨ Sẵn sàng!

Bây giờ bạn có thể:

1. Paste API key mới vào file `.env`
2. Chạy `npx expo start --clear`
3. Enjoy! 🎉

API key của bạn giờ đã an toàn và không bị lộ nữa! 🔐
