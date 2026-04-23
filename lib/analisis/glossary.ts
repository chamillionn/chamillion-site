/**
 * Glossary of terms used across analysis pages. Keyed by slug.
 * Used by <Term slug="..."> to render inline tooltips with definitions.
 * Add new entries here as new analyses introduce new jargon.
 */

export type GlossaryCategory =
  | "model"
  | "market"
  | "climate"
  | "stats"
  | "data"
  | "finance";

export interface GlossaryEntry {
  /** Short symbol (e.g. "GFS") */
  term: string;
  /** Full name expansion if different from term */
  full?: string;
  /** One to two line definition */
  def: string;
  /** Optional longer explanation */
  long?: string;
  /** Canonical source URL for attribution/further reading */
  sourceUrl?: string;
  /** Human-readable source name */
  sourceName?: string;
  category?: GlossaryCategory;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ── Weather models ──
  gfs: {
    term: "GFS",
    full: "Global Forecast System",
    def: "Modelo determinista global de NOAA, resolución 13km, runs cada 6h.",
    long: "Base numérica de muchos forecasts comerciales. Cubre precipitación, temperatura, viento y más, con alcance de 16 días.",
    sourceUrl: "https://www.nco.ncep.noaa.gov/pmb/products/gfs/",
    sourceName: "NOAA NCEP",
    category: "model",
  },
  ecmwf: {
    term: "ECMWF IFS",
    full: "Integrated Forecasting System",
    def: "Modelo europeo considerado el más skillful globalmente, resolución ~9km.",
    long: "Operado por el European Centre for Medium-Range Weather Forecasts. Habitualmente gana benchmarks de skill en plazos medios (3-10 días).",
    sourceUrl: "https://www.ecmwf.int/en/forecasts",
    sourceName: "ECMWF",
    category: "model",
  },
  gem: {
    term: "GEM",
    full: "Global Environmental Multiscale",
    def: "Modelo determinista global del servicio meteorológico canadiense.",
    sourceUrl: "https://weather.gc.ca/model_forecast/index_e.html",
    sourceName: "Environment Canada",
    category: "model",
  },
  jma: {
    term: "JMA GSM",
    full: "Global Spectral Model",
    def: "Modelo determinista global de la Agencia Meteorológica de Japón.",
    sourceUrl: "https://www.jma.go.jp/jma/en/Activities/nwp.html",
    sourceName: "JMA",
    category: "model",
  },
  kma: {
    term: "KMA",
    full: "Korea Meteorological Administration",
    def: "Servicio meteorológico oficial de Corea del Sur — fuente de resolución de este mercado.",
    sourceUrl: "https://data.kma.go.kr/",
    sourceName: "KMA Open Data Portal",
    category: "data",
  },
  "kma-108": {
    term: "KMA-108",
    full: "KMA station 108 — Seoul",
    def: "Estación meteorológica principal de Seúl. Dato de precipitación mensual aquí = resolución del mercado.",
    sourceUrl: "https://data.kma.go.kr/climate/RankState/selectRankStatisticsDivisionList.do",
    sourceName: "KMA climate ranking",
    category: "data",
  },
  ensemble: {
    term: "ensemble",
    def: "Conjunto de corridas del mismo modelo con perturbaciones iniciales, capturando incertidumbre del forecast.",
    long: "GFS corre 30 miembros ensemble (GEFS), ECMWF corre 50 (IFS-ENS). La dispersión entre miembros se lee como probabilidad.",
    category: "model",
  },
  deterministic: {
    term: "determinista",
    def: "Una sola corrida del modelo sin perturbaciones. Un forecast por run, sin medida de incertidumbre.",
    category: "model",
  },
  "ensemble-member": {
    term: "miembro",
    def: "Una corrida individual del ensemble, con sus perturbaciones específicas. En GFS ensemble son 30.",
    category: "model",
  },
  "spaghetti-plot": {
    term: "spaghetti plot",
    def: "Visualización estándar de un ensemble: cada miembro es una línea, superpuestas.",
    long: "Cuanto más apretadas las líneas, más confianza en el forecast. Cuanto más dispersas, más incertidumbre.",
    category: "stats",
  },
  "precipitation-sum": {
    term: "precipitation_sum",
    def: "Precipitación acumulada en el período (mm). Variable estándar de Open-Meteo.",
    sourceUrl: "https://open-meteo.com/en/docs",
    sourceName: "Open-Meteo",
    category: "data",
  },

