const { app, BrowserWindow, dialog, ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { renderADGAsync } = require("./core/core.js")

const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

//auto updater
require('update-electron-app')()

let mainWindow
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,

    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  //handle links which open in _blank
  mainWindow.webContents.setWindowOpenHandler(function ({url}) {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  //setup window level vars
  inputDirectory = ""
  outputDirectory = store.get("outputDirectory") || ""
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


ipcMain.handle("showAlert", (_, message) => {
  dialog.showMessageBox({ message });
});



var inputDirectory = ""
var outputDirectory = ""

let selDir = async () => {
  res = await dialog.showOpenDialog({ properties: ["openDirectory"] })
  var selectedDir = ""
  if (!res.cancelled && res.filePaths.length > 0) {
    selectedDir = res.filePaths[0]
  }
  return selectedDir
}

ipcMain.handle("selectInputDir", async (_) => {
  let dir = await selDir()
  if (dir.length > 0) {
    inputDirectory = dir
  }
  return inputDirectory
})

ipcMain.handle("getOutputDir", async (_) => {
  if (!outputDirectory) {
    outputDirectory = store.get("outputDirectory") || ""
  }

  return outputDirectory
})

ipcMain.handle("selectOutputDir", async () => {
  let dir = await selDir()
  if (dir.length > 0) {
    outputDirectory = dir
    store.set("outputDirectory", dir)
  }
  return outputDirectory
})

ipcMain.handle("startProcessing", async () => {
  console.log("process", inputDirectory, outputDirectory)
  try {
    if (inputDirectory.length == 0 || outputDirectory.length == 0) {
      throw "Please select directories!"
    }
    await renderADGAsync(inputDirectory, outputDirectory, (msg) => {
      mainWindow.webContents.send("newMsg", msg)
    })
    dialog.showMessageBox({ message: "Done!" })
  } catch (err) {
    dialog.showErrorBox("Error!", `${err}`)
  } finally {
    return true
  }
})
