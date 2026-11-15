import express, { type ErrorRequestHandler, type Request, type RequestHandler } from 'express';
import path from 'node:path';
import { ContentError, loadBook, projectRoot, safeFile } from './content';
import { savePage, SaveError } from './savePage';
import { createPage, deletePage, duplicatePage, reorderPages, saveBookNumbering } from './managePages';
import { contentOperation } from './storage';
import { uploadImage, maxImageBytes } from './uploadImage';
import { analyzeImages, deleteUnusedImages } from './imageAssets';

// Register the real API without starting a listener or frontend tooling.
export function createApp(root = projectRoot) {
  const app = express();
  app.disable('x-powered-by');
  // Only loopback hostnames, including during development.
  app.use((req, res, next) => {
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(req.hostname)) {
      res.status(403).send('Este editor solo admite acceso local.');
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.get('/api/book', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      res.json(await contentOperation(() => loadBook(root)));
    } catch (error) {
      if (error instanceof ContentError) res.status(422).json({ message: error.message, issues: error.issues });
      else {
        console.error(error);
        res.status(500).json({ message: 'No se pudo leer el libro local. Revisa la terminal.' });
      }
    }
  });
  app.use('/api', (req, res, next) => {
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) { next(); return; }
    // JSON-only, same-origin writes; no CORS and no writes from other local websites.
    const origin = req.get('origin');
    if ((origin && origin !== `${req.protocol}://${req.get('host')}`) || req.get('sec-fetch-site') === 'cross-site') {
      res.status(403).json({ message: 'Guarda desde la pestaña del editor local.' }); return;
    }
    if (req.method === 'POST' && req.path === '/images') { next(); return; }
    if (!req.is('application/json')) {
      res.status(415).json({ message: 'El contenido debe enviarse como JSON.' }); return;
    }
    next();
  }, express.json({ limit: '1mb' }));
  const mutation = (run: (req: Request) => Promise<unknown>): RequestHandler => async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      res.json(await run(req));
    } catch (error) {
      if (error instanceof SaveError) res.status(error.status).json({ message: error.message });
      else if (error instanceof ContentError) res.status(422).json({ message: error.message, issues: error.issues });
      else {
        console.error(error);
        res.status(500).json({ message: 'No se pudo guardar el cambio o crear su respaldo. Revisa la terminal y vuelve a intentarlo; tus borradores siguen en el editor.' });
      }
    }
  };
  const pageId = (req: Request) => String(req.params.id);
  app.post('/api/images', express.raw({ type: () => true, limit: maxImageBytes, inflate: false }), mutation(req => {
    let name: string;
    try { name = decodeURIComponent(req.get('x-file-name') || ''); }
    catch { throw new SaveError(400, 'Nombre de archivo inválido.'); }
    return uploadImage(name, req.get('content-type') || '', req.body, root);
  }));
  app.put('/api/pages/:id', mutation(async req => ({ page: await savePage(pageId(req), req.body, root) })));
  app.post('/api/images/analyze', mutation(req => analyzeImages(req.body, root)));
  app.post('/api/images/delete-unused', mutation(req => deleteUnusedImages(req.body, root)));
  app.post('/api/pages', mutation(req => createPage(req.body, root)));
  app.post('/api/pages/:id/duplicate', mutation(req => duplicatePage(pageId(req), root)));
  app.delete('/api/pages/:id', mutation(req => deletePage(pageId(req), root)));
  app.put('/api/book/page-order', mutation(req => reorderPages(req.body, root)));
  app.put('/api/book/numbering', mutation(req => saveBookNumbering(req.body, root)));
  const apiError: ErrorRequestHandler = (error, req, res, _next) => {
    res.status(error.status === 413 ? 413 : 400).json({ message: error.status === 413
      ? (req.path === '/images' ? 'La imagen supera el límite de 10 MB.' : 'La página supera el límite de 1 MB para guardar.')
      : 'Contenido inválido; revisa el archivo o el JSON enviado.' });
  };
  app.use('/api', apiError);
  app.use('/api', (_req, res) => { res.status(404).json({ message: 'Ruta de API no disponible en esta etapa.' }); });

  for (const folder of ['assets', 'diagrams']) {
    app.use(`/${folder}`, async (req, res) => {
      try {
        if (!['GET', 'HEAD'].includes(req.method)) { res.sendStatus(405); return; }
        const relative = decodeURIComponent(req.path).replace(/^\/+/, '');
        if (!/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp|gif|svg)$/.test(relative)) {
          res.status(404).send('Recurso no encontrado.'); return;
        }
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(await safeFile(path.join(root, folder), relative));
      } catch { res.status(404).send('Recurso local no encontrado.'); }
    });
  }
  return app;
}
