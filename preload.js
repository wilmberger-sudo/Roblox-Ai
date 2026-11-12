const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("meineAI", {
  check: endpoint => ipcRenderer.invoke("ollama:check", endpoint),
  chat: data => ipcRenderer.invoke("ollama:chat", data),
  save: data => ipcRenderer.invoke("file:save", data)
});