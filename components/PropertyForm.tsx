"use client";

import { useRef } from "react";
import type { AppAction, PropertyData, PropertyType } from "@/lib/types";
import { formatNumber, roomsError } from "@/lib/calculations";
import { ValidationAlert } from "./ValidationAlert";

/** Lee un archivo de imagen, lo redimensiona (máx 1280px) y devuelve un data URL JPEG. */
function fileToResizedDataURL(file: File, maxSize = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface PropertyFormProps {
  property: PropertyData;
  propertyType: PropertyType;
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
        className={`font-medium text-neutral-700 ${small ? "text-[10px]" : "text-xs"}`}
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
  propertyType,
  supHomInmueble,
  dispatch,
}: PropertyFormProps) {
  const { surfaceCoefs } = property;
  const isLocal = propertyType === "local";

  const dormError = roomsError(property.ambientes ?? 0, property.dormitorios ?? 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(payload: Partial<PropertyData>) {
    dispatch({ type: "UPDATE_PROPERTY", payload });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataURL(file);
      update({ photo: dataUrl });
    } catch {
      // si falla la lectura, no rompemos el formulario
    }
    e.target.value = ""; // permite volver a elegir el mismo archivo
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
          Inmueble a analizar
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NumInput
            label="Ambientes"
            value={property.ambientes ?? 0}
            onChange={(v) => update({ ambientes: v })}
          />
          {!isLocal && (
            <NumInput
              label="Dormitorios"
              value={property.dormitorios ?? 0}
              onChange={(v) => update({ dormitorios: v })}
            />
          )}
          <NumInput
            label="Baños"
            value={property.banos ?? 0}
            onChange={(v) => update({ banos: v })}
          />
          <NumInput
            label="Toilete"
            value={property.toilete ?? 0}
            onChange={(v) => update({ toilete: v })}
          />
        </div>

        {/* Validación dormitorios vs ambientes */}
        {dormError && <ValidationAlert variant="error" message={dormError} />}

        {/* Row 3: Ubicación + Link */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-700">Ubicación</label>
            <input
              type="text"
              value={property.address ?? ""}
              onChange={(e) => dispatch({ type: "UPDATE_PROPERTY", payload: { address: e.target.value } })}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-700">Link <span className="font-normal text-neutral-600">(opcional)</span></label>
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
                  className="p-2 text-neutral-600 hover:text-brand-800 transition-colors"
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

        {/* Foto del inmueble */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-700">
            Foto del inmueble <span className="font-normal text-neutral-600">(opcional)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="hidden"
          />
          {property.photo ? (
            <div className="relative inline-block w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.photo}
                alt="Foto del inmueble a tasar"
                className="max-h-48 rounded-lg border border-neutral-200 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white/90 backdrop-blur border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-md hover:bg-white transition-colors"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => update({ photo: "" })}
                  className="px-2.5 py-1 bg-white/90 backdrop-blur border border-neutral-200 text-red-600 text-[11px] font-medium rounded-md hover:bg-white transition-colors"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-600 hover:border-brand-400 hover:text-brand-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-xs font-medium">Subir foto</span>
            </button>
          )}
        </div>

        {/* Sup. Hom. result */}
        {supHomInmueble > 0 && (
          <div className="flex items-center justify-between p-4 bg-brand-50 border border-neutral-200 rounded-xl">
            <div>
              <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">
                Superficie Homogeneizada
              </p>
              <p className="text-2xl font-bold text-brand-950">
                {formatNumber(supHomInmueble)} m²
              </p>
            </div>
            <div className="text-xs text-neutral-600 text-right hidden sm:block leading-relaxed">
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
