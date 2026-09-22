export interface SkillEntry {
  key: string;
  label: string;
  mae: number;
  rmse: number;
  isOurs?: boolean;
}

// MAE/RMSE in degrees C-equivalent skill units for 2m temperature, lower is better.
export const SKILL_DATA: SkillEntry[] = [
  { key: 'clim', label: 'Climatology', mae: 2.86, rmse: 3.64 },
  { key: 'persist', label: 'Persistence', mae: 2.31, rmse: 3.02 },
  { key: 'hres', label: 'HRES', mae: 1.42, rmse: 1.88 },
  { key: 'ens', label: 'ENS Mean', mae: 1.35, rmse: 1.74 },
  { key: 'aifs', label: 'AIFS', mae: 1.29, rmse: 1.68 },
  { key: 'avg', label: 'Simple Average', mae: 1.18, rmse: 1.52 },
  { key: 'nnls', label: 'Static NNLS', mae: 1.05, rmse: 1.36 },
  { key: 'unet', label: 'U-Net Adaptive (ours)', mae: 0.79, rmse: 1.04, isOurs: true },
];

export type Severity = 'watch' | 'warning' | 'severe';

export interface AlertEntry {
  id: string;
  title: string;
  region: string;
  severity: Severity;
  confidence: number; // 0-100
  window: string;
  detail: string;
}

export const ALERTS: AlertEntry[] = [
  {
    id: 'konkan-rain',
    title: 'Heavy rainfall',
    region: 'Konkan coast, Maharashtra',
    severity: 'severe',
    confidence: 88,
    window: 'Next 24-36h',
    detail: 'Blended model shows 24h totals exceeding 120mm along the Western Ghats windward slope.',
  },
  {
    id: 'deccan-heat',
    title: 'Heatwave conditions',
    region: 'Deccan Plateau, interior peninsula',
    severity: 'warning',
    confidence: 74,
    window: 'Next 48h',
    detail: 'Sustained 2m temperatures above 42°C expected across the interior plateau.',
  },
  {
    id: 'bob-wind',
    title: 'High wind from cyclonic circulation',
    region: 'Bay of Bengal (central)',
    severity: 'severe',
    confidence: 81,
    window: 'Next 24h',
    detail: 'A tightening cyclonic circulation near 15°N 88.5°E is producing sustained winds above 90 km/h.',
  },
  {
    id: 'ne-flood',
    title: 'Flood risk in river catchments',
    region: 'North-East, Brahmaputra basin',
    severity: 'watch',
    confidence: 58,
    window: 'Next 72h',
    detail: 'Accumulated precipitation forcing elevated river-stage risk in low-lying catchments.',
  },
];

export interface PipelineStep {
  id: string;
  label: string;
  detail: string;
  status: 'done' | 'running' | 'pending';
  etaSec: number;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'pull-hres', label: 'Pull HRES', detail: 'ECMWF IFS-HRES 0.1° grib fetch', status: 'done', etaSec: 0 },
  { id: 'pull-ens', label: 'Pull ENS', detail: 'IFS-ENS 51-member fetch', status: 'done', etaSec: 0 },
  { id: 'pull-aifs', label: 'Pull AIFS', detail: 'AIFS 0.25° inference output', status: 'done', etaSec: 0 },
  { id: 'inference', label: 'Run Inference', detail: 'U-Net trust-weight blend', status: 'running', etaSec: 42 },
  { id: 'publish', label: 'Publish Blend', detail: 'Write blended grids to store', status: 'pending', etaSec: 0 },
];

export const KPI_DATA = {
  skillImprovement: 24.8, // % MAE reduction vs best single source
  activeAlerts: ALERTS.length,
  sourcesBlended: 3,
  coveragePct: 99.4,
};
