import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./services/firebaseConfig" // 🔥 đường dẫn quan trọng

const App = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(data);
      } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E58E26" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍰 Danh sách sản phẩm</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={{ width: 120, height: 120, borderRadius: 10 }}
  resizeMode="cover"/>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{item.price} VNĐ</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: { width: "90%", backgroundColor: "#f8f8f8", padding: 15, borderRadius: 8, marginVertical: 5 },
  name: { fontSize: 18, fontWeight: "600" },
  price: { color: "#E58E26", fontWeight: "bold" },
});
