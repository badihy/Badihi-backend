import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Category } from "src/categories/schemas/category.schema";
import { Chapter } from "./chapter.schema";
import { CourseLevel } from "../types/course-level.enum";

@Schema({ timestamps: true })
export class Course {
    @Prop()
    name: string;

    @Prop()
    description: string;

    @Prop({ required: false })
    shortDescription?: string;

    @Prop()
    price: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category: mongoose.Types.ObjectId;

    @Prop({ type: [String], required: false })
    willLearn: string[];

    @Prop({ type: [String], required: false })
    requirements: string[];

    @Prop({ type: [String], required: false })
    targetAudience?: string[];

    @Prop({ type: String, enum: CourseLevel, required: false })
    level?: CourseLevel;

    @Prop({ required: true })
    estimationTime: string; // time in hours

    @Prop({ required: false })
    coverImage: string;

    @Prop({ required: false })
    thumbnailImage: string;

    // Course now has chapters instead of slides directly
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }], required: false })
    chapters?: mongoose.Types.ObjectId[];

}

export type CourseDocument = Document & Course;
export const CourseSchema = SchemaFactory.createForClass(Course);

