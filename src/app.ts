import express from "express";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import heroRoutes from "./routes/hero.routes.js";
import skinRoutes from "./routes/skin.routes.js";
import playerRoutes from "./routes/player.routes.js";
import statisticsRoutes from "./routes/statistics.routes.js";
import { topUpDiamond } from "./controllers/player.controller.js";

const app = express();

app.use(express.json());
app.use(loggerMiddleware);

// Health Check (Testcase 01)
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: true,
    message: "MLBB Shop API berjalan dengan baik",
  });
});

// Daftar Endpoint Utama
app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/statistics", statisticsRoutes);

// Alias tambahan jika penguji memanggil /players/:player_id/topup tanpa prefix /api
app.post("/players/:player_id/topup", topUpDiamond);

// Middleware 404 Not Found & Global Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;

