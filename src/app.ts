import "dotenv/config";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

export function createApp(): Express {
  const app = express();

  // Add request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  app.use(express.json({ limit: "5mb" }));

  // Add a root route for testing
  app.get("/", (req: Request, res: Response) => {
    res.json({
      message: "Server is running",
      timestamp: new Date().toISOString(),
      routes: ["/api/health", "/api/import", "/api/customers"],
    });
  });

  // Add basic health check at root level
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  });

  // Import main routes (which includes both import and customer routes)
  try {
    import("@routes/index.js")
      .then((routesModule) => {
        app.use("/api", routesModule.default);
        console.log("✅ All routes loaded");
      })
      .catch((err) => {
        console.error("❌ Failed to load routes:", err);
      });
  } catch (error) {
    console.error("❌ Error importing routes:", error);
  }

  return app;
}
