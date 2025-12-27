import dotenv from 'dotenv';
import path from 'path';
import { createApp } from './app';
import { scheduler } from './scheduler';

// Load environment variables from apps/server/.env
dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API base: http://localhost:${PORT}/api`);

      // Start scheduler
      scheduler.start();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      scheduler.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
