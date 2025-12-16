import { Request, Response } from 'express';
import FlashcardSet from '../models/FlashcardSet';
import { generateFlashcardContent, generateFlashcardsFromText } from '../services/aiService';
import { AuthRequest } from '../middleware/authMiddleware';
import { parseFileToText } from '../utils/fileParser';
// ==========================================
// HELPER: Hàm tính toán stats (Dùng chung)
// ==========================================
const mapSetToUiData = (set: any) => {
    const learned = set.cards.filter((c: any) => c.status === 'learned').length;
    const learning = set.cards.filter((c: any) => c.status === 'learning').length;
    const newWord = set.cards.filter((c: any) => c.status === 'new').length;
    const total = set.cards.length;
    const accuracy = total > 0 ? Math.round((learned / total) * 100) : 0;

    return {
        _id: set._id,
        title: set.title,
        desc: set.description,
        learned,
        learning,
        newWord,
        accuracy
    };
};

// 1. Lấy danh sách Flashcard Set (Cộng đồng)
export const getFlashcardSets = async (req: Request, res: Response) => {
    try {
        const sets = await FlashcardSet.find({ isPublic: true }); // Chỉ lấy public
        const uiData = sets.map(mapSetToUiData); // Dùng hàm helper cho gọn
        res.json(uiData);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sets" });
    }
};

// 2. Lấy danh sách của tôi
export const getMyFlashcards = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        // Chỉ tìm những bộ mà ownerId trùng với người đang đăng nhập
        const sets = await FlashcardSet.find({ ownerId: userId });

        // --- SỬA LỖI: Áp dụng logic map dữ liệu ---
        const uiData = sets.map(mapSetToUiData);

        res.json(uiData);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
};

// 3. Lấy Chi Tiết 1 Bộ (Dùng cho trang Detail) 
export const getFlashcardSetById = async (req: Request, res: Response) => {
    console.log("👉 Đang gọi API lấy chi tiết với ID:", req.params.setId);
    try {
        const { setId } = req.params;

        // Tìm bộ thẻ theo ID
        const set = await FlashcardSet.findById(setId);

        if (!set) {
            return res.status(404).json({ message: "Không tìm thấy bộ thẻ này" });
        }

        // Trả về dữ liệu bộ thẻ (bao gồm cả cards bên trong)
        res.json(set);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi lấy chi tiết" });
    }
};

// 4. Tạo Set mới
export const createSet = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, isPublic, language } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const newSet = new FlashcardSet({
            title,
            description,
            isPublic,
            language,
            ownerId: userId,
            cards: []
        });

        await newSet.save();
        res.status(201).json(newSet);
    } catch (error) {
        res.status(500).json({ message: "Error creating set" });
    }
}

// 5. Thêm Card vào Set (AI / Manual)

export const addCardToSet = async (req: Request, res: Response) => {
    const { setId } = req.params;
    const { mode, input } = req.body;

    try {
        const set = await FlashcardSet.findById(setId);
        if (!set) return res.status(404).json({ message: "Set not found" });

        let newCardData;

        if (mode === 'ai') {
            // console.log("🤖 Đang gọi AI với input:", input);
            try {
                // Gọi AI
                const aiResult = await generateFlashcardContent(input);

                // --- IN LOG ĐỂ DEBUG ---
                // console.log("📦 AI RAW DATA:", JSON.stringify(aiResult, null, 2));

                // --- MAP DỮ LIỆU AN TOÀN ---
                // "Bắt" tất cả các key mà AI có thể trả về
                newCardData = {
                    term: aiResult.term || aiResult.title || aiResult.word || aiResult.Term,
                    definition: aiResult.definition || aiResult.define || aiResult.meaning || aiResult.description,
                    phonetic: aiResult.phonetic || aiResult.ipa || aiResult.transcription || "",
                    type: aiResult.type || aiResult.type_of_word || "unknown",
                    examples: aiResult.examples || [],
                    note: aiResult.note || ""
                };

            } catch (aiError) {
                console.error("Lỗi AI Service:", aiError);
                return res.status(500).json({ message: "Lỗi khi gọi AI tạo thẻ" });
            }
        } else {
            // Manual mode
            newCardData = input;
        }

        // --- VALIDATION CUỐI CÙNG ---
        if (!newCardData.term || !newCardData.definition) {
            console.error("❌ Dữ liệu vẫn thiếu sau khi map:", newCardData);
            return res.status(400).json({
                message: "Dữ liệu AI trả về không đủ thông tin (Thiếu Term hoặc Definition)",
                debug: newCardData
            });
        }

        // Thêm vào mảng cards
        set.cards.push({ ...newCardData, status: 'new' });
        await set.save();

        console.log("✅ Đã thêm thẻ thành công:", newCardData.term);
        res.json(set);

    } catch (error: any) {
        console.error("Add Card Error:", error);
        res.status(500).json({ message: "Error adding card", error: error.message });
    }
};


