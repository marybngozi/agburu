import express from "express";
import cors from "cors";
import homeRoutes from "./routes/homeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import personRoutes from "./routes/personRoutes.js";
import lineageRoutes from "./routes/lineageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// The `cors` package checks an array origin with a plain indexOf match, so
// the "*" that used to sit in this list never actually acted as a wildcard
// — it just silently did nothing, leaving only the two localhost entries
// allowed. That's fine for local dev but would reject every request from a
// deployed frontend (Cloudflare Pages, a custom domain, etc.) with a CORS
// error. FRONTEND_URL lets the deployed origin(s) be added without a code
// change — set it in the hosting platform's env vars, comma-separated if
// there's more than one (e.g. a *.pages.dev URL plus a custom domain).
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : []),
];
app.use(
  cors({
    origin: allowedOrigins,
    // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization']
  }),
);
app.use(express.json());

app.use("/", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/people", personRoutes);
app.use("/api/lineages", lineageRoutes);
app.use("/api/users", userRoutes);

export default app;
