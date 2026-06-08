import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  database: {
    url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/ticket_system',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  auth: {
    secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-key',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  superPassword: process.env.SUPERUSER_PASSWORD,
};
