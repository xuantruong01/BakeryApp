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
import { useApp } from "../contexts/AppContext";

export default function CheckoutScreen() {
  const { theme, t } = useApp();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const directProduct = (route.params as any)?.productDirect;
  const reorderData = (route.params as any)?.reorderData;
  const selectedItems = (route.params as any)?.selectedItems;

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
        } else if (selectedItems && selectedItems.length > 0) {
          // Xử lý sản phẩm đã chọn từ CartScreen
          setCartItems(selectedItems);
          setTotal(
            selectedItems.reduce(
              (sum: number, i: any) => sum + parseInt(i.price) * i.quantity,
              0
            )
          );

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
  }, [directProduct, reorderData, selectedItems]);

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
        // Nếu có selectedItems, chỉ xóa những sản phẩm đã chọn
        if (selectedItems && selectedItems.length > 0) {
          for (const item of selectedItems) {
            await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
          }
        } else {
          // Nếu không có selectedItems, xóa toàn bộ giỏ hàng
          const itemsRef = collection(db, "carts", user.uid, "items");
          const itemsSnap = await getDocs(itemsRef);
          for (const item of itemsSnap.docs) {
            await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
          }
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
        colors={[theme.lightBg, theme.background, theme.lightBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              {t("loadingData")}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.lightBg, theme.background, theme.lightBg]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {reorderData ? t("reorder") : t("checkoutPage")}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.lightBg,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={theme.primary}
                  />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t("recipientInfo")}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t("recipientName")}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.primary + "40",
                        backgroundColor: theme.background,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t("recipientName")}
                    placeholderTextColor={theme.text + "60"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t("recipientPhone")}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.primary + "40",
                        backgroundColor: theme.background,
                      },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={t("enterPhone")}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.text + "60"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t("shippingAddress")}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        color: theme.text,
                        borderColor: theme.primary + "40",
                        backgroundColor: theme.background,
                      },
                    ]}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    placeholder={t("enterAddress")}
                    placeholderTextColor={theme.text + "60"}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.lightBg,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="card-outline"
                    size={22}
                    color={theme.primary}
                  />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t("paymentMethod")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.lightBg,
                    },
                    paymentMethod === "cash" && [
                      styles.paymentOptionActive,
                      { borderColor: theme.primary },
                    ],
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
                      color={
                        paymentMethod === "cash"
                          ? theme.primary
                          : theme.text + "60"
                      }
                    />
                    <View style={styles.paymentInfo}>
                      <Text
                        style={[styles.paymentTitle, { color: theme.text }]}
                      >
                        {t("cashOnDelivery")}
                      </Text>
                      <Text
                        style={[
                          styles.paymentDesc,
                          { color: theme.text + "80" },
                        ]}
                      >
                        {t("payOnDelivery")}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="cash-outline"
                    size={28}
                    color={theme.secondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.lightBg,
                    },
                    paymentMethod === "bank" && [
                      styles.paymentOptionActive,
                      { borderColor: theme.primary },
                    ],
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
                      color={
                        paymentMethod === "bank"
                          ? theme.primary
                          : theme.text + "60"
                      }
                    />
                    <View style={styles.paymentInfo}>
                      <Text
                        style={[styles.paymentTitle, { color: theme.text }]}
                      >
                        {t("bankTransfer")}
                      </Text>
                      <Text
                        style={[
                          styles.paymentDesc,
                          { color: theme.text + "80" },
                        ]}
                      >
                        {t("scanQRToPay")}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="card-outline"
                    size={28}
                    color={theme.accent}
                  />
                </TouchableOpacity>

                {paymentMethod === "bank" && (
                  <View
                    style={[
                      styles.bankSelection,
                      {
                        backgroundColor: theme.lightBg,
                        borderColor: theme.lightBg,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.bankSelectionTitle, { color: theme.text }]}
                    >
                      {t("selectBank")}:
                    </Text>
                    {banks.map((bank) => (
                      <TouchableOpacity
                        key={bank.id}
                        style={[
                          styles.bankOption,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.lightBg,
                          },
                          selectedBank === bank.id && [
                            styles.bankOptionActive,
                            { borderColor: theme.primary },
                          ],
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
                          color={
                            selectedBank === bank.id
                              ? theme.primary
                              : theme.text + "60"
                          }
                        />
                        <Text style={[styles.bankName, { color: theme.text }]}>
                          {bank.name}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {selectedBank && (
                      <View
                        style={[
                          styles.bankDetails,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.primary,
                          },
                        ]}
                      >
                        {banks
                          .filter((b) => b.id === selectedBank)
                          .map((bank) => (
                            <View key={bank.id}>
                              <Text
                                style={[
                                  styles.bankDetailTitle,
                                  { color: theme.primary },
                                ]}
                              >
                                {t("bankTransferInfo")}:
                              </Text>
                              <View style={styles.bankDetailRow}>
                                <Text
                                  style={[
                                    styles.bankDetailLabel,
                                    { color: theme.text + "80" },
                                  ]}
                                >
                                  {t("bank")}:
                                </Text>
                                <Text
                                  style={[
                                    styles.bankDetailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {bank.name}
                                </Text>
                              </View>
                              <View style={styles.bankDetailRow}>
                                <Text
                                  style={[
                                    styles.bankDetailLabel,
                                    { color: theme.text + "80" },
                                  ]}
                                >
                                  {t("accountNumber")}:
                                </Text>
                                <Text
                                  style={[
                                    styles.bankDetailValue,
                                    { fontWeight: "bold", color: theme.text },
                                  ]}
                                >
                                  {bank.account}
                                </Text>
                              </View>
                              <View style={styles.bankDetailRow}>
                                <Text
                                  style={[
                                    styles.bankDetailLabel,
                                    { color: theme.text + "80" },
                                  ]}
                                >
                                  {t("accountHolder")}:
                                </Text>
                                <Text
                                  style={[
                                    styles.bankDetailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {bank.owner}
                                </Text>
                              </View>
                              <View style={styles.bankDetailRow}>
                                <Text
                                  style={[
                                    styles.bankDetailLabel,
                                    { color: theme.text + "80" },
                                  ]}
                                >
                                  {t("amount")}:
                                </Text>
                                <Text
                                  style={[
                                    styles.bankDetailValue,
                                    {
                                      color: theme.primary,
                                      fontWeight: "bold",
                                    },
                                  ]}
                                >
                                  {total.toLocaleString()}đ
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.qrContainer,
                                  {
                                    backgroundColor: theme.lightBg,
                                    borderColor: theme.lightBg,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.qrTitle,
                                    { color: theme.primary },
                                  ]}
                                >
                                  {t("scanQRToPay")}:
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
                                <Text
                                  style={[
                                    styles.qrNote,
                                    { color: theme.text + "80" },
                                  ]}
                                >
                                  {t("qrScanNote")}
                                </Text>
                              </View>

                              <View style={{ marginTop: 16 }}>
                                <Text
                                  style={[styles.label, { color: theme.text }]}
                                >
                                  {t("paymentProof")} ({t("required")}):
                                </Text>
                                {paymentProof && (
                                  <Image
                                    source={{ uri: paymentProof }}
                                    style={styles.proofImage}
                                  />
                                )}
                                <TouchableOpacity
                                  style={[
                                    styles.uploadButton,
                                    { backgroundColor: theme.secondary },
                                  ]}
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
                                      ? t("changeImage")
                                      : t("uploadProof")}
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

              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.lightBg,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="cart-outline"
                    size={22}
                    color={theme.primary}
                  />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t("orderProducts")}
                  </Text>
                </View>
              </View>
            </>
          }
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.item,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.lightBg,
                },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemQuantity, { color: theme.text + "80" }]}
                >
                  {t("quantity")}: {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: theme.primary }]}>
                {(parseInt(item.price) * item.quantity).toLocaleString()}đ
              </Text>
            </View>
          )}
          ListFooterComponent={
            <>
              <View
                style={[
                  styles.totalContainer,
                  {
                    backgroundColor: theme.lightBg,
                    borderColor: theme.lightBg,
                  },
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.lightBg,
                  },
                ]}
              >
                <Text style={[styles.totalLabel, { color: theme.text }]}>
                  {t("total")}:
                </Text>
                <Text style={[styles.totalPrice, { color: theme.primary }]}>
                  {total.toLocaleString()}đ
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                disabled={uploading}
              >
                <LinearGradient
                  colors={theme.aiGradient as any}
                  style={styles.confirmGradient}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="#FFF"
                  />
                  <Text style={styles.confirmText}>{t("confirmOrder")}</Text>
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
  loadingText: { marginTop: 12, fontSize: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },

  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
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
    letterSpacing: 0.3,
  },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    fontWeight: "500",
  },

  textArea: {
    height: 90,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  paymentOption: {
    borderWidth: 2,
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
    borderWidth: 3,
    shadowColor: "#000",
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
    marginBottom: 4,
  },

  paymentDesc: {
    fontSize: 13,
  },

  bankSelection: {
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
  },

  bankSelectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  bankOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    gap: 12,
  },

  bankOptionActive: {
    borderWidth: 3,
  },

  bankName: {
    fontSize: 15,
    fontWeight: "600",
  },

  bankDetails: {
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },

  bankDetailTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 16,
  },

  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  bankDetailLabel: {
    fontSize: 14,
  },

  bankDetailValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  qrContainer: {
    marginTop: 20,
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },

  qrTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },

  qrImage: {
    width: 260,
    height: 260,
    marginBottom: 16,
    borderRadius: 12,
  },

  qrNote: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },

  proofImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },

  uploadButton: {
    flexDirection: "row",
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
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },

  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  itemQuantity: {
    fontSize: 14,
  },

  itemPrice: {
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 12,
  },

  totalContainer: {
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },

  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
  },

  confirmBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
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
