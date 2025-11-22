import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput, // ✅ thêm import TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // ✅ sửa import Ionicons
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { useApp } from "../contexts/AppContext";

export default function ProductDetailScreen({ route, navigation }: any) {
  const { theme, t } = useApp();
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);

  /* ------------------- Thêm vào giỏ hàng ------------------- */
  const addToCart = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.uid) {
        Alert.alert("⚠️", "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        return;
      }

      if (product.stock === 0) {
        Alert.alert("⚠️", t("productOutOfStock"));
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

  /* ------------------- Tăng / giảm số lượng ------------------- */
  const increase = () => {
    const maxStock = product.stock ?? 9999;
    if (quantity < maxStock) setQuantity(quantity + 1);
  };

  const decrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  /* ------------------- Render giao diện ------------------- */
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
          <Ionicons name="chevron-back" size={24} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>
            {t("backButton")}
          </Text>
        </TouchableOpacity>

        {!!product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.body}>
          <Text style={[styles.name, { color: theme.text }]}>
            {product.name}
          </Text>
          <Text style={[styles.price, { color: theme.primary }]}>
            {Number(product.price).toLocaleString()} VND
          </Text>

          {/* 🧺 Bộ chọn số lượng */}
          <View style={styles.qtyContainer}>
            <Text style={[styles.qtyLabel, { color: theme.text }]}>
              {t("quantity")}
            </Text>

            <View style={styles.qtyBox}>
              {/* Giảm số lượng */}
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={decrease}
                disabled={quantity <= 1 || product.stock === 0}
              >
                <Text
                  style={[
                    styles.qtySymbol,
                    { color: theme.primary },
                    (quantity <= 1 || product.stock === 0) && { color: "#bbb" },
                  ]}
                >
                  −
                </Text>
              </TouchableOpacity>

              {/* ✅ Ô nhập số lượng */}
              <TextInput
                style={[
                  styles.qtyInput,
                  { color: theme.text, borderColor: theme.primary + "40" },
                ]}
                keyboardType="numeric"
                editable={product.stock > 0} // ❌ Không cho nhập nếu hết hàng
                value={String(quantity)}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                  if (isNaN(num)) {
                    setQuantity(1);
                    return;
                  }

                  const maxStock = product.stock ?? 9999;
                  if (num > maxStock) setQuantity(maxStock);
                  else if (num < 1) setQuantity(1);
                  else setQuantity(num);
                }}
              />

              {/* Tăng số lượng */}
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={increase}
                disabled={
                  product.stock === 0 || quantity >= (product.stock ?? 9999)
                }
              >
                <Text
                  style={[
                    styles.qtySymbol,
                    { color: theme.primary },
                    (product.stock === 0 ||
                      quantity >= (product.stock ?? 9999)) && { color: "#bbb" },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>

            {/* ⚠️ Nếu hết hàng */}
            {product.stock === 0 && (
              <Text style={{ color: "red", marginTop: 4, fontSize: 13 }}>
                {t("productOutOfStock")}
              </Text>
            )}
          </View>

          {/* Mô tả & tồn kho */}
          <Text style={[styles.section, { color: theme.text }]}>
            {t("productDescription")}
          </Text>
          <Text style={[styles.desc, { color: theme.text }]}>
            {product.description || "Không có mô tả."}
          </Text>

          <Text style={[styles.section, { color: theme.text }]}>Tồn kho</Text>
          <Text style={{ color: theme.text }}>
            {product.stock ?? 0} sản phẩm
          </Text>
        </View>
      </ScrollView>

      {/* 🛒 Thanh hành động */}
      <View style={styles.bottomBar}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.btnAddCart,
              { backgroundColor: theme.primary },
              product.stock === 0 && { backgroundColor: "#ccc" },
            ]}
            onPress={addToCart}
            activeOpacity={0.9}
            disabled={product.stock === 0}
          >
            <Text style={styles.btnText}>
              🛍️{" "}
              {product.stock === 0
                ? t("productOutOfStock")
                : `${t("addToCartButton")} ${quantity}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnCheckout,
              { backgroundColor: theme.secondary },
              product.stock === 0 && { backgroundColor: "#ccc" },
            ]}
            onPress={() =>
              navigation.navigate("Checkout", {
                productDirect: { ...product, quantity },
              })
            }
            activeOpacity={0.9}
            disabled={product.stock === 0}
          >
            <Text style={styles.btnText}>
              💳 {product.stock === 0 ? t("productOutOfStock") : t("buyNow")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ================== STYLES ================== */
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
    marginLeft: 5,
  },

  image: {
    width: "100%",
    height: 260,
    borderRadius: 10,
    marginTop: 12,
    marginHorizontal: 12,
  },
  body: { padding: 16 },
  name: { fontSize: 22, fontWeight: "700" },
  price: { marginTop: 6, fontSize: 18, fontWeight: "700" },

  qtyContainer: {
    marginTop: 15,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  qtyLabel: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtySymbol: { fontSize: 20, fontWeight: "700" },
  qtyInput: {
    width: 45,
    height: 36,
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginHorizontal: 6,
    paddingVertical: 4,
  },

  section: { marginTop: 16, fontSize: 16, fontWeight: "700" },
  desc: { marginTop: 6, lineHeight: 20 },

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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  btnAddCart: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    marginRight: 6,
    elevation: 2,
  },
  btnCheckout: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    marginLeft: 6,
    elevation: 2,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
