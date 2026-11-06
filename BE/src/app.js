import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import homeRoutes from "./routes/homeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import personRoutes from "./routes/personRoutes.js";
import lineageRoutes from "./routes/lineageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// Render (and most hosts) put a proxy in front of the app; without this every
// request appears to come from the proxy's IP and rate limiting would treat
// all visitors as one client.
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// The `cors` package checks an array origin with a plain indexOf match, so
// a "*" in this list never acts as a wildcard. FRONTEND_URL lets the
// deployed origin(s) be added without a code change — set it in the hosting
// platform's env vars, comma-separated if there's more than one (e.g. a
// *.pages.dev URL plus a custom domain).
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : []),
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

const limiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
  });

// Cheap blanket limit on everything, plus much tighter ones on the
// endpoints that are attractive to abuse (password guessing, mass signup).
app.use(limiter(15, 600, "Too many requests — please slow down and try again shortly."));
app.use("/api/auth/login", limiter(15, 20, "Too many login attempts — please try again in a few minutes."));
app.use("/api/auth/signup", limiter(60, 10, "Too many sign-ups from this network — please try again later."));

app.use("/", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/people", personRoutes);
app.use("/api/lineages", lineageRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  // Multer (upload size/type) and malformed-JSON errors are the caller's
  // fault, not a server fault.
  const clientError = error.name === "MulterError" || error.type === "entity.parse.failed" || error.message === "Only image files are allowed!";
  if (!clientError) console.error(error);
  res.status(clientError ? 400 : error.status || 500).json({ message: clientError ? error.message : "Something went wrong" });
});

export default app;
