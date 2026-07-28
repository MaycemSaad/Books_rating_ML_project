import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { authRouter } from "./auth/routes.js";
import { booksRouter } from "./books/routes.js";
import { recommendationsRouter } from "./recommendations/routes.js";
import { predictRouter } from "./predict/routes.js";

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "6mb" })); // allow CSV batch prediction payloads

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "bookwise-api" }));

app.use("/api/auth", authRouter);
app.use("/api/books", booksRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/predict", predictRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(config.port, () => {
  console.log(`BookWise API listening on http://localhost:${config.port}`);
});
