"use client";

import type { AppAction, Comparable, SurfaceCoefs } from "@/lib/types";
import { calcValorTotal, formatNumber } from "@/lib/calculations";

interface ResultPanelProps {
  comparables: Comparable[];
  supHomInmueble: number;
  surfaceCoefs: SurfaceCoefs;
  cochera: number;
  vumAverage: number;
  dispatch: React.Dispatch<AppAction>;
}

export function ResultPanel({
  comparables,
  supHomInmueble,
  surfaceCoefs,
  cochera,
  vumAverage,
  dispatch,
}: ResultPanelProps) {
  const validCount = comparables.filter((c) => {
    if (c.precio <= 0) return false;
    const supHom = c.supCubierta * surfaceCoefs.cubierta + c.supSemiCubierta * surfaceCoefs.semicubierta + c.supDescubierta * surfaceCoefs.descubierta + c.supBalcon * surfaceCoefs.balcon;
    return supHom > 0;
  }).length;

  const valorDepto = vumAverage * supHomInmueble;
  const valorTotal = calcValorTotal(vumAverage, supHomInmueble, cochera);

  return (
    <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {/* Section heading */}
      <div className="px-6 py-4 border-b border-neutral-100">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
          Resultado de la Tasación
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Basado en {validCount} comparable{validCount !== 1 ? "s" : ""} válido
          {validCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* VUM + Depto row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">
              V.U.M. Promedio
            </p>
            <p className="text-2xl font-bold text-brand-950">
              ${formatNumber(vumAverage)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">USD/m²</p>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">
              Valor del Departamento
            </p>
            <p className="text-2xl font-bold text-brand-950">
              ${formatNumber(valorDepto)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {formatNumber(vumAverage)} × {formatNumber(supHomInmueble)} m²
            </p>
          </div>
        </div>

        {/* Cochera input */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">
              Cochera (USD) — opcional
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={cochera === 0 ? "" : cochera}
              onChange={(e) =>
                dispatch({
                  type: "SET_COCHERA",
                  value: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
              className="w-48 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
            />
          </div>
          {cochera > 0 && (
            <div className="mt-5 text-sm text-neutral-400">
              + ${formatNumber(cochera)}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="p-5 bg-brand-950 rounded-xl text-white">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-2">
            Valor Total de Comercialización
          </p>
          <p className="text-4xl font-bold tracking-tight">
            ${formatNumber(valorTotal)}
          </p>
          <p className="text-white/40 text-xs mt-1">USD</p>

          {cochera > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1.5 text-xs text-white/50">
              <div className="flex justify-between">
                <span>Departamento</span>
                <span className="font-medium text-white/70">${formatNumber(valorDepto)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cochera</span>
                <span className="font-medium text-white/70">${formatNumber(cochera)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
