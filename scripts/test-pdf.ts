/**
 * Calls /api/pdf with sample data, saves the result, then screenshots each page.
 * Run: npx tsx scripts/test-pdf.ts
 */
import fs from "fs";
import path from "path";
import http from "http";
import { chromium } from "@playwright/test";

const OUT_DIR = path.resolve(process.cwd(), "scripts/test-pdf-screenshots");
const PDF_OUT = path.resolve(process.cwd(), "scripts/test-output.pdf");
const HTML_PATH = path.resolve(process.cwd(), "scripts/pdf-viewer.html");

// ── Sample data matching TasacionPDFProps ──────────────────────────────────
const payload = {
  property: {
    address: "Av. Maipu 2054, Piso 1 Depto 8",
    agent: "Federico Del Percio",
    date: "2026-04-27",
    link: "",
    supCubierta: 53,
    supSemiCubierta: 0,
    supDescubierta: 0,
    supBalcon: 0,
    ambientes: 2,
    dormitorios: 1,
    banos: 1,
    precio: 0,
    cochera: 0,
    surfaceCoefs: { cubierta: 1, semicubierta: 0.5, descubierta: 0.2, balcon: 0.33 },
  },
  propertyType: "departamento",
  comparables: [
    {
      id: "1", ubicacion: "Avenida Maipu 2060 Piso 3 Dpto C", link: "",
      supTotal: 63, supCubierta: 63, ambientes: 3, dormitorios: 2, banos: 1,
      precio: 89000, cochera: 0, coefOferta: 0.9,
      customCoefs: { dep_0: 1, dep_1: 1.05, dep_2: 1, dep_3: 1, dep_4: 1, dep_5: 1, dep_6: 1, dep_7: 1, dep_8: 1, dep_9: 0.95 },
      showCoefs: false,
    },
    {
      id: "2", ubicacion: "Fernán Félix de Amador 1359 Piso 1", link: "",
      supTotal: 51, supCubierta: 48.04, ambientes: 2, dormitorios: 1, banos: 1,
      precio: 82000, cochera: 0, coefOferta: 0.9,
      customCoefs: { dep_0: 1, dep_1: 1, dep_2: 1, dep_3: 1, dep_4: 1, dep_5: 1, dep_6: 1, dep_7: 1, dep_8: 1.05, dep_9: 1 },
      showCoefs: false,
    },
    {
      id: "3", ubicacion: "Hilarión de la Quintana 2448 Piso PB", link: "",
      supTotal: 56, supCubierta: 50.82, ambientes: 2, dormitorios: 1, banos: 1,
      precio: 110000, cochera: 0, coefOferta: 0.9,
      customCoefs: { dep_0: 0.95, dep_1: 0.95, dep_2: 1, dep_3: 1, dep_4: 1, dep_5: 1, dep_6: 1, dep_7: 1, dep_8: 0.9, dep_9: 1.05 },
      showCoefs: false,
    },
  ],
  customCoefDefs: [
    { id: "dep_0", label: "Ubicación" }, { id: "dep_1", label: "Antigüedad" },
    { id: "dep_2", label: "Calidad" }, { id: "dep_3", label: "Mantenimiento" },
    { id: "dep_4", label: "Ub. Edificio" }, { id: "dep_5", label: "Distribución" },
    { id: "dep_6", label: "Hum/Seco" }, { id: "dep_7", label: "Comodidades" },
    { id: "dep_8", label: "Piso" }, { id: "dep_9", label: "Superficie" },
  ],
  supHomInmueble: 53,
  vumAverage: 1500,
  cochera: 0,
};

// ── Call the API ───────────────────────────────────────────────────────────
async function generatePDF(): Promise<Buffer> {
  const res = await fetch("http://localhost:3000/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API returned ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Screenshot helper (same as screenshot-pdf.ts) ─────────────────────────
function startServer(pdfPath: string): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/pdf") {
        res.writeHead(200, { "Content-Type": "application/pdf" });
        fs.createReadStream(pdfPath).pipe(res);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(HTML_PATH).pipe(res);
      }
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: (server.address() as { port: number }).port });
    });
  });
}

async function screenshotPDF(pdfPath: string, outDir: string) {
  fs.mkdirSync(outDir, { recursive: true });
  const { server, port } = await startServer(pdfPath);
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.title.endsWith(":done"), { timeout: 30000 });
  const count = parseInt(page.title ? (await page.title()).split(":")[1] : "1");
  console.log(`  ${count} pages rendered`);
  for (let i = 1; i <= count; i++) {
    const outPath = path.join(outDir, `page-${String(i).padStart(2, "0")}.png`);
    await page.locator(`#page-${i}`).screenshot({ path: outPath });
    console.log(`  → ${outPath}`);
  }
  await browser.close();
  server.close();
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("Calling /api/pdf...");
  const pdfBytes = await generatePDF();
  fs.writeFileSync(PDF_OUT, pdfBytes);
  console.log(`PDF saved (${pdfBytes.length} bytes) → ${PDF_OUT}`);

  console.log("Screenshotting pages...");
  await screenshotPDF(PDF_OUT, OUT_DIR);
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
