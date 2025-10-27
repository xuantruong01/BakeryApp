import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const CartScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const user = await AsyncStorage.getItem("user");
      if (!user) {
        // Điều hướng ra ngoài Tab sang màn hình Login
        navigation.navigate("Login");
      }
      setLoading(false);
    };
    checkLogin();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#924900" />
      </View>
    );
  }

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
