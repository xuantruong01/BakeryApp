// src/screens/CartScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { db } from "../services/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../contexts/AppContext";

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { theme, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        const user = userJson ? JSON.parse(userJson) : null;

        if (!user?.uid) {
          navigation.navigate("Login", { redirectTo: "Cart" });
          return;
        }

        const itemsRef = collection(db, "carts", user.uid, "items");
        const itemsSnap = await getDocs(itemsRef);
        const items = itemsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const updatedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const prodRef = doc(db, "products", item.id);
              const prodSnap = await getDoc(prodRef);
              const productData = prodSnap.exists() ? prodSnap.data() : null;
              const stock = productData?.stock ?? 0;

              let newQty = Math.min(item.quantity, stock);
              if (stock === 0) newQty = 0;

              if (newQty !== item.quantity) {
                const itemRef = doc(db, "carts", user.uid, "items", item.id);
                if (newQty === 0) await deleteDoc(itemRef);
                else await updateDoc(itemRef, { quantity: newQty });
              }

              return { ...item, stock, quantity: newQty };
            } catch (e) {
              console.warn("⚠️ Lỗi lấy stock:", e);
              return { ...item, stock: 0 };
            }
          })
        );

        const filteredItems = updatedItems.filter((i) => i.quantity > 0);
        setCartItems(filteredItems);
        // Auto-select all items on first load
        setSelectedItems(filteredItems.map((item) => item.id));
      } catch (error) {
        console.error("🔥 Lỗi khi lấy giỏ hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", fetchCart);
    return unsubscribe;
  }, [navigation]);

  // Recalculate total when selected items change
  useEffect(() => {
    const totalPrice = cartItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);
    setTotal(totalPrice);
  }, [selectedItems, cartItems]);

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  };

  const updateQuantity = async (item: any, delta: number) => {
    try {
      const newQty = item.quantity + delta;
      if (newQty < 1) return;

      const prodRef = doc(db, "products", item.id);
      const prodSnap = await getDoc(prodRef);
      const stock = prodSnap.exists() ? prodSnap.data().stock ?? 0 : 0;

      if (newQty > stock) {
        Alert.alert(
          `⚠️ ${t("exceedsStock")}`,
          `${t("onlyXInStock")} ${stock} ${t("inStock")}`
        );
        return;
      }

      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user?.uid) return;

      const itemRef = doc(db, "carts", user.uid, "items", item.id);
      await updateDoc(itemRef, { quantity: newQty });

      setCartItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
      );
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật số lượng:", error);
    }
  };

  const removeItem = async (item: any) => {
    Alert.alert(
      t("deleteProductFromCart"),
      `${t("confirmDelete")} "${item.name}" ${t("confirmRemoveFromCart")}`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("confirmDelete"),
          style: "destructive",
          onPress: async () => {
            try {
              const userJson = await AsyncStorage.getItem("user");
              const user = userJson ? JSON.parse(userJson) : null;
              if (!user?.uid) return;

              const itemRef = doc(db, "carts", user.uid, "items", item.id);
              await deleteDoc(itemRef);

              setCartItems((prev) => prev.filter((i) => i.id !== item.id));
              setSelectedItems((prev) => prev.filter((id) => id !== item.id));
            } catch (error) {
              console.error("❌ Lỗi khi xóa sản phẩm:", error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#924900" />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = cartItems.length === 0;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.primary }]}>
              {t("myCart")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.text }]}>
              {t("checkBeforeOrder")}
            </Text>
          </View>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons name="cart" size={26} color="#fff" />
          </View>
        </View>

        {/* SELECT ALL */}
        {!isEmpty && (
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <Ionicons
                name={
                  selectedItems.length === cartItems.length
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={theme.primary}
              />
              <Text style={[styles.selectAllText, { color: theme.text }]}>
                {t("selectAll")} ({selectedItems.length}/{cartItems.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={60} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.primary }]}>
              {t("emptyCart")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.text }]}>
              {t("emptyCartSubtitle")}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.emptyButtonText}>
                {t("continueShopping")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <View style={[styles.itemCard, { borderColor: theme.lightBg }]}>
                  <TouchableOpacity
                    onPress={() => toggleSelectItem(item.id)}
                    style={styles.checkbox}
                  >
                    <Ionicons
                      name={
                        selectedItems.includes(item.id)
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={24}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                  <Image
                    source={{
                      uri: item.imageUrl || "https://via.placeholder.com/100",
                    }}
                    style={styles.itemImage}
                  />

                  <View style={styles.itemInfo}>
                    <Text
                      style={[styles.itemName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: theme.primary }]}>
                      {parseInt(item.price).toLocaleString()}đ
                    </Text>
                    {item.stock === 0 ? (
                      <Text
                        style={[styles.outOfStockText, { color: "#E74C3C" }]}
                      >
                        {t("outOfStock")}
                      </Text>
                    ) : (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            { backgroundColor: theme.primary },
                            item.quantity <= 1 && styles.qtyBtnDisabled,
                          ]}
                          onPress={() => updateQuantity(item, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>

                        <Text style={[styles.qtyNumber, { color: theme.text }]}>
                          {item.quantity}
                        </Text>

                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            { backgroundColor: theme.primary },
                            item.quantity >= item.stock &&
                              styles.qtyBtnDisabled,
                          ]}
                          onPress={() => updateQuantity(item, +1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeItem(item)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* FOOTER TỔNG TIỀN */}
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: theme.background,
                  borderTopColor: theme.lightBg,
                },
              ]}
            >
              <View style={styles.footerRow}>
                <View>
                  <Text style={[styles.footerLabel, { color: theme.text }]}>
                    {t("totalAmount")}
                  </Text>
                  <Text style={[styles.footerTotal, { color: theme.primary }]}>
                    {total.toLocaleString()}đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.checkoutBtn,
                    { backgroundColor: theme.primary },
                    selectedItems.length === 0 && styles.checkoutBtnDisabled,
                  ]}
                  onPress={() => {
                    if (selectedItems.length === 0) {
                      Alert.alert(t("notification"), t("pleaseSelectProducts"));
                      return;
                    }
                    const selectedProducts = cartItems.filter((item) =>
                      selectedItems.includes(item.id)
                    );
                    navigation.navigate("Checkout", {
                      selectedItems: selectedProducts,
                    });
                  }}
                  disabled={selectedItems.length === 0}
                >
                  <Ionicons
                    name="bag-check-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.checkoutText}>{t("orderNow")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  headerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  /* Empty */
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#C06000",
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  /* Item card */
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  itemImage: { width: 78, height: 78, borderRadius: 12, marginRight: 12 },
  itemInfo: { flex: 1, justifyContent: "space-between" },
  itemName: { fontWeight: "700", fontSize: 16 },
  itemPrice: {
    fontWeight: "700",
    marginTop: 4,
    fontSize: 15,
  },
  outOfStockText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  qtyNumber: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  deleteBtn: { paddingHorizontal: 4 },

  /* Footer */
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: "bold",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  checkoutBtnDisabled: {
    opacity: 0.4,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Select All */
  selectAllContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },

  /* Checkbox */
  checkbox: {
    marginRight: 10,
    padding: 4,
  },
});
