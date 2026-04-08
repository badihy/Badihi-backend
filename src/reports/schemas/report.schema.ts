import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum ReportType {
  PROBLEM = 'problem',
  REPORT = 'report',
  SUGGESTION = 'suggestion',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId?: mongoose.Types.ObjectId;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ enum: ReportType, default: ReportType.PROBLEM })
  type: ReportType;

  @Prop({ enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;
}

export type ReportDocument = Document & Report;
export const ReportSchema = SchemaFactory.createForClass(Report);
