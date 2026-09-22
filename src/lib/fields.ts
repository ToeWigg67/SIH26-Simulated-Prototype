// Synthetic-but-physically-plausible global meteorological field generator.
// Everything here is fake data built from smooth layered noise plus
// geography-shaped base functions, not random static — see noise.ts for the
// underlying fbm() primitive.
//
// Model of the story we want to tell:
//   - There is one hidden "truth" field per variable, defined for the whole
//     globe (latitude-band climatology + a handful of recognizable regional
//     features), with an extra India-specific detail layer that fades in
//     smoothly over the India / Bay of Bengal / Arabian Sea window (so the
//     regional demo detail has no hard edge).
//   - Each forecast SOURCE (HRES / ENS / AIFS) is the truth plus a
//     source-specific systematic bias/placement error and a source-specific
//     noise character (HRES = sharp + noisy, ENS = smooth/mean-like,
//     AIFS = smooth but displaced).
//   - BLENDED is the truth plus a much smaller residual — visibly closer to
//     the "real" structure than any individual source, which is the whole
//     product pitch.

import { fbm, clamp, smoothstep } from './noise';

export type ModeId = 'hres' | 'ens' | 'aifs' | 'blended';
export type VariableId = 'temperature' | 'wind' | 'precip' | 'risk';

// Full-globe domain (clamped shy of the poles, which Web Mercator can't show anyway).
export const DOMAIN_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
];

export const WORLD_CENTER: [number, number] = [20, 10];
export const INDIA_CENTER: [number, number] = [21.5, 80.5];

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Wrap a longitude into [-180, 180]. */
function wrapLon(lon: number): number {
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  if (l === -180) l = 180;
  return l;
}

// ---------------------------------------------------------------------------
// Seamless noise: ordinary fbm(x, y) is not periodic, so sampling it directly
// with x = lon produces a visible seam at +-180 deg. Instead we walk lon
// around a circle (cos/sin), which is exactly periodic, and use lat as the
// second axis; two independent samples (phase-shifted) are blended so the
// result still varies smoothly with lat instead of only rotating.
// ---------------------------------------------------------------------------
function seamlessFbm(lat: number, lon: number, scale: number, octaves: number, seed: number): number {
  const rad = deg2rad(lon);
  const radius = 55 * Math.max(scale, 0.05);
  const cx = Math.cos(rad) * radius;
  const cy = Math.sin(rad) * radius;
  const a = fbm(cx, lat * scale, { octaves, scale: 1, seed });
  const b = fbm(cy, lat * scale, { octaves, scale: 1, seed: seed + 500 });
  return a * 0.5 + b * 0.5;
}

// ---------------------------------------------------------------------------
// Geography shaping helpers (all inputs in degrees)
// ---------------------------------------------------------------------------

/** Smooth fade window: 1 inside the India/BoB/Arabian-Sea box, fading to 0 over ~8-10deg outside. */
function indiaWindow(lat: number, lon: number): number {
  const latW = smoothstep(4 - 9, 4, lat) * (1 - smoothstep(38, 38 + 9, lat));
  const lonW = smoothstep(62 - 10, 62, lon) * (1 - smoothstep(100, 100 + 10, lon));
  return clamp(latW * lonW, 0, 1);
}

/** Smooth "how far into the interior/Deccan plateau" weight, 0 at coasts, 1 inland. */
function deccanWeight(lat: number, lon: number): number {
  const latW = smoothstep(9, 15, lat) * (1 - smoothstep(21, 25, lat));
  const lonW = smoothstep(73, 76, lon) * (1 - smoothstep(79, 83, lon));
  return clamp(latW * lonW, 0, 1);
}

/** Himalayan fringe weight: high latitude band across the north of the India window. */
function himalayaWeight(lat: number, lon: number): number {
  const latW = smoothstep(27, 31, lat);
  const lonW = smoothstep(70, 74, lon) * (1 - smoothstep(93, 97, lon)) + 0.3 * smoothstep(74, 90, lon);
  return clamp(latW * Math.min(lonW, 1), 0, 1);
}

