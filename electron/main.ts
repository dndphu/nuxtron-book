import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

process.env.APP_ROOT = path.join(__dirname, "..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, ".output/public");

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(MAIN_DIST, "preload.js"),
      nodeIntegration: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.VITE_PUBLIC!, "index.html"));
  }
  //  if (isDev) {
  //    win.loadURL("http://localhost:3000");
  //  } else {
  //   //  win.loadFile(path.join(__dirname, "../dist/index.html"));
  //     win.loadFile(path.join(process.env.VITE_PUBLIC!, "index.html"));
  //  }
}

function initIpc() {
  ipcMain.handle("app-start-time", () => new Date().toLocaleString());
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  initIpc();
  createWindow();
});
