import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
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
      <View style={styles.toolbar}>
        <ScrollChip
          options={[
            { key: "relevance", label: t("sortBy") },
            { key: "priceAsc", label: t("priceAsc") },
            { key: "priceDesc", label: t("priceDesc") },
            { key: "nameAsc", label: t("nameAsc") },
          ]}
          value={sortBy}
          onChange={(v) =>
            setSortBy(v as "relevance" | "priceAsc" | "priceDesc" | "nameAsc")
          }
        />
        <Text style={[styles.resultCount, { color: theme.text }]}>
          {filtered.length} sản phẩm
        </Text>
      </View>

      {/* ----- Danh sách kết quả ----- */}
      <FlatList
        contentContainerStyle={{ paddingBottom: 20 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() =>
              (
                navigation.getParent("rootStack") ??
                navigation.getParent()?.getParent()
              )?.navigate("ProductDetail", { product: item })
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
  safe: { flex: 1 },

  /* Thanh tìm kiếm */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 6 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8 },

  /* Thanh sắp xếp */
  toolbar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chips: { flexDirection: "row", gap: 8, marginBottom: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  chipActive: {},
  chipText: { color: "#333", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  resultCount: { fontSize: 13, color: "#555", fontWeight: "500" },

  empty: { alignItems: "center", marginTop: 40 },
});
