import { rampFor, VARIABLE_UNITS, VARIABLE_LABELS } from '../../lib/colorScales';
import type { VariableId } from '../../lib/fields';

const TICKS: Record<VariableId, number[]> = {
  temperature: [-10, 0, 8, 16, 22, 27, 32, 38, 45],
  precip: [0, 8, 20, 40, 65, 95, 140],
  wind: [0, 3, 7, 12, 18, 25, 33, 45],
  risk: [0, 20, 40, 60, 80, 100],
};

export default function MapLegend({ variable }: { variable: VariableId }) {
  const ramp = rampFor(variable);
  const min = ramp[0].stop;
  const max = ramp[ramp.length - 1].stop;
  const gradientStops = ramp
    .map((s) => {
      const pct = ((s.stop - min) / (max - min)) * 100;
      return `rgb(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]}) ${pct.toFixed(1)}%`;
    })
    .join(', ');

  return (
    <div className="map-legend">
      <div className="map-legend-title">
        {VARIABLE_LABELS[variable]}
        <span className="map-legend-unit">{VARIABLE_UNITS[variable]}</span>
      </div>
      <div className="map-legend-bar" style={{ background: `linear-gradient(90deg, ${gradientStops})` }} />
      <div className="map-legend-ticks">
        {TICKS[variable].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
