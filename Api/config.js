import dotenv from "dotenv";

dotenv.config();

export const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000";

export const DB_HOST =
  process.env.NODE_ENV === "production" ? process.env.DB_HOST : "localhost";
export const DB_USER =
  process.env.NODE_ENV === "production" ? process.env.DB_USER : "postgres";
export const DB_NAME =
  process.env.NODE_ENV === "production" ? process.env.DB_NAME : "ByGio";
export const DB_PASSWORD =
  process.env.NODE_ENV === "production" ? process.env.DB_PASSWORD : "Enma2707";
export const DB_PORT =
  process.env.NODE_ENV === "production" ? process.env.DB_PORT : 5432;
export const DB_URL =
  process.env.NODE_ENV === "production" && process.env.DB_URL;

export const DB_DIALECT =
  process.env.NODE_ENV === "production" ? "mysql" : "postgres";
