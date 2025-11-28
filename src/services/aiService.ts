import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateFlashcardContent = async (inputWord: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
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