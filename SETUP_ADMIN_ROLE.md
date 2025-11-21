# Hướng dẫn thiết lập Admin Role trong Firebase

## Cách 1: Thêm role trực tiếp trong Firebase Console

1. Mở Firebase Console: https://console.firebase.google.com/
2. Chọn project "bakeryapp-1d0bf"
3. Vào **Firestore Database**
4. Tìm collection `users`
5. Tìm document của user admin (UID: `YhJ6usMBLEZn7Q4O05kU334WVcU2`)
6. Click vào document đó
7. Click nút **"Add field"** hoặc **"Ajouter un champ"**
8. Thêm field mới:
   - **Field name**: `role`
   - **Type**: `string`
   - **Value**: `admin`
9. Click **Save** hoặc **Enregistrer**

## Cách 2: Sử dụng email để nhận diện Admin (Đã implement)

Code hiện tại sẽ tự động nhận diện email `admin@gmail.com` là admin.

Không cần thêm field `role` trong Firestore, chỉ cần đăng nhập với email `admin@gmail.com`.

## Kiểm tra

Sau khi thiết lập:

1. Đăng xuất khỏi app (nếu đang đăng nhập)
2. Đăng nhập lại với:
   - Email: `admin@gmail.com`
   - Password: (mật khẩu của bạn)
3. App sẽ tự động chuyển sang giao diện Admin

## Thêm Admin mới

Nếu muốn thêm admin khác:

### Cách 1: Sử dụng role trong Firestore

1. Tạo tài khoản người dùng mới
2. Vào Firestore → collection `users` → document của user đó
3. Thêm field `role: "admin"`

### Cách 2: Thêm email vào whitelist

Sửa file `src/screens/LoginScreen.tsx`:

```typescript
// Thay vì:
if (email === "admin@gmail.com") {
  userRole = "admin";
}

// Đổi thành:
const adminEmails = ["admin@gmail.com", "admin2@gmail.com", "boss@company.com"];
if (adminEmails.includes(email)) {
  userRole = "admin";
}
```

## Lưu ý bảo mật

⚠️ **Quan trọng**:

- Trong môi trường production, nên sử dụng Firebase Security Rules để bảo vệ dữ liệu
- Chỉ cho phép admin thực hiện các thao tác quản lý
- Validate role ở backend (Cloud Functions) thay vì chỉ ở client

## Firestore Security Rules mẫu

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function kiểm tra admin
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || isAdmin();
    }

    // Products - chỉ admin mới được sửa/xóa
    match /products/{productId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    // Categories - chỉ admin mới được sửa/xóa
    match /categories/{categoryId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    // Orders - user xem của mình, admin xem tất cả
    match /orders/{orderId} {
      allow read: if request.auth != null &&
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

## Troubleshooting

### Vẫn không vào được trang admin:

1. **Kiểm tra email**: Đảm bảo email đăng nhập chính xác là `admin@gmail.com`

2. **Clear cache**:

   ```bash
   # Xóa app và cài lại
   # Hoặc clear AsyncStorage
   ```

3. **Kiểm tra AsyncStorage**:

   - Mở React Native Debugger
   - Check `userRole` trong AsyncStorage
   - Nếu không đúng, đăng xuất và đăng nhập lại

4. **Kiểm tra console logs**:

   - Xem có lỗi khi fetch user data từ Firestore không
   - Check network requests

5. **Test thủ công**:
   ```typescript
   // Thêm vào LoginScreen để debug
   console.log("User role:", userRole);
   console.log("User data:", userData);
   ```

## Script tự động thêm role (Optional)

Nếu muốn script tự động, có thể dùng Firebase Admin SDK:

```javascript
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// Thêm role cho user
async function setAdminRole(userId) {
  await db.collection("users").doc(userId).update({
    role: "admin",
  });
  console.log("Admin role added successfully");
}

setAdminRole("YhJ6usMBLEZn7Q4O05kU334WVcU2");
```