/** Thar desert weight (Rajasthan) — hot, dry. */
function tharWeight(lat: number, lon: number): number {
  const latW = smoothstep(24, 27, lat) * (1 - smoothstep(29, 32, lat));
  const lonW = smoothstep(69, 71, lon) * (1 - smoothstep(74, 77, lon));
  return clamp(latW * lonW, 0, 1);
}

/** Distance-based coastal proximity weight (rough, using two coastline rays), India only. */
function coastalWeight(lat: number, lon: number): number {
  const westCoastLon = 72.7 + 0.12 * (lat - 8);
  const distWest = Math.abs(lon - westCoastLon);
  const eastCoastLon = 80.2 + 0.32 * (lat - 8);
  const distEast = Math.abs(lon - eastCoastLon);
  const d = Math.min(distWest, distEast);
  return clamp(1 - smoothstep(0, 6, d), 0, 1);
}

/** Western Ghats orographic band (narrow strip just inland of the west coast). */
function westernGhatsWeight(lat: number, lon: number): number {
  const westCoastLon = 72.7 + 0.12 * (lat - 8);
  const d = lon - westCoastLon;
  const latOk = smoothstep(8, 11, lat) * (1 - smoothstep(19, 21.5, lat));
  return clamp(latOk * smoothstep(-0.3, 0.6, d) * (1 - smoothstep(1.6, 3, d)), 0, 1);
}

/** Sea mask for the Arabian Sea / Bay of Bengal (India-window only). */
function seaWeight(lat: number, lon: number): number {
  const westCoastLon = 72.7 + 0.12 * (lat - 8);
  const eastCoastLon = 80.2 + 0.32 * (lat - 8);
  const westSea = smoothstep(0, 4, westCoastLon - lon) * smoothstep(4, 34, lat) * (1 - smoothstep(24, 30, lat));
  const eastSea = smoothstep(0, 4, lon - eastCoastLon) * smoothstep(4, 23, lat) * (1 - smoothstep(21, 26, lat));
  const southernOcean = clamp(1 - smoothstep(8, 12, lat), 0, 1);
  return clamp(Math.max(westSea, eastSea, southernOcean * 0.6), 0, 1);
}

/** Rectangular geographic window helper with soft (smoothstep) edges, degrees margin. */
function boxWeight(lat: number, lon: number, latMin: number, latMax: number, lonMin: number, lonMax: number, margin: number): number {
  const latW = smoothstep(latMin - margin, latMin, lat) * (1 - smoothstep(latMax, latMax + margin, lat));
  const lonW = smoothstep(lonMin - margin, lonMin, lon) * (1 - smoothstep(lonMax, lonMax + margin, lon));
  return clamp(latW * lonW, 0, 1);
}

// Bay of Bengal cyclone center (matches the "High Wind – Bay of Bengal" alert).
export const CYCLONE_CENTER: [number, number] = [15.2, 88.5];

function greatCircleKm(lat: number, lon: number, centerLat: number, centerLon: number): number {
  const dLat = lat - centerLat;
  const dLon = wrapLon(lon - centerLon) * Math.cos(deg2rad(lat));
  return Math.sqrt(dLat * dLat + dLon * dLon) * 111;
}

function cycloneDistance(lat: number, lon: number): number {
  return greatCircleKm(lat, lon, CYCLONE_CENTER[0], CYCLONE_CENTER[1]);
}

/** A generic cyclonic vortex contribution to [u, v], counter-clockwise in the NH, clockwise in the SH. */
function vortexUV(lat: number, lon: number, centerLat: number, centerLon: number, peakSpeed: number, decayPerKm: number): [number, number] {
  const dLat = lat - centerLat;
  const dLon = wrapLon(lon - centerLon) * Math.cos(deg2rad(lat));
  const r = Math.sqrt(dLat * dLat + dLon * dLon) * 111 + 1e-6;
  const tangential = Math.max(0, peakSpeed - r * decayPerKm) / 3.6;
  const hemisphereSign = centerLat >= 0 ? 1 : -1;
  const tx = (-dLat / (r / 111)) * hemisphereSign;
  const ty = (dLon / (r / 111)) * hemisphereSign;
  const norm = Math.sqrt(tx * tx + ty * ty) + 1e-6;
  return [(ty / norm) * tangential, (tx / norm) * tangential];
}

// ---------------------------------------------------------------------------
// Mode error characteristics
// ---------------------------------------------------------------------------

