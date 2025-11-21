import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";

const AdminHomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Lấy tất cả đơn hàng
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Tính toán thống kê đơn hàng
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const processingOrders = orders.filter(
        (o) => o.status === "processing"
      ).length;
      const completedOrders = orders.filter(
        (o) => o.status === "completed"
      ).length;
      const cancelledOrders = orders.filter(
        (o) => o.status === "cancelled"
      ).length;

      // Tính tổng doanh thu từ đơn hàng hoàn thành
      const totalRevenue = orders
        .filter((o) => o.status === "completed")
        .reduce((sum, order) => sum + (order.total || 0), 0);

      // Lấy số lượng sản phẩm
      const productsSnapshot = await getDocs(collection(db, "products"));
      const totalProducts = productsSnapshot.size;

      // Lấy số lượng khách hàng (users)
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalCustomers = usersSnapshot.size;

      setStats({
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        totalProducts,
        totalCustomers,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const StatCard = ({ icon, title, value, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard Quản Trị</Text>
          <Text style={styles.headerSubtitle}>Tổng quan hoạt động</Text>
        </View>

        {/* Thống kê đơn hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn Hàng</Text>
          <StatCard
            icon="cart"
            title="Tổng đơn hàng"
            value={stats.totalOrders}
            color="#4A90E2"
            onPress={() => navigation.navigate("AdminOrders")}
          />
          <StatCard
            icon="time"
            title="Chờ xác nhận"
            value={stats.pendingOrders}
            color="#FFA500"
            onPress={() =>
              navigation.navigate("AdminOrders", { filter: "pending" })
            }
          />
          <StatCard
            icon="sync"
            title="Đang xử lý"
            value={stats.processingOrders}
            color="#17A2B8"
            onPress={() =>
              navigation.navigate("AdminOrders", { filter: "processing" })
            }
          />
          <StatCard
            icon="checkmark-circle"
            title="Hoàn thành"
            value={stats.completedOrders}
            color="#28A745"
            onPress={() =>
              navigation.navigate("AdminOrders", { filter: "completed" })
            }
          />
          <StatCard
            icon="close-circle"
            title="Đã hủy"
            value={stats.cancelledOrders}
            color="#DC3545"
            onPress={() =>
              navigation.navigate("AdminOrders", { filter: "cancelled" })
            }
          />
        </View>

        {/* Doanh thu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doanh Thu</Text>
          <StatCard
            icon="cash"
            title="Tổng doanh thu"
            value={`${stats.totalRevenue.toLocaleString("vi-VN")}đ`}
            color="#28A745"
          />
        </View>

        {/* Sản phẩm & Khách hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản Lý</Text>
          <StatCard
            icon="cube"
            title="Tổng sản phẩm"
            value={stats.totalProducts}
            color="#9B59B6"
            onPress={() => navigation.navigate("AdminProducts")}
          />
          <StatCard
            icon="people"
            title="Khách hàng"
            value={stats.totalCustomers}
            color="#E74C3C"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF6B6B",
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
  header: {
    backgroundColor: "#FF6B6B",
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default AdminHomeScreen;
