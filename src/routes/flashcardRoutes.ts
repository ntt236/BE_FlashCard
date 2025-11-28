import { Router } from "express";
import { addCardToSet, createSet, getFlashcardSetById, getFlashcardSets, getMyFlashcards } from "../controllers/flashcardController";
import { protect } from "../middleware/authMiddleware";

const router = Router()

router.get('/my-sets', protect, getMyFlashcards);
router.get('/', getFlashcardSets);
router.post('/', protect, createSet);

router.post('/:setId/cards', protect, addCardToSet);
router.get('/:setId', protect, getFlashcardSetById);



export default router