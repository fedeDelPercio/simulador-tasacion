"use client";

import { useState } from "react";
import type { AppAction, Comparable, PropertyType, SurfaceCoefs } from "@/lib/types";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_VALOR_LABEL } from "@/lib/types";
import { calcComparableDerived, calcValorTotal, formatNumber } from "@/lib/calculations";
import { ValidationAlert } from "./ValidationAlert";

// Diferencia máxima admitida entre el VUM más alto y el más bajo de los comparables
const VUM_SPREAD_THRESHOLD = 0.125;

interface ResultPanelProps {
  comparables: Comparable[];
  supHomInmueble: number;
  surfaceCoefs: SurfaceCoefs;
  cochera: number;
  vumAverage: number;
  propertyType: PropertyType;
  valorOverride: number | null;
  dispatch: React.Dispatch<AppAction>;
}

export function ResultPanel({
  comparables,
  supHomInmueble,
  surfaceCoefs,
  cochera,
  vumAverage,
  propertyType,
  valorOverride,
  dispatch,
}: ResultPanelProps) {
  const [editingValor, setEditingValor] = useState(false);
  const [draftValor, setDraftValor] = useState("");
  // VUM de cada comparable válido (precio y superficie homogeneizada > 0)
  const validVums = comparables
    .filter((c) => c.precio > 0)
    .map((c) => calcComparableDerived(c, surfaceCoefs))
    .filter((d) => d.supHom > 0)
    .map((d) => d.vum);

  const validCount = validVums.length;

  // Dispersión entre el VUM más alto y el más bajo
  const minVum = validVums.length ? Math.min(...validVums) : 0;
  const maxVum = validVums.length ? Math.max(...validVums) : 0;
  const vumSpread = minVum > 0 ? (maxVum - minVum) / minVum : 0;
  const vumInconsistente = validCount >= 2 && vumSpread > VUM_SPREAD_THRESHOLD;

  const valorDepto = vumAverage * supHomInmueble;
  const valorCalculado = calcValorTotal(vumAverage, supHomInmueble, cochera);
  const valorTotal = valorOverride ?? valorCalculado;
  const isOverridden =
    valorOverride != null && Math.abs(valorOverride - valorCalculado) > 0.5;

  function saveValor() {
    const parsed = parseFloat(draftValor.replace(/[^0-9.]/g, ""));
    dispatch({ type: "SET_VALOR_OVERRIDE", value: isNaN(parsed) ? null : parsed });
    setEditingValor(false);
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {/* Section heading */}
      <div className="px-6 py-4 border-b border-neutral-100">
        <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-widest">
          Resultado de la Tasación
        </p>
        <p className="text-xs text-neutral-600 mt-0.5">
          Basado en {validCount} comparable{validCount !== 1 ? "s" : ""} válido
          {validCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Aviso de inconsistencia entre VUM de comparables */}
        {vumInconsistente && (
          <ValidationAlert
            variant="warning"
            message={`Inconsistencia entre comparables: el VUM más alto ($${formatNumber(
              maxVum,
              0
            )}) supera al más bajo ($${formatNumber(minVum, 0)}) en ${formatNumber(
              vumSpread * 100,
              1
            )}% (máximo sugerido ${formatNumber(
              VUM_SPREAD_THRESHOLD * 100,
              1
            )}%). Revisá la selección de comparables.`}
          />
        )}

        {/* VUM + Depto row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">
              V.U.M. Promedio
            </p>
            <p className="text-2xl font-bold text-brand-950">
              ${formatNumber(vumAverage)}
            </p>
            <p className="text-xs text-neutral-600 mt-1">USD/m²</p>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">
              {PROPERTY_TYPE_VALOR_LABEL[propertyType]}
            </p>
            <p className="text-2xl font-bold text-brand-950">
              ${formatNumber(valorDepto)}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {formatNumber(vumAverage)} × {formatNumber(supHomInmueble)} m²
            </p>
          </div>
        </div>

        {/* Cochera input */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-700">
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
            <div className="mt-5 text-sm text-neutral-600">
              + ${formatNumber(cochera)}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="p-5 bg-brand-950 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Valor Sugerido de Comercialización
            </p>
            {!editingValor && (
              <button
                onClick={() => {
                  setDraftValor(String(Math.round(valorTotal)));
                  setEditingValor(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/20 text-white text-[11px] font-medium rounded-md hover:bg-white/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
                </svg>
                Editar
              </button>
            )}
          </div>

          {editingValor ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={draftValor}
                autoFocus
                onChange={(e) => setDraftValor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveValor();
                  if (e.key === "Escape") setEditingValor(false);
                }}
                className="flex-1 min-w-0 bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-3xl font-bold tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={saveValor}
                className="px-3 py-2 bg-white text-brand-950 text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingValor(false)}
                className="px-3 py-2 text-white/70 text-sm rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <p className="text-4xl font-bold tracking-tight">
              ${formatNumber(valorTotal)}
            </p>
          )}
          <p className="text-white/40 text-xs mt-1">USD</p>

          {isOverridden && !editingValor && (
            <p className="text-white/50 text-xs mt-2">
              Editado manualmente · Calculado: ${formatNumber(valorCalculado)} ·{" "}
              <button
                onClick={() => dispatch({ type: "SET_VALOR_OVERRIDE", value: null })}
                className="underline hover:text-white/80"
              >
                volver al calculado
              </button>
            </p>
          )}

          {cochera > 0 && !isOverridden && !editingValor && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1.5 text-xs text-white/50">
              <div className="flex justify-between">
                <span>{PROPERTY_TYPE_LABELS[propertyType]}</span>
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
