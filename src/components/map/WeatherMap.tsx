import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Pane } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import FieldOverlay from './FieldOverlay';
import WindParticleLayer from './WindParticleLayer';
import MapLegend from './MapLegend';
import MapControls from './MapControls';
import ClickReadout from './ClickReadout';
import { WORLD_CENTER, CYCLONE_CENTER } from '../../lib/fields';
import type { ModeId, VariableId } from '../../lib/fields';
import { MODE_META } from '../../lib/theme';

export default function WeatherMap() {
  const [variable, setVariable] = useState<VariableId>('temperature');
  const [mode, setMode] = useState<ModeId>('blended');

  return (
    <div className="weather-map-shell">
      <div className="map-header-row">
        <div>
          <h2>Global gridded forecast</h2>
          <p className="map-header-sub">
            Synthetic prototype domain covering the whole globe, with added regional detail for India and the Bay of Bengal.
          </p>
        </div>
        <div className="map-mode-badge" style={{ borderColor: MODE_META[mode].color, color: MODE_META[mode].color }}>
          {MODE_META[mode].full}
        </div>
      </div>

      <div className="weather-map-container">
        <MapContainer
          center={WORLD_CENTER}
          zoom={3}
          minZoom={2}
          maxZoom={9}
          style={{ height: '100%', width: '100%', background: '#0b0d0f' }}
          worldCopyJump
          preferCanvas
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community"
          />
          <FieldOverlay variable={variable} mode={mode} />
          <WindParticleLayer mode={mode} active={variable === 'wind'} />
          {/* Country names and borders render in their own pane, above the data
              raster and the wind particle canvas, so they stay legible no
              matter which variable or mode is active. */}
          <Pane name="labels" style={{ zIndex: 470, pointerEvents: 'none' }}>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              attribution=""
            />
          </Pane>
          <ClickReadout variable={variable} mode={mode} />
          <CircleMarker
            center={CYCLONE_CENTER}
            radius={5}
            pathOptions={{ color: '#e0793f', fillColor: '#e0793f', fillOpacity: 0.9, weight: 1.5 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              Bay of Bengal cyclonic circulation, 15.2°N 88.5°E
            </Tooltip>
          </CircleMarker>
        </MapContainer>

        <MapControls variable={variable} mode={mode} onVariable={setVariable} onMode={setMode} />
        <MapLegend variable={variable} />
      </div>
    </div>
  );
}
