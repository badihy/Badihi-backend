import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
@Schema({ timestamps: true })
export class Category {
    @Prop()
    name: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: false })
    image: string;

    @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    parent?: Category | null;
}

export type CategoryDocument = Document & Category;
export const CategorySchema = SchemaFactory.createForClass(Category);
