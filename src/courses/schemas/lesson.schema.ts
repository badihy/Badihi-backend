import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({ timestamps: true })
export class Lesson {
    @Prop({ required: true })
    title: string;

    @Prop({ required: false })
    description?: string;

    @Prop({
        type: Number,
        required: true
    })
    orderIndex: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true })
    section: mongoose.Types.ObjectId;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Slide' }], required: false })
    slides?: mongoose.Types.ObjectId[];

    @Prop({ default: false })
    isCompleted: boolean;

    @Prop({ required: false })
    estimatedDuration?: number; // in minutes
}

export type LessonDocument = Lesson & Document;
export const LessonSchema = SchemaFactory.createForClass(Lesson);
