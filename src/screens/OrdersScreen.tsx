import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", parsedUser.uid),
        where("status", "in", ["pending", "processing"]),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(ordersList);
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("vi-VN");
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
      default:
        return status;
    }
  };

  // ❌ Hủy đơn hàng (chỉ khi pending)
  const cancelOrder = async (orderId: string) => {
    Alert.alert("Hủy đơn hàng", "Bạn có chắc chắn muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
              status: "cancelled",
              updatedAt: new Date(),
            });
            Alert.alert("Thành công", "Đã hủy đơn hàng");
            await fetchOrders();
          } catch (error) {
            console.error("Lỗi khi hủy đơn hàng:", error);
            Alert.alert("Lỗi", "Không thể hủy đơn hàng. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  // ✅ Xác nhận đã nhận hàng (processing → completed)
  const confirmReceived = async (orderId: string) => {
    Alert.alert(
      "Xác nhận nhận hàng",
      "Bạn đã nhận được hàng và hài lòng với đơn hàng này?",
      [
        { text: "Chưa", style: "cancel" },
        {
          text: "Đã nhận",
          onPress: async () => {
            try {
              const orderRef = doc(db, "orders", orderId);
              await updateDoc(orderRef, {
                status: "completed",
                updatedAt: new Date(),
              });
              Alert.alert("Cảm ơn bạn!", "Đơn hàng đã hoàn thành");
              await fetchOrders();
            } catch (error) {
              console.error("Lỗi khi xác nhận nhận hàng:", error);
              Alert.alert("Lỗi", "Không thể cập nhật. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#924900" />
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
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#924900"]}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtext}>
              Các đơn hàng của bạn sẽ hiển thị ở đây
            </Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() =>
                  (navigation as any).navigate("OrderDetail", {
                    orderId: order.id,
                  })
                }
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color="#924900"
                    />
                    <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                <View style={styles.orderBody}>
                  <View style={styles.orderRow}>
                    <Ionicons name="calendar-outline" size={18} color="#666" />
                    <Text style={styles.orderLabel}>Ngày đặt:</Text>
                    <Text style={styles.orderValue}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>

                  {order.items && order.items.length > 0 && (
                    <View style={styles.orderRow}>
                      <Ionicons name="basket-outline" size={18} color="#666" />
                      <Text style={styles.orderLabel}>Số sản phẩm:</Text>
                      <Text style={styles.orderValue}>
                        {order.items.length} món
                      </Text>
                    </View>
                  )}

                  <View style={styles.orderDivider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng tiền:</Text>
                    <Text style={styles.totalPrice}>
                      {formatPrice(order.total || 0)}
                    </Text>
                  </View>
                </View>

                {/* Danh sách sản phẩm */}
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>Sản phẩm:</Text>
                    {order.items.slice(0, 3).map((item: any, index: number) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          • {item.name || "Sản phẩm"}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          x{item.quantity || 1}
                        </Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text style={styles.moreItems}>
                        +{order.items.length - 3} sản phẩm khác
                      </Text>
                    )}
                  </View>
                )}

                {/* Nút hành động theo trạng thái */}
                <View style={styles.actionButtons}>
                  {order.status === "pending" && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => cancelOrder(order.id)}
                    >
                      <Ionicons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.cancelText}>Hủy đơn hàng</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === "processing" && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => confirmReceived(order.id)}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.confirmText}>Đã nhận hàng</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default OrdersScreen;

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
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#924900",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  ordersContainer: {
    padding: 20,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  orderBody: {
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 15,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  orderValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#924900",
  },
  itemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  moreItems: {
    fontSize: 13,
    color: "#924900",
    fontStyle: "italic",
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 10,
    gap: 10,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F44336",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});
