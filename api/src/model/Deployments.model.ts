import mongoose, { model, Schema } from "mongoose";
enum ProjectType{
    'react',
    'vite',
    'static'
}
const deploymentsSchema = new Schema({
    user_id : {
        type: mongoose.Types.ObjectId, ref: "User"
    },
    repo_url: String,
    branch: String,
    slug: {
        type: String,
        required: true
    },
    projectType: ProjectType,
    current_build_id:{
        type : mongoose.Types.ObjectId, ref: "Builds"
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updateAt:{
        type: Date,
        default: Date.now
    }

})

export const Deployments = model("Deployments", deploymentsSchema)