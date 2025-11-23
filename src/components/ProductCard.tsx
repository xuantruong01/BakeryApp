import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

type Props = {
  item: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    stock?: number; // ✅ thêm field stock
  };
  onPress?: () => void;
};

const ProductCard = ({ item, onPress }: Props) => {
  const isOutOfStock = item.stock === 0;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, isOutOfStock && { opacity: 0.6 }]} // làm mờ nếu hết hàng
      activeOpacity={0.85}
      onPress={!isOutOfStock ? onPress : undefined} // ✅ chặn bấm
    >
      <View style={styles.imageWrap}>
        {imageLoading && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="small" color="#E58E26" />
          </View>
        )}
        <Image
          source={{
            uri:
              imageError || !item.imageUrl
                ? "https://via.placeholder.com/100"
                : item.imageUrl,
          }}
          style={styles.image}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />

        {/* ✅ Hiển thị chữ “Hết hàng” đè lên ảnh */}
        {isOutOfStock && (
          <View style={styles.overlay}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
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
  imageWrap: {
    position: "relative",
    marginRight: 12,
  },
  imageLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    zIndex: 1,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  info: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#E58E26",
    marginTop: 6,
  },
});
