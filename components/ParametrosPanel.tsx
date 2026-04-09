"use client";

import { useState } from "react";
import type { AppAction, CustomCoefDef, SurfaceCoefs } from "@/lib/types";

interface ParametrosPanelProps {
  surfaceCoefs: SurfaceCoefs;
  customCoefDefs: CustomCoefDef[];
  show: boolean;
  dispatch: React.Dispatch<AppAction>;
}

export function ParametrosPanel({
  surfaceCoefs,
  customCoefDefs,
  show,
  dispatch,
}: ParametrosPanelProps) {
  const [newLabel, setNewLabel] = useState("");

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    dispatch({ type: "ADD_CUSTOM_COEF", label });
    setNewLabel("");
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_PARAMETROS" })}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4 text-neutral-400 flex-shrink-0"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
        </svg>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
            Parámetros de valuación
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Coeficientes de ponderación de superficie
            {customCoefDefs.length > 0 &&
              ` · ${customCoefDefs.length} coef. personalizado${customCoefDefs.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ${
            show ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {show && (
        <div className="px-6 pb-6 space-y-6 border-t border-neutral-100">
          {/* ── Surface coefficients ── */}
          <div className="pt-5">
            <p className="text-xs font-medium text-neutral-500 mb-3">
              Ponderación de superficies
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  ["Cubierta", "cubierta"],
                  ["Semicubierta", "semicubierta"],
                  ["Descubierta", "descubierta"],
                  ["Balcón", "balcon"],
                ] as const
              ).map(([label, key]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={surfaceCoefs[key]}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_SURFACE_COEFS",
                        payload: { [key]: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Custom homogenization coefs ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  Coeficientes de homogeneización personalizados
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Se multiplican junto con los 10 coeficientes estándar en cada comparable.
                </p>
              </div>
            </div>

            {/* Existing custom coefs */}
            {customCoefDefs.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {customCoefDefs.map((def) => (
                  <div
                    key={def.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-700"
                  >
                    <span>{def.label}</span>
                    <button
                      onClick={() =>
                        dispatch({ type: "REMOVE_CUSTOM_COEF", id: def.id })
                      }
                      className="text-neutral-400 hover:text-red-400 transition-colors ml-1"
                      title="Eliminar coeficiente"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="w-3.5 h-3.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new coef */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Ej: Vista al río, Amenities premium..."
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
              />
              <button
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-950 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-4 h-4"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
