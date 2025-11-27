import { Router } from "express";
import { addCardToSet, createSet, getFlashcardSets, getMyFlashcards } from "../controllers/flashcardController";
import { protect } from "../middleware/authMiddleware";

const router = Router()

router.get('/', getFlashcardSets);
router.get('/my-sets', protect, getMyFlashcards);

router.post('/', protect, createSet);
router.post('/:setId/cards', protect, addCardToSet);


export default router