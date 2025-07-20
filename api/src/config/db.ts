import mongoose from "mongoose";

const connectToDB = async (): Promise<void> => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined in environment variables.");
    }

    await mongoose.connect(process.env.DATABASE_URL);

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Stop the server if DB isn't connected
  }
};

export default connectToDB;
