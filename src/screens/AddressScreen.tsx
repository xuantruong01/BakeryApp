import { useEffect, useState } from "react";
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
import { useApp } from "../contexts/AppContext";

const AddAddressScreen = ({ route, navigation }: any) => {
  const { theme, t } = useApp();
  const { userId } = route.params;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewAddress, setIsNewAddress] = useState(false); // Kiểm tra địa chỉ mới

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // 🔹 Lấy thông tin user và địa chỉ
  useEffect(() => {
    const fetchUserAndAddress = async () => {
      try {
        // Lấy thông tin user từ Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        // Lấy địa chỉ từ Firestore (nếu có)
        const addressRef = doc(db, "addresses", userId);
        const addressSnap = await getDoc(addressRef);

        if (addressSnap.exists()) {
          // Nếu đã có địa chỉ, lấy toàn bộ thông tin đã lưu
          const data = addressSnap.data();
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setIsNewAddress(false);
        } else if (userSnap.exists()) {
          // Nếu chưa có địa chỉ (tài khoản mới), tự động lấy tên và SĐT từ account
          const userData = userSnap.data();
          setName(userData.fullname || "");
          setPhone(userData.phoneNumber || "");
          setAddress(""); // Địa chỉ để trống
          setIsNewAddress(true);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin:", err);
      }
    };
    fetchUserAndAddress();
  }, [userId]);

  // 🧾 Kiểm tra hợp lệ (Logic giữ nguyên)
  const validate = () => {
    let valid = true;
    let newErrors: any = { name: "", phone: "", address: "" };

    if (!name.trim()) {
      newErrors.name = t("nameRequired");
      valid = false;
    }
    if (!phone.trim()) {
      newErrors.phone = t("phoneRequired");
      valid = false;
    } else if (!/^(0[0-9]{9})$/.test(phone)) {
      newErrors.phone = t("phoneInvalid");
      valid = false;
    }
    if (!address.trim()) {
      newErrors.address = t("addressRequired");
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

      Alert.alert("✅ " + t("addressSaved"), t("addressSaved"));
      navigation.goBack();
    } catch (error) {
      console.error("Lỗi khi lưu địa chỉ:", error);
      Alert.alert("❌ " + t("addressError"), t("addressError"));
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("addressManagement")}
        </Text>
      </View>

      {/* Thông báo cho tài khoản mới */}
      {isNewAddress && (
        <View style={[styles.infoBox, { backgroundColor: theme.lightBg }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {t("fullName")} và {t("phone")} được lấy từ tài khoản của bạn. Vui
            lòng nhập {t("shippingAddress").toLowerCase()}.
          </Text>
        </View>
      )}

      {/* --- Form --- */}
      <View style={styles.formContainer}>
        {/* --- Ô nhập họ tên --- */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("recipientName")}
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary + "40" },
              errors.name ? styles.inputError : null,
            ]}
            placeholder="Ví dụ: Nguyễn Văn A"
            placeholderTextColor={theme.text + "60"}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
          {!errors.name && name && (
            <Text style={[styles.hintText, { color: theme.text + "70" }]}>
              {t("recipientName")}
            </Text>
          )}
        </View>

        {/* --- Ô nhập số điện thoại --- */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("recipientPhone")}
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary + "40" },
              errors.phone ? styles.inputError : null,
            ]}
            placeholder="Ví dụ: 0901234567"
            placeholderTextColor={theme.text + "60"}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
          />
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}
          {!errors.phone && phone && (
            <Text style={[styles.hintText, { color: theme.text + "70" }]}>
              {t("recipientPhone")}
            </Text>
          )}
        </View>

        {/* --- Ô nhập địa chỉ --- */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("shippingAddress")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: theme.text, borderColor: theme.primary + "40" },
              errors.address ? styles.inputError : null,
            ]}
            placeholder={t("enterAddress")}
            placeholderTextColor={theme.text + "60"}
            multiline
            numberOfLines={4}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setErrors((prev) => ({ ...prev, address: "" }));
            }}
          />
          {errors.address ? (
            <Text style={styles.errorText}>{errors.address}</Text>
          ) : null}
          {!errors.address && !address && (
            <Text style={[styles.hintText, { color: theme.text + "70" }]}>
              {t("enterAddress")}
            </Text>
          )}
        </View>
      </View>

      {/* --- Nút lưu --- */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: theme.primary },
          loading && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>{t("saveAddress")}</Text>
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
    marginTop: 30,
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
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    lineHeight: 20,
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
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
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
  hintText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 13,
    fontStyle: "italic",
  },
  required: {
    color: "#D9534F",
    fontSize: 16,
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
        shadowColor: "#000",
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
