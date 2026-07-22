import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import flashcardRoutes from './routes/flashcardRoutes';
import authRoutes from './routes/authRoutes';
import quizRoutes from './routes/quizRoutes';
import learningPathRoutes from './routes/learningPathRoutes';
import progressRoutes from './routes/progressRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost:') || origin === process.env.CLIENT_ORIGIN) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

app.use('/api/flashcards', flashcardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGO_URI as string, { family: 4 })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error', err));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
