// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import ProductCard from "../components/ProductCard";
import BannerCarousel from "../components/BannerCarousel";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../contexts/AppContext";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 60) / 4; // 4 cột / hàng
const MAX_ITEMS_PER_PAGE = 8; // 2 hàng × 4 cột

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
  const { theme, t } = useApp();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const categoryScrollX = useRef(new Animated.Value(0)).current;
  const categoryProgressWidth = useRef(new Animated.Value(0)).current;
  const categoryFlatListRef = useRef<FlatList>(null);

  /* ---------------- Fetch data + history with real-time updates ---------------- */
  useEffect(() => {
    setLoading(true);

    // Real-time listener for products
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Lỗi khi tải sản phẩm:", error);
        setLoading(false);
      }
    );

    // Real-time listener for categories
    const unsubscribeCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const categoryData: Category[] = snapshot.docs.map((doc) => {
          const d: any = doc.data();
          return {
            categoryId: d.categoryId ?? doc.id,
            name: d.name,
            imageUrl: d.imageUrl,
          };
        });
        setCategories(categoryData);
      },
      (error) => {
        console.error("❌ Lỗi khi tải danh mục:", error);
      }
    );

    // Load search history
    AsyncStorage.getItem("searchHistory").then((v) =>
      setHistory(v ? JSON.parse(v) : [])
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  /* ---------------- Debounce search input (500ms) ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- Nhận cờ reset từ SearchResult ---------------- */
  useEffect(() => {
    const reset = route.params?.resetSearch;
    if (reset) {
      setSearch("");
      setDebouncedSearch("");
      setSearchMode(false);
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
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [searchMode])
  );

  /* ---------------- Helpers ---------------- */
  const hotProducts = products.slice(0, 20);

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
    const results = products.filter(
      (p) =>
        normalizeVN(p?.name || "").includes(q) ||
        normalizeVN(p?.description || "").includes(q)
    );

    navigation.navigate("SearchResult", { term: search, results });
  };

  const handleCategoryScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: categoryScrollX } } }],
    { useNativeDriver: false }
  );

  React.useEffect(() => {
    categoryScrollX.addListener(({ value }) => {
      if (pages.length > 0) {
        // Tính toán chiều dài thực tế của content
        const totalContentWidth = width * pages.length;
        const containerWidth = width - 80; // width - padding (40 + 40)

        // Chiều dài scrollbar tính dựa trên ratio: container / totalContent
        const scrollbarLength =
          (containerWidth / totalContentWidth) * containerWidth;

        // Khoảng trống còn lại để thumb di chuyển
        const maxScrollbarPosition = Math.max(
          0,
          containerWidth - scrollbarLength
        );

        // Vị trí của thumb
        const scrollableDistance = Math.max(
          0,
          totalContentWidth - containerWidth
        );
        if (scrollableDistance > 0) {
          const ratio = value / scrollableDistance;
          const thumbPosition = ratio * maxScrollbarPosition;
          categoryProgressWidth.setValue(
            Math.min(thumbPosition, maxScrollbarPosition)
          );
        }
      }
    });

    return () => categoryScrollX.removeAllListeners();
  }, [pages.length]);

  const handleScrollbarDrag = (event: any) => {
    const { nativeEvent } = event;
    const x = nativeEvent.locationX;
    const containerWidth = width - 80;

    if (pages.length > 0) {
      const totalContentWidth = width * pages.length;
      const scrollbarLength =
        (containerWidth / totalContentWidth) * containerWidth;
      const maxScrollbarPosition = Math.max(
        0,
        containerWidth - scrollbarLength
      );

      // Hạn chế x trong phạm vi [0, maxScrollbarPosition]
      const limitedX = Math.max(0, Math.min(x, maxScrollbarPosition));

      // Tính toán vị trí scroll dựa trên vị trí scrollbar
      const scrollableDistance = Math.max(
        0,
        totalContentWidth - containerWidth
      );
      const targetScrollX =
        (limitedX / maxScrollbarPosition) * scrollableDistance;

      categoryFlatListRef.current?.scrollToOffset({
        offset: targetScrollX,
        animated: true,
      });
    }
  };

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.primary }}>
            {t("loadingData")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.container}>
        {/* HEADER CHÀO HỎI */}
        {!searchMode && (
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.helloText, { color: theme.text }]}>
                {t("hello")},
              </Text>
              <Text style={[styles.appName, { color: theme.primary }]}>
                {t("bakeryAppName")}
              </Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>
                {t("deliverySlogan")}
              </Text>
            </View>
            <View
              style={[styles.headerAvatar, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="restaurant" size={30} color="#fff" />
            </View>
          </View>
        )}

        {/* Thanh tìm kiếm */}
        <View style={[styles.searchBar, { borderColor: theme.lightBg }]}>
          {searchMode ? (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setSearchMode(false);
                Keyboard.dismiss();
              }}
              style={styles.iconLeft}
            >
              <Ionicons name="arrow-back" size={22} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name="search"
              size={20}
              color={theme.secondary}
              style={styles.iconLeft}
            />
          )}

          <TextInput
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={theme.text}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchMode(true)}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          {searchMode && (
            <TouchableOpacity onPress={handleSearch} style={styles.iconRight}>
              <Ionicons name="search" size={22} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ============ CHẾ ĐỘ TÌM KIẾM ============ */}
        {searchMode ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Lịch sử tìm kiếm */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                  {t("searchHistory")}
                </Text>
                {history.length > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      await AsyncStorage.removeItem("searchHistory");
                      setHistory([]);
                    }}
                  >
                    <Text
                      style={[
                        styles.clearHistoryText,
                        { color: theme.secondary },
                      ]}
                    >
                      {t("clear")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.card}>
                {history.length === 0 ? (
                  <Text style={{ color: theme.text }}>
                    {t("noSearchHistory")}
                  </Text>
                ) : (
                  <View style={styles.historyList}>
                    {history.map((term) => (
                      <TouchableOpacity
                        key={term}
                        onPress={() => {
                          setSearch(term);
                          handleSearch();
                        }}
                        style={[
                          styles.historyItem,
                          { backgroundColor: theme.lightBg },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={theme.secondary}
                        />
                        <Text
                          style={[styles.historyText, { color: theme.text }]}
                        >
                          {term}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Gợi ý món hot */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {t("suggestionsForYou")}
              </Text>
              <View
                style={[styles.card, { paddingHorizontal: 10, marginTop: 12 }]}
              >
                <View style={styles.gridWrap}>
                  {hotProducts.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.hotItem}
                      onPress={() => {
                        console.log("🔵 HOT ITEM PRESSED:", item.id, item.name);
                        console.log(
                          "🔵 Product data:",
                          JSON.stringify(item, null, 2)
                        );
                        console.log("🔵 Navigating to ProductDetail...");
                        navigation.navigate(
                          "ProductDetail" as never,
                          { product: item } as never
                        );
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            item.imageUrl || "https://via.placeholder.com/100",
                        }}
                        style={styles.hotImage}
                      />
                      <Text numberOfLines={2} style={styles.hotName}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          /* ============ TRANG HOME GỐC ============ */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Banner */}
            <View style={styles.bannerWrap}>
              <BannerCarousel
                data={hotProducts.slice(0, 5)}
                onPressItem={(item) => {
                  console.log("🟢 BANNER PRESSED:", item.id, item.name);
                  console.log(
                    "🟢 Product data:",
                    JSON.stringify(item, null, 2)
                  );
                  console.log("🟢 Navigating to ProductDetail...");
                  navigation.navigate(
                    "ProductDetail" as never,
                    { product: item } as never
                  );
                }}
              />
            </View>

            {/* Danh mục nổi bật */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                  {t("featuredCategories")}
                </Text>
              </View>

              <View style={styles.card}>
                <FlatList
                  ref={categoryFlatListRef}
                  data={pages}
                  keyExtractor={(_, index) => `page-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  onScroll={handleCategoryScroll}
                  scrollEventThrottle={16}
                  renderItem={({ item }) => (
                    <View style={styles.categoryPage}>
                      {item.map((cat) => (
                        <TouchableOpacity
                          key={cat.categoryId}
                          activeOpacity={0.85}
                          style={styles.categoryItem}
                          onPress={() => {
                            console.log(
                              "🔶 CATEGORY PRESSED:",
                              cat.categoryId,
                              cat.name
                            );
                            console.log(
                              "🔶 Category data:",
                              JSON.stringify(cat, null, 2)
                            );
                            console.log("🔶 Navigating to CategoryProducts...");
                            navigation.navigate(
                              "CategoryProducts" as never,
                              {
                                categoryId: cat.categoryId,
                                categoryName: cat.name,
                              } as never
                            );
                          }}
                        >
                          <Image
                            source={{
                              uri:
                                cat.imageUrl ||
                                "https://via.placeholder.com/100",
                            }}
                            style={[
                              styles.categoryImage,
                              { backgroundColor: theme.lightBg },
                            ]}
                          />
                          <Text
                            style={[styles.categoryName, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />

                {/* Progress Bar for Categories - Like PC Scrollbar */}
                {pages.length > 1 && (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleScrollbarDrag}
                    style={[
                      styles.progressBarContainer,
                      {
                        width: width - 80,
                        backgroundColor: theme.lightBg,
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.progressBarThumb,
                        {
                          width:
                            ((width - 80) / (width * pages.length)) *
                            (width - 80),
                          backgroundColor: theme.primary,
                          transform: [
                            {
                              translateX: categoryProgressWidth,
                            },
                          ],
                        },
                      ]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Món hot trong tuần */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                  {t("hotThisWeek")}
                </Text>
              </View>
              <View style={styles.card}>
                <FlatList
                  data={hotProducts.slice(0, 5)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ProductCard
                      item={item}
                      onPress={() => {
                        console.log(
                          "🟡 PRODUCT CARD PRESSED:",
                          item.id,
                          item.name
                        );
                        console.log(
                          "🟡 Product data:",
                          JSON.stringify(item, null, 2)
                        );
                        console.log("🟡 Navigating to ProductDetail...");
                        navigation.navigate(
                          "ProductDetail" as never,
                          { product: item } as never
                        );
                      }}
                    />
                  )}
                  scrollEnabled={false}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* AI ChatBot Floating Button */}
      <TouchableOpacity
        style={styles.aiFloatingButton}
        onPress={() => {
          const parentNav = (navigation as any).getParent?.();
          if (parentNav) {
            parentNav.navigate("ChatBot");
          } else {
            (navigation as any).navigate("ChatBot");
          }
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.aiGradient as any}
          style={styles.aiButtonGradient}
        >
          <Ionicons name="sparkles" size={28} color="#FFF" />
        </LinearGradient>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header chào */
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  helloText: { fontSize: 14 },
  appName: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 4 },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 6 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },

  /* Section */
  section: { marginTop: 8, paddingHorizontal: 20, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  clearHistoryText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* Card chung */
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  bannerWrap: { marginBottom: 10 },

  /* Categories */
  categoryPage: {
    width: width - 40, // trừ padding card
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  categoryItem: {
    width: ITEM_SIZE,
    alignItems: "center",
    marginBottom: 12,
  },
  categoryImage: {
    width: ITEM_SIZE - 8,
    height: ITEM_SIZE - 8,
    borderRadius: 14,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Search mode: History + Suggestions */
  historyList: { flexDirection: "row", flexWrap: "wrap" },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  historyText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "500",
  },

  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 6,
  },
  hotItem: {
    width: (width - 80) / 4,
    alignItems: "center",
    marginBottom: 14,
  },
  hotImage: {
    width: (width - 80) / 4 - 10,
    height: (width - 80) / 4 - 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  hotName: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  progressBarContainer: {
    marginTop: 6,
    height: 3,
    borderRadius: 1.5,
    alignSelf: "center",
  },
  progressBarThumb: {
    height: "100%",
    borderRadius: 1.5,
  },
  progressBarBackground: {
    height: "100%",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
  },

  // AI Floating Button
  aiFloatingButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  aiBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  aiBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});
