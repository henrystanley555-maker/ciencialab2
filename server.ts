import express from 'express';
import path from 'node:path';
import { createApiApp } from './server/app.ts';

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();

async function startServer() {
  const app = createApiApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Ruta API no encontrada.' });
        return;
      }
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CienciaLab Editorial running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
