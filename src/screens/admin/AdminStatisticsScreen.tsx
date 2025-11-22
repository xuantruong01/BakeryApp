import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../../contexts/AppContext";

const { width } = Dimensions.get("window");

const AdminStatisticsScreen = ({ navigation }) => {
  const { theme } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    revenue: {
      today: 0,
      week: 0,
      month: 0,
      total: 0,
    },
    orders: {
      today: 0,
      week: 0,
      month: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    },
    topProducts: [],
    topCategories: [],
    recentOrders: [],
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Lấy tất cả đơn hàng và danh mục
      const [ordersSnapshot, categoriesSnapshot, productsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products")),
        ]);

      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Tạo map danh mục để tra cứu nhanh
      const categoriesMap = new Map();
      categoriesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        categoriesMap.set(data.categoryId || doc.id, data.name);
      });

      // Tạo map sản phẩm để lấy categoryId
      const productsMap = new Map();
      productsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        productsMap.set(doc.id, {
          categoryId: data.categoryId,
          name: data.name,
        });
      });

      // Tính toán thời gian
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Thống kê doanh thu
      let revenueToday = 0;
      let revenueWeek = 0;
      let revenueMonth = 0;
      let revenueTotal = 0;

      // Thống kê đơn hàng
      let ordersToday = 0;
      let ordersWeek = 0;
      let ordersMonth = 0;
      let ordersPending = 0;
      let ordersProcessing = 0;
      let ordersCompleted = 0;
      let ordersCancelled = 0;

      // Map sản phẩm và danh mục
      const productSales = new Map();
      const categorySales = new Map();

      orders.forEach((order) => {
        const orderDate = order.createdAt?.toDate?.() || new Date(0);
        const orderTotal = order.total || 0;

        // Doanh thu
        if (order.status === "completed") {
          revenueTotal += orderTotal;
          if (orderDate >= today) revenueToday += orderTotal;
          if (orderDate >= weekAgo) revenueWeek += orderTotal;
          if (orderDate >= monthAgo) revenueMonth += orderTotal;
        }

        // Đơn hàng theo thời gian
        if (orderDate >= today) ordersToday++;
        if (orderDate >= weekAgo) ordersWeek++;
        if (orderDate >= monthAgo) ordersMonth++;

        // Đơn hàng theo trạng thái
        if (order.status === "pending") ordersPending++;
        else if (order.status === "processing") ordersProcessing++;
        else if (order.status === "completed") ordersCompleted++;
        else if (order.status === "cancelled") ordersCancelled++;

        // Sản phẩm bán chạy
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = item.productId || item.id;
            const quantity = item.quantity || 1;
            const current = productSales.get(productId) || {
              name: item.name || "Unknown",
              quantity: 0,
              revenue: 0,
            };
            productSales.set(productId, {
              name: current.name,
              quantity: current.quantity + quantity,
              revenue: current.revenue + (item.price || 0) * quantity,
            });

            // Danh mục bán chạy - lấy từ productsMap
            let categoryId = item.categoryId;
            if (!categoryId && productId) {
              // Nếu item không có categoryId, lấy từ productsMap
              const productInfo = productsMap.get(productId);
              categoryId = productInfo?.categoryId;
            }

            if (categoryId) {
              const categoryName =
                categoriesMap.get(categoryId) || "Chưa phân loại";
              const catCurrent = categorySales.get(categoryId) || {
                name: categoryName,
                quantity: 0,
                revenue: 0,
              };
              categorySales.set(categoryId, {
                name: categoryName,
                quantity: catCurrent.quantity + quantity,
                revenue: catCurrent.revenue + (item.price || 0) * quantity,
              });
            }
          });
        }
      });

      // Top sản phẩm
      const topProducts = Array.from(productSales.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Top danh mục
      const topCategories = Array.from(categorySales.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Đơn hàng gần đây
      const recentOrders = orders
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

      setStats({
        revenue: {
          today: revenueToday,
          week: revenueWeek,
          month: revenueMonth,
          total: revenueTotal,
        },
        orders: {
          today: ordersToday,
          week: ordersWeek,
          month: ordersMonth,
          pending: ordersPending,
          processing: ordersProcessing,
          completed: ordersCompleted,
          cancelled: ordersCancelled,
        },
        topProducts,
        topCategories,
        recentOrders,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  const StatCard = ({ title, value, subtitle, icon, gradient }: any) => (
    <LinearGradient colors={gradient} style={styles.statCard}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
          {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.statCardIcon}>
          <Ionicons name={icon} size={36} color="rgba(255,255,255,0.9)" />
        </View>
      </View>
    </LinearGradient>
  );

  const ChartBar = ({ label, value, maxValue, color }: any) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <View style={styles.chartBarContainer}>
        <Text style={styles.chartBarLabel}>{label}</Text>
        <View style={styles.chartBarWrapper}>
          <View
            style={[
              styles.chartBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
          <Text style={styles.chartBarValue}>{value}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const maxProductQuantity = Math.max(
    ...stats.topProducts.map((p) => p.quantity),
    1
  );
  const maxCategoryRevenue = Math.max(
    ...stats.topCategories.map((c) => c.revenue),
    1
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.primary }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>📊 Thống Kê Chi Tiết</Text>
          <Text style={styles.headerSubtitle}>
            Phân tích dữ liệu kinh doanh
          </Text>
        </LinearGradient>

        {/* Doanh thu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Doanh Thu</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Hôm nay"
              value={`${stats.revenue.today.toLocaleString("vi-VN")}đ`}
              subtitle={`${stats.orders.today} đơn`}
              icon="cash"
              gradient={["#4CAF50", "#45a049"]}
            />
            <StatCard
              title="7 ngày"
              value={`${stats.revenue.week.toLocaleString("vi-VN")}đ`}
              subtitle={`${stats.orders.week} đơn`}
              icon="trending-up"
              gradient={["#2196F3", "#1976D2"]}
            />
            <StatCard
              title="30 ngày"
              value={`${stats.revenue.month.toLocaleString("vi-VN")}đ`}
              subtitle={`${stats.orders.month} đơn`}
              icon="analytics"
              gradient={["#9C27B0", "#7B1FA2"]}
            />
            <StatCard
              title="Tổng cộng"
              value={`${stats.revenue.total.toLocaleString("vi-VN")}đ`}
              subtitle="Tất cả thời gian"
              icon="wallet"
              gradient={["#FF9800", "#F57C00"]}
            />
          </View>
        </View>

        {/* Trạng thái đơn hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Trạng Thái Đơn Hàng</Text>
          <View style={styles.orderStatsContainer}>
            <View style={styles.orderStatItem}>
              <View
                style={[styles.orderStatBadge, { backgroundColor: "#FFA500" }]}
              >
                <Ionicons name="time" size={20} color="#FFF" />
              </View>
              <Text style={styles.orderStatValue}>{stats.orders.pending}</Text>
              <Text style={styles.orderStatLabel}>Chờ xác nhận</Text>
            </View>
            <View style={styles.orderStatItem}>
              <View
                style={[styles.orderStatBadge, { backgroundColor: "#17A2B8" }]}
              >
                <Ionicons name="sync" size={20} color="#FFF" />
              </View>
              <Text style={styles.orderStatValue}>
                {stats.orders.processing}
              </Text>
              <Text style={styles.orderStatLabel}>Đang xử lý</Text>
            </View>
            <View style={styles.orderStatItem}>
              <View
                style={[styles.orderStatBadge, { backgroundColor: "#28A745" }]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              </View>
              <Text style={styles.orderStatValue}>
                {stats.orders.completed}
              </Text>
              <Text style={styles.orderStatLabel}>Hoàn thành</Text>
            </View>
            <View style={styles.orderStatItem}>
              <View
                style={[styles.orderStatBadge, { backgroundColor: "#DC3545" }]}
              >
                <Ionicons name="close-circle" size={20} color="#FFF" />
              </View>
              <Text style={styles.orderStatValue}>
                {stats.orders.cancelled}
              </Text>
              <Text style={styles.orderStatLabel}>Đã hủy</Text>
            </View>
          </View>
        </View>

        {/* Top sản phẩm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Sản Phẩm Bán Chạy</Text>
          <View style={styles.chartContainer}>
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <ChartBar
                  key={product.id}
                  label={`${index + 1}. ${product.name}`}
                  value={product.quantity}
                  maxValue={maxProductQuantity}
                  color={
                    ["#FF6B6B", "#4CAF50", "#2196F3", "#FFA500", "#9C27B0"][
                      index
                    ]
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            )}
          </View>
        </View>

        {/* Top danh mục */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Top Danh Mục Doanh Thu</Text>
          <View style={styles.chartContainer}>
            {stats.topCategories.length > 0 ? (
              stats.topCategories.map((category, index) => (
                <ChartBar
                  key={category.id}
                  label={`${index + 1}. ${category.name}`}
                  value={`${category.revenue.toLocaleString("vi-VN")}đ`}
                  maxValue={maxCategoryRevenue}
                  color={
                    ["#9C27B0", "#FF6B6B", "#2196F3", "#4CAF50", "#FFA500"][
                      index
                    ]
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            )}
          </View>
        </View>

        {/* Đơn hàng gần đây */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <Text style={styles.sectionTitle}>🕒 Đơn Hàng Gần Đây</Text>
          {stats.recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.recentOrderItem}
              onPress={() =>
                navigation.navigate("OrderDetail", { orderId: order.id })
              }
            >
              <View style={styles.recentOrderLeft}>
                <Text style={styles.recentOrderId}>
                  #{order.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={styles.recentOrderCustomer}>
                  {order.customerName || "Khách hàng"}
                </Text>
                <Text style={styles.recentOrderDate}>
                  {order.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") ||
                    "N/A"}
                </Text>
              </View>
              <View style={styles.recentOrderRight}>
                <Text style={styles.recentOrderAmount}>
                  {order.total?.toLocaleString("vi-VN")}đ
                </Text>
                <View
                  style={[
                    styles.recentOrderStatus,
                    {
                      backgroundColor:
                        order.status === "completed"
                          ? "#28A745"
                          : order.status === "processing"
                          ? "#17A2B8"
                          : order.status === "pending"
                          ? "#FFA500"
                          : "#DC3545",
                    },
                  ]}
                >
                  <Text style={styles.recentOrderStatusText}>
                    {order.status === "completed"
                      ? "Hoàn thành"
                      : order.status === "processing"
                      ? "Đang xử lý"
                      : order.status === "pending"
                      ? "Chờ xác nhận"
                      : "Đã hủy"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {stats.recentOrders.length === 0 && (
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statCardLeft: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  statCardSubtitle: {
    fontSize: 11,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  statCardIcon: {
    marginLeft: 8,
  },
  orderStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderStatItem: {
    alignItems: "center",
    flex: 1,
  },
  orderStatBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  orderStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  orderStatLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartBarContainer: {
    marginBottom: 16,
  },
  chartBarLabel: {
    fontSize: 13,
    color: "#333",
    marginBottom: 6,
    fontWeight: "500",
  },
  chartBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
    minWidth: 40,
    justifyContent: "center",
    paddingLeft: 8,
  },
  chartBarValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  recentOrderItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentOrderLeft: {
    flex: 1,
  },
  recentOrderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  recentOrderCustomer: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  recentOrderDate: {
    fontSize: 11,
    color: "#999",
  },
  recentOrderRight: {
    alignItems: "flex-end",
  },
  recentOrderAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 6,
  },
  recentOrderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentOrderStatusText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default AdminStatisticsScreen;
