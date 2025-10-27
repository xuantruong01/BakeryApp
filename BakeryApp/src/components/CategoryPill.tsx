import React from "react";
import { Animated, View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  name: string;
  imageUrl?: string;
  onPress?: () => void;
  scale?: Animated.AnimatedInterpolation<number>;
};

const CategoryPill = ({ name, imageUrl, onPress, scale}: Props) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.wrap, { transform: [{ scale }] }]}>
      <View style={styles.content}>
        {!!imageUrl && <Image source={{ uri: imageUrl }} style={styles.avatar} />}
        <Text numberOfLines={1} style={styles.name}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryPill;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  content: { flexDirection: "row", alignItems: "center", maxWidth: 160 },
  avatar: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  name: { fontSize: 14, fontWeight: "600" },
});
