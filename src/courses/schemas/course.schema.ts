import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Category } from "src/categories/schemas/category.schema";
import { Section } from "./section.schema";

@Schema({ timestamps: true })
export class Course {
    @Prop()
    name: string;

    @Prop()
    description: string;

    @Prop()
    price: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category: mongoose.Types.ObjectId;

    @Prop({ type: [String], required: false })
    willLearn: string[];

    @Prop({ type: [String], required: false })
    requirements: string[];

    @Prop({ required: true })
    estimationTime: string; // time in hours

    @Prop({ required: false })
    coverImage: string;

    @Prop({ required: false })
    thumbnailImage: string;

    // Course now has sections instead of slides directly
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }], required: false })
    sections?: mongoose.Types.ObjectId[];

}

export type CourseDocument = Document & Course;
export const CourseSchema = SchemaFactory.createForClass(Course);

