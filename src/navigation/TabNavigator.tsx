import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import AccountScreen from "../screens/AccountScreen";
import FontAwesome from '@expo/vector-icons/FontAwesome';
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#924900",
    }}
    
    >
      <Tab.Screen name="Home" component={HomeScreen}
      options={{tabBarIcon: ({color})=> <FontAwesome name="home" size={24} color={color} />}}
      />
      <Tab.Screen name="Cart" component={CartScreen}
      options={{tabBarIcon: ({color})=> <FontAwesome name="shopping-cart" size={24} color={color} />}}
      />
      <Tab.Screen name="Account" component={AccountScreen}
      options={{tabBarIcon: ({color})=> <FontAwesome name="user" size={24} color={color} />}}
      />
    </Tab.Navigator>
  );
}
