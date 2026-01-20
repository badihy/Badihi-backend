import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Category } from "src/categories/schemas/category.schema";
import { Slide } from "src/slides/schemas/slide.schema";

@Schema({ timestamps: true })
export class Course {
    @Prop()
    name: string;

    @Prop()
    description: string;

    @Prop()
    price: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category: Category;

    @Prop({ type: [String], required: false })
    willLearn: string[];

    @Prop({ type: [String], required: false })
    requirements: string[];

    @Prop({ required: true })
    estimationTime: string; // time in hourse

    @Prop({ required: false })
    coverImage: string;

    @Prop({ required: false })
    thumbnailImage: string;

    @Prop({ type: [Slide], required: false })
    slides: Slide[];

}

export type CourseDocument = Document & Course;
export const CourseSchema = SchemaFactory.createForClass(Course);

