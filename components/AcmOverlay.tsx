import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  Comparable,
  CustomCoefDef,
  PropertyData,
  PropertyType,
  SurfaceCoefs,
} from "@/lib/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/types";
import { calcComparableDerived, formatNumber } from "@/lib/calculations";

export interface AcmOverlayProps {
  property: PropertyData;
  comparables: Comparable[];
  customCoefDefs: CustomCoefDef[];
  propertyType: PropertyType;
  surfaceCoefs: SurfaceCoefs;
  vumAverage: number;
}

const NAVY = "#253C64";
const NAVY_DARK = "#1a2847";
const BORDER = "#d0d5dd";
const TEXT = "#1a2847";
const MUTED = "#4b5563";

// Página horizontal, mismo tamaño que la plantilla. Fondo transparente:
// se dibuja encima del PDF del agente respetando su header/footer.
const PAGE_W = 1440;
const PAGE_H = 810;

const s = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
    // sin backgroundColor -> transparente
    paddingTop: 70,
    paddingHorizontal: 70,
    paddingBottom: 90, // deja libre la banda del footer del agente
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    marginBottom: 22,
  },
  table: { width: "100%", borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` },
  row: { flexDirection: "row" },
  headRow: { backgroundColor: NAVY },
  cell: {
    borderRight: `1px solid ${BORDER}`,
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  headCell: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  subjectRow: { backgroundColor: "#eef1f6" },
  avgRow: { backgroundColor: NAVY_DARK },
  avgText: { color: "#ffffff", fontFamily: "Helvetica-Bold" },
  cellText: { fontSize: 10 },
  cellTextBold: { fontSize: 10, fontFamily: "Helvetica-Bold" },
});

function Cell({
  children,
  width,
  align = "left",
  head = false,
  bold = false,
  color,
}: {
  children: React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  head?: boolean;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={[s.cell, { width: `${width}%` }]}>
      <Text
        style={[
          head ? s.headCell : bold ? s.cellTextBold : s.cellText,
          { textAlign: align },
          color ? { color } : {},
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function AcmOverlay({
  property,
  comparables,
  customCoefDefs,
  propertyType,
  surfaceCoefs,
  vumAverage,
}: AcmOverlayProps) {
  const derived = comparables.map((c) => ({
    c,
    d: calcComparableDerived(c, surfaceCoefs),
  }));
  const valid = derived.filter((x) => x.c.precio > 0 && x.d.supHom > 0);

  const subjectSupTotal =
    property.supCubierta +
    property.supSemiCubierta +
    property.supDescubierta +
    property.supBalcon;

  // ── Página 1: Cuadro comparativo ──
  // Columnas: Dirección | Amb | Sup.Total | Precio | Sup.Hom | USD/m² | Coef | VUM
  const cw = { dir: 26, amb: 8, sup: 12, precio: 14, hom: 12, m2: 10, coef: 8, vum: 10 };

  // ── Página 2: Coeficientes ──
  // Columnas: Comparable | (cada coef) | Oferta | Total
  const coefLabelW = 16;
  const coefCols = customCoefDefs.length + 2; // + Oferta + Total
  const coefColW = (100 - coefLabelW) / coefCols;

  return (
    <Document>
      {/* ─────────── PÁGINA 7: CUADRO COMPARATIVO ─────────── */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.title}>CUADRO COMPARATIVO DE MERCADO</Text>
        <Text style={s.subtitle}>{PROPERTY_TYPE_LABELS[propertyType]}</Text>

        <View style={s.table}>
          {/* Header */}
          <View style={[s.row, s.headRow]}>
            <Cell width={cw.dir} head>Dirección</Cell>
            <Cell width={cw.amb} head align="center">Amb.</Cell>
            <Cell width={cw.sup} head align="right">Sup. Total</Cell>
            <Cell width={cw.precio} head align="right">Precio USD</Cell>
            <Cell width={cw.hom} head align="right">Sup. Hom.</Cell>
            <Cell width={cw.m2} head align="right">USD/m²</Cell>
            <Cell width={cw.coef} head align="center">Coef.</Cell>
            <Cell width={cw.vum} head align="right">VUM</Cell>
          </View>

          {/* Fila del inmueble a analizar */}
          <View style={[s.row, s.subjectRow]}>
            <Cell width={cw.dir} bold>
              {property.address || "Inmueble a analizar"}
            </Cell>
            <Cell width={cw.amb} align="center">{property.ambientes || "—"}</Cell>
            <Cell width={cw.sup} align="right">{formatNumber(subjectSupTotal)} m²</Cell>
            <Cell width={cw.precio} align="right">—</Cell>
            <Cell width={cw.hom} align="right">—</Cell>
            <Cell width={cw.m2} align="right">—</Cell>
            <Cell width={cw.coef} align="center">—</Cell>
            <Cell width={cw.vum} align="right">—</Cell>
          </View>

          {/* Comparables */}
          {valid.map(({ c, d }, i) => {
            const supTotal =
              c.supCubierta + c.supSemiCubierta + c.supDescubierta + c.supBalcon;
            return (
              <View style={s.row} key={c.id}>
                <Cell width={cw.dir}>{c.ubicacion || `Comparable ${i + 1}`}</Cell>
                <Cell width={cw.amb} align="center">{c.ambientes || "—"}</Cell>
                <Cell width={cw.sup} align="right">{formatNumber(supTotal)} m²</Cell>
                <Cell width={cw.precio} align="right">${c.precio.toLocaleString("es-AR")}</Cell>
                <Cell width={cw.hom} align="right">{formatNumber(d.supHom)} m²</Cell>
                <Cell width={cw.m2} align="right">${formatNumber(d.valorM2, 0)}</Cell>
                <Cell width={cw.coef} align="center">{formatNumber(d.coefTotal, 3)}</Cell>
                <Cell width={cw.vum} align="right">${formatNumber(d.vum, 0)}</Cell>
              </View>
            );
          })}

          {/* Fila VUM Promedio */}
          <View style={[s.row, s.avgRow]}>
            <Cell width={cw.dir + cw.amb + cw.sup + cw.precio + cw.hom + cw.m2 + cw.coef} align="right" color="#ffffff" bold>
              V.U.M. PROMEDIO
            </Cell>
            <Cell width={cw.vum} align="right" color="#ffffff" bold>
              ${formatNumber(vumAverage, 0)}
            </Cell>
          </View>
        </View>
      </Page>

      {/* ─────────── PÁGINA 8: COEFICIENTES DE HOMOGENEIZACIÓN ─────────── */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.title}>COEFICIENTES DE HOMOGENEIZACIÓN</Text>
        <Text style={s.subtitle}>Ajustes aplicados a cada comparable</Text>

        <View style={s.table}>
          {/* Header */}
          <View style={[s.row, s.headRow]}>
            <Cell width={coefLabelW} head>Comparable</Cell>
            {customCoefDefs.map((def) => (
              <Cell key={def.id} width={coefColW} head align="center">
                {def.label}
              </Cell>
            ))}
            <Cell width={coefColW} head align="center">Oferta</Cell>
            <Cell width={coefColW} head align="center">Total</Cell>
          </View>

          {/* Filas por comparable */}
          {valid.map(({ c, d }, i) => (
            <View style={s.row} key={c.id}>
              <Cell width={coefLabelW} bold>{c.ubicacion || `Comparable ${i + 1}`}</Cell>
              {customCoefDefs.map((def) => (
                <Cell key={def.id} width={coefColW} align="center">
                  {formatNumber(c.customCoefs[def.id] ?? 1, 2)}
                </Cell>
              ))}
              <Cell width={coefColW} align="center">{formatNumber(c.coefOferta, 2)}</Cell>
              <Cell width={coefColW} align="center" bold>{formatNumber(d.coefTotal, 3)}</Cell>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
