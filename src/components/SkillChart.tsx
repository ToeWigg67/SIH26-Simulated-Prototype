import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { SKILL_DATA } from '../lib/mockData';
import { COLORS } from '../lib/theme';

const MUTED_MAE = '#5b6672';
const MUTED_RMSE = '#3d4650';
const OURS_MAE = COLORS.accent;
const OURS_RMSE = '#b98a2c';

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string; dataKey: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip mono">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span>{p.dataKey.toUpperCase()}</span>
          <span>{p.value.toFixed(2)}°C</span>
        </div>
      ))}
    </div>
  );
}

export default function SkillChart() {
  return (
    <div className="panel skill-panel">
      <div className="panel-head">
        <h3>Forecast Skill Comparison</h3>
        <p className="panel-sub">Mean absolute and RMS error for 2m temperature, 5-day India domain average</p>
      </div>
      <div className="skill-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={SKILL_DATA} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barGap={2}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number"
              tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: '"IBM Plex Mono", monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={false}
              domain={[0, 4]}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              tick={{ fill: COLORS.textSecondary, fontSize: 11.5 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="mae" name="mae" radius={[0, 2, 2, 0]} barSize={8}>
              {SKILL_DATA.map((d) => (
                <Cell key={d.key} fill={d.isOurs ? OURS_MAE : MUTED_MAE} />
              ))}
            </Bar>
            <Bar dataKey="rmse" name="rmse" radius={[0, 2, 2, 0]} barSize={8}>
              {SKILL_DATA.map((d) => (
                <Cell key={d.key} fill={d.isOurs ? OURS_RMSE : MUTED_RMSE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="skill-chart-legend">
        <span><i style={{ background: MUTED_MAE }} /> MAE</span>
        <span><i style={{ background: MUTED_RMSE }} /> RMSE</span>
        <span className="skill-chart-legend-ours"><i style={{ background: OURS_MAE }} /> U-Net Adaptive (ours)</span>
      </div>
    </div>
  );
}
