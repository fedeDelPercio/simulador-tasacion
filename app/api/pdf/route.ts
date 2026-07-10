import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AcmOverlay } from "@/components/AcmOverlay";
import type { AcmOverlayProps } from "@/components/AcmOverlay";
import { getAgent, getAgentByName } from "@/lib/agents";
import type { Box } from "@/lib/agents";
import type { Comparable, CustomCoefDef, PropertyData, PropertyType } from "@/lib/types";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

interface PdfRequest {
  property: PropertyData;
  comparables: Comparable[];
  customCoefDefs: CustomCoefDef[];
  propertyType: PropertyType;
  supHomInmueble: number;
  vumAverage: number;
  cochera: number;
  agentId?: string;
}

const WHITE = rgb(1, 1, 1);

/** Dibuja texto blanco centrado dentro de un recuadro, ajustando el tamaño al ancho. */
function drawCenteredText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  box: Box,
  maxSize: number
) {
  let size = maxSize;
  while (font.widthOfTextAtSize(text, size) > box.width - 40 && size > 12) {
    size -= 2;
  }
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: box.x + (box.width - textWidth) / 2,
    y: box.y + (box.height - size) / 2 + size * 0.15,
    size,
    font,
    color: WHITE,
  });
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const b64 = dataUrl.slice(comma + 1);
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

export async function POST(req: Request) {
  const data: PdfRequest = await req.json();
  // La plantilla se elige por el campo "Agente"; si no coincide, cae al default.
  let agent = data.agentId ? getAgent(data.agentId) : getAgentByName(data.property?.agent);

  // Protección: si el PDF del agente todavía no está cargado, usar el default.
  let tplPath = path.join(process.cwd(), "plantillas-acm", agent.template);
  if (!fs.existsSync(tplPath)) {
    agent = getAgent(undefined);
    tplPath = path.join(process.cwd(), "plantillas-acm", agent.template);
  }
  const layout = agent.layout;

  const tplBytes = fs.readFileSync(tplPath);
  const doc = await PDFDocument.load(tplBytes);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  // ── Overlay de tablas (react-pdf) sobre las páginas de cuadros ────────────
  const overlayProps: AcmOverlayProps = {
    property: data.property,
    comparables: data.comparables,
    customCoefDefs: data.customCoefDefs,
    propertyType: data.propertyType,
    surfaceCoefs: data.property.surfaceCoefs,
    supHomInmueble: data.supHomInmueble,
    vumAverage: data.vumAverage,
    cochera: data.cochera,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayBuffer = await renderToBuffer(React.createElement(AcmOverlay, overlayProps) as any);
  const overlayDoc = await PDFDocument.load(overlayBuffer);
  const [ovComparativo, ovCoeficientes] = await doc.embedPdf(overlayDoc, [0, 1]);

  pages[layout.comparativoPageIndex].drawPage(ovComparativo, {
    x: 0, y: 0, width: layout.pageW, height: layout.pageH,
  });
  pages[layout.coeficientesPageIndex].drawPage(ovCoeficientes, {
    x: 0, y: 0, width: layout.pageW, height: layout.pageH,
  });

  // ── Dirección en el recuadro de la portada (si el layout lo define) ───────
  if (layout.addressBox) {
    const addr = data.property?.address || "";
    if (addr) {
      drawCenteredText(pages[layout.addressBox.pageIndex], boldFont, addr, layout.addressBox, 32);
    }
  }

  // ── Foto del inmueble (si el layout lo define y hay foto) ─────────────────
  if (layout.photoBox && data.property?.photo) {
    const bytes = dataUrlToBytes(data.property.photo);
    if (bytes) {
      try {
        const img = data.property.photo.includes("image/png")
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const box = layout.photoBox;
        // encajar preservando proporción, centrado
        const scale = Math.min(box.width / img.width, box.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        pages[box.pageIndex].drawImage(img, {
          x: box.x + (box.width - w) / 2,
          y: box.y + (box.height - h) / 2,
          width: w,
          height: h,
        });
      } catch {
        // si la imagen no se puede embeber, se omite
      }
    }
  }

  // ── Precio de comercialización en el recuadro navy ────────────────────────
  const total = Math.round(
    (data.vumAverage ?? 0) * (data.supHomInmueble ?? 0) + (data.cochera ?? 0)
  );
  const priceText = `USD ${total.toLocaleString("es-AR")}`;
  drawCenteredText(pages[layout.priceBox.pageIndex], boldFont, priceText, layout.priceBox, 60);

  // ── Serializar y devolver ─────────────────────────────────────────────────
  const finalBytes = await doc.save();
  const slug = (data.property?.address || "tasacion").replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(finalBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="acm-${slug}.pdf"`,
    },
  });
}
