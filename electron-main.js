// electron-main.js
const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const isDev = !app.isPackaged || process.env.NEXT_DEV === "true";
const dataFilePath = path.join(app.getPath("userData"), "tasks.json");

// --- IPC: タスク保存/読込 ---------------------------------------------------
ipcMain.handle("load-tasks", () => {
  try {
    const content = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(content);
  } catch {
    return { tasks: [], points: 0 };
  }
});

ipcMain.on("save-tasks", (_event, data) => {
  try {
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(data ?? { tasks: [], points: 0 }, null, 2),
      "utf-8"
    );
  } catch (e) {
    console.error("save-tasks failed:", e);
  }
});

// 必要なら初回にファイルを作成
function ensureDataFile() {
  try {
    fs.accessSync(dataFilePath);
  } catch {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify({ tasks: [], points: 0 }, null, 2),
      "utf-8"
    );
  }
}

// --- BrowserWindow -----------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // メニュー非表示（Win/Linux/macOS すべて）
  Menu.setApplicationMenu(null);

  if (isDev) {
    // 開発: Next の dev サーバを表示（assetPrefix は next.config で無効にしておく）
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // 本番: next export した index.html を file:// で表示（相対アセット前提）
    // - out の候補: frontend/out or out
    const candidates = [
      path.join(__dirname, "frontend", "out"),
      path.join(__dirname, "out"),
    ];
    const outDir =
      candidates.find((p) => fs.existsSync(path.join(p, "index.html"))) ||
      candidates[0];

    const indexHtml = path.join(outDir, "index.html");
    win.loadURL(pathToFileURL(indexHtml).href);
  }

  // 失敗時のログ（デバッグ用）
  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("did-fail-load:", code, desc, url);
  });
}

// --- App lifecycle -----------------------------------------------------------
app.whenReady().then(() => {
  ensureDataFile();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
