import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // thư viện icon phổ biến

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock?: number;
  categoryId?: string;
};

export default function ProductDetailScreen({ route }: any) {
  const { product } = route.params as { product: Product };
  const navigation = useNavigation<any>();

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu sản phẩm.</Text>
      </View>
    );
  }

  const addToCart = async () => {
    try {
      const current = await AsyncStorage.getItem("cart");
      let cart = current ? JSON.parse(current) : [];

      console.log("🛒 Cart hiện tại:", cart);

      const existing = cart.find((i: any) => i.id === product.id);

      if (existing) {
        existing.quantity += 1;
        console.log(
          `🔁 Đã tăng số lượng: ${product.name} → ${existing.quantity}`
        );
      } else {
        cart.push({ ...product, quantity: 1 });
        console.log(`✨ Đã thêm sản phẩm mới: ${product.name}`);
      }

      await AsyncStorage.setItem("cart", JSON.stringify(cart));
      console.log("✅ Đã lưu giỏ hàng mới:", cart);

      Alert.alert("🛒", "Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.section}>Mô tả</Text>
        <Text style={styles.desc}>
          {product.description || "Không có mô tả."}
        </Text>

        <Text style={styles.section}>Tồn kho</Text>
        <Text>{product.stock ?? 0} sản phẩm</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={addToCart}
          activeOpacity={0.9}
        >
          <Text style={styles.btnText}>🛒 Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 10,
    marginLeft: 5,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 4,
  },

  image: { width: "100%", height: 260 },
  body: { padding: 16 },
  name: { fontSize: 22, fontWeight: "700", color: "#333" },
  price: {
    marginTop: 6,
    fontSize: 18,
    color: "#E58E26",
    fontWeight: "700",
  },
  section: { marginTop: 16, fontSize: 16, fontWeight: "700" },
  desc: { marginTop: 6, color: "#555", lineHeight: 20 },
  btn: {
    marginTop: 20,
    backgroundColor: "#E58E26",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
