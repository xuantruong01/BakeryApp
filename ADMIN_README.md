# 🎂 BakeryApp - Admin Dashboard

## ✨ Tính năng Admin đã hoàn thành

Giao diện quản trị admin đã được tích hợp thành công vào ứng dụng với các chức năng sau:

### 📊 1. Dashboard (Tổng quan)

- Thống kê tổng số đơn hàng
- Theo dõi đơn hàng theo trạng thái:
  - Chờ xác nhận (Pending)
  - Đang xử lý (Processing)
  - Hoàn thành (Completed)
- Tổng doanh thu từ đơn hàng hoàn thành
- Số lượng sản phẩm và khách hàng
- Pull-to-refresh để cập nhật dữ liệu

### 📦 2. Quản lý Đơn hàng

- Danh sách tất cả đơn hàng với thông tin chi tiết
- Filter theo trạng thái (Tất cả / Chờ xác nhận / Đang xử lý / Hoàn thành)
- **Xác nhận đơn hàng**: Chuyển từ "Chờ xác nhận" → "Đang xử lý"
- **Hoàn thành đơn**: Chuyển từ "Đang xử lý" → "Hoàn thành"
- **Hủy đơn hàng**: Hủy đơn khi cần thiết
- Xem chi tiết đơn hàng (thông tin khách hàng, địa chỉ, tổng tiền)

### 🍞 3. Quản lý Sản phẩm

- Danh sách sản phẩm với hình ảnh, giá, tồn kho
- **Thêm sản phẩm mới**:
  - Tên sản phẩm
  - Giá
  - Danh mục
  - Mô tả
  - URL hình ảnh
  - Số lượng tồn kho
- **Chỉnh sửa sản phẩm**: Cập nhật thông tin
- **Xóa sản phẩm**: Xóa khỏi hệ thống

### 📁 4. Quản lý Danh mục

- Danh sách các danh mục sản phẩm
- **Thêm danh mục mới**:
  - Tên danh mục
  - Mô tả
  - Icon (Ionicons)
  - Xem trước icon
- **Chỉnh sửa danh mục**: Cập nhật thông tin
- **Xóa danh mục**: Xóa khỏi hệ thống (sản phẩm không bị ảnh hưởng)

## 🔐 Đăng nhập Admin

### Email Admin mặc định:

```
Email: admin@bakery.com
Password: [Mật khẩu bạn đã đăng ký]
```

### Cách tạo tài khoản Admin:

1. Đăng ký tài khoản mới với email: `admin@bakery.com`
2. Đăng nhập với tài khoản vừa tạo
3. Hệ thống tự động nhận diện và chuyển sang giao diện Admin

### Thay đổi email Admin:

Mở file `src/screens/LoginScreen.tsx`, tìm dòng 63:

```typescript
const isAdmin = email === "admin@bakery.com";
```

Thay đổi email thành email mong muốn.

## 🚀 Cấu trúc Files

```
src/
├── screens/
│   └── admin/
│       ├── AdminHomeScreen.tsx         # Dashboard tổng quan
│       ├── AdminOrdersScreen.tsx       # Quản lý đơn hàng
│       ├── AdminProductsScreen.tsx     # Quản lý sản phẩm
│       └── AdminCategoriesScreen.tsx   # Quản lý danh mục
├── navigation/
│   ├── AdminTabNavigator.tsx           # Tab navigator cho admin
│   └── AppNavigator.tsx                # Phân biệt user/admin
```

## 📱 Luồng hoạt động

### Khách hàng:

1. Đăng nhập với email thông thường
2. Sử dụng giao diện mua hàng bình thường
3. Đặt hàng → Trạng thái "Chờ xác nhận"
4. Theo dõi đơn hàng trong lịch sử

### Admin:

1. Đăng nhập với email admin
2. Tự động chuyển sang giao diện Admin
3. Xem dashboard tổng quan
4. Xác nhận đơn hàng → "Đang xử lý"
5. Hoàn thành đơn → "Hoàn thành"
6. Quản lý sản phẩm, danh mục

## 🎨 Giao diện

- **Theme chính**: Orange (#FF6B6B)
- **Navigation**: Bottom Tab cho dễ sử dụng
- **Icons**: Ionicons với màu sắc phù hợp từng trạng thái
- **Responsive**: Pull-to-refresh, loading states
- **Modal**: Form thêm/sửa với modal overlay

## 🔧 Công nghệ sử dụng

- **React Native** - Framework chính
- **Firebase Firestore** - Database
- **Firebase Auth** - Authentication
- **React Navigation** - Navigation
- **AsyncStorage** - Lưu trữ local (user role)
- **Expo** - Development platform

## 📝 Lưu ý

1. **Phân quyền**: Hiện tại dựa trên email đăng nhập. Có thể mở rộng bằng cách:

   - Lưu role trong Firestore collection `users`
   - Kiểm tra role từ database thay vì hardcode email

2. **Bảo mật**:

   - Nên thêm middleware kiểm tra role ở backend
   - Validate quyền truy cập cho các hành động admin

3. **Mở rộng**:
   - Thêm báo cáo thống kê chi tiết
   - Export dữ liệu đơn hàng
   - Quản lý khách hàng
   - Push notification cho đơn hàng mới
   - Upload ảnh sản phẩm trực tiếp

## 🐛 Troubleshooting

### App không chuyển sang giao diện Admin:

- Kiểm tra email đăng nhập có đúng `admin@bakery.com`
- Xóa cache: Clear app data hoặc reinstall
- Kiểm tra AsyncStorage có lưu đúng `userRole`

### Đăng xuất không reset giao diện:

- Code đã được cập nhật để reset navigation khi logout
- Clear AsyncStorage key `userRole`

## 📚 Tài liệu tham khảo

- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Hướng dẫn chi tiết sử dụng admin
- [React Navigation](https://reactnavigation.org/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

---

**Phát triển bởi**: BakeryApp Team
**Version**: 2.0.0 (Admin Dashboard)
