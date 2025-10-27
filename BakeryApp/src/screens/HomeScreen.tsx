import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import ProductCard from "../components/ProductCard";
import BannerCarousel from "../components/BannerCarousel";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 60) / 4;
const MAX_ITEMS_PER_PAGE = 8;

type Category = { categoryId: string; name: string; imageUrl?: string };

const HomeScreen = () => {
  const navigation = useNavigation<any>(); // ✅ quan trọng

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

        const categoryData: Category[] = categorySnap.docs.map((doc) => {
          const d: any = doc.data();
          return {
            categoryId: d.categoryId ?? doc.id,
            name: d.name,
            imageUrl: d.imageUrl,
          };
        });

        setProducts(productData);
        setCategories(categoryData);
      } catch (e) {
        console.error("❌ Lỗi khi tải dữ liệu:", e);
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

  const hotProducts = products.slice(0, 5);
  const pages = [];
  for (let i = 0; i < categories.length; i += MAX_ITEMS_PER_PAGE) {
    pages.push(categories.slice(i, i + MAX_ITEMS_PER_PAGE));
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="🔍 Tìm bánh bạn yêu thích..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Banner */}
      <BannerCarousel data={hotProducts} onPressItem={() => {}} />

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎂 Danh mục nổi bật</Text>
        <FlatList
          data={pages}
          keyExtractor={(_, index) => `page-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style={styles.categoryPage}>
              {item.map((cat) => (
                <TouchableOpacity
                  key={cat.categoryId}
                  activeOpacity={0.8}
                  style={styles.categoryItem}
                  onPress={() => {}}
                >
                  <Image
                    source={{
                      uri: cat.imageUrl || "https://via.placeholder.com/100",
                    }}
                    style={styles.categoryImage}
                  />
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </View>

      {/* Hot Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Món hot trong tuần</Text>
        <FlatList
          data={hotProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => {
                console.log("Pressed:", item.id);
                (
                  navigation.getParent("rootStack") ??
                  navigation.getParent()?.getParent()
                )?.navigate("ProductDetail", { product: item });
              }}
            />
          )}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchContainer: { marginHorizontal: 20, marginBottom: 10 },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  section: { marginTop: 15 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#E58E26",
    marginHorizontal: 20,
  },
  categoryPage: {
    width: width,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  categoryItem: {
    width: ITEM_SIZE,
    alignItems: "center",
    marginBottom: 15,
  },
  categoryImage: {
    width: ITEM_SIZE - 10,
    height: ITEM_SIZE - 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
});
