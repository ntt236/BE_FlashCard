import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'
import mongoose from 'mongoose';
import flashcardRoutes from "./routes/flashcardRoutes"
import authRoutes from "./routes/authRoutes"

dotenv.config()
const app = express()
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());



app.use('/api/flashcards', flashcardRoutes);
app.use('/api/auth', authRoutes)


mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error', err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


