// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  loadTasks: () => ipcRenderer.invoke("load-tasks"),
  saveTasks: (tasks) => ipcRenderer.send("save-tasks", tasks),
});
