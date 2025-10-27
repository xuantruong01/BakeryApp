import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { db } from "../services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const TestScreen = () => {
  useEffect(() => {
    const loadData = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      querySnapshot.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
      });
    };
    loadData();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>✅ Kết nối Firestore thành công!</Text>
    </View>
  );
};

export default TestScreen;
