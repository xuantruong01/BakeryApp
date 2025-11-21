# Hướng dẫn đăng nhập Admin

## Thông tin đăng nhập Admin

Để truy cập vào giao diện quản trị admin, sử dụng thông tin sau:

- **Email**: `admin@gmail.com`
- **Mật khẩu**: _(Mật khẩu bạn đã tạo khi đăng ký tài khoản admin)_

## Cách tạo tài khoản Admin

1. **Đăng ký tài khoản mới** với email: `admin@gmail.com`
2. Sau khi đăng ký thành công, đăng nhập lại
3. Hệ thống sẽ tự động nhận diện và chuyển sang giao diện Admin

## Các chức năng Admin

### 1. Dashboard (Tổng quan)

- Xem thống kê tổng số đơn hàng
- Theo dõi đơn hàng chờ xác nhận, đang xử lý, hoàn thành
- Xem tổng doanh thu
- Thống kê số lượng sản phẩm và khách hàng

### 2. Quản lý Đơn hàng

- Xem danh sách tất cả đơn hàng
- Lọc đơn hàng theo trạng thái: Tất cả, Chờ xác nhận, Đang xử lý, Hoàn thành
- **Xác nhận đơn hàng**: Chuyển từ "Chờ xác nhận" → "Đang xử lý"
- **Hoàn thành đơn hàng**: Chuyển từ "Đang xử lý" → "Hoàn thành"
- **Hủy đơn hàng**: Hủy đơn hàng khi cần thiết
- Xem chi tiết thông tin đơn hàng

### 3. Quản lý Sản phẩm

- Xem danh sách tất cả sản phẩm
- **Thêm sản phẩm mới**: Tên, giá, danh mục, mô tả, hình ảnh, tồn kho
- **Sửa sản phẩm**: Cập nhật thông tin sản phẩm
- **Xóa sản phẩm**: Xóa sản phẩm khỏi hệ thống

### 4. Quản lý Danh mục

- Xem danh sách danh mục
- **Thêm danh mục mới**: Tên, mô tả, icon
- **Sửa danh mục**: Cập nhật thông tin danh mục
- **Xóa danh mục**: Xóa danh mục (sản phẩm không bị xóa)

## Lưu ý quan trọng

- Để thay đổi email admin, chỉnh sửa trong file: `src/screens/LoginScreen.tsx` (dòng 63)
- Có thể mở rộng logic kiểm tra admin bằng cách lưu role trong Firestore
- Khi đăng xuất, hệ thống sẽ quay về giao diện khách hàng

## Luồng hoạt động đơn hàng

1. **Khách hàng** đặt hàng → Trạng thái: "Chờ xác nhận" (pending)
2. **Admin** xác nhận đơn → Trạng thái: "Đang xử lý" (processing)
3. **Admin** hoàn thành đơn sau khi giao hàng → Trạng thái: "Hoàn thành" (completed)
4. Hoặc **Admin** có thể hủy đơn → Trạng thái: "Đã hủy" (cancelled)

## Thay đổi email Admin

Để thay đổi email admin, mở file `src/screens/LoginScreen.tsx` và tìm dòng:

```typescript
const isAdmin = email === "admin@bakery.com";
```

Thay đổi `"admin@bakery.com"` thành email mong muốn.
