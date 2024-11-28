import dotenv from "dotenv";

dotenv.config();

export const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_GIO
    : "http://localhost:5173";

export const DB_HOST =
  process.env.NODE_ENV === "production" ? process.env.DB_HOST_GIO : "localhost";
export const DB_USER =
  process.env.NODE_ENV === "production" ? process.env.DB_USER_GIO : "postgres";
export const DB_NAME =
  process.env.NODE_ENV === "production" ? process.env.DB_NAME_GIO : "bygio";
export const DB_PASSWORD =
  process.env.NODE_ENV === "production" ? process.env.DB_PASSWORD_GIO : "Enma2707";
export const DB_PORT =
  process.env.NODE_ENV === "production" ? process.env.DB_PORT_GIO : 5432;
export const DB_URL =
  process.env.NODE_ENV === "production" && process.env.DB_URL;

export const DB_DIALECT =
  process.env.NODE_ENV === "production" ? "mysql" : "postgres";
