// src/screens/ProductDetailScreen.tsx
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

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu sản phẩm.</Text>
      </View>
    );
  }

  const addToCart = () => {
    // TODO: Lưu vào AsyncStorage / Firestore nếu cần
    Alert.alert("🛒 Giỏ hàng", `Đã thêm “${product.name}” vào giỏ!`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
