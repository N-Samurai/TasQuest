// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  loadTasks: () => ipcRenderer.invoke("load-tasks"),
  saveTasks: (data) => ipcRenderer.send("save-tasks", data),
});
