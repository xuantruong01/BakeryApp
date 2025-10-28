import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({ email: "", password: "" });

  const route = useRoute();

  const validate = () => {
    let valid = true;
    let newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      valid = false;
    }
    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
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

      Alert.alert("✅ Thành công", "Đăng nhập thành công!");

      const redirectTo = route.params?.redirectTo || "MainTabs";
      navigation.navigate("MainTabs", { screen: redirectTo });
    } catch (error) {
      Alert.alert("❌ Lỗi", "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* nút back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("MainTabs")}>
        <Ionicons name="arrow-back" size={28} color="#924900" />
      </TouchableOpacity>

      <Text style={styles.title}>Đăng nhập</Text>

      {/* Email */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="Nhập Gmail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            errors.email && setErrors({ ...errors, email: "" });
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          onBlur={() => {
            if (!email.trim())
              setErrors((e) => ({ ...e, email: "Vui lòng nhập email" }));
          }}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      {/* Password */}
      <View style={styles.inputWrapper}>
        <View style={styles.passRow}>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null, { flex: 1 }]}
            placeholder="Nhập mật khẩu"
            value={password}
            secureTextEntry={!showPass}
            onChangeText={(t) => {
              setPassword(t);
              errors.password && setErrors({ ...errors, password: "" });
            }}
            onBlur={() => {
              if (!password.trim())
                setErrors((e) => ({ ...e, password: "Vui lòng nhập mật khẩu" }));
            }}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? "eye-off" : "eye"}
              size={22}
              color="#924900"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>

      <TouchableOpacity onPress={() => alert("Tính năng đang phát triển!")}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      {/* Nút đăng nhập đẹp */}
      <TouchableOpacity
        style={[styles.loginBtn, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={handleLogin}
      >
        <Text style={styles.loginTextBtn}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Text>
      </TouchableOpacity>

      {/* Chuyển sang đăng ký */}
      <View style={styles.footer}>
        <Text>Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.signupText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

// ✅ Giao diện đẹp hơn – border, highlight, nút bo góc, màu chuẩn
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 25 },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#924900",
  },

  inputWrapper: { width: "100%", marginBottom: 12 },

  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  inputError: {
    borderColor: "red",
  },

  errorText: {
    color: "red",
    marginTop: 4,
    fontSize: 13,
    marginLeft: 4,
  },

  passRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  loginBtn: {
    width: "100%",
    padding: 14,
    backgroundColor: "#924900",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },

  loginTextBtn: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  forgotText: {
    alignSelf: "flex-end",
    fontSize: 14,
    color: "#924900",
    marginBottom: 10,
  },

  signupText: {
    color: "#924900",
    fontWeight: "bold",
  },

  footer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
});
