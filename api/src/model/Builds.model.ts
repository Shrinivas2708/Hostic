import mongoose, { model, Schema } from "mongoose";
import type { LogLevel } from "../utils/pub";

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
  triggeredBy?: "manual" | "webhook";
  logs?: BuildLogEntry[];
}

export type BuildLogEntry = {
  level: LogLevel;
  message: string;
  at: number;
};

const buildLogSchema = new Schema<BuildLogEntry>(
  {
    level: {
      type: String,
      enum: ["info", "error", "stdout", "stderr", "success"],
      required: true,
    },
    message: { type: String, required: true },
    at: { type: Number, required: true },
  },
  { _id: false }
);

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
    duration: { type: Number, default: 0 },
    triggeredBy: { type: String, enum: ["manual", "webhook"], default: "manual" },
    logs: { type: [buildLogSchema], default: [] },
  },
  { timestamps: true }
);

export const Builds = model<IBuild>("Builds", buildsSchema);
