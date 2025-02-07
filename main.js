const { app, BrowserWindow, clipboard, ipcMain, Menu, globalShortcut  } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
const jsonFilePath = path.join(app.getPath('userData'), 'clipboard.json');
const welcomeFilePath = path.join(__dirname, 'welcome.json');

if (!fs.existsSync(jsonFilePath)) {
  if (fs.existsSync(welcomeFilePath)) {
    const welcome = fs.readFileSync(welcomeFilePath, 'utf-8');
    fs.writeFileSync(jsonFilePath, welcome);
  }
}
Menu.setApplicationMenu(null);


app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 450,
    frame: false, // ❌ Removes window frame (no close, minimize, maximize buttons)
    alwaysOnTop: false, // ✅ Keeps it floating on top of other windows
    resizable: true, // 🔒 Prevents resizing (optional)
    transparent: true, // 🎨 Makes the window   transparent (optional)
    hasShadow: false, // 🔄 Removes the window shadow (optional)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

    mainWindow.loadURL('http://localhost:5173'); // Vite default port

    // remember to remove '/' from static react build files in index.html
    // mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // mainWindow.webContents.openDevTools()

    setInterval(() => {
      const text = clipboard.readText();
      if (text) {
        fs.readFile(jsonFilePath, (err, data) => {
          if (err) return console.error('Error reading file:', err);
          
          let clipboardData = JSON.parse(data);
          
          // Ensure it's a valid array
          if (!Array.isArray(clipboardData)) {
            clipboardData = [];
          }
    
          // Add new item to the top if it’s not a duplicate
          if (!clipboardData.includes(text)) {
            clipboardData.unshift(text); // LIFO behavior (stack)
            
            // Optional: Limit clipboard history to 50 items
            if (clipboardData.length > 50) {
              clipboardData.pop(); // Remove the oldest entry
            }
    
            fs.writeFile(jsonFilePath, JSON.stringify(clipboardData, null, 2), (err) => {
              if (err) console.error('Error writing file:', err);
              else mainWindow.webContents.send('clipboard-updated', clipboardData);
            });
          }
        });
      }
    }, 1500);
});

// mainWindow.webContents.openDevTools()

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


// Add this to your existing IPC handlers
ipcMain.on('write-to-clipboard', (event, text) => {
    clipboard.writeText(text); // Write the text to the system clipboard
    console.log('Text copied to clipboard:', text);
  });


ipcMain.on('close-app', () => {
    app.quit();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
