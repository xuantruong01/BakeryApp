// AI Service sử dụng Google Gemini API
// API key được lưu an toàn trong file .env (không commit vào Git)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Kiểm tra API key có tồn tại không
if (!GEMINI_API_KEY) {
  console.error(
    "⚠️ GEMINI_API_KEY chưa được cấu hình! Vui lòng thêm vào file .env:\n" +
    "EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here"
  );
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: ProductData[]; // Thêm để lưu sản phẩm được gợi ý
}

export interface OrderHistory {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  createdAt: any;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

/**
 * Tạo context từ lịch sử đơn hàng và sản phẩm
 */
export const buildContextFromHistory = (
  orderHistory: OrderHistory[],
  products: ProductData[]
): string => {
  let context = `Bạn là trợ lý AI của một tiệm bánh. Nhiệm vụ của bạn là tư vấn và gợi ý sản phẩm cho khách hàng.\n\n`;

  // Thêm thông tin sản phẩm có sẵn
  if (products.length > 0) {
    context += `DANH SÁCH SẢN PHẨM HIỆN CÓ:\n`;
    products.forEach((p) => {
      const priceStr =
        typeof p.price === "number" ? p.price.toString() : p.price;
      context += `- ${p.name}: ${parseInt(priceStr).toLocaleString()}đ (${
        p.category
      })${p.description ? " - " + p.description : ""}\n`;
    });
    context += `\n`;
  }

  // Thêm lịch sử đơn hàng của khách
  if (orderHistory.length > 0) {
    context += `LỊCH SỬ MUA HÀNG CỦA KHÁCH:\n`;
    orderHistory.slice(0, 5).forEach((order, idx) => {
      const date = order.createdAt?.toDate
        ? order.createdAt.toDate().toLocaleDateString("vi-VN")
        : "N/A";
      context += `Đơn hàng ${idx + 1} (${date}):\n`;
      order.items.forEach((item) => {
        context += `  • ${item.name} x${item.quantity}\n`;
      });
    });
    context += `\n`;
  }

  context += `Hãy dựa vào thông tin trên để:\n`;
  context += `1. Gợi ý sản phẩm phù hợp với sở thích của khách\n`;
  context += `2. Trả lời các câu hỏi về sản phẩm, giá cả\n`;
  context += `3. Tư vấn combo hoặc sản phẩm mới\n`;
  context += `4. Luôn thân thiện, lịch sự và sử dụng tiếng Việt\n\n`;

  return context;
};

/**
 * Gọi Gemini API để chat
 */
export const sendMessageToAI = async (
  userMessage: string,
  conversationHistory: Message[],
  context: string,
  allProducts: ProductData[]
): Promise<{ text: string; suggestedProducts: ProductData[] }> => {
  try {
    // Chuẩn bị prompt với context và lịch sử hội thoại
    let fullPrompt = context;

    // Thêm lịch sử hội thoại (3 tin nhắn gần nhất)
    if (conversationHistory.length > 0) {
      fullPrompt += `LỊCH SỬ HỘI THOẠI:\n`;
      conversationHistory.slice(-3).forEach((msg) => {
        fullPrompt += `${msg.role === "user" ? "Khách" : "Bot"}: ${
          msg.content
        }\n`;
      });
      fullPrompt += `\n`;
    }

    fullPrompt += `Khách hỏi: ${userMessage}\n\n`;
    fullPrompt += `Trả lời (bằng tiếng Việt, ngắn gọn, thân thiện).\n`;
    fullPrompt += `QUAN TRỌNG: Nếu bạn gợi ý sản phẩm, hãy kết thúc câu trả lời bằng dòng "PRODUCTS:" theo sau là tên chính xác của các sản phẩm (mỗi tên trên 1 dòng).\n`;
    fullPrompt += `Ví dụ:\n`;
    fullPrompt += `Tôi gợi ý bạn thử bánh croissant và bánh mì baguette!\n`;
    fullPrompt += `PRODUCTS:\n`;
    fullPrompt += `Bánh Croissant\n`;
    fullPrompt += `Bánh Mì Baguette\n`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const fullText = data.candidates[0].content.parts[0].text.trim();

      // Tách text và products
      const parts = fullText.split("PRODUCTS:");
      const text = parts[0].trim();
      const suggestedProducts: ProductData[] = [];

      if (parts.length > 1) {
        const productNames = parts[1]
          .split("\n")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        // Tìm sản phẩm trong danh sách
        productNames.forEach((name) => {
          const found = allProducts.find(
            (p) =>
              p.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(p.name.toLowerCase())
          );
          if (found && !suggestedProducts.find((p) => p.id === found.id)) {
            suggestedProducts.push(found);
          }
        });
      }

      return { text, suggestedProducts };
    }

    return {
      text: "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.",
      suggestedProducts: [],
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      text: "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.",
      suggestedProducts: [],
    };
  }
};

/**
 * Tạo gợi ý tự động dựa trên lịch sử
 */
export const generateAutoSuggestions = async (
  orderHistory: OrderHistory[],
  products: ProductData[]
): Promise<string[]> => {
  if (orderHistory.length === 0) {
    return [
      "Sản phẩm bán chạy nhất là gì?",
      "Có combo nào tiết kiệm không?",
      "Bánh mới nhất là gì?",
    ];
  }

  // Phân tích sản phẩm đã mua
  const purchasedItems = new Map<string, number>();
  orderHistory.forEach((order) => {
    order.items.forEach((item) => {
      purchasedItems.set(
        item.name,
        (purchasedItems.get(item.name) || 0) + item.quantity
      );
    });
  });

  const suggestions: string[] = [];

  // Lấy sản phẩm mua nhiều nhất
  const mostPurchased = Array.from(purchasedItems.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  if (mostPurchased.length > 0) {
    suggestions.push(`Có sản phẩm nào giống ${mostPurchased[0][0]} không?`);
  }

  suggestions.push("Có bánh mới nào không?");
  suggestions.push("Gợi ý combo phù hợp với tôi");

  return suggestions.slice(0, 3);
};
