const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

function createWindow() {
  const win = new BrowserWindow({
    width: 1380, height: 900, minWidth: 960, minHeight: 650,
    backgroundColor: "#090e19", title: "Meine AI",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile("index.html");
}

function ollamaUrl(endpoint, route) {
  const url = new URL(endpoint || "http://127.0.0.1:11434");
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Nur lokale Ollama-Adressen (localhost / 127.0.0.1) sind erlaubt.");
  }
  url.pathname = route;
  url.search = "";
  return url.toString();
}

ipcMain.handle("ollama:check", async (_e, endpoint) => {
  const response = await fetch(ollamaUrl(endpoint, "/api/tags"), { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Ollama antwortet mit HTTP " + response.status);
  const data = await response.json();
  return (data.models || []).map(model => model.name);
});

ipcMain.handle("ollama:chat", async (_e, data) => {
  if (!data || typeof data.model !== "string" || !Array.isArray(data.messages) || data.messages.length > 25) throw new Error("Ungültige Chat-Anfrage.");
  const messages = data.messages.map(m => {
    if (!["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string") throw new Error("Ungültige Nachricht.");
    return { role: m.role, content: m.content.slice(0, 24000) };
  });
  const response = await fetch(ollamaUrl(data.endpoint, "/api/chat"), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: data.model, messages, stream: false, options: { temperature: 0.25 } }),
    signal: AbortSignal.timeout(180000)
  });
  if (!response.ok) throw new Error("Ollama-Fehler " + response.status + ": " + (await response.text()).slice(0, 250));
  const result = await response.json();
  if (!result.message?.content) throw new Error("Das Modell hat keine Antwort geliefert.");
  return result.message.content;
});

ipcMain.handle("file:save", async (_e, data) => {
  if (typeof data.code !== "string" || data.code.length > 2000000) throw new Error("Ungültiger oder zu großer Code.");
  const ext = ({lua:"lua",luau:"lua",javascript:"js",js:"js",typescript:"ts",ts:"ts",python:"py",py:"py",html:"html",css:"css",json:"json",powershell:"ps1"})[String(data.language).toLowerCase()] || "txt";
  const result = await dialog.showSaveDialog({ defaultPath: "MeineAI-Script." + ext, filters: [{name: ext.toUpperCase(), extensions:[ext]}, {name:"Alle Dateien",extensions:["*"]}] });
  if (result.canceled || !result.filePath) return false;
  await fs.writeFile(result.filePath, data.code, "utf8");
  return true;
});

app.whenReady().then(() => { createWindow(); app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });