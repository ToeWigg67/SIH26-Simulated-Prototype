import { useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import { valueAt } from '../../lib/raster';
import { VARIABLE_UNITS, VARIABLE_LABELS } from '../../lib/colorScales';
import type { ModeId, VariableId } from '../../lib/fields';
import { X } from 'lucide-react';

interface Reading {
  lat: number;
  lon: number;
  value: number;
}

export default function ClickReadout({ variable, mode }: { variable: VariableId; mode: ModeId }) {
  const [reading, setReading] = useState<Reading | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const value = valueAt(variable, mode, lat, lng);
      setReading({ lat, lon: lng, value });
    },
  });

  if (!reading) return null;

  const latStr = `${Math.abs(reading.lat).toFixed(2)}°${reading.lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(reading.lon).toFixed(2)}°${reading.lon >= 0 ? 'E' : 'W'}`;

  return (
    <div className="map-readout">
      <button className="map-readout-close" onClick={() => setReading(null)} aria-label="Close">
        <X size={13} strokeWidth={2} />
      </button>
      <div className="map-readout-coords mono">{latStr} {lonStr}</div>
      <div className="map-readout-value mono">
        {reading.value.toFixed(1)}
        <span className="map-readout-unit">{VARIABLE_UNITS[variable]}</span>
      </div>
      <div className="map-readout-label">{VARIABLE_LABELS[variable]}</div>
    </div>
  );
}
