// Minimal deterministic value-noise implementation (no external dependency).
// Produces smooth, layered pseudo-random fields suitable for synthetic
// meteorological data (temperature / precip / wind speed textures).

function hash2(x: number, y: number, seed: number): number {
  let h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  h = h - Math.floor(h);
  return h;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Single octave of smooth value noise on a lattice of given cell size. */
function valueNoise2D(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const tl = hash2(xi, yi, seed);
  const tr = hash2(xi + 1, yi, seed);
  const bl = hash2(xi, yi + 1, seed);
  const br = hash2(xi + 1, yi + 1, seed);

  const u = fade(xf);
  const v = fade(yf);

  const top = lerp(tl, tr, u);
  const bottom = lerp(bl, br, u);
  return lerp(top, bottom, v);
}

export interface FbmOptions {
  octaves?: number;
  lacunarity?: number;
  gain?: number;
  scale?: number;
  seed?: number;
}

/** Fractal Brownian Motion: layered octaves of value noise, output roughly in [-1, 1]. */
export function fbm(x: number, y: number, opts: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2.0, gain = 0.5, scale = 1, seed = 0 } = opts;
  let amplitude = 0.5;
  let frequency = scale;
  let sum = 0;
  let maxAmp = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise2D(x * frequency, y * frequency, seed + o * 17.13);
    sum += (n * 2 - 1) * amplitude;
    maxAmp += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum / maxAmp;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
