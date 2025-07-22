import mongoose, { model, Schema } from "mongoose";
export enum BuildStatus {
  Queued = "queued",
  Building = "building",
  Failed = "failed",
  Success = "success",
}

export interface IBuild extends Document {
  deployment_id: mongoose.Types.ObjectId;
  build_name: string;
  status: BuildStatus;
  artifact_path?: string;
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
}

const buildsSchema = new Schema<IBuild>(
  {
    deployment_id: {
      type: Schema.Types.ObjectId,
      ref: "Deployments",
      required: true,
      index: true,
    },
    build_name: { type: String, required: true, trim: true , unique:true},
    status: {
      type: String,
      enum: Object.values(BuildStatus),
      default: BuildStatus.Queued,
      index: true,
    },
    artifact_path: { type: String, default: "" },
    startedAt: Date,
    finishedAt: Date,
    duration: { type: Number, default: 0 }, // compute on finish if you want
  },
  { timestamps: true }
);

export const Builds = model<IBuild>("Builds", buildsSchema);
