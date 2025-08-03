import mongoose, { model, Schema } from "mongoose";
export enum ProjectType {
  React = "react",
  Vite = "vite",
  Static = "static",
}


export interface IDeployment extends Document {
  user_id: mongoose.Types.ObjectId;
  repo_url: string;
  branch: string;
  slug: string;
  projectType: ProjectType;
  current_build_id?: mongoose.Types.ObjectId | null;
  buildCommands?: string;
  installCommands? : string;
  buildDir?:string;
  img_url?:string;
  img_id?:string;
  image_build_id?:mongoose.Types.ObjectId | null;
  buildNo?:number;
}

const deploymentsSchema = new Schema<IDeployment>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repo_url: { type: String, required: true, trim: true },
    branch: { type: String, default: "main", trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    projectType: {
      type: String,
      enum: Object.values(ProjectType),
      required: true,
    },
    current_build_id: { type: Schema.Types.ObjectId, ref: "Builds", default: null },
    buildCommands: { type: String, default: "" },
    installCommands: { type: String, default: "" },
    img_url:{type:String},
    img_id:{type:String},
    buildNo:{type:Number},
    image_build_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Builds',
}

  },
  { timestamps: true }
);

export const Deployments = model<IDeployment>("Deployments", deploymentsSchema);
