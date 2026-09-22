import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}

export default function Header() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-header-title">{'Hybrid AI–NWP Forecast Blending'}</div>
        <div className="app-header-subtitle">SIH 2026 prototype for India-focused meteorological forecasting</div>
      </div>
      <div className="app-header-right">
        <div className="status-pill">
          <Radio size={12} strokeWidth={2} className="status-pill-icon" />
          Live
        </div>
        <div className="app-header-clock mono">{formatTimestamp(now)}</div>
      </div>
    </header>
  );
}
