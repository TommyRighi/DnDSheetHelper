const { app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme: 'fable', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
if (process.env.FABLE_DESKTOP_USER_DATA) app.setPath('userData', process.env.FABLE_DESKTOP_USER_DATA);
app.setName('Fable');
let window;
const appUrl = 'fable://app/index.html';
const safeExternal = value => {
  try { const url = new URL(value); return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)); } catch { return false; }
};
function trustedSender(event) {
  return window && event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame && event.senderFrame.url.startsWith('fable://app/');
}
function showWindow() {
  if (!window || window.isDestroyed()) { createWindow(); return; }
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  app.focus({ steal: true });
}
function createWindow() {
  window = new BrowserWindow({ width: 1440, height: 900, minWidth: 900, minHeight: 650, title: 'Fable', show: false, backgroundColor: '#19191d',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, spellcheck: false },
  });
  window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('fable://app/')) event.preventDefault(); });
  window.webContents.setWindowOpenHandler(({ url, referrer }) => {
    if (referrer.url.startsWith('fable://app/') && safeExternal(url)) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.once('ready-to-show', showWindow);
  window.loadURL(appUrl).catch(error => {
    dialog.showErrorBox('Fable non riesce ad aprirsi', error.message);
  });
  window.on('closed', () => { window = null; });
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showWindow);
  app.whenReady().then(async () => {
    const root = path.resolve(__dirname, '../dist');
    protocol.handle('fable', async request => {
      const url = new URL(request.url);
      if (url.hostname !== 'app' || !['GET', 'HEAD'].includes(request.method)) return new Response('Not found', { status: 404 });
      let target;
      try { target = path.resolve(root, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`); } catch { return new Response('Bad path', { status: 400 }); }
      const relative = path.relative(root, target);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Forbidden', { status: 403 });
      try { return await net.fetch(pathToFileURL(target).toString()); } catch { return new Response('Not found', { status: 404 }); }
    });
    session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => callback(permission === 'clipboard-sanitized-write' && contents === window?.webContents && details.isMainFrame && details.requestingUrl?.startsWith('fable://app/')));
    session.defaultSession.setPermissionCheckHandler((contents, permission, origin) => permission === 'clipboard-sanitized-write' && contents === window?.webContents && origin === 'fable://app');
    ipcMain.handle('fable:info', event => {
      if (!trustedSender(event)) throw new Error('Sender non valido.');
      return { platform: process.platform, version: app.getVersion() };
    });
    ipcMain.handle('fable:save-backup', async (event, value, format = 'json') => {
      if (!trustedSender(event)) throw new Error('Sender non valido.');
      const { serializeBackup } = await import(pathToFileURL(path.join(__dirname, '../src/backup-file.js')).href);
      const text = serializeBackup(value, format);
      const result = await dialog.showSaveDialog(window, { title: 'Esporta tutti i dati di Fable', defaultPath: `fable-completo.${format}`, filters: [{ name: 'Backup Fable', extensions: [format] }] });
      if (result.canceled || !result.filePath) return false;
      // Electron's dialog supplies the path; the page cannot request arbitrary file writes.
      const temporary = `${result.filePath}.fable-tmp`;
      await fs.writeFile(temporary, text, { mode: 0o600 });
      await fs.rename(temporary, result.filePath);
      return true;
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform === 'darwin' ? [{ label: 'Fable', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' }] }] : []),
      { label: 'File', submenu: [{ label: 'Stampa scheda', accelerator: 'CmdOrCtrl+P', click: () => window?.webContents.print({ printBackground: true }) }, { type: 'separator' }, { role: process.platform === 'darwin' ? 'close' : 'quit' }] },
      { label: 'Modifica', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
      { label: 'Vista', submenu: [{ role: 'reload' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] },
      { label: 'Finestra', submenu: [{ role: 'minimize' }, { role: 'zoom' }] },
    ]));
    createWindow();
    app.on('activate', showWindow);
  });
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
