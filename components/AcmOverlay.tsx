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
import { calcComparableDerived, calcValorTotal, formatNumber } from "@/lib/calculations";

export interface AcmOverlayProps {
  property: PropertyData;
  comparables: Comparable[];
  customCoefDefs: CustomCoefDef[];
  propertyType: PropertyType;
  surfaceCoefs: SurfaceCoefs;
  supHomInmueble: number;
  vumAverage: number;
  cochera: number;
}

const C = {
  dark: "#253C64", // navy de marca (headers)
  darker: "#1a2847",
  mid: "#475569",
  light: "#94a3b8",
  border: "#cbd5e1",
  bg: "#f4f6f9",
  bg2: "#eef1f6",
  white: "#ffffff",
};

// Página horizontal, mismo tamaño que la plantilla de Giuliano. Fondo transparente.
const PAGE_W = 1440;
const PAGE_H = 810;

const ABBREV: Record<string, string> = {
  "Ubicación": "Ub", "Antigüedad": "An", "Calidad": "Ca",
  "Mantenimiento": "Mn", "Esp. Libre": "EL", "Distribución": "Di",
  "Hum/Seco": "HS", "Comodidad": "Co", "Comodidades": "Co",
  "Lote": "Lo", "Superficie": "Su", "Luminosidad": "Lu", "Linderos": "Li",
  "Ub. Edificio": "UE", "Piso": "Pi", "Ub. En Lote": "UL", "Estado": "Es",
  "Entrada": "En", "Ub. Lote": "UL", "Tipo Lote": "TL",
  "Sup. Cubierta": "SC", "Orientación": "Or", "Vidriera": "Vi",
  "Utilidad": "Ut", "Ub. Cuadra": "UC", "PH": "PH",
};
const abbrev = (label: string) => ABBREV[label] ?? label.substring(0, 2).toUpperCase();

const ColW = (n: number) => ({ width: `${n}%` } as const);

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const s = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
    // sin backgroundColor -> transparente (respeta header/footer del agente)
    paddingTop: 55,
    paddingHorizontal: 70,
    paddingBottom: 95, // banda del footer del agente
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.darker,
  },
  mainTitle: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.darker,
    marginBottom: 18,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  table: { flexDirection: "column", width: "100%", marginBottom: 16 },
  row: { flexDirection: "row" },

  cellHeader: {
    backgroundColor: C.dark,
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRight: `1px solid ${C.white}`,
    borderBottom: `1px solid ${C.white}`,
    textAlign: "center",
  },
  cellSubHeader: {
    backgroundColor: C.darker,
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.white}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
  },
  cellLabel: {
    backgroundColor: C.bg,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
  },
  cellData: {
    fontSize: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
  },
  cellDataAlt: {
    fontSize: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
    backgroundColor: C.bg2,
  },
  calcCell: {
    fontSize: 9,
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
  },
  calcCellAlt: {
    fontSize: 9,
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
    backgroundColor: C.bg2,
  },
  calcCellBold: {
    fontSize: 9,
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.dark },
  precioDeMercado: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.darker },

  infoStrip: {
    flexDirection: "row",
    marginBottom: 14,
    backgroundColor: C.bg,
    padding: 12,
    gap: 20,
  },
  infoItem: { flexDirection: "column", gap: 3, flex: 1 },
  infoLabel: { fontSize: 9, color: C.mid },
  infoValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14, gap: 12 },
  totalBox: { backgroundColor: C.dark, paddingVertical: 12, paddingHorizontal: 18, minWidth: 220, alignItems: "center" },
  totalLabel: { fontSize: 9, color: "#c7d0dd", letterSpacing: 1, marginBottom: 4 },
  totalValue: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white },

  note: { fontSize: 9, color: C.mid, fontStyle: "italic", marginTop: 12 },

  refBlock: { marginTop: 16 },
  refTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    letterSpacing: 1,
    marginBottom: 4,
  },
  refText: { fontSize: 8.5, color: C.mid, lineHeight: 1.4 },
  refBold: { fontFamily: "Helvetica-Bold", color: C.darker },
});

/** Renderiza una leyenda con la abreviatura en negrita: "Ub: Ubicación · ..." */
function Legend({ items }: { items: { abbr: string; label: string }[] }) {
  return (
    <Text style={s.refText}>
      {items.map((it, i) => (
        <Text key={i}>
          <Text style={s.refBold}>{it.abbr}</Text>
          {`: ${it.label}`}
          {i < items.length - 1 ? "   ·   " : ""}
        </Text>
      ))}
    </Text>
  );
}

