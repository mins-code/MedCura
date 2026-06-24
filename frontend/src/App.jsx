import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UploadReport from './pages/UploadReport';
import AnalysisPage from './pages/AnalysisPage';
import ResultsPage from './pages/ResultsPage';
import AnemiaTypePage from './pages/AnemiaTypePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadReport />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/anemia-type" element={<AnemiaTypePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
