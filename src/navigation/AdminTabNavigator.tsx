import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminCategoriesScreen from "../screens/admin/AdminCategoriesScreen";
import AdminStatisticsScreen from "../screens/admin/AdminStatisticsScreen";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "AdminHome") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "AdminOrders") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "AdminProducts") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "AdminStatistics") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          } else if (route.name === "AdminProfile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "AdminCategories") {
            iconName = focused ? "folder" : "folder-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FF6B6B",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#FF6B6B",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Tổng quan",
          headerTitle: "Dashboard",
        }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Đơn hàng",
          headerTitle: "Quản lý đơn hàng",
        }}
      />
      <Tab.Screen
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Sản phẩm",
          headerTitle: "Quản lý sản phẩm",
        }}
      />
      <Tab.Screen
        name="AdminStatistics"
        component={AdminStatisticsScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Thống kê",
          headerTitle: "Thống kê chi tiết",
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Cá nhân",
          headerTitle: "Thông tin cá nhân",
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;
