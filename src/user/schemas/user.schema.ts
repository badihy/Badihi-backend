import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User {
    @Prop({
        unique: true,
    })
    username: string;

    @Prop({
        required: true,
        type: String,
    })
    fullName: string;

    @Prop({
        required: true,
        unique: true,
    })
    email: string;

    @Prop({
        required: false,
    })
    password: string;

    @Prop({
        unique: true,
        sparse: true,
    })
    firebaseUid?: string;

    @Prop({
        required: false,
    })
    phone: string;

    @Prop({
        default: false,
    })
    isVerified: boolean;
    @Prop({
        required: false,
    })
    refreshToken?: string;

    @Prop({
        required: false,
    })
    resetPasswordToken?: string;

    @Prop({
        required: false,
    })
    @Prop({
        required: false,
    })
    resetPasswordExpires?: Date;

    @Prop({
        required: false,
    })
    verificationToken?: string;

    @Prop({
        required: false,
    })
    verificationTokenExpires?: Date;
}
export type UserDocument = Document & User;
export const UserSchema = SchemaFactory.createForClass(User);