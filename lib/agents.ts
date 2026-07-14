// Registro de agentes y su plantilla de PDF (ACM).
// Cada agente tiene su plantilla (13 páginas, 1440×810) y un "layout" que
// describe qué se estampa y dónde. Coordenadas en pts pdf-lib (origen abajo-izq).

export interface Box {
  pageIndex: number; // 0-based
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AcmLayout {
  pageW: number;
  pageH: number;
  comparativoPageIndex: number; // cuadro comparativo
  coeficientesPageIndex: number; // cuadro de análisis / coeficientes
  priceBox: Box; // recuadro donde va el valor de comercialización (texto blanco)
  addressBox?: Box; // recuadro donde va la dirección (texto blanco) — opcional
  photoBox?: Box; // área donde va la foto del inmueble — opcional
}

export interface AgentProfile {
  id: string;
  name: string;
  /** Nombre del archivo dentro de /plantillas-acm */
  template: string;
  layout: AcmLayout;
}

const BASE = { pageW: 1440, pageH: 810, comparativoPageIndex: 6, coeficientesPageIndex: 7 };

// Layout compartido: dirección en portada (pág 1) + foto y precio en pág 9.
const LAYOUT_PORTADA_FOTO: AcmLayout = {
  ...BASE,
  addressBox: { pageIndex: 0, x: 313, y: 237, width: 796, height: 131 },
  priceBox: { pageIndex: 8, x: 489, y: 169, width: 461, height: 83 },
  photoBox: { pageIndex: 8, x: 430, y: 330, width: 580, height: 420 },
};

export const AGENTS: AgentProfile[] = [
  {
    id: "giuliano-larroca",
    name: "Giuliano Larroca",
    template: "acm-giuliano-larroca.pdf",
    layout: {
      ...BASE,
      priceBox: { pageIndex: 8, x: 304, y: 263, width: 832, height: 243 },
    },
  },
  {
    id: "cecilia-paul",
    name: "Cecilia Paul",
    template: "acm-cecilia-paul.pdf",
    layout: LAYOUT_PORTADA_FOTO,
  },
  {
    id: "luciano-perez",
    name: "Luciano Perez",
    template: "acm-luciano-perez.pdf",
    layout: LAYOUT_PORTADA_FOTO,
  },
  // Próximos agentes: agregar acá con su PDF en /plantillas-acm y su layout
];

export const DEFAULT_AGENT_ID = AGENTS[0].id;

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .toLowerCase()
    .trim();
}

export function getAgent(id: string | undefined | null): AgentProfile {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}

/** Resuelve el agente por el texto del campo "Agente" (nombre). Cae al default. */
export function getAgentByName(name: string | undefined | null): AgentProfile {
  const n = normalize(name ?? "");
  if (!n) return AGENTS[0];
  return AGENTS.find((a) => normalize(a.name) === n) ?? AGENTS[0];
}