export function AcmOverlay({
  property,
  comparables,
  customCoefDefs,
  propertyType,
  surfaceCoefs,
  supHomInmueble,
  vumAverage,
  cochera,
}: AcmOverlayProps) {
  const typeLabel = PROPERTY_TYPE_LABELS[propertyType].toUpperCase();
  const valorTotal = calcValorTotal(vumAverage, supHomInmueble, cochera);

  // Anchos ficha
  const fichaSubjectW = 16;
  const fichaCompW =
    comparables.length > 0
      ? (100 - fichaSubjectW * 2) / comparables.length
      : 84 - fichaSubjectW;

  // Anchos tabla de cálculo
  const numCoefs = customCoefDefs.length;
  const coefColW = numCoefs > 0 ? parseFloat(Math.max(2.5, 26 / numCoefs).toFixed(1)) : 0;
  const usedByCoefs = parseFloat((coefColW * numCoefs).toFixed(1));
  const vumColW = 11;
  const w = {
    n: 2.5,
    ubic: 20,
    precio: 9,
    supHom: 6,
    usdM2: 8,
    coef: coefColW,
    oferta: 5,
    total: parseFloat((100 - 2.5 - 20 - 9 - 6 - 8 - usedByCoefs - 5 - vumColW).toFixed(1)),
    vum: vumColW,
  };

  const fichaRows: {
    label: string;
    subject: string;
    getComp: (c: Comparable) => string;
  }[] = [
    { label: "Tipología", subject: PROPERTY_TYPE_LABELS[propertyType], getComp: () => PROPERTY_TYPE_LABELS[propertyType] },
    {
      label: "Sup. Total (m²)",
      subject: formatNumber(property.supCubierta + property.supSemiCubierta + property.supDescubierta + property.supBalcon),
      getComp: (c) => formatNumber(c.supCubierta + c.supSemiCubierta + c.supDescubierta + c.supBalcon),
    },
    { label: "Sup. Cubierta (m²)", subject: formatNumber(property.supCubierta), getComp: (c) => formatNumber(c.supCubierta) },
    { label: "Ambientes", subject: property.ambientes ? String(property.ambientes) : "—", getComp: (c) => (c.ambientes ? String(c.ambientes) : "—") },
    { label: "Dormitorios", subject: property.dormitorios ? String(property.dormitorios) : "—", getComp: (c) => (c.dormitorios ? String(c.dormitorios) : "—") },
    { label: "Baños", subject: property.banos ? String(property.banos) : "—", getComp: (c) => (c.banos ? String(c.banos) : "—") },
    { label: "Toilete", subject: property.toilete ? String(property.toilete) : "—", getComp: (c) => (c.toilete ? String(c.toilete) : "—") },
    { label: "Precio", subject: "—", getComp: (c) => (c.precio ? `USD ${c.precio.toLocaleString("es-AR")}` : "—") },
    { label: "Cochera", subject: "—", getComp: (c) => (c.cochera ? `USD ${c.cochera.toLocaleString("es-AR")}` : "—") },
  ];

  // Leyenda de abreviaturas de los coeficientes + columnas fijas
  const coefItems = customCoefDefs.map((def) => ({ abbr: abbrev(def.label), label: def.label }));
  const fixedItems = [
    { abbr: "S.HOM", label: "Sup. Homogeneizada" },
    { abbr: "$/M²", label: "USD por m²" },
    { abbr: "C.OF.", label: "Coef. de Oferta" },
    { abbr: "C.TOT.", label: "Coef. Total" },
    { abbr: "V.U.M.", label: "Valor Unitario de Mercado" },
  ];

  return (
    <Document>
      {/* ─────────── PÁGINA 7: RESUMEN DE LO ANALIZADO ─────────── */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.mainTitle}>RESUMEN DE LO ANALIZADO</Text>
        <Text style={s.subTitle}>{typeLabel}</Text>

        <View style={s.table}>
          <View style={s.row}>
            <Text style={[s.cellHeader, ColW(fichaSubjectW)]}>Conceptos</Text>
            <Text style={[s.cellHeader, ColW(fichaSubjectW), { backgroundColor: C.darker }]}>
              {(property.address || "Inmueble a analizar").substring(0, 30)}
            </Text>
            {comparables.map((c, idx) => (
              <Text key={c.id} style={[s.cellHeader, ColW(fichaCompW)]}>
                {(c.ubicacion || `Comp. ${idx + 1}`).substring(0, 24)}
              </Text>
            ))}
          </View>
          {fichaRows.map((rowDef, i) => (
            <View key={rowDef.label} style={s.row}>
              <Text style={[s.cellLabel, ColW(fichaSubjectW)]}>{rowDef.label}</Text>
              <Text style={[i % 2 === 0 ? s.cellData : s.cellDataAlt, ColW(fichaSubjectW)]}>
                {rowDef.subject}
              </Text>
              {comparables.map((c) => (
                <Text key={c.id} style={[i % 2 === 0 ? s.cellData : s.cellDataAlt, ColW(fichaCompW)]}>
                  {rowDef.getComp(c)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>

      {/* ─────────── PÁGINA 8: CÁLCULO DEL VALOR VENAL ─────────── */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>CÁLCULO DEL VALOR VENAL O DE MERCADO</Text>
          <Text style={s.precioDeMercado}>PRECIO DE MERCADO</Text>
        </View>

        <View style={s.infoStrip}>
          <View style={[s.infoItem, { flex: 2 }]}>
            <Text style={s.infoLabel}>INMUEBLE VALUADO</Text>
            <Text style={s.infoValue}>{property.address || "—"}</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>SUP. CUBIERTA</Text>
            <Text style={s.infoValue}>{formatNumber(property.supCubierta)} m²</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>SUP. HOMOGENEIZADA</Text>
            <Text style={s.infoValue}>{formatNumber(supHomInmueble)} m²</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>AGENTE</Text>
            <Text style={s.infoValue}>{property.agent || "—"}</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>FECHA</Text>
            <Text style={s.infoValue}>{fmtDate(property.date)}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.row}>
            <Text style={[s.cellHeader, ColW(w.n)]}>N°</Text>
            <Text style={[s.cellHeader, ColW(w.ubic)]}>UBICACIÓN</Text>
            <Text style={[s.cellHeader, ColW(w.precio)]}>PRECIO</Text>
            <Text style={[s.cellHeader, ColW(w.supHom)]}>S.HOM</Text>
            <Text style={[s.cellHeader, ColW(w.usdM2)]}>$/M²</Text>
            {customCoefDefs.map((def) => (
              <Text key={def.id} style={[s.cellSubHeader, ColW(w.coef)]}>{abbrev(def.label)}</Text>
            ))}
            <Text style={[s.cellHeader, ColW(w.oferta)]}>C.OF.</Text>
            <Text style={[s.cellHeader, ColW(w.total)]}>C.TOT.</Text>
            <Text style={[s.cellHeader, ColW(w.vum), { borderRight: "none" }]}>V.U.M. U$S</Text>
          </View>

          {comparables.map((c, i) => {
            const { supHom, valorM2, coefTotal, vum } = calcComparableDerived(c, surfaceCoefs);
            const isValid = c.precio > 0 && supHom > 0;
            const cell = i % 2 === 1 ? s.calcCellAlt : s.calcCell;
            const fmtCoef = (v: number) => (Math.abs(v - 1) < 0.001 ? "1.00" : v.toFixed(2));
            return (
              <View key={c.id} style={s.row}>
                <Text style={[cell, ColW(w.n)]}>{i + 1}</Text>
                <Text style={[cell, ColW(w.ubic), { textAlign: "left", paddingHorizontal: 5 }]}>
                  {c.ubicacion || "—"}
                </Text>
                <Text style={[cell, ColW(w.precio)]}>{c.precio ? `$${c.precio.toLocaleString("es-AR")}` : "—"}</Text>
                <Text style={[cell, ColW(w.supHom)]}>{isValid ? formatNumber(supHom) : "—"}</Text>
                <Text style={[cell, ColW(w.usdM2)]}>{isValid ? `$${formatNumber(valorM2)}` : "—"}</Text>
                {customCoefDefs.map((def) => (
                  <Text key={def.id} style={[cell, ColW(w.coef), { color: C.mid }]}>
                    {fmtCoef(c.customCoefs[def.id] ?? 1)}
                  </Text>
                ))}
                <Text style={[cell, ColW(w.oferta)]}>{fmtCoef(c.coefOferta)}</Text>
                <Text style={[s.calcCellBold, ColW(w.total)]}>{isValid ? formatNumber(coefTotal, 4) : "—"}</Text>
                <Text style={[s.calcCellBold, ColW(w.vum), { borderRight: "none" }]}>{isValid ? `$${formatNumber(vum)}` : "—"}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.totalRow}>
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>M² UNITARIO PROMEDIO</Text>
            <Text style={s.totalValue}>${formatNumber(vumAverage)}</Text>
          </View>
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>VALOR TOTAL</Text>
            <Text style={s.totalValue}>${formatNumber(valorTotal)}</Text>
          </View>
        </View>

        <View style={s.refBlock}>
          <Text style={s.refTitle}>REFERENCIAS</Text>
          {coefItems.length ? <Legend items={coefItems} /> : null}
          <Legend items={fixedItems} />
        </View>

        <Text style={s.note}>
          Los coeficientes de homogeneización representan cómo es el inmueble
          tasado con respecto a cada comparable: =1 equivalente, &gt;1 el tasado
          es superior al comparable, &lt;1 el tasado es inferior al comparable.
        </Text>
      </Page>
    </Document>
  );
}
