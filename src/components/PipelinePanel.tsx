import { useEffect, useState } from 'react';
import { Check, Loader2, Circle } from 'lucide-react';
import { PIPELINE_STEPS } from '../lib/mockData';
import { COLORS } from '../lib/theme';

const CYCLE_SECONDS = 21 * 60; // pretend the pipeline runs every 21 minutes

export default function PipelinePanel() {
  const [secondsLeft, setSecondsLeft] = useState(CYCLE_SECONDS - 137);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? CYCLE_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="panel pipeline-panel">
      <div className="panel-head panel-head-row">
        <div>
          <h3>Operational Pipeline</h3>
          <p className="panel-sub">Data pull &rarr; inference &rarr; publish</p>
        </div>
        <div className="pipeline-eta">
          <span className="pipeline-eta-label">Next run</span>
          <span className="pipeline-eta-value mono">{mm}:{ss}</span>
        </div>
      </div>
      <ol className="pipeline-steps">
        {PIPELINE_STEPS.map((s, i) => (
          <li className={`pipeline-step pipeline-step-${s.status}`} key={s.id}>
            <div className="pipeline-step-icon">
              {s.status === 'done' && <Check size={13} strokeWidth={2.4} color={COLORS.good} />}
              {s.status === 'running' && <Loader2 size={13} strokeWidth={2.4} className="spin" color={COLORS.accentInfo} />}
              {s.status === 'pending' && <Circle size={9} strokeWidth={2} color={COLORS.textMuted} />}
            </div>
            <div className="pipeline-step-body">
              <div className="pipeline-step-label">{s.label}</div>
              <div className="pipeline-step-detail">{s.detail}</div>
            </div>
            {s.status === 'running' && <div className="pipeline-step-eta mono">~{s.etaSec}s</div>}
            {i < PIPELINE_STEPS.length - 1 && <div className="pipeline-step-connector" />}
          </li>
        ))}
      </ol>
    </div>
  );
}
