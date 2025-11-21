import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  // State cho modal quên mật khẩu
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

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

      // Kiểm tra role từ Firestore
      let userRole = "user";
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Kiểm tra xem có field role không, nếu không có thì kiểm tra email
          if (userData.role) {
            userRole = userData.role;
          } else if (userData.email === "admin@gmail.com") {
            userRole = "admin";
          }
        } else {
          // Nếu không tìm thấy trong Firestore, kiểm tra email
          if (email === "admin@gmail.com") {
            userRole = "admin";
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        // Fallback: kiểm tra email
        if (email === "admin@gmail.com") {
          userRole = "admin";
        }
      }

      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ uid: user.uid, email: user.email })
      );
      await AsyncStorage.setItem("userRole", userRole);

      // Đợi một chút để AsyncStorage lưu xong
      await new Promise((resolve) => setTimeout(resolve, 100));

      Alert.alert(
        "✅ Thành công",
        `Đăng nhập thành công${
          userRole === "admin" ? " với tư cách Admin" : ""
        }!`
      );

      // Reset về MainTabs, AppNavigator sẽ tự động render đúng component dựa vào role
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error) {
      Alert.alert("❌ Lỗi", "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý quên mật khẩu
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email của bạn");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert(
        "✅ Thành công",
        "Link đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!",
        [
          {
            text: "OK",
            onPress: () => {
              setForgotModalVisible(false);
              setResetEmail("");
            },
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại!";
      if (error.code === "auth/user-not-found") {
        errorMessage = "Email này chưa được đăng ký!";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email không hợp lệ!";
      }
      Alert.alert("❌ Lỗi", errorMessage);
    } finally {
      setResetLoading(false);
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
          {/* Nút back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Ionicons name="arrow-back" size={28} color="#924900" />
          </TouchableOpacity>

          {/* Icon bánh mì đẹp */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="cafe" size={60} color="#924900" />
            </View>
          </View>

          <Text style={styles.title}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#924900"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#999"
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
            </View>
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#924900"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  errors.password ? styles.inputError : null,
                ]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#999"
                value={password}
                secureTextEntry={!showPass}
                onChangeText={(t) => {
                  setPassword(t);
                  errors.password && setErrors({ ...errors, password: "" });
                }}
                onBlur={() => {
                  if (!password.trim())
                    setErrors((e) => ({
                      ...e,
                      password: "Vui lòng nhập mật khẩu",
                    }));
                }}
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
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Nút đăng nhập */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
            onPress={handleLogin}
          >
            <LinearGradient
              colors={["#C06000", "#924900", "#6B3600"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginTextBtn}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Hoặc */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.divider} />
          </View>

          {/* Chuyển sang đăng ký */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.signupText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal quên mật khẩu */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={forgotModalVisible}
          onRequestClose={() => {
            setForgotModalVisible(false);
            setResetEmail("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quên mật khẩu</Text>
                <TouchableOpacity
                  onPress={() => {
                    setForgotModalVisible(false);
                    setResetEmail("");
                  }}
                >
                  <Ionicons name="close-circle" size={28} color="#924900" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
              </Text>

              <View style={styles.modalInputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color="#924900"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#999"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, resetLoading && { opacity: 0.6 }]}
                disabled={resetLoading}
                onPress={handleForgotPassword}
              >
                <LinearGradient
                  colors={["#C06000", "#924900", "#6B3600"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.modalButtonText}>
                    {resetLoading ? "Đang gửi..." : "Gửi link đặt lại"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
    marginBottom: 30,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
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
    marginTop: 6,
    fontSize: 13,
    marginLeft: 4,
  },
  eyeIcon: {
    padding: 5,
  },
  loginBtn: {
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
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 25,
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
  signupText: {
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#924900",
  },
  modalDescription: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 15,
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  modalButton: {
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
