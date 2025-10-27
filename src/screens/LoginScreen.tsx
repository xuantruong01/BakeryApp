import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const route = useRoute();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ uid: user.uid, email: user.email })
      );

      const redirectTo = route.params?.redirectTo || "MainTabs";

      // 🧭 Điều hướng linh hoạt
      if (redirectTo === "Cart" || redirectTo === "Account") {
        navigation.navigate("MainTabs", { screen: redirectTo });
      } else if (redirectTo === "MainTabs") {
        navigation.navigate("MainTabs");
      } else {
        navigation.navigate(redirectTo);
      }

      Alert.alert("✅ Thành công", "Đăng nhập thành công!");
    } catch (error: any) {
      console.error("❌ Lỗi đăng nhập:", error.message);
      Alert.alert("Đăng nhập thất bại", "Sai Gmail hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = async () => {
    await AsyncStorage.removeItem("user");
    navigation.navigate("MainTabs");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackHome}>
        <Text style={styles.backText}>⬅ Quay lại Trang chủ</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Đăng nhập</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập Gmail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={() => alert("Tính năng đang phát triển!")}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <View style={{ width: "80%", marginTop: 10 }}>
        <Button
          title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
          onPress={handleLogin}
          color="#924900"
          disabled={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text>Bạn chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.signupText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#924900",
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  forgotText: {
    alignSelf: "flex-end",
    marginRight: "10%",
    fontSize: 14,
    color: "#924900",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  signupText: {
    color: "#924900",
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  backText: {
    fontSize: 16,
    color: "#924900",
    fontWeight: "500",
  },
});
