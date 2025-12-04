import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'
import mongoose from 'mongoose';
import flashcardRoutes from "./routes/flashcardRoutes"
import authRoutes from "./routes/authRoutes"
import quizRoutes from "./routes/quizRoutes"

dotenv.config()
const app = express()
const PORT = process.env.PORT || 4000;
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());



app.use('/api/flashcards', flashcardRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/quiz', quizRoutes);

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error', err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


