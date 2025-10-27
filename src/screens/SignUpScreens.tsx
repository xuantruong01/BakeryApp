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

  const handleSignUp = async () => {
    // Kiểm tra rỗng
    if (
      !email.trim() ||
      !fullName.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !rePassword.trim()
    ) {
      ToastAndroid.show("Vui lòng nhập đầy đủ thông tin!", ToastAndroid.SHORT);
      return;
    }

    // Kiểm tra mật khẩu khớp
    if (password !== rePassword) {
      ToastAndroid.show("Mật khẩu nhập lại không khớp!", ToastAndroid.SHORT);
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      // Đăng ký Firebase
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

      ToastAndroid.show("Đăng ký thành công!", ToastAndroid.SHORT);
      navigation.replace("Login"); // Chuyển sang màn hình đăng nhập
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      Alert.alert("Đăng ký thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Nút quay lại */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#924900" />
      </TouchableOpacity>

      <Text style={styles.title}>Tạo tài khoản mới</Text>

      {/* Ô nhập tên */}
      <TextInput
        style={styles.input}
        placeholder="Nhập họ và tên"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Ô nhập email */}
      <TextInput
        style={styles.input}
        placeholder="Nhập Gmail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Ô nhập số điện thoại */}
      <TextInput
        style={styles.input}
        placeholder="Nhập số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {/* Ô nhập mật khẩu */}
      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Ô nhập lại mật khẩu */}
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        value={rePassword}
        onChangeText={setRePassword}
        secureTextEntry
      />

      {/* Nút đăng ký */}
      <View style={{ width: "80%", marginTop: 20 }}>
        <Button
          title={loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          onPress={handleSignUp}
          color="#924900"
          disabled={loading}
        />
      </View>

      {/* Chuyển sang đăng nhập */}
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
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
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
