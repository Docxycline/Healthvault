import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter, authMiddleware } from './server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing and cookies
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // Global auth context middleware
  app.use(authMiddleware);

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'HealthVault API',
      version: '1.0.0-hackathon',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HealthVault] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[HealthVault] Failed to start server:', err);
  process.exit(1);
});
