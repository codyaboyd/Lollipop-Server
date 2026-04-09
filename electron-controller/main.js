const path = require('path');
const { spawn } = require('child_process');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let mainWindow;
let lollipopProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 760,
    minWidth: 760,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function sendLog(message) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('lollipop:log', message);
}

function buildArgs(config) {
  if (config.mode === 'monitor') {
    return ['monitor', String(config.port), config.password];
  }

  const args = [config.directory, String(config.port)];
  if (config.password) {
    args.push('-p', config.password);
  }

  if (config.tunnel) {
    args.push('--tunnel');
  }

  return args;
}

ipcMain.handle('lollipop:pick-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('lollipop:start', async (_event, config) => {
  if (lollipopProcess) {
    return { ok: false, message: 'Lollipop is already running.' };
  }

  const appRoot = path.resolve(__dirname, '..');
  const cliPath = path.join(appRoot, 'lollipop.js');
  const args = [cliPath, ...buildArgs(config)];

  sendLog(`$ ${process.execPath} ${args.map((arg) => JSON.stringify(arg)).join(' ')}`);

  lollipopProcess = spawn(process.execPath, args, {
    cwd: appRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  lollipopProcess.stdout.on('data', (chunk) => {
    sendLog(chunk.toString());
  });

  lollipopProcess.stderr.on('data', (chunk) => {
    sendLog(chunk.toString());
  });

  lollipopProcess.on('close', (code, signal) => {
    sendLog(`Lollipop exited (code: ${code ?? 'null'}, signal: ${signal ?? 'none'})`);
    lollipopProcess = null;
    mainWindow?.webContents.send('lollipop:status', { running: false });
  });

  lollipopProcess.on('error', (error) => {
    sendLog(`Failed to start Lollipop: ${error.message}`);
    lollipopProcess = null;
    mainWindow?.webContents.send('lollipop:status', { running: false });
  });

  mainWindow?.webContents.send('lollipop:status', { running: true });
  return { ok: true };
});

ipcMain.handle('lollipop:stop', async () => {
  if (!lollipopProcess) {
    return { ok: false, message: 'Lollipop is not running.' };
  }

  lollipopProcess.kill('SIGINT');
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (lollipopProcess) {
    lollipopProcess.kill('SIGINT');
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
