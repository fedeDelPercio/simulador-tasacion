// Registro de agentes y su plantilla de PDF (ACM).
// Todas las plantillas comparten la misma estructura (13 páginas, 1440×810),
// solo cambia el branding. Por eso las coordenadas de estampado son comunes.

export interface AgentProfile {
  id: string;
  name: string;
  /** Nombre del archivo dentro de /plantillas-acm */
  template: string;
}

export const AGENTS: AgentProfile[] = [
  {
    id: "giuliano-larroca",
    name: "Giuliano Larroca",
    template: "acm-giuliano-larroca.pdf",
  },
  // Próximos agentes: agregar acá con su PDF en /plantillas-acm
];

export const DEFAULT_AGENT_ID = AGENTS[0].id;

export function getAgent(id: string | undefined | null): AgentProfile {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}

// ── Coordenadas de estampado (comunes a todas las plantillas) ────────────────
// Índices de página (0-based) donde va cada cosa.
export const ACM_LAYOUT = {
  pageW: 1440,
  pageH: 810,
  comparativoPageIndex: 6, // página 7
  coeficientesPageIndex: 7, // página 8
  precioPageIndex: 8, // página 9
  // Recuadro navy de la página 9 (coords pdf-lib, origen abajo-izquierda)
  precioBox: { x: 304, y: 263, width: 832, height: 243 },
} as const;