interface ModeCharacter {
  noiseAmp: number; // amplitude of high-freq noise added on top of truth
  noiseOctaves: number;
  noiseScale: number;
  biasShiftKm: number; // spatial displacement of features (simulates placement error)
  biasShiftAngleDeg: number;
  smooth: number; // 0 = none, higher = more low-pass (blend truth with a smoothed version)
  seedOffset: number;
}

const MODE_CHARACTER: Record<ModeId, ModeCharacter> = {
  hres: { noiseAmp: 0.34, noiseOctaves: 5, noiseScale: 0.55, biasShiftKm: 18, biasShiftAngleDeg: 35, smooth: 0.05, seedOffset: 11 },
  ens: { noiseAmp: 0.14, noiseOctaves: 3, noiseScale: 0.35, biasShiftKm: 8, biasShiftAngleDeg: 120, smooth: 0.55, seedOffset: 47 },
  aifs: { noiseAmp: 0.2, noiseOctaves: 4, noiseScale: 0.45, biasShiftKm: 45, biasShiftAngleDeg: 260, smooth: 0.28, seedOffset: 83 },
  blended: { noiseAmp: 0.07, noiseOctaves: 5, noiseScale: 0.55, biasShiftKm: 3, biasShiftAngleDeg: 0, smooth: 0.08, seedOffset: 5 },
};

function shift(lat: number, lon: number, km: number, angleDeg: number): [number, number] {
  const angle = deg2rad(angleDeg);
  const dLat = (km * Math.cos(angle)) / 111;
  const dLon = (km * Math.sin(angle)) / (111 * Math.cos(deg2rad(lat)));
  return [clamp(lat + dLat, -85, 85), wrapLon(lon + dLon)];
}

// ---------------------------------------------------------------------------
// Global base fields
// ---------------------------------------------------------------------------

function globalBaseTemperature(lat: number): number {
  // Equator ~28C, poles ~ -32C, roughly symmetric with a small early-autumn
  // (late Sept) seasonal tilt: NH just past summer (slightly warmer),
  // SH just past winter (slightly cooler).
  const base = 28 - 0.0072 * lat * lat;
  const seasonalTilt = 3.5 * Math.sin(deg2rad(lat));
  return base + seasonalTilt;
}

function globalTemperatureFeatures(lat: number, lon: number): number {
  let d = 0;
  // Sahara / Arabian desert heat belt
  d += boxWeight(lat, lon, 16, 32, -12, 55, 15) * 9;
  // Siberian continental cold
  d -= boxWeight(lat, lon, 52, 72, 65, 155, 16) * 11;
  // Antarctic interior plateau (extra cold beyond the latitude term)
  d -= clamp(1 - smoothstep(-90, -75, lat), 0, 1) * 12;
  // Amazon / Congo tropical rainforest warmth
  d += boxWeight(lat, lon, -9, 4, -74, -52, 12) * 2.6;
  d += boxWeight(lat, lon, -4, 4, 12, 29, 12) * 2.4;
  // Mountain cooling bands (Andes, Rockies, Alps) — Himalaya handled by India layer
  d -= boxWeight(lat, lon, -35, -8, -75, -66, 8) * 10;
  d -= boxWeight(lat, lon, 35, 50, -120, -105, 8) * 7;
  d -= boxWeight(lat, lon, 44, 48, 5, 15, 6) * 7;
  // Australian interior heat
  d += boxWeight(lat, lon, -28, -20, 120, 142, 14) * 4;
  return d;
}

function indiaTemperatureDelta(lat: number, lon: number): number {
  let d = 0;
  d += deccanWeight(lat, lon) * 3.2;
  d += tharWeight(lat, lon) * 4.5;
  d -= himalayaWeight(lat, lon) * 22;
  d += coastalWeight(lat, lon) * 1.8 - 1.8;
  d += seaWeight(lat, lon) * 1.2;
  return d;
}

function globalBasePrecip(lat: number): number {
  // ITCZ equatorial band + a secondary mid-latitude storm-track bump, both hemispheres.
  const itcz = 90 * Math.exp(-Math.pow(lat / 6.5, 2));
  const stormTrackN = 24 * Math.exp(-Math.pow((lat - 48) / 13, 2));
  const stormTrackS = 24 * Math.exp(-Math.pow((lat + 50) / 13, 2));
  return 3 + itcz + stormTrackN + stormTrackS;
}

