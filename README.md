# Meine AI

Eine Windows-Desktop-App für lokale KI-gestützte Programmierhilfe mit Ollama.

## Funktionen
- Chat mit lokalem Ollama-Modell (Standard: `qwen2.5-coder:7b`)
- Vollständige Codeblöcke mit Kopieren- und Datei-speichern-Funktion
- Unterstützung beim Erstellen von Roblox-Luau-Scripts, Webseiten und Apps
- Lernzentrum mit nachvollziehbaren Feedback-Fortschrittswerten
- Eigene Lernschwerpunkte und lokal gespeicherte Lernnotizen

## Windows-Build
GitHub Actions erstellt bei jedem Push einen Windows-Installer (`.exe`) und ein ZIP-Paket. Öffne nach dem Build den Tab **Actions**, wähle den neuesten erfolgreichen Workflow und lade das Artefakt **Meine-AI-Windows** herunter.

## Voraussetzung auf dem PC
Installiere Ollama von https://ollama.com/download und lade das Modell herunter:

```powershell
ollama pull qwen2.5-coder:7b
```

Ollama muss während der Nutzung laufen. Die App kommuniziert nur mit Ollama auf `localhost`. Sie führt generierten Code nicht automatisch aus.

## Lernstatus
Die Prozentwerte sind ein internes Feedback-/Übungsprofil und keine objektive Messung von Intelligenz. Gespeicherte Notizen werden als Kontext an spätere Chats angehängt; das trainiert nicht automatisch die Gewichte des KI-Modells.
