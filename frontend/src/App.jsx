import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UploadReport from './pages/UploadReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadReport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
