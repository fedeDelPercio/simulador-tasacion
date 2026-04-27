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

export interface TasacionPDFProps {
  property: PropertyData;
  comparables: Comparable[];
  customCoefDefs: CustomCoefDef[];
  propertyType: PropertyType;
  supHomInmueble: number;
  vumAverage: number;
  cochera: number;
}

const C = {
  dark: "#1e293b",
  mid: "#475569",
  light: "#94a3b8",
  border: "#cbd5e1",
  bg: "#f8fafc",
  bg2: "#f1f5f9",
  white: "#ffffff",
  blue: "#1e3a8a",
};

// Page size matching the reference PDF (810 × 1440 pt)
const PAGE_W = 810;
const PAGE_H = 1440;

const s = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
    backgroundColor: C.white,
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: C.dark,
  },

  mainTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.blue,
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  table: { flexDirection: "column", width: "100%", marginBottom: 20 },
  row: { flexDirection: "row" },

  cellHeader: {
    backgroundColor: C.dark,
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRight: `1px solid ${C.white}`,
    borderBottom: `1px solid ${C.white}`,
    textAlign: "center",
  },
  cellSubHeader: {
    backgroundColor: "#334155",
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.white}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
  },
  cellLabel: {
    backgroundColor: C.bg,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
  },
  cellData: {
    fontSize: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
  },
  cellDataAlt: {
    fontSize: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
    backgroundColor: C.bg2,
  },
  calcCell: {
    fontSize: 7,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
  },
  calcCellAlt: {
    fontSize: 7,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center",
    backgroundColor: C.bg2,
  },
  calcCellBold: {
    fontSize: 7,
    paddingVertical: 4,
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
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.dark },
  precioDeMercado: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.dark },

  infoStrip: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: C.bg,
    padding: 8,
    gap: 16,
  },
  infoItem: { flexDirection: "column", gap: 3, flex: 1 },
  infoLabel: { fontSize: 7, color: C.light },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  totalBox: { backgroundColor: C.dark, padding: 10, minWidth: 150, alignItems: "center" },
  totalLabel: { fontSize: 7, color: C.light, letterSpacing: 1, marginBottom: 3 },
  totalValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.white },

  note: { fontSize: 7.5, color: C.light, fontStyle: "italic", marginTop: 8 },
  divider: { borderBottom: `1px solid ${C.border}`, marginTop: 22, marginBottom: 22 },
});

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function ColW(n: number) {
  return { width: `${n}%` };
}

const ABBREV: Record<string, string> = {
  "Ubicación": "Ub", "Antigüedad": "An", "Calidad": "Ca",
  "Mantenimiento": "Mn", "Esp. Libre": "EL", "Distribución": "Di",
  "Hum/Seco": "HS", "Comodidad": "Co", "Comodidades": "Co",
  "Lote": "Lo", "Superficie": "Su", "Luminosidad": "Lu", "Linderos": "Li",
  "Ub. Edificio": "UE", "Piso": "Pi", "Ub. En Lote": "UL",
  "Entrada": "En", "Ub. Lote": "UL", "Tipo Lote": "TL",
  "Sup. Cubierta": "SC", "Orientación": "Or", "Vidriera": "Vi",
  "Utilidad": "Ut", "Ub. Cuadra": "UC", "PH": "PH",
};

function abbrev(label: string): string {
  return ABBREV[label] ?? label.substring(0, 2).toUpperCase();
}

// ── Tables page (inserted as page 7 in the merged PDF) ────────────────────────

