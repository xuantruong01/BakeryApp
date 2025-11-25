import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import { AppProvider } from "./contexts/AppContext";
import { NotificationProvider } from "./contexts/NotificationContext";

export default function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </NotificationProvider>
    </AppProvider>
  );
}
