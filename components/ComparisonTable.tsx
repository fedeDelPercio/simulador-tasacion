"use client";

import type { Comparable, PropertyData, SurfaceCoefs } from "@/lib/types";
import { calcComparableDerived, formatNumber } from "@/lib/calculations";

interface Props {
  property: PropertyData;
  supHomInmueble: number;
  comparables: Comparable[];
  surfaceCoefs: SurfaceCoefs;
}

function outlierFlags(values: (number | null)[], threshold: number): boolean[] {
  const valids = values.filter((v): v is number => v !== null && isFinite(v) && v > 0);
  if (valids.length < 2) return values.map(() => false);
  const mean = valids.reduce((a, b) => a + b, 0) / valids.length;
  if (mean === 0) return values.map(() => false);
  return values.map(
    (v) => v !== null && isFinite(v) && v > 0 && Math.abs(v - mean) / mean > threshold
  );
}

// Derived cell — always inside a <tr>, never nested in another <td>
function Cell({
  value,
  isOutlier,
  format,
  first = false,
  last = false,
  empty = false,
}: {
  value: number | null;
  isOutlier: boolean;
  format: (v: number) => string;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}) {
  const borderL = first ? "border-l-2 border-neutral-200" : "";
  const borderR = "";
  const px = last ? "pl-4 pr-6" : first ? "pl-5 pr-4" : "px-4";

  if (empty || value === null || value === 0) {
    return (
      <td className={`${px} py-3 text-right text-neutral-300 bg-neutral-100/50 ${borderL} ${borderR}`}>
        —
      </td>
    );
  }
  if (isOutlier) {
    return (
      <td className={`${px} py-3 text-right bg-amber-50 ${borderL} ${borderR}`}>
        <div className="flex items-center justify-end gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-accent-500 flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-semibold text-accent-500 tabular-nums text-xs">{format(value)}</span>
        </div>
      </td>
    );
  }
  return (
    <td className={`${px} py-3 text-right text-neutral-700 tabular-nums text-xs bg-neutral-100/50 ${borderL} ${borderR}`}>
      {format(value)}
    </td>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function ComparisonTable({ property, supHomInmueble, comparables, surfaceCoefs }: Props) {
  if (comparables.length === 0) return null;
  const hasValid = comparables.some((c) => c.precio > 0);
  if (!hasValid) return null;

  const derived = comparables.map((c) =>
    c.precio > 0 ? calcComparableDerived(c, surfaceCoefs) : null
  );

  const supHomFlags  = outlierFlags(derived.map((d) => d?.supHom    ?? null), 0.40);
  const valorM2Flags = outlierFlags(derived.map((d) => d?.valorM2   ?? null), 0.30);
  const coefFlags    = outlierFlags(derived.map((d) => d?.coefTotal ?? null), 0.20);
  const vumFlags     = outlierFlags(derived.map((d) => d?.vum       ?? null), 0.30);

  const anyOutlier = comparables.some(
    (_, i) => supHomFlags[i] || valorM2Flags[i] || coefFlags[i] || vumFlags[i]
  );

  const subjectSupTotal =
    property.supCubierta + property.supSemiCubierta +
    property.supDescubierta + property.supBalcon;

  // Shared header classes for derived columns
  const thDerived = (first = false, last = false) => {
    const bl = first ? "border-l-2 border-neutral-300" : "";
    const br = "";
    const px = last ? "pl-4 pr-6" : first ? "pl-5 pr-4" : "px-4";
    return `${px} py-3 font-semibold text-brand-700 text-[10px] uppercase tracking-wider bg-neutral-100 whitespace-nowrap ${bl} ${br}`;
  };

  return (
    <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-100 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
            Cuadro comparativo
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Resumen del inmueble y los comparables
          </p>
        </div>
        {anyOutlier && (
          <div className="flex items-center gap-1.5 text-xs text-accent-500 font-medium flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Valores atípicos detectados
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left px-5 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider whitespace-nowrap">
                Dirección
              </th>
              <th className="text-center px-4 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">
                Amb.
              </th>
              <th className="text-right px-4 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider whitespace-nowrap">
                Sup. Total
              </th>
              <th className="text-right px-4 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider whitespace-nowrap">
                Precio
              </th>
              {/* Derived sub-panel headers */}
              <th className={`text-right ${thDerived(true)}`} title="Superficie homogeneizada">
                Sup. Hom.
              </th>
              <th className={`text-right ${thDerived()}`}>USD/m²</th>
              <th className={`text-right ${thDerived()}`}>Coef. Total</th>
              <th className={`text-right ${thDerived(false, true)}`}>VUM</th>
            </tr>
          </thead>
          <tbody>
            {/* Subject property row */}
            <tr className="border-b border-neutral-100 bg-brand-50/60">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2 min-w-[160px]">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-brand-950 text-white text-[9px] font-bold flex-shrink-0">
                    ★
                  </span>
                  <span
                    className="font-semibold text-brand-950 text-xs truncate max-w-[200px]"
                    title={property.address || "Inmueble a tasar"}
                  >
                    {property.address || "Inmueble a tasar"}
                  </span>
                  {property.link && (
                    <a
                      href={property.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-neutral-300 hover:text-brand-800 transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      <ExternalLinkIcon />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center text-neutral-600 text-xs tabular-nums">
                {(property.ambientes ?? 0) || "—"}
              </td>
              <td className="px-4 py-3 text-right text-neutral-600 text-xs tabular-nums">
                {subjectSupTotal > 0 ? `${formatNumber(subjectSupTotal)} m²` : "—"}
              </td>
              <td className="px-4 py-3 text-right text-neutral-600 text-xs tabular-nums">
                {(property.precio ?? 0) > 0
                  ? `$${formatNumber(property.precio, 0)}`
                  : <span className="text-neutral-400 italic text-[11px]">a tasar</span>}
              </td>
              {/* Derived cols — subject */}
              <td className="pl-5 pr-4 py-3 text-right bg-brand-50/80 border-l-2 border-neutral-200">
                <span className="font-bold text-brand-950 tabular-nums text-xs">
                  {supHomInmueble > 0 ? `${formatNumber(supHomInmueble)} m²` : "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-neutral-400 text-xs bg-brand-50/80">—</td>
              <td className="px-4 py-3 text-right text-neutral-400 text-xs bg-brand-50/80">—</td>
              <td className="pl-4 pr-6 py-3 text-right text-neutral-400 text-xs bg-brand-50/80">—</td>
            </tr>

            {/* Comparable rows */}
            {comparables.map((c, i) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-neutral-100 text-neutral-500 text-[9px] font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span
                      className="text-neutral-700 text-xs truncate max-w-[180px]"
                      title={c.ubicacion || `Comparable ${i + 1}`}
                    >
                      {c.ubicacion || <span className="text-neutral-300 italic">sin dirección</span>}
                    </span>
                    {c.link && (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-neutral-300 hover:text-brand-800 transition-colors"
                        title="Abrir en nueva pestaña"
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-neutral-500 text-xs tabular-nums">
                  {c.ambientes || "—"}
                </td>
                <td className="px-4 py-3 text-right text-neutral-500 text-xs tabular-nums">
                  {c.supTotal > 0 ? `${formatNumber(c.supTotal)} m²` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-neutral-500 text-xs tabular-nums">
                  {c.precio > 0
                    ? `$${formatNumber(c.precio, 0)}`
                    : <span className="text-neutral-300 italic text-[11px]">sin datos</span>}
                </td>
                <Cell value={derived[i]?.supHom    ?? null} isOutlier={supHomFlags[i]}  format={(v) => `${formatNumber(v)} m²`}  empty={!derived[i]} first />
                <Cell value={derived[i]?.valorM2   ?? null} isOutlier={valorM2Flags[i]} format={(v) => `$${formatNumber(v, 0)}`} empty={!derived[i]} />
                <Cell value={derived[i]?.coefTotal ?? null} isOutlier={coefFlags[i]}    format={(v) => formatNumber(v, 4)}        empty={!derived[i]} />
                <Cell value={derived[i]?.vum       ?? null} isOutlier={vumFlags[i]}     format={(v) => `$${formatNumber(v, 0)}`} empty={!derived[i]} last />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Outlier explanation */}
      {anyOutlier && (
        <div className="px-6 py-3 border-t border-amber-100 bg-amber-50/60 flex items-start gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Las celdas resaltadas presentan una diferencia significativa respecto al promedio de los comparables válidos.
            Verificá si el inmueble es realmente comparable o ajustá sus coeficientes de homogeneización.
          </p>
        </div>
      )}
    </section>
  );
}
