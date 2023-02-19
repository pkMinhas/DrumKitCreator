// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// const { contextBridge, ipcRenderer } = require('electron')


// contextBridge.exposeInMainWorld("api", {
//     selectInputDirectory: () => ipcRenderer.invoke("selectInputDir"),
//     selectOutputDirectory: () => ipcRenderer.invoke("selectOutputDir"),
//     startProcessing: () => ipcRenderer.invoke("startProcessing"),
//     getOutputDirectory: () => ipcRenderer.invoke("getOutputDir"),
// })

const {dialog, ipcMain, ipcRenderer} = require("electron")

window.api = {
    selectInputDirectory: async () => {
        return await ipcRenderer.invoke("selectInputDir")
    },

    selectOutputDirectory: async () => {
        return await ipcRenderer.invoke("selectOutputDir")
    },
    startProcessing: async() => {
        return await ipcRenderer.invoke("startProcessing")
    },
    getOutputDirectory: async() => {
        return await ipcRenderer.invoke("getOutputDir")
    }
}