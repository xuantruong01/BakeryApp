import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";

const { width } = Dimensions.get("window");

type Banner = {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
};

type Props = {
  data: Banner[];
  onPressItem?: (item: Banner) => void;
};

const BannerCarousel = ({ data, onPressItem }: Props) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.wrap}>
      <Animated.FlatList
        data={data}
        keyExtractor={(it) => it.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(ev) => {
          const i = Math.round(ev.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPressItem?.(item)}
          >
            <View style={styles.slide}>
              <Image
                source={{ uri: item.imageUrl || "https://via.placeholder.com/600" }}
                style={styles.image}
              />
              <View style={styles.overlay}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.price != null && (
                  <Text style={styles.price}>
                    {item.price.toLocaleString()} VNĐ
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Dots indicator */}
      <View style={styles.dots}>
        {data.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

export default BannerCarousel;

const styles = StyleSheet.create({
  wrap: { width, height: 200, marginBottom: 10 },
  slide: {
    width,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: width - 32, height: 180, borderRadius: 14 },
  overlay: {
    position: "absolute",
    left: 24,
    bottom: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 16 },
  price: { color: "#FFD166", fontWeight: "700", marginTop: 2 },
  dots: {
    position: "absolute",
    bottom: 8,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#E58E26",
    width: 18,
  },
});
