import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import http from "http";

const PDF_PATH = path.resolve(process.cwd(), "Ejemplo PDF ACM.pdf");
const HTML_PATH = path.resolve(process.cwd(), "scripts/pdf-viewer.html");
const OUT_DIR = path.resolve(process.cwd(), "scripts/pdf-screenshots");

function startServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/pdf") {
        res.writeHead(200, { "Content-Type": "application/pdf" });
        fs.createReadStream(PDF_PATH).pipe(res);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(HTML_PATH).pipe(res);
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as { port: number }).port;
      resolve({ server, port });
    });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Serving viewer at ${url}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait until all canvases are rendered
  console.log("Waiting for PDF to render...");
  await page.waitForFunction(
    () => document.title.startsWith("PDF:") && document.title.endsWith(":done"),
    { timeout: 30000 }
  );

  // Extract page count from title  "PDF:N:done"
  const title = await page.title();
  const pageCount = parseInt(title.split(":")[1]) || 1;
  console.log(`Rendered ${pageCount} page(s)`);

  // Screenshot each canvas individually
  for (let i = 1; i <= pageCount; i++) {
    const canvas = page.locator(`#page-${i}`);
    const outPath = path.join(OUT_DIR, `page-${String(i).padStart(2, "0")}.png`);
    await canvas.screenshot({ path: outPath });
    console.log(`  Saved page ${i} → ${outPath}`);
  }

  await browser.close();
  server.close();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
