import { TrendingDown, TriangleAlert, Layers, Satellite } from 'lucide-react';
import { KPI_DATA } from '../lib/mockData';

interface Kpi {
  icon: typeof TrendingDown;
  label: string;
  value: string;
  sub: string;
}

const KPIS: Kpi[] = [
  {
    icon: TrendingDown,
    label: 'Skill Improvement',
    value: `-${KPI_DATA.skillImprovement.toFixed(1)}%`,
    sub: 'MAE vs. best single source',
  },
  {
    icon: TriangleAlert,
    label: 'Active Extreme Alerts',
    value: String(KPI_DATA.activeAlerts),
    sub: 'watch / warning / severe',
  },
  {
    icon: Layers,
    label: 'Sources Blended',
    value: String(KPI_DATA.sourcesBlended),
    sub: 'HRES + ENS + AIFS',
  },
  {
    icon: Satellite,
    label: 'Grid Coverage',
    value: `${KPI_DATA.coveragePct.toFixed(1)}%`,
    sub: 'of India domain, 0.1°',
  },
];

export default function KpiRow() {
  return (
    <div className="kpi-row">
      {KPIS.map((k) => {
        const Icon = k.icon;
        return (
          <div className="kpi-tile" key={k.label}>
            <div className="kpi-tile-head">
              <Icon size={14} strokeWidth={1.75} className="kpi-tile-icon" />
              <span className="kpi-tile-label">{k.label}</span>
            </div>
            <div className="kpi-tile-value">{k.value}</div>
            <div className="kpi-tile-sub">{k.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
