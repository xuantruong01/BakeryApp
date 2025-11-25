import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { useApp } from "../../contexts/AppContext";
import { useNotifications } from "../../contexts/NotificationContext";

const AdminNotificationsScreen = ({ navigation }) => {
  const { theme, t } = useApp();
  const { markAsViewed } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Mark notifications as viewed khi vào trang
    markAsViewed();

    // Setup real-time listener
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(ordersQuery, (ordersSnapshot) => {
      // Sort ở client theo createdAt descending
      const notificationsData = ordersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          type: "new_order",
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bTime.getTime() - aTime.getTime();
        });

      setNotifications(notificationsData);
      setLoading(false);
      setRefreshing(false);
    });

    // Cleanup listener khi unmount
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  const fetchNotifications = async () => {
    // Refresh được handle bởi real-time listener, chỉ cần reset refreshing state
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = (notification) => {
    // Điều hướng đến trang chi tiết đơn hàng
    navigation.navigate("OrderDetail", {
      orderId: notification.id,
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="cart" size={24} color="#FF6B6B" />
        </View>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>
          Đơn hàng mới #{item.id.slice(0, 8)}
        </Text>
        <Text style={styles.notificationMessage}>
          Khách hàng: {item.customerName || "N/A"}
        </Text>
        <Text style={styles.notificationMessage}>
          Tổng tiền: {formatPrice(item.total || 0)}
        </Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Mới</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.primary }]}
      edges={["top"]}
    >
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>{t("noNotifications")}</Text>
            <Text style={styles.emptySubtext}>{t("pendingOrdersHere")}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  listContainer: {
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  notificationCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});

export default AdminNotificationsScreen;
