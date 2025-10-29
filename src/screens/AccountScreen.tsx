import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const AccountScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false); // 👈 Modal xác nhận

  // 🔁 Lấy dữ liệu người dùng & địa chỉ mỗi khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      const fetchUserAndAddress = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (!storedUser) {
            setUser(null);
            setLoading(false);
            return;
          }

          const parsedUser = JSON.parse(storedUser);
          const userRef = doc(db, "users", parsedUser.uid);
          const userSnap = await getDoc(userRef);

          let userData = userSnap.exists()
            ? { uid: parsedUser.uid, ...userSnap.data() }
            : parsedUser;

          setUser(userData);

          // 🔹 Lấy địa chỉ từ Firestore
          const addressRef = doc(db, "addresses", parsedUser.uid);
          const addressSnap = await getDoc(addressRef);
          setAddress(addressSnap.exists() ? addressSnap.data() : null);
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserAndAddress();
    }, [])
  );

  // 🚪 Đăng xuất
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
    setAddress(null);
    setConfirmVisible(false);
    navigation.navigate("MainTabs");
  };

  // ⏳ Đang tải dữ liệu
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
            👋 Xin chào, {user.fullname || user.displayName || user.email}
          </Text>
          <Text style={styles.infoText}>
            📧 {user.email || "Chưa có email"}
          </Text>
          <Text style={styles.infoText}>
            📞 {user.phoneNumber || "Chưa có số điện thoại"}
          </Text>

          {/* --- Địa chỉ giao hàng --- */}
          {!address ? (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() =>
                navigation.navigate("AddAddress", { userId: user.uid })
              }
            >
              <Ionicons name="add-circle-outline" size={24} color="#924900" />
              <Text style={styles.addAddressText}>Thêm địa chỉ</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addressCard}>
              <Text style={styles.sectionTitle}>🏠 Địa chỉ giao hàng</Text>
              <Text style={styles.infoText}>👤 {address.name}</Text>
              <Text style={styles.infoText}>📞 {address.phone}</Text>
              <Text style={styles.infoText}>📍 {address.address}</Text>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate("AddAddress", { userId: user.uid })
                }
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editText}>Cập nhật địa chỉ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- Nút đăng xuất --- */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setConfirmVisible(true)}
          >
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

      {/* --- Modal xác nhận đăng xuất --- */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={50}
              color="#924900"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.modalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.modalMessage}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.logoutConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmText}>Đăng xuất</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#924900",
    marginBottom: 10,
  },
  infoText: { fontSize: 16, color: "#333", marginVertical: 2 },
  addressCard: {
    width: "90%",
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#924900",
    marginBottom: 8,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  addAddressText: { fontSize: 16, color: "#924900", marginLeft: 8 },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#924900",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { color: "#fff", marginLeft: 6 },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#924900",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontSize: 16 },
  loginButton: {
    backgroundColor: "#924900",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: 200,
    alignItems: "center",
  },
  signupButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: 200,
    alignItems: "center",
  },
  buttonText: { color: "#fff" },

  // Modal đẹp hơn
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#924900",
    marginBottom: 6,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#f0e9e0" },
  logoutConfirmButton: { backgroundColor: "#924900" },
  cancelText: { color: "#924900", fontWeight: "600" },
  logoutConfirmText: { color: "#fff", fontWeight: "600" },
});
