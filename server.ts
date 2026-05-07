import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory state for the KVM connection
  let kvmState = {
    status: "disconnected",
    mode: "client",
    targetIp: "",
    lastEvent: "System initialized",
  };

  // API Routes
  app.get("/api/status", (req, res) => {
    res.json(kvmState);
  });

  app.post("/api/connect", (req, res) => {
    const { ip, mode, position, clipboardSync } = req.body;
    
    // Additional parameters for KVM seamless behavior
    const modeStr = mode === 'server' ? `Listening for clients bounding ${position}` : `Connecting to server as target`;
    const clipStr = clipboardSync ? ` (Clipboard sync enabled)` : ` (Clipboard sync disabled)`;

    kvmState = {
      ...kvmState,
      status: "connected",
      mode: mode,
      targetIp: ip,
      lastEvent: `${modeStr} ${clipStr}`,
    };
    console.log(`[KVM] ${kvmState.lastEvent}`);
    res.json(kvmState);
  });

  app.post("/api/disconnect", (req, res) => {
    kvmState = {
      ...kvmState,
      status: "disconnected",
      targetIp: "",
      lastEvent: "Connection terminated by user",
    };
    console.log(`[KVM] ${kvmState.lastEvent}`);
    res.json(kvmState);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KVM Express Server running on http://localhost:${PORT}`);
  });
}

startServer();
