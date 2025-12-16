import { Routes, Route } from 'react-router-dom';
import ReportPage from './pages/ReportPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import ExtensionPopup from './pages/ExtensionPopup';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/popup" element={<ExtensionPopup />} />
    </Routes>
  );
}

export default App;