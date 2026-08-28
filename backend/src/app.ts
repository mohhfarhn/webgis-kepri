import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "./routes";
import { env } from "./config/env";
import { AppError } from "./utils/AppError";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.length === 0 || env.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError("Origin tidak diizinkan oleh kebijakan CORS", 403));
    },
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
