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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function CartScreen() {
  const navigation = useNavigation();
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

        setCartItems(items);

        const totalPrice = items.reduce(
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

    // Lắng nghe khi màn hình được focus lại
    const unsubscribe = navigation.addListener("focus", fetchCart);
    return unsubscribe;
  }, [navigation]);

  // 🧮 Cập nhật số lượng
  const updateQuantity = async (item: any, delta: number) => {
    try {
      if (item.quantity + delta < 1) return;

      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user?.uid) return;

      const itemRef = doc(db, "carts", user.uid, "items", item.id);
      const newQty = item.quantity + delta;
      await updateDoc(itemRef, { quantity: newQty });

      setCartItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
      );
      setTotal((prev) => prev + delta * parseInt(item.price));
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật số lượng:", error);
    }
  };

  // 🗑 Xóa sản phẩm
  const removeItem = async (item: any) => {
    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc muốn xóa "${item.name}" khỏi giỏ hàng?`,
      [
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
      ]
    );
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {cartItems.length === 0 ? (
          <Text style={styles.text}>🛒 Giỏ hàng trống</Text>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Image
                    source={{
                      uri: item.imageUrl || "https://via.placeholder.com/100",
                    }}
                    style={styles.itemImage}
                  />

                  <View style={styles.itemInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>
                      {parseInt(item.price).toLocaleString()}đ
                    </Text>

                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item, -1)}
                      >
                        <Text style={styles.qtyText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.qtyNumber}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item, +1)}
                      >
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                    </View>
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

            {/* Tổng cộng + Nút đặt hàng */}
            <View style={styles.total}>
              <Text style={styles.totalText}>
                Tổng cộng: {total.toLocaleString()}đ
              </Text>

              {cartItems.length > 0 && (
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => navigation.navigate("Checkout")}
                >
                  <Text style={styles.checkoutText}>🛍 Đặt hàng ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  price: {
    color: "#E58E26",
    fontWeight: "600",
    marginTop: 2,
    fontSize: 15,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBtn: {
    backgroundColor: "#E58E26",
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  qtyNumber: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteBtn: {
    paddingHorizontal: 6,
  },
  total: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#ccc",
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    color: "#924900",
  },
  checkoutBtn: {
    marginTop: 10,
    backgroundColor: "#E58E26",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
