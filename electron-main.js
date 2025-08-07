// electron-main.js
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  globalShortcut,
  protocol, // ★ 追加
} = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const isDev = !app.isPackaged || process.env.NEXT_DEV === "true";
const dataFilePath = path.join(app.getPath("userData"), "tasks.json");

/* ──────────── IPC : 読み書き ─────────────────── */
ipcMain.handle("load-tasks", () => {
  try {
    return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
  } catch {
    return { tasks: [], points: 0 };
  }
});

ipcMain.on("save-tasks", (_e, data) => {
  try {
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(data ?? { tasks: [], points: 0 }, null, 2),
      "utf8"
    );
  } catch (e) {
    console.error("save-tasks failed:", e);
  }
});

/* ──────────── 初回データファイル ─────────────── */
function ensureDataFile() {
  try {
    fs.accessSync(dataFilePath);
  } catch {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify({ tasks: [], points: 0 }, null, 2),
      "utf8"
    );
  }
}

/* ──────────── _next 静的ファイル読み替え ──────── */
// ❶ 先の registerNextInterceptor を差し替え
function registerNextInterceptor(outDir) {
  protocol.interceptFileProtocol("file", (req, cb) => {
    // ex) file:///C:/_next/static/chunks/main-xxxx.js
    const full = decodeURI(req.url.substr(7)); // =>  /C:/_next/…  or  /_next/…
    const m = full.match(/\/_next\/(.+)$/); // *_next/ 以降だけ取り出す
    if (m) {
      // Windows でも確実に outDir\_next\… へリダイレクト
      const filePath = path.join(outDir, "_next", m[1]);
      return cb(filePath);
    }
    cb(full); // それ以外はそのまま
  });
}

/* ──────────── ウィンドウ生成 ─────────────────── */
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

  /* メニュー非表示 */
  Menu.setApplicationMenu(null);

  /* DevTools トグル */
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    const w = BrowserWindow.getFocusedWindow();
    if (w) w.webContents.toggleDevTools({ mode: "detach" });
  });

  /* 開発 / 本番ロード */
  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const candidates = [
      path.join(__dirname, "frontend", "out"),
      path.join(__dirname, "out"),
    ];
    const outDir =
      candidates.find((p) => fs.existsSync(path.join(p, "index.html"))) ||
      candidates[0];

    registerNextInterceptor(outDir); // ★ 追加
    win.loadURL(pathToFileURL(path.join(outDir, "index.html")).href);
  }

  /* 読み込み失敗ログ */
  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("did-fail-load:", code, desc, url);
  });
}

/* ──────────── ライフサイクル ─────────────────── */
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

/* アプリ終了時にショートカット解除 */
app.on("will-quit", () => globalShortcut.unregisterAll());
