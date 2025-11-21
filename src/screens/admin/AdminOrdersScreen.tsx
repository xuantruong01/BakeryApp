import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../services/firebaseConfig";

const AdminOrdersScreen = ({ navigation, route }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(
    route?.params?.filter || "all"
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    if (selectedFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter((order) => order.status === selectedFilter)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      Alert.alert(
        "Thành công",
        `Đã cập nhật trạng thái đơn hàng thành "${getStatusText(newStatus)}"`
      );
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng");
    }
  };

  const confirmOrder = (orderId) => {
    Alert.alert(
      "Xác nhận đơn hàng",
      "Bạn có chắc muốn xác nhận đơn hàng này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: () => updateOrderStatus(orderId, "processing"),
        },
      ]
    );
  };

  const completeOrder = (orderId) => {
    Alert.alert(
      "Hoàn thành đơn hàng",
      "Xác nhận đơn hàng đã được giao thành công?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Hoàn thành",
          onPress: () => updateOrderStatus(orderId, "completed"),
        },
      ]
    );
  };

  const cancelOrder = (orderId) => {
    Alert.alert("Hủy đơn hàng", "Bạn có chắc muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: () => updateOrderStatus(orderId, "cancelled"),
      },
    ]);
  };

  const getStatusText = (status) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "processing":
        return "#17A2B8";
      case "completed":
        return "#28A745";
      case "cancelled":
        return "#DC3545";
      default:
        return "#6C757D";
    }
  };

  const getFilterColor = (value) => {
    switch (value) {
      case "pending":
        return "#FFA500";
      case "processing":
        return "#17A2B8";
      case "completed":
        return "#28A745";
      case "cancelled":
        return "#DC3545";
      default:
        return "#E58E26";
    }
  };

  const FilterButton = ({ label, value, count }) => {
    const isActive = selectedFilter === value;
    const bgColor = isActive ? getFilterColor(value) : "#F0F0F0";
    const textColor = isActive ? "#FFF" : "#666";
    return (
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: bgColor }]}
        onPress={() => setSelectedFilter(value)}
      >
        <Text style={[styles.filterText, { color: textColor }]}>{label}</Text>
        {count !== undefined && (
          <View style={[styles.badge, isActive && styles.badgeActive]}>
            <Text style={[styles.badgeText, isActive && { color: "#FFF" }]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.customerName || "Khách hàng"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.infoText}>{item.customerPhone || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.deliveryAddress || "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") || "N/A"}
          </Text>
        </View>
      </View>
      <View style={styles.orderTotal}>
        <Text style={styles.totalLabel}>Tổng tiền:</Text>
        <Text style={styles.totalValue}>
          {item.total?.toLocaleString("vi-VN")}đ
        </Text>
      </View>
      {item.paymentProof && (
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              marginBottom: 4,
              color: "#E58E26",
            }}
          >
            Ảnh xác nhận chuyển khoản:
          </Text>
          <Image
            source={{
              uri: item.paymentProof.startsWith("data:")
                ? item.paymentProof
                : `data:image/jpeg;base64,${item.paymentProof}`,
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#E58E26",
            }}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={styles.orderActions}>
        {item.status === "pending" && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => confirmOrder(item.id)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => cancelOrder(item.id)}
            >
              <Ionicons name="close-circle" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Hủy</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === "processing" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => completeOrder(item.id)}
          >
            <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Hoàn thành</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: getStatusColor(item.status),
            },
          ]}
          onPress={() =>
            navigation.navigate("OrderDetail", { orderId: item.id })
          }
        >
          <Ionicons name="eye" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E58E26" />
          <Text style={{ marginTop: 12, fontSize: 16, color: "#666" }}>
            Đang tải đơn hàng...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📦 Quản Lý Đơn Hàng</Text>
        </View>

        {/* FILTER */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            directionalLockEnabled={true} // Khóa hướng kéo
            alwaysBounceVertical={false} // Không cho bounce theo trục dọc
            bounces={false}
          >
            <FilterButton label="Tất cả" value="all" count={orders.length} />
            <FilterButton
              label="Chờ xác nhận"
              value="pending"
              count={orders.filter((o) => o.status === "pending").length}
            />
            <FilterButton
              label="Đang xử lý"
              value="processing"
              count={orders.filter((o) => o.status === "processing").length}
            />
            <FilterButton
              label="Hoàn thành"
              value="completed"
              count={orders.filter((o) => o.status === "completed").length}
            />
            <FilterButton
              label="Đã hủy"
              value="cancelled"
              count={orders.filter((o) => o.status === "cancelled").length}
            />
          </ScrollView>
        </View>

        {/* LIST */}
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  /* HEADER */
  header: {
    backgroundColor: "#E58E26",
    padding: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D97A1A",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },

  /* FILTER */
  filterWrapper: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    height: 50,
    flexShrink: 0,
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    alignItems: "center",
    height: 50,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 36,
    borderWidth: 0,
    elevation: 0,
  },
  filterButtonActive: {
    borderWidth: 2,
    borderColor: "#333",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  filterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFF",
  },
  badge: {
    marginLeft: 4,
    backgroundColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  badgeText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "bold",
  },
  badgeTextActive: {
    color: "#FFF",
  },

  /* LIST */
  listContainer: {
    padding: 12,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#E58E26",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E58E26",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  orderInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  orderTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E58E26",
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flex: 1,
    minWidth: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: "#28A745",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
  },
  completeButton: {
    backgroundColor: "#17A2B8",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },

  /* EMPTY */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
});

export default AdminOrdersScreen;
