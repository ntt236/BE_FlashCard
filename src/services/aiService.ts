import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateFlashcardContent = async (inputWord: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Bạn là một chuyên gia từ điển Anh-Việt (English-Vietnamese Dictionary API).
    Nhiệm vụ: Tạo dữ liệu flashcard chính xác từ input: "${inputWord}".

    Quy tắc xử lý logic (Logic Flow):
    1. Xác định ngôn ngữ của input.
    2. Nếu là Tiếng Việt:
       - Dịch sang từ Tiếng Anh tương ứng chuẩn xác nhất.
       - Từ Tiếng Anh đó sẽ là giá trị của "term".
    3. Nếu là Tiếng Anh:
       - Giữ nguyên, từ đó là giá trị của "term".

    YÊU CẦU OUTPUT (JSON Format):
    Trả về đúng 1 JSON object với các keys khớp chính xác bên dưới (Keys must match exactly):

    {
      "term": "String (Từ vựng tiếng Anh chính)",
      "definition": "String (Định nghĩa tiếng Việt ngắn gọn)",
      "phonetic": "String (Phiên âm IPA chuẩn Mỹ)",
      "type": "String (Loại từ: noun, verb, adjective, phrase...)",
      "level": "String (A1, A2, B1, B2, C1, C2)",
      "note": "String (Mẹo ghi nhớ hoặc câu liên tưởng vui bằng tiếng Việt)",
      "examples": [
        {
          "en": "String (Câu ví dụ tiếng Anh)",
          "vi": "String (Dịch nghĩa tiếng Việt)"
        },
        {
           "en": "String",
           "vi": "String"
        }
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // console.log("✅ Gemini Output:", text);

    return JSON.parse(text);

  } catch (error) {
    console.error("❌ Lỗi Gemini Service:", error);
    throw error;
  }
};
export const generateFlashcardsFromText = async (longText: string) => {
  try {
    // Cắt ngắn nếu quá dài (Gemini Flash chịu được ~1M token nhưng an toàn vẫn hơn)
    const truncatedText = longText.slice(0, 30000);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Bạn là chuyên gia ngôn ngữ.
    Nhiệm vụ: Phân tích văn bản dưới đây và rút trích ra **10 từ vựng quan trọng nhất** (Keywords) để học.
    
    Văn bản nguồn:
    """
    ${truncatedText}
    """

    YÊU CẦU OUTPUT:
    Trả về một JSON Object chứa mảng "cards". Cấu trúc mỗi card y hệt như sau:
    {
      "cards": [
        {
           "term": "Word 1",
           "definition": "Định nghĩa tiếng Việt",
           "phonetic": "/ipa/",
           "type": "noun/verb...",
           "examples": [{ "en": "Example sentence", "vi": "Dịch" }],
           "note": "Mẹo nhớ"
        }
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const response = JSON.parse(cleanedText);
    return response.cards || []; // Trả về mảng cards

  } catch (error) {
    console.error("❌ Lỗi Gemini Bulk Generate:", error);
    throw error;
  }
};

// quiz


interface QuizConfig {
  topic?: string;
  description?: string;
  textInput?: string; // Dùng cho Option 2 & 3
  count: number;
  difficulty: string;
  language?: string;
}

export const generateQuizContent = async (config: QuizConfig) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    // 1. Xây dựng ngữ cảnh
    let contentPrompt = "";
    if (config.textInput) {
      // Cắt ngắn bớt nếu quá dài để tiết kiệm token
      contentPrompt = `Dựa trên nội dung văn bản sau:\n"""${config.textInput.slice(0, 30000)}"""\n`;
    } else {
      contentPrompt = `Chủ đề chính: "${config.topic}".\nMô tả chi tiết: "${config.description || "Không có"}".\n`;
    }

    // 2. Prompt Đa Năng + Tự động phát hiện ngôn ngữ
    const prompt = `
    Bạn là một chuyên gia giáo dục và tạo đề thi trắc nghiệm (Quiz Generator).
    
    YÊU CẦU: Tạo một bộ câu hỏi trắc nghiệm chất lượng cao.
    ${contentPrompt}
    
    CẤU HÌNH:
    - Số lượng: Chính xác ${config.count} câu.
    - Độ khó: ${config.difficulty} (Easy/Medium/Hard).
    - Loại câu hỏi: Multiple-choice (4 lựa chọn).

    ----------
    QUY TẮC NGÔN NGỮ (LANGUAGE RULES - QUAN TRỌNG):
    1. Hãy tự động phát hiện ngôn ngữ của nội dung đầu vào (văn bản hoặc chủ đề).
    2. Nếu nội dung đầu vào là Tiếng Anh -> Tạo câu hỏi, đáp án, giải thích hoàn toàn bằng Tiếng Anh.
    3. Nếu nội dung đầu vào là Tiếng Việt -> Tạo câu hỏi, đáp án, giải thích hoàn toàn bằng Tiếng Việt.
    4. Nếu là ngôn ngữ khác -> Tạo bằng ngôn ngữ tương ứng.
    ----------

    OUTPUT JSON FORMAT (Bắt buộc):
    Trả về 1 JSON Object duy nhất, không markdown.
    {
      "title": "Tên gợi ý cho bộ đề này (Ngôn ngữ tương ứng)",
      "questions": [
        {
          "question": "Nội dung câu hỏi?",
          "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
          "correctAnswer": "Chép Y NGUYÊN nội dung của đáp án đúng vào đây (String matching)",
          "explanation": "Giải thích ngắn gọn tại sao đúng"
        }
      ]
    }

    LƯU Ý: "correctAnswer" phải là một chuỗi ký tự khớp hoàn toàn (chính xác từng chữ cái) với một trong các phần tử trong mảng "options".
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Làm sạch JSON trước khi parse
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("❌ Lỗi AI Generate Quiz:", error);
    throw error;
  }
};