import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import type { ModeId } from '../../lib/fields';
import { sampleWind } from '../../lib/fields';

interface Particle {
  lat: number;
  lon: number;
  age: number;
  maxAge: number;
}

const NUM_PARTICLES = 900;

function randomDomainPoint(bounds: LatLngBounds): { lat: number; lon: number } {
  const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
  const lon = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
  return { lat, lon };
}

interface Props {
  mode: ModeId;
  active: boolean;
}

export default function WindParticleLayer({ mode, active }: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '450';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    function resize() {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    }
    resize();
    map.on('resize', resize);
    map.on('move', resize);
    map.on('zoom', resize);

    return () => {
      map.off('resize', resize);
      map.off('move', resize);
      map.off('zoom', resize);
      container.removeChild(canvas);
    };
  }, [map]);

  useEffect(() => {
    const bounds = map.getBounds();
    particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => ({
      ...randomDomainPoint(bounds),
      age: Math.random() * 60,
      maxAge: 60 + Math.random() * 60,
    }));
  }, [map]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    function step() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fade existing pixels toward transparent (not toward opaque black) so the
      // basemap and data overlay stay visible under the particle trails.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.86)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      const bounds = map.getBounds();
      const particles = particlesRef.current;

      for (const p of particles) {
        const { u, v } = sampleWind(p.lat, p.lon, modeRef.current);
        // Convert m/s to a screen-space step scaled by zoom; v is northward (screen up = -y)
        const metersPerDegLat = 111_000;
        const dtScale = 0.00000018 * Math.pow(2, map.getZoom());
        p.lat += v * dtScale;
        p.lon += (u * dtScale) / Math.cos((p.lat * Math.PI) / 180);
        p.age += 1;

        const point = map.latLngToContainerPoint([p.lat, p.lon]);
        const speed = Math.sqrt(u * u + v * v);
        const inBounds = bounds.contains([p.lat, p.lon]);

        if (p.age > p.maxAge || !inBounds || point.x < 0 || point.y < 0 || point.x > canvas.width || point.y > canvas.height) {
          const np = randomDomainPoint(bounds);
          p.lat = np.lat;
          p.lon = np.lon;
          p.age = 0;
          p.maxAge = 60 + Math.random() * 90;
          continue;
        }

        const alpha = Math.max(0, 1 - p.age / p.maxAge);
        const t = Math.min(1, speed / 20);
        const r = Math.round(150 + t * 90);
        const g = Math.round(200 - t * 90);
        const b = Math.round(230 - t * 120);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${0.75 * alpha})`;
        ctx.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
        void metersPerDegLat;
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, map]);

  return null;
}
