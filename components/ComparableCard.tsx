"use client";

import { useState } from "react";
import type { AppAction, Comparable, CustomCoefDef, SurfaceCoefs } from "@/lib/types";
import { calcComparableDerived, formatNumber } from "@/lib/calculations";

interface ComparableCardProps {
  comparable: Comparable;
  index: number;
  vumAverage: number;
  surfaceCoefs: SurfaceCoefs;
  customCoefDefs: CustomCoefDef[];
  dispatch: React.Dispatch<AppAction>;
}

const COEF_MIN = 0.8;
const COEF_MAX = 1.2;

function CoefSlider({
  label,
  value,
  onChange,
  onDelete,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const pct = Math.round((value - 1) * 100);
  const thumbPos = ((value - COEF_MIN) / (COEF_MAX - COEF_MIN)) * 100;
  const isNeutral = Math.abs(value - 1) < 0.005;
  const isAbove = value > 1.005;

  const fillLeft = isAbove ? 50 : thumbPos;
  const fillWidth = Math.abs(thumbPos - 50);

  const valueColor = isNeutral ? "text-neutral-400" : isAbove ? "text-brand-700" : "text-accent-500";

  function commitEdit(raw: string) {
    const parsed = parseFloat(raw.replace(",", "."));
    if (!isNaN(parsed)) {
      onChange(Math.min(COEF_MAX, Math.max(COEF_MIN, parsed)));
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Label row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <label className="text-[10px] font-medium text-neutral-400 leading-tight truncate">
            {label}
          </label>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Eliminar coeficiente"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2 h-2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <span
          className={`flex-shrink-0 text-[10px] font-semibold tabular-nums ${
            isNeutral ? "text-neutral-300" : isAbove ? "text-brand-700" : "text-accent-500"
          }`}
        >
          {pct > 0 ? "+" : ""}{pct}%
        </span>
      </div>

      {/* Track + thumb */}
      <div className="relative h-6 flex items-center select-none">
        <div className="w-full h-1 bg-neutral-200 rounded-full relative overflow-visible">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-3 bg-neutral-300" />
          {!isNeutral && (
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${fillLeft}%`,
                width: `${fillWidth}%`,
                backgroundColor: isAbove ? "#334155" : "#d97706",
              }}
            />
          )}
        </div>
        <input
          type="range"
          min={COEF_MIN}
          max={COEF_MAX}
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 bg-white pointer-events-none shadow-sm transition-colors ${
            isNeutral ? "border-neutral-300" : isAbove ? "border-brand-700" : "border-accent-500"
          }`}
          style={{ left: `${thumbPos}%` }}
        />
      </div>

      {/* Numeric value — tap/click to edit directly */}
      {editing ? (
        <input
          type="number"
          min={COEF_MIN}
          max={COEF_MAX}
          step="0.01"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commitEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") setEditing(false);
          }}
          className={`text-center text-[11px] font-semibold tabular-nums w-full bg-transparent border-b border-current focus:outline-none ${valueColor}`}
        />
      ) : (
        <button
          onClick={() => { setDraft(value.toFixed(2)); setEditing(true); }}
          className={`text-center text-[11px] font-semibold tabular-nums w-full ${valueColor}`}
          title="Tocar para editar"
        >
          {value.toFixed(2)}
        </button>
      )}
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  required,
  small,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
  small?: boolean;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`font-medium text-neutral-500 ${
          small ? "text-[10px]" : "text-xs"
        }`}
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="number"
        min="0"
        step={step ?? "1"}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        className={`px-2 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition ${
          small ? "py-1 text-xs" : "py-1.5 text-sm"
        }`}
      />
    </div>
  );
}

