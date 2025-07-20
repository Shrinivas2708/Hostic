import { model, Schema } from "mongoose";

const userSchema = new Schema({
    username : {
        type: String,
        required : true,
        unique : true
    },
    email : {
        type: String,
        required : true,
        unique : true
    },
    password : String,
    createdAt : {
        type: Date,
        default : Date.now,
    },
    updatedAt : {
        type: Date,
        default : Date.now,
    }
})
export const User = model("User", userSchema)