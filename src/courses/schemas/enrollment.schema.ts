import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { User } from "../../user/schemas/user.schema";
import { Course } from "./course.schema";
import { Lesson } from "./lesson.schema";
import { Quiz } from "./quiz.schema";

@Schema({ timestamps: true })
export class Enrollment {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
    course: mongoose.Types.ObjectId;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }], default: [] })
    completedLessons: mongoose.Types.ObjectId[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }], default: [] })
    completedQuizzes: mongoose.Types.ObjectId[];

    @Prop({ type: Number, default: 0, min: 0, max: 100 })
    progress: number;

    @Prop({ type: Boolean, default: false })
    isCompleted: boolean;

    @Prop({ type: Date, default: Date.now })
    enrolledAt: Date;

    @Prop({ type: Date, default: Date.now })
    lastAccessedAt: Date;
}

export type EnrollmentDocument = Document & Enrollment;
export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Compound index to ensure a user can only enroll in a course once
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
