import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    deployments_count: {
        type:Number,
        default:0
    }
  },
  {
    timestamps: true,
  }
);
export const User = model("User", userSchema);
