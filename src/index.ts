import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);

console.log("Starting server...");

try {
  const app = createApp();
  console.log("App created successfully");

  const server = app.listen(port, () => {
    console.log(`✅ API running on http://localhost:${port}`);
    console.log(`Test endpoints:`);
    console.log(`  - http://localhost:${port}/`);
    console.log(`  - http://localhost:${port}/api/health`);
  });

  server.on("error", (err) => {
    console.error("❌ Server error:", err);
  });

  process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}