//6 Delete Cards 
export const deleteCards = async (req: Request, res: Response) => {
    try {
        const { setId, cardId } = req.params;
        const updatedSet = await FlashcardSet.findByIdAndUpdate(
            setId,
            { $pull: { cards: { _id: cardId } } },
            { new: true }
        )
        if (!updatedSet) {
            return res.status(404).json({ message: "Không tìm thấy bộ thẻ" })
        }
        res.json({ message: "Xóa thẻ thành công", set: updatedSet })
    } catch (error) {
        console.log("🚀 ~ DeleteCards ~ error:", error)
        res.status(500).json({ message: "Lỗi server" })

    }
}

// delete flashCard set
export const deleteCardSet = async (req: AuthRequest, res: Response) => {
    try {
        const { setId } = req.params;
        const userId = req.user?.id;
        const deleteSet = await FlashcardSet.findOneAndDelete({
            _id: setId,
            ownerId: userId
        })
        if (!deleteSet) {
            return res.status(404).json({ message: "không tìm thấy bộ thẻ cần xóa" })
        }
        res.json({ message: "Xóa thành công bộ thẻ", deleteSet: setId })
    } catch (error) {
        console.log("🚀 ~ deleteCardSet ~ error:", error)
        res.status(500).json({ message: "Lỗi server" })
    }
}



// upload file tạo thẻ flashcard
export const uploadFileAndCreateCards = async (req: Request, res: Response) => {
    const { setId } = req.params;
    const file = req.file; // File lấy từ Multer

    if (!file) {
        return res.status(400).json({ message: "Vui lòng upload file" });
    }

    try {
        const set = await FlashcardSet.findById(setId);
        if (!set) return res.status(404).json({ message: "Set not found" });

        // 1. Đọc file thành text
        console.log("📂 Đang đọc file...");
        const textContent = await parseFileToText(file);

        if (!textContent.trim()) {
            return res.status(400).json({ message: "File không có nội dung văn bản" });
        }

        // 2. Gọi AI tạo danh sách thẻ
        console.log("🤖 Đang gửi text cho AI xử lý...");
        const generatedCards = await generateFlashcardsFromText(textContent);

        if (!generatedCards || generatedCards.length === 0) {
            return res.status(400).json({ message: "AI không tìm thấy từ vựng nào trong file này" });
        }

        // 3. Lưu vào DB
        // Thêm status 'new' cho từng thẻ
        const cardsToSave = generatedCards.map((card: any) => ({
            ...card,
            status: 'new'
        }));

        set.cards.push(...cardsToSave); // Push cả mảng vào
        await set.save();

        console.log(`✅ Đã thêm ${cardsToSave.length} thẻ từ file.`);
        res.json({ message: "Thành công", count: cardsToSave.length, set });

    } catch (error: any) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: "Lỗi xử lý file", error: error.message });
    }
};

//review 
export const reviewFlashcard = async (req: Request, res: Response) => {
    try {
        const { setId, cardId } = req.params;
        const { status } = req.body;
        const set = await FlashcardSet.findById(setId);
        if (!set) return res.status(404).json({ message: "Set không tồn tại" });

        const card = set.cards.find((c: any) => c._id.toString() === cardId);
        if (!card) return res.status(404).json({ message: "Card không tồn tại" });

        //tinh ngay
        let daysToAdd = 0;
        if (status === 'learned') {
            daysToAdd = 3;
            card.box += 1;
            card.status = 'learned';
        } else if (status === "learning") {
            daysToAdd = 1;
            card.status = 'learning';
        } else {
            daysToAdd = 0;
            card.box = 0
            card.status = 'new'
        }
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysToAdd);

        card.nextReviewDate = nextDate
        await set.save()
        res.json({ message: "Cap nhat thanh cong", card })

    } catch (error) {
        console.log("🚀 ~ reviewFlashcard ~ error:", error)
        res.status(500).json({ message: "Lỗi Server" })
    }
}