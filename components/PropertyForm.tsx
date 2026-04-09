"use client";

import type { AppAction, PropertyData } from "@/lib/types";
import { formatNumber } from "@/lib/calculations";

interface PropertyFormProps {
  property: PropertyData;
  supHomInmueble: number;
  dispatch: React.Dispatch<AppAction>;
}

function NumInput({
  label,
  value,
  onChange,
  step,
  required,
  small,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  required?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`font-medium text-neutral-500 ${small ? "text-[10px]" : "text-xs"}`}
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

export function PropertyForm({
  property,
  supHomInmueble,
  dispatch,
}: PropertyFormProps) {
  const { surfaceCoefs } = property;

  function update(payload: Partial<PropertyData>) {
    dispatch({ type: "UPDATE_PROPERTY", payload });
  }

  return (
    <section className="bg-white rounded-xl border border-neutral-200 shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
        <div className="w-5 h-5 rounded bg-brand-950 flex items-center justify-center flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="w-3 h-3"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-brand-950">
          Inmueble a tasar
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Row 1: Surfaces — 4 explicit fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NumInput
            label="Sup. Cubierta (m²)"
            value={property.supCubierta}
            onChange={(v) => update({ supCubierta: v })}
            step="0.01"
            required
          />
          <NumInput
            label="Sup. Semicubierta (m²)"
            value={property.supSemiCubierta}
            onChange={(v) => update({ supSemiCubierta: v })}
            step="0.01"
          />
          <NumInput
            label="Sup. Descubierta (m²)"
            value={property.supDescubierta}
            onChange={(v) => update({ supDescubierta: v })}
            step="0.01"
          />
          <NumInput
            label="Sup. Balcón (m²)"
            value={property.supBalcon}
            onChange={(v) => update({ supBalcon: v })}
            step="0.01"
          />
        </div>

        {/* Row 2: Rooms */}
        <div className="grid grid-cols-3 gap-3">
          <NumInput
            label="Ambientes"
            value={property.ambientes ?? 0}
            onChange={(v) => update({ ambientes: v })}
          />
          <NumInput
            label="Dormitorios"
            value={property.dormitorios ?? 0}
            onChange={(v) => update({ dormitorios: v })}
          />
          <NumInput
            label="Baños"
            value={property.banos ?? 0}
            onChange={(v) => update({ banos: v })}
          />
        </div>

        {/* Row 3: Price */}
        <div className="grid grid-cols-2 gap-3">
          <NumInput
            label="Precio (USD)"
            value={property.precio ?? 0}
            onChange={(v) => update({ precio: v })}
            step="100"
          />
          <NumInput
            label="Cochera (USD)"
            value={property.cochera ?? 0}
            onChange={(v) => update({ cochera: v })}
            step="100"
          />
        </div>

        {/* Row 4: Ubicación + Link */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">Ubicación</label>
            <input
              type="text"
              value={property.address ?? ""}
              onChange={(e) => dispatch({ type: "UPDATE_PROPERTY", payload: { address: e.target.value } })}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">Link <span className="font-normal text-neutral-400">(opcional)</span></label>
            <div className="flex items-center gap-1">
              <input
                type="url"
                value={property.link ?? ""}
                onChange={(e) => dispatch({ type: "UPDATE_PROPERTY", payload: { link: e.target.value } })}
                placeholder="https://zonaprop.com.ar/..."
                className="flex-1 px-3 py-1.5 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
              />
              {property.link && (
                <a
                  href={property.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-400 hover:text-brand-800 transition-colors"
                  title="Abrir link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Sup. Hom. result */}
        {supHomInmueble > 0 && (
          <div className="flex items-center justify-between p-4 bg-brand-50 border border-neutral-200 rounded-xl">
            <div>
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">
                Superficie Homogeneizada
              </p>
              <p className="text-2xl font-bold text-brand-950">
                {formatNumber(supHomInmueble)} m²
              </p>
            </div>
            <div className="text-xs text-neutral-400 text-right hidden sm:block leading-relaxed">
              <p>(Cub × {surfaceCoefs.cubierta})</p>
              <p>+ (Semi × {surfaceCoefs.semicubierta})</p>
              <p>+ (Desc × {surfaceCoefs.descubierta})</p>
              <p>+ (Balcón × {surfaceCoefs.balcon})</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
