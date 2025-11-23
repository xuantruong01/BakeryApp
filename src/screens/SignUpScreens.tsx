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
import { useApp } from "../contexts/AppContext";

const SignUpScreen = ({ navigation }) => {
  const { theme, t } = useApp();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showRePass, setShowRePass] = useState(false);

  // State lưu lỗi từng trường
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  // Hàm kiểm tra rỗng từng trường khi blur
  const handleBlur = (field, value) => {
    if (!value.trim()) {
      const errorMessages = {
        fullName: t("fullNameRequired"),
        email: t("emailRequired"),
        phone: t("phoneRequired"),
        password: t("passwordRequired"),
        rePassword: t("passwordRequired"),
      };
      setErrors((prev) => ({
        ...prev,
        [field]: errorMessages[field] || t("fieldRequired"),
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSignUp = async () => {
    // Kiểm tra lỗi
    if (
      !email.trim() ||
      !fullName.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !rePassword.trim()
    ) {
      Alert.alert(t("signUpError"), t("fillAllFields"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("signUpError"), t("emailInvalid"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t("signUpError"), t("passwordTooShort"));
      return;
    }

    if (password !== rePassword) {
      Alert.alert(t("signUpError"), t("passwordsNotMatch"));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        fullname: fullName,
        phoneNumber: phone,
        createdAt: new Date(),
      });

      Alert.alert("✅ " + t("signUpSuccess"), t("signUpSuccess"));
      navigation.navigate("Login");
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = t("signUpError");
      if (error.code === "auth/email-already-in-use") {
        errorMessage = t("emailAlreadyInUse");
      } else if (error.code === "auth/invalid-email") {
        errorMessage = t("emailInvalid");
      } else if (error.code === "auth/weak-password") {
        errorMessage = t("passwordTooShort");
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = t("networkError");
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = t("tooManyRequests");
      }
      Alert.alert("❌ " + t("signUpError"), errorMessage);
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
        colors={[theme.lightBg, theme.background, theme.lightBg]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          {/* Icon đăng ký */}
          <View style={styles.iconContainer}>
            <View
              style={[styles.iconCircle, { backgroundColor: theme.lightBg }]}
            >
              <Ionicons name="person-add" size={60} color={theme.primary} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("signUpButton")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            {t("signUpToStart")}
          </Text>

          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <View
              style={[styles.inputContainer, { borderColor: theme.primary }]}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text },
                  errors.fullName ? styles.inputError : null,
                ]}
                placeholder={t("enterFullName")}
                placeholderTextColor={theme.text + "80"}
                value={fullName}
                onChangeText={setFullName}
                onBlur={() => handleBlur("fullName", fullName)}
              />
            </View>
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <View
              style={[styles.inputContainer, { borderColor: theme.primary }]}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text },
                  errors.email ? styles.inputError : null,
                ]}
                placeholder={t("enterEmail")}
                placeholderTextColor={theme.text + "80"}
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur("email", email)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.inputWrapper}>
            <View
              style={[styles.inputContainer, { borderColor: theme.primary }]}
            >
              <Ionicons
                name="call-outline"
                size={22}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text },
                  errors.phone ? styles.inputError : null,
                ]}
                placeholder={t("enterPhone")}
                placeholderTextColor={theme.text + "80"}
                value={phone}
                onChangeText={setPhone}
                onBlur={() => handleBlur("phone", phone)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <View
              style={[styles.inputContainer, { borderColor: theme.primary }]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text },
                  errors.password ? styles.inputError : null,
                ]}
                placeholder={t("enterPassword")}
                placeholderTextColor={theme.text + "80"}
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
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Re-Password */}
          <View style={styles.inputWrapper}>
            <View
              style={[styles.inputContainer, { borderColor: theme.primary }]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text },
                  errors.rePassword ? styles.inputError : null,
                ]}
                placeholder={t("enterConfirmPassword")}
                placeholderTextColor={theme.text + "80"}
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
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
            {errors.rePassword && (
              <Text style={styles.errorText}>{errors.rePassword}</Text>
            )}
          </View>

          {/* Nút đăng ký */}
          <TouchableOpacity
            style={[styles.signupBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
            onPress={handleSignUp}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.signupTextBtn}>
                {loading ? t("signingUp") : t("signUpButton")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View
              style={[styles.divider, { backgroundColor: theme.text + "30" }]}
            />
            <Text style={[styles.dividerText, { color: theme.text }]}>
              {t("or")}
            </Text>
            <View
              style={[styles.divider, { backgroundColor: theme.text + "30" }]}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.text }]}>
              {t("alreadyHaveAccount")}{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.replace("Login")}>
              <Text style={[styles.loginText, { color: theme.primary }]}>
                {t("loginButton")}
              </Text>
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
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    borderRadius: 15,
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
    shadowColor: "#000",
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
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
  },
  loginText: {
    fontWeight: "bold",
    fontSize: 15,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    borderRadius: 25,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
