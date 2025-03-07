const ENV_CONFIG = {
  MONGODB_URL: process.env.MONGODB_URL || "",
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || "",
  PORT: parseInt(process.env.PORT) || 8080,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST || "",
  NODEMAILER_USER_EMAIL: process.env.NODEMAILER_USER_EMAIL || "",
  NODEMAILER_USER_PASSWORD: process.env.NODEMAILER_USER_PASSWORD || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  SUB_ADMIN_EMAIL: process.env.SUB_ADMIN_EMAIL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  ADMIN_PHONE : process.env.ADMIN_PHONE,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET : process.env.GOOGLE_CLIENT_SECRET || "",
  COOKIE_KEY: process.env.COOKIE_KEY || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "",
  API_BASE_URL: process.env.API_BASE_URL || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "",
};

Object.freeze(ENV_CONFIG);

export default ENV_CONFIG;
