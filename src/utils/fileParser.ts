import mammoth from 'mammoth';
// Thay thế dòng import pdf cũ bằng dòng này:
const pdf = require('pdf-parse');

export const parseFileToText = async (file: Express.Multer.File): Promise<string> => {
    try {
        // 1. Nếu là PDF
        if (file.mimetype === 'application/pdf') {
            // pdf-parse nhận vào buffer và trả về promise object có thuộc tính .text
            const data = await pdf(file.buffer);
            return data.text;
        }

        // 2. Nếu là Word (.docx)
        else if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            return result.value;
        }

        throw new Error("Định dạng file không hỗ trợ (Chỉ nhận PDF hoặc DOCX)");
    } catch (error) {
        console.error("Lỗi parse file:", error);
        throw new Error("Không thể đọc nội dung file");
    }
};