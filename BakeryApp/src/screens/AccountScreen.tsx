import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const AccountScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Nếu chưa đăng nhập → chuyển sang Login
          navigation.navigate("Login");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra login:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [navigation]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    navigation.navigate("Login"); // Quay lại trang chính sau khi đăng xuất
  };

  // Hiển thị loading khi đang kiểm tra login
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#924900" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.text}>👤 Xin chào, {user.username || user.email}!</Text>
          <Button title="Đăng xuất" onPress={handleLogout} color="#924900" />
        </>
      ) : (
        <Text style={styles.text}>Bạn chưa đăng nhập</Text>
      )}
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, fontWeight: "500", marginBottom: 20 },
});
