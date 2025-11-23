import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminCategoriesScreen from "../screens/admin/AdminCategoriesScreen";
import AdminStatisticsScreen from "../screens/admin/AdminStatisticsScreen";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";
import { useApp } from "../contexts/AppContext";

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  const { theme, t } = useApp();

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
        tabBarActiveTintColor: theme.primary,
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
          backgroundColor: theme.primary,
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
          tabBarLabel: t("overview"),
          headerTitle: t("dashboard"),
        }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("orders"),
          headerTitle: t("orderManagement"),
        }}
      />
      <Tab.Screen
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("products"),
          headerTitle: t("productManagement"),
        }}
      />
      <Tab.Screen
        name="AdminStatistics"
        component={AdminStatisticsScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("statistics"),
          headerTitle: t("detailedStatistics"),
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("personalInfo"),
          headerTitle: "Thông tin cá nhân",
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;
