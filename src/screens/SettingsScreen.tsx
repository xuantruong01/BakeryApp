import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../contexts/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const SettingsScreen = () => {
  const { theme, themeName, setTheme, language, setLanguage, t } = useApp();
  const navigation = useNavigation();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const themes = [
    { id: "orange", name: "Cam", color: "#E58E26", icon: "sunny" },
    { id: "blue", name: "Xanh dương", color: "#4A90E2", icon: "water" },
    { id: "green", name: "Xanh lá", color: "#27AE60", icon: "leaf" },
    { id: "purple", name: "Tím", color: "#9B59B6", icon: "flower" },
    { id: "red", name: "Đỏ", color: "#E74C3C", icon: "flame" },
  ];

  const languages = [
    { id: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { id: "en", name: "English", flag: "🇬🇧" },
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
      Alert.alert(t("success"), t("languageChanged"));
    } catch (error) {
      Alert.alert(t("error"), t("cannotChangeLanguage"));
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
            (navigation as any).reset({
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

  const SettingItem = ({ icon, title, subtitle, color, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.primary }]}
      edges={["top"]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* HEADER */}
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("settings")}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.content}>
          {/* Giao diện */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("appearance")}</Text>
            <SettingItem
              icon="color-palette"
              title={t("theme")}
              subtitle={t("chooseTheme")}
              color={theme.primary}
              onPress={() => setThemeModalVisible(true)}
            />
            <SettingItem
              icon="language"
              title={t("language")}
              subtitle={t("chooseLanguage")}
              color="#17A2B8"
              onPress={() => setLanguageModalVisible(true)}
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

          {/* Thông tin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("information")}</Text>
            <SettingItem
              icon="information-circle"
              title={t("aboutApp")}
              subtitle={t("version") + " 2.0.0"}
              color="#6C757D"
              onPress={() =>
                Alert.alert(
                  t("aboutBakeryApp"),
                  `${t("version")}: 2.0.0\nCopyright © 2025\n\n${t(
                    "bakeryManagementApp"
                  )}`
                )
              }
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal chọn theme */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("chooseTheme")}</Text>
            <ScrollView style={styles.themeList}>
              {themes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeItem,
                    themeName === item.id && styles.themeItemActive,
                  ]}
                  onPress={() => handleThemeChange(item.id)}
                >
                  <View
                    style={[styles.themeColor, { backgroundColor: item.color }]}
                  >
                    <Ionicons name={item.icon as any} size={24} color="#FFF" />
                  </View>
                  <Text style={styles.themeName}>{item.name}</Text>
                  {themeName === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={item.color}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Modal chọn ngôn ngữ */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("chooseLanguage")}</Text>
            <View style={styles.languageList}>
              {languages.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.languageItem,
                    language === item.id && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageChange(item.id)}
                >
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text style={styles.languageName}>{item.name}</Text>
                  {language === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#999",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },

  // Theme
  themeList: {
    maxHeight: 400,
  },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
  },
  themeItemActive: {
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  themeColor: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  themeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Language
  languageList: {
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
  },
  languageItemActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Modal Close
  modalCloseButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});

export default SettingsScreen;
