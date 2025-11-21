import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const AdminProfileScreen = () => {
  const navigation = useNavigation();
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const loadAdminInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setAdminEmail(user.email || "");
      }
    } catch (error) {
      console.error("Error loading admin info:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất khỏi tài khoản admin?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("userRole");

              // Reset navigation về màn hình đăng nhập
              (navigation as any).reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const MenuButton = ({
    icon,
    title,
    subtitle,
    onPress,
    color = "#333",
  }: any) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container}>
        <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#FFF" />
            </View>
          </View>
          <Text style={styles.headerName}>Admin</Text>
          <Text style={styles.headerEmail}>{adminEmail}</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Thông tin tài khoản */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{adminEmail}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Vai trò</Text>
                  <Text style={styles.infoValue}>Quản trị viên</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quản lý */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quản Lý</Text>
            <MenuButton
              icon="notifications"
              title="Thông báo"
              subtitle="Xem đơn hàng chờ xác nhận"
              color="#FFA500"
              onPress={() => (navigation as any).navigate("AdminNotifications")}
            />
            <MenuButton
              icon="settings"
              title="Cài đặt hệ thống"
              subtitle="Cấu hình ứng dụng"
              color="#17A2B8"
              onPress={() => (navigation as any).navigate("AdminSettings")}
            />
          </View>

          {/* Hỗ trợ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hỗ Trợ</Text>
            <MenuButton
              icon="help-circle"
              title="Trợ giúp"
              subtitle="Hướng dẫn sử dụng"
              color="#28A745"
              onPress={() => (navigation as any).navigate("AdminHelp")}
            />
            <MenuButton
              icon="information-circle"
              title="Về ứng dụng"
              subtitle="Phiên bản 2.0.0"
              color="#6C757D"
              onPress={() =>
                Alert.alert(
                  "Về BakeryApp Admin",
                  "Phiên bản: 2.0.0\nCopyright © 2025\n\nỨng dụng quản lý cửa hàng bánh"
                )
              }
            />
          </View>

          {/* Nút đăng xuất */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#FFF" />
            <Text style={styles.logoutText}>Đăng Xuất</Text>
          </TouchableOpacity>

          <Text style={styles.version}>BakeryApp Admin v2.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF6B6B",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.9,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC3545",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 8,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
});

export default AdminProfileScreen;
