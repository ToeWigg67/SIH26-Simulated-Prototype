import { useEffect, useRef, useState } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { DOMAIN_BOUNDS } from '../../lib/fields';
import { buildFieldDataUrl } from '../../lib/raster';
import type { ModeId, VariableId } from '../../lib/fields';

interface Layer {
  id: number;
  url: string;
  opacity: number;
}

let counter = 0;

export default function FieldOverlay({ variable, mode }: { variable: VariableId; mode: ModeId }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    const url = buildFieldDataUrl(variable, mode);
    const id = ++counter;
    setLayers((prev) => [...prev.map((l) => ({ ...l, opacity: 0 })), { id, url, opacity: 0 }]);

    const t1 = window.setTimeout(() => {
      setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, opacity: 1 } : l)));
    }, 30);
    const t2 = window.setTimeout(() => {
      // Drop any older layers once the crossfade has finished; keep the current one.
      setLayers((prev) => prev.filter((l) => l.id === id));
    }, 520);
    timeouts.current.push(t1, t2);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable, mode]);

  // worldCopyJump lets the user pan continuously across the antimeridian into
  // repeated world copies; a single ImageOverlay only exists in the primary
  // copy, which would show as a hard vertical cutoff at +-180deg. Render the
  // same raster shifted a full turn either way so every copy the user can
  // scroll to still has data.
  const [[latMin, lonMin], [latMax, lonMax]] = DOMAIN_BOUNDS;
  const lonSpan = lonMax - lonMin;
  const worldOffsets = [-lonSpan, 0, lonSpan];

  return (
    <>
      {layers.map((l) =>
        worldOffsets.map((offset) => (
          <ImageOverlay
            key={`${l.id}-${offset}`}
            url={l.url}
            bounds={[
              [latMin, lonMin + offset],
              [latMax, lonMax + offset],
            ]}
            opacity={l.opacity}
            className="field-overlay-img"
          />
        )),
      )}
    </>
  );
}
