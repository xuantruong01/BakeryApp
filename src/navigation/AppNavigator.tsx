import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import TabNavigator from "./TabNavigator";
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

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
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
    </Stack.Navigator>
  );
}
