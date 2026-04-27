"use client";

import React, { useReducer } from "react";
import type { AppAction, AppState } from "@/lib/types";
import { INITIAL_STATE, PROPERTY_TYPE_COEF_PRESETS, createEmptyComparable } from "@/lib/types";
import { calcVUMPromedio, calcSupHomogeneizada } from "@/lib/calculations";
import { Header } from "@/components/Header";
import { PropertyForm } from "@/components/PropertyForm";
import { ParametrosPanel } from "@/components/ParametrosPanel";
import { ComparableCard } from "@/components/ComparableCard";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ResultPanel } from "@/components/ResultPanel";

const MAX_COMPARABLES = 10;

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "UPDATE_PROPERTY":
      return { ...state, property: { ...state.property, ...action.payload } };

    case "UPDATE_SURFACE_COEFS":
      return {
        ...state,
        property: {
          ...state.property,
          surfaceCoefs: { ...state.property.surfaceCoefs, ...action.payload },
        },
      };

    case "ADD_COMPARABLE":
      if (state.comparables.length >= MAX_COMPARABLES) return state;
      return {
        ...state,
        comparables: [
          ...state.comparables,
          createEmptyComparable(crypto.randomUUID(), state.customCoefDefs),
        ],
      };

    case "REMOVE_COMPARABLE":
      return {
        ...state,
        comparables: state.comparables.filter((c) => c.id !== action.id),
      };

    case "UPDATE_COMPARABLE":
      return {
        ...state,
        comparables: state.comparables.map((c) =>
          c.id === action.id ? { ...c, ...action.payload } : c
        ),
      };

    case "UPDATE_COMPARABLE_CUSTOM_COEF":
      return {
        ...state,
        comparables: state.comparables.map((c) =>
          c.id === action.id
            ? { ...c, customCoefs: { ...c.customCoefs, [action.coefId]: action.value } }
            : c
        ),
      };

    case "SET_COCHERA":
      return { ...state, cochera: action.value };

    case "TOGGLE_PARAMETROS":
      return { ...state, showParametros: !state.showParametros };

    case "TOGGLE_COMPARABLE_COEFS":
      return {
        ...state,
        comparables: state.comparables.map((c) =>
          c.id === action.id ? { ...c, showCoefs: !c.showCoefs } : c
        ),
      };

    case "ADD_CUSTOM_COEF": {
      const newDef = { id: crypto.randomUUID(), label: action.label };
      return {
        ...state,
        customCoefDefs: [...state.customCoefDefs, newDef],
        // Add default value 1.0 to all existing comparables
        comparables: state.comparables.map((c) => ({
          ...c,
          customCoefs: { ...c.customCoefs, [newDef.id]: 1.0 },
        })),
      };
    }

    case "REMOVE_CUSTOM_COEF":
      return {
        ...state,
        customCoefDefs: state.customCoefDefs.filter((d) => d.id !== action.id),
        comparables: state.comparables.map((c) => {
          const newCustomCoefs = { ...c.customCoefs };
          delete newCustomCoefs[action.id];
          return { ...c, customCoefs: newCustomCoefs };
        }),
      };

    case "SET_PROPERTY_TYPE": {
      const newDefs = PROPERTY_TYPE_COEF_PRESETS[action.propertyType];
      const defaultCoefs: Record<string, number> = {};
      for (const def of newDefs) defaultCoefs[def.id] = 1.0;
      return {
        ...state,
        propertyType: action.propertyType,
        customCoefDefs: newDefs,
        comparables: state.comparables.map((c) => ({
          ...c,
          coefOferta: 1.0,
          customCoefs: { ...defaultCoefs },
        })),
      };
    }

    default:
      return state;
  }
}

export default function SimuladorPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [exportingPDF, setExportingPDF] = React.useState(false);

  async function handleExportPDF() {
    setExportingPDF(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property,
          comparables,
          customCoefDefs,
          propertyType,
          supHomInmueble,
          vumAverage,
          cochera,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasacion-${property.address || "informe"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPDF(false);
    }
  }
  const { property, comparables, cochera, showParametros, customCoefDefs, propertyType } = state;

  const supHomInmueble = calcSupHomogeneizada(
    property.supCubierta,
    property.supSemiCubierta,
    property.supDescubierta,
    property.supBalcon,
    property.surfaceCoefs
  );

  const vumAverage = calcVUMPromedio(comparables, property.surfaceCoefs);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Site header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-7 h-7 bg-brand-800 rounded-md flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1
              className="text-base font-semibold text-brand-950 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Simulador de Tasación
            </h1>
            <p className="text-xs text-neutral-400">Análisis Comparativo de Mercado</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {comparables.length > 0 && (
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-brand-950 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {exportingPDF ? "Generando..." : "Exportar PDF"}
              </button>
            )}
            <span className="text-xs font-medium text-neutral-400 tracking-wider uppercase">
              Team Scaglia
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Section 1: Header data */}
        <Header property={property} propertyType={propertyType} dispatch={dispatch} />

        {/* Section 2: Global parameters (collapsible) */}
        <ParametrosPanel
          surfaceCoefs={property.surfaceCoefs}
          customCoefDefs={customCoefDefs}
          show={showParametros}
          dispatch={dispatch}
        />

        {/* Section 3: Property surfaces */}
        <PropertyForm
          property={property}
          supHomInmueble={supHomInmueble}
          dispatch={dispatch}
        />

        {/* Section 4: Comparables */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-brand-950">Comparables</h2>
              {comparables.length > 0 && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  {comparables.length} de {MAX_COMPARABLES} cargados
                </p>
              )}
            </div>
            <button
              onClick={() => dispatch({ type: "ADD_COMPARABLE" })}
              disabled={comparables.length >= MAX_COMPARABLES}
              className="flex items-center gap-2 px-4 py-2 bg-brand-950 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              Agregar comparable
            </button>
          </div>

          {comparables.length === 0 && (
            <div className="text-center py-14 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-9 h-9 mx-auto mb-3 text-neutral-300"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <p className="text-sm text-neutral-400">
                Agregá comparables para comenzar la tasación.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {comparables.map((comparable, index) => (
              <ComparableCard
                key={comparable.id}
                comparable={comparable}
                index={index}
                vumAverage={vumAverage}
                surfaceCoefs={property.surfaceCoefs}
                customCoefDefs={customCoefDefs}
                dispatch={dispatch}
              />
            ))}
          </div>
        </section>

        {/* Section 5: Comparison table */}
        {comparables.length > 0 && (
          <ComparisonTable
            property={property}
            supHomInmueble={supHomInmueble}
            comparables={comparables}
            surfaceCoefs={property.surfaceCoefs}
          />
        )}

        {/* Section 6: Results */}
        {comparables.length > 0 && (
          <ResultPanel
            comparables={comparables}
            supHomInmueble={supHomInmueble}
            surfaceCoefs={property.surfaceCoefs}
            cochera={cochera}
            vumAverage={vumAverage}
            dispatch={dispatch}
          />
        )}

        <p className="text-xs text-neutral-400 leading-relaxed pb-8">
          Los coeficientes de homogeneización representan cómo es el inmueble
          tasado con respecto a cada comparable: =1 equivalente, &gt;1 el tasado
          es superior al comparable, &lt;1 el tasado es inferior al comparable.
        </p>
      </main>
    </div>
  );
}
