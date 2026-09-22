import { CloudRain, Sun, Wind, Waves } from 'lucide-react';
import { ALERTS, type Severity } from '../lib/mockData';
import { COLORS } from '../lib/theme';

const ICONS: Record<string, typeof CloudRain> = {
  'konkan-rain': CloudRain,
  'deccan-heat': Sun,
  'bob-wind': Wind,
  'ne-flood': Waves,
};

const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  watch: { label: 'Watch', color: COLORS.watch },
  warning: { label: 'Warning', color: COLORS.warning },
  severe: { label: 'Severe', color: COLORS.critical },
};

export default function AlertsPanel() {
  return (
    <div className="panel alerts-panel">
      <div className="panel-head">
        <h3>Extreme Weather Guidance</h3>
        <p className="panel-sub">Derived from blended-model exceedance thresholds</p>
      </div>
      <ul className="alerts-list">
        {ALERTS.map((a) => {
          const Icon = ICONS[a.id] ?? CloudRain;
          const sev = SEVERITY_META[a.severity];
          return (
            <li className="alert-row" key={a.id}>
              <Icon size={16} strokeWidth={1.6} className="alert-row-icon" />
              <div className="alert-row-body">
                <div className="alert-row-top">
                  <span className="alert-row-title">{a.title}</span>
                  <span className="severity-tag">
                    <span className="severity-tag-dot" style={{ background: sev.color }} />
                    <span style={{ color: sev.color }}>{sev.label}</span>
                  </span>
                </div>
                <div className="alert-row-region">{a.region}</div>
                <div className="alert-row-detail">{a.detail}</div>
              </div>
              <div className="alert-row-meta">
                <div className="alert-row-confidence mono">{a.confidence}%</div>
                <div className="alert-row-window">{a.window}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
