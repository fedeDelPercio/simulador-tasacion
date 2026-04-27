// ─── Surface weighting coefficients ─────────────────────────────────────────
export interface SurfaceCoefs {
  cubierta: number;
  semicubierta: number;
  descubierta: number;
  balcon: number;
}

// ─── Custom homogenization coefficient definition (global, agent-defined) ────
export interface CustomCoefDef {
  id: string;
  label: string;
}

// ─── Property types ──────────────────────────────────────────────────────────
export type PropertyType = "departamento" | "ph" | "casa" | "casa_bc" | "local";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  departamento: "Departamento",
  casa: "Casa",
  casa_bc: "Casa Barrio Cerrado",
  ph: "PH",
  local: "Local Comercial",
};

function makePreset(prefix: string, labels: string[]): CustomCoefDef[] {
  return labels.map((label, i) => ({ id: `${prefix}_${i}`, label }));
}

export const PROPERTY_TYPE_COEF_PRESETS: Record<PropertyType, CustomCoefDef[]> = {
  departamento: makePreset("dep", [
    "Ubicación", "Antigüedad", "Calidad", "Mantenimiento",
    "Ub. Edificio", "Distribución", "Hum/Seco", "Comodidades",
    "Piso", "Superficie",
  ]),
  ph: makePreset("ph", [
    "Ubicación", "Antigüedad", "Calidad", "Mantenimiento",
    "Ub. En Lote", "Distribución", "Hum/Seco", "Comodidad",
    "Esp. Libre", "Superficie", "Entrada", "Linderos",
  ]),
  casa: makePreset("casa", [
    "Ubicación", "Antigüedad", "Calidad", "Mantenimiento",
    "Esp. Libre", "Distribución", "Hum/Seco", "Comodidad",
    "Lote", "Superficie", "Luminosidad", "Linderos",
  ]),
  casa_bc: makePreset("bc", [
    "Ub. Lote", "Antigüedad", "Calidad", "Mantenimiento",
    "Esp. Libre", "Distribución", "Hum/Seco", "Comodidad",
    "Tipo Lote", "Sup. Cubierta", "Orientación", "Linderos",
  ]),
  local: makePreset("loc", [
    "Ubicación", "Antigüedad", "Calidad", "Mantenimiento",
    "Esp. Libre", "Distribución", "Hum/Seco", "Utilidad",
    "Vidriera", "Superficie", "Ub. Cuadra", "PH",
  ]),
};

// ─── A single comparable property ────────────────────────────────────────────
export interface Comparable {
  id: string;
  ubicacion: string;
  link: string;
  supCubierta: number;
  supSemiCubierta: number;
  supDescubierta: number;
  supBalcon: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  precio: number;
  cochera: number;
  coefOferta: number;
  customCoefs: Record<string, number>; // keyed by CustomCoefDef.id
  showCoefs: boolean;
}

// ─── The property being appraised ────────────────────────────────────────────
export interface PropertyData {
  address: string;
  agent: string;
  date: string;
  link: string;
  supCubierta: number;
  supSemiCubierta: number;
  supDescubierta: number;
  supBalcon: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  precio: number;
  cochera: number;
  surfaceCoefs: SurfaceCoefs;
}

// ─── App state ───────────────────────────────────────────────────────────────
export interface AppState {
  property: PropertyData;
  comparables: Comparable[];
  cochera: number;
  showParametros: boolean;
  customCoefDefs: CustomCoefDef[];
  propertyType: PropertyType;
}

// ─── Actions ─────────────────────────────────────────────────────────────────
export type AppAction =
  | { type: "UPDATE_PROPERTY"; payload: Partial<PropertyData> }
  | { type: "UPDATE_SURFACE_COEFS"; payload: Partial<SurfaceCoefs> }
  | { type: "ADD_COMPARABLE" }
  | { type: "REMOVE_COMPARABLE"; id: string }
  | { type: "UPDATE_COMPARABLE"; id: string; payload: Partial<Comparable> }
  | { type: "UPDATE_COMPARABLE_CUSTOM_COEF"; id: string; coefId: string; value: number }
  | { type: "SET_COCHERA"; value: number }
  | { type: "TOGGLE_PARAMETROS" }
  | { type: "TOGGLE_COMPARABLE_COEFS"; id: string }
  | { type: "ADD_CUSTOM_COEF"; label: string }
  | { type: "REMOVE_CUSTOM_COEF"; id: string }
  | { type: "SET_PROPERTY_TYPE"; propertyType: PropertyType };

// ─── Defaults ────────────────────────────────────────────────────────────────
export const DEFAULT_SURFACE_COEFS: SurfaceCoefs = {
  cubierta: 1.0,
  semicubierta: 0.5,
  descubierta: 0.2,
  balcon: 0.33,
};

export const TODAY_ISO = new Date().toISOString().split("T")[0];

export function createEmptyComparable(
  id: string,
  customCoefDefs: CustomCoefDef[] = []
): Comparable {
  const customCoefs: Record<string, number> = {};
  for (const def of customCoefDefs) customCoefs[def.id] = 1.0;
  return {
    id,
    ubicacion: "",
    link: "",
    supCubierta: 0,
    supSemiCubierta: 0,
    supDescubierta: 0,
    supBalcon: 0,
    ambientes: 0,
    dormitorios: 0,
    banos: 0,
    precio: 0,
    cochera: 0,
    coefOferta: 1.0,
    customCoefs,
    showCoefs: false,
  };
}

const INITIAL_PROPERTY_TYPE: PropertyType = "departamento";

export const INITIAL_STATE: AppState = {
  property: {
    address: "",
    agent: "",
    date: TODAY_ISO,
    link: "",
    supCubierta: 0,
    supSemiCubierta: 0,
    supDescubierta: 0,
    supBalcon: 0,
    ambientes: 0,
    dormitorios: 0,
    banos: 0,
    precio: 0,
    cochera: 0,
    surfaceCoefs: { ...DEFAULT_SURFACE_COEFS },
  },
  comparables: [],
  cochera: 0,
  showParametros: false,
  customCoefDefs: [...PROPERTY_TYPE_COEF_PRESETS[INITIAL_PROPERTY_TYPE]],
  propertyType: INITIAL_PROPERTY_TYPE,
};
