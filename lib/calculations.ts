import type {
  Comparable,
  HomogenizationCoefs,
  SurfaceCoefs,
} from "./types";

// ─── Surface homogenization ───────────────────────────────────────────────────
export function calcSupHomogeneizada(
  supCub: number,
  supSemi: number,
  supDesc: number,
  supBalcon: number,
  coefs: SurfaceCoefs
): number {
  return (
    supCub * coefs.cubierta +
    supSemi * coefs.semicubierta +
    supDesc * coefs.descubierta +
    supBalcon * coefs.balcon
  );
}

// ─── Value per m² of a comparable ────────────────────────────────────────────
export function calcValorM2(
  precio: number,
  supHomogeneizada: number
): number {
  if (supHomogeneizada === 0) return 0;
  return precio / supHomogeneizada;
}

// ─── Total homogenization coefficient: fixed 10 × all custom coefs ───────────
export function calcCoefTotal(
  coefs: HomogenizationCoefs,
  customCoefs: Record<string, number> = {}
): number {
  const base =
    coefs.ubicacion *
    coefs.calidad *
    coefs.antiguedad *
    coefs.mantenimiento *
    coefs.ubEdificio *
    coefs.comodidades *
    coefs.humedadSeco *
    coefs.piso *
    coefs.superficie *
    coefs.coefOferta;

  const custom = Object.values(customCoefs).reduce((acc, v) => acc * v, 1);
  return base * custom;
}

// ─── Homogenized unit market value ───────────────────────────────────────────
export function calcVUM(valorM2: number, coefTotal: number): number {
  return valorM2 * coefTotal;
}

// ─── Average VUM — only valid comparables (precio > 0 AND supHom > 0) ────────
export function calcVUMPromedio(
  comparables: Comparable[],
  surfaceCoefs: SurfaceCoefs
): number {
  const validos = comparables.filter((c) => {
    if (c.precio <= 0) return false;
    const supBalcon = Math.max(0, c.supTotal - c.supCubierta);
    const supHom = calcSupHomogeneizada(
      c.supCubierta,
      0,
      0,
      supBalcon,
      surfaceCoefs
    );
    return supHom > 0;
  });

  if (validos.length === 0) return 0;

  const sumaVUM = validos.reduce((sum, c) => {
    const supBalcon = Math.max(0, c.supTotal - c.supCubierta);
    const supHom = calcSupHomogeneizada(
      c.supCubierta,
      0,
      0,
      supBalcon,
      surfaceCoefs
    );
    const precioSinCochera = Math.max(0, c.precio - c.cochera);
    const valorM2 = calcValorM2(precioSinCochera, supHom);
    const coefTotal = calcCoefTotal(c.coefs, c.customCoefs);
    return sum + calcVUM(valorM2, coefTotal);
  }, 0);

  return sumaVUM / validos.length;
}

// ─── Total property value ─────────────────────────────────────────────────────
export function calcValorTotal(
  vumPromedio: number,
  supHomInmueble: number,
  cochera: number = 0
): number {
  return vumPromedio * supHomInmueble + cochera;
}

// ─── Number formatter (en-US: 1,234.56) ──────────────────────────────────────
export function formatNumber(value: number, decimals = 2): string {
  if (!isFinite(value) || isNaN(value)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ─── Derived values for a single comparable ───────────────────────────────────
export function calcComparableDerived(
  c: Comparable,
  surfaceCoefs: SurfaceCoefs
) {
  const supBalcon = Math.max(0, c.supTotal - c.supCubierta);
  const supHom = calcSupHomogeneizada(
    c.supCubierta,
    0,
    0,
    supBalcon,
    surfaceCoefs
  );
  const precioSinCochera = Math.max(0, c.precio - c.cochera);
  const valorM2 = calcValorM2(precioSinCochera, supHom);
  const coefTotal = calcCoefTotal(c.coefs, c.customCoefs);
  const vum = calcVUM(valorM2, coefTotal);
  return { supHom, valorM2, coefTotal, vum };
}
