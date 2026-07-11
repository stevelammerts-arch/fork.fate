import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import SponsorStatus from "./pages/SponsorStatus";
import SharedCrawl from "./pages/SharedCrawl";
import LegalPage from "./pages/LegalPage";
import { Toaster } from "./components/ui/sonner";
import { LangProvider } from "./i18n/i18n";

function App() {
  return (
    <div className="App">
      <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/c/:code" element={<SharedCrawl />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sponsor/success" element={<SponsorStatus />} />
          <Route path="/sponsor/cancelled" element={<SponsorStatus cancelled />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
      </LangProvider>
    </div>
  );
}

export default App;
