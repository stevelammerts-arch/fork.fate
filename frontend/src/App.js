import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import SponsorStatus from "./pages/SponsorStatus";
import SponsorChains from "./pages/SponsorChains";
import SponsorKit from "./pages/SponsorKit";
import PressKit from "./pages/PressKit";
import RarePreview from "./pages/RarePreview";
import Rituals from "./pages/Rituals";
import Journal from "./pages/Journal";
import Secrets from "./pages/Secrets";
import Conquest from "./pages/Conquest";
import Duel from "./pages/Duel";
import Bingo from "./pages/Bingo";
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
  // Anonymous visitor beacon (once per browser session): feeds the Admin
  // "Where your visitors are" panel. Server hashes the IP and dedupes per 6h.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("ff_pv_sent") === "1") return;
      sessionStorage.setItem("ff_pv_sent", "1");
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stats/pageview`, { method: "POST", keepalive: true }).catch(() => {});
    } catch (e) { /* storage/fetch unavailable — non-critical */ }
  }, []);
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
          <Route path="/rituals" element={<Rituals />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/secrets" element={<Secrets />} />
          <Route path="/conquest" element={<Conquest />} />
          <Route path="/d/:code" element={<Duel />} />
          <Route path="/bingo" element={<Bingo />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sponsor/success" element={<SponsorStatus />} />
          <Route path="/sponsor/cancelled" element={<SponsorStatus cancelled />} />
          <Route path="/sponsor/chains" element={<SponsorChains />} />
          <Route path="/sponsors" element={<SponsorKit />} />
          <Route path="/press" element={<PressKit />} />
          <Route path="/dev/rare" element={<RarePreview />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
        </Routes>
      </BrowserRouter>
      {/* bottom placement keeps toasts clear of the home quick-tabs strip */}
      <Toaster position="bottom-center" richColors offset={20} mobileOffset={20} swipeDirections={["left", "right", "top", "bottom"]} />
      <InstallHelper />
      </LangProvider>
    </div>
  );
}

export default App;
