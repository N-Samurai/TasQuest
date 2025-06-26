// electron-main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const dataFilePath = path.join(app.getPath("userData"), "tasks.json");
const isDev = !app.isPackaged;

ipcMain.handle("load-tasks", () => {
  try {
    const content = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(content);
  } catch {
    return { tasks: [], points: 0 }; // ← 初期値をオブジェクトで返す
  }
});

ipcMain.on("save-tasks", (_event, data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf-8");
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
