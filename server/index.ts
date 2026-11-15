import express from 'express';
import { createServer } from 'node:http';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './content';
import { createApp } from './app';

const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un número entre 1 y 65535.');
const app = createApp();

const server = createServer(app);
let closeVite: (() => Promise<void>) | undefined;
if (dev) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    root: projectRoot,
    server: { middlewareMode: true, hmr: { server }, watch: { ignored: ['**/reference/**', '**/.tools/**', '**/.tmp/**', '**/content/**'] } },
    appType: 'spa',
  });
  closeVite = () => vite.close();
  app.use(vite.middlewares);
} else {
  try { await access(path.join(projectRoot, 'dist/index.html')); }
  catch { console.error('Primero ejecuta npm run build para crear dist/.'); process.exit(1); }
  app.use(express.static(path.join(projectRoot, 'dist')));
  app.get('/', (_req, res) => { res.sendFile(path.join(projectRoot, 'dist/index.html')); });
}

server.on('error', async (error: NodeJS.ErrnoException) => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} está ocupado. Detén el otro editor con Ctrl+C o configura PORT.` : error.message);
  await closeVite?.();
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`\nEditor local · ${dev ? 'desarrollo' : 'compilación'}\nhttp://127.0.0.1:${port}\nPulsa Ctrl+C para detenerlo.\n`);
});
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await closeVite?.();
  server.closeAllConnections();
  server.close(() => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
