import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateFlashcardContent = async (inputWord: string) => {
  try {
    // SỬ DỤNG MODEL TỪ DANH SÁCH CỦA BẠN
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // Gemini 2.0 hỗ trợ mode JSON rất tốt
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Bạn là một chuyên gia từ điển Anh-Việt với khả năng phân tích và xử lý hai chiều (EN → VI và VI → EN).
      Nhiệm vụ:
      Tạo flashcard chất lượng cao từ đầu vào "${inputWord}".
      Bạn phải tự động xác định xem "${inputWord}" là tiếng Anh hay tiếng Việt và xử lý theo quy tắc sau:

      Quy tắc xử lý:
      1. Nếu "${inputWord}" là tiếng Anh:
        - Không dịch sang tiếng Anh.
        - Tạo phiên âm IPA.
        - Tạo định nghĩa tiếng Việt.
        - Xác định loại từ.
        - Tạo 3 ví dụ tiếng Anh kèm phiên âm & dịch Việt.

      2. Nếu "{{INPUT}}" là tiếng Việt:
        - Dịch sang tiếng Anh (chính xác và tự nhiên nhất).
        - Dùng từ tiếng Anh đó làm "title".
        - Tạo phiên âm IPA cho từ tiếng Anh.
        - Sinh định nghĩa tiếng Việt.
        - Xác định loại từ.
        - Tạo 3 ví dụ tiếng Anh kèm phiên âm và dịch Việt.

      Yêu cầu chung:
      - Tất cả thông tin phải chính xác, dễ hiểu.
      - Ghi chú phải hữu ích cho việc ghi nhớ.
      - Tuyệt đối KHÔNG đưa ra giải thích ngoài JSON.
      - JSON phải hợp lệ 100% và chỉ trả về JSON.

      Trả về đúng cấu trúc JSON sau:

      {
        "title": "",              // Từ tiếng Anh cuối cùng (input tiếng Việt thì là từ đã dịch)
        "define": "",             // Định nghĩa tiếng Việt
        "type_of_word": "",       // danh từ / động từ / tính từ / cụm từ
        "transcription": "",      // Phiên âm tiếng Anh IPA
        "level": "",              // A1 / A2 / B1 / B2 / C1 / C2
        "examples": [
          { "en": "", "trans": "", "vi": "" },
          { "en": "", "trans": "", "vi": "" },
          { "en": "", "trans": "", "vi": "" }
        ],
        "note": ""                // Tips ghi nhớ bằng tiếng Việt (không dùng dấu nháy kép)
      }

    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // console.log("✅ Gemini 2.0 Output:", text);

    return JSON.parse(text);

  } catch (error) {
    console.error("❌ Lỗi Gemini Service:", error);
    throw error;
  }
};