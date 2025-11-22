import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../../contexts/AppContext";

const AdminSettingsScreen = ({ navigation }) => {
  const { theme, themeName, language, setTheme, setLanguage, t } = useApp();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

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

  const themes = [
    { id: "orange", name: "Cam", color: "#E58E26" },
    { id: "blue", name: "Xanh dương", color: "#4A90E2" },
    { id: "green", name: "Xanh lá", color: "#28A745" },
    { id: "purple", name: "Tím", color: "#9C27B0" },
    { id: "red", name: "Đỏ", color: "#DC3545" },
  ];

  const languages = [
    { id: "vi", name: "Tiếng Việt", icon: "🇻🇳" },
    { id: "en", name: "English", icon: "🇬🇧" },
  ];

  const handleThemeChange = async (themeId) => {
    try {
      await setTheme(themeId);
      setThemeModalVisible(false);
      Alert.alert(t("success"), t("themeChanged"));
    } catch (error) {
      Alert.alert(t("error"), t("cannotChangeTheme"));
    }
  };

  const handleLanguageChange = async (languageId) => {
    try {
      await setLanguage(languageId);
      setLanguageModalVisible(false);
      Alert.alert("Success", "Language changed successfully!");
    } catch (error) {
      Alert.alert("Error", "Cannot change language");
    }
  };

  const handleClearCache = async () => {
    Alert.alert(t("clearCacheTitle"), t("clearCacheMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            Alert.alert(t("success"), t("cacheCleared"));
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            Alert.alert(t("error"), t("cannotClearCache"));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: themeName ? theme.primary : "#FF6B6B" },
      ]}
      edges={["top"]}
    >
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
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
            title={t("notifications")}
            subtitle={t("viewAllPendingOrders")}
            color="#FFA500"
            onPress={() => navigation.navigate("AdminNotifications")}
          />
        </View>

        {/* Dữ liệu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("dataManagement")}</Text>
          <SettingItem
            icon="cloud-download"
            title={t("backupData")}
            subtitle={t("downloadYourData")}
            color="#28A745"
            onPress={() =>
              Alert.alert(t("notification"), t("featureInDevelopment"))
            }
          />
          <SettingItem
            icon="trash"
            title={t("clearCache")}
            subtitle={t("freeStorage")}
            color="#E74C3C"
            onPress={handleClearCache}
          />
        </View>

        {/* Giao diện */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("appearance")}</Text>
          <SettingItem
            icon="color-palette"
            title="Chủ đề"
            subtitle={
              themes.find((t) => t.id === themeName)?.name ||
              "Chọn màu sắc giao diện"
            }
            color="#FF6B6B"
            onPress={() => setThemeModalVisible(true)}
          />
          <SettingItem
            icon="language"
            title="Ngôn ngữ"
            subtitle={
              languages.find((l) => l.id === language)?.name || "Tiếng Việt"
            }
            color="#607D8B"
            onPress={() => setLanguageModalVisible(true)}
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

      {/* Theme Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn chủ đề</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {themes.map((themeItem) => (
                <TouchableOpacity
                  key={themeItem.id}
                  style={[
                    styles.themeOption,
                    themeName === themeItem.id && styles.themeOptionActive,
                  ]}
                  onPress={() => handleThemeChange(themeItem.id)}
                >
                  <View
                    style={[
                      styles.themeColorBox,
                      { backgroundColor: themeItem.color },
                    ]}
                  />
                  <Text style={styles.themeOptionText}>{themeItem.name}</Text>
                  {themeName === themeItem.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={themeItem.color}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngôn ngữ</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {languages.map((languageItem) => (
                <TouchableOpacity
                  key={languageItem.id}
                  style={[
                    styles.languageOption,
                    language === languageItem.id && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageChange(languageItem.id)}
                >
                  <Text style={styles.languageIcon}>{languageItem.icon}</Text>
                  <Text style={styles.languageOptionText}>
                    {languageItem.name}
                  </Text>
                  {language === languageItem.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#28A745"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 16,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
  },
  themeOptionActive: {
    backgroundColor: "#FFF3E0",
    borderWidth: 2,
    borderColor: "#E58E26",
  },
  themeColorBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
  },
  languageOptionActive: {
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#28A745",
  },
  languageIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

export default AdminSettingsScreen;
