import Header from './components/Header';
import KpiRow from './components/KpiRow';
import WeatherMap from './components/map/WeatherMap';
import SkillChart from './components/SkillChart';
import AlertsPanel from './components/AlertsPanel';
import PipelinePanel from './components/PipelinePanel';

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <KpiRow />
        <div className="app-grid">
          <div className="app-grid-map">
            <WeatherMap />
          </div>
          <div className="app-grid-side">
            <AlertsPanel />
            <PipelinePanel />
          </div>
        </div>
        <SkillChart />
      </main>
      <footer className="app-footer">
        Prototype for Smart India Hackathon 2026. All forecast values are synthetic and generated client-side for demonstration.
      </footer>
    </div>
  );
}
