import "dotenv/config.js";
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from "./src/routers/auth.js";
import productRoutes from "./src/routers/products.js";


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BASE_URL = "/api/v1/";

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(fileUpload());

app.use(express.static(path.join(__dirname, "uploads")));

app.use(BASE_URL + "auth", authRoutes);
app.use(BASE_URL + "products", productRoutes);

export { app };
