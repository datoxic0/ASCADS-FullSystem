const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    // Optional: hide menu bar
    autoHideMenuBar: true
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, load the Vite dev server
    mainWindow.loadURL('http://localhost:8080');
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html from dist
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist', 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  // On macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});
