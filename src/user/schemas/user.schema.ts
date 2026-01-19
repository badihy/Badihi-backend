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
        required: true,
    })
    password: string;

    @Prop({
        required: false,
    })
    phone: string;

    @Prop({
        default: false,
    })
    isVerified: boolean;
}
export type UserDocument = Document & User;
export const UserSchema = SchemaFactory.createForClass(User);