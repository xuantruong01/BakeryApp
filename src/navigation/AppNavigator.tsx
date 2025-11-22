import React, { useState, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabNavigator from "./TabNavigator";
import AdminTabNavigator from "./AdminTabNavigator";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreens";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import AddAddressScreen from "../screens/AddressScreen";
import SearchResultScreen from "../screens/SearchResultScreen";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OrderHistoryScreen from "../screens/OrderHistoryScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import AdminNotificationsScreen from "../screens/admin/AdminNotificationsScreen";
import AdminSettingsScreen from "../screens/admin/AdminSettingsScreen";
import AdminHelpScreen from "../screens/admin/AdminHelpScreen";
import ChatBotScreen from "../screens/ChatBotScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();

    // Listener để cập nhật role khi có thay đổi
    const interval = setInterval(() => {
      checkUserRole();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("userRole");
      setUserRole(role);
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsLoading(false);
    }
  };

  // Nếu là admin, hiển thị Admin Navigator
  const MainComponent = userRole === "admin" ? AdminTabNavigator : TabNavigator;

  return (
    <Stack.Navigator id={"rootStack"} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainComponent} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false, title: "Chi tiết sản phẩm" }}
      />

      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ headerShown: false, title: "Thêm địa chỉ giao hàng" }}
      />

      <Stack.Screen
        name="SearchResult"
        component={SearchResultScreen}
        options={{ headerShown: false, title: "Kết quả tìm kiếm" }}
      />

      <Stack.Screen
        name="CategoryProducts"
        component={CategoryProductsScreen}
        options={{ headerShown: false, title: "Sản phẩm theo danh mục" }}
      />

      {/* ✅ Thêm mới màn Checkout */}
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ headerShown: false, title: "Xác nhận đơn hàng" }}
      />

      {/* Màn hình đơn hàng */}
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ headerShown: false, title: "Đơn hàng" }}
      />

      {/* Màn hình lịch sử đơn hàng */}
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{ headerShown: false, title: "Lịch sử đơn hàng" }}
      />

      {/* Màn hình chi tiết đơn hàng */}
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false, title: "Chi tiết đơn hàng" }}
      />

      {/* Màn hình admin */}
      <Stack.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{ headerShown: false, title: "Thông báo Admin" }}
      />
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{ headerShown: false, title: "Cài đặt hệ thống" }}
      />
      <Stack.Screen
        name="AdminHelp"
        component={AdminHelpScreen}
        options={{ headerShown: false, title: "Trợ giúp" }}
      />

      <Stack.Screen
        name="ChatBot"
        component={ChatBotScreen}
        options={{ headerShown: false, title: "AI Trợ lý" }}
      />
    </Stack.Navigator>
  );
}
