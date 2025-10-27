import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import ProductCard from "../components/ProductCard";

const HomeScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productSnap, categorySnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
        ]);

        const productData = productSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const categoryData = categorySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productData);
        setCategories(categoryData);
      } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E58E26" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // Lọc 5 sản phẩm đầu tiên là "hot"
  const hotProducts = products.slice(0, 5);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="🔍 Tìm bánh bạn yêu thích..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Danh mục categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎂 Danh mục nổi bật</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              {cat.image && (
                <Image
                  source={{ uri: cat.image }}
                  style={styles.categoryImage}
                />
              )}
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sản phẩm hot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Món hot trong tuần</Text>
        <FlatList
          data={hotProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Thanh tìm kiếm */
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },

  /* Section */
  section: {
    marginTop: 15,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#E58E26",
  },

  /* Category scroll */
  categoryScroll: {
    gap: 12,
  },
  categoryCard: {
    alignItems: "center",   
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
  },
});
