import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
  course: mongoose.Types.ObjectId;
}

export type BookmarkDocument = Bookmark & Document;
export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

BookmarkSchema.index({ user: 1, course: 1 }, { unique: true });
