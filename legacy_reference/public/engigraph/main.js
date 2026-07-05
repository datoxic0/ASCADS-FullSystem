const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "EngiGraph Pro",
    icon: path.join(__dirname, 'EngiGraphLogo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Necessary for local file imports in ES modules if protocol isn't complex
    }
  });

  win.maximize();
  win.setMenu(null); // Remove default menu for a professional look

  // Handle local file ESM serving
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
