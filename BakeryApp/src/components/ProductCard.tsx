import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  item: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
  };
  onPress?: () => void;
};

const ProductCard = ({ item, onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {/* Hình ảnh bên trái */}
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/100" }}
        style={styles.image}
      />

      {/* Nội dung bên phải */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text style={styles.price}>{item.price?.toLocaleString()} VNĐ</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#f2f2f2",
  },
  info: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  desc: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#E58E26",
    marginTop: 6,
  },
});