export function ComparableCard({
  comparable,
  index,
  vumAverage,
  surfaceCoefs,
  customCoefDefs,
  dispatch,
}: ComparableCardProps) {
  const [newCoefLabel, setNewCoefLabel] = useState("");
  const [addingCoef, setAddingCoef] = useState(false);

  function handleAddCustomCoef() {
    const label = newCoefLabel.trim();
    if (!label) return;
    dispatch({ type: "ADD_CUSTOM_COEF", label });
    setNewCoefLabel("");
    setAddingCoef(false);
  }
  const { supHom, valorM2, coefTotal, vum } = calcComparableDerived(
    comparable,
    surfaceCoefs
  );

  const isOutlier =
    vumAverage > 0 && Math.abs(vum - vumAverage) / vumAverage > 0.3;

  const isValid = comparable.precio > 0 && supHom > 0;

  function updateField<K extends keyof Comparable>(
    key: K,
    value: Comparable[K]
  ) {
    dispatch({
      type: "UPDATE_COMPARABLE",
      id: comparable.id,
      payload: { [key]: value },
    });
  }

  function updateCustomCoef(coefId: string, value: number) {
    dispatch({ type: "UPDATE_COMPARABLE_CUSTOM_COEF", id: comparable.id, coefId, value });
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-colors ${
        isOutlier ? "border-accent-500" : "border-neutral-200"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
        <span className="text-sm font-semibold text-brand-950">
          Comparable {index + 1}
        </span>
        {isOutlier && (
          <span className="flex items-center gap-1 text-xs text-accent-500 font-medium">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3.5 h-3.5"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            VUM fuera de rango
          </span>
        )}
        {!isValid && comparable.precio === 0 && (
          <span className="text-xs text-neutral-300 italic">sin datos</span>
        )}
        <button
          onClick={() =>
            dispatch({ type: "REMOVE_COMPARABLE", id: comparable.id })
          }
          className="ml-auto text-neutral-300 hover:text-red-400 transition-colors p-1 rounded"
          title="Eliminar comparable"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Address + link row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">
              Ubicación / Dirección <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={comparable.ubicacion}
              onChange={(e) => updateField("ubicacion", e.target.value)}
              placeholder="Ej: Av. Corrientes 1234, Piso 2°B"
              className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">Link</label>
            <div className="flex items-center gap-1">
              <input
                type="url"
                value={comparable.link}
                onChange={(e) => updateField("link", e.target.value)}
                placeholder="https://zonaprop.com.ar/..."
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
              />
              {comparable.link && (
                <a
                  href={comparable.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-400 hover:text-brand-800 transition-colors"
                  title="Abrir link"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Row 1: Surfaces */}
        <div className="grid grid-cols-4 gap-3">
          <NumInput
            label="Sup. Cubierta (m²)"
            value={comparable.supCubierta}
            onChange={(v) => updateField("supCubierta", v)}
            required
            step="0.01"
          />
          <NumInput
            label="Sup. Semicubierta (m²)"
            value={comparable.supSemiCubierta}
            onChange={(v) => updateField("supSemiCubierta", v)}
            step="0.01"
          />
          <NumInput
            label="Sup. Descubierta (m²)"
            value={comparable.supDescubierta}
            onChange={(v) => updateField("supDescubierta", v)}
            step="0.01"
          />
          <NumInput
            label="Sup. Balcón (m²)"
            value={comparable.supBalcon}
            onChange={(v) => updateField("supBalcon", v)}
            step="0.01"
          />
        </div>

        {/* Row 2: Rooms */}
        <div className="grid grid-cols-3 gap-3">
          <NumInput
            label="Ambientes"
            value={comparable.ambientes}
            onChange={(v) => updateField("ambientes", v)}
          />
          <NumInput
            label="Dormitorios"
            value={comparable.dormitorios}
            onChange={(v) => updateField("dormitorios", v)}
          />
          <NumInput
            label="Baños"
            value={comparable.banos}
            onChange={(v) => updateField("banos", v)}
          />
        </div>

        {/* Row 3: Price */}
        <div className="grid grid-cols-2 gap-3">
          <NumInput
            label="Precio (USD)"
            value={comparable.precio}
            onChange={(v) => updateField("precio", v)}
            required
            step="100"
          />
          <NumInput
            label="Cochera (USD)"
            value={comparable.cochera}
            onChange={(v) => updateField("cochera", v)}
            step="100"
          />
        </div>

        {/* Derived values */}
        {isValid && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Sup. Hom.", value: `${formatNumber(supHom)} m²` },
              { label: "USD/m²", value: `$${formatNumber(valorM2)}` },
              { label: "Coef. Total", value: formatNumber(coefTotal, 4) },
              { label: "VUM", value: `$${formatNumber(vum)}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-semibold text-brand-950 mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Collapsible homogenization coefficients */}
        <div>
          <button
            onClick={() =>
              dispatch({ type: "TOGGLE_COMPARABLE_COEFS", id: comparable.id })
            }
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-3.5 h-3.5 transition-transform ${
                comparable.showCoefs ? "rotate-90" : ""
              }`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Coeficientes de homogeneización
          </button>

          {comparable.showCoefs && (
            <div className="mt-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              {/* Range labels */}
              <div className="flex justify-between text-[9px] text-neutral-400 mb-3 px-0.5">
                <span>−20%</span>
                <span className="font-medium">neutro</span>
                <span>+20%</span>
              </div>

              {/* All coefs (preset + custom) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-5">
                {customCoefDefs.map((def) => (
                  <CoefSlider
                    key={def.id}
                    label={def.label}
                    value={comparable.customCoefs[def.id] ?? 1}
                    onChange={(v) => updateCustomCoef(def.id, v)}
                    onDelete={def.isCustom ? () => dispatch({ type: "REMOVE_CUSTOM_COEF", id: def.id }) : undefined}
                  />
                ))}
              </div>

              {/* Coef. Oferta — always present */}
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <div className="w-40">
                  <CoefSlider
                    label="Coef. Oferta"
                    value={comparable.coefOferta ?? 1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_COMPARABLE",
                        id: comparable.id,
                        payload: { coefOferta: v },
                      })
                    }
                  />
                </div>
              </div>

              {/* Add custom coef inline */}
              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                <p className="text-[10px] text-neutral-400">
                  Coef. Total = {formatNumber(coefTotal, 4)}
                </p>
                {addingCoef ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newCoefLabel}
                      onChange={(e) => setNewCoefLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCustomCoef();
                        if (e.key === "Escape") { setAddingCoef(false); setNewCoefLabel(""); }
                      }}
                      placeholder="Nombre del coeficiente"
                      autoFocus
                      className="px-2 py-1 border border-neutral-200 rounded-lg text-[11px] text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand-800 focus:border-transparent transition w-44"
                    />
                    <button
                      onClick={handleAddCustomCoef}
                      disabled={!newCoefLabel.trim()}
                      className="px-2 py-1 bg-brand-950 text-white text-[11px] font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Agregar
                    </button>
                    <button
                      onClick={() => { setAddingCoef(false); setNewCoefLabel(""); }}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCoef(true)}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-brand-800 transition-colors"
                    title="Agregar coeficiente personalizado"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nuevo coeficiente
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
