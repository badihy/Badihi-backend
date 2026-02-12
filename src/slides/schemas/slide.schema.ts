import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SlideType } from "../types/slide-types.enum";
import { Lesson } from "../../courses/schemas/lesson.schema";
import mongoose, { Document } from "mongoose";

@Schema({ timestamps: true })
export class Slide {
    @Prop()
    title: string;

    @Prop({ type: String, enum: SlideType })
    type: SlideType;

    @Prop({
        type: String,
        required: false
    })
    textContent?: string;

    @Prop({
        type: String,
        required: false
    })
    imageUrl?: string;

    @Prop({
        type: Number,
        required: true
    })
    orderIndex: number;

    @Prop({
        type: [String],
        required: false
    })
    questions?: string[];

    @Prop({
        type: String,
        required: false
    })
    questionHint?: string;

    @Prop({
        type: String,
        required: false
    })
    answer?: string;

    @Prop({ default: false })
    isCompleted: boolean;

    // Slide now belongs to Lesson instead of Course
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true })
    lesson: mongoose.Types.ObjectId;
}
export type SlideDocument = Document & Slide;
export const SlideSchema = SchemaFactory.createForClass(Slide);