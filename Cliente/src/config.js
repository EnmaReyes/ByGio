export const API_URL =
  import.meta.env.MODE === "production"
    ? "https://tudominio.com"
    : "http://localhost:3000";
