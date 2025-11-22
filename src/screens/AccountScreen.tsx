import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../contexts/AppContext";

const AccountScreen = () => {
  const navigation = useNavigation();
  const { theme, t } = useApp();
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);

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
    await AsyncStorage.removeItem("userRole");
    setUser(null);
    setAddress(null);
    setConfirmVisible(false);

    // Reset navigation để reload AppNavigator
    (navigation as any).reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
            {/* Header Profile */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[theme.primary, theme.secondary, theme.accent]}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={50} color="#FFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.username, { color: theme.primary }]}>
                {user.fullname || user.displayName || t("user")}
              </Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>

            {/* Thông tin cá nhân */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={theme.primary}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t("personalInformation")}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={20} color={theme.primary} />
                  <Text style={styles.infoLabel}>{t("email")}:</Text>
                  <Text style={styles.infoValue}>
                    {user.email || t("notAvailable")}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={20} color={theme.primary} />
                  <Text style={styles.infoLabel}>{t("phoneNumber")}:</Text>
                  <Text style={styles.infoValue}>
                    {user.phoneNumber || t("notAvailable")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Địa chỉ giao hàng */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={24} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t("deliveryAddress")}
                </Text>
              </View>
              {!address ? (
                <TouchableOpacity
                  style={styles.addAddressCard}
                  onPress={() =>
                    (navigation as any).navigate("AddAddress", {
                      userId: user.uid,
                    })
                  }
                >
                  <Ionicons name="add-circle" size={40} color={theme.primary} />
                  <Text style={[styles.addAddressText, { color: theme.text }]}>
                    {t("addDeliveryAddress")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.addressCard}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>{address.name}</Text>
                    <Text style={styles.addressDetail}>📞 {address.phone}</Text>
                    <Text style={styles.addressDetail}>
                      📍 {address.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editAddressBtn}
                    onPress={() =>
                      (navigation as any).navigate("AddAddress", {
                        userId: user.uid,
                      })
                    }
                  >
                    <Ionicons name="create" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 📦 Quản lý đơn hàng - 2 nút */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="receipt-outline"
                  size={24}
                  color={theme.primary}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t("manageOrders")}
                </Text>
              </View>

              <View style={styles.orderButtonsContainer}>
                {/* Nút Đơn hàng */}
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => (navigation as any).navigate("Orders")}
                >
                  <LinearGradient
                    colors={[theme.primary, theme.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.orderButtonGradient, { opacity: 1 }]}
                  >
                    <Ionicons name="cart-outline" size={32} color="#FFF" />
                    <Text style={styles.orderButtonText}>{t("orders")}</Text>
                    <Text style={styles.orderButtonSubtext}>
                      {t("orderProcessing")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Nút Lịch sử đơn hàng */}
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => (navigation as any).navigate("OrderHistory")}
                >
                  <LinearGradient
                    colors={[theme.accent, theme.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.orderButtonGradient, { opacity: 0.85 }]}
                  >
                    <Ionicons name="time-outline" size={32} color="#FFF" />
                    <Text style={styles.orderButtonText}>
                      {t("orderHistoryTab")}
                    </Text>
                    <Text style={styles.orderButtonSubtext}>
                      {t("purchased")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* ⚙️ Cài đặt */}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => (navigation as any).navigate("Settings")}
            >
              <LinearGradient
                colors={[theme.secondary, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.settingsGradient, { opacity: 0.75 }]}
              >
                <Ionicons name="settings-outline" size={24} color="#FFF" />
                <Text style={styles.settingsText}>{t("settings")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 🚪 Đăng xuất */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setConfirmVisible(true)}
            >
              <LinearGradient
                colors={[theme.primary, theme.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.logoutGradient, { opacity: 0.95 }]}
              >
                <Ionicons name="log-out-outline" size={24} color="#FFF" />
                <Text style={styles.logoutText}>{t("logout")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.notLoggedIn}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={80} color={theme.primary} />
            </View>
            <Text style={[styles.notLoggedText, { color: theme.text }]}>
              {t("notLoggedIn")}
            </Text>
            <Text style={styles.notLoggedSubtext}>
              {t("loginToExperience")}
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                (navigation as any).navigate("Login", { redirectTo: "Account" })
              }
            >
              <LinearGradient
                colors={[theme.primary, theme.secondary, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{t("login")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() =>
                (navigation as any).navigate("SignUp", {
                  redirectTo: "Account",
                })
              }
            >
              <Text style={[styles.signupButtonText, { color: theme.primary }]}>
                {t("signUpAccount")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
              color={theme.primary}
              style={{ marginBottom: 10 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t("confirmLogoutTitle")}
            </Text>
            <Text style={styles.modalMessage}>{t("confirmLogoutMessage")}</Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>{t("cancel")}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.button,
                  styles.logoutConfirmButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmText}>{t("logout")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI ChatBot Floating Button - chễ hiển thị khi đã đăng nhập */}
      {user && (
        <TouchableOpacity
          style={styles.aiFloatingButton}
          onPress={() => {
            const parentNav = (navigation as any).getParent?.();
            if (parentNav) {
              parentNav.navigate("ChatBot");
            } else {
              (navigation as any).navigate("ChatBot");
            }
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.aiGradient as any}
            style={styles.aiButtonGradient}
          >
            <Ionicons name="sparkles" size={28} color="#FFF" />
          </LinearGradient>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header Profile
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingTop: 50,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },

  // Address Card
  addAddressCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 16,
    color: "#924900",
    marginTop: 10,
    fontWeight: "600",
  },
  addressCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  addressDetail: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  editAddressBtn: {
    backgroundColor: "#924900",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Orders
  emptyOrders: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 15,
  },
  orderGroup: {
    marginBottom: 20,
  },
  orderGroupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  orderDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontSize: 14,
    color: "#666",
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#924900",
  },

  // Settings Button
  settingsButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 30,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },

  // Order Management Buttons
  orderButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginTop: 10,
  },
  orderButton: {
    flex: 1,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  orderButtonGradient: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  orderButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  orderButtonSubtext: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },

  // Not Logged In
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 100,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  notLoggedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#924900",
    marginBottom: 10,
  },
  notLoggedSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  loginButton: {
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupButton: {
    width: "100%",
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#924900",
  },
  signupButtonText: {
    color: "#924900",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#924900",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  logoutConfirmButton: {
    backgroundColor: "#924900",
  },
  cancelText: {
    color: "#924900",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutConfirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // AI Floating Button
  aiFloatingButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#924900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  aiBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  aiBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});
