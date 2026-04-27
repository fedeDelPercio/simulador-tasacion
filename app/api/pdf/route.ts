import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { TasacionPDF } from "@/components/TasacionPDF";
import type { TasacionPDFProps } from "@/components/TasacionPDF";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const GRAY_BG = rgb(0.706, 0.686, 0.663);
const TEXT_DARK = rgb(0.12, 0.12, 0.12);

function splitAddress(addr: string, maxChars = 26): [string, string] {
  if (addr.length <= maxChars) return [addr, ""];
  const comma = addr.lastIndexOf(",", maxChars);
  if (comma > 4) return [addr.slice(0, comma).trim(), addr.slice(comma + 1).trim()];
  const space = addr.lastIndexOf(" ", maxChars);
  if (space > 0) return [addr.slice(0, space).trim(), addr.slice(space + 1).trim()];
  return [addr.slice(0, maxChars), addr.slice(maxChars)];
}

export async function POST(req: Request) {
  const data: TasacionPDFProps = await req.json();

  // ── 1. Load reference PDF ─────────────────────────────────────────────────
  const refPath = path.join(process.cwd(), "Ejemplo PDF ACM.pdf");
  const refBytes = fs.readFileSync(refPath);
  const refDoc = await PDFDocument.load(refBytes);

  // ── 2. Generate tables page (react-pdf) ───────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tablesBuffer = await renderToBuffer(React.createElement(TasacionPDF, data) as any);
  const tablesDoc = await PDFDocument.load(tablesBuffer);

  // ── 3. Create final document ──────────────────────────────────────────────
  const final = await PDFDocument.create();
  const boldFont = await final.embedFont(StandardFonts.HelveticaBold);

  // Embed pages 2 and 9 as XObjects so our overlays render above all their content
  const [embP2, embP9] = await final.embedPdf(refDoc, [1, 8]);

  async function copyRef(indices: number[]) {
    return final.copyPages(refDoc, indices);
  }

  // ── Page 1: cover (original) ──────────────────────────────────────────────
  const [cover] = await copyRef([0]);
  final.addPage(cover);

  // ── Page 2: reference page as background + dynamic address overlay ─────────
  const agentPage = final.addPage([810, 1440]);
  agentPage.drawPage(embP2, { x: 0, y: 0, width: 810, height: 1440 });

  const address = data.property?.address ?? "";
  const [line1, line2] = splitAddress(address, 26);
  const fontSize = 56;
  const lineGap = fontSize * 1.15;

  // Calibrated: cover address area (y=940–1195) without touching the logo above
  agentPage.drawRectangle({ x: 16, y: 940, width: 778, height: 255, color: GRAY_BG });

  if (line2) {
    agentPage.drawText(line1, { x: 36, y: 1145, size: fontSize, font: boldFont, color: TEXT_DARK });
    agentPage.drawText(line2, { x: 36, y: 1145 - lineGap, size: fontSize, font: boldFont, color: TEXT_DARK });
  } else {
    agentPage.drawText(line1, { x: 36, y: 1060, size: fontSize, font: boldFont, color: TEXT_DARK });
  }

  // ── Pages 3–6: original ───────────────────────────────────────────────────
  const pages3to6 = await copyRef([2, 3, 4, 5]);
  pages3to6.forEach((p) => final.addPage(p));

  // ── Page 7: our tables (react-pdf generated) ──────────────────────────────
  const [tablesPage] = await final.copyPages(tablesDoc, [0]);
  final.addPage(tablesPage);

  // ── Page 8: "por qué el valor sugerido" ──────────────────────────────────
  const [whyPage] = await copyRef([7]);
  final.addPage(whyPage);

  // ── Page 9: reference page as background + dynamic price overlay ──────────
  const valuePage = final.addPage([810, 1440]);
  valuePage.drawPage(embP9, { x: 0, y: 0, width: 810, height: 1440 });

  const totalValue = Math.round(
    (data.vumAverage ?? 0) * (data.supHomInmueble ?? 0) + (data.cochera ?? 0)
  );
  const priceText = `USD ${totalValue.toLocaleString("es-AR")}`;

  // Celeste rectangle (pixel-sampled from reference): x=186, y=730, w=485, h=78
  const CELESTE = rgb(0.925, 0.953, 0.988);
  const boxX = 186, boxY = 700, boxW = 485, boxH = 110;
  valuePage.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, color: CELESTE });

  const priceSize = 36;
  const priceTextWidth = boldFont.widthOfTextAtSize(priceText, priceSize);
  valuePage.drawText(priceText, {
    x: boxX + (boxW - priceTextWidth) / 2,
    y: boxY + (boxH - priceSize) / 2 + 4,
    size: priceSize,
    font: boldFont,
    color: TEXT_DARK,
  });

  // ── Pages 10–12: original ─────────────────────────────────────────────────
  const pages10to12 = await copyRef([9, 10, 11]);
  pages10to12.forEach((p) => final.addPage(p));

  // ── Serialize and return ──────────────────────────────────────────────────
  const finalBytes = await final.save();
  const slug = address.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "tasacion";

  return new Response(finalBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tasacion-${slug}.pdf"`,
    },
  });
}