function globalPrecipFeatures(lat: number, lon: number): { mult: number; add: number } {
  let mult = 1;
  let add = 0;
  // Subtropical desert belts (suppress precip)
  const deserts: [number, number, number, number][] = [
    [15, 32, -15, 45], // Sahara + Arabian
    [-30, -20, 118, 145], // Australian outback
    [-29, -18, 15, 26], // Kalahari
    [-30, -18, -72, -68], // Atacama
    [20, 35, -115, -100], // SW USA / N Mexico
  ];
  for (const [latMin, latMax, lonMin, lonMax] of deserts) {
    mult -= boxWeight(lat, lon, latMin, latMax, lonMin, lonMax, 13) * 0.85;
  }
  mult = clamp(mult, 0.08, 1);
  // Tropical rainforest / monsoon Asia boosts
  add += boxWeight(lat, lon, -8, 5, -74, -52, 12) * 22; // Amazon
  add += boxWeight(lat, lon, -4, 4, 12, 29, 12) * 18; // Congo
  add += boxWeight(lat, lon, -8, 18, 95, 140, 14) * 20; // Maritime Continent / SE Asia
  return { mult, add };
}

function indiaPrecipDelta(lat: number, lon: number): number {
  let p = 0;
  p += westernGhatsWeight(lat, lon) * 62;
  const cd = cycloneDistance(lat, lon);
  p += Math.max(0, 90 - cd * 0.35) * smoothstep(400, 0, cd); // cyclone rain shield
  p += seaWeight(lat, lon) * 4;
  p -= deccanWeight(lat, lon) * 2.2;
  p -= tharWeight(lat, lon) * 2.4;
  const bobCoast = smoothstep(85, 89, lon) * (1 - smoothstep(93, 97, lon)) * smoothstep(15, 19, lat) * (1 - smoothstep(21, 24, lat));
  p += bobCoast * 26;
  return p;
}

/** Zonal (u) and meridional (v) prevailing-wind climatology by latitude band. */
function globalPrevailingWind(lat: number): [number, number] {
  const a = Math.abs(lat);
  const tradeW = 1 - smoothstep(10, 20, a);
  const polarW = smoothstep(60, 70, a);
  const westerlyW = clamp(1 - tradeW - polarW, 0, 1);
  const u = -4.5 * tradeW + 11 * westerlyW - 4 * polarW;
  const v = -2.2 * Math.sign(lat || 1) * (1 - smoothstep(0, 12, a));
  return [u, v];
}

// ---------------------------------------------------------------------------
// Truth fields (per variable), sampled at a given lat/lon
// ---------------------------------------------------------------------------

function truthTemperature(lat: number, lon: number, seed: number): number {
  let t = globalBaseTemperature(lat);
  t += globalTemperatureFeatures(lat, lon);
  t += indiaWindow(lat, lon) * indiaTemperatureDelta(lat, lon);
  const n = seamlessFbm(lat, lon, 0.35, 4, seed + 3);
  t += n * 2.6;
  return t;
}

function truthPrecip(lat: number, lon: number, seed: number): number {
  let p = globalBasePrecip(lat);
  const { mult, add } = globalPrecipFeatures(lat, lon);
  p = p * mult + add;
  p += indiaWindow(lat, lon) * indiaPrecipDelta(lat, lon);
  const n = seamlessFbm(lat, lon, 0.42, 5, seed + 9);
  p += Math.max(0, n) * 16;
  return Math.max(0, p);
}

