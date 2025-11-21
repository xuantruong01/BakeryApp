import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const AdminHelpScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.mainTitle}>📚 Hướng dẫn Quản trị Bakery App</Text>

          {/* Thông tin đăng nhập */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="key" size={16} /> Thông tin đăng nhập Admin
            </Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>admin@gmail.com</Text>
            </View>
            <Text style={styles.note}>
              💡 Hệ thống tự động nhận diện admin qua email
            </Text>
          </View>

          {/* Các chức năng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="cube" size={16} /> Các chức năng Admin
            </Text>

            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>1. Dashboard (Tổng quan)</Text>
              <Text style={styles.featureDesc}>
                • Xem thống kê tổng số đơn hàng{"\n"}• Theo dõi đơn hàng chờ xác
                nhận, đang xử lý, hoàn thành{"\n"}• Xem tổng doanh thu{"\n"}•
                Thống kê số lượng sản phẩm và khách hàng
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>2. Quản lý Đơn hàng</Text>
              <Text style={styles.featureDesc}>
                • Xem danh sách tất cả đơn hàng{"\n"}• Lọc đơn hàng theo trạng
                thái{"\n"}• Xác nhận đơn hàng: "Chờ xác nhận" → "Đang xử lý"
                {"\n"}• Hoàn thành đơn hàng: "Đang xử lý" → "Hoàn thành"{"\n"}•
                Hủy đơn hàng khi cần thiết{"\n"}• Xem chi tiết thông tin đơn
                hàng
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>3. Quản lý Sản phẩm</Text>
              <Text style={styles.featureDesc}>
                • Thêm sản phẩm mới: Tên, giá, danh mục, mô tả, hình ảnh, tồn
                kho{"\n"}• Sửa thông tin sản phẩm{"\n"}• Xóa sản phẩm khỏi hệ
                thống{"\n"}• Tìm kiếm và lọc theo danh mục
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>4. Quản lý Danh mục</Text>
              <Text style={styles.featureDesc}>
                • Thêm danh mục mới: Tên, mô tả, icon{"\n"}• Sửa thông tin danh
                mục{"\n"}• Xóa danh mục (sản phẩm không bị xóa)
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>5. Thống kê</Text>
              <Text style={styles.featureDesc}>
                • Doanh thu theo tháng/tuần{"\n"}• Top sản phẩm bán chạy{"\n"}•
                Top danh mục phổ biến{"\n"}• Danh sách đơn hàng gần đây
              </Text>
            </View>
          </View>

          {/* Luồng hoạt động */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="git-network" size={16} /> Luồng hoạt động đơn hàng
            </Text>
            <View style={styles.flowContainer}>
              <View style={styles.flowStep}>
                <View
                  style={[styles.flowDot, { backgroundColor: "#FFA500" }]}
                />
                <Text style={styles.flowText}>
                  1. Khách hàng đặt hàng → "Chờ xác nhận"
                </Text>
              </View>
              <View style={styles.flowLine} />
              <View style={styles.flowStep}>
                <View
                  style={[styles.flowDot, { backgroundColor: "#2196F3" }]}
                />
                <Text style={styles.flowText}>
                  2. Admin xác nhận → "Đang xử lý"
                </Text>
              </View>
              <View style={styles.flowLine} />
              <View style={styles.flowStep}>
                <View
                  style={[styles.flowDot, { backgroundColor: "#4CAF50" }]}
                />
                <Text style={styles.flowText}>
                  3. Khách nhận hàng → "Hoàn thành"
                </Text>
              </View>
            </View>
          </View>

          {/* Lưu ý */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="alert-circle" size={16} /> Lưu ý quan trọng
            </Text>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Khi xóa sản phẩm, hãy chắc chắn không có đơn hàng nào đang sử
                dụng sản phẩm đó
              </Text>
            </View>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Doanh thu chỉ tính từ các đơn hàng "Hoàn thành"
              </Text>
            </View>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Đăng xuất sẽ chuyển về giao diện khách hàng
              </Text>
            </View>
          </View>

          {/* Hỗ trợ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="help-circle" size={16} /> Cần hỗ trợ?
            </Text>
            <Text style={styles.supportText}>
              Nếu gặp vấn đề khi sử dụng, vui lòng liên hệ:{"\n\n"}
              📧 Email: support@bakeryapp.com{"\n"}
              📞 Hotline: 1900-xxxx{"\n"}
              🌐 Website: www.bakeryapp.com
            </Text>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Bakery Admin v1.0.0</Text>
          </View>
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
  header: {
    backgroundColor: "#FF6B6B",
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  note: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  featureItem: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  flowContainer: {
    paddingLeft: 16,
  },
  flowStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  flowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  flowText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  flowLine: {
    width: 2,
    height: 20,
    backgroundColor: "#DDD",
    marginLeft: 5,
    marginVertical: 4,
  },
  warningBox: {
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  warningText: {
    fontSize: 13,
    color: "#333",
  },
  supportText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  versionText: {
    fontSize: 12,
    color: "#999",
  },
});

export default AdminHelpScreen;
