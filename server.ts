import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/route", async (req, res) => {
    try {
      const { start_lng, start_lat, end_lng, end_lat } = req.query;
      const apiKey = process.env.ORS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "ORS_API_KEY is not configured" });
      }

      if (!start_lng || !start_lat || !end_lng || !end_lat) {
        return res.status(400).json({ error: "Missing coordinates" });
      }

      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start_lng},${start_lat}&end=${end_lng},${end_lat}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching route from ORS:", error);
      res.status(500).json({ error: "Failed to fetch route" });
    }
  });

  app.get("/api/geocode", async (req, res) => {
    try {
      const { text } = req.query;
      const apiKey = process.env.ORS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "ORS_API_KEY is not configured" });
      }

      if (!text) {
        return res.status(400).json({ error: "Missing text parameter" });
      }

      const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(text as string)}&size=1`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching geocode from ORS:", error);
      res.status(500).json({ error: "Failed to fetch geocode" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
