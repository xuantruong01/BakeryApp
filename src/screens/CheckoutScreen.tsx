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
} from "react-native";
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
import Ionicons from "@expo/vector-icons/Ionicons";

export default function CheckoutScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const directProduct = route.params?.productDirect;

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
        } else {
          // ✅ Lấy giỏ hàng từ Firestore
          const itemsRef = collection(db, "carts", userData.uid, "items");
          const itemsSnap = await getDocs(itemsRef);
          const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCartItems(items);

          const totalPrice = items.reduce(
            (sum, i) => sum + parseInt(i.price) * i.quantity,
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
  }, [directProduct]);

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

    try {
      // ✅ Lưu thông tin giao hàng vào addresses
      const addressRef = doc(db, "addresses", user.uid);
      await setDoc(
        addressRef,
        { name, address, phone, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      // ✅ Thêm đơn hàng mới vào orders
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        name,
        address,
        phone,
        items: cartItems,
        total,
        createdAt: serverTimestamp(),
      });

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

      // ✅ Nếu đặt hàng từ giỏ → xóa giỏ hàng
      if (!directProduct) {
        const itemsRef = collection(db, "carts", user.uid, "items");
        const itemsSnap = await getDocs(itemsRef);
        for (const item of itemsSnap.docs) {
          await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
        }
      }

      Alert.alert("🎉 Thành công", "Đơn hàng đã được đặt!");
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      console.error("❌ Lỗi khi đặt hàng:", error);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E58E26" />
          <Text>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>✅ Xác nhận đặt hàng</Text>
            </TouchableOpacity>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff", padding: 16 },
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
    backgroundColor: "#E58E26",
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
});
