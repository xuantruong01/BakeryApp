import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);

  const addToCart = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.uid) {
        Alert.alert("⚠️", "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        return;
      }

      const cartItemRef = doc(db, "carts", user.uid, "items", product.id);
      const cartItemSnap = await getDoc(cartItemRef);

      if (cartItemSnap.exists()) {
        await updateDoc(cartItemRef, { quantity: increment(quantity) });
      } else {
        await setDoc(cartItemRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || "",
          quantity: quantity,
          createdAt: new Date().toISOString(),
        });
      }

      Alert.alert("🛒", `Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
      setQuantity(1);
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  const increase = () => {
    if (product.stock && quantity >= product.stock) return;
    setQuantity(quantity + 1);
  };

  const decrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 🔙 Nút quay lại */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>

        {!!product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>
            {Number(product.price).toLocaleString()} VND
          </Text>

          {/* Bộ chọn số lượng */}
          <View style={styles.qtyContainer}>
            <Text style={styles.qtyLabel}>Số lượng</Text>
            <View style={styles.qtyBox}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={decrease}
                disabled={quantity <= 1}
              >
                <Text
                  style={[styles.qtySymbol, quantity <= 1 && { color: "#bbb" }]}
                >
                  −
                </Text>
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={increase}
                disabled={product.stock && quantity >= product.stock}
              >
                <Text
                  style={[
                    styles.qtySymbol,
                    product.stock &&
                      quantity >= product.stock && { color: "#bbb" },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.section}>Mô tả</Text>
          <Text style={styles.desc}>
            {product.description || "Không có mô tả."}
          </Text>

          <Text style={styles.section}>Tồn kho</Text>
          <Text>{product.stock ?? 0} sản phẩm</Text>
        </View>
      </ScrollView>

      {/* Nút thêm vào giỏ hàng cố định cuối màn */}
      <View style={styles.bottomBar}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.btnAddCart}
            onPress={addToCart}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>🛒 Thêm {quantity}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCheckout}
            onPress={() =>
              navigation.navigate("Checkout", {
                productDirect: { ...product, quantity },
              })
            }
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>💳 Đặt ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },

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

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // 🧱 Hàng chứa 2 nút
  buttonRow: {
    flexDirection: "row", // ✅ đặt ngang
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12, // RN 0.71+ (nếu RN cũ -> dùng marginRight thay)
  },

  btnAddCart: {
    flex: 1, // ✅ chiếm đều
    backgroundColor: "#E58E26",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    marginRight: 6, // nếu RN < 0.71
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  btnCheckout: {
    flex: 1,
    backgroundColor: "#924900",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    marginLeft: 6, // nếu RN < 0.71
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  image: { width: "100%", height: 260, borderRadius: 10 },
  body: { padding: 16 },
  name: { fontSize: 22, fontWeight: "700", color: "#333" },
  price: { marginTop: 6, fontSize: 18, color: "#E58E26", fontWeight: "700" },

  // Bộ chọn số lượng
  qtyContainer: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qtySymbol: { fontSize: 20, fontWeight: "700", color: "#E58E26" },
  qtyNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },

  section: { marginTop: 16, fontSize: 16, fontWeight: "700" },
  desc: { marginTop: 6, color: "#555", lineHeight: 20 },
});
