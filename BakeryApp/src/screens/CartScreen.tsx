import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CartScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🛒 Giỏ hàng trống</Text>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, fontWeight: "500" },
});
