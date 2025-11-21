import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OrderDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as any;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  useEffect(() => {
    const getRole = async () => {
      const role = await AsyncStorage.getItem("userRole");
      setUserRole(role);
    };
    getRole();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "processing":
        return "#2196F3";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "processing":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "processing":
        return "hourglass-outline";
      case "completed":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle-outline";
    }
  };

  const handleAdminConfirm = async () => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "processing",
        updatedAt: new Date(),
      });
      fetchOrderDetail();
    } catch (error) {
      console.error("Lỗi xác nhận đơn hàng:", error);
    }
  };

  const handleAdminCancel = async () => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "cancelled", updatedAt: new Date() });
      fetchOrderDetail();
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#924900" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={80} color="#CCC" />
        <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FFF5E6", "#FFE8CC", "#FFFFFF"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#924900" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Mã đơn hàng & Trạng thái */}
        <View style={styles.card}>
          <View style={styles.orderHeaderRow}>
            <View style={styles.orderIdSection}>
              <Text style={styles.label}>Mã đơn hàng</Text>
              <Text style={styles.orderIdText}>#{order.id}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(order.status) as any}
                size={16}
                color="#FFF"
              />
              <Text style={styles.statusText}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Thông tin thời gian */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color="#924900" />
            <Text style={styles.sectionTitle}>Thời gian đặt hàng</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Thông tin giao hàng */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color="#924900" />
            <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{order.name || "Chưa có tên"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {order.phone || "Chưa có số điện thoại"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {order.address || "Chưa có địa chỉ"}
            </Text>
          </View>
        </View>

        {/* Chi tiết sản phẩm */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket-outline" size={24} color="#924900" />
            <Text style={styles.sectionTitle}>Chi tiết sản phẩm</Text>
          </View>

          {order.items && order.items.length > 0 ? (
            order.items.map((item: any, index: number) => (
              <View key={index} style={styles.productItem}>
                {/* Hình ảnh sản phẩm */}
                <View style={styles.productImageContainer}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.noImagePlaceholder}>
                      <Ionicons name="image-outline" size={30} color="#CCC" />
                    </View>
                  )}
                </View>

                {/* Thông tin sản phẩm */}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name || "Sản phẩm"}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Số lượng: x{item.quantity || 1}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatPrice(parseInt(item.price) || 0)}
                  </Text>
                </View>

                {/* Tổng giá */}
                <View style={styles.productTotal}>
                  <Text style={styles.productTotalPrice}>
                    {formatPrice(
                      (parseInt(item.price) || 0) * (item.quantity || 1)
                    )}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>Không có sản phẩm nào</Text>
          )}
        </View>

        {/* Tổng tiền */}
        <View style={styles.card}>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tạm tính:</Text>
              <Text style={styles.totalValue}>
                {formatPrice(order.total || 0)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
              <Text style={styles.totalValue}>Miễn phí</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Tổng cộng:</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(order.total || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Thông tin thanh toán */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color="#924900" />
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name={
                order.paymentMethod === "cash" ? "cash-outline" : "card-outline"
              }
              size={20}
              color="#666"
            />
            <Text style={styles.infoText}>
              {order.paymentMethod === "cash"
                ? "Tiền mặt khi nhận hàng"
                : "Chuyển khoản ngân hàng"}
            </Text>
          </View>

          {/* Hiển thị thông tin ngân hàng nếu thanh toán bằng chuyển khoản */}
          {order.paymentMethod === "bank" && order.bankInfo && (
            <View style={styles.bankInfoContainer}>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Ngân hàng:</Text>
                <Text style={styles.bankInfoValue}>
                  {order.bankInfo.bankName}
                </Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Số tài khoản:</Text>
                <Text style={styles.bankInfoValue}>
                  {order.bankInfo.accountNumber}
                </Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Chủ tài khoản:</Text>
                <Text style={styles.bankInfoValue}>
                  {order.bankInfo.accountOwner}
                </Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Số tiền:</Text>
                <Text
                  style={[
                    styles.bankInfoValue,
                    { color: "#E58E26", fontWeight: "bold" },
                  ]}
                >
                  {formatPrice(order.total || 0)}
                </Text>
              </View>

              {/* Hiển thị ảnh xác nhận chuyển khoản nếu có */}
              {order.paymentProof && (
                <View style={{ alignItems: "center", marginTop: 16 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "600", marginBottom: 8 }}
                  >
                    Ảnh xác nhận chuyển khoản:
                  </Text>
                  <Image
                    source={{
                      uri: order.paymentProof.startsWith("data:")
                        ? order.paymentProof
                        : `data:image/jpeg;base64,${order.paymentProof}`,
                    }}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#E58E26",
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Thông báo cho admin */}
              {userRole === "admin" && order.status === "pending" && (
                <View style={styles.adminNote}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#2196F3"
                  />
                  <Text style={styles.adminNoteText}>
                    Vui lòng kiểm tra tài khoản ngân hàng và xác nhận khi đã
                    nhận được tiền.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Thêm nút cho admin nếu trạng thái là pending */}
        {userRole === "admin" && order.status === "pending" && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 16,
              gap: 12,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "#28A745",
                padding: 14,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                justifyContent: "center",
              }}
              onPress={handleAdminConfirm}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text
                style={{ color: "#FFF", fontWeight: "bold", marginLeft: 8 }}
              >
                Xác nhận đơn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#DC3545",
                padding: 14,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                justifyContent: "center",
              }}
              onPress={handleAdminCancel}
            >
              <Ionicons name="close-circle" size={20} color="#FFF" />
              <Text
                style={{ color: "#FFF", fontWeight: "bold", marginLeft: 8 }}
              >
                Hủy đơn
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default OrderDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5E6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#924900",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderIdSection: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#924900",
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#924900",
  },
  productTotal: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 10,
  },
  productTotalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#924900",
  },
  noItemsText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  totalContainer: {
    paddingVertical: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 15,
    color: "#666",
  },
  totalValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#924900",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#924900",
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 15,
  },
  bankInfoContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  bankInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bankInfoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  bankInfoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  adminNote: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  adminNoteText: {
    fontSize: 13,
    color: "#1976D2",
    flex: 1,
    lineHeight: 18,
  },
});
