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

  // Proxy endpoint to Jarifast API
  app.post("/api/proxy/scrape", async (req, res) => {
    console.log("Proxy Request:", req.body);
    try {
      const response = await fetch("https://api.jarifast.com.br/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Proxy Upstream Error (${response.status}):`, errorText);
        return res.status(response.status).send(errorText);
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        console.error("Proxy Upstream Non-JSON Response:", text);
        res.status(502).json({ error: "Upstream returned non-JSON response", details: text.slice(0, 200) });
      }
    } catch (error: any) {
      console.error("Proxy Exception:", error);
      res.status(500).json({ error: error.message });
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
