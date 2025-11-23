import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import {
  Message,
  sendMessageToAI,
  buildContextFromHistory,
  generateAutoSuggestions,
  OrderHistory,
  ProductData,
} from "../services/aiService";
import { useApp } from "../contexts/AppContext";

const ChatBotScreen = () => {
  const { theme, t } = useApp();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [aiContext, setAiContext] = useState("");

  useEffect(() => {
    initializeChatBot();
  }, []);

  const initializeChatBot = async () => {
    try {
      // Lấy thông tin user
      const storedUser = await AsyncStorage.getItem("user");
      let userId = null;

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        userId = parsedUser.uid;
      }

      // Lấy danh sách sản phẩm
      const productsRef = collection(db, "products");
      const productsSnap = await getDocs(productsRef);
      const productsList: ProductData[] = productsSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        price: doc.data().price || 0,
        category: doc.data().category || "",
        description: doc.data().description || "",
        imageUrl: doc.data().imageUrl || "",
      }));
      setProducts(productsList);

      // Lấy lịch sử đơn hàng nếu user đã đăng nhập
      let orders: OrderHistory[] = [];
      if (userId) {
        const ordersRef = collection(db, "orders");
        const q = query(
          ordersRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const ordersSnap = await getDocs(q);
        orders = ordersSnap.docs.map((doc) => doc.data() as OrderHistory);
        setOrderHistory(orders);
      }

      // Tạo context cho AI
      const context = buildContextFromHistory(orders, productsList);
      setAiContext(context);

      // Tạo gợi ý tự động
      const autoSuggestions = await generateAutoSuggestions(
        orders,
        productsList
      );
      setSuggestions(autoSuggestions);

      // Tin nhắn chào mừng
      const welcomeMessage: Message = {
        role: "assistant",
        content:
          userId && orders.length > 0
            ? `Xin chào! Tôi thấy bạn đã mua hàng ${orders.length} lần. Hôm nay bạn cần tư vấn gì không? 😊`
            : "Xin chào! Tôi là trợ lý AI của tiệm bánh. Tôi có thể giúp bạn tìm sản phẩm phù hợp. Bạn cần gì nhé? 😊",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Error initializing chatbot:", error);
    } finally {
      setInitializing(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text) return;

    // Thêm tin nhắn user
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Gọi AI với danh sách sản phẩm
      const response = await sendMessageToAI(
        text,
        messages,
        aiContext,
        products
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: response.text,
        timestamp: new Date(),
        products:
          response.suggestedProducts.length > 0
            ? response.suggestedProducts
            : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: theme.primary }
              : {
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.lightBg,
                },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? { color: "#FFF" } : { color: theme.text },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isUser ? { color: theme.lightBg } : { color: theme.text + "60" },
            ]}
          >
            {item.timestamp.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Hiển thị card sản phẩm nếu AI gợi ý */}
        {!isUser && item.products && item.products.length > 0 && (
          <View style={styles.productsGrid}>
            {item.products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.lightBg,
                  },
                ]}
                onPress={() => {
                  const parentNav = (navigation as any).getParent?.();
                  if (parentNav) {
                    parentNav.navigate("ProductDetail", { product });
                  } else {
                    (navigation as any).navigate("ProductDetail", { product });
                  }
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: (product as any).imageUrl }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.primary }]}>
                    {parseInt(String(product.price)).toLocaleString()}đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.productViewButton,
                    { backgroundColor: theme.lightBg },
                  ]}
                >
                  <Text
                    style={[styles.productViewText, { color: theme.primary }]}
                  >
                    {t("viewDetail")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (initializing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.lightBg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          {t("loading")}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.lightBg, theme.background, theme.lightBg]}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.lightBg }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View
            style={[styles.aiIconContainer, { backgroundColor: theme.lightBg }]}
          >
            <Ionicons name="sparkles" size={24} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t("aiAssistant")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.text + "80" }]}>
              {t("smartConsulting")}
            </Text>
          </View>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Quick Suggestions */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.lightBg,
                },
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Ionicons name="bulb-outline" size={16} color={theme.primary} />
              <Text style={[styles.suggestionText, { color: theme.primary }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingIndicatorText, { color: theme.text }]}>
            {t("aiThinking")}
          </Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.lightBg,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.lightBg, color: theme.text },
            ]}
            placeholder={t("askQuestion")}
            placeholderTextColor={theme.text + "60"}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
          >
            <LinearGradient
              colors={
                loading || !inputText.trim()
                  ? ([theme.text + "40", theme.text + "60"] as any)
                  : (theme.aiGradient as any)
              }
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ChatBotScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: "85%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
    maxWidth: "100%", // Cho phép product cards rộng hơn
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  suggestionsContainer: {
    maxHeight: 50,
    marginBottom: 10,
  },
  suggestionsContent: {
    paddingHorizontal: 15,
    gap: 10,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 5,
  },
  suggestionText: {
    fontSize: 13,
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  loadingIndicatorText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 15,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  // Product Cards
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 10,
    width: "100%",
  },
  productCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "bold",
  },
  productViewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    gap: 5,
  },
  productViewText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
