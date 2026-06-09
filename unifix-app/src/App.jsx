import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Home from './pages/Home';
import GrievanceRedressal from './pages/GrievanceRedressal';
import CopyrightPolicy from './pages/CopyrightPolicy';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/grievance" element={<GrievanceRedressal />} />
        <Route path="/copyright" element={<CopyrightPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;