function TablesPage({
  property,
  comparables,
  customCoefDefs,
  propertyType,
  supHomInmueble,
  vumAverage,
  cochera,
}: TasacionPDFProps) {
  const surfaceCoefs = property.surfaceCoefs;
  const typeLabel = PROPERTY_TYPE_LABELS[propertyType].toUpperCase();
  const valorTotal = calcValorTotal(vumAverage, supHomInmueble, cochera);

  // Ficha table widths
  const fichaSubjectW = 16;
  const fichaCompW =
    comparables.length > 0
      ? (100 - fichaSubjectW * 2) / comparables.length
      : 84 - fichaSubjectW;

  // Calc table widths
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
    {
      label: "Tipología",
      subject: PROPERTY_TYPE_LABELS[propertyType],
      getComp: () => PROPERTY_TYPE_LABELS[propertyType],
    },
    {
      label: "Sup. Total (m²)",
      subject: formatNumber(
        property.supCubierta +
          property.supSemiCubierta +
          property.supDescubierta +
          property.supBalcon
      ),
      getComp: (c) => formatNumber(c.supTotal),
    },
    {
      label: "Sup. Cubierta (m²)",
      subject: formatNumber(property.supCubierta),
      getComp: (c) => formatNumber(c.supCubierta),
    },
    {
      label: "Ambientes",
      subject: property.ambientes ? String(property.ambientes) : "—",
      getComp: (c) => (c.ambientes ? String(c.ambientes) : "—"),
    },
    {
      label: "Dormitorios",
      subject: property.dormitorios ? String(property.dormitorios) : "—",
      getComp: (c) => (c.dormitorios ? String(c.dormitorios) : "—"),
    },
    {
      label: "Baños",
      subject: property.banos ? String(property.banos) : "—",
      getComp: (c) => (c.banos ? String(c.banos) : "—"),
    },
    {
      label: "Precio",
      subject: "—",
      getComp: (c) => (c.precio ? `USD ${c.precio.toLocaleString("es-AR")}` : "—"),
    },
    {
      label: "Cochera",
      subject: "—",
      getComp: (c) => (c.cochera ? `USD ${c.cochera.toLocaleString("es-AR")}` : "—"),
    },
  ];

  return (
    <Page size={[PAGE_W, PAGE_H]} style={s.page}>
      {/* Section heading */}
      <Text style={s.mainTitle}>RESUMEN DE LO ANALIZADO</Text>
      <Text style={s.subTitle}>{typeLabel}</Text>

      {/* ── Ficha comparativa ── */}
      <View style={s.table}>
        <View style={s.row}>
          <Text style={[s.cellHeader, ColW(fichaSubjectW)]}>Conceptos</Text>
          <Text
            style={[
              s.cellHeader,
              ColW(fichaSubjectW),
              { backgroundColor: "#334155" },
            ]}
          >
            {(property.address || "Inmueble a tasar").substring(0, 28)}
          </Text>
          {comparables.map((c) => (
            <Text key={c.id} style={[s.cellHeader, ColW(fichaCompW)]}>
              {(c.ubicacion || `Comp. ${comparables.indexOf(c) + 1}`).substring(0, 22)}
            </Text>
          ))}
        </View>
        {fichaRows.map((row, i) => (
          <View key={row.label} style={s.row}>
            <Text style={[s.cellLabel, ColW(fichaSubjectW)]}>{row.label}</Text>
            <Text
              style={[
                i % 2 === 0 ? s.cellData : s.cellDataAlt,
                ColW(fichaSubjectW),
              ]}
            >
              {row.subject}
            </Text>
            {comparables.map((c) => (
              <Text
                key={c.id}
                style={[i % 2 === 0 ? s.cellData : s.cellDataAlt, ColW(fichaCompW)]}
              >
                {row.getComp(c)}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {/* ── Divider ── */}
      <View style={s.divider} />

      {/* ── Cálculo del valor venal ── */}
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
            <Text key={def.id} style={[s.cellSubHeader, ColW(w.coef)]}>
              {abbrev(def.label)}
            </Text>
          ))}
          <Text style={[s.cellHeader, ColW(w.oferta)]}>C.OF.</Text>
          <Text style={[s.cellHeader, ColW(w.total)]}>C.TOT.</Text>
          <Text style={[s.cellHeader, ColW(w.vum), { borderRight: "none" }]}>
            V.U.M. U$S
          </Text>
        </View>

        {comparables.map((c, i) => {
          const { supHom, valorM2, coefTotal, vum } = calcComparableDerived(
            c,
            surfaceCoefs as SurfaceCoefs
          );
          const isValid = c.precio > 0 && supHom > 0;
          const cell = i % 2 === 1 ? s.calcCellAlt : s.calcCell;
          const fmtCoef = (v: number) => (Math.abs(v - 1) < 0.001 ? "1.00" : v.toFixed(2));
          return (
            <View key={c.id} style={s.row}>
              <Text style={[cell, ColW(w.n)]}>{i + 1}</Text>
              <Text
                style={[cell, ColW(w.ubic), { textAlign: "left", paddingHorizontal: 3 }]}
              >
                {c.ubicacion || "—"}
              </Text>
              <Text style={[cell, ColW(w.precio)]}>
                {c.precio ? `$${c.precio.toLocaleString("es-AR")}` : "—"}
              </Text>
              <Text style={[cell, ColW(w.supHom)]}>
                {isValid ? formatNumber(supHom) : "—"}
              </Text>
              <Text style={[cell, ColW(w.usdM2)]}>
                {isValid ? `$${formatNumber(valorM2)}` : "—"}
              </Text>
              {customCoefDefs.map((def) => (
                <Text
                  key={def.id}
                  style={[cell, ColW(w.coef), { color: C.mid }]}
                >
                  {fmtCoef(c.customCoefs[def.id] ?? 1)}
                </Text>
              ))}
              <Text style={[cell, ColW(w.oferta)]}>{fmtCoef(c.coefOferta)}</Text>
              <Text style={[s.calcCellBold, ColW(w.total)]}>
                {isValid ? formatNumber(coefTotal, 4) : "—"}
              </Text>
              <Text
                style={[s.calcCellBold, ColW(w.vum), { borderRight: "none" }]}
              >
                {isValid ? `$${formatNumber(vum)}` : "—"}
              </Text>
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

      <Text style={s.note}>
        Homogenizo pensando como es el bien a tasar con respecto al comparable
        (=1 equivalente · &gt;1 el tasado es superior · &lt;1 el tasado es inferior)
      </Text>
    </Page>
  );
}

// ── Document (single-page: tables only) ───────────────────────────────────────

export function TasacionPDF(props: TasacionPDFProps) {
  return (
    <Document title={`Tasación — ${props.property.address}`} author="Team Scaglia">
      <TablesPage {...props} />
    </Document>
  );
}
