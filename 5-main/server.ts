import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

function serializeDeterministic(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
      return '[' + obj.map(serializeDeterministic).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const parts = keys.map(k => JSON.stringify(k) + ':' + serializeDeterministic(obj[k]));
  return '{' + parts.join(',') + '}';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API for signing reports
  app.post("/api/reports/sign", (req, res) => {
    const { reportData } = req.body;
    if (!reportData) {
      return res.status(400).json({ error: "reportData is required" });
    }

    const secret = process.env.REPORT_SECRET_KEY || "default_secret_key_change_me";
    const dataString = typeof reportData === "string" ? reportData : serializeDeterministic(reportData);
    const signature = crypto.createHmac("sha256", secret).update(dataString).digest("hex");

    res.json({ signature });
  });

  // API for verifying reports
  app.post("/api/reports/verify", (req, res) => {
    const { reportData, signature } = req.body;
    if (!reportData || !signature) {
      return res.status(400).json({ error: "reportData and signature are required" });
    }

    const secret = process.env.REPORT_SECRET_KEY || "default_secret_key_change_me";
    
    // Method 1: Deterministic serialization (New robust method)
    const dataString1 = typeof reportData === "string" ? reportData : serializeDeterministic(reportData);
    const expectedSignature1 = crypto.createHmac("sha256", secret).update(dataString1).digest("hex");

    // Method 2: Native JSON stringify (Fallback for older reports)
    const dataString2 = typeof reportData === "string" ? reportData : JSON.stringify(reportData);
    const expectedSignature2 = crypto.createHmac("sha256", secret).update(dataString2).digest("hex");

    if (signature === expectedSignature1 || signature === expectedSignature2) {
      res.json({ status: "verified", message: "Report is authentic" });
    } else {
      res.status(401).json({ status: "tampered", message: "Report has been tampered with or signature is invalid" });
    }
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
