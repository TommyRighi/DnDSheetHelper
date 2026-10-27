import { createApp } from './app.js';
const server = createApp();
const port = Number(process.env.PORT || 8787);
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Fable web su http://${process.env.HOST || '127.0.0.1'}:${port} · salvataggi locali nel browser`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
