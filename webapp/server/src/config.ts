import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  mlServiceUrl: process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000",
  booksCsv: process.env.BOOKS_CSV ?? "../../data/raw/books.csv",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};
