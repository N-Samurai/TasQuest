// electron-main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const dataFilePath = path.join(app.getPath("userData"), "tasks.json");
const isDev = !app.isPackaged;

ipcMain.handle("load-tasks", () => {
  try {
    return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
  } catch {
    return [];
  }
});

ipcMain.on("save-tasks", (_event, tasks) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(tasks, null, 2));
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "frontend", "out", "index.html"));
  }
}

app.whenReady().then(createWindow);
