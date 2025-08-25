import "dotenv/config";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

export function createApp(): Express {
  const app = express();

  console.log("Setting up middleware...");

  // Add request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  app.use(express.json({ limit: "5mb" }));

  // Add a root route for testing
  app.get("/", (req: Request, res: Response) => {
    console.log("Root route hit");
    res.json({
      message: "Server is running",
      timestamp: new Date().toISOString(),
      routes: ["/api/health", "/api/import"],
    });
  });

  // Add basic health check at root level
  app.get("/health", (req: Request, res: Response) => {
    console.log("Health check hit");
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("❌ Express error:", err);
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  });

  console.log("Middleware setup complete");

  // Import routes after basic setup
  try {
    console.log("Loading import routes...");
    import("@routes/import.routes.js")
      .then(({ routes }) => {
        app.use("/api", routes);
        console.log("✅ Import routes loaded");
      })
      .catch((err) => {
        console.error("❌ Failed to load import routes:", err);
      });
  } catch (error) {
    console.error("❌ Error importing routes:", error);
  }

  return app;
}
