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
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../contexts/AppContext";

const OrderHistoryScreen = () => {
  const navigation = useNavigation();
  const { theme, t } = useApp();
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
        where("status", "in", ["completed", "cancelled"]),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(ordersList);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đơn hàng:", error);
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
      case "completed":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const handleReorder = async (order: any) => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      // Tạo dữ liệu đơn hàng mới
      const newOrder = {
        userId: parsedUser.uid,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        total: order.total,
        status: "pending",
        paymentMethod: order.paymentMethod || "cash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Chuyển sang màn hình thanh toán với dữ liệu mới
      navigation.navigate("Checkout", { reorderData: newOrder });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo lại đơn hàng");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          {t("orderHistory")}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="time-outline"
              size={80}
              color={theme.primary}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {t("noOrdersYet")}
            </Text>
            <Text style={styles.emptySubtext}>{t("completedOrdersHere")}</Text>
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
                      name={getStatusIcon(order.status) as any}
                      size={20}
                      color={getStatusColor(order.status)}
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
                    <Text
                      style={[
                        styles.totalPrice,
                        order.status === "cancelled" && styles.cancelledPrice,
                      ]}
                    >
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

                {/* Nút mua lại cho đơn hoàn thành */}
                {order.status === "completed" && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => handleReorder(order)}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color="#924900"
                    />
                    <Text style={styles.reorderText}>Mua lại</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrderHistoryScreen;

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
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  ordersContainer: {
    padding: 20,
  },
  orderCard: {
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
    marginLeft: 8,
    flex: 1,
  },
  orderValue: {
    fontSize: 15,
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
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "bold",
  },
  cancelledPrice: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  itemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
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
  },
  itemQuantity: {
    fontSize: 14,
    marginLeft: 10,
  },
  moreItems: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  reorderText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
