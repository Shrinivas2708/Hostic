import mongoose, { model, Schema } from "mongoose";
enum Status {
    'queued',
    'building',
    'failed',
    'success'
}
const buildsSchema = new Schema({
   deployment_id:{
    type: mongoose.Types.ObjectId, ref:"Deployments"
   },
   build_name: String,
   status : Status,
   artifact_path: String,
   startedAt:{
    type: Date
   },
   finishedAt:{
    type: Date
   },
   duration: {
    type: Number,
    default: 0
   }


})

export const Builds = model("Builds", buildsSchema)