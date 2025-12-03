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


// quiz
// Thêm vào src/services/aiService.ts

interface QuizConfig {
  topic?: string;
  description?: string;
  textInput?: string; // Dùng cho Option 2 & 3 (Nội dung văn bản/file)
  count: number;
  difficulty: string;
  language: string; // 'vi'
}

export const generateQuizContent = async (config: QuizConfig) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Xây dựng Prompt dựa trên Input
    let contentPrompt = "";
    if (config.textInput) {
      // Option 2 & 3: Dựa trên văn bản cung cấp
      contentPrompt = `Dựa trên nội dung văn bản sau:\n"""${config.textInput.slice(0, 30000)}"""\n`;
    } else {
      // Option 1: Dựa trên chủ đề
      contentPrompt = `Chủ đề: "${config.topic}".\nMô tả chi tiết: "${config.description || "Không có"}".\n`;
    }

    const prompt = `
    Bạn là một giáo viên chuyên tạo đề thi trắc nghiệm.
    
    YÊU CẦU: Tạo một bộ câu hỏi trắc nghiệm (Quiz).
    ${contentPrompt}
    
    CẤU HÌNH:
    - Số lượng câu: ${config.count} câu.
    - Độ khó: ${config.difficulty} (Easy: Cơ bản, Medium: Trung bình, Hard: Nâng cao/Chuyên sâu).
    - Ngôn ngữ: Tiếng Việt.

    OUTPUT JSON FORMAT (Bắt buộc):
    {
      "title": "Tên gợi ý cho bộ đề này",
      "questions": [
        {
          "question": "Nội dung câu hỏi?",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctAnswer": "Đáp án đúng (Chép y hệt 1 trong 4 options trên)",
          "explanation": "Giải thích ngắn gọn tại sao đúng"
        }
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());

  } catch (error) {
    console.error("❌ Lỗi AI Generate Quiz:", error);
    throw error;
  }
};