import "dotenv/config.js";
import cluster from "cluster";
import os from "os";
import { app } from "./app.js";
import dbConnect from './src/database/db.js'
import ENV_CONFIG from "./src/config/config.env.js";

const PORT = ENV_CONFIG.PORT || 8080;
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new one...`);
    cluster.fork();
  });
} else {
  dbConnect()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Worker ${process.pid} is running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`Worker ${process.pid}: Failed to connect to MongoDB`, err);
    });
}
