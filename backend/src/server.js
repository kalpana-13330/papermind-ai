const dotenv = require('dotenv');
// Load environment variables before anything else
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize Database & Server
let server;

const startServer = async () => {
  server = app.listen(PORT, () => {
    console.log(`[Server] Backend running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    console.log(`[Server] Health check available at: http://localhost:${PORT}/api/health`);
  });

  try {
    await connectDB();
  } catch (err) {
    console.warn(`[Database Notice] Initial connection attempt: ${err.message}. Retrying in 5s...`);
    setTimeout(async () => {
      try {
        await connectDB();
      } catch (retryErr) {
        console.error('[Database Notice] Retry failed, please check network connection or Atlas IP access:', retryErr.message);
      }
    }, 5000);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[Process Error] Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err);
  process.exit(1);
});

startServer();
