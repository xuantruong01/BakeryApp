import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
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
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CheckoutScreen() {
  const { theme, t } = useApp();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const directProduct = (route.params as any)?.productDirect;
  const reorderData = (route.params as any)?.reorderData;

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedBank, setSelectedBank] = useState("");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const convertImageToBase64 = async (
    imageUri: string
  ): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(imageUri);
      if (!response.ok) throw new Error("Không thể tải ảnh");
      const blob = await response.blob();
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => {
          setUploading(false);
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      setUploading(false);
      console.error("Lỗi chuyển ảnh:", error);
      return null;
    }
  };

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

        if (reorderData) {
          setCartItems(reorderData.items);
          setTotal(reorderData.total);
          setName(reorderData.customerName || "");
          setAddress(reorderData.deliveryAddress || "");
          setPhone(reorderData.customerPhone || "");
          setPaymentMethod(reorderData.paymentMethod || "cash");
        } else if (directProduct) {
          setCartItems([directProduct]);
          setTotal(parseInt(directProduct.price) * directProduct.quantity);

          const addressRef = doc(db, "addresses", userData.uid);
          const addressSnap = await getDoc(addressRef);
          if (addressSnap.exists()) {
            const data = addressSnap.data();
            setName(data.name || "");
            setAddress(data.address || "");
            setPhone(data.phone || "");
          }
        } else {
          const itemsRef = collection(db, "carts", userData.uid, "items");
          const itemsSnap = await getDocs(itemsRef);
          const items = itemsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as any[];
          setCartItems(items);
          setTotal(
            items.reduce((sum, i) => sum + parseInt(i.price) * i.quantity, 0)
          );

          const addressRef = doc(db, "addresses", userData.uid);
          const addressSnap = await getDoc(addressRef);
          if (addressSnap.exists()) {
            const data = addressSnap.data();
            setName(data.name || "");
            setAddress(data.address || "");
            setPhone(data.phone || "");
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [directProduct, reorderData]);

  const handleConfirm = async () => {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      Alert.alert("⚠️", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (!/^\d{10,11}$/.test(phone.trim())) {
      Alert.alert("⚠️", "Số điện thoại không hợp lệ!");
      return;
    }

    if (paymentMethod === "bank" && !paymentProof) {
      Alert.alert("⚠️", "Vui lòng tải ảnh xác nhận chuyển khoản!");
      return;
    }

    try {
      const addressRef = doc(db, "addresses", user.uid);
      await setDoc(
        addressRef,
        { name, address, phone, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      const orderData: any = {
        userId: user.uid,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        items: cartItems,
        total,
        status: "pending",
        paymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (paymentMethod === "bank" && selectedBank) {
        const bank = banks.find((b) => b.id === selectedBank);
        orderData.bankInfo = {
          bankId: selectedBank,
          bankName: bank?.name,
          accountNumber: bank?.account,
          accountOwner: bank?.owner,
        };

        if (paymentProof) {
          const proofURL = await convertImageToBase64(paymentProof);
          if (proofURL) {
            orderData.paymentProofBase64 = proofURL;
          }
        }
      }

      await addDoc(collection(db, "orders"), orderData);

      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          const newStock = currentStock - item.quantity;
          await updateDoc(productRef, { stock: newStock >= 0 ? newStock : 0 });
        }
      }

      if (!directProduct && !reorderData) {
        const itemsRef = collection(db, "carts", user.uid, "items");
        const itemsSnap = await getDocs(itemsRef);
        for (const item of itemsSnap.docs) {
          await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
        }
      }

      Alert.alert("✅ Thành công!", "Đơn hàng đã được đặt thành công!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MainTabs", { screen: "Home" }),
        },
      ]);
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#FFF5E6", "#FFE8CC", "#FFFFFF"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#924900" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#FFF5E6", "#FFE8CC", "#FFFFFF"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="#924900" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {reorderData ? "Mua lại đơn hàng" : "Xác nhận đặt hàng"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="person-outline" size={22} color="#924900" />
                  <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Họ và tên</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Nhập họ tên..."
                    placeholderTextColor="#999"
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
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Địa chỉ giao hàng</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    placeholder="Nhập địa chỉ nhận hàng..."
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="card-outline" size={22} color="#924900" />
                  <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === "cash" && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod("cash")}
                >
                  <View style={styles.paymentRow}>
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
                  <View style={styles.paymentRow}>
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

                {paymentMethod === "bank" && (
                  <View style={styles.bankSelection}>
                    <Text style={styles.bankSelectionTitle}>
                      Chọn ngân hàng:
                    </Text>
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
                            selectedBank === bank.id
                              ? "checkbox"
                              : "square-outline"
                          }
                          size={24}
                          color={selectedBank === bank.id ? "#E58E26" : "#999"}
                        />
                        <Text style={styles.bankName}>{bank.name}</Text>
                      </TouchableOpacity>
                    ))}

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
                                <Text style={styles.bankDetailLabel}>
                                  Số tài khoản:
                                </Text>
                                <Text
                                  style={[
                                    styles.bankDetailValue,
                                    { fontWeight: "bold" },
                                  ]}
                                >
                                  {bank.account}
                                </Text>
                              </View>
                              <View style={styles.bankDetailRow}>
                                <Text style={styles.bankDetailLabel}>
                                  Chủ tài khoản:
                                </Text>
                                <Text style={styles.bankDetailValue}>
                                  {bank.owner}
                                </Text>
                              </View>
                              <View style={styles.bankDetailRow}>
                                <Text style={styles.bankDetailLabel}>
                                  Số tiền:
                                </Text>
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
                                    uri: `https://img.vietqr.io/image/${
                                      bank.bin
                                    }-${
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
                                  Quét mã QR bằng ứng dụng ngân hàng để thanh
                                  toán tự động
                                </Text>
                              </View>

                              <View style={{ marginTop: 16 }}>
                                <Text style={styles.label}>
                                  Ảnh xác nhận chuyển khoản (bắt buộc):
                                </Text>
                                {paymentProof && (
                                  <Image
                                    source={{ uri: paymentProof }}
                                    style={styles.proofImage}
                                  />
                                )}
                                <TouchableOpacity
                                  style={styles.uploadButton}
                                  onPress={pickPaymentProof}
                                  disabled={uploading}
                                >
                                  <Ionicons
                                    name="cloud-upload-outline"
                                    size={20}
                                    color="#FFF"
                                  />
                                  <Text style={styles.uploadText}>
                                    {paymentProof
                                      ? "Chọn lại ảnh"
                                      : "Tải ảnh xác nhận"}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="cart-outline" size={22} color="#924900" />
                  <Text style={styles.cardTitle}>Sản phẩm đặt hàng</Text>
                </View>
              </View>
            </>
          }
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>
                  Số lượng: {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {(parseInt(item.price) * item.quantity).toLocaleString()}đ
              </Text>
            </View>
          )}
          ListFooterComponent={
            <>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalPrice}>{total.toLocaleString()}đ</Text>
              </View>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                disabled={uploading}
              >
                <LinearGradient
                  colors={["#E58E26", "#D67A1A", "#C06000"]}
                  style={styles.confirmGradient}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="#FFF"
                  />
                  <Text style={styles.confirmText}>Xác nhận đặt hàng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#924900" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#FFE8CC",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#924900",
    letterSpacing: 0.3,
  },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "700",
    color: "#333",
    letterSpacing: 0.2,
  },

  input: {
    borderWidth: 2,
    borderColor: "#E8D5C4",
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    backgroundColor: "#FFFBF5",
    color: "#333",
    fontWeight: "500",
  },

  textArea: {
    height: 90,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  paymentOption: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E8D5C4",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  paymentOptionActive: {
    borderColor: "#E58E26",
    backgroundColor: "#FFF8F0",
    borderWidth: 3,
    shadowColor: "#E58E26",
    shadowOpacity: 0.2,
    elevation: 5,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  paymentInfo: { flex: 1 },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },

  paymentDesc: {
    fontSize: 13,
    color: "#666",
  },

  bankSelection: {
    backgroundColor: "#FFFBF5",
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFE8CC",
  },

  bankSelectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  bankOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E8D5C4",
    gap: 12,
  },

  bankOptionActive: {
    borderColor: "#E58E26",
    backgroundColor: "#FFF8F0",
    borderWidth: 3,
  },

  bankName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  bankDetails: {
    marginTop: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#E58E26",
  },

  bankDetailTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#E58E26",
    marginBottom: 16,
  },

  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
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
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#FFFBF5",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFE8CC",
  },

  qrTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#924900",
    marginBottom: 16,
  },

  qrImage: {
    width: 260,
    height: 260,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },

  qrNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },

  proofImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#F5F5F5",
  },

  uploadButton: {
    flexDirection: "row",
    backgroundColor: "#E58E26",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  uploadText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  item: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FFE8CC",
  },

  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },

  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },

  itemPrice: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#E58E26",
    marginLeft: 12,
  },

  totalContainer: {
    backgroundColor: "#FFF8F0",
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE8CC",
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#924900",
  },

  confirmBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#E58E26",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  confirmGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  confirmText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
