import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// Initializing the SDK at start-up with a safety check
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const CORS_ORIGINS = process.env.CORS_ORIGINS || "*";

  // Allow cross-origin requests
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || CORS_ORIGINS === "*") {
          callback(null, true);
          return;
        }

        const allowList = CORS_ORIGINS.split(",").map((item) => item.trim());
        callback(null, allowList.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: "10mb" }));

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Code Clarity Backend is running" });
  });

  app.post("/api/explain", async (req, res) => {
    try {
      const {
        inputCode,
        language,
        outputLanguage,
        actionType,
        imageData,
        mimeType,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing from environment variables");
        return res.status(500).json({ error: "API Key configuration error" });
      }

      if (!inputCode && !imageData) {
        return res
          .status(400)
          .json({ error: "Input code or image is required" });
      }

      // Use the consolidated service
      const { generateAIContent } = await import("./src/services/gemini");
      const text = await generateAIContent({
        inputCode,
        language,
        outputLanguage,
        actionType,
        imageData,
        mimeType,
        modelName: GEMINI_MODEL,
      });

      res.json({ result: text });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error("Failed to call AI API:", errorMessage);

      if (errorMessage.includes("API key not valid")) {
        return res.status(500).json({ error: "Invalid GEMINI_API_KEY on server." });
      }
      if (errorMessage.includes("Model not found") || errorMessage.includes("404")) {
        return res.status(500).json({
          error: `Configured model '${GEMINI_MODEL}' is not available for this API key.`,
        });
      }
      if (
        errorMessage.includes("RESOURCE_EXHAUSTED")
        || errorMessage.includes("429")
        || errorMessage.toLowerCase().includes("quota")
      ) {
        return res.status(429).json({ error: "Gemini quota/rate limit reached. Please try again later." });
      }

      res.status(500).json({ error: `AI request failed: ${errorMessage}` });
    }
  });

  app.use((error: any, req: any, res: any, next: any) => {
    if (error?.type === "entity.too.large") {
      return res.status(413).json({
        error: "Uploaded image is too large. Please use a smaller image (max 10MB request size).",
      });
    }
    return next(error);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.get("/", (req, res) => {
      res.send("Code Clarity API Backend is running.");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Gemini model: ${GEMINI_MODEL}`);
  });
}

startServer();
