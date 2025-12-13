import { Routes, Route } from 'react-router-dom';
import ReportPage from './pages/ReportPage';
import LandingPage from './pages/LandingPage'; // We will move your old App code here

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/report" element={<ReportPage />} />
    </Routes>
  );
}

export default App;