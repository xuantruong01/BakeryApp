import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const AccountScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔍 Kiểm tra trạng thái đăng nhập mỗi khi màn hình được focus
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra login:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", checkLoginStatus);
    return unsubscribe;
  }, [navigation]);

  // 🚪 Đăng xuất
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  // ⏳ Loading
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#924900" />
      </View>
    );
  }

  // 🧭 Giao diện chính
  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Ionicons name="person-circle-outline" size={100} color="#924900" />
          <Text style={styles.username}>
            👋 Xin chào, {user.username || user.email}
          </Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
          <Text style={styles.text}>Bạn chưa đăng nhập</Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              navigation.navigate("Login", { redirectTo: "Account" })
            }
          >
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() =>
              navigation.navigate("SignUp", { redirectTo: "Account" })
            }
          >
            <Text style={styles.buttonText}>Đăng ký</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  username: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 30,
  },
  text: {
    fontSize: 18,
    color: "#555",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#924900",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 10,
  },
  signupButton: {
    backgroundColor: "#d4a574",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  logoutButton: {
    backgroundColor: "#b93c3c",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
