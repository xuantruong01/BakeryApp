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
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params;

  const addToCart = async (product: any) => {
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
        await updateDoc(cartItemRef, { quantity: increment(1) });
      } else {
        await setDoc(cartItemRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || "",
          quantity: 1,
          createdAt: new Date().toISOString(),
        });
      }

      Alert.alert("🛒", "Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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
            onPress={() => addToCart(product)}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>🛒 Thêm vào giỏ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  image: { width: "100%", height: 260, borderRadius: 10 },
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
