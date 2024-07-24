import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";


process.env.APP_ROOT = path.join(__dirname, "..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, ".output/public");

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    autoHideMenuBar: true,

    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 320,

    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      webSecurity: false,
      experimentalFeatures: true,

      preload: path.join(MAIN_DIST, "preload.js"),
    },
    // transparent: true,
    // show: false,
    // frame: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL ?? "");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.VITE_PUBLIC!, "index.html"));
  }
}

function initIpc() {
  ipcMain.handle("app-start-time", () => new Date().toLocaleString());
}

function openDialog() {
  ipcMain.handle("open-file-dialog", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: "ePub", extensions: ["epub"] }],
      properties: ["openFile", "multiSelections"],
    });

    if (canceled) {
      return;
    } else {
      return filePaths;
    }
  });
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
  openDialog();
  createWindow();
});
