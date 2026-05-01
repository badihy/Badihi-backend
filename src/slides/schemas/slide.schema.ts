import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SlideType } from '../types/slide-types.enum';
import { Lesson } from '../../courses/schemas/lesson.schema';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Slide {
  @Prop()
  title?: string;

  @Prop({ type: String, enum: SlideType, required: true })
  type: SlideType;

  @Prop({ required: false })
  textContent?: string;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ type: Number, required: true })
  orderIndex: number;

  @Prop({ required: false })
  golden_info?: string;

  @Prop({ required: false })
  explanation?: string;

  // Question fields
  @Prop({ required: false })
  question?: string;

  @Prop({ type: [String], required: false })
  choices?: string[];

  @Prop({ required: false })
  answer?: string;

  // Quote fields
  @Prop({ required: false })
  quotation?: string;

  @Prop({ required: false })
  authorName?: string;

  @Prop({ required: false })
  authorJob?: string;

  @Prop({ default: false })
  isCompleted: boolean;

  // Slide now belongs to Lesson instead of Course
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true })
  lesson: mongoose.Types.ObjectId;
}
export type SlideDocument = Document & Slide;
export const SlideSchema = SchemaFactory.createForClass(Slide);
