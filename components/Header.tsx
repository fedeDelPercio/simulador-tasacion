"use client";

import type { AppAction, PropertyData } from "@/lib/types";

interface HeaderProps {
  property: PropertyData;
  dispatch: React.Dispatch<AppAction>;
}

export function Header({ property, dispatch }: HeaderProps) {
  return (
    <section className="bg-white border border-neutral-200 rounded-xl p-6">
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-4">
        Datos de la Tasación
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Address */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">
            Dirección del inmueble <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={property.address}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_PROPERTY",
                payload: { address: e.target.value },
              })
            }
            placeholder="Ej: Arredondo 2421, Piso 3°A, CABA"
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">Fecha</label>
          <input
            type="date"
            value={property.date}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_PROPERTY",
                payload: { date: e.target.value },
              })
            }
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
          />
        </div>

        {/* Agent */}
        <div className="sm:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">
            Agente <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={property.agent}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_PROPERTY",
                payload: { agent: e.target.value },
              })
            }
            placeholder="Nombre del agente inmobiliario"
            className="max-w-sm px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-transparent transition"
          />
        </div>
      </div>
    </section>
  );
}
