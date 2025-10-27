import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { db } from "../services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const CartScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
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
        console.log("UID người dùng:", user?.uid);

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

    fetchCart();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#924900" />
      </View>
    );
  }

  return (
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
                <Text style={styles.name}>{item.name}</Text>
                <Text>Số lượng: {item.quantity}</Text>
                <Text>Giá: {parseInt(item.price).toLocaleString()}đ</Text>
              </View>
            )}
          />
          <View style={styles.total}>
            <Text style={styles.totalText}>
              Tổng cộng: {total.toLocaleString()}đ
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { fontSize: 18, textAlign: "center", marginTop: 40 },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
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
});
