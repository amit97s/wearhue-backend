import mongoose from "mongoose";
import ENV_CONFIG from "../config/config.env.js";

const dbConnect = async () => {
  try {
    const connection = await mongoose.connect(ENV_CONFIG.MONGODB_URL,
    //  { maxPoolSize : 100 }
    );

    if (connection) {
      console.log("MongoDB Connected: ", mongoose.connection.host);
    }

    mongoose.connection.on("connected", () => {
      console.log("MongoDB Connected: ", mongoose.connection.host);
    });

    mongoose.connection.on("error", (error) => {
      console.error("Error in database connection:", error);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

export default dbConnect;
