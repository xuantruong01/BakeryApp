import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showRePass, setShowRePass] = useState(false);

  // State lưu lỗi từng trường
  const [errors, setErrors] = useState<{[key: string]: string | null}>({});

  // Hàm kiểm tra rỗng từng trường khi blur
  const handleBlur = (field, value) => {
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "Không được để trống!" }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSignUp = async () => {
    // Kiểm tra lỗi
    if (!email.trim() || !fullName.trim() || !phone.trim() || !password.trim() || !rePassword.trim()) {
      ToastAndroid.show("Vui lòng nhập đầy đủ thông tin!", ToastAndroid.SHORT);
      return;
    }

    if (password !== rePassword) {
      ToastAndroid.show("Mật khẩu nhập lại không khớp!", ToastAndroid.SHORT);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        fullname: fullName,
        phoneNumber: phone,
        createdAt: new Date(),
      });

      Alert.alert("Đăng ký thành công!");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      Alert.alert("Đăng ký thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#FFF5E6", "#FFE8CC", "#FFFFFF"]}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#924900" />
          </TouchableOpacity>

          {/* Icon đăng ký */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={60} color="#924900" />
            </View>
          </View>

          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Đăng ký để bắt đầu mua sắm</Text>

          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color="#924900" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  errors.fullName ? styles.inputError : null
                ]}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                onBlur={() => handleBlur("fullName", fullName)}
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#924900" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  errors.email ? styles.inputError : null
                ]}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur("email", email)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={22} color="#924900" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  errors.phone ? styles.inputError : null
                ]}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                onBlur={() => handleBlur("phone", phone)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#924900" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  errors.password ? styles.inputError : null
                ]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur("password", password)}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity 
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#924900"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Re-Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#924900" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  errors.rePassword ? styles.inputError : null
                ]}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#999"
                value={rePassword}
                onChangeText={setRePassword}
                onBlur={() => handleBlur("rePassword", rePassword)}
                secureTextEntry={!showRePass}
              />
              <TouchableOpacity 
                onPress={() => setShowRePass(!showRePass)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showRePass ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#924900"
                />
              </TouchableOpacity>
            </View>
            {errors.rePassword && <Text style={styles.errorText}>{errors.rePassword}</Text>}
          </View>

          {/* Nút đăng ký */}
          <TouchableOpacity
            style={[styles.signupBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
            onPress={handleSignUp}
          >
            <LinearGradient
              colors={["#C06000", "#924900", "#6B3600"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.signupTextBtn}>
                {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.replace("Login")}>
              <Text style={styles.loginText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#924900",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 15,
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#FF4444",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  eyeIcon: {
    padding: 5,
  },
  signupBtn: {
    width: "100%",
    borderRadius: 15,
    marginTop: 10,
    overflow: "hidden",
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  signupTextBtn: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#999",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    color: "#666",
  },
  loginText: {
    color: "#924900",
    fontWeight: "bold",
    fontSize: 15,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
