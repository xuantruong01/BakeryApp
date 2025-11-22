import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../services/firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { useRoute, useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useApp } from "../contexts/AppContext";

export default function CheckoutScreen() {
  const { theme, t } = useApp();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const directProduct = (route.params as any)?.productDirect;
  const selectedItemsFromCart = (route.params as any)?.selectedItems;

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash hoặc bank
  const [selectedBank, setSelectedBank] = useState("");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Hàm chuyển ảnh thành base64 URL
  const convertImageToBase64 = async (
    imageUri: string
  ): Promise<string | null> => {
    try {
      setUploading(true);
      console.log("📤 Bắt đầu chuyển ảnh thành base64...");

      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error("Không thể tải ảnh từ thư mục.");
      }
      const blob = await response.blob();
      console.log("📊 Kích thước ảnh:", blob.size, "bytes");

      // Chuyển Blob thành base64
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => {
          const base64String = reader.result as string;
          setUploading(false);
          console.log("✅ Chuyển ảnh thành base64 thành công");
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      setUploading(false);
      console.error("⚠️ Lỗi chuyển ảnh:", error);
      console.error("Chi tiết lỗi:", error.message || error);
      return null;
    }
  };

  // Hàm chọn ảnh xác nhận chuyển khoản
  const pickPaymentProof = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPaymentProof(result.assets[0].uri);
    }
  };

  // Danh sách ngân hàng với mã BIN cho VietQR
  const banks = [
    {
      id: "mb",
      name: "MB Bank",
      bin: "970422",
      account: "0986966745",
      owner: "NGUYEN BA SON",
    },
    {
      id: "tpb",
      name: "TPBank",
      bin: "970423",
      account: "0389832067",
      owner: "LE THIEN DINH",
    },
  ];

  // 🧠 Lấy thông tin user + giỏ hàng hoặc sản phẩm trực tiếp
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        const userData = userJson ? JSON.parse(userJson) : null;

        if (!userData?.uid) {
          navigation.navigate("Login", { redirectTo: "Checkout" });
          return;
        }
        setUser(userData);

        console.log("👤 UID người dùng:", userData.uid);

        // ✅ Nếu đặt hàng trực tiếp từ ProductDetail
        if (directProduct) {
          setCartItems([directProduct]);
          setTotal(parseInt(directProduct.price) * directProduct.quantity);
        } else if (selectedItemsFromCart && selectedItemsFromCart.length > 0) {
          // ✅ Nếu có items được chọn từ CartScreen
          setCartItems(selectedItemsFromCart);
          const totalPrice = selectedItemsFromCart.reduce(
            (sum, i) => sum + parseInt(i.price) * i.quantity,
            0
          );
          setTotal(totalPrice);
        } else {
          // ✅ Lấy toàn bộ giỏ hàng từ Firestore (fallback)
          const itemsRef = collection(db, "carts", userData.uid, "items");
          const itemsSnap = await getDocs(itemsRef);
          const items = itemsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as any[];
          setCartItems(items);

          const totalPrice = items.reduce(
            (sum, i) => sum + parseInt((i as any).price) * (i as any).quantity,
            0
          );
          setTotal(totalPrice);
        }

        // ✅ Lấy thông tin từ collection "addresses"
        const addressRef = doc(db, "addresses", userData.uid);
        const addressSnap = await getDoc(addressRef);

        if (addressSnap.exists()) {
          const data = addressSnap.data();
          console.log("🏠 Dữ liệu từ addresses:", data);

          setName(data.name || "");
          setAddress(data.address || "");
          setPhone(data.phone || "");
        } else {
          console.warn("⚠️ Không tìm thấy địa chỉ cho người dùng này!");
        }
      } catch (err) {
        console.error("🔥 Lỗi khi tải dữ liệu Checkout:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [directProduct, selectedItemsFromCart]);

  // 🧾 Xử lý xác nhận đặt hàng
  const handleConfirm = async () => {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      Alert.alert(
        "⚠️",
        "Vui lòng nhập đầy đủ họ tên, địa chỉ và số điện thoại!"
      );
      return;
    }

    if (!/^\d{10,11}$/.test(phone.trim())) {
      Alert.alert("⚠️", "Số điện thoại không hợp lệ (10-11 chữ số)!");
      return;
    }

    // ⚠️ Nếu chọn thanh toán chuyển khoản, PHẢI upload ảnh xác nhận
    if (paymentMethod === "bank" && !paymentProof) {
      Alert.alert(
        "⚠️",
        "Vui lòng tải ảnh xác nhận chuyển khoản trước khi đặt hàng!"
      );
      return;
    }

    try {
      // ✅ Lưu thông tin giao hàng vào addresses
      const addressRef = doc(db, "addresses", user.uid);
      await setDoc(
        addressRef,
        { name, address, phone, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      // ✅ Thêm đơn hàng mới vào orders
      const orderData: any = {
        userId: user.uid,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        name,
        address,
        phone,
        items: cartItems,
        total,
        status: "pending",
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Nếu thanh toán bằng chuyển khoản, thêm thông tin ngân hàng và upload ảnh
      if (paymentMethod === "bank" && selectedBank) {
        const bank = banks.find((b) => b.id === selectedBank);
        orderData.bankInfo = {
          bankId: selectedBank,
          bankName: bank?.name,
          accountNumber: bank?.account,
          accountOwner: bank?.owner,
        };

        // Upload ảnh xác nhận (bắt buộc)
        if (paymentProof) {
          Alert.alert("⏳", "Đang xử lý ảnh... Vui lòng chờ.");
          const proofURL = await convertImageToBase64(paymentProof);
          console.log("🖼️ proofURL:", proofURL?.substring(0, 50) + "...");
          if (!proofURL) {
            Alert.alert("❌", "Xử lý ảnh thất bại. Vui lòng thử lại.");
            return;
          }
          orderData.paymentProof = proofURL;
          console.log("✅ orderData.paymentProof đã được lưu");
        }
      }

      console.log("📦 Lưu đơn hàng:", orderData);
      await addDoc(collection(db, "orders"), orderData);

      // ✅ Cập nhật tồn kho từng sản phẩm
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStock = productData.stock ?? 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          await updateDoc(productRef, { stock: newStock });
          console.log(`📉 Cập nhật tồn kho: ${item.name} → ${newStock}`);
        } else {
          console.warn(`⚠️ Không tìm thấy sản phẩm trong kho: ${item.name}`);
        }
      }

      // ✅ Nếu đặt hàng từ giỏ → xóa các items đã chọn khỏi giỏ hàng
      if (!directProduct) {
        // Chỉ xóa những sản phẩm đã được chọn để thanh toán
        for (const item of cartItems) {
          await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
        }
      }

      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      console.error("❌ Lỗi khi đặt hàng:", error);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E58E26" />
          <Text>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={24} color="#333" />
        <Text style={styles.backText}>Quay lại</Text>
      </TouchableOpacity>
      <FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Xác nhận đơn hàng</Text>

            {/* 🧍 Thông tin cá nhân */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ tên..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại..."
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa chỉ giao hàng</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={address}
                onChangeText={setAddress}
                multiline
                placeholder="Nhập địa chỉ nhận hàng..."
              />
            </View>

            {/* 💳 Phương thức thanh toán */}
            <Text style={styles.sectionTitle}>💳 Phương thức thanh toán</Text>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "cash" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("cash")}
            >
              <View style={styles.paymentOptionContent}>
                <Ionicons
                  name={
                    paymentMethod === "cash"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color={paymentMethod === "cash" ? "#E58E26" : "#999"}
                />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    Tiền mặt khi nhận hàng
                  </Text>
                  <Text style={styles.paymentDesc}>
                    Thanh toán khi nhận hàng
                  </Text>
                </View>
              </View>
              <Ionicons name="cash-outline" size={28} color="#28A745" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "bank" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("bank")}
            >
              <View style={styles.paymentOptionContent}>
                <Ionicons
                  name={
                    paymentMethod === "bank"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={24}
                  color={paymentMethod === "bank" ? "#E58E26" : "#999"}
                />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    Chuyển khoản ngân hàng
                  </Text>
                  <Text style={styles.paymentDesc}>
                    Quét mã QR để thanh toán
                  </Text>
                </View>
              </View>
              <Ionicons name="card-outline" size={28} color="#2196F3" />
            </TouchableOpacity>

            {/* Chọn ngân hàng nếu thanh toán chuyển khoản */}
            {paymentMethod === "bank" && (
              <View style={styles.bankSelection}>
                <Text style={styles.bankSelectionTitle}>Chọn ngân hàng:</Text>
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankOption,
                      selectedBank === bank.id && styles.bankOptionActive,
                    ]}
                    onPress={() => setSelectedBank(bank.id)}
                  >
                    <Ionicons
                      name={
                        selectedBank === bank.id ? "checkbox" : "square-outline"
                      }
                      size={24}
                      color={selectedBank === bank.id ? "#E58E26" : "#999"}
                    />
                    <Text style={styles.bankName}>{bank.name}</Text>
                  </TouchableOpacity>
                ))}

                {/* Hiển thị thông tin chuyển khoản */}
                {selectedBank && (
                  <View style={styles.bankDetails}>
                    {banks
                      .filter((b) => b.id === selectedBank)
                      .map((bank) => (
                        <View key={bank.id}>
                          <Text style={styles.bankDetailTitle}>
                            Thông tin chuyển khoản:
                          </Text>
                          <View style={styles.bankDetailRow}>
                            <Text style={styles.bankDetailLabel}>
                              Ngân hàng:
                            </Text>
                            <Text style={styles.bankDetailValue}>
                              {bank.name}
                            </Text>
                          </View>
                          <View style={styles.bankDetailRow}>
                            <Text style={styles.bankDetailLabel}>Số TK:</Text>
                            <Text style={styles.bankDetailValue}>
                              {bank.account}
                            </Text>
                          </View>
                          <View style={styles.bankDetailRow}>
                            <Text style={styles.bankDetailLabel}>Chủ TK:</Text>
                            <Text style={styles.bankDetailValue}>
                              {bank.owner}
                            </Text>
                          </View>
                          <View style={styles.bankDetailRow}>
                            <Text style={styles.bankDetailLabel}>Số tiền:</Text>
                            <Text
                              style={[
                                styles.bankDetailValue,
                                { color: "#E58E26", fontWeight: "bold" },
                              ]}
                            >
                              {total.toLocaleString()}đ
                            </Text>
                          </View>
                          <View style={styles.qrContainer}>
                            <Text style={styles.qrTitle}>
                              Quét mã QR để thanh toán:
                            </Text>
                            <Image
                              source={{
                                uri: `https://img.vietqr.io/image/${bank.bin}-${
                                  bank.account
                                }-compact2.png?amount=${total}&addInfo=${encodeURIComponent(
                                  "Thanh toan don hang"
                                )}&accountName=${encodeURIComponent(
                                  bank.owner
                                )}`,
                              }}
                              style={styles.qrImage}
                              resizeMode="contain"
                            />
                            <Text style={styles.qrNote}>
                              Quét mã QR bằng ứng dụng ngân hàng để thanh toán
                              tự động. Đơn hàng sẽ được xử lý ngay sau khi nhận
                              được thanh toán.
                            </Text>
                          </View>
                          {/* Upload ảnh xác nhận chuyển khoản */}
                          <View style={{ marginTop: 16 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                marginBottom: 8,
                              }}
                            >
                              Ảnh xác nhận chuyển khoản (tuỳ chọn):
                            </Text>
                            {paymentProof ? (
                              <Image
                                source={{ uri: paymentProof }}
                                style={{
                                  width: 180,
                                  height: 180,
                                  borderRadius: 12,
                                  marginBottom: 8,
                                }}
                              />
                            ) : null}
                            <TouchableOpacity
                              style={{
                                backgroundColor: theme.primary,
                                padding: 12,
                                borderRadius: 8,
                                alignItems: "center",
                              }}
                              onPress={pickPaymentProof}
                              disabled={uploading}
                            >
                              <Text
                                style={{ color: "#fff", fontWeight: "bold" }}
                              >
                                {paymentProof
                                  ? "Chọn lại ảnh"
                                  : "Tải ảnh xác nhận chuyển khoản"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            )}

            <Text style={styles.sectionTitle}>🛒 Sản phẩm</Text>
          </>
        }
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>
              {item.quantity} × {parseInt(item.price).toLocaleString()}đ
            </Text>
          </View>
        )}
        ListFooterComponent={
          <>
            <Text style={styles.totalText}>
              Tổng cộng: {total.toLocaleString()}đ
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>✅ Xác nhận đặt hàng</Text>
            </TouchableOpacity>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E58E26",
    marginBottom: 10,
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 15, marginBottom: 5, fontWeight: "600", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 10,
    color: "#924900",
  },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  name: { fontWeight: "bold", fontSize: 15 },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 20,
    color: "#924900",
  },
  confirmBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 5,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 5,
  },
  paymentOption: {
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentOptionActive: {
    borderColor: "#E58E26",
    backgroundColor: "#FFF8F0",
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 13,
    color: "#666",
  },
  bankSelection: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  bankSelectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  bankOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bankOptionActive: {
    borderColor: "#E58E26",
    backgroundColor: "#FFF8F0",
  },
  bankName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  bankDetails: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E58E26",
  },
  bankDetailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E58E26",
    marginBottom: 12,
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bankDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  qrContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  qrImage: {
    width: 250,
    height: 250,
    marginBottom: 12,
  },
  qrNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
