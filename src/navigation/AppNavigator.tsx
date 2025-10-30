import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import TabNavigator from "./TabNavigator";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreens";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import AddAddressScreen from "../screens/AddressScreen";
import SearchResultScreen from "../screens/SearchResultScreen";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";
import CheckoutScreen from "../screens/CheckoutScreen"; // ✅ Thêm import

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator id="rootStack" screenOptions={{ headerShown: false }}>
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
    </Stack.Navigator>
  );
}
