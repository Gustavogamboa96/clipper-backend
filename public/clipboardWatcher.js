const { clipboard, app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
const jsonFilePath = path.join(app.getPath('userData'), 'clipboard.json');

if (!fs.existsSync(jsonFilePath)) {
  fs.writeFileSync(jsonFilePath, JSON.stringify([]));
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL('http://localhost:3000'); // Change to loadFile('build/index.html') in production

  setInterval(() => {
    const text = clipboard.readText();
    if (text) {
      fs.readFile(jsonFilePath, (err, data) => {
        if (err) return console.error('Error reading file:', err);

        let clipboardData = JSON.parse(data);
        if (!clipboardData.includes(text)) {
          clipboardData.push(text);
          fs.writeFile(jsonFilePath, JSON.stringify(clipboardData, null, 2), (err) => {
            if (err) console.error('Error writing file:', err);
            else mainWindow.webContents.send('clipboard-updated', clipboardData);
          });
        }
      });
    }
  }, 2000); // Check every 2 seconds
});

ipcMain.on('get-clipboard-data', (event) => {
  fs.readFile(jsonFilePath, (err, data) => {
    if (err) {
      console.error('Error reading clipboard data:', err);
      event.reply('clipboard-data', []);
    } else {
      event.reply('clipboard-data', JSON.parse(data));
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
