import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

const ProductCard = ({ item }: any) => {
  return (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{item.price} VNĐ</Text>
    </TouchableOpacity>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 8,
    padding: 10,
    elevation: 3,
  },
  image: { width: "100%", height: 160, borderRadius: 8 },
  name: { fontSize: 18, fontWeight: "600", marginTop: 5 },
  price: { color: "#E58E26", fontWeight: "bold", marginTop: 2 },
});
