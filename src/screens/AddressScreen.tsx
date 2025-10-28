import  { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator, // 👈 Thêm ActivityIndicator
} from "react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";

const AddAddressScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false); // 👈 Thêm trạng thái loading

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // 🔹 Lấy địa chỉ cũ (Logic giữ nguyên)
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const docRef = doc(db, "addresses", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
        }
      } catch (err) {
        console.error("Lỗi khi lấy địa chỉ:", err);
      }
    };
    fetchAddress();
  }, [userId]);

  // 🧾 Kiểm tra hợp lệ (Logic giữ nguyên)
  const validate = () => {
    let valid = true;
    let newErrors: any = { name: "", phone: "", address: "" };

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên.";
      valid = false;
    }
    if (!phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại.";
      valid = false;
    } else if (!/^(0[0-9]{9})$/.test(phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).";
      valid = false;
    }
    if (!address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ chi tiết.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 💾 Lưu địa chỉ (Cập nhật thêm setLoading)
  const handleSave = async () => {
    if (loading || !validate()) return; // 👈 Ngăn bấm nút nhiều lần

    setLoading(true); // 👈 Bắt đầu tải
    try {
      await setDoc(doc(db, "addresses", userId), {
        name,
        phone,
        address,
        updatedAt: new Date(),
      });

      Alert.alert("Thành công", "Đã lưu địa chỉ giao hàng!");
      navigation.goBack();
    } catch (error) {
      console.error("Lỗi khi lưu địa chỉ:", error);
      Alert.alert( "Lỗi", "Không thể lưu địa chỉ. Vui lòng thử lại.");
    } finally {
      setLoading(false); // 👈 Dừng tải (dù thành công hay lỗi)
    }
  };

  return (
    // 🎨 Bọc trong ScrollView để tránh che mất trường khi bàn phím hiện
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled" // 👈 Cho phép bấm nút khi bàn phím đang mở
    >
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#924900" />
        </TouchableOpacity>
        <Text style={styles.title}>Thông tin giao hàng</Text>
        
      </View>

      {/* --- Form --- */}
      <View style={styles.formContainer}>
        {/* --- Ô nhập họ tên --- */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            placeholder="Ví dụ: Nguyễn Văn A"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {/* --- Ô nhập số điện thoại --- */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, errors.phone ? styles.inputError : null]}
            placeholder="Ví dụ: 0901234567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        {/* --- Ô nhập địa chỉ --- */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Địa chỉ chi tiết</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.address ? styles.inputError : null]}
            placeholder="Số nhà, đường, phường, quận..."
            multiline
            numberOfLines={4}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setErrors((prev) => ({ ...prev, address: "" }));
            }}
          />
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
        </View>
      </View>

      {/* --- Nút lưu --- */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}> Lưu địa chỉ</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddAddressScreen;

// 🎨 --- STYLESHEET ĐƯỢC THIẾT KẾ LẠI --- 🎨
const styles = StyleSheet.create({
  container: {
    flex: 1,
        backgroundColor: "#FFF8F0", // 👈 Màu nền kem (chủ đề tiệm bánh),
    marginTop: 30
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40, // 👈 Thêm padding dưới
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingTop: Platform.OS === "android" ? 25 : 0, // 👈 Tránh status bar Android
  },
  backButton: {
    padding: 10, // 👈 Tăng vùng bấm
    marginLeft: -10, // 👈 Căn lề
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#924900",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16, // 👈 Khoảng cách giữa các mục
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A15807", // 👈 Màu nâu nhạt hơn
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#F0E9E0", // 👈 Border rất nhạt
    // Thêm Shadow (bóng mờ)
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top", // 👈 Chữ bắt đầu từ trên cùng (Android)
  },
  inputError: {
    borderColor: "#D9534F", // 👈 Màu đỏ cho lỗi
    borderWidth: 2,
  },
  errorText: {
    color: "#D9534F",
    marginTop: 6,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#924900",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    // Thêm Shadow cho nút
    ...Platform.select({
      ios: {
        shadowColor: "#924900",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.7, // 👈 Làm mờ nút khi đang tải
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});