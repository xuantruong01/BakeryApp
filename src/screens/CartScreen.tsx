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

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
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

        const totalPrice = filteredItems.reduce(
          (sum, item) => sum + parseInt(item.price) * item.quantity,
          0
        );
        setTotal(totalPrice);
      } catch (error) {
        console.error("🔥 Lỗi khi lấy giỏ hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", fetchCart);
    return unsubscribe;
  }, [navigation]);

  const updateQuantity = async (item: any, delta: number) => {
    try {
      const newQty = item.quantity + delta;
      if (newQty < 1) return;

      const prodRef = doc(db, "products", item.id);
      const prodSnap = await getDoc(prodRef);
      const stock = prodSnap.exists() ? prodSnap.data().stock ?? 0 : 0;

      if (newQty > stock) {
        Alert.alert(
          "⚠️ Vượt quá tồn kho",
          `Chỉ còn ${stock} sản phẩm trong kho.`
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
      setTotal((prev) => prev + delta * parseInt(item.price));
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật số lượng:", error);
    }
  };

  const removeItem = async (item: any) => {
    Alert.alert("Xóa sản phẩm", `Xóa "${item.name}" khỏi giỏ hàng?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const userJson = await AsyncStorage.getItem("user");
            const user = userJson ? JSON.parse(userJson) : null;
            if (!user?.uid) return;

            const itemRef = doc(db, "carts", user.uid, "items", item.id);
            await deleteDoc(itemRef);

            setCartItems((prev) => prev.filter((i) => i.id !== item.id));
            setTotal((prev) => prev - item.quantity * parseInt(item.price));
          } catch (error) {
            console.error("❌ Lỗi khi xóa sản phẩm:", error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#924900" />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = cartItems.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
            <Text style={styles.headerSubtitle}>
              Kiểm tra lại trước khi đặt món nhé!
            </Text>
          </View>
          <View style={styles.headerIconCircle}>
            <Ionicons name="cart" size={26} color="#fff" />
          </View>
        </View>

        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={60} color="#C06000" />
            </View>
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptySubtitle}>
              Hãy thêm vài chiếc bánh ngon vào giỏ nhé 🍰
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.emptyButtonText}>Tiếp tục mua sắm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <Image
                    source={{
                      uri:
                        item.imageUrl || "https://via.placeholder.com/100",
                    }}
                    style={styles.itemImage}
                  />

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {parseInt(item.price).toLocaleString()}đ
                    </Text>
                    {item.stock === 0 ? (
                      <Text style={styles.outOfStockText}>Hết hàng</Text>
                    ) : (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            item.quantity <= 1 && styles.qtyBtnDisabled,
                          ]}
                          onPress={() => updateQuantity(item, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.qtyNumber}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            item.quantity >= item.stock && styles.qtyBtnDisabled,
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
            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.footerLabel}>Tổng cộng</Text>
                  <Text style={styles.footerTotal}>
                    {total.toLocaleString()}đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => navigation.navigate("Checkout")}
                >
                  <Ionicons
                    name="bag-check-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.checkoutText}>Đặt hàng ngay</Text>
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
  safeArea: { flex: 1, backgroundColor: "#FFF5E6" },
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
    color: "#924900",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8C7A5A",
    marginTop: 3,
  },
  headerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#C06000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#924900",
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
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#924900",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#7A6A50",
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
    borderColor: "#F1D9BD",
  },
  itemImage: { width: 78, height: 78, borderRadius: 12, marginRight: 12 },
  itemInfo: { flex: 1, justifyContent: "space-between" },
  itemName: { fontWeight: "700", fontSize: 16, color: "#3E2B1C" },
  itemPrice: {
    color: "#C06000",
    fontWeight: "700",
    marginTop: 4,
    fontSize: 15,
  },
  outOfStockText: {
    color: "#E74C3C",
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
    backgroundColor: "#C06000",
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: {
    backgroundColor: "#E5C9A4",
  },
  qtyBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  qtyNumber: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#3E2B1C",
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
    backgroundColor: "#FFF5E6",
    borderTopWidth: 1,
    borderTopColor: "#E6CDA9",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontSize: 13,
    color: "#8C7A5A",
    marginBottom: 2,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#924900",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C06000",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
