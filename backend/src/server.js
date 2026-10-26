require("dotenv").config();
const app = require("./app");
const { checkDatabaseConnection } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check and initialize database connection
    await checkDatabaseConnection();

    const server = app.listen(PORT, () => {
      console.log(`🚀 [ENTP Server] Running on http://localhost:${PORT}`);
      console.log(`📡 [ENTP Health] Check http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Gracefully terminating server...`);
      server.close(() => {
        console.log("👋 ENTP server closed cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Fatal error starting ENTP backend:", error);
    process.exit(1);
  }
}

startServer();
