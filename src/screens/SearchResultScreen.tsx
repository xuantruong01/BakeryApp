import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  CommonActions,
} from "@react-navigation/native";
import ProductCard from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";

/* ---------- Types ---------- */
type Product = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  stock?: number;
};

/* ---------- Helpers ---------- */
function normalizeVN(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function relevanceScore(p: Product, q: string) {
  const name = normalizeVN(p.name || "");
  const desc = normalizeVN(p.description || "");
  if (!q) return 0;
  if (name.startsWith(q)) return 3;
  if (name.includes(q)) return 2;
  if (desc.includes(q)) return 1;
  return 0;
}

/* ---------- Main Screen ---------- */
export default function SearchResultScreen() {
  const { theme, t } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { term, results: initialResults } = (route.params || {}) as {
    term: string;
    results: Product[];
  };

  const [search, setSearch] = useState(term || "");
  const [sortBy, setSortBy] = useState<
    "relevance" | "priceAsc" | "priceDesc" | "nameAsc"
  >("relevance");

  const q = normalizeVN(search);

  // lọc realtime trên danh sách ban đầu (initialResults)
  const filtered = useMemo(() => {
    let list = [...(initialResults || [])];
    if (q) {
      list = list.filter(
        (p) =>
          normalizeVN(p.name || "").includes(q) ||
          normalizeVN(p.description || "").includes(q)
      );
    }

    switch (sortBy) {
      case "priceAsc":
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case "priceDesc":
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case "nameAsc":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      default:
        return list.sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q));
    }
  }, [initialResults, q, sortBy]);

  const handleSearch = () => {
    // Ở màn này chỉ lọc trên dữ liệu có sẵn (realtime)
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ----- Thanh tìm kiếm ----- */}
      <View style={styles.searchBar}>
        <TouchableOpacity
          onPress={() => {
            // Quay về Home (MainTabs -> Home) + reset search ở Home
            navigation.dispatch(
              CommonActions.navigate({
                name: "MainTabs",
                params: {
                  screen: "Home",
                  params: { resetSearch: true, ts: Date.now() },
                },
              })
            );
          }}
          style={styles.iconLeft}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <TextInput
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={theme.text + "80"}
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <TouchableOpacity onPress={handleSearch} style={styles.iconRight}>
          <Ionicons name="search" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* ----- Thanh sắp xếp ----- */}
      <View style={[styles.toolbar, { backgroundColor: theme.background }]}>
        <Text style={[styles.filterLabel, { color: theme.text }]}>
          {t("sortBy")}:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.chipsContainer}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {[
            { key: "relevance", label: t("sortBy") },
            { key: "priceAsc", label: t("priceAsc") },
            { key: "priceDesc", label: t("priceDesc") },
            { key: "nameAsc", label: t("nameAsc") },
          ].map((opt) => {
            const active = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() =>
                  setSortBy(
                    opt.key as
                      | "relevance"
                      | "priceAsc"
                      | "priceDesc"
                      | "nameAsc"
                  )
                }
                style={[
                  styles.chip,
                  active && [
                    styles.chipActive,
                    { backgroundColor: theme.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={[styles.resultCount, { color: theme.text }]}>
          {filtered.length} {t("product")}
        </Text>
      </View>

      {/* ----- Danh sách kết quả ----- */}
      <FlatList
        contentContainerStyle={{ paddingBottom: 100 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() =>
              (navigation as any).navigate("ProductDetail", { product: item })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={32} color="#bbb" />
            <Text style={{ color: "#777", marginTop: 6 }}>
              Không tìm thấy sản phẩm phù hợp.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/* ---------- Chip group cho Sort ---------- */
function ScrollChip({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.chip,
              active && [styles.chipActive, { backgroundColor: theme.primary }],
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },

  /* Thanh tìm kiếm */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    marginBottom: 12,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 6 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },

  /* Thanh sắp xếp */
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  chipActive: {
    backgroundColor: "#E58E26",
    borderColor: "#E58E26",
  },
  chipText: { color: "#666", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  resultCount: { fontSize: 13, color: "#999", fontWeight: "500", marginTop: 8 },

  empty: { alignItems: "center", marginTop: 60 },
});