/** Returns [u, v] wind components in m/s (u = eastward, v = northward). */
function truthWind(lat: number, lon: number, seed: number): [number, number] {
  let [u, v] = globalPrevailingWind(lat);

  // Bay of Bengal cyclonic circulation (matches the alert feed).
  const [cu, cv] = vortexUV(lat, lon, CYCLONE_CENTER[0], CYCLONE_CENTER[1], 145, 0.55);
  u += cu;
  v += cv;

  // A couple of extra vortices elsewhere for visual interest (weaker, decorative).
  const [pu1, pv1] = vortexUV(lat, lon, 25, -75, 95, 0.6); // Atlantic hurricane-belt-ish
  u += pu1;
  v += pv1;
  const [pu2, pv2] = vortexUV(lat, lon, -18, 155, 90, 0.65); // South Pacific
  u += pu2;
  v += pv2;

  // India monsoon-flow detail, faded in only near the India window.
  const monsoonWeight = indiaWindow(lat, lon) * seaWeight(lat, lon);
  u += monsoonWeight * 2.5;
  v += monsoonWeight * 2;

  const nU = seamlessFbm(lat, lon + 11, 0.45, 4, seed + 21);
  const nV = seamlessFbm(lat, lon - 11, 0.45, 4, seed + 34);
  u += nU * 2.2;
  v += nV * 2.2;

  // Land friction slows wind a bit over the India window's interior only
  // (the only place we have a land/sea mask defined).
  const landSlow = 1 - indiaWindow(lat, lon) * 0.28 * (1 - seaWeight(lat, lon));
  return [u * landSlow, v * landSlow];
}

// ---------------------------------------------------------------------------
// Public API: sample a variable for a given mode at lat/lon
// ---------------------------------------------------------------------------

export function sampleTemperature(lat: number, lon: number, mode: ModeId): number {
  const c = MODE_CHARACTER[mode];
  const [slat, slon] = shift(lat, lon, c.biasShiftKm, c.biasShiftAngleDeg);
  const raw = truthTemperature(slat, slon, c.seedOffset);
  const smoothed = truthTemperature(lat, lon, c.seedOffset + 100); // proxy low-pass sample
  const base = raw * (1 - c.smooth) + smoothed * c.smooth;
  const n = seamlessFbm(lat, lon, c.noiseScale, c.noiseOctaves, c.seedOffset + 200);
  return base + n * c.noiseAmp * 4.5;
}

export function samplePrecip(lat: number, lon: number, mode: ModeId): number {
  const c = MODE_CHARACTER[mode];
  const [slat, slon] = shift(lat, lon, c.biasShiftKm, c.biasShiftAngleDeg);
  const raw = truthPrecip(slat, slon, c.seedOffset);
  const smoothed = truthPrecip(lat, lon, c.seedOffset + 100);
  const base = raw * (1 - c.smooth) + smoothed * c.smooth;
  const n = seamlessFbm(lat, lon, c.noiseScale, c.noiseOctaves, c.seedOffset + 300);
  return Math.max(0, base + Math.max(0, n) * c.noiseAmp * 18);
}

export function sampleWind(lat: number, lon: number, mode: ModeId): { u: number; v: number; speed: number } {
  const c = MODE_CHARACTER[mode];
  const [slat, slon] = shift(lat, lon, c.biasShiftKm, c.biasShiftAngleDeg);
  const [ru, rv] = truthWind(slat, slon, c.seedOffset);
  const [su, sv] = truthWind(lat, lon, c.seedOffset + 100);
  const u = ru * (1 - c.smooth) + su * c.smooth;
  const v = rv * (1 - c.smooth) + sv * c.smooth;
  const nU = seamlessFbm(lat, lon + 7, c.noiseScale, c.noiseOctaves, c.seedOffset + 400);
  const nV = seamlessFbm(lat, lon - 7, c.noiseScale, c.noiseOctaves, c.seedOffset + 500);
  const fu = u + nU * c.noiseAmp * 3;
  const fv = v + nV * c.noiseAmp * 3;
  return { u: fu, v: fv, speed: Math.sqrt(fu * fu + fv * fv) };
}

/** Composite 0..100 extreme-risk index blending heavy precip, high wind, and heat. */
export function sampleRisk(lat: number, lon: number, mode: ModeId): number {
  const t = sampleTemperature(lat, lon, mode);
  const p = samplePrecip(lat, lon, mode);
  const w = sampleWind(lat, lon, mode).speed;
  const heat = smoothstep(34, 45, t) * 100;
  const rain = smoothstep(30, 110, p) * 100;
  const wind = smoothstep(12, 32, w) * 100;
  return clamp(Math.max(heat, rain, wind) * 0.75 + (heat + rain + wind) / 3 * 0.25, 0, 100);
}
