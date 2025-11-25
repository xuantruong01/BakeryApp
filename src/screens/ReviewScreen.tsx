import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { useApp } from "../contexts/AppContext";

export default function ReviewScreen({ route, navigation }: any) {
  const { theme, t } = useApp();
  const { productId, orderId } = route.params;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [productName, setProductName] = useState("");
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    checkPurchaseAndReview();
  }, []);

  const checkPurchaseAndReview = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.uid) {
        Alert.alert("⚠️", t("pleaseLogin"));
        navigation.goBack();
        return;
      }

      // Lấy thông tin sản phẩm
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const data = productSnap.data();
        setProductName(data.name);
        setProductData({ id: productId, ...data });
      }

      // Kiểm tra xem user đã mua sản phẩm này chưa
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(
        ordersRef,
        where("userId", "==", user.uid),
        where("status", "==", "completed")
      );
      const ordersSnapshot = await getDocs(ordersQuery);

      let purchased = false;
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        if (orderData.items) {
          const hasProduct = orderData.items.some(
            (item: any) => item.id === productId
          );
          if (hasProduct) {
            purchased = true;
          }
        }
      });

      if (!purchased) {
        Alert.alert(t("cannotReview"), t("mustPurchaseToReview"), [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        setChecking(false);
        return;
      }

      // Kiểm tra xem đã đánh giá chưa
      console.log("🔍 Checking if already reviewed...");
      console.log("🔍 User ID:", user.uid);
      console.log("🔍 Product ID:", productId);

      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(
        reviewsRef,
        where("userId", "==", user.uid),
        where("productId", "==", productId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);

      console.log("🔍 Reviews found:", reviewsSnapshot.size);
      if (!reviewsSnapshot.empty) {
        reviewsSnapshot.forEach((doc) => {
          console.log("🔍 Existing review:", doc.data());
        });
      }

      if (!reviewsSnapshot.empty) {
        setHasReviewed(true);
        console.log("❌ Already reviewed - blocking");
        Alert.alert(t("alreadyReviewed"), t("alreadyReviewedMessage"), [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        console.log("✅ Not reviewed yet - allowing review");
        setCanReview(true);
      }

      setChecking(false);
    } catch (error) {
      console.error("Error checking purchase:", error);
      Alert.alert("❌", t("errorCheckingPurchase"));
      setChecking(false);
      navigation.goBack();
    }
  };

  const submitReview = async () => {
    if (comment.trim().length < 10) {
      Alert.alert("⚠️", t("reviewTooShort"));
      return;
    }

    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.uid) {
        Alert.alert("⚠️", t("pleaseLogin"));
        return;
      }

      // Thêm đánh giá vào collection reviews
      console.log("💾 Submitting review...");
      console.log("💾 User ID:", user.uid);
      console.log("💾 Product ID:", productId);
      console.log("💾 Rating:", rating);
      console.log("💾 Comment:", comment.trim());

      const reviewData = {
        userId: user.uid,
        userName: user.displayName || user.email || "Khách hàng",
        productId: productId,
        orderId: orderId || "",
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("💾 Review data:", JSON.stringify(reviewData, null, 2));
      const docRef = await addDoc(collection(db, "reviews"), reviewData);
      console.log("✅ Review saved with ID:", docRef.id);

      // Cập nhật tổng số đánh giá và rating trung bình của sản phẩm
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentRatingCount = productData.reviewCount || 0;
        const currentAvgRating = productData.averageRating || 0;

        const newRatingCount = currentRatingCount + 1;
        const newAvgRating =
          (currentAvgRating * currentRatingCount + rating) / newRatingCount;

        await updateDoc(productRef, {
          reviewCount: newRatingCount,
          averageRating: parseFloat(newAvgRating.toFixed(1)),
        });
      }

      Alert.alert("✅", t("reviewSuccess"), [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("❌", t("reviewError"));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.checkingText, { color: theme.text }]}>
          {t("checking")}
        </Text>
      </View>
    );
  }

  if (!canReview || hasReviewed) {
    return null;
  }

  return (
    <LinearGradient
      colors={[theme.lightBg, theme.background, "#FFFFFF"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={28} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t("writeReview")}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Name */}
            <View
              style={[styles.productCard, { backgroundColor: theme.lightBg }]}
            >
              <Text style={[styles.productLabel, { color: theme.text + "80" }]}>
                {t("product")}:
              </Text>
              <Text style={[styles.productName, { color: theme.text }]}>
                {productName}
              </Text>
            </View>

            {/* Rating Section */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.primary + "30",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t("yourRating")}
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={45}
                      color={star <= rating ? "#FFD700" : "#CCC"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.ratingText, { color: theme.primary }]}>
                {rating === 5
                  ? t("excellent")
                  : rating === 4
                  ? t("good")
                  : rating === 3
                  ? t("average")
                  : rating === 2
                  ? t("belowAverage")
                  : t("poor")}
              </Text>
            </View>

            {/* Comment Section */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.primary + "30",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t("yourComment")}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.lightBg,
                    color: theme.text,
                    borderColor: theme.primary + "40",
                  },
                ]}
                placeholder={t("writeYourReview")}
                placeholderTextColor={theme.text + "60"}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: theme.text + "60" }]}>
                {comment.length}/500
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButtonWrapper}
              onPress={submitReview}
              disabled={loading || comment.trim().length < 10}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  loading || comment.trim().length < 10
                    ? ([theme.text + "40", theme.text + "60"] as any)
                    : ([theme.secondary, theme.primary, theme.accent] as any)
                }
                style={styles.submitButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.submitButtonText}>
                      {t("submitReview")}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkingText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },

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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  productCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  productLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 150,
    borderWidth: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },

  submitButtonWrapper: {
    marginTop: 10,
  },
  submitButton: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
