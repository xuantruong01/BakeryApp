import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  StyleSheet,
  Alert,
  ToastAndroid,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [loading, setLoading] = useState(false);

  // State lưu lỗi từng trường
  const [errors, setErrors] = useState({});

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
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#924900" />
      </TouchableOpacity>

      <Text style={styles.title}>Tạo tài khoản mới</Text>

      {/* Full Name */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            errors.fullName ? styles.inputError : null
          ]}
          placeholder="Nhập họ và tên"
          value={fullName}
          onChangeText={setFullName}
          onBlur={() => handleBlur("fullName", fullName)}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* Email */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            errors.email ? styles.inputError : null
          ]}
          placeholder="Nhập Gmail"
          value={email}
          onChangeText={setEmail}
          onBlur={() => handleBlur("email", email)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* Phone */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            errors.phone ? styles.inputError : null
          ]}
          placeholder="Nhập số điện thoại"
          value={phone}
          onChangeText={setPhone}
          onBlur={() => handleBlur("phone", phone)}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            errors.password ? styles.inputError : null
          ]}
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          onBlur={() => handleBlur("password", password)}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      {/* Re-Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            errors.rePassword ? styles.inputError : null
          ]}
          placeholder="Nhập lại mật khẩu"
          value={rePassword}
          onChangeText={setRePassword}
          onBlur={() => handleBlur("rePassword", rePassword)}
          secureTextEntry
        />
        {errors.rePassword && <Text style={styles.errorText}>{errors.rePassword}</Text>}
      </View>

      <View style={{ width: "80%", marginTop: 15 }}>
        <Button
          title={loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          onPress={handleSignUp}
          color="#924900"
          disabled={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text>Đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#924900",
  },
  inputWrapper: {
    width: "80%",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: 3,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#924900",
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
});
