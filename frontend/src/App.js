import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import SponsorStatus from "./pages/SponsorStatus";
import SharedCrawl from "./pages/SharedCrawl";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/c/:code" element={<SharedCrawl />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sponsor/success" element={<SponsorStatus />} />
          <Route path="/sponsor/cancelled" element={<SponsorStatus cancelled />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
