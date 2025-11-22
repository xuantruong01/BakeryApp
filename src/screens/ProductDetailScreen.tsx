import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
    <LinearGradient
      colors={["#FFF5E6", "#FFE8CC", "#FFFFFF"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color="#924900" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Image Container */}
          {!!product.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.name}>{product.name}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {Number(product.price).toLocaleString()}đ
              </Text>
              <View style={styles.stockBadge}>
                <Ionicons
                  name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={product.stock > 0 ? "#4CAF50" : "#F44336"}
                />
                <Text style={styles.stockText}>
                  {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Quantity Selector */}
            <View style={styles.qtyContainer}>
              <Text style={styles.qtyLabel}>Số lượng</Text>
              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={decrease}
                  disabled={quantity <= 1 || product.stock === 0}
                >
                  <Text
                    style={[
                      styles.qtySymbol,
                      (quantity <= 1 || product.stock === 0) &&
                        styles.qtyDisabled,
                    ]}
                  >
                    −
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  editable={product.stock > 0}
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
                      (product.stock === 0 ||
                        quantity >= (product.stock ?? 9999)) &&
                        styles.qtyDisabled,
                    ]}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Description */}
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.desc}>
              {product.description || "Không có mô tả chi tiết."}
            </Text>
          </View>
        </ScrollView>
        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={addToCart}
              activeOpacity={0.8}
              disabled={product.stock === 0}
            >
              <LinearGradient
                colors={
                  product.stock === 0
                    ? ["#CCC", "#999"]
                    : ["#E58E26", "#D67A1A"]
                }
                style={styles.btnAddCart}
              >
                <Ionicons name="cart-outline" size={20} color="#FFF" />
                <Text style={styles.btnText}>
                  {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={() =>
                navigation.navigate("Checkout", {
                  productDirect: { ...product, quantity },
                })
              }
              activeOpacity={0.8}
              disabled={product.stock === 0}
            >
              <LinearGradient
                colors={
                  product.stock === 0
                    ? ["#CCC", "#999"]
                    : ["#C06000", "#924900", "#6B3600"]
                }
                style={styles.btnCheckout}
              >
                <Ionicons name="flash-outline" size={20} color="#FFF" />
                <Text style={styles.btnText}>
                  {product.stock === 0 ? "Không thể đặt" : "Mua ngay"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#924900",
  },

  imageContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 280,
    backgroundColor: "#F5F5F5",
  },

  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#FFE8CC",
  },

  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    color: "#E58E26",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  stockText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  divider: {
    height: 2,
    backgroundColor: "#FFE8CC",
    marginVertical: 20,
  },

  qtyContainer: {
    marginBottom: 16,
  },
  qtyLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBF5",
    borderRadius: 16,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: "#E8D5C4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  qtySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E58E26",
  },
  qtyDisabled: {
    color: "#CCC",
  },
  qtyInput: {
    width: 60,
    height: 44,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  desc: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopWidth: 2,
    borderTopColor: "#FFE8CC",
    paddingVertical: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 14,
  },
  btnWrapper: {
    flex: 1,
  },
  btnAddCart: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#E58E26",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnCheckout: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
