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
  const [editingSurface, setEditingSurface] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [coefToDelete, setCoefToDelete] = useState<CustomCoefDef | null>(null);

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    dispatch({ type: "ADD_CUSTOM_COEF", label });
    setNewLabel("");
  }

  const surfaceFields = [
    ["Cubierta", "cubierta"],
    ["Semicubierta", "semicubierta"],
    ["Descubierta", "descubierta"],
    ["Balcón", "balcon"],
  ] as const;

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
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-neutral-500">
                Ponderación de superficies
              </p>
              {!editingSurface ? (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
                  </svg>
                  Modificar
                </button>
              ) : (
                <button
                  onClick={() => setEditingSurface(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-950 text-white text-xs font-medium rounded-lg hover:bg-brand-800 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-3.5 h-3.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Listo
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {surfaceFields.map(([label, key]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400">{label}</label>
                  {editingSurface ? (
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
                  ) : (
                    <div className="px-3 py-2 border border-neutral-100 bg-neutral-50 rounded-lg text-sm font-medium text-neutral-800">
                      {surfaceCoefs[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Custom homogenization coefs ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  Coeficientes adicionales
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Se agregan a los coeficientes del tipo de inmueble seleccionado.
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
                      onClick={() => setCoefToDelete(def)}
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

      {/* ── Confirm modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5 text-amber-500"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  ¿Seguro que querés modificar las ponderaciones de superficie?
                </h3>
                <p className="text-xs text-neutral-500 mt-1.5">
                  Estos valores afectan el cálculo de la tasación. Modificalos
                  solo si estás seguro.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setEditingSurface(true);
                  setConfirmOpen(false);
                }}
                className="px-4 py-2 bg-brand-950 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
              >
                Sí, modificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete coef modal ── */}
      {coefToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5 text-red-500"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  ¿Seguro que querés eliminar el coeficiente “{coefToDelete.label}”?
                </h3>
                <p className="text-xs text-neutral-500 mt-1.5">
                  Se quitará de todos los comparables y afectará el cálculo de la
                  tasación.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setCoefToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  dispatch({ type: "REMOVE_CUSTOM_COEF", id: coefToDelete.id });
                  setCoefToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
