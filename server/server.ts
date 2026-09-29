import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

// Load .env variables into process.env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  }
}

import propertyRoutes from './routes/propertyRoutes';
import agentRoutes from './routes/agentRoutes';
import enquiryRoutes from './routes/enquiryRoutes';
import userRoutes from './routes/userRoutes';
import siteVisitRoutes from './routes/siteVisitRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import activityRoutes from './routes/activityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { initDatabase, getActiveEngine } from './db/database';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Cityspace SQL Backend API',
    databaseEngine: getActiveEngine(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Cityspace Backend API running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/api`);
    console.log(`🗄️  SQL Database Engine: ${getActiveEngine().toUpperCase()}`);
    console.log(`=============================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});

export default app;
