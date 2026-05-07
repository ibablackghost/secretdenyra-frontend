import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = join(__dirname, "dist");

// Serve static assets (JS, CSS, images, etc.)
app.use(express.static(distPath));

// SPA fallback — send index.html for any route that isn't a static file,
// so React Router can handle client-side navigation.
app.get("*", (_req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
