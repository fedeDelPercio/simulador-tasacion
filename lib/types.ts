// ─── Surface weighting coefficients ─────────────────────────────────────────
export interface SurfaceCoefs {
  cubierta: number;
  semicubierta: number;
  descubierta: number;
  balcon: number;
}

// ─── Homogenization coefficients (fixed set, one per comparable) ──────────────
export interface HomogenizationCoefs {
  ubicacion: number;
  calidad: number;
  antiguedad: number;
  mantenimiento: number;
  ubEdificio: number;
  comodidades: number;
  humedadSeco: number;
  piso: number;
  superficie: number;
  coefOferta: number;
}

// ─── Custom homogenization coefficient definition (global, agent-defined) ────
export interface CustomCoefDef {
  id: string;
  label: string;
}

// ─── A single comparable property ────────────────────────────────────────────
export interface Comparable {
  id: string;
  ubicacion: string;
  link: string;
  supTotal: number;
  supCubierta: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  precio: number;
  cochera: number;
  coefs: HomogenizationCoefs;
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
}

// ─── Actions ─────────────────────────────────────────────────────────────────
export type AppAction =
  | { type: "UPDATE_PROPERTY"; payload: Partial<PropertyData> }
  | { type: "UPDATE_SURFACE_COEFS"; payload: Partial<SurfaceCoefs> }
  | { type: "ADD_COMPARABLE" }
  | { type: "REMOVE_COMPARABLE"; id: string }
  | { type: "UPDATE_COMPARABLE"; id: string; payload: Partial<Comparable> }
  | {
      type: "UPDATE_COMPARABLE_COEF";
      id: string;
      coef: keyof HomogenizationCoefs;
      value: number;
    }
  | { type: "UPDATE_COMPARABLE_CUSTOM_COEF"; id: string; coefId: string; value: number }
  | { type: "SET_COCHERA"; value: number }
  | { type: "TOGGLE_PARAMETROS" }
  | { type: "TOGGLE_COMPARABLE_COEFS"; id: string }
  | { type: "ADD_CUSTOM_COEF"; label: string }
  | { type: "REMOVE_CUSTOM_COEF"; id: string };

// ─── Defaults ────────────────────────────────────────────────────────────────
export const DEFAULT_SURFACE_COEFS: SurfaceCoefs = {
  cubierta: 1.0,
  semicubierta: 0.5,
  descubierta: 0.2,
  balcon: 0.33,
};

export const DEFAULT_HOMOGENIZATION_COEFS: HomogenizationCoefs = {
  ubicacion: 1.0,
  calidad: 1.0,
  antiguedad: 1.0,
  mantenimiento: 1.0,
  ubEdificio: 1.0,
  comodidades: 1.0,
  humedadSeco: 1.0,
  piso: 1.0,
  superficie: 1.0,
  coefOferta: 1.0,
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
    supTotal: 0,
    supCubierta: 0,
    ambientes: 0,
    dormitorios: 0,
    banos: 0,
    precio: 0,
    cochera: 0,
    coefs: { ...DEFAULT_HOMOGENIZATION_COEFS },
    customCoefs,
    showCoefs: false,
  };
}

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
  customCoefDefs: [],
};

// ─── Label maps ──────────────────────────────────────────────────────────────
export const HOMOGENIZATION_COEF_LABELS: Record<keyof HomogenizationCoefs, string> = {
  ubicacion: "Ubicación",
  calidad: "Calidad",
  antiguedad: "Antigüedad",
  mantenimiento: "Mantenimiento",
  ubEdificio: "Ub. Edificio",
  comodidades: "Comodidades",
  humedadSeco: "Humedad/Seco",
  piso: "Piso",
  superficie: "Superficie",
  coefOferta: "Coef. Oferta",
};
