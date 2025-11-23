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
import { useApp } from "../contexts/AppContext";

const OrdersScreen = () => {
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
      <View style={[styles.center, { backgroundColor: theme.background }]}>
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
          {t("myOrders")}
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
              name="cart-outline"
              size={80}
              color={theme.primary}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {t("noOrdersYet")}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "80" }]}>
              {t("ordersWillShowHere")}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.lightBg,
                  },
                ]}
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
                      color={theme.primary}
                    />
                    <Text style={[styles.orderId, { color: theme.text }]}>
                      #{order.id.slice(0, 8)}
                    </Text>
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

                <View
                  style={[
                    styles.orderDivider,
                    { backgroundColor: theme.lightBg },
                  ]}
                />

                <View style={styles.orderBody}>
                  <View style={styles.orderRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={theme.text + "80"}
                    />
                    <Text style={[styles.orderLabel, { color: theme.text }]}>
                      Ngày đặt:
                    </Text>
                    <Text style={[styles.orderValue, { color: theme.text }]}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>

                  {order.items && order.items.length > 0 && (
                    <View style={styles.orderRow}>
                      <Ionicons
                        name="basket-outline"
                        size={18}
                        color={theme.text + "80"}
                      />
                      <Text style={[styles.orderLabel, { color: theme.text }]}>
                        Số sản phẩm:
                      </Text>
                      <Text style={[styles.orderValue, { color: theme.text }]}>
                        {order.items.length} món
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.orderDivider,
                      { backgroundColor: theme.lightBg },
                    ]}
                  />

                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>
                      Tổng tiền:
                    </Text>
                    <Text style={[styles.totalPrice, { color: theme.primary }]}>
                      {formatPrice(order.total || 0)}
                    </Text>
                  </View>
                </View>

                {/* Danh sách sản phẩm */}
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    <Text style={[styles.itemsTitle, { color: theme.text }]}>
                      Sản phẩm:
                    </Text>
                    {order.items.slice(0, 3).map((item: any, index: number) => (
                      <View key={index} style={styles.itemRow}>
                        <Text
                          style={[styles.itemName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          • {item.name || "Sản phẩm"}
                        </Text>
                        <Text
                          style={[
                            styles.itemQuantity,
                            { color: theme.text + "80" },
                          ]}
                        >
                          x{item.quantity || 1}
                        </Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text
                        style={[styles.moreItems, { color: theme.primary }]}
                      >
                        +{order.items.length - 3} sản phẩm khác
                      </Text>
                    )}
                  </View>
                )}

                {/* Nút hành động theo trạng thái */}
                <View style={styles.actionButtons}>
                  {order.status === "pending" && (
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { backgroundColor: "#F44336" },
                      ]}
                      onPress={() => cancelOrder(order.id)}
                    >
                      <Ionicons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.cancelText}>Hủy đơn hàng</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === "processing" && (
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        { backgroundColor: theme.secondary },
                      ]}
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
    </View>
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
