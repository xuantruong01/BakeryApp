# 📝 Chức năng Đánh giá Sản phẩm

## 🎯 Tổng quan

Chức năng đánh giá sản phẩm cho phép khách hàng đánh giá và nhận xét về các sản phẩm họ đã mua.

## ✨ Tính năng chính

### 1. Kiểm tra điều kiện đánh giá

- ✅ Chỉ khách hàng đã mua sản phẩm mới được đánh giá
- ✅ Đơn hàng phải ở trạng thái "completed" (hoàn thành)
- ✅ Mỗi khách hàng chỉ được đánh giá mỗi sản phẩm một lần

### 2. Viết đánh giá

- **Rating**: Đánh giá từ 1-5 sao
  - 5 sao: Xuất sắc
  - 4 sao: Tốt
  - 3 sao: Trung bình
  - 2 sao: Dưới trung bình
  - 1 sao: Kém
- **Comment**: Nhận xét chi tiết (tối thiểu 10 ký tự, tối đa 500 ký tự)

### 3. Hiển thị đánh giá

- Hiển thị rating trung bình và tổng số đánh giá trên trang chi tiết sản phẩm
- Hiển thị danh sách 10 đánh giá gần nhất
- Mỗi đánh giá bao gồm:
  - Avatar và tên người đánh giá
  - Số sao đánh giá
  - Nội dung nhận xét
  - Ngày đánh giá

## 🗂️ Cấu trúc Database (Firestore)

### Collection: `reviews`

```javascript
{
  userId: string,           // ID người dùng
  userName: string,         // Tên người dùng
  productId: string,        // ID sản phẩm
  orderId: string,          // ID đơn hàng (optional)
  rating: number,           // 1-5
  comment: string,          // Nội dung đánh giá
  createdAt: Timestamp,     // Thời gian tạo
  updatedAt: Timestamp      // Thời gian cập nhật
}
```

### Collection: `products` (updated fields)

```javascript
{
  // ... existing fields
  reviewCount: number,      // Tổng số đánh giá
  averageRating: number     // Rating trung bình (1 chữ số thập phân)
}
```

## 📱 Luồng sử dụng

### Khách hàng viết đánh giá:

1. Vào **Lịch sử đơn hàng** → Chọn đơn hàng đã hoàn thành
2. Nhấn nút **"Đánh giá"** trên đơn hàng
3. Hệ thống kiểm tra:
   - Đã đăng nhập chưa?
   - Đã mua sản phẩm chưa?
   - Đã đánh giá sản phẩm chưa?
4. Chọn số sao và viết nhận xét
5. Nhấn **"Gửi đánh giá"**
6. Hệ thống cập nhật:
   - Thêm đánh giá vào collection `reviews`
   - Cập nhật `reviewCount` và `averageRating` của sản phẩm

### Xem đánh giá:

1. Vào trang chi tiết sản phẩm
2. Cuộn xuống phần **"Đánh giá khách hàng"**
3. Xem rating trung bình và các đánh giá

## 🔒 Bảo mật và Validation

### Frontend:

- ✅ Kiểm tra đăng nhập
- ✅ Kiểm tra độ dài comment (10-500 ký tự)
- ✅ Kiểm tra đã mua sản phẩm
- ✅ Kiểm tra đã đánh giá chưa

### Backend (Firestore Rules - cần thiết lập):

```javascript
match /reviews/{reviewId} {
  allow read: if true;
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.comment.size() >= 10
    && request.resource.data.rating >= 1
    && request.resource.data.rating <= 5;
  allow update, delete: if false;
}
```

## 📄 Files đã tạo/sửa

### Tạo mới:

- `src/screens/ReviewScreen.tsx` - Màn hình viết đánh giá

### Cập nhật:

- `src/screens/ProductDetailScreen.tsx` - Hiển thị đánh giá
- `src/screens/OrderHistoryScreen.tsx` - Thêm nút đánh giá
- `src/contexts/AppContext.tsx` - Thêm translations
- `src/navigation/AppNavigator.tsx` - Thêm route cho ReviewScreen

## 🎨 UI/UX Features

### ReviewScreen:

- 🎨 Gradient background với theme colors
- ⭐ Interactive star rating với animation
- 📝 Multi-line text input với character counter
- ✅ Disabled state khi không đủ điều kiện
- 🔄 Loading state khi kiểm tra và gửi

### ProductDetailScreen:

- 📊 Rating badge hiển thị điểm trung bình
- 👥 Avatar tròn với initial của tên user
- 📅 Hiển thị ngày đánh giá
- 🔄 Refresh khi quay lại từ ReviewScreen

### OrderHistoryScreen:

- 🔘 2 buttons song song: "Mua lại" và "Đánh giá"
- 🎨 Color coding: Orange cho "Mua lại", Yellow cho "Đánh giá"

## 🌍 Đa ngôn ngữ

Hỗ trợ cả Tiếng Việt và Tiếng Anh:

- writeReview / Viết đánh giá
- customerReviews / Đánh giá khách hàng
- yourRating / Đánh giá của bạn
- excellent / Xuất sắc
- good / Tốt
- ...và nhiều từ khóa khác

## 🚀 Cải tiến tương lai

1. **Thêm ảnh vào đánh giá**: Cho phép khách hàng upload ảnh sản phẩm thực tế
2. **Reply từ shop**: Admin có thể trả lời đánh giá
3. **Filter đánh giá**: Lọc theo số sao (5 sao, 4 sao, v.v.)
4. **Helpful vote**: Người dùng vote đánh giá hữu ích
5. **Report abuse**: Báo cáo đánh giá không phù hợp
6. **Statistics**: Biểu đồ phân bố rating (bao nhiêu % 5 sao, 4 sao...)

## 📝 Lưu ý

- Review được lưu vĩnh viễn, không cho phép xóa/sửa
- Mỗi user chỉ review mỗi sản phẩm 1 lần
- Rating trung bình được tính lại mỗi khi có review mới
- Cần setup Firestore Security Rules để bảo mật
