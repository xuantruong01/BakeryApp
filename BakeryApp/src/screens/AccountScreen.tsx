import React from "react";
import { View, Text, StyleSheet } from "react-native";

const AccountScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>👤 Tài khoản người dùng</Text>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, fontWeight: "500" },
});
