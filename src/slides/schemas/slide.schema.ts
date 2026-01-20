import { Prop, Schema } from "@nestjs/mongoose";
import { SlideType } from "../types/slide-types.enum";
import { Course } from "src/courses/schemas/course.schema";
import mongoose from "mongoose";

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

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course' })
    course: Course;
}
