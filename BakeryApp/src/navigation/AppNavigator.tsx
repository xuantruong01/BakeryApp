import React from "react";
import { NavigationContainer } from "@react-navigation/native";import { createStackNavigator } from "@react-navigation/stack";
import TabNavigator from "./TabNavigator";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreens"

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Bộ tab chính */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        {/* Màn hình đăng nhập */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>

  );
}
