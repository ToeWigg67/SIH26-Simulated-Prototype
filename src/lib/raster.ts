import { DOMAIN_BOUNDS, sampleTemperature, samplePrecip, sampleWind, sampleRisk, type ModeId, type VariableId } from './fields';
import { rampFor, rgbaTuple } from './colorScales';

// Full-globe equirectangular raster. Coarser than the old India-only crop
// (which was ~7px/degree) since the domain is now ~9x larger in area;
// 480x228 (~1.33px/degree) keeps canvas generation under ~100ms while still
// looking smooth once blurred by the browser's image scaling.
export const RASTER_WIDTH = 600;
export const RASTER_HEIGHT = 285;

// Leaflet's ImageOverlay projects only the image's NW/SE corners into Web
// Mercator screen space and then lets the browser stretch the bitmap
// linearly between them — it does NOT re-warp interior rows. So a source
// image sampled at plain equirectangular (linear-in-degrees) latitude steps
// ends up badly misplaced once stretched into Mercator space (a low-latitude
// feature like the Sahara can visibly land over Europe). The fix is to
// pre-warp: sample each output row at the latitude whose Web Mercator Y is
// linear in row-fraction, so the naive linear stretch Leaflet performs lands
// every row back at its true latitude.
function mercatorY(latDeg: number): number {
  const rad = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function inverseMercatorY(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

/** Builds an RGBA raster (as a canvas data URL) for the given variable+mode over DOMAIN_BOUNDS. */
export function buildFieldDataUrl(variable: VariableId, mode: ModeId): string {
  const canvas = document.createElement('canvas');
  canvas.width = RASTER_WIDTH;
  canvas.height = RASTER_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(RASTER_WIDTH, RASTER_HEIGHT);
  const ramp = rampFor(variable === 'wind' ? 'wind' : variable);

  const [[latMin, lonMin], [latMax, lonMax]] = DOMAIN_BOUNDS;
  const yTop = mercatorY(latMax);
  const yBottom = mercatorY(latMin);

  for (let py = 0; py < RASTER_HEIGHT; py++) {
    // image row 0 = north (latMax); pre-warped to Mercator-linear spacing (see above).
    const f = py / (RASTER_HEIGHT - 1);
    const y = yTop - f * (yTop - yBottom);
    const lat = inverseMercatorY(y);
    for (let px = 0; px < RASTER_WIDTH; px++) {
      const lon = lonMin + (px / (RASTER_WIDTH - 1)) * (lonMax - lonMin);
      // Opacity is kept low enough that country borders and city labels in
      // the labels pane above this layer stay legible at all times.
      let value: number;
      let alpha = 0.52;
      if (variable === 'temperature') {
        value = sampleTemperature(lat, lon, mode);
      } else if (variable === 'precip') {
        value = samplePrecip(lat, lon, mode);
        alpha = Math.min(0.68, Math.max(0, (value - 0.5) / 8) * 0.68);
      } else if (variable === 'wind') {
        value = sampleWind(lat, lon, mode).speed;
        alpha = 0.42;
      } else {
        value = sampleRisk(lat, lon, mode);
        alpha = Math.min(0.6, Math.max(0, (value - 8) / 40) * 0.6);
      }
      const [r, g, b, a] = rgbaTuple(ramp, value, alpha);
      const idx = (py * RASTER_WIDTH + px) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

export function valueAt(variable: VariableId, mode: ModeId, lat: number, lon: number): number {
  if (variable === 'temperature') return sampleTemperature(lat, lon, mode);
  if (variable === 'precip') return samplePrecip(lat, lon, mode);
  if (variable === 'wind') return sampleWind(lat, lon, mode).speed;
  return sampleRisk(lat, lon, mode);
}
