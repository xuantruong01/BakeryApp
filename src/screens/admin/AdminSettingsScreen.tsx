import React from "react";
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

const AdminSettingsScreen = ({ navigation }) => {
  const SettingItem = ({ icon, title, subtitle, onPress, color = "#333" }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const handleClearCache = async () => {
    Alert.alert(
      "Xóa bộ nhớ đệm",
      "Bạn có chắc muốn xóa bộ nhớ đệm? Điều này sẽ đăng xuất bạn khỏi ứng dụng.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Thành công", "Đã xóa bộ nhớ đệm");
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa bộ nhớ đệm");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt hệ thống</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Thông báo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          <SettingItem
            icon="notifications"
            title="Thông báo đơn hàng"
            subtitle="Nhận thông báo khi có đơn hàng mới"
            color="#FFA500"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
          <SettingItem
            icon="mail"
            title="Thông báo Email"
            subtitle="Gửi email cho đơn hàng mới"
            color="#4A90E2"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
        </View>

        {/* Dữ liệu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dữ liệu</Text>
          <SettingItem
            icon="cloud-download"
            title="Sao lưu dữ liệu"
            subtitle="Tải xuống dữ liệu của bạn"
            color="#28A745"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
          <SettingItem
            icon="trash"
            title="Xóa bộ nhớ đệm"
            subtitle="Giải phóng không gian lưu trữ"
            color="#E74C3C"
            onPress={handleClearCache}
          />
        </View>

        {/* Bảo mật */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bảo mật</Text>
          <SettingItem
            icon="finger-print"
            title="Xác thực sinh trắc học"
            subtitle="Sử dụng vân tay/khuôn mặt để đăng nhập"
            color="#9C27B0"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
          <SettingItem
            icon="shield-checkmark"
            title="Xác thực 2 yếu tố"
            subtitle="Tăng cường bảo mật tài khoản"
            color="#17A2B8"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
        </View>

        {/* Giao diện */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giao diện</Text>
          <SettingItem
            icon="color-palette"
            title="Chủ đề"
            subtitle="Chọn màu sắc giao diện"
            color="#FF6B6B"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
          <SettingItem
            icon="language"
            title="Ngôn ngữ"
            subtitle="Tiếng Việt"
            color="#607D8B"
            onPress={() =>
              Alert.alert("Thông báo", "Tính năng đang được phát triển")
            }
          />
        </View>

        {/* Thông tin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          <SettingItem
            icon="information-circle"
            title="Phiên bản"
            subtitle="1.0.0"
            color="#95A5A6"
            onPress={() => Alert.alert("Phiên bản", "Bakery Admin v1.0.0")}
          />
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
  header: {
    backgroundColor: "#FF6B6B",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  settingItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#666",
  },
});

export default AdminSettingsScreen;
