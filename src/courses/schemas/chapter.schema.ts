import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Course } from "./course.schema";

@Schema({ timestamps: true })
export class Chapter {
    @Prop({ required: true })
    title: string;

    @Prop({ required: false })
    description?: string;

    @Prop({
        type: Number,
        required: true
    })
    orderIndex: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
    course: mongoose.Types.ObjectId;

    // Chapter can contain either lessons OR a quiz, but not both
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }], required: false })
    lessons?: mongoose.Types.ObjectId[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: false })
    quiz?: mongoose.Types.ObjectId;

    @Prop({ default: false })
    isCompleted: boolean;
}

export type ChapterDocument = Chapter & Document;
export const ChapterSchema = SchemaFactory.createForClass(Chapter);
