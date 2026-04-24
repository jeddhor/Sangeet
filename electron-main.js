const { app, BrowserWindow, Menu } = require("electron");
const { startServer, stopServer } = require("./server");

let mainWindow = null;

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

async function bootstrapElectron() {
  try {
    Menu.setApplicationMenu(null);

    const { port } = await startServer({
      port: 0,
      host: "127.0.0.1"
    });

    mainWindow = createMainWindow(`http://127.0.0.1:${port}`);

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
