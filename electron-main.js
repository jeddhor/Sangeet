const { app, BrowserWindow, Menu } = require("electron");
const { startServer, stopServer } = require("./server");

let mainWindow = null;
const DESKTOP_HOST = "127.0.0.1";
const PREFERRED_PORTS = [39241, 39242, 39243, 39244, 39245];

function createMainWindow(url) {
  const window = new BrowserWindow({
    width: 1420,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: true,
    title: "Sangeet",
    autoHideMenuBar: true,
    backgroundColor: "#10151f",
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  window.loadURL(url);
  window.once("ready-to-show", () => {
    window.show();
  });

  return window;
}

async function startServerWithPreferredPort() {
  for (const port of PREFERRED_PORTS) {
    try {
      return await startServer({
        port,
        host: DESKTOP_HOST
      });
    } catch (error) {
      if (error && error.code === "EADDRINUSE") {
        continue;
      }
      throw error;
    }
  }

  // Last-resort fallback if all preferred ports are unavailable.
  return startServer({
    port: 0,
    host: DESKTOP_HOST
  });
}

async function bootstrapElectron() {
  try {
    Menu.setApplicationMenu(null);

    const { port } = await startServerWithPreferredPort();

    mainWindow = createMainWindow(`http://${DESKTOP_HOST}:${port}`);

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error("Failed to launch Sangeet desktop app:", error);
    app.quit();
  }
}

app.whenReady().then(bootstrapElectron);

app.on("window-all-closed", async () => {
  try {
    await stopServer();
  } catch (error) {
    console.error("Error stopping local server:", error);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    bootstrapElectron();
  }
});

app.on("before-quit", async () => {
  try {
    await stopServer();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
});
