import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PubCrawlDialog from "../components/PubCrawlDialog";
import { Skull } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SharedCrawl() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [crawl, setCrawl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/crawls/${code}`)
      .then(({ data }) => { if (alive) setCrawl(data); })
      .catch(() => { if (alive) setError("This crawl link is invalid or has expired."); });
    return () => { alive = false; };
  }, [code]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#0B0B0B] px-6 text-center text-white">
      {!crawl && !error && (
        <div className="flex flex-col items-center gap-3 text-[#A0A0A0]" data-testid="shared-crawl-loading">
          <Skull className="h-8 w-8 animate-pulse text-[#E01E26]" />
          <p className="font-serif text-xl">Summoning your crawl…</p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-4" data-testid="shared-crawl-error">
          <Skull className="h-10 w-10 text-[#E01E26]" />
          <p className="font-serif text-2xl">{error}</p>
          <button onClick={() => navigate("/")} data-testid="shared-crawl-home-button"
            className="rounded-full bg-[#E01E26] px-6 py-3 text-sm font-bold text-white hover:bg-[#FF2E38]">
            Deal your own fate
          </button>
        </div>
      )}
      {crawl && (
        <PubCrawlDialog
          open
          shared
          mode={crawl.mode}
          crawlLabel={crawl.label || ""}
          results={crawl.stops || []}
          onClose={() => navigate("/")}
        />
      )}
    </div>
  );
}
