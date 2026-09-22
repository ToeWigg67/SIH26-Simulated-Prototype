// Meteorological color ramps following real-world conventions (NWS-style
// diverging temperature ramp, IMERG/radar-style precip ramp, speed-based wind
// ramp). Each ramp is a sorted list of [stop, [r,g,b]] control points; getColor
// linearly interpolates in RGB space between the nearest stops.

export type Ramp = { stop: number; rgb: [number, number, number] }[];

function interpolate(ramp: Ramp, value: number): [number, number, number] {
  if (value <= ramp[0].stop) return ramp[0].rgb;
  if (value >= ramp[ramp.length - 1].stop) return ramp[ramp.length - 1].rgb;
  for (let i = 0; i < ramp.length - 1; i++) {
    const a = ramp[i];
    const b = ramp[i + 1];
    if (value >= a.stop && value <= b.stop) {
      const t = (value - a.stop) / (b.stop - a.stop);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
      ];
    }
  }
  return ramp[ramp.length - 1].rgb;
}

// Diverging blue -> white -> red, NWS/ECMWF-style temperature ramp, in degrees C.
export const TEMPERATURE_RAMP: Ramp = [
  { stop: -10, rgb: [43, 44, 120] },
  { stop: 0, rgb: [55, 96, 178] },
  { stop: 8, rgb: [92, 152, 210] },
  { stop: 16, rgb: [163, 202, 222] },
  { stop: 22, rgb: [232, 236, 210] },
  { stop: 27, rgb: [247, 210, 130] },
  { stop: 32, rgb: [232, 150, 68] },
  { stop: 38, rgb: [206, 84, 51] },
  { stop: 45, rgb: [150, 30, 40] },
];

// Sequential precip ramp matching IMERG/radar conventions (mm/24h).
export const PRECIP_RAMP: Ramp = [
  { stop: 0, rgb: [12, 20, 34] }, // transparent-ish base handled via alpha
  { stop: 1, rgb: [64, 130, 200] },
  { stop: 8, rgb: [70, 175, 205] },
  { stop: 20, rgb: [86, 189, 110] },
  { stop: 40, rgb: [200, 210, 70] },
  { stop: 65, rgb: [232, 150, 45] },
  { stop: 95, rgb: [214, 60, 55] },
  { stop: 140, rgb: [163, 60, 180] },
];

// Wind speed ramp (m/s), light -> dark following common speed-color conventions.
export const WIND_RAMP: Ramp = [
  { stop: 0, rgb: [40, 68, 96] },
  { stop: 3, rgb: [58, 110, 140] },
  { stop: 7, rgb: [72, 150, 145] },
  { stop: 12, rgb: [140, 180, 90] },
  { stop: 18, rgb: [225, 195, 70] },
  { stop: 25, rgb: [225, 120, 55] },
  { stop: 33, rgb: [195, 55, 60] },
  { stop: 45, rgb: [150, 40, 130] },
];

// Extreme-risk index ramp (0-100).
export const RISK_RAMP: Ramp = [
  { stop: 0, rgb: [30, 40, 40] },
  { stop: 20, rgb: [45, 90, 90] },
  { stop: 40, rgb: [130, 150, 60] },
  { stop: 60, rgb: [220, 170, 40] },
  { stop: 80, rgb: [220, 90, 45] },
  { stop: 100, rgb: [180, 30, 60] },
];

export function colorFor(ramp: Ramp, value: number, alpha = 1): string {
  const [r, g, b] = interpolate(ramp, value);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function rgbaTuple(ramp: Ramp, value: number, alpha = 1): [number, number, number, number] {
  const [r, g, b] = interpolate(ramp, value);
  return [r, g, b, Math.round(alpha * 255)];
}

export const VARIABLE_UNITS: Record<string, string> = {
  temperature: '°C',
  precip: 'mm/24h',
  wind: 'm/s',
  risk: 'index',
};

export const VARIABLE_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  precip: 'Precipitation',
  wind: 'Wind Speed',
  risk: 'Extreme Risk',
};

export function rampFor(variable: string): Ramp {
  switch (variable) {
    case 'temperature':
      return TEMPERATURE_RAMP;
    case 'precip':
      return PRECIP_RAMP;
    case 'wind':
      return WIND_RAMP;
    case 'risk':
      return RISK_RAMP;
    default:
      return TEMPERATURE_RAMP;
  }
}
