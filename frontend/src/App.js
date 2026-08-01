import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import SponsorStatus from "./pages/SponsorStatus";
import SponsorChains from "./pages/SponsorChains";
import SharedCrawl from "./pages/SharedCrawl";
import Passport from "./pages/Passport";
import Wall from "./pages/Wall";
import Leaderboard from "./pages/Leaderboard";
import LegalPage from "./pages/LegalPage";
import Shop from "./pages/Shop";
import { Toaster } from "./components/ui/sonner";
import { LangProvider } from "./i18n/i18n";
import InstallHelper from "./components/InstallHelper";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <div className="App">
      <LangProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/c/:code" element={<SharedCrawl />} />
          <Route path="/p/:code" element={<Passport />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sponsor/success" element={<SponsorStatus />} />
          <Route path="/sponsor/cancelled" element={<SponsorStatus cancelled />} />
          <Route path="/sponsor/chains" element={<SponsorChains />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
      <InstallHelper />
      </LangProvider>
    </div>
  );
}

export default App;
