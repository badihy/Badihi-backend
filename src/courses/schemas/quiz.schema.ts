import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

// QuizQuestion as a nested schema
const QuizQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: Number, required: true }, // index of correct answer
    explanation: { type: String, required: false },
    orderIndex: { type: Number, required: true }
}, { _id: false });

@Schema({ timestamps: true })
export class Quiz {
    @Prop({ required: true })
    title: string;

    @Prop({ required: false })
    description?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true })
    section: mongoose.Types.ObjectId;

    @Prop({ type: [QuizQuestionSchema], required: true })
    questions: mongoose.Types.Array<any>;

    @Prop({ required: false, default: 0 })
    passingScore?: number; // percentage (0-100)

    @Prop({ required: false })
    timeLimit?: number; // in minutes

    @Prop({ default: false })
    isCompleted: boolean;

    @Prop({ required: false })
    score?: number; // user's score if completed
}

export type QuizDocument = Quiz & Document;
export const QuizSchema = SchemaFactory.createForClass(Quiz);
