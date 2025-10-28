// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
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
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import ProductCard from "../components/ProductCard";
import BannerCarousel from "../components/BannerCarousel";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 60) / 4;         // 4 cột / hàng
const MAX_ITEMS_PER_PAGE = 8;               // 2 hàng × 4 cột

type Category = { categoryId: string; name: string; imageUrl?: string };

function normalizeVN(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------------- Fetch data + history ---------------- */
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
    AsyncStorage.getItem("searchHistory").then((v) =>
      setHistory(v ? JSON.parse(v) : [])
    );
  }, []);

  /* ---------------- Nhận cờ reset từ SearchResult ---------------- */
  useEffect(() => {
    const reset = route.params?.resetSearch;
    if (reset) {
      setSearch("");
      setSearchMode(false);
      // xoá cờ để tránh lặp lại khi re-focus
      navigation.setParams?.({ resetSearch: undefined, ts: undefined });
    }
  }, [route.params?.resetSearch, route.params?.ts, navigation]);

  /* ---------------- Back cứng Android khi đang search ---------------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (searchMode) {
          setSearch("");
          setSearchMode(false);
          return true; // chặn back mặc định
        }
        return false;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [searchMode])
  );

  /* ---------------- Helpers ---------------- */
  const hotProducts = products.slice(0, 20);

  // Chia danh mục thành các "trang" 8 item để lướt ngang
  const pages: Category[][] = [];
  for (let i = 0; i < categories.length; i += MAX_ITEMS_PER_PAGE) {
    pages.push(categories.slice(i, i + MAX_ITEMS_PER_PAGE));
  }

  const saveHistory = async (term: string) => {
    if (!term.trim()) return;
    const newList = [term, ...history.filter((h) => h !== term)].slice(0, 10);
    setHistory(newList);
    await AsyncStorage.setItem("searchHistory", JSON.stringify(newList));
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    await saveHistory(search);

    const q = normalizeVN(search);
    const results = products.filter((p) =>
      normalizeVN(p?.name || "").includes(q) ||
      normalizeVN(p?.description || "").includes(q)
    );

    navigation.navigate("SearchResult", { term: search, results });
  };

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E58E26" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchBar}>
        {searchMode ? (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setSearchMode(false);
            }}
            style={styles.iconLeft}
          >
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="search" size={22} color="#999" style={styles.iconLeft} />
        )}

        <TextInput
          placeholder="Tìm bánh bạn yêu thích..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchMode(true)}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        {searchMode && (
          <TouchableOpacity onPress={handleSearch} style={styles.iconRight}>
            <Ionicons name="search" size={22} color="#E58E26" />
          </TouchableOpacity>
        )}
      </View>

      {/* ============ CHẾ ĐỘ TÌM KIẾM ============ */}
      {searchMode ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Lịch sử tìm kiếm */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>🕓 Lịch sử tìm kiếm</Text>
              {history.length > 0 && (
                <TouchableOpacity
                  onPress={async () => {
                    await AsyncStorage.removeItem("searchHistory");
                    setHistory([]);
                  }}
                >
                  <Text style={{ color: "#E58E26" }}>Xóa</Text>
                </TouchableOpacity>
              )}
            </View>

            {history.length === 0 ? (
              <Text style={{ color: "#777" }}>Chưa có lịch sử tìm kiếm.</Text>
            ) : (
              <View style={styles.historyList}>
                {history.map((term) => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => {
                      setSearch(term);
                      handleSearch();
                    }}
                    style={styles.historyItem}
                  >
                    <Ionicons name="time-outline" size={16} color="#999" />
                    <Text style={styles.historyText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Gợi ý món hot */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Gợi ý cho bạn</Text>
            <View style={styles.gridWrap}>
              {hotProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.hotItem}
                  onPress={() =>
                    (navigation.getParent("rootStack") ??
                      navigation.getParent()?.getParent())?.navigate(
                      "ProductDetail",
                      { product: item }
                    )
                  }
                >
                  <Image
                    source={{ uri: item.imageUrl || "https://via.placeholder.com/100" }}
                    style={styles.hotImage}
                  />
                  <Text numberOfLines={2} style={styles.hotName}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ============ TRANG HOME GỐC (giữ nguyên như trước) ============ */
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Banner: lấy 5 sản phẩm đầu làm banner */}
          <BannerCarousel data={hotProducts.slice(0, 5)} onPressItem={() => {}} />

          {/* Danh mục (2 hàng × 4, lướt theo trang) */}
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
                      onPress={() =>
                        (navigation.getParent("rootStack") ??
                          navigation.getParent()?.getParent())?.navigate(
                          "CategoryProducts",
                          { categoryId: cat.categoryId, categoryName: cat.name }
                        )
                      }
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

          {/* Món hot trong tuần (5 sp đầu) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Món hot trong tuần</Text>
            <FlatList
              data={hotProducts.slice(0, 5)}
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
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default HomeScreen;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 6 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8 },

  /* Section */
  section: { marginTop: 15 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#E58E26",
    marginHorizontal: 20,
  },

  /* Categories (trang 8 item) */
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

  /* Search mode: History + Suggestions */
  historySection: { marginHorizontal: 20, marginTop: 10 },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  historyText: { marginLeft: 5, fontSize: 14, color: "#333" },

  gridWrap: {
    marginHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  hotItem: {
    width: (width - 60) / 4,
    alignItems: "center",
    marginBottom: 15,
  },
  hotImage: {
    width: (width - 60) / 4 - 10,
    height: (width - 60) / 4 - 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  hotName: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
  },
});