  // ── Climate ──
  enso: {
    term: "ENSO",
    full: "El Niño–Southern Oscillation",
    def: "Oscilación climática del Pacífico ecuatorial que modula el clima global.",
    long: "Tres fases: El Niño (cálida), La Niña (fría), Neutral. Impacto en Corea es fuerte en invierno, residual en primavera tardía.",
    sourceUrl: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml",
    sourceName: "NOAA CPC",
    category: "climate",
  },
  "la-nina": {
    term: "La Niña",
    def: "Fase fría de ENSO — anomalías negativas de SST en Pacífico ecuatorial. Abril 2026: en transición a neutral.",
    category: "climate",
  },
  "el-nino": {
    term: "El Niño",
    def: "Fase cálida de ENSO. Favorable para el desarrollo en Jun-Jul 2026 según IRI/NOAA.",
    category: "climate",
  },
  "climatological-normal": {
    term: "normal climatológico",
    def: "Media de 30 años usada como referencia climática. El período vigente actual es 1991–2020.",
    long: "Estándar OMM. Para Seúl abril: 74mm según normal 1991–2020 publicado por KMA.",
    category: "climate",
  },
  mtd: {
    term: "MTD",
    full: "month-to-date",
    def: "Acumulado desde el 1 del mes hasta la fecha actual.",
    category: "stats",
  },
  umbral: {
    term: "umbral",
    def: "El valor frontera a partir del cual el mercado cambia de resolución. En este caso, 40.0 mm.",
    long: "Si el cierre oficial es 40.0 mm exactos, el mercado va al bucket siguiente (40-45), no a <40. Importante para gestionar el riesgo de frontera.",
    category: "market",
  },

  // ── Markets ──
  polymarket: {
    term: "Polymarket",
    def: "Mercado de predicción on-chain (USDC, Polygon) donde se negocian contratos binarios.",
    sourceUrl: "https://polymarket.com/",
    sourceName: "Polymarket",
    category: "market",
  },
  bucket: {
    term: "bucket",
    def: "Rango de valores de una variable continua tratado como categoría independiente con YES/NO propios.",
    long: "Este mercado tiene 9 buckets (<40, 40-45, ..., 75+). Cada uno es un contrato binario separado.",
    category: "market",
  },
  "tie-break": {
    term: "tie-break",
    def: "Regla de resolución cuando el dato cae exactamente en la frontera entre dos buckets. Aquí: redondea al bucket SUPERIOR.",
    long: "Implicación práctica: un final de 40.0mm exactos NO resuelve el bucket '<40mm' — va al '40-45'.",
    category: "market",
  },
  "implied-probability": {
    term: "implied probability",
    def: "Probabilidad que el mercado asigna a un outcome, leída desde el precio (YES ask ≈ implied P).",
    long: "En un mercado eficiente, el precio YES debería igualar la probabilidad real. Spreads distorsionan esto.",
    category: "market",
  },
  orderbook: {
    term: "orderbook",
    def: "Lista de órdenes de compra (bids) y venta (asks) pendientes a distintos precios.",
    category: "market",
  },
  spread: {
    term: "spread",
    def: "Diferencia entre el mejor bid y el mejor ask. Mercados ilíquidos tienen spreads anchos.",
    category: "market",
  },
  slippage: {
    term: "slippage",
    def: "Diferencia entre el precio esperado y el precio real al ejecutar una orden grande en un libro delgado.",
    category: "market",
  },
  "yes-contract": {
    term: "YES contract",
    def: "Paga $1 si el outcome ocurre, $0 si no. El precio es lo que cuesta comprarlo.",
    category: "market",
  },
  "no-contract": {
    term: "NO contract",
    def: "Paga $1 si el outcome NO ocurre. Precio NO + precio YES ≈ $1 (más spread).",
    category: "market",
  },

  // ── Stats / finance ──
  ev: {
    term: "EV",
    full: "expected value",
    def: "Retorno promedio esperado ponderado por probabilidad. Positivo → trade rentable a largo plazo.",
    long: "Fórmula: EV = P(win) × payoff_win − P(loss) × cost_loss.",
    category: "finance",
  },
  roi: {
    term: "ROI",
    full: "return on investment",
    def: "Retorno porcentual sobre el capital desplegado. EV / capital_invertido.",
    category: "finance",
  },
  "base-rate": {
    term: "base rate",
    def: "Frecuencia histórica incondicional del outcome. Punto de partida antes de añadir información específica.",
    long: "En nuestro caso: 3/10 años recientes de April en Seúl terminaron bajo 40mm → base rate 30%.",
    category: "stats",
  },
  percentile: {
    term: "percentile",
    def: "Valor debajo del cual cae un porcentaje X% de los datos. P50 es la mediana.",
    category: "stats",
  },
  histogram: {
    term: "histograma",
    def: "Visualización de distribución: barras cuya altura es la frecuencia de valores en cada rango.",
    category: "stats",
  },
  hedge: {
    term: "hedge",
    def: "Posición secundaria que gana cuando la principal pierde, reduciendo variance del portfolio.",
    category: "finance",
  },
  "mispricing": {
    term: "mispricing",
    def: "Discrepancia entre el precio de mercado y el valor justo según tu modelo. Oportunidad.",
    category: "finance",
  },
  "break-even": {
    term: "break-even",
    def: "Probabilidad real a la que el trade deja de tener EV positivo. Debajo de ese umbral, pierde dinero esperado.",
    category: "finance",
  },
  notional: {
    term: "notional",
    def: "Tamaño nominal de una posición — capital comprometido antes de apalancamiento.",
    category: "finance",
  },
};
