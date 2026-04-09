import { Router } from "express";
import https from "https";

const router = Router();

router.get("/screenshot", (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: "url query param required" });
    return;
  }

  const rawDelay = parseInt((req.query.delay as string) || "0", 10);
  const delayMs = Number.isNaN(rawDelay) ? 0 : Math.min(Math.max(rawDelay, 0), 15) * 1000;

  let targetUrl: string;
  try {
    const cleanUrl = decodeURIComponent(url);
    const delaySegment = delayMs > 0 ? `delay/${delayMs}/` : "";
    targetUrl = `https://image.thum.io/get/width/1400/crop/900/noanimate/${delaySegment}${cleanUrl}`;
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const timeoutMs = 20000 + delayMs;

  const request = https.get(targetUrl, (response) => {
    if (response.statusCode && response.statusCode >= 400) {
      res.status(502).json({ error: "Screenshot service failed" });
      return;
    }
    res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    response.pipe(res);
  });

  request.on("error", (err) => {
    res.status(500).json({ error: err.message });
  });

  request.setTimeout(timeoutMs, () => {
    request.destroy();
    res.status(504).json({ error: "Screenshot timed out" });
  });
});

export default router;
