import { Thermometer, Wind, CloudRain, TriangleAlert } from 'lucide-react';
import { MODE_META, MODE_ORDER } from '../../lib/theme';
import type { ModeId } from '../../lib/fields';
import type { VariableId } from '../../lib/fields';

const VARIABLES: { id: VariableId; label: string; icon: typeof Thermometer }[] = [
  { id: 'temperature', label: 'Temperature', icon: Thermometer },
  { id: 'wind', label: 'Wind', icon: Wind },
  { id: 'precip', label: 'Precipitation', icon: CloudRain },
  { id: 'risk', label: 'Extreme Risk', icon: TriangleAlert },
];

interface Props {
  variable: VariableId;
  mode: ModeId;
  onVariable: (v: VariableId) => void;
  onMode: (m: ModeId) => void;
}

export default function MapControls({ variable, mode, onVariable, onMode }: Props) {
  return (
    <>
      <div className="map-ctrl map-ctrl-variables">
        {VARIABLES.map((v) => {
          const Icon = v.icon;
          const active = v.id === variable;
          return (
            <button
              key={v.id}
              className={`map-ctrl-icon-btn${active ? ' is-active' : ''}`}
              onClick={() => onVariable(v.id)}
              title={v.label}
              aria-label={v.label}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      <div className="map-ctrl map-ctrl-modes">
        {MODE_ORDER.map((m) => {
          const meta = MODE_META[m];
          const active = m === mode;
          return (
            <button
              key={m}
              className={`map-ctrl-mode-btn${active ? ' is-active' : ''}`}
              style={active ? { color: meta.color, borderBottomColor: meta.color } : undefined}
              onClick={() => onMode(m)}
              title={meta.full}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
