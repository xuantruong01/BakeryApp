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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import ProductCard from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";

type RouteParams = { categoryId: string; categoryName?: string };

export default function CategoryProductsScreen() {
  const { theme, t } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { categoryId, categoryName } = (route.params || {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);

    // Real-time listener for products in this category
    const qRef = query(
      collection(db, "products"),
      where("categoryId", "==", categoryId)
    );

    const unsubscribe = onSnapshot(
      qRef,
      (snapshot) => {
        // Map + sort theo name ở client
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          );
        setProducts(list);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Lỗi tải sản phẩm theo danh mục:", error);
        setLoading(false);
      }
    );

    // Cleanup listener
    return () => unsubscribe();
  }, [categoryId]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* ----- Header ----- */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {categoryName || t("allCategories")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* ----- Nội dung ----- */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.text }}>{t("loadingData")}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={28}
            color={theme.text + "50"}
          />
          <Text style={{ color: theme.text + "80", marginTop: 6 }}>
            {t("noResults")}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 20 }}
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => {
                // Use the same navigation method as HomeScreen
                (navigation as any).navigate(
                  "ProductDetail",
                  { product: item }
                );
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 8 },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
