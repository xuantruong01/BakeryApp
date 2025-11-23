import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../contexts/AppContext";

const OrderDetailScreen = () => {
  const { theme, t } = useApp();
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as any;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

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
        return t("pending");
      case "processing":
        return t("processing");
      case "completed":
        return t("completed");
      case "cancelled":
        return t("cancelled");
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
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={80}
          color={theme.text + "30"}
        />
        <Text style={[styles.emptyText, { color: theme.text }]}>
          {t("orderNotFound")}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.lightBg, theme.background, "#FFFFFF"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("orderInformation")}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Mã đơn hàng & Trạng thái */}
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.orderHeaderRow}>
            <View style={styles.orderIdSection}>
              <Text style={[styles.label, { color: theme.text }]}>
                {t("orderId")}
              </Text>
              <Text style={[styles.orderIdText, { color: theme.primary }]}>
                #{order.id}
              </Text>
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
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("orderDate")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={theme.text + "80"} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Thông tin giao hàng */}
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("recipientInfo")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.text + "80"}
            />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {order.customerName || t("noName")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={theme.text + "80"} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {order.customerPhone || t("noPhone")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={theme.text + "80"}
            />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {order.deliveryAddress || t("noAddress")}
            </Text>
          </View>
        </View>

        {/* Chi tiết sản phẩm */}
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("productList")}
            </Text>
          </View>

          {order.items && order.items.length > 0 ? (
            order.items.map((item: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.productItem,
                  { borderBottomColor: theme.lightBg },
                ]}
              >
                {/* Hình ảnh sản phẩm */}
                <View
                  style={[
                    styles.productImageContainer,
                    { backgroundColor: theme.lightBg },
                  ]}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.noImagePlaceholder,
                        { backgroundColor: theme.lightBg },
                      ]}
                    >
                      <Ionicons
                        name="image-outline"
                        size={30}
                        color={theme.text + "40"}
                      />
                    </View>
                  )}
                </View>

                {/* Thông tin sản phẩm */}
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.name || t("product")}
                  </Text>
                  <Text
                    style={[
                      styles.productQuantity,
                      { color: theme.text + "80" },
                    ]}
                  >
                    {t("quantity")}: x{item.quantity || 1}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.primary }]}>
                    {formatPrice(parseInt(item.price) || 0)}
                  </Text>
                </View>

                {/* Tổng giá */}
                <View style={styles.productTotal}>
                  <Text
                    style={[styles.productTotalPrice, { color: theme.primary }]}
                  >
                    {formatPrice(
                      (parseInt(item.price) || 0) * (item.quantity || 1)
                    )}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noItemsText, { color: theme.text + "60" }]}>
              {t("noProducts")}
            </Text>
          )}
        </View>

        {/* Tổng tiền */}
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>
                {t("subtotal")}:
              </Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>
                {formatPrice(order.total || 0)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>
                {t("shippingFee")}:
              </Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>
                {t("free")}
              </Text>
            </View>
            <View
              style={[styles.divider, { backgroundColor: theme.text + "20" }]}
            />
            <View style={styles.totalRow}>
              <Text style={[styles.grandTotalLabel, { color: theme.primary }]}>
                {t("total")}:
              </Text>
              <Text style={[styles.grandTotalValue, { color: theme.primary }]}>
                {formatPrice(order.total || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Thông tin thanh toán */}
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("paymentMethod")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name={
                order.paymentMethod === "cash" ? "cash-outline" : "card-outline"
              }
              size={20}
              color={theme.text + "80"}
            />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {order.paymentMethod === "cash"
                ? t("cashOnDelivery")
                : t("bankTransfer")}
            </Text>
          </View>

          {/* Hiển thị thông tin ngân hàng nếu thanh toán bằng chuyển khoản */}
          {order.paymentMethod === "bank" && order.bankInfo && (
            <View
              style={[
                styles.bankInfoContainer,
                { backgroundColor: theme.lightBg },
              ]}
            >
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: theme.text }]}>
                  {t("bank")}:
                </Text>
                <Text style={[styles.bankInfoValue, { color: theme.text }]}>
                  {order.bankInfo.bankName}
                </Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: theme.text }]}>
                  {t("accountNumber")}:
                </Text>
                <Text style={[styles.bankInfoValue, { color: theme.text }]}>
                  {order.bankInfo.accountNumber}
                </Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: theme.text }]}>
                  {t("accountOwner")}:
                </Text>
                <Text style={[styles.bankInfoValue, { color: theme.text }]}>
                  {order.bankInfo.accountOwner}
                </Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: theme.text }]}>
                  {t("amount")}:
                </Text>
                <Text
                  style={[
                    styles.bankInfoValue,
                    { color: theme.primary, fontWeight: "bold" },
                  ]}
                >
                  {formatPrice(order.total || 0)}
                </Text>
              </View>

              {/* Hiển thị ảnh xác nhận chuyển khoản nếu có */}
              {order.paymentProofBase64 && (
                <View style={{ alignItems: "center", marginTop: 16 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      marginBottom: 8,
                      color: theme.text,
                    }}
                  >
                    {t("paymentProof")}:
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const imageUri = order.paymentProofBase64.startsWith(
                        "data:"
                      )
                        ? order.paymentProofBase64
                        : `data:image/jpeg;base64,${order.paymentProofBase64}`;
                      console.log("Opening image:", imageUri.substring(0, 50));
                      setSelectedImage(imageUri);
                      setImageModalVisible(true);
                    }}
                  >
                    <Image
                      source={{
                        uri: order.paymentProofBase64.startsWith("data:")
                          ? order.paymentProofBase64
                          : `data:image/jpeg;base64,${order.paymentProofBase64}`,
                      }}
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.primary,
                      }}
                      resizeMode="contain"
                      onError={(e) =>
                        console.log("Image load error:", e.nativeEvent.error)
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Thông báo cho admin */}
              {userRole === "admin" && order.status === "pending" && (
                <View
                  style={[styles.adminNote, { backgroundColor: theme.lightBg }]}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={theme.accent}
                  />
                  <Text style={[styles.adminNoteText, { color: theme.text }]}>
                    {t("adminBankCheckNote")}
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
                backgroundColor: theme.secondary,
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
                {t("confirmOrder")}
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
                {t("cancelOrder")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.modalImage}
            resizeMode="contain"
            onError={(e) =>
              console.log("Modal image error:", e.nativeEvent.error)
            }
          />
        </TouchableOpacity>
      </Modal>
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
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
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "bold",
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
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
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
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
  },
  productTotal: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 10,
  },
  productTotalPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noItemsText: {
    fontSize: 15,
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
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 18,
    marginTop: 15,
  },
  bankInfoContainer: {
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
    fontWeight: "500",
  },
  bankInfoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  adminNote: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  adminNoteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  modalImage: {
    width: "90%",
    height: "80%",
  },
});
