// src/screens/CategoryProductsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import ProductCard from "../components/ProductCard";

type RouteParams = { categoryId: string; categoryName?: string };

export default function CategoryProductsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { categoryId, categoryName } = (route.params || {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchByCategory = async () => {
      setLoading(true);
      try {
        // ✅ Chỉ where, không orderBy → KHÔNG cần index
        const qRef = query(
          collection(db, "products"),
          where("categoryId", "==", categoryId)
        );
        const snap = await getDocs(qRef);

        // ✅ Map + sort theo name ở client
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          );

        setProducts(list);
      } catch (e) {
        console.error("❌ Lỗi tải sản phẩm theo danh mục:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchByCategory();
  }, [categoryId]);

  return (
    <View style={styles.safe}>
      {/* ----- Header ----- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.title}>
          {categoryName || "Danh mục"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* ----- Nội dung ----- */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E58E26" />
          <Text>Đang tải dữ liệu...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={28} color="#bbb" />
          <Text style={{ color: "#777", marginTop: 6 }}>Chưa có sản phẩm.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 20 }}
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() =>
                (navigation.getParent("rootStack") ??
                  navigation.getParent()?.getParent())?.navigate(
                  "ProductDetail",
                  { product: item }
                )
              }
            />
          )}
        />
      )}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 8 },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
