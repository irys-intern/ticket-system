import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { env } from './config/env.ts';
import { initializeDatabase } from './db/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import apiRouter from './routes/index.ts';

const app = express();

// Middleware
app.use(cors({ origin: env.frontend.url }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  try {
    await initializeDatabase();
    
    app.listen(env.port, () => {
      console.log(`✓ Server running on port ${env.port}`);
      console.log(`✓ Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

start();
