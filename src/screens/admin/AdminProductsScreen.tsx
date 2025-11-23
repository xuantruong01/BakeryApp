import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { useApp } from "../../contexts/AppContext";

const AdminProductsScreen = ({ navigation }) => {
  const { theme, t } = useApp();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [focusedInput, setFocusedInput] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: "",
    image: "",
    stock: "",
  });

  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const descRef = useRef(null);
  const imageRef = useRef(null);
  const stockRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setFocusedInput(null);
  };

  const filterProducts = () => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.categoryId === selectedCategory
      );
    }
    setFilteredProducts(filtered);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(t("error"), t("cannotLoadProducts"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      description: "",
      categoryId: categories[0]?.id || "",
      image: "",
      stock: "",
    });
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      price: product.price?.toString() || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      image: product.image || "",
      stock: product.stock?.toString() || "",
    });
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    dismissKeyboard();
    try {
      if (!formData.name || !formData.price || !formData.categoryId) {
        Alert.alert(t("error"), t("fillRequiredFields"));
        return;
      }
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        categoryId: formData.categoryId,
        image: formData.image,
        stock: parseInt(formData.stock) || 0,
        updatedAt: new Date(),
      };
      if (editingProduct) {
        const productRef = doc(db, "products", editingProduct.id);
        await updateDoc(productRef, productData);
        Alert.alert(t("success"), t("productUpdated"));
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date(),
        });
        Alert.alert(t("success"), t("productAdded"));
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert(t("error"), t("cannotSaveProduct"));
    }
  };

  const handleDeleteProduct = (productId, productName) => {
    Alert.alert(
      t("deleteProduct"),
      `${t("confirmDeleteProduct")} "${productName}"?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", productId));
              Alert.alert(t("success"), t("productDeleted"));
              fetchData();
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert(t("error"), t("cannotDeleteProduct"));
            }
          },
        },
      ]
    );
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "N/A";
  };

  // Màu cho từng category (ví dụ, có thể chỉnh lại cho phù hợp)
  const getCategoryColor = (id) => {
    if (id === "all") return "#E58E26";
    // Nếu có category màu riêng, có thể lưu vào categories
    // Ví dụ: categories.find(cat => cat.id === id)?.color
    // Nếu không, mặc định màu xanh
    if (id === "cancelled") return "#DC3545";
    if (id === "completed") return "#28A745";
    if (id === "processing") return "#17A2B8";
    if (id === "pending") return "#FFA500";
    return "#4A90E2";
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/80" }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productCategory}>
          {getCategoryName(item.categoryId)}
        </Text>
        <Text style={styles.productPrice}>
          {item.price?.toLocaleString("vi-VN")}đ
        </Text>
        <Text style={styles.productStock}>
          {t("stock")}: {item.stock || 0}
        </Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create" size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id, item.name)}
        >
          <Ionicons name="trash" size={20} color="#DC3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 12, fontSize: 16, color: "#666" }}>
            {t("loadingProducts")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.primary }]}
      edges={["top"]}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <Text style={styles.headerTitle}>🍞 {t("productManagement")}</Text>
          <TouchableOpacity
            style={styles.addButtonHeader}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              focusedInput === "search" && styles.inputFocused,
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={focusedInput === "search" ? "#FF6B6B" : "#999"}
            />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder={t("searchProducts")}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedInput("search")}
              onBlur={() => setFocusedInput(null)}
              returnKeyType="search"
              onSubmitEditing={dismissKeyboard}
              blurOnSubmit={true}
            />
            {searchQuery !== "" && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  dismissKeyboard();
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FILTER FIXED */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            directionalLockEnabled={true} // Khóa hướng kéo
            alwaysBounceVertical={false} // Không cho bounce theo trục dọc
            bounces={false}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: getCategoryColor("all") },
                selectedCategory === "all" && {
                  backgroundColor: getCategoryColor("all"),
                  borderWidth: 2,
                  borderColor: "#333",
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                },
              ]}
              onPress={() => setSelectedCategory("all")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === "all" && {
                    color: "#FFF",
                    fontWeight: "700",
                  },
                ]}
              >
                Tất cả ({products.length})
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: getCategoryColor(cat.id) },
                  selectedCategory === cat.id && {
                    backgroundColor: getCategoryColor(cat.id),
                    borderWidth: 2,
                    borderColor: "#333",
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === cat.id && {
                      color: "#FFF",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {cat.name} (
                  {products.filter((p) => p.categoryId === cat.id).length})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* LIST */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={dismissKeyboard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== "all"
                  ? t("noProductsFound")
                  : t("noProducts")}
              </Text>
            </View>
          }
        />

        {/* MODAL thêm/sửa */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, width: "100%" }}
              >
                <View style={styles.modalContent}>
                  {/* HEADER */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {editingProduct
                        ? `✏️ ${t("editProduct")}`
                        : `➕ ${t("addProduct")}`}
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => {
                        dismissKeyboard();
                        setModalVisible(false);
                      }}
                    >
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {/* FORM */}
                  <ScrollView
                    style={styles.formScrollView}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.formContainer}>
                      {/* Tên sản phẩm */}
                      <Text style={styles.label}>{t("productName")} *</Text>
                      <TextInput
                        ref={nameRef}
                        style={[
                          styles.input,
                          focusedInput === "name" && styles.inputFocused,
                        ]}
                        placeholder={t("enterProductName")}
                        placeholderTextColor="#999"
                        value={formData.name}
                        onChangeText={(text) =>
                          setFormData({ ...formData, name: text })
                        }
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                      />

                      {/* Giá */}
                      <Text style={styles.label}>{t("price")} (đ) *</Text>
                      <TextInput
                        ref={priceRef}
                        style={[
                          styles.input,
                          focusedInput === "price" && styles.inputFocused,
                        ]}
                        placeholder={t("enterPrice")}
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                        value={formData.price}
                        onChangeText={(text) =>
                          setFormData({ ...formData, price: text })
                        }
                        onFocus={() => setFocusedInput("price")}
                        onBlur={() => setFocusedInput(null)}
                      />

                      {/* Mô tả */}
                      <Text style={styles.label}>{t("description")}</Text>
                      <TextInput
                        ref={descRef}
                        style={[
                          styles.input,
                          styles.textArea,
                          focusedInput === "description" && styles.inputFocused,
                        ]}
                        placeholder={t("enterDescription")}
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        value={formData.description}
                        onChangeText={(text) =>
                          setFormData({ ...formData, description: text })
                        }
                        onFocus={() => setFocusedInput("description")}
                        onBlur={() => setFocusedInput(null)}
                      />

                      {/* Danh mục */}
                      <Text style={styles.label}>{t("category")} *</Text>
                      <View style={styles.categoryPicker}>
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[
                              styles.categoryOption,
                              formData.categoryId === cat.id &&
                                styles.categoryOptionActive,
                            ]}
                            onPress={() =>
                              setFormData({ ...formData, categoryId: cat.id })
                            }
                          >
                            <Text
                              style={[
                                styles.categoryOptionText,
                                formData.categoryId === cat.id &&
                                  styles.categoryOptionTextActive,
                              ]}
                            >
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* URL ảnh */}
                      <Text style={styles.label}>{t("imageURL")}</Text>
                      <TextInput
                        ref={imageRef}
                        style={[
                          styles.input,
                          focusedInput === "image" && styles.inputFocused,
                        ]}
                        placeholder="https://example.com/image.jpg"
                        placeholderTextColor="#999"
                        value={formData.image}
                        onChangeText={(text) =>
                          setFormData({ ...formData, image: text })
                        }
                        onFocus={() => setFocusedInput("image")}
                        onBlur={() => setFocusedInput(null)}
                      />

                      {/* Preview ảnh */}
                      {formData.image && (
                        <View style={styles.imagePreviewContainer}>
                          <Text style={styles.imagePreviewLabel}>
                            {t("preview")}:
                          </Text>
                          <Image
                            source={{ uri: formData.image }}
                            style={styles.imagePreview}
                          />
                        </View>
                      )}

                      {/* Tồn kho */}
                      <Text style={styles.label}>{t("stock")}</Text>
                      <View style={styles.stockInputContainer}>
                        <TouchableOpacity
                          style={styles.stockButton}
                          onPress={() =>
                            setFormData({
                              ...formData,
                              stock: Math.max(
                                0,
                                (parseInt(formData.stock) || 0) - 1
                              ).toString(),
                            })
                          }
                        >
                          <Ionicons name="remove" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TextInput
                          ref={stockRef}
                          style={styles.stockInput}
                          placeholder="0"
                          placeholderTextColor="#999"
                          keyboardType="number-pad"
                          value={formData.stock}
                          onChangeText={(text) =>
                            setFormData({
                              ...formData,
                              stock: text.replace(/[^0-9]/g, ""),
                            })
                          }
                          onFocus={() => setFocusedInput("stock")}
                          onBlur={() => setFocusedInput(null)}
                        />
                        <TouchableOpacity
                          style={styles.stockButton}
                          onPress={() =>
                            setFormData({
                              ...formData,
                              stock: (
                                (parseInt(formData.stock) || 0) + 1
                              ).toString(),
                            })
                          }
                        >
                          <Ionicons name="add" size={24} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>

                  {/* ACTIONS */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        dismissKeyboard();
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={handleSaveProduct}
                    >
                      <Text style={styles.saveButtonText}>{t("save")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  /* 🛠 FILTER FIX START */
  filterWrapper: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    height: 50,
    flexShrink: 0,
    justifyContent: "center",
    position: "relative",
    zIndex: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
    height: 50,
    flexGrow: 0,
  },
  /* 🛠 FILTER FIX END */

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#FF6B6B" },
  filterChipText: { fontSize: 12, color: "#666", fontWeight: "500" },
  filterChipTextActive: { color: "#FFF", fontWeight: "600" },

  /* HEADER */
  header: {
    padding: 16,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  addButtonHeader: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  /* SEARCH */
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocused: { borderColor: "#FF6B6B", backgroundColor: "#FFF" },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#333" },

  /* LIST */
  listContainer: { padding: 12 },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productCategory: { fontSize: 12, color: "#999", marginBottom: 4 },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 4,
  },
  productStock: { fontSize: 12, color: "#666" },
  productActions: { justifyContent: "center", gap: 8 },
  editButton: { padding: 8, backgroundColor: "#E3F2FD", borderRadius: 8 },
  deleteButton: { padding: 8, backgroundColor: "#FFEBEE", borderRadius: 8 },

  /* EMPTY */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999" },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  closeButton: { padding: 4 },

  /* FORM */
  formScrollView: { maxHeight: "65%" },
  formContainer: { padding: 16 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  textArea: { height: 90, textAlignVertical: "top" },

  /* CATEGORY */
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  categoryOptionActive: { backgroundColor: "#FF6B6B", borderColor: "#FF6B6B" },
  categoryOptionText: { fontSize: 14, color: "#666" },
  categoryOptionTextActive: { color: "#FFF", fontWeight: "600" },

  /* IMAGE PREVIEW */
  imagePreviewContainer: { marginTop: 12, alignItems: "center" },
  imagePreviewLabel: { fontSize: 12, color: "#666", marginBottom: 8 },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },

  /* STOCK */
  stockInputContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  stockButton: {
    backgroundColor: "#FF6B6B",
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  stockInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#FAFAFA",
    color: "#333",
  },

  /* ACTIONS */
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    backgroundColor: "#FFF",
  },
  modalButton: { flex: 1, padding: 16, borderRadius: 10, alignItems: "center" },
  cancelButton: { backgroundColor: "#F0F0F0" },
  saveButton: { backgroundColor: "#FF6B6B" },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#666" },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
});

export default AdminProductsScreen;
