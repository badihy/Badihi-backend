import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Certificate {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
  course: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  certificateNumber: string;

  @Prop({ required: true })
  issuedAt: Date;

  @Prop({ required: true, min: 0, max: 100 })
  progressAtIssue: number;
}

export type CertificateDocument = Document & Certificate;
export const CertificateSchema = SchemaFactory.createForClass(Certificate);
CertificateSchema.index({ user: 1, course: 1 }, { unique: true });
