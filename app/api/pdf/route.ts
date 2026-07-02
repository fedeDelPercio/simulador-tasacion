import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AcmOverlay } from "@/components/AcmOverlay";
import type { AcmOverlayProps } from "@/components/AcmOverlay";
import { getAgent, ACM_LAYOUT } from "@/lib/agents";
import type { Comparable, CustomCoefDef, PropertyData, PropertyType } from "@/lib/types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

export async function POST(req: Request) {
  const data: PdfRequest = await req.json();
  const agent = getAgent(data.agentId);

  // ── 1. Cargar la plantilla del agente ─────────────────────────────────────
  const tplPath = path.join(process.cwd(), "plantillas-acm", agent.template);
  const tplBytes = fs.readFileSync(tplPath);
  const doc = await PDFDocument.load(tplBytes);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── 2. Generar overlay (tablas) con react-pdf ─────────────────────────────
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

  // ── 3. Estampar las tablas sobre las páginas 7 y 8 ────────────────────────
  const pages = doc.getPages();
  const pComparativo = pages[ACM_LAYOUT.comparativoPageIndex];
  pComparativo.drawPage(ovComparativo, {
    x: 0,
    y: 0,
    width: ACM_LAYOUT.pageW,
    height: ACM_LAYOUT.pageH,
  });

  const pCoef = pages[ACM_LAYOUT.coeficientesPageIndex];
  pCoef.drawPage(ovCoeficientes, {
    x: 0,
    y: 0,
    width: ACM_LAYOUT.pageW,
    height: ACM_LAYOUT.pageH,
  });

  // ── 4. Estampar el precio en el recuadro navy de la página 9 ──────────────
  const total = Math.round(
    (data.vumAverage ?? 0) * (data.supHomInmueble ?? 0) + (data.cochera ?? 0)
  );
  const priceText = `USD ${total.toLocaleString("es-AR")}`;
  const box = ACM_LAYOUT.precioBox;

  // Ajustar el tamaño para que entre en el ancho del recuadro
  let priceSize = 60;
  while (
    boldFont.widthOfTextAtSize(priceText, priceSize) > box.width - 60 &&
    priceSize > 20
  ) {
    priceSize -= 2;
  }
  const priceWidth = boldFont.widthOfTextAtSize(priceText, priceSize);
  const pPrecio = pages[ACM_LAYOUT.precioPageIndex];
  pPrecio.drawText(priceText, {
    x: box.x + (box.width - priceWidth) / 2,
    y: box.y + (box.height - priceSize) / 2 + priceSize * 0.15,
    size: priceSize,
    font: boldFont,
    color: WHITE,
  });

  // ── 5. Serializar y devolver ──────────────────────────────────────────────
  const finalBytes = await doc.save();
  const slug =
    (data.property?.address || "tasacion").replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(finalBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="acm-${slug}.pdf"`,
    },
  });
}
