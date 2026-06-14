import mongoose, { Schema } from "mongoose";

export interface UserDocument extends mongoose.Document {
  clerkUserId: string;
  email: string;
  name: string;
  role: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    clerkUserId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: "member" }
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
