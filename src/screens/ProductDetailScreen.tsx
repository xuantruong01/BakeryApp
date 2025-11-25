import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { useApp } from "../contexts/AppContext";

export default function ProductDetailScreen({ route, navigation }: any) {
  const { theme, t } = useApp();
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  // Refresh reviews khi quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [])
  );

  /* ------------------- Lấy đánh giá ------------------- */
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);

      // Lấy thông tin rating từ product
      const productRef = doc(db, "products", product.id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        setAverageRating(productData.averageRating || 0);
        setReviewCount(productData.reviewCount || 0);
      }

      // Lấy danh sách reviews (không dùng orderBy để tránh yêu cầu composite index)
      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(
        reviewsRef,
        where("productId", "==", product.id)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsList = reviewsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          // Sort by createdAt descending
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10); // Limit to 10 reviews
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  /* ------------------- Thêm vào giỏ hàng ------------------- */
  const addToCart = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.uid) {
        Alert.alert("⚠️", t("pleaseLogin"));
        return;
      }

      if (product.stock === 0) {
        Alert.alert("⚠️", t("productOutOfStock"));
        return;
      }

      const cartItemRef = doc(db, "carts", user.uid, "items", product.id);
      const cartItemSnap = await getDoc(cartItemRef);

      if (cartItemSnap.exists()) {
        await updateDoc(cartItemRef, { quantity: increment(quantity) });
      } else {
        await setDoc(cartItemRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || "",
          quantity: quantity,
          createdAt: new Date().toISOString(),
        });
      }

      Alert.alert(
        "🛒",
        `${t("added")} ${quantity} ${t("product")} ${t("toCart")}!`
      );
      setQuantity(1);
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
    }
  };

  /* ------------------- Tăng / giảm số lượng ------------------- */
  const increase = () => {
    const maxStock = product.stock ?? 9999;
    if (quantity < maxStock) setQuantity(quantity + 1);
  };

  const decrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  /* ------------------- Render giao diện ------------------- */
  return (
    <LinearGradient
      colors={[theme.lightBg, theme.background, "#FFFFFF"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t("productDetails")}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Image Container */}
          {!!product.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary + "30",
              },
            ]}
          >
            <Text style={[styles.name, { color: theme.text }]}>
              {product.name}
            </Text>

            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.primary }]}>
                {Number(product.price).toLocaleString()}đ
              </Text>
              <View
                style={[styles.stockBadge, { backgroundColor: theme.lightBg }]}
              >
                <Ionicons
                  name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={product.stock > 0 ? theme.secondary : "#F44336"}
                />
                <Text style={[styles.stockText, { color: theme.text + "80" }]}>
                  {product.stock > 0
                    ? `${t("inStock")}: ${product.stock}`
                    : t("outOfStock")}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                { backgroundColor: theme.primary + "30" },
              ]}
            />

            {/* Quantity Selector */}
            <View style={styles.qtyContainer}>
              <Text style={[styles.qtyLabel, { color: theme.text }]}>
                {t("quantity")}
              </Text>
              <View
                style={[
                  styles.qtyBox,
                  {
                    backgroundColor: theme.lightBg,
                    borderColor: theme.primary + "40",
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={decrease}
                  disabled={quantity <= 1 || product.stock === 0}
                >
                  <Text
                    style={[
                      { fontSize: 24, fontWeight: "700", color: theme.primary },
                      (quantity <= 1 || product.stock === 0) && {
                        color: theme.text + "40",
                      },
                    ]}
                  >
                    −
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.qtyInput, { color: theme.text }]}
                  keyboardType="numeric"
                  editable={product.stock > 0}
                  value={String(quantity)}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                    if (isNaN(num)) {
                      setQuantity(1);
                      return;
                    }
                    const maxStock = product.stock ?? 9999;
                    if (num > maxStock) setQuantity(maxStock);
                    else if (num < 1) setQuantity(1);
                    else setQuantity(num);
                  }}
                />

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={increase}
                  disabled={
                    product.stock === 0 || quantity >= (product.stock ?? 9999)
                  }
                >
                  <Text
                    style={[
                      { fontSize: 24, fontWeight: "700", color: theme.primary },
                      (product.stock === 0 ||
                        quantity >= (product.stock ?? 9999)) && {
                        color: theme.text + "40",
                      },
                    ]}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                { backgroundColor: theme.primary + "30" },
              ]}
            />

            {/* Description */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("description")}
            </Text>
            <Text style={[styles.desc, { color: theme.text + "80" }]}>
              {product.description || t("noDescription")}
            </Text>
          </View>

          {/* Reviews Section */}
          <View
            style={[
              styles.reviewsCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary + "30",
              },
            ]}
          >
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t("customerReviews")}
              </Text>
              {reviewCount > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>
                    {averageRating.toFixed(1)} ({reviewCount})
                  </Text>
                </View>
              )}
            </View>

            {loadingReviews ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginVertical: 20 }}
              />
            ) : reviews.length === 0 ? (
              <View style={styles.noReviewsContainer}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={50}
                  color={theme.text + "40"}
                />
                <Text
                  style={[styles.noReviewsText, { color: theme.text + "60" }]}
                >
                  {t("noReviewsYet")}
                </Text>
                <Text
                  style={[
                    styles.noReviewsSubtext,
                    { color: theme.text + "40" },
                  ]}
                >
                  {t("beFirstToReview")}
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View
                    key={review.id}
                    style={[
                      styles.reviewItem,
                      { borderBottomColor: theme.primary + "20" },
                    ]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserInfo}>
                        <View
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: theme.primary + "30" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              { color: theme.primary },
                            ]}
                          >
                            {review.userName?.charAt(0).toUpperCase() || "?"}
                          </Text>
                        </View>
                        <View style={styles.reviewUserDetails}>
                          <Text
                            style={[
                              styles.reviewUserName,
                              { color: theme.text },
                            ]}
                          >
                            {review.userName || "Khách hàng"}
                          </Text>
                          <View style={styles.reviewStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={
                                  star <= review.rating
                                    ? "star"
                                    : "star-outline"
                                }
                                size={14}
                                color="#FFD700"
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.reviewDate,
                          { color: theme.text + "60" },
                        ]}
                      >
                        {review.createdAt?.toDate
                          ? review.createdAt
                              .toDate()
                              .toLocaleDateString("vi-VN")
                          : ""}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.reviewComment,
                        { color: theme.text + "80" },
                      ]}
                    >
                      {review.comment}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        {/* Bottom Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.primary + "30",
            },
          ]}
        >
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={addToCart}
              activeOpacity={0.8}
              disabled={product.stock === 0}
            >
              <LinearGradient
                colors={
                  product.stock === 0
                    ? ([theme.text + "40", theme.text + "60"] as any)
                    : (theme.aiGradient as any)
                }
                style={styles.btnAddCart}
              >
                <Ionicons name="cart-outline" size={20} color="#FFF" />
                <Text style={styles.btnText}>
                  {product.stock === 0 ? t("outOfStock") : t("addToCart")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={() =>
                navigation.navigate("Checkout", {
                  productDirect: { ...product, quantity },
                })
              }
              activeOpacity={0.8}
              disabled={product.stock === 0}
            >
              <LinearGradient
                colors={
                  product.stock === 0
                    ? ([theme.text + "40", theme.text + "60"] as any)
                    : ([theme.secondary, theme.primary, theme.accent] as any)
                }
                style={styles.btnCheckout}
              >
                <Ionicons name="flash-outline" size={20} color="#FFF" />
                <Text style={styles.btnText}>
                  {product.stock === 0 ? t("cannotOrder") : t("buyNow")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  imageContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 280,
  },

  infoCard: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },

  name: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  stockText: {
    fontSize: 13,
    fontWeight: "600",
  },

  divider: {
    height: 2,
    marginVertical: 20,
  },

  qtyContainer: {
    marginBottom: 16,
  },
  qtyLabel: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  qtyInput: {
    width: 60,
    height: 44,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  desc: {
    fontSize: 15,
    lineHeight: 24,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 14,
  },
  btnWrapper: {
    flex: 1,
  },
  btnAddCart: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnCheckout: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Reviews styles
  reviewsCard: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 4,
  },
  noReviewsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noReviewsText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: "600",
  },
  noReviewsSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 50,
  },
});
